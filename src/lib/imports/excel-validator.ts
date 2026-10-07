import * as XLSX from 'xlsx';
import {
  ColumnMappingConfig,
  ExcelRowValidationResult,
  ImportValidationSummary,
} from '@/types';
import { DEFAULT_PASSING_GRADES, DEFAULT_FAILING_GRADES } from '@/lib/calculations/analytics';

export const ALLOWED_GRADES = ['AA', 'AB', 'BB', 'BC', 'CC', 'CD', 'DD', 'FF', 'NA', 'IF', 'ABS'];

/**
 * Standard default column header candidates for auto-mapping
 */
export const HEADER_SYNONYMS: Record<keyof ColumnMappingConfig, string[]> = {
  studentName: ['student name', 'name', 'student_name', 'full name', 'fullname', 'candidate name'],
  enrollmentNumber: ['enrollment number', 'enrollment no', 'enrollment_no', 'enrollment', 'enrolment no', 'enrolment number', 'enr_no', 'roll no'],
  seatNumber: ['seat number', 'seat no', 'seat_no', 'seat', 'exam seat no'],
  branch: ['branch', 'branch name', 'branch code', 'dept', 'department', 'course'],
  semester: ['semester', 'sem', 'semester number', 'sem_no', 'term'],
  academicYear: ['academic year', 'academic_year', 'ay', 'year', 'session'],
  subjectCode: ['subject code', 'subject_code', 'sub code', 'sub_code', 'course code', 'paper code'],
  grade: ['grade', 'subject grade', 'sub_grade', 'final grade'],
  eIndicator: ['e', 'e indicator', 'e_indicator', 'ext', 'external'],
  mIndicator: ['m', 'm indicator', 'm_indicator', 'mid', 'mid_sem'],
  iIndicator: ['i', 'i indicator', 'i_indicator', 'int', 'internal'],
  vIndicator: ['v', 'v indicator', 'v_indicator', 'viva', 'practical'],
  spi: ['spi', 'spi score', 'sem spi', 'semester performance index'],
  cpi: ['cpi', 'cpi score', 'cumulative performance index'],
  cgpa: ['cgpa', 'cgpa score', 'cumulative grade point average'],
  currentBacklog: ['current backlog', 'current backlogs', 'cur_back', 'current_backlog', 'cur backlog', 'bc_curr'],
  totalBacklog: ['total backlog', 'total backlogs', 'tot_back', 'total_backlog', 'tot backlog', 'bc_tot'],
  declarationDate: ['declaration date', 'declaration_date', 'result date', 'date', 'declared_on'],
};

/**
 * Suggests best column mappings given the uploaded sheet headers.
 */
export function autoDetectColumnMapping(headers: string[]): ColumnMappingConfig {
  const normalizedHeaders = headers.map((h) => ({
    original: h,
    clean: h.toLowerCase().trim().replace(/[_\-.]+/g, ' '),
  }));

  const mapping: Partial<ColumnMappingConfig> = {};

  (Object.keys(HEADER_SYNONYMS) as Array<keyof ColumnMappingConfig>).forEach((field) => {
    const synonyms = HEADER_SYNONYMS[field];
    for (const { original, clean } of normalizedHeaders) {
      if (synonyms.some((syn) => clean === syn || clean.includes(syn))) {
        mapping[field] = original;
        break;
      }
    }
  });

  return {
    studentName: mapping.studentName || '',
    enrollmentNumber: mapping.enrollmentNumber || '',
    seatNumber: mapping.seatNumber || '',
    branch: mapping.branch || '',
    semester: mapping.semester || '',
    academicYear: mapping.academicYear || '',
    subjectCode: mapping.subjectCode || '',
    grade: mapping.grade || '',
    eIndicator: mapping.eIndicator || '',
    mIndicator: mapping.mIndicator || '',
    iIndicator: mapping.iIndicator || '',
    vIndicator: mapping.vIndicator || '',
    spi: mapping.spi || '',
    cpi: mapping.cpi || '',
    cgpa: mapping.cgpa || '',
    currentBacklog: mapping.currentBacklog || '',
    totalBacklog: mapping.totalBacklog || '',
    declarationDate: mapping.declarationDate || '',
  };
}

/**
 * Reads binary Excel buffer and returns array of raw row objects and headers.
 */
