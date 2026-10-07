import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return value.toFixed(decimals);
}

export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getGradeBadgeColor(grade: string): { bg: string; text: string; border: string } {
  switch (grade?.toUpperCase()) {
    case 'AA':
      return { bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300', text: 'text-emerald-700', border: 'border-emerald-200 dark:border-emerald-800' };
    case 'AB':
      return { bg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300', text: 'text-teal-700', border: 'border-teal-200 dark:border-teal-800' };
    case 'BB':
      return { bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300', text: 'text-blue-700', border: 'border-blue-200 dark:border-blue-800' };
    case 'BC':
      return { bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300', text: 'text-indigo-700', border: 'border-indigo-200 dark:border-indigo-800' };
    case 'CC':
      return { bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300', text: 'text-amber-700', border: 'border-amber-200 dark:border-amber-800' };
    case 'CD':
      return { bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300', text: 'text-orange-700', border: 'border-orange-200 dark:border-orange-800' };
    case 'DD':
      return { bg: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300', text: 'text-yellow-800', border: 'border-yellow-200 dark:border-yellow-800' };
    case 'FF':
    case 'NA':
    case 'IF':
      return { bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300', text: 'text-rose-700', border: 'border-rose-200 dark:border-rose-800' };
    default:
      return { bg: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300', text: 'text-slate-700', border: 'border-slate-200 dark:border-slate-700' };
  }
}

export function getStatusBadge(status: string | null | undefined): { label: string; className: string } {
  switch (status?.toUpperCase()) {
    case 'PASS':
      return { label: 'PASS', className: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300' };
    case 'FAIL':
      return { label: 'FAIL', className: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300' };
    case 'WITHHELD':
      return { label: 'WITHHELD', className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300' };
    default:
      return { label: status || 'UNKNOWN', className: 'bg-slate-100 text-slate-800 border-slate-300' };
  }
}
