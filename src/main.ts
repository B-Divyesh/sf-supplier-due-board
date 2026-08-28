import './styles.css';
import { billStore } from './db';
import { daysFromToday, dueDescription, formatPlainDate, isInWeeklyReview, localDateISO } from './date';
import type { Bill, DueBoardBackup, PortableBill } from './types';

type StatusFilter = 'all' | 'open' | 'paid';
type RangeFilter = 'all' | '7' | '30';
type SortMode = 'due' | 'supplier' | 'amount';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Due Board could not start.');

root.innerHTML = `
  <div class="offline-ribbon" id="offline-ribbon" role="status" hidden>
    <span aria-hidden="true">↯</span> Offline — your board still works on this device.
  </div>
  <header class="site-header">
    <div class="header-inner">
      <a class="wordmark" href="/" aria-label="Due Board home"><span>DUE</span><i></i><span>BOARD</span></a>
      <nav aria-label="Product">
        <button class="text-button" type="button" id="data-button">Data controls</button>
        <button class="text-button install-button" type="button" id="install-button" hidden>Install app</button>
      </nav>
    </div>
  </header>
  <main id="main">
    <section class="intro wrap" aria-labelledby="page-title">
      <div class="intro-copy">
        <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span> Local supplier ledger</p>
        <h1 id="page-title">Know what’s due.<br><em>Nothing more.</em></h1>
        <p class="lede">One private place for incoming bills, due dates, and the note that proves you handled them.</p>
        <div class="intro-actions">
          <button class="primary-button" type="button" data-add-bill><span aria-hidden="true">＋</span> Add a bill</button>
          <button class="secondary-button" type="button" id="print-button"><span aria-hidden="true">▤</span> Print weekly list</button>
        </div>
        <p class="local-note"><strong>No account.</strong> Bills and attachments stay in this browser.</p>
      </div>
      <figure class="material-figure">
        <picture>
          <source type="image/avif" srcset="/assets/due-board-material-1536.avif 1536w" sizes="(max-width: 760px) 100vw, 430px" />
          <img src="/assets/due-board-material-768.webp" srcset="/assets/due-board-material-768.webp 768w, /assets/due-board-material-1536.webp 1536w" sizes="(max-width: 760px) 100vw, 430px" width="768" height="512" alt="Blank cream invoice slips clipped on rough concrete beside a strip of moss" fetchpriority="high" decoding="async" />
        </picture>
        <figcaption>Keep the paper. See the week.</figcaption>
      </figure>
    </section>

    <section class="board wrap" aria-labelledby="board-heading">
      <div class="section-heading">
        <div><p class="eyebrow">Current position</p><h2 id="board-heading">Your due board</h2></div>
        <p class="as-of">As of <time id="today-label"></time> <span title="Dates use your device’s local calendar day">local date</span></p>
      </div>
      <dl class="metrics" id="metrics" aria-label="Bill summary">
        <div class="metric metric-soon"><dt>Due in 7 days</dt><dd>—<small>Loading bills</small></dd></div>
        <div class="metric metric-overdue"><dt>Overdue</dt><dd>—<small>Loading bills</small></dd></div>
        <div class="metric metric-paid"><dt>Paid this month</dt><dd>—<small>Loading bills</small></dd></div>
      </dl>

      <div class="index-strip" aria-label="Bill filters">
        <div class="search-field">
          <label for="search">Find a supplier or invoice</label>
          <div><span aria-hidden="true">⌕</span><input id="search" type="search" autocomplete="off" placeholder="Search the board" /></div>
        </div>
        <fieldset class="segmented" id="status-filter"><legend>Status</legend>
          <label><input type="radio" name="status" value="all" checked /><span>All</span></label>
          <label><input type="radio" name="status" value="open" /><span>Open</span></label>
          <label><input type="radio" name="status" value="paid" /><span>Paid</span></label>
        </fieldset>
        <label class="select-field" for="range-filter">Due window
          <select id="range-filter"><option value="all">Any date</option><option value="7">Next 7 days + overdue</option><option value="30">Next 30 days + overdue</option></select>
        </label>
        <label class="select-field" for="sort-mode">Sort by
          <select id="sort-mode"><option value="due">Due date</option><option value="supplier">Supplier</option><option value="amount">Amount</option></select>
        </label>
      </div>
      <div class="result-meta"><p id="result-count" aria-live="polite">Loading your local board…</p><span class="rule" aria-hidden="true"></span></div>
      <div id="results" aria-busy="true">
        <div class="loading-state" role="status"><span></span><span></span><span></span><p>Opening the local ledger…</p></div>
      </div>
    </section>

    <section class="promise wrap" aria-label="Product boundaries">
      <p class="eyebrow">Built with restraint</p>
      <div><p><strong>It remembers deadlines.</strong><br />It does not touch your bank.</p><p><strong>It stores your proof.</strong><br />It does not send a payment.</p><p><strong>It works offline.</strong><br />It does not create an account.</p></div>
    </section>
  </main>

  <footer class="site-footer"><div class="wrap">
    <p><strong>Due Board</strong><br />A local-first utility for small businesses.</p>
    <nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav>
    <p class="disclosure">Material image generated for this product. No tracking. Not financial advice.</p>
  </div></footer>

  <dialog id="bill-dialog" class="sheet-dialog" aria-labelledby="bill-dialog-title">
    <form id="bill-form" method="dialog" novalidate>
      <div class="dialog-head"><div><p class="eyebrow">Supplier ledger</p><h2 id="bill-dialog-title">Add a bill</h2></div><button class="icon-button" type="button" data-close aria-label="Close bill form">×</button></div>
      <p class="dialog-intro">Record what you need to act. Dates are calendar dates on this device—no hidden time zone conversion.</p>
      <input type="hidden" id="bill-id" />
      <div class="field-grid">
        <label class="field field-wide" for="supplier">Supplier <span aria-hidden="true">*</span><input id="supplier" name="supplier" required maxlength="80" autocomplete="organization" /></label>
        <label class="field" for="invoice-number">Invoice or reference <span class="optional">Optional</span><input id="invoice-number" name="invoiceNumber" maxlength="50" autocomplete="off" /></label>
        <div class="amount-group"><label class="field" for="amount">Amount <span aria-hidden="true">*</span><input id="amount" name="amount" type="number" min="0.01" max="999999999.99" step="0.01" inputmode="decimal" required /></label><label class="field currency-field" for="currency">Currency<select id="currency" name="currency"><option>USD</option><option>GBP</option><option>EUR</option><option>INR</option><option>AUD</option><option>CAD</option><option>NZD</option><option>ZAR</option></select></label></div>
        <label class="field" for="due-date">Due date <span aria-hidden="true">*</span><input id="due-date" name="dueDate" type="date" required /><small>Uses your device’s local calendar date.</small></label>
        <label class="field field-wide file-field" for="attachment">Invoice attachment <span class="optional">Optional · PDF or image, up to 8 MB</span><input id="attachment" name="attachment" type="file" accept="application/pdf,image/*" /><span class="file-prompt">Choose a file from this device</span></label>
        <div id="existing-attachment" class="existing-attachment" hidden></div>
      </div>
      <p class="form-error" id="bill-error" role="alert"></p>
      <div class="dialog-actions"><button class="secondary-button" type="button" data-close>Cancel</button><button class="primary-button" type="submit" id="save-bill">Save bill</button></div>
    </form>
  </dialog>

  <dialog id="paid-dialog" class="sheet-dialog compact-dialog" aria-labelledby="paid-dialog-title">
    <form id="paid-form" method="dialog" novalidate>
      <div class="dialog-head"><div><p class="eyebrow">Proof of payment</p><h2 id="paid-dialog-title">Mark as paid</h2></div><button class="icon-button" type="button" data-close aria-label="Close payment form">×</button></div>
      <p class="dialog-intro" id="paid-supplier"></p><input id="paid-id" type="hidden" />
      <label class="field" for="paid-date">Paid date <span aria-hidden="true">*</span><input id="paid-date" type="date" required /><small>Enter the date shown on your payment record.</small></label>
      <label class="field" for="payment-note">Payment note <span class="optional">Optional</span><textarea id="payment-note" maxlength="240" rows="3" placeholder="Confirmation code, method, or reminder"></textarea></label>
      <p class="form-error" id="paid-error" role="alert"></p>
      <div class="dialog-actions"><button class="secondary-button" type="button" data-close>Cancel</button><button class="primary-button" type="submit">Record paid</button></div>
    </form>
  </dialog>

  <dialog id="data-dialog" class="sheet-dialog compact-dialog" aria-labelledby="data-dialog-title">
    <div class="dialog-head"><div><p class="eyebrow">Local ownership</p><h2 id="data-dialog-title">Data controls</h2></div><button class="icon-button" type="button" data-close aria-label="Close data controls">×</button></div>
    <p class="dialog-intro"><strong id="storage-count">0 bills</strong> are stored only in this browser. Complete JSON backups include attachments; CSV files do not.</p>
    <div class="data-actions"><button type="button" class="secondary-button" id="export-json">Export complete backup</button><button type="button" class="secondary-button" id="export-csv">Export CSV</button><label class="secondary-button import-label" for="import-file">Import JSON backup<input id="import-file" type="file" accept="application/json,.json" /></label></div>
    <div class="danger-zone"><h3>Delete local data</h3><p>This removes every bill and attachment from this browser.</p><button type="button" class="danger-button" id="delete-all">Delete all local data</button></div>
    <p class="form-error" id="data-error" role="alert"></p>
  </dialog>

  <dialog id="confirm-dialog" class="confirm-dialog" aria-labelledby="confirm-title"><form method="dialog"><p class="eyebrow">Please confirm</p><h2 id="confirm-title">Delete?</h2><p id="confirm-copy"></p><div class="dialog-actions"><button value="cancel" class="secondary-button">Cancel</button><button value="confirm" class="danger-button" id="confirm-action">Delete</button></div></form></dialog>
  <div class="toast" id="toast" role="status" aria-live="polite" hidden><p id="toast-message"></p><button id="toast-action" type="button" hidden>Open action</button><button class="toast-close" type="button" aria-label="Dismiss message">×</button></div>
  <section id="print-sheet" aria-label="Weekly printable due list"></section>
`;

