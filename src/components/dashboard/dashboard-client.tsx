"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  BarChart3,
  UploadCloud,
  FileText,
  Filter,
  Users,
  Percent,
  ArrowRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatPercentage } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface DashboardClientProps {
  initialData: any;
  userRole: UserRole;
  userName: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6", "#f43f5e"];
const PIE_COLORS = ["#10b981", "#f43f5e", "#f59e0b"];

export function DashboardClient({
  initialData,
  userRole,
  userName,
}: DashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedAY, setSelectedAY] = useState(searchParams.get("academicYearId") || "ALL");
  const [selectedSem, setSelectedSem] = useState(searchParams.get("semesterId") || "ALL");
  const [selectedBranch, setSelectedBranch] = useState(searchParams.get("branchId") || "ALL");
  const [selectedBatch, setSelectedBatch] = useState(searchParams.get("batch") || "ALL");

  const [isPending, startTransition] = useTransition();

  const applyFilters = (params: {
    academicYearId?: string;
    semesterId?: string;
    branchId?: string;
    batch?: string;
  }) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (params.academicYearId !== undefined) {
      if (params.academicYearId && params.academicYearId !== "ALL") current.set("academicYearId", params.academicYearId);
      else current.delete("academicYearId");
    }

    if (params.semesterId !== undefined) {
      if (params.semesterId && params.semesterId !== "ALL") current.set("semesterId", params.semesterId);
      else current.delete("semesterId");
    }

    if (params.branchId !== undefined) {
      if (params.branchId && params.branchId !== "ALL") current.set("branchId", params.branchId);
      else current.delete("branchId");
    }

    if (params.batch !== undefined) {
      if (params.batch && params.batch !== "ALL") current.set("batch", params.batch);
      else current.delete("batch");
    }

    const searchStr = current.toString();
    router.push(`${pathname}${searchStr ? `?${searchStr}` : ""}`);
  };

  const {
    kpis,
    gradeDistribution,
    spiDistribution,
    cpiDistribution,
    cgpaDistribution,
    backlogDistribution,
    semesterTrends,
    branchComparison,
    subjectPerformance,
    studentRankings,
    branches,
    semesters,
    academicYears,
  } = initialData;

  const pieData = [
    { name: "Clear Pass", value: kpis.clearPassCount || 0 },
    { name: "With Backlogs", value: (kpis.totalStudents || 0) - (kpis.clearPassCount || 0) },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & User Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Academic Performance Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, <span className="font-semibold text-foreground">{userName}</span>. Comprehensive result intelligence and GTU metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/imports">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <UploadCloud className="h-4 w-4 text-emerald-600" />
              Import Excel
            </Button>
          </Link>
          <Link href="/analytics">
            <Button size="sm" className="gap-2 text-xs">
              <BarChart3 className="h-4 w-4" />
              Detailed Analytics Suite
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Filter Bar */}
      <Card className="bg-card border shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-2">
              <Filter className="h-4 w-4 text-primary" />
              <span>Filters:</span>
            </div>

            {/* Academic Year Filter */}
            <select
              value={selectedAY}
              onChange={(e) => {
                setSelectedAY(e.target.value);
                applyFilters({ academicYearId: e.target.value });
              }}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Academic Years</option>
              {academicYears.map((ay: any) => (
                <option key={ay.id} value={ay.id}>
                  AY {ay.name} {ay.isCurrent ? "(Current)" : ""}
                </option>
              ))}
            </select>

            {/* Semester Filter */}
            <select
              value={selectedSem}
              onChange={(e) => {
                setSelectedSem(e.target.value);
                applyFilters({ semesterId: e.target.value });
              }}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Semesters (1-6)</option>
              {semesters.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Branch Filter */}
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                applyFilters({ branchId: e.target.value });
              }}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Engineering Branches</option>
              {branches.map((b: any) => (
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
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Batches</option>
              <option value="2021-2024">Batch 2021-2024</option>
              <option value="2022-2025">Batch 2022-2025</option>
              <option value="2023-2026">Batch 2023-2026</option>
            </select>

            {(selectedAY !== "ALL" || selectedSem !== "ALL" || selectedBranch !== "ALL" || selectedBatch !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedAY("ALL");
                  setSelectedSem("ALL");
                  setSelectedBranch("ALL");
                  setSelectedBatch("ALL");
                  applyFilters({ academicYearId: "ALL", semesterId: "ALL", branchId: "ALL", batch: "ALL" });
                }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Students */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Students</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">{kpis.totalStudents}</div>
            <p className="text-[10px] text-muted-foreground">In active filter scope</p>
          </CardContent>
        </Card>

        {/* Avg SPI */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Average SPI</span>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600 font-mono">{formatNumber(kpis.averageSpi)}</div>
            <p className="text-[10px] text-muted-foreground">Semester Performance</p>
          </CardContent>
        </Card>

        {/* Avg CPI */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Average CPI</span>
              <Award className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 font-mono">{formatNumber(kpis.averageCpi)}</div>
            <p className="text-[10px] text-muted-foreground">Cumulative Performance</p>
          </CardContent>
        </Card>

        {/* Avg CGPA */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Average CGPA</span>
              <Award className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600 font-mono">{formatNumber(kpis.averageCgpa)}</div>
            <p className="text-[10px] text-muted-foreground">Overall Grade Avg</p>
          </CardContent>
        </Card>

        {/* Pass Percentage */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pass Rate</span>
              <Percent className="h-4 w-4 text-teal-500" />
            </div>
            <div className="text-2xl font-bold text-teal-600 font-mono">{formatPercentage(kpis.passPercentage)}</div>
            <p className="text-[10px] text-muted-foreground">{kpis.clearPassCount} clear pass</p>
          </CardContent>
        </Card>

        {/* Total Active Backlogs */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Backlogs</span>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <div className={`text-2xl font-bold font-mono ${kpis.totalBacklogs > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {kpis.totalBacklogs}
            </div>
            <p className="text-[10px] text-muted-foreground">{kpis.backlogStudentCount} students affected</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Score Distributions & Overall Result Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SPI Distribution Histogram */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">SPI Score Range Distribution</CardTitle>
            <CardDescription className="text-xs">Student count grouped by SPI brackets</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spiDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CPI Distribution Histogram */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">CPI Score Range Distribution</CardTitle>
            <CardDescription className="text-xs">Cumulative index distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cpiDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pass vs Backlog Pie */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Result Status Breakdown</CardTitle>
            <CardDescription className="text-xs">Clear pass vs Backlog proportion</CardDescription>
          </CardHeader>
          <CardContent className="h-56 flex items-center justify-center">
            {pieData.length === 0 ? (
              <span className="text-xs text-muted-foreground">No result data available</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Semester Trend & Branch Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Semester Progression Trend */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Semester Progression (Sem 1 to Sem 6)
            </CardTitle>
            <CardDescription className="text-xs">Average SPI & Pass Percentage progression across terms</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={semesterTrends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="semesterName" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                <Line yAxisId="left" type="monotone" dataKey="averageSpi" name="Avg SPI" stroke="#3b82f6" strokeWidth={2.5} />
                <Line yAxisId="left" type="monotone" dataKey="averageCpi" name="Avg CPI" stroke="#10b981" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="passPercentage" name="Pass %" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Branch Comparative Analytics */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Engineering Branch Comparative Analysis
            </CardTitle>
            <CardDescription className="text-xs">Average SPI and Pass Rate comparison across departments</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchComparison} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="branchCode" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                <Bar dataKey="averageSpi" fill="#3b82f6" name="Avg SPI" radius={[4, 4, 0, 0]} />
                <Bar dataKey="averageCpi" fill="#10b981" name="Avg CPI" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Grade Distribution & Backlog Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Overall Grade Distribution (AA to FF)</CardTitle>
            <CardDescription className="text-xs">Total count of each GTU letter grade across all subjects</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Grades Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Backlog Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Active Backlog Distribution</CardTitle>
            <CardDescription className="text-xs">Student distribution across backlog clusters</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={backlogDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Top Performers Leaderboard Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Top Performing Students
              </CardTitle>
              <CardDescription className="text-xs">
                Academic merit leaderboard ranked by SPI in the current filter scope.
              </CardDescription>
            </div>
            <Link href="/analytics?tab=ranking">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Full Rankings
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] text-center">Rank</TableHead>
                <TableHead>Enrollment No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-center font-bold">SPI</TableHead>
                <TableHead className="text-center font-bold">CPI</TableHead>
                <TableHead className="text-center">Backlogs</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentRankings.slice(0, 5).map((s: any) => (
                <TableRow key={s.studentId}>
                  <TableCell className="text-center font-bold">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        s.rank === 1
                          ? "bg-amber-100 text-amber-800"
                          : s.rank === 2
                          ? "bg-slate-200 text-slate-800"
                          : s.rank === 3
                          ? "bg-amber-50 text-amber-700"
                          : "text-muted-foreground"
                      }`}
                    >
                      {s.rank}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-primary">
                    <Link href={`/students/${s.studentId}`} className="hover:underline">
                      {s.enrollmentNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-xs text-foreground">
                    {s.fullName}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {s.branchCode}
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-xs text-primary">
                    {formatNumber(s.spi)}
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-xs">
                    {formatNumber(s.cpi)}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.currentBacklog > 0 ? (
                      <Badge variant="destructive" className="text-[10px]">
                        {s.currentBacklog}
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px]">
                        CLEAR
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/students/${s.studentId}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
