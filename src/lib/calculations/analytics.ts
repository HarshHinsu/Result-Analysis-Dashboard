import {
  DashboardKpiSummary,
  GradeDistributionItem,
  ScoreDistributionItem,
  SemesterTrendItem,
  BranchComparisonItem,
  SubjectPerformanceItem,
  StudentRankItem,
  SemesterResultWithDetails,
} from '@/types';

export const DEFAULT_GRADE_POINTS: Record<string, number> = {
  AA: 10,
  AB: 9,
  BB: 8,
  BC: 7,
  CC: 6,
  CD: 5,
  DD: 4,
  FF: 0,
  NA: 0,
  IF: 0,
  ABS: 0,
};

export const DEFAULT_PASSING_GRADES = ['AA', 'AB', 'BB', 'BC', 'CC', 'CD', 'DD'];
export const DEFAULT_FAILING_GRADES = ['FF', 'NA', 'IF', 'ABS'];

/**
 * Calculates SPI (Semester Performance Index) from an array of subject credits and grade points.
 * Formula: sum(Credits * GradePoint) / sum(Credits)
 */
export function calculateSPI(
  subjects: Array<{ credits: number; gradePoint: number; isBacklog?: boolean }>
): number {
  if (!subjects || subjects.length === 0) return 0.0;

  let totalCredits = 0;
  let totalWeightedPoints = 0;

  for (const sub of subjects) {
    const cred = sub.credits > 0 ? sub.credits : 1;
    totalCredits += cred;
    totalWeightedPoints += cred * (sub.gradePoint || 0);
  }

  if (totalCredits === 0) return 0.0;
  const spi = totalWeightedPoints / totalCredits;
  return Math.round(spi * 100) / 100;
}

/**
 * Calculates CPI (Cumulative Performance Index) across multiple semester results.
 */
export function calculateCPI(
  semesterHistory: Array<{ spi: number; totalCredits?: number }>
): number {
  if (!semesterHistory || semesterHistory.length === 0) return 0.0;

  let totalCredits = 0;
  let totalWeightedSpi = 0;

  for (const sem of semesterHistory) {
    const cred = sem.totalCredits && sem.totalCredits > 0 ? sem.totalCredits : 20; // Default assumed standard sem credits
    totalCredits += cred;
    totalWeightedSpi += sem.spi * cred;
  }

  if (totalCredits === 0) return 0.0;
  const cpi = totalWeightedSpi / totalCredits;
  return Math.round(cpi * 100) / 100;
}

/**
 * Calculates high-level KPI card metrics for the dashboard.
 */
export function calculateDashboardKPIs(
  results: SemesterResultWithDetails[],
  totalStudentsInScope: number
): DashboardKpiSummary {
  if (!results || results.length === 0) {
    return {
      totalStudents: totalStudentsInScope,
      averageSpi: 0,
      averageCpi: 0,
      averageCgpa: 0,
      passPercentage: 0,
      totalBacklogs: 0,
      clearPassCount: 0,
      backlogStudentCount: 0,
    };
  }

  let sumSpi = 0;
  let sumCpi = 0;
  let sumCgpa = 0;
  let passCount = 0;
  let totalBacklogs = 0;
  const studentBacklogMap = new Map<string, number>();

  for (const r of results) {
    sumSpi += r.spi || 0;
    sumCpi += r.cpi || 0;
    sumCgpa += r.cgpa || 0;

    const hasBacklog = (r.currentBacklog && r.currentBacklog > 0) || r.resultStatus === 'FAIL';
    if (!hasBacklog && r.resultStatus === 'PASS') {
      passCount++;
    }

    const backlogs = r.currentBacklog || 0;
    totalBacklogs += backlogs;
    studentBacklogMap.set(r.studentId, (studentBacklogMap.get(r.studentId) || 0) + backlogs);
  }

  const n = results.length;
  const uniqueStudents = new Set(results.map((r) => r.studentId)).size;
  const displayStudentCount = totalStudentsInScope > 0 ? totalStudentsInScope : uniqueStudents;

  let backlogStudentCount = 0;
  studentBacklogMap.forEach((bCount) => {
    if (bCount > 0) backlogStudentCount++;
  });

  return {
    totalStudents: displayStudentCount,
    averageSpi: Math.round((sumSpi / n) * 100) / 100,
    averageCpi: Math.round((sumCpi / n) * 100) / 100,
    averageCgpa: Math.round((sumCgpa / n) * 100) / 100,
    passPercentage: Math.round((passCount / n) * 1000) / 10,
    totalBacklogs,
    clearPassCount: passCount,
    backlogStudentCount,
  };
}