const $ = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing interface element: ${selector}`);
  return element;
};

const billDialog = $<HTMLDialogElement>('#bill-dialog');
const paidDialog = $<HTMLDialogElement>('#paid-dialog');
const dataDialog = $<HTMLDialogElement>('#data-dialog');
const confirmDialog = $<HTMLDialogElement>('#confirm-dialog');
const billForm = $<HTMLFormElement>('#bill-form');
const paidForm = $<HTMLFormElement>('#paid-form');
const results = $<HTMLDivElement>('#results');
const toast = $<HTMLDivElement>('#toast');

let bills: Bill[] = [];
let statusFilter: StatusFilter = 'all';
let rangeFilter: RangeFilter = 'all';
let sortMode: SortMode = 'due';
let searchTerm = '';
let toastTimer = 0;
let deletedBill: Bill | null = null;
let installPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char);
}

function formatMoney(amountMinor: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amountMinor / 100);
  } catch {
    return `${currency} ${(amountMinor / 100).toFixed(2)}`;
  }
}

function amountSummary(items: Bill[]): string {
  if (!items.length) return '—';
  const totals = new Map<string, number>();
  items.forEach((bill) => totals.set(bill.currency, (totals.get(bill.currency) ?? 0) + bill.amountMinor));
  if (totals.size === 1) {
    const [currency, value] = [...totals.entries()][0];
    return formatMoney(value, currency);
  }
  return [...totals.entries()].map(([currency, value]) => `${currency} ${(value / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).join(' · ');
}

