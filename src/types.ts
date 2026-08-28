export type BillStatus = 'open' | 'paid';

export interface LocalAttachment {
  name: string;
  type: string;
  size: number;
  data: Blob;
}

export interface Bill {
  id: string;
  supplier: string;
  invoiceNumber: string;
  amountMinor: number;
  currency: string;
  dueDate: string;
  status: BillStatus;
  paidDate?: string;
  paymentNote?: string;
  attachment?: LocalAttachment;
  createdAt: string;
  updatedAt: string;
}

export interface PortableAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface PortableBill extends Omit<Bill, 'attachment'> {
  attachment?: PortableAttachment;
}

export interface DueBoardBackup {
  product: 'supplier-due-board';
  version: 1;
  exportedAt: string;
  bills: PortableBill[];
}
