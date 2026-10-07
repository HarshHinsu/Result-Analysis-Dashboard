import { describe, it, expect } from 'vitest';
import {
  calculateSPI,
  calculateCPI,
  calculateDashboardKPIs,
  calculateGradeDistribution,
  calculateScoreDistribution,
  calculateBacklogDistribution,
  calculateStudentRankings,
} from '@/lib/calculations/analytics';

describe('Analytics Calculation Engine', () => {
  it('should calculate SPI accurately based on credits and grade points', () => {
    // 5 subjects: 4 credits AA (10), 4 credits AB (9), 3 credits BB (8), 4 credits AA (10), 2 credits CC (6)
    // Total points: 4*10 + 4*9 + 3*8 + 4*10 + 2*6 = 40 + 36 + 24 + 40 + 12 = 152
    // Total credits: 4 + 4 + 3 + 4 + 2 = 17
    // SPI = 152 / 17 = 8.9411... -> 8.94
    const subjects = [
      { credits: 4, gradePoint: 10 },
      { credits: 4, gradePoint: 9 },
      { credits: 3, gradePoint: 8 },
      { credits: 4, gradePoint: 10 },
      { credits: 2, gradePoint: 6 },
    ];

    const spi = calculateSPI(subjects);
    expect(spi).toBe(8.94);
  });

  it('should handle zero credits and empty subject array gracefully for SPI', () => {
    expect(calculateSPI([])).toBe(0.0);
    expect(calculateSPI([{ credits: 0, gradePoint: 10 }])).toBe(10.0); // Defaults to minimum weight
  });

  it('should calculate CPI accurately across semester records', () => {
    // Sem 1: SPI 8.5 (20 credits), Sem 2: SPI 9.0 (20 credits), Sem 3: SPI 7.5 (20 credits)
    // Total weighted: 8.5*20 + 9.0*20 + 7.5*20 = 170 + 180 + 150 = 500
    // Total credits: 60 -> CPI = 500 / 60 = 8.333... -> 8.33
    const history = [
      { spi: 8.5, totalCredits: 20 },
      { spi: 9.0, totalCredits: 20 },
      { spi: 7.5, totalCredits: 20 },
    ];

    const cpi = calculateCPI(history);
    expect(cpi).toBe(8.33);
  });

  it('should compute KPI summary correctly', () => {
    const mockResults: any[] = [
      {
        studentId: 'stud-1',
        spi: 9.0,
        cpi: 8.8,
        cgpa: 8.8,
        currentBacklog: 0,
        resultStatus: 'PASS',
      },
      {
        studentId: 'stud-2',
        spi: 8.0,
        cpi: 8.2,
        cgpa: 8.2,
        currentBacklog: 0,
        resultStatus: 'PASS',
      },
      {
        studentId: 'stud-3',
        spi: 4.5,
        cpi: 5.0,
        cgpa: 5.0,
        currentBacklog: 2,
        resultStatus: 'FAIL',
      },
    ];

    const kpis = calculateDashboardKPIs(mockResults, 3);
    expect(kpis.totalStudents).toBe(3);
    expect(kpis.averageSpi).toBe(7.17); // (9+8+4.5)/3 = 7.166...
    expect(kpis.passPercentage).toBe(66.7); // 2/3 = 66.666...
    expect(kpis.totalBacklogs).toBe(2);
    expect(kpis.clearPassCount).toBe(2);
    expect(kpis.backlogStudentCount).toBe(1);
  });

  it('should compute Grade Distribution accurately', () => {
    const grades = [
      { grade: 'AA' },
      { grade: 'AA' },
      { grade: 'AB' },
      { grade: 'BB' },
      { grade: 'FF' },
    ];

    const dist = calculateGradeDistribution(grades);
    const aaItem = dist.find((d) => d.grade === 'AA');
    const ffItem = dist.find((d) => d.grade === 'FF');

    expect(aaItem?.count).toBe(2);
    expect(aaItem?.percentage).toBe(40.0);
    expect(ffItem?.count).toBe(1);
    expect(ffItem?.percentage).toBe(20.0);
  });

  it('should rank students properly by chosen metric and tie-breakers', () => {
    const mockResults: any[] = [
      {
        studentId: 's1',
        student: { enrollmentNumber: 'EN001', fullName: 'B Student', branch: { code: 'IT', name: 'IT' } },
        spi: 8.5,
        cpi: 8.2,
        cgpa: 8.2,
        currentBacklog: 0,
        totalBacklog: 0,
        resultStatus: 'PASS',
      },
      {
        studentId: 's2',
        student: { enrollmentNumber: 'EN002', fullName: 'A Student', branch: { code: 'IT', name: 'IT' } },
        spi: 9.5,
        cpi: 9.2,
        cgpa: 9.2,
        currentBacklog: 0,
        totalBacklog: 0,
        resultStatus: 'PASS',
      },
      {
        studentId: 's3',
        student: { enrollmentNumber: 'EN003', fullName: 'C Student', branch: { code: 'IT', name: 'IT' } },
        spi: 8.5,
        cpi: 8.0,
        cgpa: 8.0,
        currentBacklog: 1, // Has 1 backlog, should rank after s1 on tie
        totalBacklog: 1,
        resultStatus: 'FAIL',
      },
    ];

    const rankings = calculateStudentRankings(mockResults, 'SPI');
    expect(rankings[0].enrollmentNumber).toBe('EN002');
    expect(rankings[0].rank).toBe(1);

    expect(rankings[1].enrollmentNumber).toBe('EN001');
    expect(rankings[1].rank).toBe(2);

    expect(rankings[2].enrollmentNumber).toBe('EN003');
    expect(rankings[2].rank).toBe(3);
  });

  it('should categorize score distribution into standard ranges', () => {
    const scores = [9.5, 9.1, 8.4, 7.8, 6.2, 5.5, 4.2];
    const dist = calculateScoreDistribution(scores);

    expect(dist[0].range).toBe('9.0 - 10.0');
    expect(dist[0].count).toBe(2);

    expect(dist[1].range).toBe('8.0 - 8.99');
    expect(dist[1].count).toBe(1);

    expect(dist[5].range).toBe('Below 5.0');
    expect(dist[5].count).toBe(1);
  });
});