function metricMarkup(label: string, items: Bill[], className: string): string {
  return `<div class="metric ${className}"><dt>${label}</dt><dd>${escapeHtml(amountSummary(items))}<small>${items.length} bill${items.length === 1 ? '' : 's'}</small></dd></div>`;
}

function visibleBills(): Bill[] {
  const query = searchTerm.trim().toLocaleLowerCase();
  return bills.filter((bill) => {
    if (statusFilter !== 'all' && bill.status !== statusFilter) return false;
    if (query && !`${bill.supplier} ${bill.invoiceNumber}`.toLocaleLowerCase().includes(query)) return false;
    if (rangeFilter !== 'all') {
      if (bill.status === 'paid') return false;
      const days = daysFromToday(bill.dueDate);
      if (days > Number(rangeFilter)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortMode === 'supplier') return a.supplier.localeCompare(b.supplier);
    if (sortMode === 'amount') return b.amountMinor - a.amountMinor;
    if (a.status !== b.status) return a.status === 'open' ? -1 : 1;
    return a.dueDate.localeCompare(b.dueDate) || a.supplier.localeCompare(b.supplier);
  });
}

function renderMetrics(): void {
  const today = localDateISO();
  const dueSoon = bills.filter((bill) => bill.status === 'open' && daysFromToday(bill.dueDate, today) >= 0 && daysFromToday(bill.dueDate, today) <= 7);
  const overdue = bills.filter((bill) => bill.status === 'open' && daysFromToday(bill.dueDate, today) < 0);
  const month = today.slice(0, 7);
  const paid = bills.filter((bill) => bill.status === 'paid' && bill.paidDate?.startsWith(month));
  $('#metrics').innerHTML = metricMarkup('Due in 7 days', dueSoon, 'metric-soon') + metricMarkup('Overdue', overdue, 'metric-overdue') + metricMarkup('Paid this month', paid, 'metric-paid');
}

function billMarkup(bill: Bill): string {
  const due = dueDescription(bill);
  const reference = bill.invoiceNumber ? `<span><b>Reference</b>${escapeHtml(bill.invoiceNumber)}</span>` : '';
  const attachment = bill.attachment ? `<button class="attachment-button" type="button" data-action="attachment" data-id="${bill.id}" title="Download ${escapeHtml(bill.attachment.name)}"><span aria-hidden="true">⌑</span><span><b>Attachment</b>${escapeHtml(bill.attachment.name)}</span></button>` : '';
  const paymentNote = bill.status === 'paid' && bill.paymentNote ? `<p class="payment-proof"><b>Payment note</b>${escapeHtml(bill.paymentNote)}</p>` : '';
  return `<li class="bill-item tone-${due.tone}"><article>
    <div class="bill-status"><span aria-hidden="true">${bill.status === 'paid' ? '✓' : due.tone === 'overdue' ? '!' : '○'}</span><div><strong>${escapeHtml(due.label)}</strong><small>${escapeHtml(due.detail)}</small></div></div>
    <div class="bill-main"><h3>${escapeHtml(bill.supplier)}</h3><div class="bill-facts">${reference}<span><b>Due date</b>${escapeHtml(formatPlainDate(bill.dueDate))}</span>${attachment}</div>${paymentNote}</div>
    <p class="bill-amount">${escapeHtml(formatMoney(bill.amountMinor, bill.currency))}</p>
    <div class="bill-actions">
      ${bill.status === 'open' ? `<button type="button" class="paid-button" data-action="paid" data-id="${bill.id}">Mark paid</button>` : `<button type="button" class="plain-action" data-action="paid" data-id="${bill.id}">Edit payment</button><button type="button" class="plain-action" data-action="reopen" data-id="${bill.id}">Reopen</button>`}
      <button type="button" class="plain-action" data-action="edit" data-id="${bill.id}">Edit</button>
      <button type="button" class="plain-action danger-link" data-action="delete" data-id="${bill.id}">Delete</button>
    </div>
  </article></li>`;
}

function render(): void {
  renderMetrics();
  const shown = visibleBills();
  const count = $('#result-count');
  results.setAttribute('aria-busy', 'false');
  if (!bills.length) {
    count.textContent = 'No bills yet';
    results.innerHTML = `<div class="empty-state"><div class="empty-mark" aria-hidden="true"><span></span><span></span><i>✓</i></div><p class="eyebrow">Clear board</p><h2>Start with the next bill.</h2><p>Add the invoice that is most likely to get lost in your inbox. It stays on this device.</p><button class="primary-button" type="button" data-add-bill>Add your first bill</button></div>`;
  } else if (!shown.length) {
    count.textContent = 'No bills match these filters';
    results.innerHTML = `<div class="filtered-empty"><p class="eyebrow">Nothing in this section</p><h2>No matching bills.</h2><p>Change a filter or search term to bring the rest of the board back.</p><button type="button" class="secondary-button" data-clear-filters>Clear filters</button></div>`;
  } else {
    count.textContent = `Showing ${shown.length} of ${bills.length} bill${bills.length === 1 ? '' : 's'}`;
    results.innerHTML = `<ol class="bill-list">${shown.map(billMarkup).join('')}</ol>`;
  }
  $('#storage-count').textContent = `${bills.length} bill${bills.length === 1 ? '' : 's'}`;
}

function showToast(message: string, actionLabel?: string, action?: () => void): void {
  window.clearTimeout(toastTimer);
  $('#toast-message').textContent = message;
  const actionButton = $<HTMLButtonElement>('#toast-action');
  actionButton.hidden = !actionLabel;
  actionButton.textContent = actionLabel ?? '';
  actionButton.onclick = action ?? null;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, actionLabel ? 9_000 : 5_000);
}

