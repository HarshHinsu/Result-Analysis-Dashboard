"use client";

import { useState, useTransition, useRef } from "react";
import { UserRole, ColumnMappingConfig, ImportValidationSummary } from "@/types";
import {
  parseExcelBuffer,
  autoDetectColumnMapping,
  validateExcelRows,
  generateSampleExcelWorkbook,
} from "@/lib/imports/excel-validator";
import { executeExcelImportAction } from "@/server/actions/imports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  FileCheck,
  History,
  Info,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ImportsClientProps {
  initialHistory: any[];
  branches: Array<{ id: string; code: string; name: string }>;
  subjects: Array<{ id: string; subjectCode: string }>;
  userRole: UserRole;
}

export function ImportsClient({
  initialHistory,
  branches,
  subjects,
  userRole,
}: ImportsClientProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("wizard");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Uploaded File state
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);

  // Mapping state
  const [mapping, setMapping] = useState<ColumnMappingConfig>({
    studentName: "",
    enrollmentNumber: "",
    seatNumber: "",
    branch: "",
    semester: "",
    academicYear: "",
    subjectCode: "",
    grade: "",
    eIndicator: "",
    mIndicator: "",
    iIndicator: "",
    vIndicator: "",
    spi: "",
    cpi: "",
    cgpa: "",
    currentBacklog: "",
    totalBacklog: "",
    declarationDate: "",
  });

  // Validation report state
  const [validationReport, setValidationReport] = useState<ImportValidationSummary | null>(null);
  const [importSummary, setImportSummary] = useState<{ imported: number; failed: number } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 1. Download Sample Excel Template
  const handleDownloadTemplate = () => {
    try {
      const buffer = generateSampleExcelWorkbook();
      const blob = new Blob([buffer as any], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "GTU_Result_Import_Template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Template Downloaded", description: "GTU sample spreadsheet template saved." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate template." });
    }
  };

  // 2. Process File on Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setErrorMessage(null);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const { headers: detectedHeaders, rows } = parseExcelBuffer(buffer);

      setFile(selectedFile);
      setHeaders(detectedHeaders);
      setRawRows(rows);

      // Auto detect mappings
      const detectedMapping = autoDetectColumnMapping(detectedHeaders);
      setMapping(detectedMapping);

      setStep(2);
      toast({
        title: "File Loaded",
        description: `Parsed ${rows.length} rows and ${detectedHeaders.length} columns from ${selectedFile.name}`,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse Excel file.");
    }
  };

  // 3. Run Validation
  const handleProceedToValidation = () => {
    if (!mapping.studentName || !mapping.enrollmentNumber || !mapping.branch || !mapping.semester || !mapping.subjectCode || !mapping.grade) {
      setErrorMessage("Please map all mandatory fields: Student Name, Enrollment Number, Branch, Semester, Subject Code, and Grade.");
      return;
    }

    setErrorMessage(null);
    try {
      const report = validateExcelRows(rawRows, mapping, branches, subjects);
      setValidationReport(report);
      setStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || "Validation failed.");
    }
  };

  // 4. Execute Import
  const handleExecuteImport = () => {
    if (!validationReport || validationReport.validRows === 0) {
      setErrorMessage("Cannot import: 0 valid rows found in validation.");
      return;
    }

    const validRecords = validationReport.parsedRecords
      .filter((r) => r.isValid)
      .map((r) => r.data);

    startTransition(async () => {
      const res = await executeExcelImportAction({
        records: validRecords,
        fileName: file?.name || "import.xlsx",
        fileSize: file?.size || 0,
        notes: `Imported ${validRecords.length} validated GTU result records.`,
      });

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setImportSummary({
          imported: res.importedCount || 0,
          failed: res.failedCount || 0,
        });
        setStep(4);
        toast({
          title: "Import Completed",
          description: `Successfully stored ${res.importedCount} academic records into database.`,
        });
      }
    });
  };

  // Reset Wizard
  const handleReset = () => {
    setFile(null);
    setHeaders([]);
    setRawRows([]);
    setValidationReport(null);
    setImportSummary(null);
    setErrorMessage(null);
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-primary" />
            Excel Result Import Engine
          </h1>
          <p className="text-sm text-muted-foreground">
            Bulk ingest GTU / Diploma examination results with smart column mapping, schema validation, and audit tracking.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2">
          <Download className="h-4 w-4 text-primary" />
          Download Sample Excel Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full sm:w-[400px]">
          <TabsTrigger value="wizard" className="gap-2 text-xs">
            <FileSpreadsheet className="h-4 w-4" />
            Import Wizard
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 text-xs">
            <History className="h-4 w-4" />
            Import History
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Wizard */}
        <TabsContent value="wizard" className="space-y-6">
          {/* Wizard Step Progress Indicator */}
          <div className="grid grid-cols-4 gap-2 bg-muted/40 p-2 rounded-xl border text-xs">
            <div className={`p-2 rounded-lg text-center font-semibold ${step >= 1 ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>
              1. Upload File
            </div>
            <div className={`p-2 rounded-lg text-center font-semibold ${step >= 2 ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>
              2. Column Mapping
            </div>
            <div className={`p-2 rounded-lg text-center font-semibold ${step >= 3 ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>
              3. Validation Report
            </div>
            <div className={`p-2 rounded-lg text-center font-semibold ${step === 4 ? "bg-emerald-600 text-white shadow" : "text-muted-foreground"}`}>
              4. Import Summary
            </div>
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">Import Issue</AlertTitle>
              <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* STEP 1: FILE UPLOAD */}
          {step === 1 && (
            <Card className="border-dashed border-2">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">Select or Drag & Drop Result Spreadsheet</CardTitle>
                <CardDescription className="text-xs">
                  Supports .xlsx and .xls workbooks formatted with GTU student result columns.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <UploadCloud className="h-10 w-10" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-foreground">Click below or drag your file here</p>
                  <p className="text-xs text-muted-foreground">Maximum supported size: 10MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excelUpload"
                />
                <label htmlFor="excelUpload">
                  <Button type="button" className="cursor-pointer gap-2" asChild>
                    <span>
                      <FileSpreadsheet className="h-4 w-4" />
                      Choose Excel File
                    </span>
                  </Button>
                </label>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 2 && file && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Map Spreadsheet Headers to System Fields</CardTitle>
                    <CardDescription className="text-xs">
                      File: <span className="font-semibold text-foreground">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB, {rawRows.length} data rows)
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-xs">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Student Name */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      Student Full Name <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={mapping.studentName}
                      onChange={(e) => setMapping({ ...mapping, studentName: e.target.value })}
                      className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="">(Select Column)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Enrollment Number */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      Enrollment Number <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={mapping.enrollmentNumber}
                      onChange={(e) => setMapping({ ...mapping, enrollmentNumber: e.target.value })}
                      className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="">(Select Column)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Seat Number */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <label className="text-xs font-semibold text-foreground">Exam Seat Number</label>
                    <select
                      value={mapping.seatNumber || ""}
                      onChange={(e) => setMapping({ ...mapping, seatNumber: e.target.value })}
                      className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="">(Optional Column)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Branch */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      Branch / Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={mapping.branch}
                      onChange={(e) => setMapping({ ...mapping, branch: e.target.value })}
                      className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="">(Select Column)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Semester */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      Semester (1-6) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={mapping.semester}
                      onChange={(e) => setMapping({ ...mapping, semester: e.target.value })}
                      className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="">(Select Column)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Code */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      Subject Code <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={mapping.subjectCode}
                      onChange={(e) => setMapping({ ...mapping, subjectCode: e.target.value })}
                      className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="">(Select Column)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Grade */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      Grade (AA..FF) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={mapping.grade}
                      onChange={(e) => setMapping({ ...mapping, grade: e.target.value })}
                      className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="">(Select Column)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Indicators E, M, I, V */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <label className="text-xs font-semibold text-foreground">E Indicator (External)</label>
                    <select
                      value={mapping.eIndicator || ""}
                      onChange={(e) => setMapping({ ...mapping, eIndicator: e.target.value })}
                      className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="">(Optional Column)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <label className="text-xs font-semibold text-foreground">M Indicator (Mid Sem)</label>
                    <select
                      value={mapping.mIndicator || ""}
                      onChange={(e) => setMapping({ ...mapping, mIndicator: e.target.value })}
                      className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="">(Optional Column)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* SPI / CPI / CGPA */}
                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <label className="text-xs font-semibold text-foreground">SPI Official Score</label>
                    <select
                      value={mapping.spi || ""}
                      onChange={(e) => setMapping({ ...mapping, spi: e.target.value })}
                      className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="">(Optional Column)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <label className="text-xs font-semibold text-foreground">CPI Cumulative Score</label>
                    <select
                      value={mapping.cpi || ""}
                      onChange={(e) => setMapping({ ...mapping, cpi: e.target.value })}
                      className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="">(Optional Column)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                    <label className="text-xs font-semibold text-foreground">Current Backlog Count</label>
                    <select
                      value={mapping.currentBacklog || ""}
                      onChange={(e) => setMapping({ ...mapping, currentBacklog: e.target.value })}
                      className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="">(Optional Column)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Back
                </Button>
                <Button size="sm" onClick={handleProceedToValidation} className="gap-2">
                  Validate Spreadsheet Data
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* STEP 3: VALIDATION REPORT */}
          {step === 3 && validationReport && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">Spreadsheet Validation Report</CardTitle>
                    <CardDescription className="text-xs">
                      Detailed integrity verification before committing records to the database.
                    </CardDescription>
                  </div>

                  {/* Badges Summary */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs px-2.5 py-1 rounded-full font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {validationReport.validRows} Valid
                    </span>
                    {validationReport.warningRows > 0 && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-xs px-2.5 py-1 rounded-full font-bold">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        {validationReport.warningRows} Warnings
                      </span>
                    )}
                    {validationReport.invalidRows > 0 && (
                      <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 text-xs px-2.5 py-1 rounded-full font-bold">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                        {validationReport.invalidRows} Errors
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {validationReport.invalidRows > 0 && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-lg text-xs space-y-1">
                    <p className="font-bold text-rose-800 dark:text-rose-300">Invalid Rows Detected:</p>
                    <ul className="list-disc pl-5 text-rose-700 dark:text-rose-200 space-y-0.5 max-h-32 overflow-y-auto">
                      {validationReport.errors.map((err, i) => (
                        <li key={i}>
                          Row {err.rowNumber}: {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sample Parsed Rows Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[60px] text-xs">Row</TableHead>
                        <TableHead className="text-xs">Student Name</TableHead>
                        <TableHead className="text-xs">Enrollment</TableHead>
                        <TableHead className="text-xs">Branch</TableHead>
                        <TableHead className="text-xs text-center">Sem</TableHead>
                        <TableHead className="text-xs">Subject</TableHead>
                        <TableHead className="text-xs text-center">Grade</TableHead>
                        <TableHead className="text-xs text-center">SPI</TableHead>
                        <TableHead className="text-xs text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationReport.parsedRecords.slice(0, 10).map((r) => (
                        <TableRow key={r.rowNumber}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{r.rowNumber}</TableCell>
                          <TableCell className="text-xs font-medium">{r.data.studentName}</TableCell>
                          <TableCell className="font-mono text-xs">{r.data.enrollmentNumber}</TableCell>
                          <TableCell className="text-xs font-semibold">{r.data.branchCode}</TableCell>
                          <TableCell className="text-xs text-center">{r.data.semesterNumber}</TableCell>
                          <TableCell className="font-mono text-xs">{r.data.subjectCode}</TableCell>
                          <TableCell className="text-xs text-center font-bold">{r.data.grade}</TableCell>
                          <TableCell className="text-xs text-center font-mono">{r.data.spi ?? "-"}</TableCell>
                          <TableCell className="text-center">
                            {r.isValid ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950 font-bold px-2 py-0.5 rounded border border-emerald-200">
                                VALID
                              </span>
                            ) : (
                              <span className="text-[10px] text-rose-700 bg-rose-50 dark:bg-rose-950 font-bold px-2 py-0.5 rounded border border-rose-200">
                                ERROR
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {validationReport.parsedRecords.length > 10 && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    Showing first 10 rows of {validationReport.parsedRecords.length} total rows.
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Adjust Mapping
                </Button>
                <Button
                  size="sm"
                  onClick={handleExecuteImport}
                  disabled={isPending || validationReport.validRows === 0}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <FileCheck className="h-4 w-4" />
                  {isPending ? "Executing Import..." : `Import ${validationReport.validRows} Valid Rows`}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* STEP 4: IMPORT SUMMARY */}
          {step === 4 && importSummary && (
            <Card className="border-emerald-500/50 bg-emerald-50/10">
              <CardHeader className="text-center">
                <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl text-emerald-900 dark:text-emerald-200">
                  Data Ingestion Successful!
                </CardTitle>
                <CardDescription className="text-xs">
                  Academic results have been committed to the database and indexed for analytics.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-w-md mx-auto space-y-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-card border">
                    <span className="text-xs text-muted-foreground uppercase font-semibold block">Imported Records</span>
                    <span className="text-2xl font-bold text-emerald-600 font-mono">{importSummary.imported}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-card border">
                    <span className="text-xs text-muted-foreground uppercase font-semibold block">Failed Records</span>
                    <span className="text-2xl font-bold text-foreground font-mono">{importSummary.failed}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center gap-3 border-t pt-4">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Import Another File
                </Button>
                <Button size="sm" asChild>
                  <a href="/analytics">View Updated Analytics</a>
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: History */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Historical Import Logs</CardTitle>
              <CardDescription className="text-xs">
                Audit record of spreadsheet batch uploads and ingestion summaries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead className="text-center">Total Rows</TableHead>
                    <TableHead className="text-center">Imported</TableHead>
                    <TableHead className="text-center">Failed</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No import history recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialHistory.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium text-xs text-foreground flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-primary" />
                          <span>{job.fileName}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {job.uploadedBy ? job.uploadedBy.name : "System / Batch"}
                        </TableCell>
                        <TableCell className="text-xs text-center font-mono">{job.totalRows}</TableCell>
                        <TableCell className="text-xs text-center font-mono font-bold text-emerald-600">
                          {job.importedRows}
                        </TableCell>
                        <TableCell className="text-xs text-center font-mono font-bold text-rose-600">
                          {job.failedRows}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              job.status === "COMPLETED"
                                ? "success"
                                : job.status === "FAILED"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(job.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
