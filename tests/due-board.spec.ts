import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const timestamp = '2026-08-28T07:00:00.000Z';

function portableBill(overrides: Record<string, unknown> = {}) {
  return {
    id: 'good-existing',
    supplier: 'Existing Timber',
    invoiceNumber: 'ET-12',
    amountMinor: 1500,
    currency: 'USD',
    dueDate: '2026-09-04',
    status: 'open',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function backupWith(...bills: ReturnType<typeof portableBill>[]) {
  return { product: 'supplier-due-board', version: 1, exportedAt: timestamp, bills };
}

async function importBackup(page: import('@playwright/test').Page, backup: unknown) {
  await page.locator('#import-file').setInputFiles({
    name: 'due-board-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
}

test('adds, persists, pays, and reopens a supplier bill', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /Know what’s due/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start with the next bill.' })).toBeVisible();

  await page.getByRole('button', { name: 'Add your first bill' }).click();
  await page.getByLabel('Supplier *').fill('North Works Paper');
  await page.getByLabel('Invoice or reference').fill('NW-204');
  await page.getByLabel('Amount *').fill('184.25');
  await page.getByLabel('Currency').selectOption('USD');
  await page.getByLabel('Due date *').fill('2026-09-04');
  await page.getByLabel('Invoice attachment').setInputFiles({ name: 'north-works.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 local test invoice') });
  await page.getByRole('button', { name: 'Save bill' }).click();

  await expect(page.getByRole('heading', { name: 'North Works Paper' })).toBeVisible();
  await expect(page.locator('.bill-amount').getByText('$184.25')).toBeVisible();
  await expect(page.getByRole('button', { name: /north-works.pdf/ })).toBeVisible();
  const firstAttachment = page.waitForEvent('download');
  await page.getByRole('button', { name: /north-works.pdf/ }).click();
  await expect((await firstAttachment).suggestedFilename()).toBe('north-works.pdf');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'North Works Paper' })).toBeVisible();
  await expect(page.getByRole('button', { name: /north-works.pdf/ })).toBeVisible();

  await page.getByRole('button', { name: 'Mark paid' }).click();
  await expect(page.getByRole('heading', { name: 'Mark as paid' })).toBeVisible();
  await page.getByLabel('Paid date *').fill('2026-08-28');
  await page.getByLabel('Payment note').fill('Bank reference 8831');
  await page.getByRole('button', { name: 'Record paid' }).click();
  await expect(page.getByText('Bank reference 8831')).toBeVisible();
  await expect(page.locator('.bill-status strong').getByText('Paid', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Reopen' }).click();
  await expect(page.getByRole('heading', { name: 'Reopen North Works Paper?' })).toBeVisible();
  await page.getByRole('button', { name: 'Reopen bill' }).click();
  await expect(page.getByRole('button', { name: 'Mark paid' })).toBeVisible();

  await page.getByRole('button', { name: 'Data controls' }).click();
  const backupDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export complete backup' }).click();
  await expect((await backupDownload).suggestedFilename()).toMatch(/^due-board-backup-\d{4}-\d{2}-\d{2}\.json$/);
});

test('has no serious accessibility violations in empty and form states', async ({ page }) => {
  await page.goto('/');
  let results = await new AxeBuilder({ page }).exclude('.material-figure').analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);

  await page.getByRole('button', { name: 'Add your first bill' }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('rejects a whitespace-only supplier before any record is saved', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add your first bill' }).click();
  await page.getByLabel('Supplier *').fill('   ');
  await page.getByLabel('Amount *').fill('15.00');
  await page.getByLabel('Due date *').fill('2026-09-04');
  await page.getByRole('button', { name: 'Save bill' }).click();

  await expect(page.getByText('Enter a supplier name, not only spaces.')).toBeVisible();
  await expect(page.locator('#bill-dialog')).toHaveAttribute('open', '');
  expect(await page.getByLabel('Supplier *').evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(false);
  expect(await page.evaluate(async () => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('supplier-due-board', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const count = request.result.transaction('bills').objectStore('bills').count();
      count.onsuccess = () => resolve(count.result);
      count.onerror = () => reject(count.error);
    };
  }))).toBe(0);
});

test('rejects a bad-shaped backup without confirmation or mutation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Data controls' }).click();
  await importBackup(page, backupWith(portableBill()));
  await page.getByRole('button', { name: 'Replace board' }).click();
  await expect(page.getByRole('heading', { name: 'Existing Timber' })).toBeVisible();

  await page.getByRole('button', { name: 'Data controls' }).click();
  await importBackup(page, backupWith(portableBill({ id: 'bad-shape', supplier: 'Broken Shape', invoiceNumber: { unsafe: true } })));
  await expect(page.getByText('This file is not a valid Due Board v1 backup. Your current board was not changed.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Replace this board?' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Close data controls' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Existing Timber' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Broken Shape' })).toHaveCount(0);
});

test('round-trips an app-generated complete backup with its attachment', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add your first bill' }).click();
  await page.getByLabel('Supplier *').fill('Round Trip Paper');
  await page.getByLabel('Invoice or reference').fill('RT-44');
  await page.getByLabel('Amount *').fill('42.10');
  await page.getByLabel('Due date *').fill('2026-09-04');
  await page.getByLabel('Invoice attachment').setInputFiles({ name: 'round-trip.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF exact round trip') });
  await page.getByRole('button', { name: 'Save bill' }).click();

  await page.getByRole('button', { name: 'Data controls' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export complete backup' }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).not.toBeNull();

  await page.getByRole('button', { name: 'Delete all local data' }).click();
  await page.getByLabel('Delete the whole board?').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Start with the next bill.' })).toBeVisible();
  await page.getByRole('button', { name: 'Data controls' }).click();
  await page.locator('#import-file').setInputFiles(backupPath!);
  await page.getByRole('button', { name: 'Replace board' }).click();
  await expect(page.getByRole('heading', { name: 'Round Trip Paper' })).toBeVisible();
  const attachmentDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /round-trip.pdf/ }).click();
  expect(await (await attachmentDownload).createReadStream().then(async (stream) => {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString();
  })).toBe('%PDF exact round trip');
});

test('mobile controls meet target size and the hero uses the shallow 768px AVIF', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', '390px geometry regression');
  await page.goto('/');
  await page.getByRole('button', { name: 'Data controls' }).click();
  await importBackup(page, backupWith(portableBill()));
  await page.getByRole('button', { name: 'Replace board' }).click();

  await expect(page.getByRole('link', { name: 'DUE BOARD', exact: true })).toBeVisible();
  for (const locator of [
    page.getByRole('link', { name: 'DUE BOARD', exact: true }),
    page.getByRole('button', { name: 'Edit', exact: true }),
    page.getByRole('link', { name: 'Privacy', exact: true }),
    page.getByRole('link', { name: 'Terms', exact: true }),
  ]) {
    const box = await locator.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.locator('.material-figure img').evaluate((image: HTMLImageElement) => image.offsetHeight)).toBeLessThanOrEqual(176);
  expect(await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name).filter((name) => name.includes('due-board-material')))).toContain(`${new URL(page.url()).origin}/assets/due-board-material-768.avif`);
});

test('reloads the board while fully offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
  });
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline — your board still works on this device.')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: /Know what’s due/ })).toBeVisible();
});
