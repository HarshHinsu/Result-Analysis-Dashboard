# Quality Assurance & Testing Specifications

## 1. Test Suite Architecture

Automated testing is configured using **Vitest** with 100% pure function and schema coverage:

```
tests/
├── calculations.test.ts  # SPI/CPI formulas, rankings, distributions
├── validations.test.ts   # Zod form & API schema validation
├── excel-import.test.ts  # Header mapping & spreadsheet row integrity
└── auth.test.ts          # Password hashing and JWT session tokens
```

---

## 2. Test Cases & Verification Matrix

### Calculation Engine Tests (`tests/calculations.test.ts`)
- SPI weighted calculation with variable credit subjects.
- CPI computation across multiple semesters.
- Empty and zero-credit edge cases.
- KPI summary aggregations (pass rate, backlog counts).
- Letter grade distribution percentages.
- Score bracket histograms.
- Student merit ranking and tie-breakers (SPI -> Backlogs -> Alphabetical).

### Validation Schema Tests (`tests/validations.test.ts`)
- Login input validation (empty fields, format).
- Student enrollment number constraints.
- Subject credit limits (minimum 0.5 credits).
- Branch code formatting (uppercase alphanumeric).

### Excel Import Tests (`tests/excel-import.test.ts`)
- Synonym header auto-detection.
- Detection of malformed enrollment numbers.
- Detection of out-of-bound semesters.
- Sample GTU template binary creation and re-parsing.

### Authentication Tests (`tests/auth.test.ts`)
- Salted bcrypt hashing and comparison.
- JWT session token creation and expiration check.
- Rejection of tampered session tokens.

---

## 3. Running Automated Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```
