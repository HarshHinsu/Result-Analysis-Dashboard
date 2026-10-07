import { describe, it, expect } from 'vitest';
import {
  LoginSchema,
  StudentSchema,
  BranchSchema,
  SubjectSchema,
  SemesterResultSchema,
} from '@/lib/validations';

describe('Zod Validation Schemas', () => {
  it('should validate valid and invalid Login credentials', () => {
    expect(LoginSchema.safeParse({ username: 'admin', password: 'password123' }).success).toBe(true);
    expect(LoginSchema.safeParse({ username: '', password: 'password123' }).success).toBe(false);
    expect(LoginSchema.safeParse({ username: 'admin', password: '' }).success).toBe(false);
  });

  it('should validate Student creation schemas correctly', () => {
    const validStudent = {
      enrollmentNumber: '216170307001',
      fullName: 'Aarav Patel',
      branchId: 'branch-uuid-1',
      admissionYear: 2021,
      batch: '2021-2024',
      active: true,
    };
    expect(StudentSchema.safeParse(validStudent).success).toBe(true);

    // Invalid: enrollment too short
    expect(
      StudentSchema.safeParse({
        ...validStudent,
        enrollmentNumber: '12',
      }).success
    ).toBe(false);

    // Invalid: missing branchId
    expect(
      StudentSchema.safeParse({
        ...validStudent,
        branchId: '',
      }).success
    ).toBe(false);
  });

  it('should validate Subject creation schema', () => {
    const validSubject = {
      subjectCode: '3330701',
      subjectName: 'Data Structures',
      semesterId: 'sem-3',
      credits: 5.0,
      active: true,
    };
    expect(SubjectSchema.safeParse(validSubject).success).toBe(true);

    // Invalid: 0 credits
    expect(
      SubjectSchema.safeParse({
        ...validSubject,
        credits: 0,
      }).success
    ).toBe(false);
  });

  it('should validate Branch creation schema', () => {
    expect(
      BranchSchema.safeParse({
        code: 'IT',
        name: 'Information Technology',
        active: true,
      }).success
    ).toBe(true);

    // Invalid: empty code
    expect(
      BranchSchema.safeParse({
        code: '',
        name: 'Information Technology',
        active: true,
      }).success
    ).toBe(false);
  });
});
