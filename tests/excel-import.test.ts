import { describe, it, expect } from 'vitest';
import {
  autoDetectColumnMapping,
  validateExcelRows,
  generateSampleExcelWorkbook,
  parseExcelBuffer,
} from '@/lib/imports/excel-validator';

describe('Excel Import and Validation Engine', () => {
  it('should auto-detect column headers from common GTU variations', () => {
    const headers = [
      'Enrollment No',
      'Seat No',
      'Student Name',
      'Branch',
      'Semester',
      'Subject Code',
      'Grade',
      'E',
      'M',
      'I',
      'V',
      'SPI',
      'CPI',
      'CGPA',
    ];

    const mapping = autoDetectColumnMapping(headers);

    expect(mapping.enrollmentNumber).toBe('Enrollment No');
    expect(mapping.seatNumber).toBe('Seat No');
    expect(mapping.studentName).toBe('Student Name');
    expect(mapping.branch).toBe('Branch');
    expect(mapping.semester).toBe('Semester');
    expect(mapping.subjectCode).toBe('Subject Code');
    expect(mapping.grade).toBe('Grade');
    expect(mapping.spi).toBe('SPI');
    expect(mapping.cpi).toBe('CPI');
  });

  it('should validate valid data rows accurately', () => {
    const rows = [
      {
        'Enrollment No': '216170307001',
        'Student Name': 'Aarav Patel',
        'Branch': 'IT',
        'Semester': 3,
        'Subject Code': '3330701',
        'Grade': 'AA',
        'SPI': 9.5,
      },
    ];

    const mapping = {
      enrollmentNumber: 'Enrollment No',
      studentName: 'Student Name',
      branch: 'Branch',
      semester: 'Semester',
      subjectCode: 'Subject Code',
      grade: 'Grade',
      spi: 'SPI',
    };

    const report = validateExcelRows(rows, mapping as any);
    expect(report.totalRows).toBe(1);
    expect(report.validRows).toBe(1);
    expect(report.invalidRows).toBe(0);
    expect(report.parsedRecords[0].isValid).toBe(true);
    expect(report.parsedRecords[0].data.grade).toBe('AA');
  });

  it('should flag errors on malformed enrollment numbers, missing grades, and invalid semesters', () => {
    const rows = [
      {
        'Enrollment No': '12', // Too short
        'Student Name': '', // Missing name
        'Branch': 'IT',
        'Semester': 9, // Invalid sem > 6
        'Subject Code': '3330701',
        'Grade': 'ZZ', // Invalid grade
      },
    ];

    const mapping = {
      enrollmentNumber: 'Enrollment No',
      studentName: 'Student Name',
      branch: 'Branch',
      semester: 'Semester',
      subjectCode: 'Subject Code',
      grade: 'Grade',
    };

    const report = validateExcelRows(rows, mapping as any);
    expect(report.totalRows).toBe(1);
    expect(report.invalidRows).toBe(1);
    expect(report.validRows).toBe(0);
    expect(report.parsedRecords[0].isValid).toBe(false);
    expect(report.errors.length).toBeGreaterThan(0);
  });

  it('should generate and parse sample GTU workbook properly', () => {
    const sampleBuffer = generateSampleExcelWorkbook();
    expect(sampleBuffer.length).toBeGreaterThan(100);

    const { headers, rows } = parseExcelBuffer(sampleBuffer.buffer as any);
    expect(headers).toContain('Enrollment No');
    expect(headers).toContain('Student Name');
    expect(rows.length).toBe(3);
  });
});
