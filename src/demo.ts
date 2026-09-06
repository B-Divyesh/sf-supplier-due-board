import { localDateISO } from './date';
import type { Bill } from './types';

export const REAL_DATABASE_NAME = 'supplier-due-board';
export const DEMO_DATABASE_NAME = 'demo:supplier-due-board';

function dateOffset(days: number, now: Date): string {
  return localDateISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 12));
}

export function isDemoLocation(location: Location = window.location): boolean {
  return location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
}

export function createDemoBills(now = new Date()): Bill[] {
  const timestamp = now.toISOString();
  return [
    {
      id: 'demo-north-works', supplier: 'North Works Paper', invoiceNumber: 'NW-204', amountMinor: 18425,
      currency: 'USD', dueDate: dateOffset(-2, now), status: 'open', createdAt: timestamp, updatedAt: timestamp,
    },
    {
      id: 'demo-harbor-electric', supplier: 'Harbor Electric', invoiceNumber: 'HE-8821', amountMinor: 9670,
      currency: 'USD', dueDate: dateOffset(0, now), status: 'open', createdAt: timestamp, updatedAt: timestamp,
    },
    {
      id: 'demo-cedar-supply', supplier: 'Cedar Supply Co.', invoiceNumber: 'CS-418', amountMinor: 32750,
      currency: 'USD', dueDate: dateOffset(3, now), status: 'open', createdAt: timestamp, updatedAt: timestamp,
    },
    {
      id: 'demo-grove-maintenance', supplier: 'Grove Maintenance', invoiceNumber: 'GM-091', amountMinor: 12500,
      currency: 'USD', dueDate: dateOffset(11, now), status: 'open', createdAt: timestamp, updatedAt: timestamp,
    },
    {
      id: 'demo-market-street', supplier: 'Market Street Hardware', invoiceNumber: 'MSH-77', amountMinor: 5810,
      currency: 'USD', dueDate: dateOffset(-5, now), status: 'paid', paidDate: dateOffset(-1, now),
      paymentNote: 'Receipt 7412', createdAt: timestamp, updatedAt: timestamp,
    },
  ];
}
