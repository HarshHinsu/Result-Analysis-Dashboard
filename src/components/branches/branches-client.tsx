"use client";

import { useState, useTransition } from "react";
import { UserRole } from "@/types";
import { createBranchAction, updateBranchAction } from "@/server/actions/branches";
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
import { GitBranch, Plus, Search, Edit2, Users, BookOpen, CheckCircle, XCircle } from "lucide-react";

interface BranchItem {
  id: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    students: number;
    subjects: number;
  };
}

interface BranchesClientProps {
  initialBranches: BranchItem[];
  userRole: UserRole;
}

export function BranchesClient({ initialBranches, userRole }: BranchesClientProps) {
  const { toast } = useToast();
  const [branches, setBranches] = useState<BranchItem[]>(initialBranches);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = userRole === "ADMIN";

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setCode("");
    setName("");
    setActive(true);
    setErrorMsg(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (branch: BranchItem) => {
    setEditingBranch(branch);
    setCode(branch.code);
    setName(branch.name);
    setActive(branch.active);
    setErrorMsg(null);
    setIsDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code.trim()) {
      setErrorMsg("Branch code is required (e.g. IT, EE, CE)");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("Branch name is required");
      return;
    }

    startTransition(async () => {
      if (editingBranch) {
        const res = await updateBranchAction(editingBranch.id, {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          active,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.branch) {
          setBranches((prev) =>
            prev.map((b) => (b.id === editingBranch.id ? { ...b, ...res.branch } : b))
          );
          setIsDialogOpen(false);
          toast({ title: "Branch Updated", description: `${name} has been updated successfully.` });
        }
      } else {
        const res = await createBranchAction({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          active,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.branch) {
          setBranches((prev) => [...prev, { ...res.branch, _count: { students: 0, subjects: 0 } }]);
          setIsDialogOpen(false);
          toast({ title: "Branch Created", description: `${name} (${code}) was created successfully.` });
        }
      }
    });
  };

  const filtered = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-primary" />
            Engineering Branches
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage academic departments and diploma engineering disciplines.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Branch
          </Button>
        )}
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Registered Branches</CardTitle>
              <CardDescription className="text-xs">
                Total {branches.length} departments configured in system.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search branch or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Code</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead className="text-center">Enrolled Students</TableHead>
                <TableHead className="text-center">Curriculum Subjects</TableHead>
                <TableHead className="text-center">Status</TableHead>
                {isAdmin && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="h-32 text-center text-muted-foreground">
                    No matching branches found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-mono font-bold text-primary">
                      <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs">
                        {branch.code}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {branch.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                        <Users className="h-3 w-3 text-slate-500" />
                        <span>{branch._count?.students ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                        <BookOpen className="h-3 w-3 text-slate-500" />
                        <span>{branch._count?.subjects ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {branch.active ? (
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
                          onClick={() => handleOpenEdit(branch)}
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
            <DialogTitle>{editingBranch ? "Edit Branch" : "Add New Engineering Branch"}</DialogTitle>
            <DialogDescription className="text-xs">
              Configure department abbreviation and full official title.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 text-xs rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Branch Code (e.g. IT, EE, CE)</label>
              <Input
                placeholder="IT"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={10}
                className="uppercase font-mono text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Official Branch Name</label>
              <Input
                placeholder="e.g. Information Technology"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="branchActive"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="branchActive" className="text-xs font-medium cursor-pointer">
                Department is currently active
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
                {isPending ? "Saving..." : editingBranch ? "Update Branch" : "Create Branch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
