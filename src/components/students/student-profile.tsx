"use client";

import { useState } from "react";
import Link from "next/link";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  GraduationCap,
  Download,
  ArrowLeft,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  BookOpen,
} from "lucide-react";
import { formatNumber, getGradeBadgeColor, getStatusBadge } from "@/lib/utils";
import { generateStudentTranscriptPdf } from "@/lib/reports/pdf-generator";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface StudentProfileProps {
  student: any;
  userRole: UserRole;
}

export function StudentProfileClient({ student, userRole }: StudentProfileProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const results = student.semesterResults || [];
  const latestResult = results.length > 0 ? results[results.length - 1] : null;

  // Prepare chart progression data
  const chartData = results.map((r: any) => ({
    name: r.semester?.name || `Sem ${r.semester?.number}`,
    spi: r.spi || 0,
    cpi: r.cpi || 0,
    cgpa: r.cgpa || 0,
    backlogs: r.currentBacklog || 0,
  }));

  const handleDownloadTranscript = () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = generateStudentTranscriptPdf(student);
      pdf.save(`TRANSCRIPT_${student.enrollmentNumber}_${student.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error('PDF Generation Error:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/students">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Back to Student Directory
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/results?studentId=${student.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Manage Results
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleDownloadTranscript}
            disabled={isGeneratingPdf || results.length === 0}
            className="gap-1.5 text-xs"
          >
            <Download className="h-4 w-4" />
            {isGeneratingPdf ? "Generating PDF..." : "Download Transcript (PDF)"}
          </Button>
        </div>
      </div>

      {/* Student Profile Header Card */}
      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0 border border-primary/20">
                {student.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {student.fullName}
                  </h1>
                  {student.active ? (
                    <Badge variant="success" className="text-[10px]">ACTIVE</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">INACTIVE</Badge>
                  )}
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  Enrollment: <span className="font-bold text-foreground">{student.enrollmentNumber}</span> &bull; Seat: <span className="text-foreground">{student.seatNumber || "N/A"}</span>
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded font-semibold">
                    {student.branch.code} - {student.branch.name}
                  </span>
                  <span>Batch: {student.batch || `${student.admissionYear}-${student.admissionYear + 3}`}</span>
                </div>
              </div>
            </div>

            {/* Quick KPI Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-xl border">
              <div className="text-center px-2">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Latest SPI</span>
                <span className="text-xl font-bold text-primary font-mono">
                  {latestResult ? formatNumber(latestResult.spi) : "N/A"}
                </span>
              </div>
              <div className="text-center px-2 border-l">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Cumulative CPI</span>
                <span className="text-xl font-bold text-foreground font-mono">
                  {latestResult ? formatNumber(latestResult.cpi) : "N/A"}
                </span>
              </div>
              <div className="text-center px-2 border-l">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">CGPA</span>
                <span className="text-xl font-bold text-foreground font-mono">
                  {latestResult ? formatNumber(latestResult.cgpa) : "N/A"}
                </span>
              </div>
              <div className="text-center px-2 border-l">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Active Backlogs</span>
                <span className={`text-xl font-bold font-mono ${latestResult?.currentBacklog > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {latestResult ? latestResult.currentBacklog : 0}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Progression Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Academic Progression Trend (SPI vs CPI)
            </CardTitle>
            <CardDescription className="text-xs">
              Semester-by-semester index trend across academic terms.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => formatNumber(val)}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="spi" name="SPI" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="cpi" name="CPI" stroke="#10b981" strokeWidth={2.5} />
                <Line type="monotone" dataKey="cgpa" name="CGPA" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Semester Academic Records Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Semester Results Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            GTU / Diploma official examination subject grades, indicators, and indexes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm">No semester results recorded for this student yet.</p>
              <Link href="/results">
                <Button size="sm" variant="outline" className="text-xs mt-2">
                  Enter First Semester Result
                </Button>
              </Link>
            </div>
          ) : (
            <Tabs defaultValue={results[results.length - 1]?.id} className="space-y-4">
              <TabsList className="flex flex-wrap h-auto p-1 bg-muted gap-1">
                {results.map((r: any) => (
                  <TabsTrigger
                    key={r.id}
                    value={r.id}
                    className="text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-background"
                  >
                    {r.semester?.name || `Semester ${r.semester?.number}`}
                    {r.currentBacklog > 0 && (
                      <span className="ml-1.5 h-2 w-2 rounded-full bg-rose-500 inline-block" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {results.map((semRes: any) => {
                const status = getStatusBadge(semRes.resultStatus);
                return (
                  <TabsContent key={semRes.id} value={semRes.id} className="space-y-4">
                    {/* Semester metadata info banner */}
                    <div className="flex flex-wrap items-center justify-between p-3 bg-muted/50 rounded-lg border text-xs gap-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <span className="text-muted-foreground">Academic Year: </span>
                          <span className="font-semibold text-foreground">{semRes.academicYear?.name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Declared On: </span>
                          <span className="font-semibold text-foreground">{semRes.declarationDate || "Official Record"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Seat No: </span>
                          <span className="font-mono font-semibold text-foreground">{semRes.seatNumber || student.seatNumber || "-"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-primary font-mono text-sm">SPI: {formatNumber(semRes.spi)}</span>
                          <span className="text-muted-foreground">&bull;</span>
                          <span className="font-bold text-foreground font-mono text-sm">CPI: {formatNumber(semRes.cpi)}</span>
                        </div>
                        <Badge className={`${status.className} text-xs font-bold`}>
                          {semRes.currentBacklog > 0 ? `FAIL (${semRes.currentBacklog} Backlog)` : "PASS"}
                        </Badge>
                      </div>
                    </div>

                    {/* Subject Result Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Subject Code</TableHead>
                          <TableHead>Subject Title</TableHead>
                          <TableHead className="text-center">Credits</TableHead>
                          <TableHead className="text-center font-bold">Grade</TableHead>
                          <TableHead className="text-center" title="Theory External">E</TableHead>
                          <TableHead className="text-center" title="Theory Mid-Sem">M</TableHead>
                          <TableHead className="text-center" title="Practical Internal">I</TableHead>
                          <TableHead className="text-center" title="Practical External/Viva">V</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {semRes.subjectResults?.map((sr: any) => {
                          const badgeColor = getGradeBadgeColor(sr.grade);
                          return (
                            <TableRow key={sr.id}>
                              <TableCell className="font-mono font-bold text-primary text-xs">
                                {sr.subject.subjectCode}
                              </TableCell>
                              <TableCell className="font-medium text-foreground text-xs">
                                {sr.subject.subjectName}
                              </TableCell>
                              <TableCell className="text-center text-xs font-mono">
                                {sr.subject.credits?.toFixed(1)}
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded font-bold text-xs border ${badgeColor.bg} ${badgeColor.border}`}
                                >
                                  {sr.grade}
                                </span>
                              </TableCell>
                              <TableCell className="text-center font-mono text-xs font-semibold">
                                {sr.eIndicator || "-"}
                              </TableCell>
                              <TableCell className="text-center font-mono text-xs font-semibold">
                                {sr.mIndicator || "-"}
                              </TableCell>
                              <TableCell className="text-center font-mono text-xs font-semibold">
                                {sr.iIndicator || "-"}
                              </TableCell>
                              <TableCell className="text-center font-mono text-xs font-semibold">
                                {sr.vIndicator || "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                {sr.isBacklog ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                                    <AlertTriangle className="h-3 w-3" />
                                    BACKLOG
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 className="h-3 w-3" />
                                    CLEARED
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
