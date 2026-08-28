import type { Bill, DueBoardBackup, PortableAttachment, PortableBill } from './types';

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_BILLS = 50_000;
const MAX_AMOUNT_MINOR = 99_999_999_999;
const CURRENCIES = new Set(['USD', 'GBP', 'EUR', 'INR', 'AUD', 'CAD', 'NZD', 'ZAR']);

function invalid(): never {
  throw new Error('This file is not a valid Due Board v1 backup. Your current board was not changed.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPlainDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= monthDays[month - 1];
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value));
}

function optionalString(value: unknown, maxLength: number): value is string | undefined {
  return value === undefined || (typeof value === 'string' && value.length <= maxLength);
}

function attachmentFromPortable(value: unknown): Bill['attachment'] {
  if (!isRecord(value)) invalid();
  const { name, type, size, dataUrl } = value as Partial<PortableAttachment>;
  if (
    typeof name !== 'string' || name.trim().length === 0 || name.length > 255 ||
    typeof type !== 'string' || type.length > 100 || !(type === 'application/pdf' || type.startsWith('image/')) ||
    !Number.isSafeInteger(size) || (size as number) < 0 || (size as number) > MAX_ATTACHMENT_BYTES ||
    typeof dataUrl !== 'string'
  ) invalid();

  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/.exec(dataUrl);
  if (!match || match[1] !== type) invalid();
  let binary: string;
  try {
    binary = atob(match[2]);
  } catch {
    invalid();
  }
  if (binary.length !== size) invalid();
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { name: name.trim(), type, size, data: new Blob([bytes], { type }) };
}

function materializeBill(value: unknown): Bill {
  if (!isRecord(value)) invalid();
  const bill = value as Partial<PortableBill>;
  const supplier = typeof bill.supplier === 'string' ? bill.supplier.trim() : '';
  if (
    typeof bill.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(bill.id) ||
    !supplier || supplier.length > 80 ||
    typeof bill.invoiceNumber !== 'string' || bill.invoiceNumber.length > 50 ||
    !Number.isSafeInteger(bill.amountMinor) || (bill.amountMinor as number) < 1 || (bill.amountMinor as number) > MAX_AMOUNT_MINOR ||
    typeof bill.currency !== 'string' || !CURRENCIES.has(bill.currency) ||
    !isPlainDate(bill.dueDate) ||
    (bill.status !== 'open' && bill.status !== 'paid') ||
    !isTimestamp(bill.createdAt) || !isTimestamp(bill.updatedAt) ||
    Date.parse(bill.updatedAt) < Date.parse(bill.createdAt) ||
    !optionalString(bill.paymentNote, 240)
  ) invalid();

  if (bill.status === 'paid') {
    if (!isPlainDate(bill.paidDate)) invalid();
  } else if (bill.paidDate !== undefined || bill.paymentNote !== undefined) {
    invalid();
  }

  return {
    id: bill.id,
    supplier,
    invoiceNumber: bill.invoiceNumber.trim(),
    amountMinor: bill.amountMinor as number,
    currency: bill.currency,
    dueDate: bill.dueDate,
    status: bill.status,
    paidDate: bill.paidDate,
    paymentNote: bill.paymentNote?.trim(),
    attachment: bill.attachment === undefined ? undefined : attachmentFromPortable(bill.attachment),
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
  };
}

export function materializeBackup(value: unknown): Bill[] {
  if (!isRecord(value)) throw new Error('This is not a Due Board backup. Your current board was not changed.');
  const backup = value as Partial<DueBoardBackup>;
  if (
    backup.product !== 'supplier-due-board' || backup.version !== 1 ||
    !isTimestamp(backup.exportedAt) || !Array.isArray(backup.bills) || backup.bills.length > MAX_BILLS
  ) invalid();
  const bills = backup.bills.map(materializeBill);
  if (new Set(bills.map((bill) => bill.id)).size !== bills.length) invalid();
  return bills;
}