function closeDialog(dialog: HTMLDialogElement): void {
  if (dialog.open) dialog.close();
}

function openBillDialog(bill?: Bill): void {
  billForm.reset();
  $('#bill-error').textContent = '';
  const attachmentArea = $<HTMLDivElement>('#existing-attachment');
  attachmentArea.hidden = true;
  attachmentArea.innerHTML = '';
  $<HTMLHeadingElement>('#bill-dialog-title').textContent = bill ? 'Edit bill' : 'Add a bill';
  $<HTMLButtonElement>('#save-bill').textContent = bill ? 'Save changes' : 'Save bill';
  $<HTMLInputElement>('#bill-id').value = bill?.id ?? '';
  $<HTMLInputElement>('#supplier').value = bill?.supplier ?? '';
  $<HTMLInputElement>('#invoice-number').value = bill?.invoiceNumber ?? '';
  $<HTMLInputElement>('#amount').value = bill ? (bill.amountMinor / 100).toFixed(2) : '';
  $<HTMLSelectElement>('#currency').value = bill?.currency ?? localStorage.getItem('due-board-currency') ?? 'USD';
  $<HTMLInputElement>('#due-date').value = bill?.dueDate ?? localDateISO();
  if (bill?.attachment) {
    attachmentArea.hidden = false;
    attachmentArea.innerHTML = `<span><b>Current attachment</b>${escapeHtml(bill.attachment.name)} · ${Math.ceil(bill.attachment.size / 1024)} KB</span><label><input type="checkbox" id="remove-attachment" /> Remove when saved</label>`;
  }
  billDialog.showModal();
  requestAnimationFrame(() => $<HTMLInputElement>('#supplier').focus());
}

