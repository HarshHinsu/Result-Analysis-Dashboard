# Database Design & Schema Specifications

## 1. Relational Model Design

The database schema is implemented with Prisma ORM on SQLite. It enforces strict relational integrity, composite unique keys, foreign keys, and indexes for performance.

---

## 2. Entities & Schema Definitions

### `users`
- `id` (UUID, Primary Key)
- `name` (String, User full name)
- `username` (String, Unique)
- `email` (String, Optional Unique)
- `passwordHash` (String, bcrypt salted hash)
- `role` (String, `"ADMIN"` or `"FACULTY"`)
- `active` (Boolean, Default `true`)

### `branches`
- `id` (UUID, Primary Key)
- `code` (String, Unique, e.g. `"IT"`, `"EE"`, `"CE"`)
- `name` (String, e.g. `"Information Technology"`)
- `active` (Boolean)

### `semesters`
- `id` (UUID, Primary Key)
- `number` (Int, Unique: 1 to 6)
- `name` (String, e.g. `"Semester 1"`)
- `active` (Boolean)

### `academic_years`
- `id` (UUID, Primary Key)
- `name` (String, Unique, e.g. `"2023-2024"`)
- `startYear` (Int)
- `endYear` (Int)
- `isCurrent` (Boolean)

### `subjects`
- `id` (UUID, Primary Key)
- `subjectCode` (String, e.g. `"3330701"`)
- `subjectName` (String, e.g. `"Data Structures"`)
- `branchId` (UUID, Optional Foreign Key -> `branches.id`)
- `semesterId` (UUID, Foreign Key -> `semesters.id`)
- `credits` (Float, Credit weight, default `4.0`)
- `active` (Boolean)
- *Constraint*: `@@unique([subjectCode, branchId, semesterId])`

### `students`
- `id` (UUID, Primary Key)
- `enrollmentNumber` (String, Unique, e.g. `"216170307001"`)
- `seatNumber` (String, Optional Exam Seat No)
- `fullName` (String)
- `branchId` (UUID, Foreign Key -> `branches.id`)
- `batch` (String, Optional e.g. `"2021-2024"`)
- `admissionYear` (Int)
- `active` (Boolean)

### `semester_results`
- `id` (UUID, Primary Key)
- `studentId` (UUID, Foreign Key -> `students.id` ON DELETE CASCADE)
- `semesterId` (UUID, Foreign Key -> `semesters.id`)
- `academicYearId` (UUID, Foreign Key -> `academic_years.id`)
- `seatNumber` (String, Optional)
- `declarationDate` (String, Optional)
- `currentBacklog` (Int, Default `0`)
- `totalBacklog` (Int, Default `0`)
- `spi` (Float, Semester Performance Index)
- `cpi` (Float, Cumulative Performance Index)
- `cgpa` (Float, Cumulative Grade Point Average)
- `resultStatus` (String, `"PASS"` / `"FAIL"` / `"WITHHELD"`)
- `isCalculated` (Boolean)
- *Constraint*: `@@unique([studentId, semesterId, academicYearId])`

### `subject_results`
- `id` (UUID, Primary Key)
- `semesterResultId` (UUID, Foreign Key -> `semester_results.id` ON DELETE CASCADE)
- `subjectId` (UUID, Foreign Key -> `subjects.id`)
- `grade` (String, e.g. `"AA"`, `"AB"`, `"BB"`, `"BC"`, `"CC"`, `"CD"`, `"DD"`, `"FF"`)
- `gradePoint` (Float, Mapped point)
- `eIndicator` (String, External Theory indicator)
- `mIndicator` (String, Mid-Sem Theory indicator)
- `iIndicator` (String, Internal Practical indicator)
- `vIndicator` (String, External Viva indicator)
- `isBacklog` (Boolean)
- *Constraint*: `@@unique([semesterResultId, subjectId])`

### `import_jobs` & `import_row_errors`
- Record spreadsheet ingestion events, total rows, imported count, failed count, status (`PENDING`, `PROCESSING`, `COMPLETED`, `COMPLETED_WITH_ERRORS`, `FAILED`), and row-level validation errors.

### `calculation_configs`
- Stores configuration JSON blobs for `GRADE_POINTS_MAP`, `PASSING_CRITERIA`, `INDICATOR_LABELS`, and `INSTITUTION_SETTINGS`.

### `audit_logs`
- Full chronological activity trail tracking user logins, student updates, result entries, and imports.
