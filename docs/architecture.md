# Architecture & Design Specifications

## 1. Architectural Philosophy

The **Student Result Analysis Dashboard** is designed as a clean, monolithic Next.js App Router application built for local and demonstration environments in diploma engineering colleges. It avoids distributed complexity (such as microservices, Kafka, Redis, or external DB servers) while maintaining strict architectural layer separation between:

1. **Presentation Layer (UI Components)**
2. **Routing & Access Control Layer (Middleware & Server Actions)**
3. **Domain & Calculation Service Layer (Pure Business Logic)**
4. **Data Access Layer (Prisma ORM & SQLite Database)**

```
+-------------------------------------------------------------------------------+
|                            Client (Browser View)                              |
|  - App Router Pages & Client Components (`use client`)                       |
|  - Recharts Visualizations & Radix UI Design Primitives                       |
|  - Real-time client-side calculation preview (SPI / Backlogs)                 |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                  Next.js App Router & Server Actions                          |
|  - Next.js Edge Middleware (`middleware.ts` for session & RBAC)              |
|  - Server Actions (`src/server/actions/*`) with Zod schema validation         |
|  - Secure HTTP-Only Cookie Session Store (`jose` JWT)                        |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                    Service & Business Logic Engine                            |
|  - Isolated Calculation Engine (`src/lib/calculations/analytics.ts`)          |
|  - Excel Import & Schema Validator (`src/lib/imports/excel-validator.ts`)     |
|  - jsPDF Document Generator (`src/lib/reports/pdf-generator.ts`)              |
|  - Audit Log Service (`src/lib/audit/logger.ts`)                              |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                         Data Access Layer (Prisma)                            |
|  - Singleton Prisma Client (`src/lib/db/prisma.ts`)                           |
|  - Schema constraints, indexes, and transactional guarantees                  |
|  - SQLite Database (`dev.db`)                                                 |
+---------------------------------------+---------------------------------------+
```

---

## 2. Layer Separation & Responsibilities

### Presentation Layer
- Built with React 18, Tailwind CSS, and Radix UI primitives.
- Client components (`use client`) are used only when interactive state or client APIs (e.g. file upload, tab switching, Recharts rendering, PDF download) are required.
- Form inputs are validated in real-time with instant visual feedback.

### Server Actions
- Encapsulate server-side mutation logic and data retrieval.
- Every mutating server action strictly verifies user session and role authorization before querying or updating the database.
- Request payloads are validated against Zod schemas.

### Isolated Calculation Engine
- Calculation formulas for SPI, CPI, CGPA, pass percentage, backlog distribution, and student rankings are strictly decoupled from React components and database queries.
- Pure functions make calculations deterministic, easily testable in unit test suites, and configurable.

### Security & Role-Based Access Control (RBAC)
- **ADMIN**: Access to administrative modules (`/faculty`, `/settings`, `/branches`, `/subjects`).
- **FACULTY**: Restricted from user management and system settings; has access to results, students, analytics, imports, and reports.
- Passwords are encrypted with bcrypt (10 rounds salt).
- Sessions use signed, encrypted JWT tokens stored in `httpOnly`, `sameSite: 'lax'` cookies.
