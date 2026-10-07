import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatNumber, formatDate } from '@/lib/utils';

export interface InstitutionReportHeader {
  institutionName?: string;
  department?: string;
  affiliation?: string;
  reportFooter?: string;
}

const DEFAULT_INSTITUTION: InstitutionReportHeader = {
  institutionName: 'L.E. COLLEGE / GOVERNMENT POLYTECHNIC',
  department: 'Academic Examination Section',
  affiliation: 'Gujarat Technological University (GTU Affiliated)',
  reportFooter: 'This is a computer-generated academic performance transcript for internal college review.',
};

/**
 * Generates an official-style Student Result Card / Transcript PDF
 */
export function generateStudentTranscriptPdf(student: any, institution: InstitutionReportHeader = DEFAULT_INSTITUTION): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const instName = institution.institutionName || DEFAULT_INSTITUTION.institutionName!;
  const deptName = institution.department || DEFAULT_INSTITUTION.department!;
  const affilName = institution.affiliation || DEFAULT_INSTITUTION.affiliation!;

  // 1. Institution Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(instName.toUpperCase(), 105, 9, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${deptName} • ${affilName}`, 105, 15, { align: 'center' });
  doc.text('STUDENT ACADEMIC PERFORMANCE TRANSCRIPT', 105, 20, { align: 'center' });

  // 2. Student Metadata Box
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  let currentY = 32;
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.roundedRect(14, currentY, 182, 26, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.roundedRect(14, currentY, 182, 26, 2, 2, 'D');

  doc.text(`Student Name:`, 18, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.fullName}`, 50, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text(`Branch:`, 130, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.branch.code} - ${student.branch.name}`, 150, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text(`Enrollment No:`, 18, currentY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.enrollmentNumber}`, 50, currentY + 15);

  doc.setFont('helvetica', 'bold');
  doc.text(`Seat No:`, 130, currentY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.seatNumber || 'N/A'}`, 150, currentY + 15);

  doc.setFont('helvetica', 'bold');
  doc.text(`Batch:`, 18, currentY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.batch || 'N/A'} (Adm: ${student.admissionYear})`, 50, currentY + 22);

  doc.setFont('helvetica', 'bold');
  doc.text(`Status:`, 130, currentY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.active ? 'ACTIVE' : 'INACTIVE'}`, 150, currentY + 22);

  currentY += 34;

  // 3. Semester-by-Semester Tables
  if (!student.semesterResults || student.semesterResults.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('No semester results recorded for this student yet.', 105, currentY + 15, { align: 'center' });
  } else {
    for (const semRes of student.semesterResults) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      // Semester Section Header
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, currentY, 182, 8, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(
        `${semRes.semester.name.toUpperCase()} (Academic Year: ${semRes.academicYear.name})`,
        18,
        currentY + 5.5
      );

      doc.setFontSize(9);
      doc.text(
        `Declared: ${semRes.declarationDate || 'Official'}`,
        192,
        currentY + 5.5,
        { align: 'right' }
      );

      currentY += 10;

      // Table of subjects
      const tableRows = semRes.subjectResults.map((sr: any) => [
        sr.subject.subjectCode,
        sr.subject.subjectName,
        sr.subject.credits.toFixed(1),
        sr.grade,
        sr.eIndicator || '-',
        sr.mIndicator || '-',
        sr.iIndicator || '-',
        sr.vIndicator || '-',
        sr.isBacklog ? 'BACKLOG' : 'CLEARED',
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Code', 'Subject Title', 'Credits', 'Grade', 'E', 'M', 'I', 'V', 'Result']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [51, 65, 85],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
          1: { cellWidth: 'auto' },
          2: { halign: 'center', cellWidth: 16 },
          3: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
          4: { halign: 'center', cellWidth: 10 },
          5: { halign: 'center', cellWidth: 10 },
          6: { halign: 'center', cellWidth: 10 },
          7: { halign: 'center', cellWidth: 10 },
          8: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        margin: { left: 14, right: 14 },
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 3;

      // Semester KPI Summary strip
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, currentY, 182, 8, 1, 1, 'F');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);

      const statusText = semRes.currentBacklog > 0 ? `FAIL (${semRes.currentBacklog} Backlog)` : 'PASS';
      doc.text(`SPI: ${formatNumber(semRes.spi)}`, 20, currentY + 5.5);
      doc.text(`CPI: ${formatNumber(semRes.cpi)}`, 60, currentY + 5.5);
      doc.text(`CGPA: ${formatNumber(semRes.cgpa)}`, 100, currentY + 5.5);
      doc.text(`Current Backlog: ${semRes.currentBacklog}`, 140, currentY + 5.5);
      doc.text(`Status: ${statusText}`, 175, currentY + 5.5);

      currentY += 14;
    }
  }

  // Page Footer with date and disclaimer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);

    doc.text(
      institution.reportFooter || DEFAULT_INSTITUTION.reportFooter!,
      14,
      288
    );
    doc.text(
      `Generated: ${new Date().toLocaleString('en-IN')} • Page ${i} of ${pageCount}`,
      196,
      288,
      { align: 'right' }
    );
  }

  return doc;
}

/**
 * Generates Semester Consolidated Master Sheet PDF
 */
export function generateSemesterReportPdf(
  semesterName: string,
  academicYear: string,
  branchName: string,
  results: any[],
  institution: InstitutionReportHeader = DEFAULT_INSTITUTION
): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 297, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text((institution.institutionName || DEFAULT_INSTITUTION.institutionName!).toUpperCase(), 148.5, 8, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`SEMESTER CONSOLIDATED RESULT REPORT • ${semesterName.toUpperCase()} • AY ${academicYear} • ${branchName.toUpperCase()}`, 148.5, 15, { align: 'center' });

  const tableRows = results.map((r: any, idx: number) => [
    idx + 1,
    r.student.enrollmentNumber,
    r.seatNumber || r.student.seatNumber || '-',
    r.student.fullName,
    r.student.branch.code,
    formatNumber(r.spi),
    formatNumber(r.cpi),
    formatNumber(r.cgpa),
    r.currentBacklog,
    r.totalBacklog,
    r.resultStatus,
  ]);

  autoTable(doc, {
    startY: 28,
    head: [['#', 'Enrollment No', 'Seat No', 'Student Name', 'Branch', 'SPI', 'CPI', 'CGPA', 'Cur. Back', 'Tot. Back', 'Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 32, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 26 },
      3: { cellWidth: 'auto' },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      6: { halign: 'center', cellWidth: 18 },
      7: { halign: 'center', cellWidth: 18 },
      8: { halign: 'center', cellWidth: 22 },
      9: { halign: 'center', cellWidth: 22 },
      10: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    margin: { left: 14, right: 14 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text(
      institution.reportFooter || DEFAULT_INSTITUTION.reportFooter!,
      14,
      202
    );
    doc.text(
      `Generated: ${new Date().toLocaleString('en-IN')} • Page ${i} of ${pageCount}`,
      283,
      202,
      { align: 'right' }
    );
  }

  return doc;
}
