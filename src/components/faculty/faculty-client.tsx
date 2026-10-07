"use client";

import { useState, useTransition } from "react";
import { createFacultyAction, updateFacultyAction } from "@/server/actions/faculty";
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
import { Users, Plus, Search, Edit2, KeyRound, CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface FacultyItem {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    auditLogs: number;
    importJobs: number;
  };
}

interface FacultyClientProps {
  initialFaculty: FacultyItem[];
  currentAdminId: string;
}

export function FacultyClient({ initialFaculty, currentAdminId }: FacultyClientProps) {
  const { toast } = useToast();
  const [facultyList, setFacultyList] = useState<FacultyItem[]>(initialFaculty);
  const [search, setSearch] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FacultyItem | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "FACULTY">("FACULTY");
  const [active, setActive] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("FACULTY");
    setActive(true);
    setErrorMsg(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (user: FacultyItem) => {
    setSelectedUser(user);
    setName(user.name);
    setUsername(user.username);
    setEmail(user.email || "");
    setRole(user.role as "ADMIN" | "FACULTY");
    setActive(user.active);
    setErrorMsg(null);
    setIsDialogOpen(true);
  };

  const handleOpenResetPassword = (user: FacultyItem) => {
    setSelectedUser(user);
    setNewPassword("");
    setErrorMsg(null);
    setIsPasswordModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      if (selectedUser) {
        const res = await updateFacultyAction(selectedUser.id, {
          name,
          email,
          role,
          active,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          setFacultyList((prev) =>
            prev.map((u) => (u.id === selectedUser.id ? { ...u, ...res.user } : u))
          );
          setIsDialogOpen(false);
          toast({ title: "User Updated", description: `${name}'s profile was updated.` });
        }
      } else {
        const res = await createFacultyAction({
          name,
          username,
          email,
          password,
          role,
          active,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          setFacultyList((prev) => [
            ...prev,
            {
              ...res.user,
              updatedAt: new Date(),
              _count: { auditLogs: 0, importJobs: 0 },
            },
          ]);
          setIsDialogOpen(false);
          toast({ title: "Faculty Created", description: `Account created for ${name}.` });
        }
      }
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    startTransition(async () => {
      const res = await updateFacultyAction(selectedUser.id, {
        newPassword,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsPasswordModalOpen(false);
        toast({
          title: "Password Changed",
          description: `Password for ${selectedUser.name} has been reset.`,
        });
      }
    });
  };

  const filtered = facultyList.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Faculty & User Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage academic staff accounts, role permissions, and access credentials.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Faculty Member
        </Button>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">User Directory</CardTitle>
              <CardDescription className="text-xs">
                Total {facultyList.length} authenticated personnel in the system.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username..."
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
                <TableHead>Faculty Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{u.name}</span>
                        {u.id === currentAdminId && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium border border-indigo-200">
                            You
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      @{u.username}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      {u.email || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={u.role === "ADMIN" ? "default" : "secondary"}
                        className="text-[10px] font-semibold"
                      >
                        {u.role === "ADMIN" ? "ADMINISTRATOR" : "FACULTY"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {u.active ? (
                        <Badge variant="success" className="gap-1 text-[10px]">
                          <CheckCircle className="h-3 w-3" />
                          ACTIVE
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-[10px] text-muted-foreground">
                          <XCircle className="h-3 w-3" />
                          DISABLED
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          className="h-8 gap-1 text-xs"
                          title="Edit Details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenResetPassword(u)}
                          className="h-8 gap-1 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                          title="Reset Password"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Password
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedUser ? "Edit User Account" : "Register Faculty User"}</DialogTitle>
            <DialogDescription className="text-xs">
              Assign role privileges and institutional identity.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 text-xs rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Full Name & Title</label>
              <Input
                placeholder="e.g. Prof. Rajesh Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Username</label>
                <Input
                  placeholder="rsharma"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!!selectedUser}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "ADMIN" | "FACULTY")}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="FACULTY">FACULTY</option>
                  <option value="ADMIN">ADMIN (Full Access)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email Address (Optional)</label>
              <Input
                type="email"
                placeholder="faculty@polytechnic.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {!selectedUser && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Initial Password</label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="userActive"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="userActive" className="text-xs font-medium cursor-pointer">
                Account is active and permitted to sign in
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
                {isPending ? "Saving..." : selectedUser ? "Update User" : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription className="text-xs">
              Set a new password for <span className="font-semibold text-foreground">{selectedUser?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 text-xs rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">New Secure Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">Minimum 6 characters.</p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordModalOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
