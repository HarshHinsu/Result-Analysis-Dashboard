# Excel Import Engine Specifications

## 1. Import Workflow Overview

The import workflow is structured into 4 stages:

```
[ Upload File ] (.xlsx / .xls)
       ↓
[ Column Header Auto-Detection & Mapping ]
       ↓
[ Pre-Import Schema & Integrity Validation ]
       ↓
[ Transactional Database Commit & Audit ]
```

---

## 2. Supported Header Formats

The importer supports fuzzy auto-mapping across common header variations:

| Target System Field | Accepted Header Synonyms |
| :--- | :--- |
| **Student Name** | `Student Name`, `Name`, `Full Name`, `Candidate Name`, `Student_Name` |
| **Enrollment Number** | `Enrollment No`, `Enrollment Number`, `Enrollment`, `Roll No`, `Enr_No` |
| **Seat Number** | `Seat No`, `Seat Number`, `Seat`, `Exam Seat No` |
| **Branch** | `Branch`, `Department`, `Dept`, `Course`, `Branch Code` |
| **Semester** | `Semester`, `Sem`, `Semester Number`, `Sem_No`, `Term` |
| **Academic Year** | `Academic Year`, `Academic_Year`, `AY`, `Year`, `Session` |
| **Subject Code** | `Subject Code`, `Sub Code`, `Subject_Code`, `Paper Code` |
| **Grade** | `Grade`, `Subject Grade`, `Final Grade`, `Sub_Grade` |
| **Indicators (E, M, I, V)** | `E`, `M`, `I`, `V`, `External`, `Mid`, `Internal`, `Viva` |
| **SPI / CPI / CGPA** | `SPI`, `CPI`, `CGPA`, `SPI Score`, `CPI Score` |
| **Backlogs** | `Current Backlog`, `Total Backlog`, `Cur_Back`, `Tot_Back` |

---

## 3. Validation Rules & Error Handling

Before database writes, every row is validated against:
1. **Required Fields**: Student Name, Enrollment Number, Branch, Semester, Subject Code, Grade.
2. **Enrollment Format**: 5 to 20 alphanumeric characters (`/^[A-Za-z0-9]{5,20}$/`).
3. **Semester Bound**: Integer between 1 and 6.
4. **Grade Allowed Set**: `AA`, `AB`, `BB`, `BC`, `CC`, `CD`, `DD`, `FF`, `NA`, `IF`, `ABS`.
5. **Numeric Ranges**: SPI/CPI/CGPA between `0.0` and `10.0`; non-negative integers for backlogs.

---

## 4. Transactional Guarantees

- Rows are grouped by Student + Semester + Academic Year.
- All groups are committed within a `prisma.$transaction`.
- If an unrecoverable failure occurs, the entire batch rolls back, preventing orphaned or partial records.
- Ingestion results are logged in `ImportJob` and `ImportRowError`.
