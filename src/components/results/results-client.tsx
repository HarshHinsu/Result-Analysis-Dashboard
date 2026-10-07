"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/types";
import {
  saveSemesterResultAction,
  deleteSemesterResultAction,
  getSubjectsForBranchAndSemester,
} from "@/server/actions/results";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  FileSpreadsheet,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  AlertTriangle,
  Calculator,
  UploadCloud,
} from "lucide-react";
import { formatNumber, getGradeBadgeColor, getStatusBadge, formatDate } from "@/lib/utils";
import { calculateSPI, DEFAULT_GRADE_POINTS } from "@/lib/calculations/analytics";

interface SemesterResultItem {
  id: string;
  studentId: string;
  student: {
    id: string;
    enrollmentNumber: string;
    fullName: string;
    seatNumber: string | null;
    branchId: string;
    branch: { id: string; code: string; name: string };
  };
  semesterId: string;
  semester: { id: string; number: number; name: string };
  academicYearId: string;
  academicYear: { id: string; name: string };
  seatNumber: string | null;
  declarationDate: string | null;
  currentBacklog: number;
  totalBacklog: number;
  spi: number;
  cpi: number;
  cgpa: number;
  resultStatus: string;
  subjectResults: Array<{
    id: string;
    subjectId: string;
    subject: { id: string; subjectCode: string; subjectName: string; credits: number };
    grade: string;
    eIndicator: string | null;
    mIndicator: string | null;
    iIndicator: string | null;
    vIndicator: string | null;
    isBacklog: boolean;
  }>;
}

interface ResultsClientProps {
  initialData: {
    results: SemesterResultItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  branches: Array<{ id: string; code: string; name: string }>;
  semesters: Array<{ id: string; number: number; name: string }>;
  academicYears: Array<{ id: string; name: string }>;
  students: Array<{ id: string; enrollmentNumber: string; fullName: string; branchId: string; seatNumber: string | null }>;
  userRole: UserRole;
  preselectedStudentId?: string;
}

export function ResultsClient({
  initialData,
  branches,
  semesters,
  academicYears,
  students,
  userRole,
  preselectedStudentId,
}: ResultsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedBranch, setSelectedBranch] = useState(searchParams.get("branchId") || "ALL");
  const [selectedSemester, setSelectedSemester] = useState(searchParams.get("semesterId") || "ALL");
  const [selectedAY, setSelectedAY] = useState(searchParams.get("academicYearId") || "ALL");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<SemesterResultItem | null>(null);

  // Form states
  const [studentId, setStudentId] = useState(preselectedStudentId || (students[0]?.id || ""));
  const [semesterId, setSemesterId] = useState(semesters[0]?.id || "");
  const [academicYearId, setAcademicYearId] = useState(academicYears[0]?.id || "");
  const [seatNumber, setSeatNumber] = useState("");
  const [declarationDate, setDeclarationDate] = useState(new Date().toISOString().split("T")[0]);
  const [spi, setSpi] = useState<number>(0);
  const [cpi, setCpi] = useState<number>(0);
  const [cgpa, setCgpa] = useState<number>(0);
  const [totalBacklog, setTotalBacklog] = useState<number>(0);

  // Dynamic subjects list for entry
  const [curriculumSubjects, setCurriculumSubjects] = useState<any[]>([]);
  const [subjectRows, setSubjectRows] = useState<
    Array<{
      subjectId: string;
      subjectCode: string;
      subjectName: string;
      credits: number;
      grade: string;
      eIndicator: string;
      mIndicator: string;
      iIndicator: string;
      vIndicator: string;
      isBacklog: boolean;
    }>
  >([]);

  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Update URL filters
  const applyFilters = (params: {
    search?: string;
    branchId?: string;
    semesterId?: string;
    academicYearId?: string;
    page?: number;
  }) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (params.search !== undefined) {
      if (params.search) current.set("search", params.search);
      else current.delete("search");
    }

    if (params.branchId !== undefined) {
      if (params.branchId && params.branchId !== "ALL") current.set("branchId", params.branchId);
      else current.delete("branchId");
    }

    if (params.semesterId !== undefined) {
      if (params.semesterId && params.semesterId !== "ALL") current.set("semesterId", params.semesterId);
      else current.delete("semesterId");
    }

