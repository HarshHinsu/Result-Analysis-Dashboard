# Student Result Analysis Dashboard

An academic result management, performance analytics, backlog diagnostic, and report generation web application built specifically for diploma engineering colleges (based on GTU / L.E. College examination standards).

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Database Design](#database-design)
6. [Quick Start & Setup Instructions](#quick-start--setup-instructions)
7. [Demo Accounts & Credentials](#demo-accounts--credentials)
8. [Result Import & Report Generation Workflows](#result-import--report-generation-workflows)
9. [Project Structure](#project-structure)
10. [Testing Suite](#testing-suite)
11. [Documentation Index](#documentation-index)

---

## 1. Project Overview
In diploma engineering institutions (such as Gujarat Technological University / L.E. College), academic results are structured around semester-level metrics (**SPI**, **CPI**, **CGPA**, **Current Backlogs**, **Total Backlogs**) and component-level evaluation indicators (**E** External Theory, **M** Mid-Sem Theory, **I** Practical Term Work, **V** Practical External / Viva) across standard letter grades (`AA`, `AB`, `BB`, `BC`, `CC`, `CD`, `DD`, `FF`).

The **Student Result Analysis Dashboard** provides institutional administrators and faculty members with a centralized, data-driven system to:
- Ingest and validate official Excel result sheets.
- Manage curriculum subjects, branches, and student profiles.
- Visualize performance through interactive Recharts histograms, progression lines, and comparative charts.
- Identify students with backlogs requiring remedial intervention.
- Generate and download official PDF transcripts and consolidated semester master sheets.

---

## 2. Key Features

### Role-Based Portals (`ADMIN` & `FACULTY`)
- **Admin**: Full administrative control over Faculty user management, Engineering Branches, Subjects, Calculation Configurations, and System Audit Logs.
- **Faculty**: Access to Student Directory, Result Entry, Excel Import, Analytics Suite, and PDF Reports.

### GTU Result Structure Fidelity
- Preserves official imported values alongside an isolated, configurable calculation engine.
- Supports evaluation indicators (`E`, `M`, `I`, `V`) and 10-point grade mappings (`AA` = 10, `AB` = 9, `BB` = 8, `BC` = 7, `CC` = 6, `CD` = 5, `DD` = 4, `FF` = 0).

### Modern Analytics Dashboard
- 6 High-Level KPI Summary Cards: Total Students, Average SPI, Average CPI, Average CGPA, Pass Percentage, Total Active Backlogs.
- 9 Interactive Recharts Visualizations:
  1. SPI Score Distribution (Histogram)
  2. CPI Score Distribution (Histogram)
  3. CGPA Score Distribution (Histogram)
  4. Overall Letter Grade Distribution (`AA` to `FF`)
  5. Semester Performance Progression Trend (Sem 1 through 6)
  6. Branch-wise Comparative Performance
  7. Backlog Distribution
  8. Subject Pass Rates
  9. Pass vs. Fail Breakdown Pie Chart

### Student Directory & Profile Transcripts
- Paginated, searchable student directory with multi-filters (Branch, Batch, Semester, Status).
- Detailed Student Profile page featuring semester-by-semester grade breakdown tables, SPI/CPI trend charts, and one-click PDF Transcript download.

### Manual Result Entry
- Step-by-step result submission interface with live dynamic curriculum subject loader, interactive grade selectors, and real-time SPI computation preview.

### Excel Import Wizard
- Drag-and-drop file upload supporting `.xlsx` and `.xls`.
- Header auto-detection and customizable column mapping.
- Pre-import validation engine reporting valid rows, warnings, and errors with row-level details.
- Transaction-safe atomic database commit.
- Downloadable sample Excel template.

### Official PDF Report Generation
- **Student Academic Transcript**: Printable card with college header, subject grades, indicators, and index summary.
- **Semester Consolidated Sheet**: Landscape master sheet with ranks and pass/fail indicators.
- **Branch Performance Report**: Department analytics and subject summaries.
- **Executive Institutional Summary**: High-level review document.

---

## 3. Technology Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Radix UI Primitives, Lucide React
- **Charts**: Recharts
- **Spreadsheets**: SheetJS (`xlsx`)
- **PDF Generation**: `jspdf` & `jspdf-autotable`
- **Backend**: Next.js Server Actions & Route Handlers
- **Database**: SQLite
- **ORM**: Prisma ORM
- **Authentication**: JWT session cookies (`jose`) with `bcryptjs` password hashing
- **Validation**: Zod
- **Testing**: Vitest

---

## 4. System Architecture

```
[ Client Browser ]
       |
  (App Router UI & Radix Primitives)
       |
[ Middleware & RBAC Layer ] ---> (Session Validation)
       |
[ Server Actions & Services ]
   ├── Calculation Engine (SPI, CPI, CGPA, Backlogs)
   ├── Excel Validator & Importer
   ├── Audit Logging Service
   └── PDF Report Formatter
       |
[ Prisma ORM ]
       |
[ SQLite Database (dev.db) ]
```

---

## 5. Database Design

Entities and relationships:
- `User`: Accounts for Admins and Faculty members.
- `Branch`: Engineering disciplines (`IT`, `EE`, `CE`, `ICT`, `ME`, `EC`).
- `Semester`: Semesters 1 to 6.
- `AcademicYear`: Academic calendar sessions (e.g. `2023-2024`).
- `Subject`: Curriculum subjects with credit weights and branch/semester mapping.
- `Student`: Enrolled students with unique enrollment numbers and seat numbers.
- `SemesterResult`: Semester-level result records storing SPI, CPI, CGPA, backlogs, and status.
- `SubjectResult`: Subject-level grade records with `E`, `M`, `I`, `V` indicators.
- `ImportJob` & `ImportRowError`: Audit history for spreadsheet uploads.
- `CalculationConfig`: Configurable grading scale maps and institution profile.
- `AuditLog`: Action logs for security and tracking.

---

## 6. Quick Start & Setup Instructions

### Prerequisites
- Node.js `v18+` or `v20+` (Tested on Node `v24` on Windows 11)
- npm `v9+` or `v11+`

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd <project-folder>
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Initialize Database & Seed Demo Data**:
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Demo Accounts & Credentials

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full Access (Faculty, Settings, Branches, Curriculum) |
| **Faculty Member** | `faculty` | `faculty123` | Results, Students, Analytics, Imports, Reports |
| **HOD Electrical** | `hod_ee` | `hod123` | Results, Students, Analytics, Imports, Reports |

> **Note**: Quick-fill buttons are provided directly on the login screen for rapid testing during evaluation.

---

## 8. Result Import & Report Generation Workflows

### How to Import Excel Results
1. Navigate to **Excel Import** from the sidebar.
2. Click **Download Sample Excel Template** to inspect the required format.
3. Upload an `.xlsx` or `.xls` spreadsheet.
4. Verify the auto-detected **Column Mapping** (adjust if custom headers are used).
5. Click **Validate Spreadsheet Data** to view the validation report (valid count, warnings, errors).
6. Click **Import Valid Rows** to commit records into the database.

### How to Generate Reports
1. Navigate to **PDF Reports** from the sidebar.
2. Select your desired report category:
   - *Student Transcript* (select a student)
   - *Semester Consolidated Sheet* (select Semester, Branch, and Academic Year)
   - *Branch Performance Report* (select Branch)
   - *Executive Summary*
3. Click **Generate & Download PDF Report**.

---

## 9. Project Structure

```
src/
├── app/
│   ├── (auth)/login/        # Login authentication page
│   ├── (dashboard)/
│   │   ├── dashboard/       # Main KPI analytics dashboard
│   │   ├── students/        # Student directory & profile pages
│   │   │   └── [id]/        # Academic transcript profile
│   │   ├── results/         # Manual result entry & management
│   │   ├── analytics/       # 7-view deep analytics suite
│   │   ├── imports/         # Excel import wizard & history
│   │   ├── reports/         # PDF report generation hub
│   │   ├── branches/        # Branch department management
│   │   ├── subjects/        # Curriculum subject management
│   │   ├── faculty/         # Admin user & faculty management
│   │   └── settings/        # System grading configs & audit logs
│   ├── globals.css          # CSS theme variables
│   └── layout.tsx           # Base layout wrapper
├── components/
│   ├── layout/              # Sidebar, Header, and DashboardShell
│   └── ui/                  # Radix UI and Tailwind design primitives
├── lib/
│   ├── auth/                # Session, JWT, RBAC, and bcrypt helpers
│   ├── calculations/        # Pure analytical calculation engine
│   ├── imports/             # Excel parsing, mapping, and validation
│   ├── reports/             # jsPDF transcript & report builders
│   ├── db/                  # Prisma Client singleton
│   ├── validations/         # Zod schemas for forms and APIs
│   └── utils.ts             # Formatting & badge helpers
├── server/
│   └── actions/             # Next.js Server Actions for all modules
└── types/                   # TypeScript interface definitions

prisma/
├── schema.prisma            # Normalized SQLite schema
└── seed.ts                  # Realistic GTU demo dataset seeder

tests/
├── calculations.test.ts     # Formula & metrics tests
├── validations.test.ts      # Zod schema validation tests
├── excel-import.test.ts     # Excel mapping & row validation tests
└── auth.test.ts             # Security & session tests
```

---

## 10. Testing Suite

Run the automated Vitest test suite with:
```bash
npm test
```

To run tests in watch mode:
```bash
npm run test:watch
```

---

## 11. Documentation Index

Additional detailed technical documentation is available in the `docs/` folder:
- [`docs/architecture.md`](docs/architecture.md): Architectural design, layer separation, and security.
- [`docs/database.md`](docs/database.md): Schema entity details, indexes, and constraints.
- [`docs/excel-import.md`](docs/excel-import.md): Spreadsheet mapping specifications and validation rules.
- [`docs/calculations.md`](docs/calculations.md): Formulas for SPI, CPI, CGPA, and rankings.
- [`docs/testing.md`](docs/testing.md): Test cases, coverage matrix, and QA procedures.