function openPaidDialog(bill: Bill): void {
  paidForm.reset();
  $('#paid-error').textContent = '';
  $<HTMLInputElement>('#paid-id').value = bill.id;
  $('#paid-supplier').textContent = `${bill.supplier} · ${formatMoney(bill.amountMinor, bill.currency)}`;
  $<HTMLInputElement>('#paid-date').value = bill.paidDate ?? localDateISO();
  $<HTMLTextAreaElement>('#payment-note').value = bill.paymentNote ?? '';
  paidDialog.showModal();
  requestAnimationFrame(() => $<HTMLInputElement>('#paid-date').focus());
}

async function askToConfirm(title: string, copy: string, actionLabel = 'Delete'): Promise<boolean> {
  $('#confirm-title').textContent = title;
  $('#confirm-copy').textContent = copy;
  $('#confirm-action').textContent = actionLabel;
  confirmDialog.showModal();
  return new Promise((resolve) => confirmDialog.addEventListener('close', () => resolve(confirmDialog.returnValue === 'confirm'), { once: true }));
}

async function saveBill(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (!billForm.reportValidity()) return;
  const fileInput = $<HTMLInputElement>('#attachment');
  const file = fileInput.files?.[0];
  if (file && file.size > 8 * 1024 * 1024) {
    $('#bill-error').textContent = 'That attachment is over 8 MB. Choose a smaller PDF or image.';
    fileInput.focus();
    return;
  }
  if (file && !(file.type === 'application/pdf' || file.type.startsWith('image/'))) {
    $('#bill-error').textContent = 'Choose a PDF or image attachment.';
    fileInput.focus();
    return;
  }
  const id = $<HTMLInputElement>('#bill-id').value;
  const existing = bills.find((bill) => bill.id === id);
  const now = new Date().toISOString();
  let attachment = existing?.attachment;
  if (document.querySelector<HTMLInputElement>('#remove-attachment')?.checked) attachment = undefined;
  if (file) attachment = { name: file.name, type: file.type || 'application/octet-stream', size: file.size, data: file };
  const amountMinor = Math.round(Number($<HTMLInputElement>('#amount').value) * 100);
  const bill: Bill = {
    id: existing?.id ?? crypto.randomUUID(),
    supplier: $<HTMLInputElement>('#supplier').value.trim(),
    invoiceNumber: $<HTMLInputElement>('#invoice-number').value.trim(),
    amountMinor,
    currency: $<HTMLSelectElement>('#currency').value,
    dueDate: $<HTMLInputElement>('#due-date').value,
    status: existing?.status ?? 'open',
    paidDate: existing?.paidDate,
    paymentNote: existing?.paymentNote,
    attachment,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  try {
    await billStore.put(bill);
    localStorage.setItem('due-board-currency', bill.currency);
    bills = existing ? bills.map((item) => item.id === bill.id ? bill : item) : [...bills, bill];
    closeDialog(billDialog);
    render();
    showToast(existing ? `${bill.supplier} was updated.` : `${bill.supplier} was added to the board.`);
  } catch (error) {
    $('#bill-error').textContent = `${error instanceof Error ? error.message : 'The bill could not be saved.'} Your entries are still in the form; try again.`;
  }
}

async function savePaid(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (!paidForm.reportValidity()) return;
  const id = $<HTMLInputElement>('#paid-id').value;
  const bill = bills.find((item) => item.id === id);
  if (!bill) return;
  const updated: Bill = { ...bill, status: 'paid', paidDate: $<HTMLInputElement>('#paid-date').value, paymentNote: $<HTMLTextAreaElement>('#payment-note').value.trim(), updatedAt: new Date().toISOString() };
  try {
    await billStore.put(updated);
    bills = bills.map((item) => item.id === id ? updated : item);
    closeDialog(paidDialog);
    render();
    showToast(`${bill.supplier} is recorded as paid.`, 'View paid', () => {
      statusFilter = 'paid';
      const radio = $<HTMLInputElement>('input[name="status"][value="paid"]');
      radio.checked = true;
      render();
      toast.hidden = true;
    });
  } catch (error) {
    $('#paid-error').textContent = error instanceof Error ? error.message : 'The payment note could not be saved. Try again.';
  }
}

async function reopenBill(bill: Bill): Promise<void> {
  const confirmed = await askToConfirm(`Reopen ${bill.supplier}?`, 'This removes its paid date and payment note and returns the bill to the open list.', 'Reopen bill');
  if (!confirmed) return;
  const updated: Bill = { ...bill, status: 'open', paidDate: undefined, paymentNote: undefined, updatedAt: new Date().toISOString() };
  await billStore.put(updated);
  bills = bills.map((item) => item.id === bill.id ? updated : item);
  render();
  showToast(`${bill.supplier} is open again.`);
}

async function deleteBill(bill: Bill): Promise<void> {
  const confirmed = await askToConfirm(`Delete ${bill.supplier}?`, `This removes ${formatMoney(bill.amountMinor, bill.currency)} due ${formatPlainDate(bill.dueDate)} and its local attachment, if any.`);
  if (!confirmed) return;
  try {
    await billStore.delete(bill.id);
    bills = bills.filter((item) => item.id !== bill.id);
    deletedBill = bill;
    render();
    showToast(`${bill.supplier} was deleted.`, 'Undo', async () => {
      if (!deletedBill || deletedBill.id !== bill.id) return;
      await billStore.put(deletedBill);
      bills = [...bills, deletedBill];
      deletedBill = null;
      render();
      showToast('Bill restored.');
    });
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'The bill could not be deleted.');
  }
}

