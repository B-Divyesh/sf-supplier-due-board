import type { Bill } from './types';

const DAY_MS = 86_400_000;

export function localDateISO(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parsePlainDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function plainDateNumber(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function daysFromToday(value: string, today = localDateISO()): number {
  return Math.round((plainDateNumber(value) - plainDateNumber(today)) / DAY_MS);
}

export function formatPlainDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(parsePlainDate(value));
}

export type DueTone = 'overdue' | 'soon' | 'later' | 'paid';

export function dueDescription(bill: Bill, today = localDateISO()): { label: string; detail: string; tone: DueTone } {
  if (bill.status === 'paid') {
    return {
      label: 'Paid',
      detail: bill.paidDate ? `Recorded ${formatPlainDate(bill.paidDate)}` : 'Payment recorded',
      tone: 'paid',
    };
  }
  const days = daysFromToday(bill.dueDate, today);
  if (days < 0) return { label: 'Overdue', detail: `${Math.abs(days)} day${days === -1 ? '' : 's'} late`, tone: 'overdue' };
  if (days === 0) return { label: 'Due today', detail: formatPlainDate(bill.dueDate), tone: 'soon' };
  if (days === 1) return { label: 'Due tomorrow', detail: formatPlainDate(bill.dueDate), tone: 'soon' };
  if (days <= 7) return { label: `Due in ${days} days`, detail: formatPlainDate(bill.dueDate), tone: 'soon' };
  return { label: 'Open', detail: `Due ${formatPlainDate(bill.dueDate)}`, tone: 'later' };
}

export function isInWeeklyReview(bill: Bill, today = localDateISO()): boolean {
  if (bill.status === 'open') return daysFromToday(bill.dueDate, today) <= 7;
  if (!bill.paidDate) return false;
  const age = daysFromToday(bill.paidDate, today);
  return age <= 0 && age >= -7;
}