/**
 * Calculates grade distribution counts and percentages.
 */
export function calculateGradeDistribution(
  subjectResults: Array<{ grade: string }>
): GradeDistributionItem[] {
  const standardGrades = ['AA', 'AB', 'BB', 'BC', 'CC', 'CD', 'DD', 'FF'];
  const counts: Record<string, number> = {};
  for (const g of standardGrades) counts[g] = 0;

  let total = 0;
  for (const sr of subjectResults) {
    const g = (sr.grade || 'FF').toUpperCase().trim();
    counts[g] = (counts[g] || 0) + 1;
    total++;
  }

  return standardGrades.map((grade) => ({
    grade,
    count: counts[grade] || 0,
    percentage: total > 0 ? Math.round(((counts[grade] || 0) / total) * 1000) / 10 : 0,
  }));
}

/**
 * Calculates score range histograms (e.g. for SPI/CPI distribution: 9-10, 8-9, 7-8, 6-7, 5-6, <5).
 */
export function calculateScoreDistribution(
  scores: number[],
  bins = [
    { label: '9.0 - 10.0', min: 9.0, max: 10.0 },
    { label: '8.0 - 8.99', min: 8.0, max: 8.999 },
    { label: '7.0 - 7.99', min: 7.0, max: 7.999 },
    { label: '6.0 - 6.99', min: 6.0, max: 6.999 },
    { label: '5.0 - 5.99', min: 5.0, max: 5.999 },
    { label: 'Below 5.0', min: 0.0, max: 4.999 },
  ]
): ScoreDistributionItem[] {
  const counts = bins.map((b) => ({ range: b.label, count: 0 }));

  for (const score of scores) {
    if (score === null || score === undefined || isNaN(score)) continue;
    const rounded = Math.round(score * 100) / 100;
    for (let i = 0; i < bins.length; i++) {
      if (rounded >= bins[i].min && rounded <= bins[i].max) {
        counts[i].count++;
        break;
      }
    }
  }

  return counts;
}

/**
 * Calculates backlog distribution (0 backlogs, 1 backlog, 2 backlogs, 3+ backlogs).
 */
export function calculateBacklogDistribution(results: Array<{ currentBacklog: number }>): Array<{ range: string; count: number }> {
  const buckets = [
    { range: '0 (Clear)', count: 0 },
    { range: '1 Backlog', count: 0 },
    { range: '2 Backlogs', count: 0 },
    { range: '3+ Backlogs', count: 0 },
  ];

  for (const r of results) {
    const b = r.currentBacklog || 0;
    if (b === 0) buckets[0].count++;
    else if (b === 1) buckets[1].count++;
    else if (b === 2) buckets[2].count++;
    else buckets[3].count++;
  }

  return buckets;
}

/**
 * Calculates trend across semesters 1 to 6.
 */