function downloadAttachment(bill: Bill): void {
  if (!bill.attachment) return;
  const url = URL.createObjectURL(bill.attachment.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = bill.attachment.name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

async function fileToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('An attachment could not be exported.'));
    reader.readAsDataURL(blob);
  });
}

async function portableBills(): Promise<PortableBill[]> {
  return Promise.all(bills.map(async ({ attachment, ...bill }) => ({
    ...bill,
    attachment: attachment ? { name: attachment.name, type: attachment.type, size: attachment.size, dataUrl: await fileToDataUrl(attachment.data) } : undefined,
  })));
}

function downloadFile(name: string, content: BlobPart, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

async function exportJson(): Promise<void> {
  try {
    const backup: DueBoardBackup = { product: 'supplier-due-board', version: 1, exportedAt: new Date().toISOString(), bills: await portableBills() };
    downloadFile(`due-board-backup-${localDateISO()}.json`, JSON.stringify(backup, null, 2), 'application/json');
    showToast('Complete backup downloaded. Keep it somewhere safe.');
  } catch (error) {
    $('#data-error').textContent = error instanceof Error ? error.message : 'The backup could not be created.';
  }
}

function csvCell(value: string | number): string {
  const text = String(value);
  const spreadsheetSafe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${spreadsheetSafe.replaceAll('"', '""')}"`;
}

function exportCsv(): void {
  const header = ['Supplier', 'Invoice reference', 'Amount', 'Currency', 'Due date', 'Status', 'Paid date', 'Payment note', 'Attachment name'];
  const rows = bills.map((bill) => [bill.supplier, bill.invoiceNumber, (bill.amountMinor / 100).toFixed(2), bill.currency, bill.dueDate, bill.status, bill.paidDate ?? '', bill.paymentNote ?? '', bill.attachment?.name ?? '']);
  const csv = '\uFEFF' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  downloadFile(`due-board-${localDateISO()}.csv`, csv, 'text/csv;charset=utf-8');
  showToast('CSV downloaded. Attachments are named, not embedded.');
}

function dataUrlToBlob(value: string): Blob {
  const match = /^data:([^;,]*)(;base64)?,(.*)$/.exec(value);
  if (!match) throw new Error('The backup contains an invalid attachment.');
  const bytes = match[2] ? atob(match[3]) : decodeURIComponent(match[3]);
  const array = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) array[index] = bytes.charCodeAt(index);
  return new Blob([array], { type: match[1] || 'application/octet-stream' });
}

