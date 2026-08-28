import { describe, expect, it } from 'vitest';
import type { Bill } from './types';
import { daysFromToday, dueDescription, isInWeeklyReview } from './date';

const bill = (values: Partial<Bill> = {}): Bill => ({
  id: '1', supplier: 'North Works', invoiceNumber: '', amountMinor: 1000,
  currency: 'USD', dueDate: '2026-08-28', status: 'open',
  createdAt: '2026-08-01T12:00:00.000Z', updatedAt: '2026-08-01T12:00:00.000Z', ...values,
});

describe('plain calendar date calculations', () => {
  it('does not depend on daylight-saving-hour differences', () => {
    expect(daysFromToday('2026-03-09', '2026-03-08')).toBe(1);
  });

  it('labels overdue and near due bills in words', () => {
    expect(dueDescription(bill({ dueDate: '2026-08-26' }), '2026-08-28')).toMatchObject({ label: 'Overdue', detail: '2 days late' });
    expect(dueDescription(bill({ dueDate: '2026-08-29' }), '2026-08-28')).toMatchObject({ label: 'Due tomorrow' });
  });

  it('includes overdue, next-seven-day, and recently paid bills in a weekly review', () => {
    expect(isInWeeklyReview(bill({ dueDate: '2026-08-20' }), '2026-08-28')).toBe(true);
    expect(isInWeeklyReview(bill({ dueDate: '2026-09-05' }), '2026-08-28')).toBe(false);
    expect(isInWeeklyReview(bill({ status: 'paid', paidDate: '2026-08-23' }), '2026-08-28')).toBe(true);
  });
});
