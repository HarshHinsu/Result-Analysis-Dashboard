"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/types";
import { createStudentAction, updateStudentAction } from "@/server/actions/students";
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
  GraduationCap,
  Plus,
  Search,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface StudentItem {
  id: string;
  enrollmentNumber: string;
  seatNumber: string | null;
  fullName: string;
  branchId: string;
  branch: {
    id: string;
    code: string;
    name: string;
  };
  batch: string | null;
  admissionYear: number;
  active: boolean;
  semesterResults?: Array<{
    id: string;
    spi: number;
    cpi: number;
    currentBacklog: number;
    semester: {
      number: number;
      name: string;
    };
  }>;
}

interface StudentsClientProps {
  initialData: {
    students: StudentItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  branches: Array<{ id: string; code: string; name: string }>;
  semesters: Array<{ id: string; number: number; name: string }>;
  batches: string[];
  userRole: UserRole;
}

export function StudentsClient({
  initialData,
  branches,
  semesters,
  batches,
  userRole,
}: StudentsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedBranch, setSelectedBranch] = useState(searchParams.get("branchId") || "ALL");
  const [selectedBatch, setSelectedBatch] = useState(searchParams.get("batch") || "ALL");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "ALL");
  const [selectedSemester, setSelectedSemester] = useState(searchParams.get("semesterId") || "ALL");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [branchId, setBranchId] = useState(branches[0]?.id || "");
  const [batch, setBatch] = useState("2021-2024");
  const [admissionYear, setAdmissionYear] = useState(2021);
  const [active, setActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const applyFilters = (params: {
    search?: string;
    branchId?: string;
    batch?: string;
    status?: string;
    semesterId?: string;
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

    if (params.batch !== undefined) {
      if (params.batch && params.batch !== "ALL") current.set("batch", params.batch);
      else current.delete("batch");
    }

    if (params.status !== undefined) {
      if (params.status && params.status !== "ALL") current.set("status", params.status);
      else current.delete("status");
    }

    if (params.semesterId !== undefined) {
      if (params.semesterId && params.semesterId !== "ALL") current.set("semesterId", params.semesterId);
      else current.delete("semesterId");
    }

    if (params.page !== undefined) {
      current.set("page", String(params.page));
    } else {
      current.set("page", "1"); // Reset to page 1 on filter changes
    }

    const searchStr = current.toString();
    const query = searchStr ? `?${searchStr}` : "";
    router.push(`${pathname}${query}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFullName("");
    setEnrollmentNumber("");
    setSeatNumber("");
    setBranchId(branches[0]?.id || "");
    setBatch("2021-2024");
    setAdmissionYear(2021);
    setActive(true);
    setErrorMsg(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (s: StudentItem) => {
    setEditingStudent(s);
    setFullName(s.fullName);
    setEnrollmentNumber(s.enrollmentNumber);
    setSeatNumber(s.seatNumber || "");
    setBranchId(s.branchId);
    setBatch(s.batch || "2021-2024");
    setAdmissionYear(s.admissionYear);
    setActive(s.active);
    setErrorMsg(null);
    setIsDialogOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!enrollmentNumber.trim()) {
      setErrorMsg("Enrollment Number is required (alphanumeric).");
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg("Full Name is required.");
      return;
    }

    startTransition(async () => {
      if (editingStudent) {
        const res = await updateStudentAction(editingStudent.id, {
          fullName: fullName.trim(),
          enrollmentNumber: enrollmentNumber.trim(),
          seatNumber: seatNumber.trim() || null,
          branchId,
          batch: batch.trim() || null,
          admissionYear,
          active,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setIsDialogOpen(false);
          toast({ title: "Student Updated", description: `${fullName} has been updated successfully.` });
          router.refresh();
        }
      } else {
        const res = await createStudentAction({
          fullName: fullName.trim(),
          enrollmentNumber: enrollmentNumber.trim(),
          seatNumber: seatNumber.trim() || null,
          branchId,
          batch: batch.trim() || null,
          admissionYear,
          active,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setIsDialogOpen(false);
          toast({ title: "Student Registered", description: `${fullName} (${enrollmentNumber}) was added.` });
          router.refresh();
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Student Directory & Profiles
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse student records, search enrollment details, and view academic semester transcripts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/imports">
            <Button variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Import Excel
            </Button>
          </Link>
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filter and Table Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, enrollment no, or seat no..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-xs h-9"
                />
              </form>

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

              {/* Batch Filter */}
              <select
                value={selectedBatch}
                onChange={(e) => {
                  setSelectedBatch(e.target.value);
                  applyFilters({ batch: e.target.value });
                }}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Batches</option>
                {batches.map((b) => (
                  <option key={b} value={b}>
                    Batch {b}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  applyFilters({ status: e.target.value });
                }}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>

              <Button type="button" variant="secondary" size="sm" onClick={handleSearchSubmit} className="text-xs h-9">
                Apply Search
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
              <div>
                Showing <span className="font-semibold text-foreground">{initialData.students.length}</span> students (Total: {initialData.total})
              </div>
              <div>Page {initialData.page} of {initialData.totalPages || 1}</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Enrollment No.</TableHead>
                <TableHead className="w-[110px]">Seat No.</TableHead>
                <TableHead>Student Full Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-center">Latest SPI</TableHead>
                <TableHead className="text-center">Latest CPI</TableHead>
                <TableHead className="text-center">Backlogs</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-36 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <GraduationCap className="h-8 w-8 text-muted-foreground/50" />
                      <p>No students found matching the selected filters.</p>
                      <Button variant="outline" size="sm" onClick={handleOpenAdd} className="text-xs">
                        Add New Student
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                initialData.students.map((student) => {
                  const latestRes = student.semesterResults?.[0];
                  const curBacklog = latestRes?.currentBacklog ?? 0;

                  return (
                    <TableRow key={student.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono font-bold text-primary text-xs">
                        <Link href={`/students/${student.id}`} className="hover:underline">
                          {student.enrollmentNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {student.seatNumber || "-"}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <Link href={`/students/${student.id}`} className="hover:text-primary transition-colors">
                          {student.fullName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                          {student.branch.code}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {student.batch || `${student.admissionYear}-${student.admissionYear + 3}`}
                      </TableCell>
                      <TableCell className="text-center font-mono font-semibold text-xs">
                        {latestRes ? formatNumber(latestRes.spi) : "-"}
                      </TableCell>
                      <TableCell className="text-center font-mono font-semibold text-xs">
                        {latestRes ? formatNumber(latestRes.cpi) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {latestRes ? (
                          curBacklog > 0 ? (
                            <span className="inline-flex items-center justify-center bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full text-xs">
                              {curBacklog}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full text-xs">
                              Clear
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.active ? (
                          <Badge variant="success" className="gap-1 text-[10px]">
                            <CheckCircle className="h-3 w-3" />
                            ACTIVE
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 text-[10px] text-muted-foreground">
                            <XCircle className="h-3 w-3" />
                            INACTIVE
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/students/${student.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" title="View Profile">
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(student)}
                            className="h-8 gap-1 text-xs"
                            title="Edit Student"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
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

        {/* Pagination controls */}
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

      {/* Add / Edit Student Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStudent ? "Edit Student Profile" : "Add Student Record"}</DialogTitle>
            <DialogDescription className="text-xs">
              Enter official enrollment details, branch allocation, and batch year.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 text-xs rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSaveStudent} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Student Full Name</label>
              <Input
                placeholder="e.g. Aarav K. Patel"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Enrollment Number</label>
                <Input
                  placeholder="216170307001"
                  value={enrollmentNumber}
                  onChange={(e) => setEnrollmentNumber(e.target.value)}
                  maxLength={20}
                  className="font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Seat Number (Optional)</label>
                <Input
                  placeholder="E21617001"
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value)}
                  maxLength={20}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Branch</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Batch (e.g. 2021-2024)</label>
                <Input
                  placeholder="2021-2024"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  maxLength={20}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Admission Year</label>
              <Input
                type="number"
                min="2000"
                max="2050"
                value={admissionYear}
                onChange={(e) => setAdmissionYear(parseInt(e.target.value, 10) || 2021)}
                className="text-xs"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="studentActive"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="studentActive" className="text-xs font-medium cursor-pointer">
                Student is actively enrolled
              </label>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingStudent ? "Update Record" : "Create Student"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