export function calculateSemesterTrends(
  results: SemesterResultWithDetails[]
): SemesterTrendItem[] {
  const semMap = new Map<number, { sumSpi: number; sumCpi: number; sumCgpa: number; passCount: number; backlogs: number; total: number; name: string }>();

  for (let sem = 1; sem <= 6; sem++) {
    semMap.set(sem, { sumSpi: 0, sumCpi: 0, sumCgpa: 0, passCount: 0, backlogs: 0, total: 0, name: `Sem ${sem}` });
  }

  for (const r of results) {
    const semNum = r.semester.number;
    const existing = semMap.get(semNum) || {
      sumSpi: 0,
      sumCpi: 0,
      sumCgpa: 0,
      passCount: 0,
      backlogs: 0,
      total: 0,
      name: r.semester.name || `Sem ${semNum}`,
    };

    existing.sumSpi += r.spi || 0;
    existing.sumCpi += r.cpi || 0;
    existing.sumCgpa += r.cgpa || 0;
    if (r.resultStatus === 'PASS' && (r.currentBacklog || 0) === 0) {
      existing.passCount++;
    }
    existing.backlogs += r.currentBacklog || 0;
    existing.total++;
    semMap.set(semNum, existing);
  }

  const trends: SemesterTrendItem[] = [];
  semMap.forEach((val, semNum) => {
    trends.push({
      semesterNumber: semNum,
      semesterName: val.name,
      averageSpi: val.total > 0 ? Math.round((val.sumSpi / val.total) * 100) / 100 : 0,
      averageCpi: val.total > 0 ? Math.round((val.sumCpi / val.total) * 100) / 100 : 0,
      averageCgpa: val.total > 0 ? Math.round((val.sumCgpa / val.total) * 100) / 100 : 0,
      passPercentage: val.total > 0 ? Math.round((val.passCount / val.total) * 1000) / 10 : 0,
      totalStudents: val.total,
      backlogCount: val.backlogs,
    });
  });

  return trends.sort((a, b) => a.semesterNumber - b.semesterNumber);
}

/**
 * Calculates comparative statistics across branches.
 */
export function calculateBranchComparison(
  results: SemesterResultWithDetails[],
  branches: Array<{ id: string; code: string; name: string }>
): BranchComparisonItem[] {
  const branchMap = new Map<string, { sumSpi: number; sumCpi: number; passCount: number; totalBacklogs: number; count: number; name: string }>();

  for (const b of branches) {
    branchMap.set(b.code, { sumSpi: 0, sumCpi: 0, passCount: 0, totalBacklogs: 0, count: 0, name: b.name });
  }

  for (const r of results) {
    const code = r.student.branch.code;
    const existing = branchMap.get(code) || {
      sumSpi: 0,
      sumCpi: 0,
      passCount: 0,
      totalBacklogs: 0,
      count: 0,
      name: r.student.branch.name || code,
    };

    existing.sumSpi += r.spi || 0;
    existing.sumCpi += r.cpi || 0;
    if (r.resultStatus === 'PASS' && (r.currentBacklog || 0) === 0) {
      existing.passCount++;
    }
    existing.totalBacklogs += r.currentBacklog || 0;
    existing.count++;
    branchMap.set(code, existing);
  }

  const comparison: BranchComparisonItem[] = [];
  branchMap.forEach((val, code) => {
    comparison.push({
      branchCode: code,
      branchName: val.name,
      studentCount: val.count,
      averageSpi: val.count > 0 ? Math.round((val.sumSpi / val.count) * 100) / 100 : 0,
      averageCpi: val.count > 0 ? Math.round((val.sumCpi / val.count) * 100) / 100 : 0,
      passPercentage: val.count > 0 ? Math.round((val.passCount / val.count) * 1000) / 10 : 0,
      totalBacklogs: val.totalBacklogs,
    });
  });

  return comparison;
}

/**
 * Calculates per-subject analytics and grade breakdown.
 */