export function parseExcelBuffer(buffer: ArrayBuffer | Buffer): { headers: string[]; rows: any[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded Excel file contains no worksheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  if (rawRows.length === 0) {
    throw new Error('The worksheet is empty. Please upload a spreadsheet with data rows.');
  }

  // Extract all unique headers across rows
  const headersSet = new Set<string>();
  rawRows.forEach((row) => {
    Object.keys(row).forEach((k) => headersSet.add(k));
  });

  return {
    headers: Array.from(headersSet),
    rows: rawRows,
  };
}

/**
 * Validates extracted rows against system rules and column mapping.
 */
export function validateExcelRows(
  rows: any[],
  mapping: ColumnMappingConfig,
  validBranches: { id: string; code: string; name: string }[] = [],
  validSubjects: { id: string; subjectCode: string }[] = []
): ImportValidationSummary {
  const validBranchCodes = new Set(validBranches.map((b) => b.code.toUpperCase()));
  const validSubjectCodes = new Set(validSubjects.map((s) => s.subjectCode.toUpperCase()));

  const parsedRecords: ExcelRowValidationResult[] = [];
  const errorsList: ImportValidationSummary['errors'] = [];

  let validCount = 0;
  let warningCount = 0;
  let invalidCount = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // Accounting for 1-based index + header row
    const rowErrors: string[] = [];
    const rowWarnings: string[] = [];

    // Extract mapped fields
    const studentName = String(row[mapping.studentName] || '').trim();
    const enrollmentNumber = String(row[mapping.enrollmentNumber] || '').trim();
    const seatNumber = mapping.seatNumber ? String(row[mapping.seatNumber] || '').trim() : undefined;
    const branchRaw = String(row[mapping.branch] || '').trim().toUpperCase();
    const semesterRaw = row[mapping.semester];
    const academicYear = mapping.academicYear ? String(row[mapping.academicYear] || '').trim() : undefined;
    const subjectCode = String(row[mapping.subjectCode] || '').trim().toUpperCase();
    const grade = String(row[mapping.grade] || '').trim().toUpperCase();

    const eIndicator = mapping.eIndicator ? String(row[mapping.eIndicator] || '').trim().toUpperCase() : undefined;
    const mIndicator = mapping.mIndicator ? String(row[mapping.mIndicator] || '').trim().toUpperCase() : undefined;
    const iIndicator = mapping.iIndicator ? String(row[mapping.iIndicator] || '').trim().toUpperCase() : undefined;
    const vIndicator = mapping.vIndicator ? String(row[mapping.vIndicator] || '').trim().toUpperCase() : undefined;

    const spiRaw = mapping.spi ? row[mapping.spi] : undefined;
    const cpiRaw = mapping.cpi ? row[mapping.cpi] : undefined;
    const cgpaRaw = mapping.cgpa ? row[mapping.cgpa] : undefined;
    const curBackRaw = mapping.currentBacklog ? row[mapping.currentBacklog] : undefined;
    const totBackRaw = mapping.totalBacklog ? row[mapping.totalBacklog] : undefined;
    const declarationDate = mapping.declarationDate ? String(row[mapping.declarationDate] || '').trim() : undefined;

    // 1. Required field validations
    if (!studentName) {
      rowErrors.push('Student Name is missing');
    }
    if (!enrollmentNumber) {
      rowErrors.push('Enrollment Number is missing');
    } else if (!/^[A-Za-z0-9]{5,20}$/.test(enrollmentNumber)) {
      rowErrors.push(`Malformed Enrollment Number: "${enrollmentNumber}" (must be 5-20 alphanumeric characters)`);
    }

    if (!subjectCode) {
      rowErrors.push('Subject Code is missing');
    } else if (validSubjectCodes.size > 0 && !validSubjectCodes.has(subjectCode)) {
      rowWarnings.push(`Subject Code "${subjectCode}" will be auto-created for this branch/semester.`);
    }

    if (!grade) {
      rowErrors.push('Grade is missing');
    } else if (!ALLOWED_GRADES.includes(grade)) {
      rowErrors.push(`Invalid Grade: "${grade}". Allowed: ${ALLOWED_GRADES.join(', ')}`);
    }

    // 2. Semester validation (1 to 6)
    let semNumber = typeof semesterRaw === 'number' ? semesterRaw : parseInt(String(semesterRaw), 10);
    if (isNaN(semNumber) || semNumber < 1 || semNumber > 6) {
      rowErrors.push(`Invalid Semester "${semesterRaw}". Must be an integer between 1 and 6`);
      semNumber = 1;
    }

    // 3. Branch validation
    if (!branchRaw) {
      rowErrors.push('Branch is missing');
    } else if (validBranchCodes.size > 0 && !validBranchCodes.has(branchRaw)) {
      rowWarnings.push(`Branch "${branchRaw}" is not pre-registered; will be created on import.`);
    }

    // 4. Numeric fields validation (SPI, CPI, CGPA)
    const parseScore = (val: any, name: string): number | undefined => {
      if (val === undefined || val === null || val === '') return undefined;
      const num = parseFloat(String(val));
      if (isNaN(num) || num < 0 || num > 10) {
        rowErrors.push(`Invalid ${name} value "${val}" (must be between 0.0 and 10.0)`);
        return undefined;
      }
      return num;
    };

    const spi = parseScore(spiRaw, 'SPI');
    const cpi = parseScore(cpiRaw, 'CPI');
    const cgpa = parseScore(cgpaRaw, 'CGPA');

    // 5. Backlog counts
    const parseBacklog = (val: any, name: string): number | undefined => {
      if (val === undefined || val === null || val === '') return undefined;
      const num = parseInt(String(val), 10);
      if (isNaN(num) || num < 0) {
        rowErrors.push(`Invalid ${name} count "${val}" (must be a non-negative integer)`);
        return 0;
      }
      return num;
    };

    const currentBacklog = parseBacklog(curBackRaw, 'Current Backlog');
    const totalBacklog = parseBacklog(totBackRaw, 'Total Backlog');

    const isValid = rowErrors.length === 0;
    if (isValid) {
      if (rowWarnings.length > 0) {
        warningCount++;
      } else {
        validCount++;
      }
    } else {
      invalidCount++;
      rowErrors.forEach((msg) => {
        errorsList.push({
          rowNumber,
          message: msg,
          severity: 'ERROR',
          rawData: row,
        });
      });
    }

    if (rowWarnings.length > 0) {
      rowWarnings.forEach((msg) => {
        errorsList.push({
          rowNumber,
          message: msg,
          severity: 'WARNING',
          rawData: row,
        });
      });
    }

    parsedRecords.push({
      rowNumber,
      isValid,
      errors: rowErrors,
      warnings: rowWarnings,
      data: {
        studentName,
        enrollmentNumber,
        seatNumber,
        branchCode: branchRaw,
        semesterNumber: semNumber,
        academicYear,
        subjectCode,
        grade,
        eIndicator: eIndicator === 'Y' || eIndicator === '1' ? 'Y' : '',
        mIndicator: mIndicator === 'Y' || mIndicator === '1' ? 'Y' : '',
        iIndicator: iIndicator === 'Y' || iIndicator === '1' ? 'Y' : '',
        vIndicator: vIndicator === 'Y' || vIndicator === '1' ? 'Y' : '',
        spi,
        cpi,
        cgpa,
        currentBacklog,
        totalBacklog,
        declarationDate,
      },
    });
  });

  return {
    totalRows: rows.length,
    validRows: validCount + warningCount,
    warningRows: warningCount,
    invalidRows: invalidCount,
    errors: errorsList,
    parsedRecords,
  };
}

