"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  GitBranch,
  BookOpen,
  Sliders,
  AlertTriangle,
  Award,
  Filter,
  Search,
  Download,
  ArrowUpDown,
} from "lucide-react";
import { formatNumber, formatPercentage, getGradeBadgeColor } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface AnalyticsClientProps {
  initialData: any;
  userRole: UserRole;
  initialTab?: string;
}

export function AnalyticsClient({
  initialData,
  userRole,
  initialTab = "overall",
}: AnalyticsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [rankingMetric, setRankingMetric] = useState<"SPI" | "CPI" | "CGPA">("SPI");
  const [rankingSearch, setRankingSearch] = useState("");

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

  // Filter rankings by search
  const filteredRankings = studentRankings
    .filter((s: any) =>
      s.fullName.toLowerCase().includes(rankingSearch.toLowerCase()) ||
      s.enrollmentNumber.toLowerCase().includes(rankingSearch.toLowerCase()) ||
      s.branchCode.toLowerCase().includes(rankingSearch.toLowerCase())
    )
    .sort((a: any, b: any) => {
      const field = rankingMetric.toLowerCase() as "spi" | "cpi" | "cgpa";
      return (b[field] || 0) - (a[field] || 0);
    })
    .map((item: any, idx: number) => ({ ...item, dynamicRank: idx + 1 }));

  // Backlog students subset
  const backlogStudents = studentRankings.filter((s: any) => s.currentBacklog > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Institutional Analytics Suite
          </h1>
          <p className="text-sm text-muted-foreground">
            Multi-dimensional evaluation across semesters, engineering branches, curriculum subjects, and rankings.
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto p-1 bg-muted gap-1">
          <TabsTrigger value="overall" className="text-xs font-semibold px-3 py-1.5 gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Overall Performance
          </TabsTrigger>
          <TabsTrigger value="semester" className="text-xs font-semibold px-3 py-1.5 gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Semester Analysis
          </TabsTrigger>
          <TabsTrigger value="branch" className="text-xs font-semibold px-3 py-1.5 gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            Branch Comparison
          </TabsTrigger>
          <TabsTrigger value="subject" className="text-xs font-semibold px-3 py-1.5 gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Subject Analysis
          </TabsTrigger>
          <TabsTrigger value="grade" className="text-xs font-semibold px-3 py-1.5 gap-1.5">
            <Sliders className="h-3.5 w-3.5" />
            Grade Distribution
          </TabsTrigger>
          <TabsTrigger value="backlogs" className="text-xs font-semibold px-3 py-1.5 gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Backlog Diagnostics
          </TabsTrigger>
          <TabsTrigger value="ranking" className="text-xs font-semibold px-3 py-1.5 gap-1.5">
            <Award className="h-3.5 w-3.5" />
            Student Rankings
          </TabsTrigger>
        </TabsList>

        {/* TAB A: OVERALL PERFORMANCE */}
        <TabsContent value="overall" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">SPI Score Distribution</CardTitle>
                <CardDescription className="text-xs">Histogram of Semester Performance Index</CardDescription>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spiDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">CPI Score Distribution</CardTitle>
                <CardDescription className="text-xs">Cumulative Performance Index</CardDescription>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cpiDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">CGPA Score Distribution</CardTitle>
                <CardDescription className="text-xs">Cumulative Grade Point Average</CardDescription>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cgpaDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB B: SEMESTER ANALYSIS */}
        <TabsContent value="semester" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Semester-Wise Performance Table</CardTitle>
              <CardDescription className="text-xs">
                Comparison of academic indexes, pass percentages, and backlog counts from Semester 1 through 6.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Semester</TableHead>
                    <TableHead className="text-center">Students Appeared</TableHead>
                    <TableHead className="text-center font-bold">Average SPI</TableHead>
                    <TableHead className="text-center font-bold">Average CPI</TableHead>
                    <TableHead className="text-center font-bold">Average CGPA</TableHead>
                    <TableHead className="text-center">Pass Percentage</TableHead>
                    <TableHead className="text-center">Total Backlogs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {semesterTrends.map((sem: any) => (
                    <TableRow key={sem.semesterNumber}>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {sem.semesterName}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">{sem.totalStudents}</TableCell>
                      <TableCell className="text-center font-mono font-bold text-xs text-primary">
                        {formatNumber(sem.averageSpi)}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-xs">
                        {formatNumber(sem.averageCpi)}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-xs">
                        {formatNumber(sem.averageCgpa)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-teal-600 font-bold">
                        {formatPercentage(sem.passPercentage)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-rose-600 font-bold">
                        {sem.backlogCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB C: BRANCH ANALYSIS */}
        <TabsContent value="branch" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Engineering Discipline Metrics</CardTitle>
              <CardDescription className="text-xs">
                Departmental performance comparison across all registered branches.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Code</TableHead>
                    <TableHead>Engineering Discipline</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center font-bold">Average SPI</TableHead>
                    <TableHead className="text-center font-bold">Average CPI</TableHead>
                    <TableHead className="text-center">Pass Rate</TableHead>
                    <TableHead className="text-center">Active Backlogs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchComparison.map((b: any) => (
                    <TableRow key={b.branchCode}>
                      <TableCell className="font-mono font-bold text-primary text-xs">
                        {b.branchCode}
                      </TableCell>
                      <TableCell className="font-medium text-xs text-foreground">
                        {b.branchName}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">{b.studentCount}</TableCell>
                      <TableCell className="text-center font-mono font-bold text-xs text-primary">
                        {formatNumber(b.averageSpi)}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-xs">
                        {formatNumber(b.averageCpi)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold text-teal-600">
                        {formatPercentage(b.passPercentage)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-rose-600 font-bold">
                        {b.totalBacklogs}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB D: SUBJECT ANALYSIS */}
        <TabsContent value="subject" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Subject-Level Evaluation Matrix</CardTitle>
              <CardDescription className="text-xs">
                Breakdown of student pass rates, backlog counts, and average grade points by curriculum subject.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Subject Code</TableHead>
                    <TableHead>Subject Title</TableHead>
                    <TableHead className="text-center">Credits</TableHead>
                    <TableHead className="text-center">Appeared</TableHead>
                    <TableHead className="text-center">Passed</TableHead>
                    <TableHead className="text-center">Backlogs</TableHead>
                    <TableHead className="text-center font-bold">Pass Rate</TableHead>
                    <TableHead className="text-center font-bold">Avg Grade Point</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectPerformance.map((sub: any) => (
                    <TableRow key={sub.subjectCode}>
                      <TableCell className="font-mono font-bold text-primary text-xs">
                        {sub.subjectCode}
                      </TableCell>
                      <TableCell className="font-medium text-xs text-foreground">
                        {sub.subjectName}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">{sub.credits.toFixed(1)}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{sub.totalAppeared}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-emerald-600 font-semibold">{sub.passCount}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-rose-600 font-bold">{sub.failCount}</TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold text-teal-600">
                        {formatPercentage(sub.passPercentage)}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-xs">
                        {formatNumber(sub.averageGradePoint)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB E: GRADE ANALYSIS */}
        <TabsContent value="grade" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Institutional Grade Point Distribution</CardTitle>
              <CardDescription className="text-xs">
                Detailed breakdown of letter grades awarded across all examination papers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                {gradeDistribution.map((g: any) => {
                  const badgeColor = getGradeBadgeColor(g.grade);
                  return (
                    <div key={g.grade} className="p-3 border rounded-xl bg-card text-center space-y-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded font-bold text-xs border ${badgeColor.bg} ${badgeColor.border}`}>
                        {g.grade}
                      </span>
                      <div className="text-xl font-bold font-mono text-foreground">{g.count}</div>
                      <div className="text-[10px] text-muted-foreground">{g.percentage}% of total</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB F: BACKLOG ANALYSIS */}
        <TabsContent value="backlogs" className="space-y-6">
          <Card className="border-rose-200 dark:border-rose-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-rose-800 dark:text-rose-300">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                Students Requiring Academic Intervention ({backlogStudents.length} Students)
              </CardTitle>
              <CardDescription className="text-xs">
                List of students with active backlogs who require remedial classes and re-examination support.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enrollment No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-center font-bold">Current Backlogs</TableHead>
                    <TableHead className="text-center">Total Backlogs</TableHead>
                    <TableHead className="text-center">SPI</TableHead>
                    <TableHead className="text-center">CPI</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backlogStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-emerald-600 font-semibold text-xs">
                        No active backlogs in the selected filter scope! 100% Clear Pass.
                      </TableCell>
                    </TableRow>
                  ) : (
                    backlogStudents.map((s: any) => (
                      <TableRow key={s.studentId}>
                        <TableCell className="font-mono font-bold text-primary text-xs">
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
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full text-xs">
                            {s.currentBacklog} Backlog{s.currentBacklog > 1 ? "s" : ""}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                          {s.totalBacklog}
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold text-xs">
                          {formatNumber(s.spi)}
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold text-xs">
                          {formatNumber(s.cpi)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/students/${s.studentId}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              View Transcript
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB G: STUDENT RANKING */}
        <TabsContent value="ranking" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    Academic Merit Ranking Leaderboard
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Rank students by SPI, CPI, or CGPA with instant metric reordering.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3">
                  {/* Metric Switcher */}
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border text-xs">
                    <span className="text-[11px] font-semibold text-muted-foreground px-1.5">Sort Metric:</span>
                    {(["SPI", "CPI", "CGPA"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setRankingMetric(m)}
                        className={`px-2.5 py-0.5 rounded font-bold transition-all ${
                          rankingMetric === m
                            ? "bg-background text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {/* Search input */}
                  <div className="relative w-48">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search ranking..."
                      value={rankingSearch}
                      onChange={(e) => setRankingSearch(e.target.value)}
                      className="pl-7 text-xs h-7"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] text-center">Rank</TableHead>
                    <TableHead className="w-[140px]">Enrollment No</TableHead>
                    <TableHead>Student Full Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className={`text-center font-bold ${rankingMetric === "SPI" ? "text-primary bg-primary/5" : ""}`}>
                      SPI
                    </TableHead>
                    <TableHead className={`text-center font-bold ${rankingMetric === "CPI" ? "text-primary bg-primary/5" : ""}`}>
                      CPI
                    </TableHead>
                    <TableHead className={`text-center font-bold ${rankingMetric === "CGPA" ? "text-primary bg-primary/5" : ""}`}>
                      CGPA
                    </TableHead>
                    <TableHead className="text-center">Backlogs</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRankings.map((s: any) => (
                    <TableRow key={s.studentId}>
                      <TableCell className="text-center font-bold">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            s.dynamicRank === 1
                              ? "bg-amber-100 text-amber-800"
                              : s.dynamicRank === 2
                              ? "bg-slate-200 text-slate-800"
                              : s.dynamicRank === 3
                              ? "bg-amber-50 text-amber-700"
                              : "text-muted-foreground"
                          }`}
                        >
                          {s.dynamicRank}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-primary text-xs">
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
                      <TableCell className={`text-center font-mono font-bold text-xs ${rankingMetric === "SPI" ? "text-primary bg-primary/5" : ""}`}>
                        {formatNumber(s.spi)}
                      </TableCell>
                      <TableCell className={`text-center font-mono font-bold text-xs ${rankingMetric === "CPI" ? "text-primary bg-primary/5" : ""}`}>
                        {formatNumber(s.cpi)}
                      </TableCell>
                      <TableCell className={`text-center font-mono font-bold text-xs ${rankingMetric === "CGPA" ? "text-primary bg-primary/5" : ""}`}>
                        {formatNumber(s.cgpa)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