export function calculateSubjectPerformance(
  results: SemesterResultWithDetails[]
): SubjectPerformanceItem[] {
  const subjectMap = new Map<string, {
    subjectCode: string;
    subjectName: string;
    credits: number;
    semesterNumber: number;
    totalAppeared: number;
    passCount: number;
    failCount: number;
    gradePointsSum: number;
    gradeDist: Record<string, number>;
  }>();

  for (const r of results) {
    for (const sr of r.subjectResults) {
      const key = sr.subject.subjectCode;
      const existing = subjectMap.get(key) || {
        subjectCode: sr.subject.subjectCode,
        subjectName: sr.subject.subjectName,
        credits: sr.subject.credits,
        semesterNumber: r.semester.number,
        totalAppeared: 0,
        passCount: 0,
        failCount: 0,
        gradePointsSum: 0,
        gradeDist: { AA: 0, AB: 0, BB: 0, BC: 0, CC: 0, CD: 0, DD: 0, FF: 0 },
      };

      existing.totalAppeared++;
      const g = (sr.grade || 'FF').toUpperCase().trim();
      existing.gradeDist[g] = (existing.gradeDist[g] || 0) + 1;

      if (sr.isBacklog || DEFAULT_FAILING_GRADES.includes(g)) {
        existing.failCount++;
      } else {
        existing.passCount++;
      }

      existing.gradePointsSum += (sr.gradePoint ?? DEFAULT_GRADE_POINTS[g] ?? 0);
      subjectMap.set(key, existing);
    }
  }

  const items: SubjectPerformanceItem[] = [];
  subjectMap.forEach((v) => {
    items.push({
      subjectCode: v.subjectCode,
      subjectName: v.subjectName,
      credits: v.credits,
      semesterNumber: v.semesterNumber,
      totalAppeared: v.totalAppeared,
      passCount: v.passCount,
      failCount: v.failCount,
      passPercentage: v.totalAppeared > 0 ? Math.round((v.passCount / v.totalAppeared) * 1000) / 10 : 0,
      averageGradePoint: v.totalAppeared > 0 ? Math.round((v.gradePointsSum / v.totalAppeared) * 100) / 100 : 0,
      gradeDistribution: v.gradeDist,
    });
  });

  return items.sort((a, b) => b.totalAppeared - a.totalAppeared);
}

/**
 * Calculates ranked student leaderboard with metric ordering.
 */
export function calculateStudentRankings(
  results: SemesterResultWithDetails[],
  metric: 'SPI' | 'CPI' | 'CGPA' = 'SPI'
): StudentRankItem[] {
  // Deduplicate by studentId, keeping highest/latest result if multiple
  const studentMap = new Map<string, SemesterResultWithDetails>();
  for (const r of results) {
    const existing = studentMap.get(r.studentId);
    if (!existing) {
      studentMap.set(r.studentId, r);
    } else {
      // Pick higher metric
      const curScore = r[metric.toLowerCase() as 'spi' | 'cpi' | 'cgpa'] || 0;
      const prevScore = existing[metric.toLowerCase() as 'spi' | 'cpi' | 'cgpa'] || 0;
      if (curScore > prevScore) {
        studentMap.set(r.studentId, r);
      }
    }
  }

  const items: StudentRankItem[] = [];
  studentMap.forEach((r) => {
    items.push({
      rank: 0,
      studentId: r.studentId,
      enrollmentNumber: r.student.enrollmentNumber,
      seatNumber: r.seatNumber || r.student.seatNumber,
      fullName: r.student.fullName,
      branchCode: r.student.branch.code,
      branchName: r.student.branch.name,
      batch: r.student.batch,
      spi: r.spi || 0,
      cpi: r.cpi || 0,
      cgpa: r.cgpa || 0,
      currentBacklog: r.currentBacklog || 0,
      totalBacklog: r.totalBacklog || 0,
      resultStatus: r.resultStatus,
    });
  });

  // Sort by requested metric descending, then by backlogs ascending, then by name
  items.sort((a, b) => {
    const metricValA = a[metric.toLowerCase() as 'spi' | 'cpi' | 'cgpa'];
    const metricValB = b[metric.toLowerCase() as 'spi' | 'cpi' | 'cgpa'];
    if (metricValB !== metricValA) return metricValB - metricValA;
    if (a.currentBacklog !== b.currentBacklog) return a.currentBacklog - b.currentBacklog;
    return a.fullName.localeCompare(b.fullName);
  });

  // Assign ranks
  return items.map((item, idx) => ({ ...item, rank: idx + 1 }));
}
