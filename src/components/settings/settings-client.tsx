"use client";

import { useState, useTransition } from "react";
import { updateSystemConfigAction } from "@/server/actions/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  Settings,
  Sliders,
  ShieldCheck,
  Building2,
  FileCheck,
  Clock,
  Save,
  HelpCircle,
  History,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SettingsClientProps {
  initialConfigs: Record<string, any>;
  initialAuditLogs: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    details: string | null;
    ipAddress: string | null;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      username: string;
      role: string;
    } | null;
  }>;
}

export function SettingsClient({ initialConfigs, initialAuditLogs }: SettingsClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Institution Profile
  const [instSettings, setInstSettings] = useState(
    initialConfigs.INSTITUTION_SETTINGS || {
      institutionName: "L.E. College / Government Polytechnic",
      department: "Academic Examination Section",
      affiliation: "Gujarat Technological University (GTU)",
      reportFooter: "This is a computer-generated academic result analysis document for internal college review.",
    }
  );

  // Grade Points Mapping
  const [gradePoints, setGradePoints] = useState<Record<string, number>>(
    initialConfigs.GRADE_POINTS_MAP || {
      AA: 10,
      AB: 9,
      BB: 8,
      BC: 7,
      CC: 6,
      CD: 5,
      DD: 4,
      FF: 0,
    }
  );

  // Indicator Labels
  const [indicatorLabels, setIndicatorLabels] = useState<Record<string, string>>(
    initialConfigs.INDICATOR_LABELS || {
      E: "Theory External Examination / Exemption",
      M: "Theory Mid-Semester / Progressive Assessment",
      I: "Practical / Term Work Assessment",
      V: "Practical External / Viva Examination",
    }
  );

  const handleSaveInstitution = () => {
    startTransition(async () => {
      const res = await updateSystemConfigAction(
        "INSTITUTION_SETTINGS",
        instSettings,
        "Institution profile details displayed on reports and headers"
      );
      if (res.success) {
        toast({ title: "Institution Profile Saved", description: "Updated header details for reports." });
      }
    });
  };

  const handleSaveGradePoints = () => {
    startTransition(async () => {
      const res = await updateSystemConfigAction(
        "GRADE_POINTS_MAP",
        gradePoints,
        "Standard 10-point scale grade to point conversion rules"
      );
      if (res.success) {
        toast({ title: "Grading Scale Saved", description: "Configured grade-point mappings for SPI calculations." });
      }
    });
  };

  const handleSaveIndicators = () => {
    startTransition(async () => {
      const res = await updateSystemConfigAction(
        "INDICATOR_LABELS",
        indicatorLabels,
        "Explanatory labels for GTU E/M/I/V indicators"
      );
      if (res.success) {
        toast({ title: "Indicators Saved", description: "Configured descriptive labels for E/M/I/V flags." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            System Settings & Calculation Configuration
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure institutional profile, grading scale rules, result indicators, and view security audit trail.
          </p>
        </div>
      </div>

      <Tabs defaultValue="institution" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-[600px]">
          <TabsTrigger value="institution" className="gap-2 text-xs">
            <Building2 className="h-4 w-4" />
            Institution
          </TabsTrigger>
          <TabsTrigger value="grading" className="gap-2 text-xs">
            <Sliders className="h-4 w-4" />
            Grading Scale
          </TabsTrigger>
          <TabsTrigger value="indicators" className="gap-2 text-xs">
            <FileCheck className="h-4 w-4" />
            Indicators (E/M/I/V)
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2 text-xs">
            <History className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Institution Profile */}
        <TabsContent value="institution">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Institutional Profile</CardTitle>
              <CardDescription className="text-xs">
                These details are displayed on generated official PDF reports, transcripts, and header banners.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Institution / College Name</label>
                <Input
                  value={instSettings.institutionName || ""}
                  onChange={(e) => setInstSettings({ ...instSettings, institutionName: e.target.value })}
                  placeholder="e.g. L.E. College / Government Polytechnic"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Department / Examination Section</label>
                <Input
                  value={instSettings.department || ""}
                  onChange={(e) => setInstSettings({ ...instSettings, department: e.target.value })}
                  placeholder="e.g. Academic Examination Section"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">University Affiliation / Accreditation</label>
                <Input
                  value={instSettings.affiliation || ""}
                  onChange={(e) => setInstSettings({ ...instSettings, affiliation: e.target.value })}
                  placeholder="e.g. Gujarat Technological University (GTU)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Report Footer Disclaimer</label>
                <Input
                  value={instSettings.reportFooter || ""}
                  onChange={(e) => setInstSettings({ ...instSettings, reportFooter: e.target.value })}
                  placeholder="e.g. Internal college review report"
                />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button onClick={handleSaveInstitution} disabled={isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {isPending ? "Saving..." : "Save Institutional Profile"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab 2: Grading Scale */}
        <TabsContent value="grading">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Configurable Grading Points Scale</CardTitle>
              <CardDescription className="text-xs">
                Define the numerical grade point associated with each letter grade. These weights calculate the SPI/CPI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
                {Object.keys(gradePoints).map((grade) => (
                  <div key={grade} className="p-3 border rounded-lg bg-card flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-primary">{grade}</span>
                      <Badge variant={grade === "FF" ? "destructive" : "secondary"} className="text-[10px]">
                        {grade === "FF" ? "FAIL" : "PASS"}
                      </Badge>
                    </div>
                    <label className="text-[11px] text-muted-foreground">Grade Point (0-10)</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={gradePoints[grade]}
                      onChange={(e) =>
                        setGradePoints({
                          ...gradePoints,
                          [grade]: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-8 text-xs font-semibold"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button onClick={handleSaveGradePoints} disabled={isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {isPending ? "Saving..." : "Save Grading Configuration"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab 3: Indicators E/M/I/V */}
        <TabsContent value="indicators">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Result Component Indicators (E / M / I / V)</CardTitle>
              <CardDescription className="text-xs">
                Customize explanatory labels for the component evaluation columns shown in GTU result documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              {Object.keys(indicatorLabels).map((indicator) => (
                <div key={indicator} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {indicator}
                    </span>
                    <label className="text-xs font-semibold text-foreground">Indicator '{indicator}' Meaning</label>
                  </div>
                  <Input
                    value={indicatorLabels[indicator]}
                    onChange={(e) =>
                      setIndicatorLabels({
                        ...indicatorLabels,
                        [indicator]: e.target.value,
                      })
                    }
                    className="text-xs"
                  />
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button onClick={handleSaveIndicators} disabled={isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {isPending ? "Saving..." : "Save Indicator Labels"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab 4: Audit Logs */}
        <TabsContent value="audit">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">System Audit Trail</CardTitle>
              <CardDescription className="text-xs">
                Chronological security log of all sensitive modifications, logins, result entries, and imports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialAuditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No audit events recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialAuditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(log.createdAt)} {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {log.user ? (
                            <span className="text-foreground">
                              {log.user.name} <span className="text-muted-foreground">(@{log.user.username})</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {log.entity}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-md truncate" title={log.details || ""}>
                          {log.details || "-"}
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