function validatePortableBill(value: unknown): value is PortableBill {
  if (!value || typeof value !== 'object') return false;
  const bill = value as Partial<PortableBill>;
  return typeof bill.id === 'string' && typeof bill.supplier === 'string' && bill.supplier.length > 0 && typeof bill.amountMinor === 'number' && Number.isSafeInteger(bill.amountMinor) && bill.amountMinor > 0 && typeof bill.currency === 'string' && /^[A-Z]{3}$/.test(bill.currency) && typeof bill.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(bill.dueDate) && (bill.status === 'open' || bill.status === 'paid') && typeof bill.createdAt === 'string' && typeof bill.updatedAt === 'string';
}

async function importBackup(file: File): Promise<void> {
  $('#data-error').textContent = '';
  if (file.size > 60 * 1024 * 1024) throw new Error('That backup is over 60 MB and is too large to import safely.');
  const parsed: unknown = JSON.parse(await file.text());
  if (!parsed || typeof parsed !== 'object') throw new Error('This is not a Due Board backup.');
  const backup = parsed as Partial<DueBoardBackup>;
  if (backup.product !== 'supplier-due-board' || backup.version !== 1 || !Array.isArray(backup.bills) || !backup.bills.every(validatePortableBill)) throw new Error('This file is not a valid Due Board v1 backup.');
  const imported: Bill[] = backup.bills.map(({ attachment, ...bill }) => ({
    ...bill,
    attachment: attachment ? { name: attachment.name, type: attachment.type, size: attachment.size, data: dataUrlToBlob(attachment.dataUrl) } : undefined,
  }));
  const confirmed = await askToConfirm('Replace this board?', `Importing ${imported.length} bill${imported.length === 1 ? '' : 's'} will replace the ${bills.length} currently stored here. Export a backup first if you need both.`, 'Replace board');
  if (!confirmed) return;
  await billStore.replaceAll(imported);
  bills = imported;
  closeDialog(dataDialog);
  render();
  showToast(`${imported.length} bill${imported.length === 1 ? '' : 's'} imported.`);
}

async function deleteAll(): Promise<void> {
  const confirmed = await askToConfirm('Delete the whole board?', `This permanently removes ${bills.length} bill${bills.length === 1 ? '' : 's'} and every local attachment from this browser. Export first if you may need them.`);
  if (!confirmed) return;
  try {
    await billStore.clear();
    bills = [];
    closeDialog(dataDialog);
    render();
    showToast('All local Due Board data was deleted.');
  } catch (error) {
    $('#data-error').textContent = error instanceof Error ? error.message : 'Local data could not be deleted.';
  }
}

