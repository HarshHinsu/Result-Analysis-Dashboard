# Analytics & Calculation Engine Specifications

## 1. Grade-Point Scale Mapping

The standard 10-point scale is defined as follows:

| Letter Grade | Default Grade Point | Classification |
| :--- | :---: | :--- |
| **AA** | 10.0 | Outstanding (Passed) |
| **AB** | 9.0 | Excellent (Passed) |
| **BB** | 8.0 | Very Good (Passed) |
| **BC** | 7.0 | Good (Passed) |
| **CC** | 6.0 | Above Average (Passed) |
| **CD** | 5.0 | Average (Passed) |
| **DD** | 4.0 | Pass (Minimum Threshold) |
| **FF** | 0.0 | Fail (Active Backlog) |
| **NA / IF / ABS**| 0.0 | Not Cleared / Absent |

All mappings are stored in `CalculationConfig` and can be adjusted through the Admin Settings portal.

---

## 2. Calculation Formulas

### A. Semester Performance Index (SPI)
\[
\text{SPI} = \frac{\sum_{i=1}^{n} (\text{Credits}_i \times \text{GradePoint}_i)}{\sum_{i=1}^{n} \text{Credits}_i}
\]

### B. Cumulative Performance Index (CPI)
\[
\text{CPI} = \frac{\sum_{s=1}^{m} (\text{SPI}_s \times \text{TotalCredits}_s)}{\sum_{s=1}^{m} \text{TotalCredits}_s}
\]

### C. Pass Percentage
\[
\text{Pass Rate} = \left(\frac{\text{Students with 0 Current Backlogs}}{\text{Total Appeared Students}}\right) \times 100
\]

---

## 3. Official Imported Values vs. Derived Analytics

- When results are imported from GTU official spreadsheets containing pre-computed SPI/CPI/CGPA, the system preserves and displays the official imported numbers.
- When results are entered manually or when simulating grades, the calculation engine computes the exact SPI in real-time.
