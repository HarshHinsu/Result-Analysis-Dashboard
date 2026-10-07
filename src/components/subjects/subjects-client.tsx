"use client";

import { useState, useTransition } from "react";
import { UserRole } from "@/types";
import { createSubjectAction, updateSubjectAction } from "@/server/actions/subjects";
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
import { BookOpen, Plus, Search, Edit2, CheckCircle, XCircle, Filter } from "lucide-react";

interface SubjectItem {
  id: string;
  subjectCode: string;
  subjectName: string;
  branchId: string | null;
  branch: { id: string; code: string; name: string } | null;
  semesterId: string;
  semester: { id: string; number: number; name: string };
  credits: number;
  active: boolean;
  _count?: {
    subjectResults: number;
  };
}

interface SubjectsClientProps {
  initialSubjects: SubjectItem[];
  branches: Array<{ id: string; code: string; name: string }>;
  semesters: Array<{ id: string; number: number; name: string }>;
  userRole: UserRole;
}

export function SubjectsClient({
  initialSubjects,
  branches,
  semesters,
  userRole,
}: SubjectsClientProps) {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<SubjectItem[]>(initialSubjects);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedSemester, setSelectedSemester] = useState<string>("ALL");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState<string>("");
  const [semesterId, setSemesterId] = useState<string>(semesters[0]?.id || "");
  const [credits, setCredits] = useState<number>(4.0);
  const [active, setActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = userRole === "ADMIN";

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setCode("");
    setName("");
    setBranchId(branches[0]?.id || "");
    setSemesterId(semesters[0]?.id || "");
    setCredits(4.0);
    setActive(true);
    setErrorMsg(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setCode(sub.subjectCode);
    setName(sub.subjectName);
    setBranchId(sub.branchId || "");
    setSemesterId(sub.semesterId);
    setCredits(sub.credits);
    setActive(sub.active);
    setErrorMsg(null);
    setIsDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code.trim()) {
      setErrorMsg("Subject Code is required (e.g. 3330701 or DI01000011)");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("Subject Name is required");
      return;
    }
    if (!semesterId) {
      setErrorMsg("Semester is required");
      return;
    }

    startTransition(async () => {
      if (editingSubject) {
        const res = await updateSubjectAction(editingSubject.id, {
          subjectCode: code.trim().toUpperCase(),
          subjectName: name.trim(),
          branchId: branchId || null,
          semesterId,
          credits,
          active,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.subject) {
          const updatedBranch = branches.find((b) => b.id === branchId) || null;
          const updatedSem = semesters.find((s) => s.id === semesterId) || { id: semesterId, number: 1, name: "Semester 1" };

          setSubjects((prev) =>
            prev.map((s) =>
              s.id === editingSubject.id
                ? {
                    ...s,
                    ...res.subject,
                    branch: updatedBranch,
                    semester: updatedSem,
                  }
                : s
            )
          );
          setIsDialogOpen(false);
          toast({ title: "Subject Updated", description: `${name} has been updated successfully.` });
        }
      } else {
        const res = await createSubjectAction({
          subjectCode: code.trim().toUpperCase(),
          subjectName: name.trim(),
          branchId: branchId || null,
          semesterId,
          credits,
          active,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.subject) {
          const newBranch = branches.find((b) => b.id === branchId) || null;
          const newSem = semesters.find((s) => s.id === semesterId) || { id: semesterId, number: 1, name: "Semester 1" };

          setSubjects((prev) => [
            ...prev,
            {
              ...res.subject,
              branch: newBranch,
              semester: newSem,
              _count: { subjectResults: 0 },
            },
          ]);
          setIsDialogOpen(false);
          toast({ title: "Subject Created", description: `${name} (${code}) added successfully.` });
        }
      }
    });
  };

  const filtered = subjects.filter((sub) => {
    const matchesSearch =
      sub.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      sub.subjectCode.toLowerCase().includes(search.toLowerCase());

    const matchesBranch =
      selectedBranch === "ALL" || sub.branchId === selectedBranch || (!sub.branchId && selectedBranch === "GLOBAL");

    const matchesSemester =
      selectedSemester === "ALL" || sub.semesterId === selectedSemester;

    return matchesSearch && matchesBranch && matchesSemester;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Curriculum Subjects
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage course codes, credit weights, semester allocations, and branch curriculum.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Subject
          </Button>
        )}
      </div>

      {/* Filter and Table Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search code or subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-xs"
                />
              </div>

              {/* Branch Filter */}
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
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
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {subjects.length} subjects
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Subject Code</TableHead>
                <TableHead>Subject Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-center">Semester</TableHead>
                <TableHead className="text-center">Credits</TableHead>
                <TableHead className="text-center">Status</TableHead>
                {isAdmin && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="h-32 text-center text-muted-foreground">
                    No subjects found matching your search and filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono font-bold text-primary">
                      <span className="bg-primary/10 text-primary px-2.5 py-1 rounded text-xs">
                        {sub.subjectCode}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {sub.subjectName}
                    </TableCell>
                    <TableCell>
                      {sub.branch ? (
                        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                          {sub.branch.code} - {sub.branch.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Universal / Common</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-xs">
                      {sub.semester?.name || `Semester ${sub.semester?.number}`}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-2 py-0.5 rounded text-xs">
                        {sub.credits.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {sub.active ? (
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
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(sub)}
                          className="h-8 gap-1 text-xs"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Subject" : "Add Curriculum Subject"}</DialogTitle>
            <DialogDescription className="text-xs">
              Define course code, credit points, branch affiliation, and semester level.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 text-xs rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Subject Code (e.g. 3330701)</label>
              <Input
                placeholder="3330701"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={20}
                className="uppercase font-mono text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Subject Name</label>
              <Input
                placeholder="e.g. Database Management Systems"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={150}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Branch</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">(Common / Universal)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Semester</label>
                <select
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                >
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Credits (Weight for SPI/CPI)</label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="20"
                value={credits}
                onChange={(e) => setCredits(parseFloat(e.target.value) || 4.0)}
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="subjectActive"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="subjectActive" className="text-xs font-medium cursor-pointer">
                Subject is active in current syllabus
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
                {isPending ? "Saving..." : editingSubject ? "Update Subject" : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
