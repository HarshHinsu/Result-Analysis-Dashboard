import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username or Email is required').trim(),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const StudentSchema = z.object({
  enrollmentNumber: z
    .string()
    .min(5, 'Enrollment number must be at least 5 characters')
    .max(20, 'Enrollment number cannot exceed 20 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Enrollment number must be alphanumeric')
    .trim(),
  seatNumber: z.string().max(20).optional().nullable(),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .trim(),
  branchId: z.string().min(1, 'Branch selection is required'),
  batch: z.string().max(20).optional().nullable(),
  admissionYear: z.coerce.number().int().min(2000).max(2050),
  active: z.boolean().default(true),
});
export type StudentInput = z.infer<typeof StudentSchema>;

export const BranchSchema = z.object({
  code: z
    .string()
    .min(1, 'Branch code is required')
    .max(10, 'Branch code cannot exceed 10 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Branch code must be alphanumeric')
    .toUpperCase()
    .trim(),
  name: z.string().min(2, 'Branch name is required').max(100).trim(),
  active: z.boolean().default(true),
});
export type BranchInput = z.infer<typeof BranchSchema>;

export const SubjectSchema = z.object({
  subjectCode: z
    .string()
    .min(2, 'Subject code is required')
    .max(20, 'Subject code cannot exceed 20 characters')
    .trim(),
  subjectName: z.string().min(2, 'Subject name is required').max(150).trim(),
  branchId: z.string().optional().nullable(),
  semesterId: z.string().min(1, 'Semester is required'),
  credits: z.coerce.number().min(0.5, 'Credits must be at least 0.5').max(20, 'Credits cannot exceed 20'),
  active: z.boolean().default(true),
});
export type SubjectInput = z.infer<typeof SubjectSchema>;

export const FacultySchema = z.object({
  name: z.string().min(2, 'Full name is required').max(100).trim(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, and underscores')
    .trim(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['ADMIN', 'FACULTY']).default('FACULTY'),
  active: z.boolean().default(true),
});
export type FacultyInput = z.infer<typeof FacultySchema>;

export const SubjectResultEntrySchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required'),
  grade: z.string().min(1, 'Grade is required').toUpperCase().trim(),
  eIndicator: z.string().max(5).optional().nullable(),
  mIndicator: z.string().max(5).optional().nullable(),
  iIndicator: z.string().max(5).optional().nullable(),
  vIndicator: z.string().max(5).optional().nullable(),
  isBacklog: z.boolean().default(false),
});

export const SemesterResultSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  semesterId: z.string().min(1, 'Semester is required'),
  academicYearId: z.string().min(1, 'Academic Year is required'),
  seatNumber: z.string().max(20).optional().nullable(),
  declarationDate: z.string().optional().nullable(),
  spi: z.coerce.number().min(0).max(10),
  cpi: z.coerce.number().min(0).max(10),
  cgpa: z.coerce.number().min(0).max(10),
  currentBacklog: z.coerce.number().int().min(0),
  totalBacklog: z.coerce.number().int().min(0),
  resultStatus: z.enum(['PASS', 'FAIL', 'WITHHELD']).default('PASS'),
  isCalculated: z.boolean().default(false),
  remarks: z.string().max(200).optional().nullable(),
  subjectResults: z.array(SubjectResultEntrySchema).min(1, 'At least one subject result is required'),
});
export type SemesterResultInput = z.infer<typeof SemesterResultSchema>;

export const CalculationConfigSchema = z.object({
  gradePoints: z.record(z.string(), z.number().min(0).max(10)),
  passingGrades: z.array(z.string()),
  failingGrades: z.array(z.string()),
  minimumPassingGradePoint: z.number().min(0).max(10),
  indicatorLabels: z.record(z.string(), z.string()),
  institutionSettings: z.object({
    institutionName: z.string().min(2),
    department: z.string().min(2),
    affiliation: z.string().min(2),
    reportFooter: z.string().optional(),
  }),
});
export type CalculationConfigInput = z.infer<typeof CalculationConfigSchema>;
