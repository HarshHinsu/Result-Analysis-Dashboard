import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Demo Database Seeding ---');

  // 1. Clean existing records in dependency order
  await prisma.importRowError.deleteMany({});
  await prisma.importJob.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.subjectResult.deleteMany({});
  await prisma.semesterResult.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.semester.deleteMany({});
  await prisma.academicYear.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.calculationConfig.deleteMany({});

  // 2. Users (Admin & Faculty)
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const facultyPasswordHash = await bcrypt.hash('faculty123', salt);
  const hodPasswordHash = await bcrypt.hash('hod123', salt);

  const adminUser = await prisma.user.create({
    data: {
      name: 'System Administrator',
      username: 'admin',
      email: 'admin@polytechnic.edu',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      active: true,
    },
  });

  const facultyUser = await prisma.user.create({
    data: {
      name: 'Prof. Rajesh Sharma (IT Faculty)',
      username: 'faculty',
      email: 'rajesh.sharma@polytechnic.edu',
      passwordHash: facultyPasswordHash,
      role: 'FACULTY',
      active: true,
    },
  });

  const hodUser = await prisma.user.create({
    data: {
      name: 'Dr. Anita Patel (HOD Electrical)',
      username: 'hod_ee',
      email: 'anita.patel@polytechnic.edu',
      passwordHash: hodPasswordHash,
      role: 'FACULTY',
      active: true,
    },
  });

  console.log('Seeded Users: admin, faculty, hod_ee');

  // 3. Branches
  const branchesData = [
    { code: 'IT', name: 'Information Technology' },
    { code: 'EE', name: 'Electrical Engineering' },
    { code: 'CE', name: 'Civil Engineering' },
    { code: 'ICT', name: 'Information and Communication Technology' },
    { code: 'ME', name: 'Mechanical Engineering' },
    { code: 'EC', name: 'Electronics & Communication Engineering' },
  ];

  const branchesMap: Record<string, string> = {};
  for (const b of branchesData) {
    const branch = await prisma.branch.create({ data: b });
    branchesMap[b.code] = branch.id;
  }
  console.log('Seeded Branches:', Object.keys(branchesMap).length);

  // 4. Semesters (1 to 6)
  const semestersMap: Record<number, string> = {};
  for (let i = 1; i <= 6; i++) {
    const sem = await prisma.semester.create({
      data: {
        number: i,
        name: `Semester ${i}`,
        active: true,
      },
    });
    semestersMap[i] = sem.id;
  }
  console.log('Seeded Semesters 1 through 6');

  // 5. Academic Years
  const ay2022 = await prisma.academicYear.create({
    data: { name: '2022-2023', startYear: 2022, endYear: 2023, isCurrent: false },
  });
  const ay2023 = await prisma.academicYear.create({
    data: { name: '2023-2024', startYear: 2023, endYear: 2024, isCurrent: true },
  });
  const ay2024 = await prisma.academicYear.create({
    data: { name: '2024-2025', startYear: 2024, endYear: 2025, isCurrent: false },
  });
  console.log('Seeded Academic Years');

  // 6. Calculation and System Configurations
  await prisma.calculationConfig.createMany({
    data: [
      {
        key: 'GRADE_POINTS_MAP',
        value: JSON.stringify({
          AA: 10,
          AB: 9,
          BB: 8,
          BC: 7,
          CC: 6,
          CD: 5,
          DD: 4,
          FF: 0,
        }),
        description: 'Standard GTU-style 10-point grading scale mapping',
      },
      {
        key: 'PASSING_CRITERIA',
        value: JSON.stringify({
          passingGrades: ['AA', 'AB', 'BB', 'BC', 'CC', 'CD', 'DD'],
          failingGrades: ['FF', 'NA', 'IF', 'ABS'],
          minimumPassingGradePoint: 4.0,
        }),
        description: 'Grades classified as clearing subject vs backlog',
      },
      {
        key: 'INDICATOR_LABELS',
        value: JSON.stringify({
          E: 'Theory External Examination / Exemption',
          M: 'Theory Mid-Semester / Progressive Assessment',
          I: 'Practical / Term Work Assessment',
          V: 'Practical External / Viva Examination',
        }),
        description: 'Configurable explanatory labels for GTU E/M/I/V result indicators',
      },
      {
        key: 'INSTITUTION_SETTINGS',
        value: JSON.stringify({
          institutionName: 'L.E. College / Government Polytechnic',
          department: 'Academic Examination Section',
          affiliation: 'Gujarat Technological University (GTU)',
          reportFooter: 'This is a computer-generated academic result analysis document for internal college review.',
        }),
        description: 'Institution details used in UI headers and PDF reports',
      },
    ],
  });
  console.log('Seeded Calculation Configurations');

  // 7. Subjects (IT, EE, CE, ICT)
  const subjectsData = [
    // IT Sem 1
    { subjectCode: 'DI01000011', subjectName: 'Mathematics-I', branchCode: 'IT', semester: 1, credits: 4.0 },
    { subjectCode: 'DI01000021', subjectName: 'Applied Physics', branchCode: 'IT', semester: 1, credits: 4.0 },
    { subjectCode: 'DI01000031', subjectName: 'Communication Skills in English', branchCode: 'IT', semester: 1, credits: 3.0 },
    { subjectCode: 'DI01000041', subjectName: 'Basics of Computer Systems', branchCode: 'IT', semester: 1, credits: 4.0 },
    { subjectCode: 'DI01000051', subjectName: 'Engineering Workshop', branchCode: 'IT', semester: 1, credits: 2.0 },

    // IT Sem 2
    { subjectCode: 'DI02000011', subjectName: 'Mathematics-II', branchCode: 'IT', semester: 2, credits: 4.0 },
    { subjectCode: 'DI02000021', subjectName: 'Programming in C', branchCode: 'IT', semester: 2, credits: 5.0 },
    { subjectCode: 'DI02000031', subjectName: 'Basic Electronics', branchCode: 'IT', semester: 2, credits: 4.0 },
    { subjectCode: 'DI02000041', subjectName: 'Environment & Sustainability', branchCode: 'IT', semester: 2, credits: 3.0 },

    // IT Sem 3
    { subjectCode: '3330701', subjectName: 'Data Structures and Algorithms', branchCode: 'IT', semester: 3, credits: 5.0 },
    { subjectCode: '3330702', subjectName: 'Database Management Systems', branchCode: 'IT', semester: 3, credits: 5.0 },
    { subjectCode: '3330703', subjectName: 'Digital Memory & Computer Architecture', branchCode: 'IT', semester: 3, credits: 4.0 },
    { subjectCode: '3330704', subjectName: 'Operating System Fundamentals', branchCode: 'IT', semester: 3, credits: 4.0 },
    { subjectCode: '3330705', subjectName: 'Web Development Basics', branchCode: 'IT', semester: 3, credits: 4.0 },

    // IT Sem 4
    { subjectCode: '3340701', subjectName: 'Object Oriented Programming with Java', branchCode: 'IT', semester: 4, credits: 5.0 },
    { subjectCode: '3340702', subjectName: 'Computer Networks', branchCode: 'IT', semester: 4, credits: 4.0 },
    { subjectCode: '3340703', subjectName: 'Software Engineering Principles', branchCode: 'IT', semester: 4, credits: 4.0 },
    { subjectCode: '3340704', subjectName: 'Python Programming', branchCode: 'IT', semester: 4, credits: 4.0 },
    { subjectCode: '3340705', subjectName: 'Information Security Essentials', branchCode: 'IT', semester: 4, credits: 3.0 },

    // IT Sem 5
    { subjectCode: '3350701', subjectName: 'Advanced Web Technology', branchCode: 'IT', semester: 5, credits: 5.0 },
    { subjectCode: '3350702', subjectName: 'Mobile Application Development', branchCode: 'IT', semester: 5, credits: 5.0 },
    { subjectCode: '3350703', subjectName: 'Cloud Computing Essentials', branchCode: 'IT', semester: 5, credits: 4.0 },
    { subjectCode: '3350704', subjectName: 'Project-I (Minor Project)', branchCode: 'IT', semester: 5, credits: 4.0 },

    // IT Sem 6
    { subjectCode: '3360701', subjectName: 'Network Security & Forensics', branchCode: 'IT', semester: 6, credits: 4.0 },
    { subjectCode: '3360702', subjectName: 'Machine Learning Fundamentals', branchCode: 'IT', semester: 6, credits: 5.0 },
    { subjectCode: '3360703', subjectName: 'Major Project & Seminar', branchCode: 'IT', semester: 6, credits: 8.0 },

    // Electrical Sem 3
    { subjectCode: '3330901', subjectName: 'Electrical Circuits and Analysis', branchCode: 'EE', semester: 3, credits: 5.0 },
    { subjectCode: '3330902', subjectName: 'Electrical Machines - I', branchCode: 'EE', semester: 3, credits: 5.0 },
    { subjectCode: '3330903', subjectName: 'Power Electronics Devices', branchCode: 'EE', semester: 3, credits: 4.0 },
    { subjectCode: '3330904', subjectName: 'Electrical Measurements & Instrumentation', branchCode: 'EE', semester: 3, credits: 4.0 },

    // Electrical Sem 4
    { subjectCode: '3340901', subjectName: 'Electrical Machines - II', branchCode: 'EE', semester: 4, credits: 5.0 },
    { subjectCode: '3340902', subjectName: 'Transmission & Distribution of Power', branchCode: 'EE', semester: 4, credits: 5.0 },
    { subjectCode: '3340903', subjectName: 'Control Systems Engineering', branchCode: 'EE', semester: 4, credits: 4.0 },
    { subjectCode: '3340904', subjectName: 'Microprocessor & Microcontrollers', branchCode: 'EE', semester: 4, credits: 4.0 },

    // Civil Sem 3
    { subjectCode: '3330601', subjectName: 'Building Construction & Materials', branchCode: 'CE', semester: 3, credits: 5.0 },
    { subjectCode: '3330602', subjectName: 'Surveying & Levelling', branchCode: 'CE', semester: 3, credits: 5.0 },
    { subjectCode: '3330603', subjectName: 'Mechanics of Structures', branchCode: 'CE', semester: 3, credits: 4.0 },
    { subjectCode: '3330604', subjectName: 'Fluid Mechanics & Hydraulics', branchCode: 'CE', semester: 3, credits: 4.0 },

    // ICT Sem 3
    { subjectCode: '3333201', subjectName: 'Communication Engineering Systems', branchCode: 'ICT', semester: 3, credits: 5.0 },
    { subjectCode: '3333202', subjectName: 'Data Communication & Protocols', branchCode: 'ICT', semester: 3, credits: 5.0 },
    { subjectCode: '3333203', subjectName: 'Embedded Systems Design', branchCode: 'ICT', semester: 3, credits: 4.0 },
    { subjectCode: '3333204', subjectName: 'Object Oriented Programming', branchCode: 'ICT', semester: 3, credits: 4.0 },
  ];

  const subjectsMap: Record<string, string> = {};
  for (const s of subjectsData) {
    const subject = await prisma.subject.create({
      data: {
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        branchId: branchesMap[s.branchCode],
        semesterId: semestersMap[s.semester],
        credits: s.credits,
        active: true,
      },
    });
    subjectsMap[`${s.subjectCode}_${s.branchCode}_${s.semester}`] = subject.id;
  }
  console.log('Seeded Subjects:', Object.keys(subjectsMap).length);

  // 8. Demo Students
  const demoStudents = [
    // IT Branch (Batch 2021-2024)
    { enrollment: '216170307001', seat: 'E21617001', name: 'Aarav K. Patel', branch: 'IT', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170307002', seat: 'E21617002', name: 'Priya M. Shah', branch: 'IT', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170307003', seat: 'E21617003', name: 'Rohan D. Joshi', branch: 'IT', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170307004', seat: 'E21617004', name: 'Ananya S. Mehta', branch: 'IT', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170307005', seat: 'E21617005', name: 'Harshil R. Dave', branch: 'IT', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170307006', seat: 'E21617006', name: 'Diya N. Trivedi', branch: 'IT', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170307007', seat: 'E21617007', name: 'Kavya B. Desai', branch: 'IT', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170307008', seat: 'E21617008', name: 'Dev P. Solanki', branch: 'IT', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170307009', seat: 'E21617009', name: 'Pooja H. Parmar', branch: 'IT', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170307010', seat: 'E216170010', name: 'Manish T. Vaghela', branch: 'IT', batch: '2021-2024', adm: 2021 },

    // Electrical Branch
    { enrollment: '216170309001', seat: 'E21617051', name: 'Karan J. Soni', branch: 'EE', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170309002', seat: 'E21617052', name: 'Neha V. Rathod', branch: 'EE', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170309003', seat: 'E21617053', name: 'Tirth C. Barot', branch: 'EE', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170309004', seat: 'E21617054', name: 'Khushi R. Pandya', branch: 'EE', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170309005', seat: 'E21617055', name: 'Siddharth M. Raval', branch: 'EE', batch: '2021-2024', adm: 2021 },

    // Civil Branch
    { enrollment: '216170306001', seat: 'E21617081', name: 'Yash K. Prajapati', branch: 'CE', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170306002', seat: 'E21617082', name: 'Bhumika S. Chauhan', branch: 'CE', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170306003', seat: 'E21617083', name: 'Vivek A. Makwana', branch: 'CE', batch: '2021-2024', adm: 2021 },

    // ICT Branch
    { enrollment: '216170332001', seat: 'E21617111', name: 'Jatin G. Panchal', branch: 'ICT', batch: '2021-2024', adm: 2021 },
    { enrollment: '216170332002', seat: 'E21617112', name: 'Riddhi P. Suthar', branch: 'ICT', batch: '2021-2024', adm: 2021 },
  ];

  const studentsCreated: Record<string, any> = {};
  for (const s of demoStudents) {
    const student = await prisma.student.create({
      data: {
        enrollmentNumber: s.enrollment,
        seatNumber: s.seat,
        fullName: s.name,
        branchId: branchesMap[s.branch],
        batch: s.batch,
        admissionYear: s.adm,
        active: true,
      },
    });
    studentsCreated[s.enrollment] = { ...student, branchCode: s.branch };
  }
  console.log('Seeded Students:', Object.keys(studentsCreated).length);

  // 9. Realistic Semester Results & Subject Results
  // Helper for grade point
  const gradePoints: Record<string, number> = {
    AA: 10, AB: 9, BB: 8, BC: 7, CC: 6, CD: 5, DD: 4, FF: 0,
  };

  // Create results for IT students across semesters
  const itSem3Subjects = [
    { code: '3330701', credits: 5.0 },
    { code: '3330702', credits: 5.0 },
    { code: '3330703', credits: 4.0 },
    { code: '3330704', credits: 4.0 },
    { code: '3330705', credits: 4.0 },
  ];

  const itSem4Subjects = [
    { code: '3340701', credits: 5.0 },
    { code: '3340702', credits: 4.0 },
    { code: '3340703', credits: 4.0 },
    { code: '3340704', credits: 4.0 },
    { code: '3340705', credits: 3.0 },
  ];

  // Specific profiles for demo students
  const itResultsProfile = [
    // Top student - Aarav
    {
      enrollment: '216170307001',
      sem3: { grades: ['AA', 'AA', 'AB', 'AA', 'AB'], spi: 9.64, cpi: 9.45, cgpa: 9.45, curBack: 0, totBack: 0, date: '2023-01-18' },
      sem4: { grades: ['AA', 'AB', 'AA', 'AA', 'AB'], spi: 9.60, cpi: 9.50, cgpa: 9.50, curBack: 0, totBack: 0, date: '2023-06-22' },
    },
    // High achiever - Priya
    {
      enrollment: '216170307002',
      sem3: { grades: ['AB', 'AA', 'AB', 'BB', 'AA'], spi: 9.09, cpi: 9.12, cgpa: 9.12, curBack: 0, totBack: 0, date: '2023-01-18' },
      sem4: { grades: ['AA', 'AB', 'AB', 'AA', 'AA'], spi: 9.40, cpi: 9.20, cgpa: 9.20, curBack: 0, totBack: 0, date: '2023-06-22' },
    },
    // Above average - Rohan
    {
      enrollment: '216170307003',
      sem3: { grades: ['BB', 'BC', 'AB', 'BB', 'CC'], spi: 7.73, cpi: 7.85, cgpa: 7.85, curBack: 0, totBack: 0, date: '2023-01-18' },
      sem4: { grades: ['AB', 'BB', 'BC', 'AB', 'BB'], spi: 8.10, cpi: 7.92, cgpa: 7.92, curBack: 0, totBack: 0, date: '2023-06-22' },
    },
    // Good performer - Ananya
    {
      enrollment: '216170307004',
      sem3: { grades: ['AB', 'BB', 'AA', 'AB', 'BB'], spi: 8.82, cpi: 8.70, cgpa: 8.70, curBack: 0, totBack: 0, date: '2023-01-18' },
      sem4: { grades: ['AA', 'AA', 'AB', 'AB', 'AA'], spi: 9.40, cpi: 8.90, cgpa: 8.90, curBack: 0, totBack: 0, date: '2023-06-22' },
    },
    // Student with backlogs - Harshil
    {
      enrollment: '216170307005',
      sem3: { grades: ['FF', 'CD', 'CC', 'FF', 'DD'], spi: 3.18, cpi: 5.40, cgpa: 5.40, curBack: 2, totBack: 2, date: '2023-01-18' },
      sem4: { grades: ['CC', 'FF', 'CD', 'CC', 'DD'], spi: 4.80, cpi: 5.10, cgpa: 5.10, curBack: 1, totBack: 3, date: '2023-06-22' },
    },
    // Average student - Diya
    {
      enrollment: '216170307006',
      sem3: { grades: ['BC', 'CC', 'BB', 'CD', 'BC'], spi: 6.82, cpi: 7.10, cgpa: 7.10, curBack: 0, totBack: 0, date: '2023-01-18' },
      sem4: { grades: ['BB', 'BC', 'CC', 'BC', 'BB'], spi: 7.20, cpi: 7.15, cgpa: 7.15, curBack: 0, totBack: 0, date: '2023-06-22' },
    },
    // Solid student - Kavya
    {
      enrollment: '216170307007',
      sem3: { grades: ['AA', 'AB', 'AB', 'BB', 'AB'], spi: 9.00, cpi: 8.95, cgpa: 8.95, curBack: 0, totBack: 0, date: '2023-01-18' },
      sem4: { grades: ['AB', 'AA', 'BB', 'AB', 'AA'], spi: 9.00, cpi: 8.97, cgpa: 8.97, curBack: 0, totBack: 0, date: '2023-06-22' },
    },
    // Borderline student - Dev
    {
      enrollment: '216170307008',
      sem3: { grades: ['CD', 'DD', 'CC', 'CD', 'DD'], spi: 5.09, cpi: 5.60, cgpa: 5.60, curBack: 0, totBack: 0, date: '2023-01-18' },
      sem4: { grades: ['FF', 'CD', 'DD', 'CD', 'CC'], spi: 4.20, cpi: 5.20, cgpa: 5.20, curBack: 1, totBack: 1, date: '2023-06-22' },
    },
    // Moderate performer - Pooja
    {
      enrollment: '216170307009',
      sem3: { grades: ['BB', 'AB', 'BC', 'BB', 'BC'], spi: 7.91, cpi: 8.00, cgpa: 8.00, curBack: 0, totBack: 0, date: '2023-01-18' },
      sem4: { grades: ['AB', 'BB', 'BB', 'AB', 'BB'], spi: 8.30, cpi: 8.10, cgpa: 8.10, curBack: 0, totBack: 0, date: '2023-06-22' },
    },
    // Student needing improvement - Manish
    {
      enrollment: '216170307010',
      sem3: { grades: ['CD', 'FF', 'DD', 'CC', 'CD'], spi: 4.55, cpi: 5.15, cgpa: 5.15, curBack: 1, totBack: 1, date: '2023-01-18' },
      sem4: { grades: ['DD', 'CD', 'CD', 'DD', 'CC'], spi: 5.20, cpi: 5.17, cgpa: 5.17, curBack: 0, totBack: 1, date: '2023-06-22' },
    },
  ];

  for (const prof of itResultsProfile) {
    const student = studentsCreated[prof.enrollment];
    if (!student) continue;

    // Sem 3 Result
    const sem3Res = await prisma.semesterResult.create({
      data: {
        studentId: student.id,
        semesterId: semestersMap[3],
        academicYearId: ay2022.id,
        seatNumber: student.seatNumber,
        declarationDate: prof.sem3.date,
        currentBacklog: prof.sem3.curBack,
        totalBacklog: prof.sem3.totBack,
        spi: prof.sem3.spi,
        cpi: prof.sem3.cpi,
        cgpa: prof.sem3.cgpa,
        resultStatus: prof.sem3.curBack > 0 ? 'FAIL' : 'PASS',
        isCalculated: false,
      },
    });

    for (let idx = 0; idx < itSem3Subjects.length; idx++) {
      const sub = itSem3Subjects[idx];
      const grade = prof.sem3.grades[idx];
      const subId = subjectsMap[`${sub.code}_IT_3`];
      if (subId) {
        await prisma.subjectResult.create({
          data: {
            semesterResultId: sem3Res.id,
            subjectId: subId,
            grade,
            gradePoint: gradePoints[grade] ?? 0,
            eIndicator: grade === 'FF' ? '' : 'Y',
            mIndicator: grade === 'FF' ? '' : 'Y',
            iIndicator: 'Y',
            vIndicator: 'Y',
            isBacklog: grade === 'FF',
          },
        });
      }
    }

    // Sem 4 Result
    const sem4Res = await prisma.semesterResult.create({
      data: {
        studentId: student.id,
        semesterId: semestersMap[4],
        academicYearId: ay2023.id,
        seatNumber: student.seatNumber,
        declarationDate: prof.sem4.date,
        currentBacklog: prof.sem4.curBack,
        totalBacklog: prof.sem4.totBack,
        spi: prof.sem4.spi,
        cpi: prof.sem4.cpi,
        cgpa: prof.sem4.cgpa,
        resultStatus: prof.sem4.curBack > 0 ? 'FAIL' : 'PASS',
        isCalculated: false,
      },
    });

    for (let idx = 0; idx < itSem4Subjects.length; idx++) {
      const sub = itSem4Subjects[idx];
      const grade = prof.sem4.grades[idx];
      const subId = subjectsMap[`${sub.code}_IT_4`];
      if (subId) {
        await prisma.subjectResult.create({
          data: {
            semesterResultId: sem4Res.id,
            subjectId: subId,
            grade,
            gradePoint: gradePoints[grade] ?? 0,
            eIndicator: grade === 'FF' ? '' : 'Y',
            mIndicator: grade === 'FF' ? '' : 'Y',
            iIndicator: 'Y',
            vIndicator: 'Y',
            isBacklog: grade === 'FF',
          },
        });
      }
    }
  }

  // Electrical Sem 3 results
  const eeSem3Subjects = [
    { code: '3330901', credits: 5.0 },
    { code: '3330902', credits: 5.0 },
    { code: '3330903', credits: 4.0 },
    { code: '3330904', credits: 4.0 },
  ];
  const eeResults = [
    { enrollment: '216170309001', grades: ['AA', 'AB', 'AA', 'AB'], spi: 9.44, cpi: 9.30, cgpa: 9.30, curBack: 0, totBack: 0 },
    { enrollment: '216170309002', grades: ['AB', 'BB', 'AB', 'AA'], spi: 8.89, cpi: 8.75, cgpa: 8.75, curBack: 0, totBack: 0 },
    { enrollment: '216170309003', grades: ['BB', 'BC', 'CC', 'BB'], spi: 7.33, cpi: 7.45, cgpa: 7.45, curBack: 0, totBack: 0 },
    { enrollment: '216170309004', grades: ['FF', 'CC', 'CD', 'FF'], spi: 2.89, cpi: 5.10, cgpa: 5.10, curBack: 2, totBack: 2 },
    { enrollment: '216170309005', grades: ['BC', 'CC', 'CD', 'BC'], spi: 6.33, cpi: 6.60, cgpa: 6.60, curBack: 0, totBack: 0 },
  ];

  for (const ee of eeResults) {
    const student = studentsCreated[ee.enrollment];
    if (!student) continue;
    const sem3Res = await prisma.semesterResult.create({
      data: {
        studentId: student.id,
        semesterId: semestersMap[3],
        academicYearId: ay2023.id,
        seatNumber: student.seatNumber,
        declarationDate: '2023-07-10',
        currentBacklog: ee.curBack,
        totalBacklog: ee.totBack,
        spi: ee.spi,
        cpi: ee.cpi,
        cgpa: ee.cgpa,
        resultStatus: ee.curBack > 0 ? 'FAIL' : 'PASS',
        isCalculated: false,
      },
    });

    for (let idx = 0; idx < eeSem3Subjects.length; idx++) {
      const sub = eeSem3Subjects[idx];
      const grade = ee.grades[idx];
      const subId = subjectsMap[`${sub.code}_EE_3`];
      if (subId) {
        await prisma.subjectResult.create({
          data: {
            semesterResultId: sem3Res.id,
            subjectId: subId,
            grade,
            gradePoint: gradePoints[grade] ?? 0,
            eIndicator: grade === 'FF' ? '' : 'Y',
            mIndicator: grade === 'FF' ? '' : 'Y',
            iIndicator: 'Y',
            vIndicator: 'Y',
            isBacklog: grade === 'FF',
          },
        });
      }
    }
  }

  // Civil Sem 3 results
  const ceSem3Subjects = [
    { code: '3330601', credits: 5.0 },
    { code: '3330602', credits: 5.0 },
    { code: '3330603', credits: 4.0 },
    { code: '3330604', credits: 4.0 },
  ];
  const ceResults = [
    { enrollment: '216170306001', grades: ['AB', 'AA', 'AB', 'BB'], spi: 9.00, cpi: 8.85, cgpa: 8.85, curBack: 0, totBack: 0 },
    { enrollment: '216170306002', grades: ['BB', 'BC', 'BB', 'BC'], spi: 7.56, cpi: 7.70, cgpa: 7.70, curBack: 0, totBack: 0 },
    { enrollment: '216170306003', grades: ['FF', 'CD', 'DD', 'CD'], spi: 3.78, cpi: 5.40, cgpa: 5.40, curBack: 1, totBack: 1 },
  ];
  for (const ce of ceResults) {
    const student = studentsCreated[ce.enrollment];
    if (!student) continue;
    const sem3Res = await prisma.semesterResult.create({
      data: {
        studentId: student.id,
        semesterId: semestersMap[3],
        academicYearId: ay2023.id,
        seatNumber: student.seatNumber,
        declarationDate: '2023-07-12',
        currentBacklog: ce.curBack,
        totalBacklog: ce.totBack,
        spi: ce.spi,
        cpi: ce.cpi,
        cgpa: ce.cgpa,
        resultStatus: ce.curBack > 0 ? 'FAIL' : 'PASS',
        isCalculated: false,
      },
    });
    for (let idx = 0; idx < ceSem3Subjects.length; idx++) {
      const sub = ceSem3Subjects[idx];
      const grade = ce.grades[idx];
      const subId = subjectsMap[`${sub.code}_CE_3`];
      if (subId) {
        await prisma.subjectResult.create({
          data: {
            semesterResultId: sem3Res.id,
            subjectId: subId,
            grade,
            gradePoint: gradePoints[grade] ?? 0,
            eIndicator: grade === 'FF' ? '' : 'Y',
            mIndicator: grade === 'FF' ? '' : 'Y',
            iIndicator: 'Y',
            vIndicator: 'Y',
            isBacklog: grade === 'FF',
          },
        });
      }
    }
  }

  // ICT Sem 3 results
  const ictSem3Subjects = [
    { code: '3333201', credits: 5.0 },
    { code: '3333202', credits: 5.0 },
    { code: '3333203', credits: 4.0 },
    { code: '3333204', credits: 4.0 },
  ];
  const ictResults = [
    { enrollment: '216170332001', grades: ['AA', 'AA', 'AB', 'AA'], spi: 9.78, cpi: 9.60, cgpa: 9.60, curBack: 0, totBack: 0 },
    { enrollment: '216170332002', grades: ['AB', 'BB', 'BC', 'AB'], spi: 8.33, cpi: 8.25, cgpa: 8.25, curBack: 0, totBack: 0 },
  ];
  for (const ict of ictResults) {
    const student = studentsCreated[ict.enrollment];
    if (!student) continue;
    const sem3Res = await prisma.semesterResult.create({
      data: {
        studentId: student.id,
        semesterId: semestersMap[3],
        academicYearId: ay2023.id,
        seatNumber: student.seatNumber,
        declarationDate: '2023-07-15',
        currentBacklog: ict.curBack,
        totalBacklog: ict.totBack,
        spi: ict.spi,
        cpi: ict.cpi,
        cgpa: ict.cgpa,
        resultStatus: ict.curBack > 0 ? 'FAIL' : 'PASS',
        isCalculated: false,
      },
    });
    for (let idx = 0; idx < ictSem3Subjects.length; idx++) {
      const sub = ictSem3Subjects[idx];
      const grade = ict.grades[idx];
      const subId = subjectsMap[`${sub.code}_ICT_3`];
      if (subId) {
        await prisma.subjectResult.create({
          data: {
            semesterResultId: sem3Res.id,
            subjectId: subId,
            grade,
            gradePoint: gradePoints[grade] ?? 0,
            eIndicator: grade === 'FF' ? '' : 'Y',
            mIndicator: grade === 'FF' ? '' : 'Y',
            iIndicator: 'Y',
            vIndicator: 'Y',
            isBacklog: grade === 'FF',
          },
        });
      }
    }
  }

  // 10. Audit Log Seed
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'SYSTEM_INITIALIZATION',
        entity: 'System',
        details: 'Initial database schema and demo data configured successfully.',
      },
      {
        userId: adminUser.id,
        action: 'CREATE_FACULTY',
        entity: 'User',
        entityId: facultyUser.id,
        details: 'Created faculty account: Prof. Rajesh Sharma',
      },
      {
        userId: facultyUser.id,
        action: 'CREATE_RESULT',
        entity: 'SemesterResult',
        details: 'Entered Semester 4 results for IT 2021-2024 batch.',
      },
    ],
  });

  // 11. Initial Demo Import Job Log
  const demoJob = await prisma.importJob.create({
    data: {
      fileName: 'DEMO_GTU_RESULT_BATCH_2023_SEM3.xlsx',
      fileSize: 45200,
      uploadedById: adminUser.id,
      totalRows: 20,
      importedRows: 20,
      failedRows: 0,
      status: 'COMPLETED',
      notes: 'Initial demo GTU result dataset loaded into system.',
      completedAt: new Date(),
    },
  });

  console.log('--- Database Seeding Completed Successfully! ---');
  console.log('Admin Account:   admin / admin123');
  console.log('Faculty Account: faculty / faculty123');
}

main()
  .catch((e) => {
    console.error('Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