    if (params.academicYearId !== undefined) {
      if (params.academicYearId && params.academicYearId !== "ALL") current.set("academicYearId", params.academicYearId);
      else current.delete("academicYearId");
    }

    if (params.page !== undefined) {
      current.set("page", String(params.page));
    } else {
      current.set("page", "1");
    }

    const searchStr = current.toString();
    router.push(`${pathname}${searchStr ? `?${searchStr}` : ""}`);
  };

  // When student or semester changes, reload available curriculum subjects
  useEffect(() => {
    if (!isDialogOpen || editingResult) return;
    const selectedStud = students.find((s) => s.id === studentId);
    if (selectedStud && semesterId) {
      setIsLoadingCurriculum(true);
      getSubjectsForBranchAndSemester(selectedStud.branchId, semesterId)
        .then((subs) => {
          setCurriculumSubjects(subs);
          setSubjectRows(
            subs.map((s) => ({
              subjectId: s.id,
              subjectCode: s.subjectCode,
              subjectName: s.subjectName,
              credits: s.credits,
              grade: "AA",
              eIndicator: "Y",
              mIndicator: "Y",
              iIndicator: "Y",
              vIndicator: "Y",
              isBacklog: false,
            }))
          );
        })
        .finally(() => setIsLoadingCurriculum(false));
    }
  }, [studentId, semesterId, isDialogOpen, editingResult, students]);

  // Recalculate preview SPI whenever subject rows change
  const computedSpi = calculateSPI(
    subjectRows.map((row) => ({
      credits: row.credits,
      gradePoint: DEFAULT_GRADE_POINTS[row.grade] ?? 0,
    }))
  );

  const calculatedBacklogs = subjectRows.filter(
    (row) => row.grade === "FF" || row.isBacklog
  ).length;

  const handleOpenAdd = () => {
    setEditingResult(null);
    const firstStudent = students[0];
    setStudentId(preselectedStudentId || firstStudent?.id || "");
    setSemesterId(semesters[0]?.id || "");
    setAcademicYearId(academicYears[0]?.id || "");
    setSeatNumber(firstStudent?.seatNumber || "");
    setDeclarationDate(new Date().toISOString().split("T")[0]);
    setSpi(9.0);
    setCpi(9.0);
    setCgpa(9.0);
    setTotalBacklog(0);
    setErrorMsg(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (res: SemesterResultItem) => {
    setEditingResult(res);
    setStudentId(res.studentId);
    setSemesterId(res.semesterId);
    setAcademicYearId(res.academicYearId);
    setSeatNumber(res.seatNumber || res.student.seatNumber || "");
    setDeclarationDate(res.declarationDate || "");
    setSpi(res.spi);
    setCpi(res.cpi);
    setCgpa(res.cgpa);
    setTotalBacklog(res.totalBacklog);
    setErrorMsg(null);

    setSubjectRows(
      res.subjectResults.map((sr) => ({
        subjectId: sr.subjectId,
        subjectCode: sr.subject.subjectCode,
        subjectName: sr.subject.subjectName,
        credits: sr.subject.credits,
        grade: sr.grade,
        eIndicator: sr.eIndicator || "",
        mIndicator: sr.mIndicator || "",
        iIndicator: sr.iIndicator || "",
        vIndicator: sr.vIndicator || "",
        isBacklog: sr.isBacklog,
      }))
    );

    setIsDialogOpen(true);
  };

  const handleGradeChange = (index: number, newGrade: string) => {
    const updated = [...subjectRows];
    updated[index].grade = newGrade;
    updated[index].isBacklog = newGrade === "FF";
    setSubjectRows(updated);
  };

  const handleIndicatorChange = (
    index: number,
    indicator: "eIndicator" | "mIndicator" | "iIndicator" | "vIndicator"
  ) => {
    const updated = [...subjectRows];
    updated[index][indicator] = updated[index][indicator] === "Y" ? "" : "Y";
    setSubjectRows(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (subjectRows.length === 0) {
      setErrorMsg("Please add at least one subject to this semester result.");
      return;
    }

    startTransition(async () => {
      const res = await saveSemesterResultAction(
        {
          studentId,
          semesterId,
          academicYearId,
          seatNumber: seatNumber.trim() || null,
          declarationDate: declarationDate || null,
          spi: spi || computedSpi,
          cpi: cpi || computedSpi,
          cgpa: cgpa || computedSpi,
          currentBacklog: calculatedBacklogs,
          totalBacklog,
          resultStatus: calculatedBacklogs > 0 ? "FAIL" : "PASS",
          isCalculated: true,
          subjectResults: subjectRows.map((r) => ({
            subjectId: r.subjectId,
            grade: r.grade,
            eIndicator: r.eIndicator,
            mIndicator: r.mIndicator,
            iIndicator: r.iIndicator,
            vIndicator: r.vIndicator,
            isBacklog: r.isBacklog,
          })),
        },
        editingResult?.id
      );

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsDialogOpen(false);
        toast({
          title: editingResult ? "Result Updated" : "Result Saved",
          description: "Semester examination results stored successfully.",
        });
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this semester result record? This action cannot be undone.")) {
      return;
    }

    startTransition(async () => {
      const res = await deleteSemesterResultAction(id);
      if (res.error) {
        toast({ variant: "destructive", title: "Deletion Failed", description: res.error });
      } else {
        toast({ title: "Result Deleted", description: "Semester result removed from system." });
        router.refresh();
      }
    });
  };

  const selectedStudent = students.find((s) => s.id === studentId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Academic Result Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter manual semester marks, configure GTU examination grades, and manage student evaluation records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/imports">
            <Button variant="outline" className="gap-2">
              <UploadCloud className="h-4 w-4 text-emerald-600" />
              Import Excel Results
            </Button>
          </Link>
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Enter Semester Result
          </Button>
        </div>
      </div>

      {/* Filter and Table Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student or enrollment..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-xs h-9"
                />
              </div>

              {/* Branch Filter */}
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  applyFilters({ branchId: e.target.value });
                }}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>

              {/* Semester Filter */}
              <select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  applyFilters({ semesterId: e.target.value });
                }}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Academic Year Filter */}
              <select
                value={selectedAY}
                onChange={(e) => {
                  setSelectedAY(e.target.value);
                  applyFilters({ academicYearId: e.target.value });
                }}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Academic Years</option>
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    AY {ay.name}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => applyFilters({ search })}
                className="text-xs h-9"
              >
                Apply Filters
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
              <div>
                Showing <span className="font-semibold text-foreground">{initialData.results.length}</span> results (Total: {initialData.total})
              </div>
              <div>Page {initialData.page} of {initialData.totalPages || 1}</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Enrollment No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-center">Semester</TableHead>
                <TableHead className="text-center">Academic Year</TableHead>
                <TableHead className="text-center font-bold">SPI</TableHead>
                <TableHead className="text-center font-bold">CPI</TableHead>
                <TableHead className="text-center font-bold">CGPA</TableHead>
                <TableHead className="text-center">Backlogs</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-36 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileSpreadsheet className="h-8 w-8 text-muted-foreground/50" />
                      <p>No semester results matching the filter criteria.</p>
                      <Button variant="outline" size="sm" onClick={handleOpenAdd} className="text-xs">
                        Enter New Result
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                initialData.results.map((res) => {
                  const status = getStatusBadge(res.resultStatus);
                  return (
                    <TableRow key={res.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono font-bold text-primary text-xs">
                        <Link href={`/students/${res.student.id}`} className="hover:underline">
                          {res.student.enrollmentNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium text-foreground text-xs">
                        <Link href={`/students/${res.student.id}`} className="hover:text-primary transition-colors">
                          {res.student.fullName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                          {res.student.branch.code}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold">
                        {res.semester.name}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {res.academicYear.name}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-xs text-primary">
                        {formatNumber(res.spi)}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-xs">
                        {formatNumber(res.cpi)}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-xs">
                        {formatNumber(res.cgpa)}
                      </TableCell>
                      <TableCell className="text-center">
                        {res.currentBacklog > 0 ? (
                          <span className="inline-flex items-center justify-center bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full text-xs">
                            {res.currentBacklog}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full text-xs">
                            0
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${status.className} text-[10px]`}>
                          {res.resultStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/students/${res.student.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" title="View Profile">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(res)}
                            className="h-8 gap-1 text-xs"
                            title="Edit Result"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(res.id)}
                            className="h-8 gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            title="Delete Result"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {initialData.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-xs text-muted-foreground">
              Showing page {initialData.page} of {initialData.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyFilters({ page: initialData.page - 1 })}
                disabled={initialData.page <= 1}
                className="h-8 gap-1 text-xs"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyFilters({ page: initialData.page + 1 })}
                disabled={initialData.page >= initialData.totalPages}
                className="h-8 gap-1 text-xs"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Manual Result Entry & Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingResult ? "Edit Semester Examination Result" : "Manual Semester Result Entry"}</DialogTitle>
            <DialogDescription className="text-xs">
              Assign subject grades, evaluation indicators (E, M, I, V), and examination metadata.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 text-xs rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Student & Semester Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/40 p-3 rounded-lg border">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Select Student</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={!!editingResult}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.enrollmentNumber} - {s.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Semester</label>
                <select
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  disabled={!!editingResult}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                >
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Academic Year</label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  disabled={!!editingResult}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject Grade Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Subject Grades & Component Indicators
                </h4>
                {isLoadingCurriculum && <span className="text-xs text-muted-foreground animate-pulse">Loading curriculum...</span>}
              </div>

              {subjectRows.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border rounded-lg bg-muted/20">
                  No subjects found for this branch and semester. Please configure subjects in Curriculum settings or select another term.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/60">
                        <TableHead className="w-[100px] text-xs">Code</TableHead>
                        <TableHead className="text-xs">Subject Title</TableHead>
                        <TableHead className="text-center text-xs">Credits</TableHead>
                        <TableHead className="text-center text-xs w-[90px]">Grade</TableHead>
                        <TableHead className="text-center text-xs w-[40px]" title="Theory External">E</TableHead>
                        <TableHead className="text-center text-xs w-[40px]" title="Theory Mid-Sem">M</TableHead>
                        <TableHead className="text-center text-xs w-[40px]" title="Practical Internal">I</TableHead>
                        <TableHead className="text-center text-xs w-[40px]" title="Practical Viva">V</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectRows.map((row, idx) => (
                        <TableRow key={row.subjectId}>
                          <TableCell className="font-mono font-bold text-xs text-primary">
                            {row.subjectCode}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {row.subjectName}
                          </TableCell>
                          <TableCell className="text-center text-xs font-mono">
                            {row.credits.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center">
                            <select
                              value={row.grade}
                              onChange={(e) => handleGradeChange(idx, e.target.value)}
                              className="h-7 w-full rounded border border-input bg-transparent px-1 text-xs font-bold text-center"
                            >
                              {["AA", "AB", "BB", "BC", "CC", "CD", "DD", "FF"].map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={row.eIndicator === "Y"}
                              onChange={() => handleIndicatorChange(idx, "eIndicator")}
                              className="h-3.5 w-3.5 rounded"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={row.mIndicator === "Y"}
                              onChange={() => handleIndicatorChange(idx, "mIndicator")}
                              className="h-3.5 w-3.5 rounded"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={row.iIndicator === "Y"}
                              onChange={() => handleIndicatorChange(idx, "iIndicator")}
                              className="h-3.5 w-3.5 rounded"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={row.vIndicator === "Y"}
                              onChange={() => handleIndicatorChange(idx, "vIndicator")}
                              className="h-3.5 w-3.5 rounded"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Calculations & Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-lg border">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Calculator className="h-3 w-3 text-primary" />
                  Calculated SPI
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={spi || computedSpi}
                  onChange={(e) => setSpi(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs font-bold font-mono"
                  required
                />
                <span className="text-[10px] text-muted-foreground">Computed: {computedSpi.toFixed(2)}</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Cumulative CPI</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cpi || computedSpi}
                  onChange={(e) => setCpi(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs font-bold font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">CGPA</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpa || computedSpi}
                  onChange={(e) => setCgpa(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs font-bold font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Current Backlogs</label>
                <div className="h-8 flex items-center px-3 rounded-md bg-background border font-mono font-bold text-xs">
                  {calculatedBacklogs > 0 ? (
                    <span className="text-rose-600">{calculatedBacklogs} (FAIL)</span>
                  ) : (
                    <span className="text-emerald-600">0 (PASS)</span>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || subjectRows.length === 0}>
                {isPending ? "Saving..." : editingResult ? "Update Result" : "Save Semester Result"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
