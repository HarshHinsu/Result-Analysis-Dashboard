import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Result Analysis Dashboard | GTU Diploma Engineering",
  description:
    "Academic result management, SPI/CPI/CGPA analytics, backlog tracking, and report generation system for Diploma Engineering Colleges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full font-sans antialiased text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950">
        {children}
      </body>
    </html>
  );
}