function printWeeklyList(): void {
  const weekly = bills.filter((bill) => isInWeeklyReview(bill)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const open = weekly.filter((bill) => bill.status === 'open');
  const paid = weekly.filter((bill) => bill.status === 'paid');
  const rows = (items: Bill[]) => items.length ? items.map((bill) => `<tr><td>${escapeHtml(bill.supplier)}${bill.invoiceNumber ? `<small>${escapeHtml(bill.invoiceNumber)}</small>` : ''}</td><td>${escapeHtml(formatMoney(bill.amountMinor, bill.currency))}</td><td>${escapeHtml(formatPlainDate(bill.dueDate))}</td><td>${escapeHtml(dueDescription(bill).label)}${bill.paidDate ? `<small>${escapeHtml(formatPlainDate(bill.paidDate))}</small>` : ''}</td><td class="check-cell">□</td></tr>`).join('') : '<tr><td colspan="5">None this week.</td></tr>';
  $('#print-sheet').innerHTML = `<header><p>DUE / BOARD</p><h2>Weekly supplier review</h2><span>Prepared ${escapeHtml(formatPlainDate(localDateISO()))} · local calendar dates</span></header><section><h3>Needs attention · overdue and due in 7 days</h3><table><thead><tr><th>Supplier / ref.</th><th>Amount</th><th>Due</th><th>Status</th><th>Done</th></tr></thead><tbody>${rows(open)}</tbody></table></section><section><h3>Paid in the last 7 days</h3><table><thead><tr><th>Supplier / ref.</th><th>Amount</th><th>Due</th><th>Status</th><th>Checked</th></tr></thead><tbody>${rows(paid)}</tbody></table></section><footer>Generated from records stored locally in Due Board. Verify against your payment source.</footer>`;
  window.print();
}

results.addEventListener('click', (event) => {
  const target = (event.target as Element).closest<HTMLElement>('[data-action], [data-add-bill], [data-clear-filters]');
  if (!target) return;
  if (target.hasAttribute('data-add-bill')) { openBillDialog(); return; }
  if (target.hasAttribute('data-clear-filters')) {
    searchTerm = ''; statusFilter = 'all'; rangeFilter = 'all';
    $<HTMLInputElement>('#search').value = '';
    $<HTMLInputElement>('input[name="status"][value="all"]').checked = true;
    $<HTMLSelectElement>('#range-filter').value = 'all';
    render(); return;
  }
  const id = target.dataset.id;
  const bill = bills.find((item) => item.id === id);
  if (!bill) return;
  if (target.dataset.action === 'edit') openBillDialog(bill);
  if (target.dataset.action === 'paid') openPaidDialog(bill);
  if (target.dataset.action === 'delete') void deleteBill(bill);
  if (target.dataset.action === 'reopen') void reopenBill(bill);
  if (target.dataset.action === 'attachment') downloadAttachment(bill);
});

document.querySelectorAll<HTMLElement>('[data-add-bill]').forEach((button) => button.addEventListener('click', () => openBillDialog()));
document.querySelectorAll<HTMLButtonElement>('[data-close]').forEach((button) => button.addEventListener('click', () => closeDialog(button.closest('dialog') as HTMLDialogElement)));
document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(dialog); }));
billForm.addEventListener('submit', (event) => void saveBill(event));
paidForm.addEventListener('submit', (event) => void savePaid(event));
$<HTMLInputElement>('#search').addEventListener('input', (event) => { searchTerm = (event.currentTarget as HTMLInputElement).value; render(); });
$('#status-filter').addEventListener('change', (event) => { statusFilter = (event.target as HTMLInputElement).value as StatusFilter; render(); });
$<HTMLSelectElement>('#range-filter').addEventListener('change', (event) => { rangeFilter = (event.currentTarget as HTMLSelectElement).value as RangeFilter; render(); });
$<HTMLSelectElement>('#sort-mode').addEventListener('change', (event) => { sortMode = (event.currentTarget as HTMLSelectElement).value as SortMode; render(); });
$('#data-button').addEventListener('click', () => { $('#data-error').textContent = ''; dataDialog.showModal(); });
$('#export-json').addEventListener('click', () => void exportJson());
$('#export-csv').addEventListener('click', exportCsv);
$('#import-file').addEventListener('change', async (event) => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try { await importBackup(file); } catch (error) { $('#data-error').textContent = error instanceof Error ? error.message : 'The backup could not be imported.'; }
  input.value = '';
});
$('#delete-all').addEventListener('click', () => void deleteAll());
$('#print-button').addEventListener('click', printWeeklyList);
$('.toast-close').addEventListener('click', () => { toast.hidden = true; });

function updateNetworkState(): void {
  $<HTMLDivElement>('#offline-ribbon').hidden = navigator.onLine;
}
window.addEventListener('online', () => { updateNetworkState(); showToast('Back online. Your local board is unchanged.'); });
window.addEventListener('offline', updateNetworkState);
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event as BeforeInstallPromptEvent;
  $<HTMLButtonElement>('#install-button').hidden = false;
});
$('#install-button').addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  const choice = await installPrompt.userChoice;
  if (choice.outcome === 'accepted') $<HTMLButtonElement>('#install-button').hidden = true;
  installPrompt = null;
});

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const wasControlled = Boolean(navigator.serviceWorker.controller);
  const registration = await navigator.serviceWorker.register('/sw.js');
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        showToast('A fresh version of Due Board is ready.', 'Update now', () => worker.postMessage({ type: 'SKIP_WAITING' }));
      }
    });
  });
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!wasControlled) return;
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

async function start(): Promise<void> {
  $('#today-label').textContent = formatPlainDate(localDateISO());
  $<HTMLTimeElement>('#today-label').dateTime = localDateISO();
  updateNetworkState();
  try {
    bills = await billStore.list();
    render();
  } catch (error) {
    results.setAttribute('aria-busy', 'false');
    $('#result-count').textContent = 'The local board could not be opened';
    results.innerHTML = `<div class="error-state"><p class="eyebrow">Storage unavailable</p><h2>Your browser did not open the local ledger.</h2><p>${escapeHtml(error instanceof Error ? error.message : 'Local storage is unavailable.')} Check private-browsing or storage settings, then retry.</p><button type="button" class="primary-button" id="retry-storage">Retry</button></div>`;
    $('#retry-storage').addEventListener('click', () => window.location.reload());
  }
  try { await registerServiceWorker(); } catch { /* The app remains usable without installation. */ }
}

void start();
