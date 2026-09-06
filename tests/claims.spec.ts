import { expect, test } from '@playwright/test';

async function openDemo(page: import('@playwright/test').Page) {
  await page.goto('/demo');
  await expect(page.getByRole('heading', { level: 1, name: 'Track supplier bills before they are due' })).toBeVisible();
  await expect(page.getByText('Demo — sample data, nothing is saved.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'North Works Paper' })).toBeVisible();
}

async function addBill(page: import('@playwright/test').Page, supplier: string, reference = 'TEST-101') {
  await page.getByRole('button', { name: 'Add a bill' }).first().click();
  await page.getByRole('textbox', { name: 'Supplier' }).fill(supplier);
  await page.getByRole('textbox', { name: /^Invoice or reference/ }).fill(reference);
  await page.getByRole('spinbutton', { name: 'Amount' }).fill('42.10');
  await page.getByRole('textbox', { name: /^Due date/ }).fill('2026-09-12');
  await page.getByRole('button', { name: 'Save bill' }).click();
}

test('@claim:demo-sandbox opens a realistic sample in one click, resets it, and keeps real data separate', async ({ page }) => {
  await page.goto('/');
  await addBill(page, 'Real Board Supplier', 'REAL-1');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();

  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText('Demo — sample data, nothing is saved.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'North Works Paper' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Real Board Supplier' })).toHaveCount(0);

  await addBill(page, 'Temporary Demo Supplier', 'DEMO-1');
  await expect(page.getByRole('heading', { name: 'Temporary Demo Supplier' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('heading', { name: 'Temporary Demo Supplier' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Real Board Supplier' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'North Works Paper' })).toHaveCount(0);
});

test('@claim:record-bills records supplier, reference, amount, currency, and a local due date', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Add a bill' }).first().click();
  await page.getByRole('textbox', { name: 'Supplier' }).fill('Willow Packaging');
  await page.getByRole('textbox', { name: /^Invoice or reference/ }).fill('WP-630');
  await page.getByRole('spinbutton', { name: 'Amount' }).fill('81.45');
  await page.getByLabel('Currency').selectOption('GBP');
  await page.getByRole('textbox', { name: /^Due date/ }).fill('2026-09-12');
  await page.getByRole('button', { name: 'Save bill' }).click();

  const bill = page.locator('.bill-item', { has: page.getByRole('heading', { name: 'Willow Packaging' }) });
  await expect(bill).toContainText('WP-630');
  await expect(bill).toContainText('£81.45');
  await expect(bill).toContainText(/(?:Sep 12, 2026|12 Sept 2026)/);
});

test('@claim:local-attachment keeps a PDF attachment in browser storage', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Add a bill' }).first().click();
  await page.getByRole('textbox', { name: 'Supplier' }).fill('Attachment Supplier');
  await page.getByRole('spinbutton', { name: 'Amount' }).fill('42.10');
  await page.getByRole('textbox', { name: /^Due date/ }).fill('2026-09-12');
  await page.getByLabel(/Invoice attachment/).setInputFiles({ name: 'invoice.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF local attachment') });
  await page.getByRole('button', { name: 'Save bill' }).click();
  await expect(page.getByRole('button', { name: /invoice.pdf/ })).toBeVisible();
  expect(await page.evaluate(async () => new Promise<{ name: string; type: string; size: number }>((resolve, reject) => {
    const request = indexedDB.open('demo:supplier-due-board', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const records = request.result.transaction('bills').objectStore('bills').getAll();
      records.onerror = () => reject(records.error);
      records.onsuccess = () => {
        const bill = records.result.find((record: { supplier: string }) => record.supplier === 'Attachment Supplier');
        resolve({ name: bill.attachment.name, type: bill.attachment.type, size: bill.attachment.size });
      };
    };
  }))).toEqual({ name: 'invoice.pdf', type: 'application/pdf', size: 21 });
});

test('@claim:board-summary shows due totals and supports search, filters, and sorting', async ({ page }) => {
  await openDemo(page);
  await expect(page.getByLabel('Bill summary')).toContainText('Due in 7 days');
  await expect(page.getByLabel('Bill summary')).toContainText('Overdue');
  await page.getByLabel('Find a supplier or invoice').fill('Cedar');
  await expect(page.getByRole('heading', { name: 'Cedar Supply Co.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'North Works Paper' })).toHaveCount(0);
  await page.getByLabel('Find a supplier or invoice').fill('');
  await page.getByRole('radio', { name: 'Paid' }).check();
  await expect(page.getByRole('heading', { name: 'Market Street Hardware' })).toBeVisible();
  await page.getByLabel('Sort by').selectOption('amount');
  await expect(page.locator('.bill-amount').first()).toContainText('$58.10');
});

test('@claim:paid-record records a paid date and note, then reopens the bill', async ({ page }) => {
  await openDemo(page);
  const northWorks = page.locator('.bill-item', { has: page.getByRole('heading', { name: 'North Works Paper' }) });
  await northWorks.getByRole('button', { name: 'Mark paid' }).click();
  await page.getByRole('textbox', { name: /^Paid date/ }).fill('2026-09-06');
  await page.getByLabel('Payment note').fill('Receipt 992');
  await page.getByRole('button', { name: 'Record paid' }).click();
  await expect(page.getByText('Receipt 992')).toBeVisible();
  await northWorks.getByRole('button', { name: 'Reopen' }).click();
  await page.getByRole('button', { name: 'Reopen bill' }).click();
  await expect(northWorks.getByText('Receipt 992')).toHaveCount(0);
  await expect(northWorks.getByRole('button', { name: 'Mark paid' })).toBeVisible();
});

test('@claim:weekly-print prepares the weekly supplier review', async ({ page }) => {
  await openDemo(page);
  await page.evaluate(() => { window.print = () => undefined; });
  await page.getByRole('button', { name: 'Print weekly list' }).click();
  await expect(page.locator('#print-sheet')).toContainText('Weekly supplier review');
  await expect(page.locator('#print-sheet')).toContainText('North Works Paper');
  await expect(page.locator('#print-sheet')).toContainText('Market Street Hardware');
});

test('@claim:data-controls exports JSON and CSV, imports a backup, and deletes local data', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Data controls' }).click();
  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export complete backup' }).click();
  const json = await jsonDownload;
  const jsonPath = await json.path();
  expect(jsonPath).not.toBeNull();

  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  expect(await (await csvDownload).suggestedFilename()).toMatch(/^due-board-\d{4}-\d{2}-\d{2}\.csv$/);

  await page.getByRole('button', { name: 'Delete all local data' }).click();
  await page.getByLabel('Delete the whole board?').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('No bills yet')).toBeVisible();

  await page.getByRole('button', { name: 'Data controls' }).click();
  await page.locator('#import-file').setInputFiles(jsonPath!);
  await page.getByRole('button', { name: 'Replace board' }).click();
  await expect(page.getByRole('heading', { name: 'North Works Paper' })).toBeVisible();
});

test('@claim:safe-import rejects an invalid backup without changing sample bills', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Data controls' }).click();
  await page.locator('#import-file').setInputFiles({
    name: 'invalid.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ product: 'supplier-due-board', version: 1, exportedAt: '2026-09-06T00:00:00.000Z', bills: [{ id: 'bad', supplier: 'Broken', invoiceNumber: {}, amountMinor: 100, currency: 'USD', dueDate: '2026-09-07', status: 'open', createdAt: '2026-09-06T00:00:00.000Z', updatedAt: '2026-09-06T00:00:00.000Z' }] })),
  });
  await expect(page.getByText('This file is not a valid Due Board v1 backup. Your current board was not changed.')).toBeVisible();
  await page.getByRole('button', { name: 'Close data controls' }).click();
  await expect(page.getByRole('heading', { name: 'North Works Paper' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Broken' })).toHaveCount(0);
});

test('@claim:offline-reload reloads the populated demo after the first visit while offline', async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(new URL('/demo', baseURL).toString());
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    });
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('Offline — your board still works on this device.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'North Works Paper' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('@claim:private-local uses the demo without an account and makes no tracking request', async ({ page, context }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await openDemo(page);
  await addBill(page, 'Private Local Supplier', 'LOCAL-1');
  await page.reload();
  expect([...origins]).toEqual([new URL(page.url()).origin]);
  expect(await context.cookies()).toEqual([]);
  await expect(page.getByRole('heading', { name: 'Private Local Supplier' })).toBeVisible();
});

test('@claim:manual-only records a paid status without connecting to a bank or sending payment', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await openDemo(page);
  const northWorks = page.locator('.bill-item', { has: page.getByRole('heading', { name: 'North Works Paper' }) });
  await northWorks.getByRole('button', { name: 'Mark paid' }).click();
  await page.getByRole('textbox', { name: /^Paid date/ }).fill('2026-09-06');
  await page.getByRole('button', { name: 'Record paid' }).click();
  await expect(northWorks.locator('.bill-status strong')).toHaveText('Paid');
  expect([...origins]).toEqual([new URL(page.url()).origin]);
});

test('@claim:free-use lets a visitor use sample data without a payment or account step', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await addBill(page, 'Free Use Supplier', 'FREE-1');
  await expect(page.getByRole('heading', { name: 'Free Use Supplier' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
