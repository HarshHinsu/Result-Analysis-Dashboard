'use server';

import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/rbac';
import { logAuditEvent } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';
import { ExcelRowValidationResult } from '@/types';
import { DEFAULT_GRADE_POINTS, DEFAULT_FAILING_GRADES } from '@/lib/calculations/analytics';

export async function getImportHistoryAction() {
  await requireAuth();
  return prisma.importJob.findMany({
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      errors: {
        take: 20,
        orderBy: { rowNumber: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function executeExcelImportAction({
  records,
  fileName,
  fileSize,
  notes,
}: {
  records: ExcelRowValidationResult['data'][];
  fileName: string;
  fileSize: number;
  notes?: string;
}) {
  const user = await requireAuth();

  if (!records || records.length === 0) {
    return { error: 'No valid data rows provided for import.' };
  }

  // Pre-load reference maps
  const [branches, semesters, academicYears, calculationConfig] = await Promise.all([
    prisma.branch.findMany(),
    prisma.semester.findMany(),
    prisma.academicYear.findMany(),
    prisma.calculationConfig.findUnique({ where: { key: 'GRADE_POINTS_MAP' } }),
  ]);

  let gradePointsMap = DEFAULT_GRADE_POINTS;
  if (calculationConfig?.value) {
    try {
      gradePointsMap = JSON.parse(calculationConfig.value);
    } catch {
      // fallback
    }
  }

  const branchMap = new Map(branches.map((b) => [b.code.toUpperCase(), b]));
  const semMap = new Map(semesters.map((s) => [s.number, s]));
  const ayMap = new Map(academicYears.map((ay) => [ay.name, ay]));

  // Default fallback AY if not specified
  const defaultAY = academicYears.find((ay) => ay.isCurrent) || academicYears[0];

  // Group records by Student + Semester + AcademicYear to construct clean SemesterResults
  type GroupKey = string;
  const groups = new Map<
    GroupKey,
    {
      studentName: string;
      enrollmentNumber: string;
      seatNumber?: string;
      branchCode: string;
      semesterNumber: number;
      academicYearName: string;
      spi?: number;
      cpi?: number;
      cgpa?: number;
      currentBacklog?: number;
      totalBacklog?: number;
      declarationDate?: string;
      subjects: Array<{
        subjectCode: string;
        grade: string;
        eIndicator?: string;
        mIndicator?: string;
        iIndicator?: string;
        vIndicator?: string;
      }>;
    }
  >();

  for (const row of records) {
    const ayName = row.academicYear || defaultAY?.name || '2023-2024';
    const key = `${row.enrollmentNumber.trim().toUpperCase()}_${row.semesterNumber}_${ayName}`;

    let group = groups.get(key);
    if (!group) {
      group = {
        studentName: row.studentName,
        enrollmentNumber: row.enrollmentNumber.trim().toUpperCase(),
        seatNumber: row.seatNumber,
        branchCode: row.branchCode.trim().toUpperCase(),
        semesterNumber: row.semesterNumber,
        academicYearName: ayName,
        spi: row.spi,
        cpi: row.cpi,
        cgpa: row.cgpa,
        currentBacklog: row.currentBacklog,
        totalBacklog: row.totalBacklog,
        declarationDate: row.declarationDate,
        subjects: [],
      };
      groups.set(key, group);
    }

    // Avoid duplicate subject in same semester result
    if (!group.subjects.some((s) => s.subjectCode === row.subjectCode.trim().toUpperCase())) {
      group.subjects.push({
        subjectCode: row.subjectCode.trim().toUpperCase(),
        grade: row.grade.trim().toUpperCase(),
        eIndicator: row.eIndicator || '',
        mIndicator: row.mIndicator || '',
        iIndicator: row.iIndicator || '',
        vIndicator: row.vIndicator || '',
      });
    }
  }

  // Create Import Job Log
  const job = await prisma.importJob.create({
    data: {
      fileName,
      fileSize,
      uploadedById: user.id,
      totalRows: records.length,
      status: 'PROCESSING',
      notes: notes || `Bulk import of ${groups.size} student semester result sheets.`,
    },
  });

  let importedCount = 0;
  let failedCount = 0;
  const errorLogs: Array<{ rowNumber: number; message: string; severity: string }> = [];

  try {
    // Process each group inside database transaction
    await prisma.$transaction(async (tx) => {
      for (const [groupKey, group] of Array.from(groups.entries())) {
        try {
          // 1. Resolve or create Branch
          let branch = branchMap.get(group.branchCode);
          if (!branch) {
            branch = await tx.branch.create({
              data: {
                code: group.branchCode,
                name: `${group.branchCode} Engineering`,
                active: true,
              },
            });
            branchMap.set(group.branchCode, branch);
          }

          // 2. Resolve Semester
          let semester = semMap.get(group.semesterNumber);
          if (!semester) {
            semester = await tx.semester.create({
              data: {
                number: group.semesterNumber,
                name: `Semester ${group.semesterNumber}`,
                active: true,
              },
            });
            semMap.set(group.semesterNumber, semester);
          }

          // 3. Resolve Academic Year
          let ay = ayMap.get(group.academicYearName);
          if (!ay) {
            const startYear = parseInt(group.academicYearName.split('-')[0] || '2023', 10);
            ay = await tx.academicYear.create({
              data: {
                name: group.academicYearName,
                startYear: isNaN(startYear) ? 2023 : startYear,
                endYear: isNaN(startYear) ? 2024 : startYear + 1,
              },
            });
            ayMap.set(group.academicYearName, ay);
          }

          // 4. Resolve or create Student
          let student = await tx.student.findUnique({
            where: { enrollmentNumber: group.enrollmentNumber },
          });

          if (!student) {
            student = await tx.student.create({
              data: {
                enrollmentNumber: group.enrollmentNumber,
                seatNumber: group.seatNumber || null,
                fullName: group.studentName,
                branchId: branch.id,
                batch: '2021-2024',
                admissionYear: 2021,
                active: true,
              },
            });
          } else if (group.seatNumber && !student.seatNumber) {
            await tx.student.update({
              where: { id: student.id },
              data: { seatNumber: group.seatNumber },
            });
          }

          // 5. Calculate backlogs
          let backlogsCount = 0;
          group.subjects.forEach((s) => {
            if (DEFAULT_FAILING_GRADES.includes(s.grade)) {
              backlogsCount++;
            }
          });

          const currentBacklog = group.currentBacklog !== undefined ? group.currentBacklog : backlogsCount;
          const totalBacklog = group.totalBacklog !== undefined ? group.totalBacklog : currentBacklog;
          const resultStatus = currentBacklog > 0 ? 'FAIL' : 'PASS';

          // 6. Upsert Semester Result
          const semResult = await tx.semesterResult.upsert({
            where: {
              studentId_semesterId_academicYearId: {
                studentId: student.id,
                semesterId: semester.id,
                academicYearId: ay.id,
              },
            },
            update: {
              seatNumber: group.seatNumber || undefined,
              declarationDate: group.declarationDate || undefined,
              spi: group.spi !== undefined ? group.spi : 0.0,
              cpi: group.cpi !== undefined ? group.cpi : 0.0,
              cgpa: group.cgpa !== undefined ? group.cgpa : 0.0,
              currentBacklog,
              totalBacklog,
              resultStatus,
            },
            create: {
              studentId: student.id,
              semesterId: semester.id,
              academicYearId: ay.id,
              seatNumber: group.seatNumber || null,
              declarationDate: group.declarationDate || null,
              spi: group.spi !== undefined ? group.spi : 0.0,
              cpi: group.cpi !== undefined ? group.cpi : 0.0,
              cgpa: group.cgpa !== undefined ? group.cgpa : 0.0,
              currentBacklog,
              totalBacklog,
              resultStatus,
              isCalculated: false,
            },
          });

          // 7. Clear old subject results & create fresh
          await tx.subjectResult.deleteMany({
            where: { semesterResultId: semResult.id },
          });

          for (const subItem of group.subjects) {
            // Find or create Subject
            let subject = await tx.subject.findFirst({
              where: {
                subjectCode: subItem.subjectCode,
                branchId: branch.id,
                semesterId: semester.id,
              },
            });

            if (!subject) {
              subject = await tx.subject.create({
                data: {
                  subjectCode: subItem.subjectCode,
                  subjectName: `Subject ${subItem.subjectCode}`,
                  branchId: branch.id,
                  semesterId: semester.id,
                  credits: 4.0,
                  active: true,
                },
              });
            }

            const gp = gradePointsMap[subItem.grade] ?? 0;
            await tx.subjectResult.create({
              data: {
                semesterResultId: semResult.id,
                subjectId: subject.id,
                grade: subItem.grade,
                gradePoint: gp,
                eIndicator: subItem.eIndicator || '',
                mIndicator: subItem.mIndicator || '',
                iIndicator: subItem.iIndicator || '',
                vIndicator: subItem.vIndicator || '',
                isBacklog: DEFAULT_FAILING_GRADES.includes(subItem.grade),
              },
            });
          }

          importedCount += group.subjects.length;
        } catch (rowError: any) {
          failedCount++;
          errorLogs.push({
            rowNumber: 0,
            message: `Group ${groupKey} failed: ${rowError.message}`,
            severity: 'ERROR',
          });
        }
      }
    });

    // Finalize Job status
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        importedRows: importedCount,
        failedRows: failedCount,
        status: failedCount === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS',
        completedAt: new Date(),
      },
    });

    if (errorLogs.length > 0) {
      await prisma.importRowError.createMany({
        data: errorLogs.map((err) => ({
          importJobId: job.id,
          rowNumber: err.rowNumber,
          errorMessage: err.message,
          severity: err.severity,
        })),
      });
    }

    await logAuditEvent({
      userId: user.id,
      action: 'IMPORT_EXCEL',
      entity: 'ImportJob',
      entityId: job.id,
      details: { fileName, importedRows: importedCount, failedRows: failedCount },
    });

    revalidatePath('/imports');
    revalidatePath('/results');
    revalidatePath('/students');
    revalidatePath('/dashboard');

    return {
      success: true,
      jobId: job.id,
      importedCount,
      failedCount,
    };
  } catch (txError: any) {
    console.error('Import transaction error:', txError);
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        notes: `Import aborted: ${txError.message}`,
        completedAt: new Date(),
      },
    });
    return { error: `Transaction failed: ${txError.message}` };
  }
}
