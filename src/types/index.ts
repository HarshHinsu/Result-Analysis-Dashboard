export type UserRole = 'ADMIN' | 'FACULTY';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  role: UserRole;
}

export interface SessionData {
  user: AuthUser;
  expiresAt: number;
}

export type ResultStatusType = 'PASS' | 'FAIL' | 'WITHHELD';

export interface GradeDefinition {
  grade: string;
  gradePoint: number;
  isPassing: boolean;
  label?: string;
}

export interface CalculationConfigMap {
  gradePoints: Record<string, number>;
  passingGrades: string[];
  failingGrades: string[];
  minimumPassingGradePoint: number;
  indicatorLabels: Record<string, string>;
  institutionSettings: {
    institutionName: string;
    department: string;
    affiliation: string;
    reportFooter?: string;
  };
}

export interface StudentWithBranch {
  id: string;
  enrollmentNumber: string;
  seatNumber?: string | null;
  fullName: string;
  branchId: string;
  branch: {
    id: string;
    code: string;
    name: string;
  };
  batch?: string | null;
  admissionYear: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SemesterResultWithDetails {
  id: string;
  studentId: string;
  student: StudentWithBranch;
  semesterId: string;
  semester: {
    id: string;
    number: number;
    name: string;
  };
  academicYearId: string;
  academicYear: {
    id: string;
    name: string;
    isCurrent: boolean;
  };
  seatNumber?: string | null;
  declarationDate?: string | null;
  currentBacklog: number;
  totalBacklog: number;
  spi: number;
  cpi: number;
  cgpa: number;
  resultStatus: ResultStatusType;
  isCalculated: boolean;
  remarks?: string | null;
  subjectResults: Array<{
    id: string;
    subjectId: string;
    subject: {
      id: string;
      subjectCode: string;
      subjectName: string;
      credits: number;
    };
    grade: string;
    gradePoint?: number | null;
    eIndicator?: string | null;
    mIndicator?: string | null;
    iIndicator?: string | null;
    vIndicator?: string | null;
    isBacklog: boolean;
  }>;
}

export interface DashboardFilterParams {
  academicYearId?: string;
  semesterId?: string;
  branchId?: string;
  batch?: string;
}

export interface DashboardKpiSummary {
  totalStudents: number;
  averageSpi: number;
  averageCpi: number;
  averageCgpa: number;
  passPercentage: number;
  totalBacklogs: number;
  clearPassCount: number;
  backlogStudentCount: number;
}

export interface GradeDistributionItem {
  grade: string;
  count: number;
  percentage: number;
}

export interface ScoreDistributionItem {
  range: string;
  count: number;
}

export interface SemesterTrendItem {
  semesterNumber: number;
  semesterName: string;
  averageSpi: number;
  averageCpi: number;
  averageCgpa: number;
  passPercentage: number;
  totalStudents: number;
  backlogCount: number;
}

export interface BranchComparisonItem {
  branchCode: string;
  branchName: string;
  studentCount: number;
  averageSpi: number;
  averageCpi: number;
  passPercentage: number;
  totalBacklogs: number;
}

export interface SubjectPerformanceItem {
  subjectCode: string;
  subjectName: string;
  credits: number;
  branchCode?: string;
  semesterNumber: number;
  totalAppeared: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
  averageGradePoint: number;
  gradeDistribution: Record<string, number>;
}

export interface StudentRankItem {
  rank: number;
  studentId: string;
  enrollmentNumber: string;
  seatNumber?: string | null;
  fullName: string;
  branchCode: string;
  branchName: string;
  batch?: string | null;
  spi: number;
  cpi: number;
  cgpa: number;
  currentBacklog: number;
  totalBacklog: number;
  resultStatus: ResultStatusType;
}

export interface ColumnMappingConfig {
  studentName: string;
  enrollmentNumber: string;
  seatNumber?: string;
  branch: string;
  semester: string;
  academicYear?: string;
  subjectCode: string;
  grade: string;
  eIndicator?: string;
  mIndicator?: string;
  iIndicator?: string;
  vIndicator?: string;
  spi?: string;
  cpi?: string;
  cgpa?: string;
  currentBacklog?: string;
  totalBacklog?: string;
  declarationDate?: string;
}

export interface ExcelRowValidationResult {
  rowNumber: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: {
    studentName: string;
    enrollmentNumber: string;
    seatNumber?: string;
    branchCode: string;
    semesterNumber: number;
    academicYear?: string;
    subjectCode: string;
    grade: string;
    eIndicator?: string;
    mIndicator?: string;
    iIndicator?: string;
    vIndicator?: string;
    spi?: number;
    cpi?: number;
    cgpa?: number;
    currentBacklog?: number;
    totalBacklog?: number;
    declarationDate?: string;
  };
}

export interface ImportValidationSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  invalidRows: number;
  errors: Array<{
    rowNumber: number;
    message: string;
    severity: 'ERROR' | 'WARNING';
    rawData?: any;
  }>;
  parsedRecords: ExcelRowValidationResult[];
}
