import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
