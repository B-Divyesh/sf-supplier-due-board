import { describe, expect, it } from 'vitest';
import { materializeBackup } from './backup';

const timestamp = '2026-08-28T07:00:00.000Z';

function validBackup() {
  return {
    product: 'supplier-due-board',
    version: 1,
    exportedAt: timestamp,
    bills: [{
      id: 'app-generated-id',
      supplier: 'North Works Paper',
      invoiceNumber: 'NW-204',
      amountMinor: 18_425,
      currency: 'USD',
      dueDate: '2026-09-04',
      status: 'paid',
      paidDate: '2026-08-28',
      paymentNote: 'Bank reference 8831',
      attachment: {
        name: 'north-works.pdf',
        type: 'application/pdf',
        size: 6,
        dataUrl: 'data:application/pdf;base64,JVBERi0x',
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    }],
  };
}

describe('Due Board backup materialization', () => {
  it('materializes every field in an app-generated backup before storage', async () => {
    const [bill] = materializeBackup(validBackup());
    expect(bill).toMatchObject({
      id: 'app-generated-id',
      supplier: 'North Works Paper',
      invoiceNumber: 'NW-204',
      status: 'paid',
      paidDate: '2026-08-28',
    });
    expect(bill.attachment).toMatchObject({ name: 'north-works.pdf', type: 'application/pdf', size: 6 });
    expect(await bill.attachment?.data.text()).toBe('%PDF-1');
  });

  it.each([
    ['unsafe record ID', (backup: ReturnType<typeof validBackup>) => { backup.bills[0].id = 'bad\" id'; }],
    ['non-string invoice reference', (backup: ReturnType<typeof validBackup>) => { backup.bills[0].invoiceNumber = {} as string; }],
    ['trimmed-empty supplier', (backup: ReturnType<typeof validBackup>) => { backup.bills[0].supplier = '   '; }],
    ['unsupported currency', (backup: ReturnType<typeof validBackup>) => { backup.bills[0].currency = 'XYZ'; }],
    ['amount above the form limit', (backup: ReturnType<typeof validBackup>) => { backup.bills[0].amountMinor = 100_000_000_000; }],
    ['impossible calendar date', (backup: ReturnType<typeof validBackup>) => { backup.bills[0].dueDate = '2026-02-30'; }],
    ['paid bill without a paid date', (backup: ReturnType<typeof validBackup>) => { delete (backup.bills[0] as Partial<(typeof backup.bills)[number]>).paidDate; }],
    ['invalid update timestamp', (backup: ReturnType<typeof validBackup>) => { backup.bills[0].updatedAt = 'not-a-timestamp'; }],
    ['non-string payment note', (backup: ReturnType<typeof validBackup>) => { backup.bills[0].paymentNote = {} as string; }],
    ['attachment above 8 MB', (backup: ReturnType<typeof validBackup>) => { backup.bills[0].attachment.size = 8 * 1024 * 1024 + 1; }],
    ['attachment size mismatch', (backup: ReturnType<typeof validBackup>) => { backup.bills[0].attachment.size = 7; }],
    ['attachment MIME mismatch', (backup: ReturnType<typeof validBackup>) => { backup.bills[0].attachment.type = 'image/png'; }],
  ])('rejects %s', (_label, mutate) => {
    const backup = validBackup();
    mutate(backup);
    expect(() => materializeBackup(backup)).toThrow('Your current board was not changed');
  });

  it('rejects duplicate record IDs', () => {
    const backup = validBackup();
    backup.bills.push(structuredClone(backup.bills[0]));
    expect(() => materializeBackup(backup)).toThrow('Your current board was not changed');
  });
});