/**
 * Generates sample GTU-compliant Excel workbook buffer for template download.
 */
export function generateSampleExcelWorkbook(): Uint8Array {
  const sampleData = [
    {
      'Enrollment No': '216170307001',
      'Seat No': 'E21617001',
      'Student Name': 'Aarav K. Patel',
      'Branch': 'IT',
      'Semester': 3,
      'Academic Year': '2023-2024',
      'Subject Code': '3330701',
      'Grade': 'AA',
      'E': 'Y',
      'M': 'Y',
      'I': 'Y',
      'V': 'Y',
      'SPI': 9.64,
      'CPI': 9.45,
      'CGPA': 9.45,
      'Current Backlog': 0,
      'Total Backlog': 0,
      'Declaration Date': '2023-07-15',
    },
    {
      'Enrollment No': '216170307001',
      'Seat No': 'E21617001',
      'Student Name': 'Aarav K. Patel',
      'Branch': 'IT',
      'Semester': 3,
      'Academic Year': '2023-2024',
      'Subject Code': '3330702',
      'Grade': 'AA',
      'E': 'Y',
      'M': 'Y',
      'I': 'Y',
      'V': 'Y',
      'SPI': 9.64,
      'CPI': 9.45,
      'CGPA': 9.45,
      'Current Backlog': 0,
      'Total Backlog': 0,
      'Declaration Date': '2023-07-15',
    },
    {
      'Enrollment No': '216170307005',
      'Seat No': 'E21617005',
      'Student Name': 'Harshil R. Dave',
      'Branch': 'IT',
      'Semester': 3,
      'Academic Year': '2023-2024',
      'Subject Code': '3330701',
      'Grade': 'FF',
      'E': '',
      'M': '',
      'I': 'Y',
      'V': 'Y',
      'SPI': 3.18,
      'CPI': 5.40,
      'CGPA': 5.40,
      'Current Backlog': 2,
      'Total Backlog': 2,
      'Declaration Date': '2023-07-15',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Result_Data');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}
