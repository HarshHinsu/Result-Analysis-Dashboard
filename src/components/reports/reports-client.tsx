"use client";

import { useState } from "react";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  FileText,
  Download,
  GraduationCap,
  TrendingUp,
  GitBranch,
  BookOpen,
  CheckCircle2,
  Printer,
  Sparkles,
} from "lucide-react";
import {
  generateStudentTranscriptPdf,
  generateSemesterReportPdf,
} from "@/lib/reports/pdf-generator";

interface ReportsClientProps {
  branches: Array<{ id: string; code: string; name: string }>;
  semesters: Array<{ id: string; number: number; name: string }>;
  academicYears: Array<{ id: string; name: string }>;
  students: any[];
  analyticsData: any;
  userRole: UserRole;
}

export function ReportsClient({
  branches,
  semesters,
  academicYears,
  students,
  analyticsData,
  userRole,
}: ReportsClientProps) {
  const { toast } = useToast();

  const [selectedReport, setSelectedReport] = useState<
    "student" | "semester" | "branch" | "executive"
  >("student");

  // Selection states
  const [studentId, setStudentId] = useState(students[0]?.id || "");
  const [semesterId, setSemesterId] = useState(semesters[0]?.id || "");
  const [branchId, setBranchId] = useState(branches[0]?.id || "");
  const [academicYearId, setAcademicYearId] = useState(academicYears[0]?.id || "");

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    try {
      if (selectedReport === "student") {
        const student = students.find((s) => s.id === studentId);
        if (!student) {
          toast({ variant: "destructive", title: "Error", description: "Selected student not found." });
          return;
        }
        const doc = generateStudentTranscriptPdf(student);
        doc.save(`TRANSCRIPT_${student.enrollmentNumber}_${student.fullName.replace(/\s+/g, '_')}.pdf`);
        toast({ title: "Report Downloaded", description: `Official transcript generated for ${student.fullName}.` });
      } else if (selectedReport === "semester") {
        const sem = semesters.find((s) => s.id === semesterId);
        const ay = academicYears.find((a) => a.id === academicYearId);
        const branch = branches.find((b) => b.id === branchId);

        // Filter results for this semester and branch
        const filteredResults: any[] = [];
        students.forEach((stud) => {
          if (stud.branchId === branchId || branchId === "ALL") {
            stud.semesterResults.forEach((sr: any) => {
              if (sr.semesterId === semesterId && sr.academicYearId === academicYearId) {
                filteredResults.push({
                  ...sr,
                  student: stud,
                });
              }
            });
          }
        });

        if (filteredResults.length === 0) {
          toast({ variant: "destructive", title: "No Records Found", description: "No semester results found for the selected combination." });
          return;
        }

        const doc = generateSemesterReportPdf(
          sem?.name || "Semester",
          ay?.name || "2023-2024",
          branch?.name || "All Branches",
          filteredResults
        );
        doc.save(`SEMESTER_REPORT_${sem?.name?.replace(/\s+/g, '_')}_${ay?.name}.pdf`);
        toast({ title: "Report Downloaded", description: "Semester master sheet exported successfully." });
      } else if (selectedReport === "branch") {
        // Generate branch summary PDF
        const branch = branches.find((b) => b.id === branchId);
        const sem = semesters.find((s) => s.id === semesterId);
        const ay = academicYears.find((a) => a.id === academicYearId);

        const filteredResults: any[] = [];
        students.forEach((stud) => {
          if (stud.branchId === branchId) {
            stud.semesterResults.forEach((sr: any) => {
              filteredResults.push({ ...sr, student: stud });
            });
          }
        });

        const doc = generateSemesterReportPdf(
          "All Semesters",
          ay?.name || "2023-2024",
          branch?.name || "Department",
          filteredResults
        );
        doc.save(`BRANCH_REPORT_${branch?.code}_${ay?.name}.pdf`);
        toast({ title: "Branch Report Downloaded", description: `Consolidated performance report generated for ${branch?.name}.` });
      } else if (selectedReport === "executive") {
        const allResults = students.flatMap((s) => s.semesterResults.map((sr: any) => ({ ...sr, student: s })));
        const doc = generateSemesterReportPdf(
          "Executive Institutional Overview",
          "2023-2024",
          "All Engineering Branches",
          allResults
        );
        doc.save(`EXECUTIVE_SUMMARY_REPORT_2023-2024.pdf`);
        toast({ title: "Executive Report Downloaded", description: "College overview summary generated." });
      }
    } catch (e: any) {
      console.error("PDF Generation error:", e);
      toast({ variant: "destructive", title: "Generation Error", description: e.message || "Failed to generate report." });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Official Report Generation Suite
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate printable, high-resolution PDF academic transcripts, semester master sheets, and department analytics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Report Types Selection */}
        <div className="space-y-3 md:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            1. Select Report Category
          </h3>

          <Card
            onClick={() => setSelectedReport("student")}
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              selectedReport === "student" ? "border-primary ring-1 ring-primary bg-primary/5 shadow-sm" : ""
            }`}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-foreground">Student Result Card / Transcript</h4>
                <p className="text-xs text-muted-foreground">
                  Individual student semester-by-semester grades, E/M/I/V indicators, SPI/CPI, and backlogs.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => setSelectedReport("semester")}
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              selectedReport === "semester" ? "border-primary ring-1 ring-primary bg-primary/5 shadow-sm" : ""
            }`}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-foreground">Semester Consolidated Sheet</h4>
                <p className="text-xs text-muted-foreground">
                  Tabular master sheet of all students in a semester with ranks, SPI/CPI, and pass/fail summary.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => setSelectedReport("branch")}
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              selectedReport === "branch" ? "border-primary ring-1 ring-primary bg-primary/5 shadow-sm" : ""
            }`}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <GitBranch className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-foreground">Branch Performance Report</h4>
                <p className="text-xs text-muted-foreground">
                  Department-level comparison, pass percentages, active backlog count, and subject breakdown.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => setSelectedReport("executive")}
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              selectedReport === "executive" ? "border-primary ring-1 ring-primary bg-primary/5 shadow-sm" : ""
            }`}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-foreground">Executive Analytics Summary</h4>
                <p className="text-xs text-muted-foreground">
                  High-level institutional overview document for Principal and Examination Committee.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Parameters & Export */}
        <div className="space-y-4 md:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            2. Configure Report Parameters & Export
          </h3>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">
                {selectedReport === "student" && "Select Student for Academic Transcript"}
                {selectedReport === "semester" && "Select Semester & Department Scope"}
                {selectedReport === "branch" && "Select Engineering Discipline"}
                {selectedReport === "executive" && "Select Academic Year Scope"}
              </CardTitle>
              <CardDescription className="text-xs">
                Generated PDF documents are formatted for standard A4 printing and archiving.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Student Report Parameters */}
              {selectedReport === "student" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Select Student</label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.enrollmentNumber} - {s.fullName} ({s.branch.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Semester Report Parameters */}
              {selectedReport === "semester" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Semester</label>
                    <select
                      value={semesterId}
                      onChange={(e) => setSemesterId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {semesters.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Branch</label>
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code} - {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Academic Year</label>
                    <select
                      value={academicYearId}
                      onChange={(e) => setAcademicYearId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {academicYears.map((ay) => (
                        <option key={ay.id} value={ay.id}>
                          AY {ay.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Branch Report Parameters */}
              {selectedReport === "branch" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Select Branch</label>
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code} - {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Academic Year</label>
                    <select
                      value={academicYearId}
                      onChange={(e) => setAcademicYearId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {academicYears.map((ay) => (
                        <option key={ay.id} value={ay.id}>
                          AY {ay.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Executive Overview Parameters */}
              {selectedReport === "executive" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Academic Year</label>
                  <select
                    value={academicYearId}
                    onChange={(e) => setAcademicYearId(e.target.value)}
                    className="w-full sm:w-1/2 h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        AY {ay.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Report Preview Notice */}
              <div className="p-4 rounded-lg bg-muted/40 border text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Printer className="h-4 w-4 text-primary" />
                  PDF Export Specifications
                </div>
                <p className="text-muted-foreground">
                  The generated report includes official institution headers, computer-generated watermarks, GTU component indicators (E, M, I, V), and student indexes (SPI, CPI, CGPA).
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                <Download className="h-4 w-4" />
                {isGenerating ? "Rendering PDF Document..." : "Generate & Download PDF Report"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
