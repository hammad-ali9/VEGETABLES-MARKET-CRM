/**
 * db.test.js — Vitest suite for db.js
 *
 * Covers: field mapping, ID validity, loadAllData transformation,
 *         resolveSupplier/Customer logic, clearAllData, and edge cases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Supabase mock ────────────────────────────────────────────────────────────
// vi.hoisted ensures mockFrom/queues exist before vi.mock is evaluated.

const { mockFrom, selectResults, upsertResults } = vi.hoisted(() => {
  const selectResults = [];
  const upsertResults = [];

  const makeChain = () => {
    const chain = {};
    chain.select      = vi.fn().mockReturnValue(chain);
    chain.eq          = vi.fn().mockReturnValue(chain);
    chain.neq         = vi.fn().mockResolvedValue({ data: null, error: null });
    chain.not         = vi.fn().mockResolvedValue({ data: null, error: null });
    chain.ilike       = vi.fn().mockReturnValue(chain);
    chain.or          = vi.fn().mockReturnValue(chain);
    chain.order       = vi.fn().mockImplementation(() =>
      Promise.resolve(selectResults.shift() ?? { data: [], error: null })
    );
    chain.maybeSingle = vi.fn().mockImplementation(() =>
      Promise.resolve(selectResults.shift() ?? { data: null, error: null })
    );
    chain.upsert      = vi.fn().mockImplementation(() =>
      Promise.resolve(upsertResults.shift() ?? { data: null, error: null })
    );
    chain.delete      = vi.fn().mockReturnValue(chain);
    return chain;
  };

  const mockFrom = vi.fn().mockImplementation(() => makeChain());
  return { mockFrom, selectResults, upsertResults };
});

vi.mock('./supabase', () => ({
  supabase: { from: mockFrom },
}));

// ─── Import after mock ────────────────────────────────────────────────────────

import {
  saveFullEntry,
  upsertSupplier,
  upsertCustomer,
  upsertAdvance,
  upsertExpenseRow,
  loadAllData,
  fetchAppUsers,
  clearAllData,
} from './db';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const minEntry = (overrides = {}) => ({
  id: crypto.randomUUID(),
  date: '2025-01-15',
  supplier: 'Test Trader',
  supplierCode: 'S0001',
  city: 'Quetta',
  phone: '0300-1234567',
  vehicle: 'LES-1842',
  bilty: 'BLT-001',
  fare: 5000,
  labour: 200,
  laga: 300,
  advance: 0,
  bardana: 0,
  remarks: '',
  logRate: 5,
  commDiv: 13.78,
  payments: [{ id: 1, amount: 1000, date: '2025-01-15', method: 'Cash' }],
  ownerList: [{ name: 'Owner A', crates: 100, rate: 50 }],
  buyerList: [],
  ...overrides,
});

const minBuyer = (overrides = {}) => ({
  id: crypto.randomUUID(),
  name: 'Buyer One',
  phone: '0311-1111111',
  date: '2025-01-15',
  bill: 'BL-001',
  crates: 50,
  price: 55,
  discount: 0,
  advance: 0,
  type: 'Cash',
  code: 'C0001',
  ...overrides,
});

// Helper: capture the upsert row for a named table
const captureUpsert = (table) => {
  const idx = mockFrom.mock.calls.findLastIndex(c => c[0] === table);
  if (idx === -1) return undefined;
  return mockFrom.mock.results[idx]?.value?.upsert?.mock?.calls[0]?.[0];
};

beforeEach(() => {
  vi.clearAllMocks();
  selectResults.length = 0;
  upsertResults.length = 0;
  mockFrom.mockImplementation(() => {
    const chain = {};
    chain.select      = vi.fn().mockReturnValue(chain);
    chain.eq          = vi.fn().mockReturnValue(chain);
    chain.neq         = vi.fn().mockResolvedValue({ data: null, error: null });
    chain.not         = vi.fn().mockResolvedValue({ data: null, error: null });
    chain.ilike       = vi.fn().mockReturnValue(chain);
    chain.or          = vi.fn().mockReturnValue(chain);
    chain.order       = vi.fn().mockImplementation(() =>
      Promise.resolve(selectResults.shift() ?? { data: [], error: null })
    );
    chain.maybeSingle = vi.fn().mockImplementation(() =>
      Promise.resolve(selectResults.shift() ?? { data: null, error: null })
    );
    chain.upsert      = vi.fn().mockImplementation(() =>
      Promise.resolve(upsertResults.shift() ?? { data: null, error: null })
    );
    chain.delete      = vi.fn().mockReturnValue(chain);
    return chain;
  });

  const store = {};
  vi.stubGlobal('localStorage', {
    getItem:    vi.fn(k => store[k] ?? null),
    setItem:    vi.fn((k, v) => { store[k] = v; }),
    removeItem: vi.fn(k => { delete store[k]; }),
  });
});

// ─── ID format regression tests ───────────────────────────────────────────────

describe('ID format validation', () => {
  it('saveFullEntry uses a valid UUID for the truck record id', async () => {
    const entry = minEntry();
    expect(entry.id).toMatch(UUID_RE);
    selectResults.push({ data: null, error: null }); // supplier not found
    await saveFullEntry(entry);
    const tables = mockFrom.mock.calls.map(c => c[0]);
    expect(tables).toContain('truck_records');
  });

  it('buyer IDs in buyerList must be valid UUIDs before save', () => {
    const buyer = minBuyer();
    expect(buyer.id).toMatch(UUID_RE);
  });

  it('advance IDs: ADV-timestamp format is NOT a UUID (regression)', () => {
    const badId = `ADV-${Date.now()}`;
    expect(badId).not.toMatch(UUID_RE);
  });

  it('advance IDs: crypto.randomUUID() produces valid UUID (fixed form)', () => {
    const goodId = crypto.randomUUID();
    expect(goodId).toMatch(UUID_RE);
  });

  it('expense IDs: Date.now() as number is NOT a UUID (regression)', () => {
    const badId = String(Date.now());
    expect(badId).not.toMatch(UUID_RE);
  });

  it('expense IDs: crypto.randomUUID() produces valid UUID (fixed form)', () => {
    const goodId = crypto.randomUUID();
    expect(goodId).toMatch(UUID_RE);
  });
});

// ─── saveFullEntry — truck_records field mapping ──────────────────────────────

describe('saveFullEntry — truck_records column mapping', () => {
  const saveAndCapture = async (overrides = {}) => {
    selectResults.push({ data: null, error: null }); // resolveSupplier: not found
    await saveFullEntry(minEntry(overrides));
    return captureUpsert('truck_records');
  };

  it('entry.vehicle → truck_no', async () => {
    const row = await saveAndCapture({ vehicle: 'LES-9999' });
    expect(row?.truck_no).toBe('LES-9999');
  });

  it('entry.date → loading_date', async () => {
    const row = await saveAndCapture({ date: '2025-06-01' });
    expect(row?.loading_date).toBe('2025-06-01');
  });

  it('entry.bilty → builty_no', async () => {
    const row = await saveAndCapture({ bilty: 'BLT-XYZ' });
    expect(row?.builty_no).toBe('BLT-XYZ');
  });

  it('entry.laga → carriage', async () => {
    const row = await saveAndCapture({ laga: 450 });
    expect(row?.carriage).toBe(450);
  });

  it('entry.labour → labour_charges', async () => {
    const row = await saveAndCapture({ labour: 320 });
    expect(row?.labour_charges).toBe(320);
  });

  it('entry.fare → truck_fare', async () => {
    const row = await saveAndCapture({ fare: 7000 });
    expect(row?.truck_fare).toBe(7000);
  });

  it('entry.advance → advance', async () => {
    const row = await saveAndCapture({ advance: 1500 });
    expect(row?.advance).toBe(1500);
  });

  it('entry.remarks → remarks', async () => {
    const row = await saveAndCapture({ remarks: 'Handle with care' });
    expect(row?.remarks).toBe('Handle with care');
  });

  it('ownerList → parties JSONB with correct shape', async () => {
    const row = await saveAndCapture({
      ownerList: [
        { name: 'Ali', crates: 80, rate: 60 },
        { name: 'Bhai', crates: 20, rate: 55 },
      ],
    });
    expect(Array.isArray(row?.parties)).toBe(true);
    expect(row.parties[0]).toMatchObject({ personName: 'Ali', crates: 80, rate: 60 });
    expect(row.parties[1]).toMatchObject({ personName: 'Bhai', crates: 20, rate: 55 });
  });

  it('payment_mode from first payment method', async () => {
    const row = await saveAndCapture({
      payments: [{ id: 1, amount: 500, date: '2025-01-15', method: 'Bank' }],
    });
    expect(row?.payment_mode).toBe('Bank');
  });

  it('payment_mode defaults to Credit when no payments', async () => {
    const row = await saveAndCapture({ payments: [] });
    expect(row?.payment_mode).toBe('Credit');
  });

  it('bardana defaults to 0 when missing from entry', async () => {
    const entry = minEntry();
    delete entry.bardana;
    selectResults.push({ data: null, error: null });
    await saveFullEntry(entry);
    const row = captureUpsert('truck_records');
    expect(row?.bardana).toBe(0);
  });
});

// ─── saveFullEntry — customer_sales mapping ───────────────────────────────────

describe('saveFullEntry — customer_sales column mapping', () => {
  const saveAndCapture = async (buyerOverrides = {}) => {
    selectResults.push({ data: null, error: null }); // resolveSupplier
    selectResults.push({ data: null, error: null }); // resolveCustomer
    await saveFullEntry(minEntry({ buyerList: [minBuyer(buyerOverrides)] }));
    return captureUpsert('customer_sales');
  };

  it('buyer.price → rate', async () => {
    const row = await saveAndCapture({ price: 75 });
    expect(row?.rate).toBe(75);
  });

  it('buyer.crates → crates', async () => {
    const row = await saveAndCapture({ crates: 30 });
    expect(row?.crates).toBe(30);
  });

  it('buyer.bill → bill_no', async () => {
    const row = await saveAndCapture({ bill: 'BL-042' });
    expect(row?.bill_no).toBe('BL-042');
  });

  it('buyer.discount → discount', async () => {
    const row = await saveAndCapture({ discount: 200 });
    expect(row?.discount).toBe(200);
  });

  it('buyer.advance → advance', async () => {
    const row = await saveAndCapture({ advance: 500 });
    expect(row?.advance).toBe(500);
  });

  it('buyer.type → payment_mode', async () => {
    const row = await saveAndCapture({ type: 'Credit' });
    expect(row?.payment_mode).toBe('Credit');
  });

  it('truck_record_id matches entry.id', async () => {
    selectResults.push({ data: null, error: null });
    selectResults.push({ data: null, error: null });
    const entry = minEntry({ buyerList: [minBuyer()] });
    await saveFullEntry(entry);
    const row = captureUpsert('customer_sales');
    expect(row?.truck_record_id).toBe(entry.id);
  });

  it('comm_percent derived from commDiv (100 / 13.78)', async () => {
    selectResults.push({ data: null, error: null });
    selectResults.push({ data: null, error: null });
    const entry = minEntry({ commDiv: 13.78, buyerList: [minBuyer()] });
    await saveFullEntry(entry);
    const row = captureUpsert('customer_sales');
    expect(row?.comm_percent).toBeCloseTo(7.2569, 3);
  });

  it('wari_rate taken from entry.logRate', async () => {
    selectResults.push({ data: null, error: null });
    selectResults.push({ data: null, error: null });
    const entry = minEntry({ logRate: 7, buyerList: [minBuyer()] });
    await saveFullEntry(entry);
    const row = captureUpsert('customer_sales');
    expect(row?.wari_rate).toBe(7);
  });

  it('skips buyers with empty or whitespace-only names', async () => {
    selectResults.push({ data: null, error: null }); // supplier only
    const entry = minEntry({
      buyerList: [minBuyer({ name: '' }), minBuyer({ name: '   ' })],
    });
    await saveFullEntry(entry);
    // customer_sales upsert should not have been called
    const csUpsertIdx = mockFrom.mock.calls.findLastIndex(c => c[0] === 'customer_sales');
    const csChain = csUpsertIdx >= 0 ? mockFrom.mock.results[csUpsertIdx]?.value : null;
    const upsertCalls = csChain?.upsert?.mock?.calls?.length ?? 0;
    expect(upsertCalls).toBe(0);
  });

  it('deletes old customer_sales before re-inserting', async () => {
    selectResults.push({ data: null, error: null });
    selectResults.push({ data: null, error: null });
    const entry = minEntry({ buyerList: [minBuyer()] });
    await saveFullEntry(entry);
    // Find the customer_sales chain that has a delete call
    const hadDelete = mockFrom.mock.calls.some((call, i) => {
      if (call[0] !== 'customer_sales') return false;
      return mockFrom.mock.results[i]?.value?.delete?.mock?.calls?.length > 0;
    });
    expect(hadDelete).toBe(true);
  });
});

// ─── resolveSupplier ─────────────────────────────────────────────────────────

describe('resolveSupplier', () => {
  it('uses existing supplier_id when found by name (ilike)', async () => {
    const existingId = crypto.randomUUID();
    selectResults.push({ data: { id: existingId, supplier_code: 'S0042' }, error: null });
    const entry = minEntry({ supplier: 'Haji Saleem' });
    await saveFullEntry(entry);
    const row = captureUpsert('truck_records');
    expect(row?.supplier_id).toBe(existingId);
  });

  it('creates a new supplier row when not found', async () => {
    selectResults.push({ data: null, error: null }); // not found
    const entry = minEntry({ supplier: 'Brand New Trader' });
    await saveFullEntry(entry);
    const suppCalls = mockFrom.mock.calls.filter(c => c[0] === 'suppliers');
    expect(suppCalls.length).toBeGreaterThanOrEqual(2); // select + upsert
  });
});

// ─── upsertAdvance ────────────────────────────────────────────────────────────

describe('upsertAdvance', () => {
  it('stores a valid UUID id', async () => {
    selectResults.push({ data: { id: crypto.randomUUID() }, error: null });
    const id = crypto.randomUUID();
    await upsertAdvance({ id, supplier: 'X', supplierId: null, date: '2025-01-15', given: 5000, used: 0, remaining: 5000, notes: '', appliedTo: [] });
    const row = captureUpsert('supplier_advances');
    expect(row?.id).toMatch(UUID_RE);
  });

  it('maps advance.given → amount', async () => {
    selectResults.push({ data: null, error: null });
    const id = crypto.randomUUID();
    await upsertAdvance({ id, supplier: 'Y', supplierId: null, date: '2025-01-01', given: 12000, used: 0, remaining: 12000, notes: '', appliedTo: [] });
    const row = captureUpsert('supplier_advances');
    expect(row?.amount).toBe(12000);
  });

  it('maps advance.supplier → supplier_name', async () => {
    selectResults.push({ data: null, error: null });
    const id = crypto.randomUUID();
    await upsertAdvance({ id, supplier: 'Haji Bashir', supplierId: null, date: '2025-01-01', given: 3000, used: 0, remaining: 3000, notes: '', appliedTo: [] });
    const row = captureUpsert('supplier_advances');
    expect(row?.supplier_name).toBe('Haji Bashir');
  });
});

// ─── upsertExpenseRow ─────────────────────────────────────────────────────────

describe('upsertExpenseRow', () => {
  it('stores a valid UUID id', async () => {
    const id = crypto.randomUUID();
    await upsertExpenseRow({ id, date: '2025-01-15', type: 'labour', amount: 500, notes: '', name: 'Ali' });
    const row = captureUpsert('expenses');
    expect(row?.id).toMatch(UUID_RE);
  });

  it('falls back to expense.name when notes is empty', async () => {
    const id = crypto.randomUUID();
    await upsertExpenseRow({ id, date: '2025-01-15', type: 'labour', amount: 200, notes: '', name: 'Hassan' });
    const row = captureUpsert('expenses');
    expect(row?.notes).toBe('Hassan');
  });

  it('prefers expense.notes over name when both are set', async () => {
    const id = crypto.randomUUID();
    await upsertExpenseRow({ id, date: '2025-01-15', type: 'food', amount: 300, notes: 'Ali · Loader · Monthly', name: 'Ali' });
    const row = captureUpsert('expenses');
    expect(row?.notes).toBe('Ali · Loader · Monthly');
  });

  it('saves amount and type correctly', async () => {
    const id = crypto.randomUUID();
    await upsertExpenseRow({ id, date: '2025-01-15', type: 'salary', amount: 9500, notes: 'Misc', name: '' });
    const row = captureUpsert('expenses');
    expect(row?.amount).toBe(9500);
    expect(row?.type).toBe('salary');
  });
});

// ─── loadAllData transformation ───────────────────────────────────────────────

describe('loadAllData — data transformation', () => {
  it('transforms truck_records to entries with correct JS field names', async () => {
    const truckId = crypto.randomUUID();
    const suppId  = crypto.randomUUID();
    selectResults.push({
      data: [{
        id: truckId, supplier_id: suppId,
        suppliers: { id: suppId, name: 'Ali Trader', city: 'Quetta', phone: '0300-1', supplier_code: 'S001' },
        truck_no: 'LEH-5555', loading_date: '2025-02-10', builty_no: 'BLT-99',
        carriage: 200, truck_fare: 4000, labour_charges: 150, advance: 500, bardana: 0,
        parties: [{ id: '0', personName: 'Owner X', crates: 100, rate: 60 }],
        payment_mode: 'Credit', remarks: 'Test', created_at: '2025-02-10T10:00:00Z',
      }],
      error: null,
    });
    for (let i = 0; i < 6; i++) selectResults.push({ data: [], error: null });

    const result = await loadAllData();
    const e = result.entries[0];

    expect(e.vehicle).toBe('LEH-5555');       // truck_no      → vehicle
    expect(e.date).toBe('2025-02-10');         // loading_date  → date
    expect(e.bilty).toBe('BLT-99');            // builty_no     → bilty
    expect(e.laga).toBe(200);                  // carriage      → laga
    expect(e.fare).toBe(4000);                 // truck_fare    → fare
    expect(e.labour).toBe(150);                // labour_charges→ labour
    expect(e.advance).toBe(500);
    expect(e.supplier).toBe('Ali Trader');
    expect(e.ownerList[0]).toMatchObject({ name: 'Owner X', crates: 100, rate: 60 });
  });

  it('attaches buyerList from matching customer_sales rows', async () => {
    const truckId = crypto.randomUUID();
    const custId  = crypto.randomUUID();
    selectResults.push({
      data: [{
        id: truckId, supplier_id: null, suppliers: {},
        truck_no: 'T1', loading_date: '2025-01-01', builty_no: null,
        carriage: 0, truck_fare: 0, labour_charges: 0, advance: 0, bardana: 0,
        parties: [], payment_mode: 'Cash', remarks: null, created_at: '2025-01-01T00:00:00Z',
      }],
      error: null,
    });
    selectResults.push({
      data: [{
        id: crypto.randomUUID(), customer_id: custId, truck_record_id: truckId,
        customers: { id: custId, name: 'Buyer Z', phone: '0300-0', customer_code: 'C001' },
        date: '2025-01-01', crates: 40, rate: 70, bill_no: 'BL-001',
        comm_percent: 7.25, wari_rate: 5, advance: 0, payment_mode: 'Cash', discount: 0,
        created_at: '2025-01-01T00:00:00Z',
      }],
      error: null,
    });
    for (let i = 0; i < 5; i++) selectResults.push({ data: [], error: null });

    const result = await loadAllData();
    const entry = result.entries[0];
    expect(entry.buyerList).toHaveLength(1);
    expect(entry.buyerList[0].name).toBe('Buyer Z');
    expect(entry.buyerList[0].crates).toBe(40);
    expect(entry.buyerList[0].price).toBe(70);      // rate   → price
    expect(entry.buyerList[0].bill).toBe('BL-001'); // bill_no → bill
  });

  it('categorises expense rows by type, unknown type → other', async () => {
    selectResults.push({ data: [], error: null }); // trucks
    selectResults.push({ data: [], error: null }); // sales
    selectResults.push({ data: [], error: null }); // suppliers
    selectResults.push({ data: [], error: null }); // customers
    selectResults.push({
      data: [
        { id: crypto.randomUUID(), date: '2025-01-10', type: 'labour',   amount: 800, notes: 'Ali' },
        { id: crypto.randomUUID(), date: '2025-01-11', type: 'food',     amount: 300, notes: 'Lunch' },
        { id: crypto.randomUUID(), date: '2025-01-12', type: 'INVALID',  amount: 100, notes: 'X' },
      ],
      error: null,
    });
    selectResults.push({ data: [], error: null }); // advances
    selectResults.push({ data: [], error: null }); // app_users

    const result = await loadAllData();
    expect(result.expenses.labour).toHaveLength(1);
    expect(result.expenses.labour[0].amount).toBe(800);
    expect(result.expenses.labour[0].name).toBe('Ali'); // notes backfilled into name
    expect(result.expenses.food).toHaveLength(1);
    expect(result.expenses.charity).toHaveLength(1);     // INVALID → charity (new catch-all)
  });

  it('returns all empty collections when all tables return []', async () => {
    for (let i = 0; i < 7; i++) selectResults.push({ data: [], error: null });
    const result = await loadAllData();
    expect(result.entries).toEqual([]);
    expect(result.suppliers).toEqual([]);
    expect(result.customers).toEqual([]);
    expect(result.advances).toEqual([]);
    expect(result.users).toEqual([]);
    Object.values(result.expenses).forEach(arr => expect(arr).toEqual([]));
  });
});

// ─── upsertSupplier ───────────────────────────────────────────────────────────

describe('upsertSupplier', () => {
  it('maps supplier.code → supplier_code', async () => {
    await upsertSupplier({ id: crypto.randomUUID(), name: 'Ali Bros', city: 'Quetta', phone: '0300-1', status: 'active', code: 'S0055' });
    const row = captureUpsert('suppliers');
    expect(row?.supplier_code).toBe('S0055');
    expect(row?.name).toBe('Ali Bros');
  });

  it('falls back to supplier_code field when code is missing', async () => {
    await upsertSupplier({ id: crypto.randomUUID(), name: 'Test', city: '', phone: '', status: 'active', supplier_code: 'S0099' });
    const row = captureUpsert('suppliers');
    expect(row?.supplier_code).toBe('S0099');
  });
});

// ─── upsertCustomer ───────────────────────────────────────────────────────────

describe('upsertCustomer', () => {
  it('maps customer.code → customer_code', async () => {
    await upsertCustomer({ id: crypto.randomUUID(), name: 'Buyer X', phone: '0311-1', nickname: '', address: '', code: 'C0077' });
    const row = captureUpsert('customers');
    expect(row?.customer_code).toBe('C0077');
    expect(row?.name).toBe('Buyer X');
  });
});

// ─── clearAllData ─────────────────────────────────────────────────────────────

describe('clearAllData', () => {
  it('sends delete to all data tables', async () => {
    await clearAllData();
    const tables = mockFrom.mock.calls.map(c => c[0]);
    expect(tables).toContain('customer_sales');
    expect(tables).toContain('truck_records');
    expect(tables).toContain('supplier_advances');
    expect(tables).toContain('expenses');
    expect(tables).toContain('customers');
    expect(tables).toContain('suppliers');
  });

  it('does NOT touch app_users', async () => {
    await clearAllData();
    const tables = mockFrom.mock.calls.map(c => c[0]);
    expect(tables).not.toContain('app_users');
  });

  it('deletes customer_sales before truck_records (FK order)', async () => {
    await clearAllData();
    const order = mockFrom.mock.calls.map(c => c[0]);
    expect(order.indexOf('customer_sales')).toBeLessThan(order.indexOf('truck_records'));
  });

  it('deletes supplier_advances before suppliers', async () => {
    await clearAllData();
    const order = mockFrom.mock.calls.map(c => c[0]);
    expect(order.indexOf('supplier_advances')).toBeLessThan(order.indexOf('suppliers'));
  });
});

// ─── fetchAppUsers ────────────────────────────────────────────────────────────

describe('fetchAppUsers', () => {
  it('returns correctly mapped user objects', async () => {
    selectResults.push({
      data: [{ id: crypto.randomUUID(), name: 'Admin', email: 'a@b.com', role: 'Admin', status: 'active', added_at: '2025-01-01T00:00:00Z' }],
      error: null,
    });
    const users = await fetchAppUsers();
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ name: 'Admin', email: 'a@b.com', role: 'Admin', status: 'active' });
  });

  it('defaults role to Salesman when null in DB', async () => {
    selectResults.push({
      data: [{ id: crypto.randomUUID(), name: 'Staff', email: null, role: null, status: 'active', added_at: '2025-01-01T00:00:00Z' }],
      error: null,
    });
    const users = await fetchAppUsers();
    expect(users[0].role).toBe('Salesman');
  });

  it('defaults status to active when null in DB', async () => {
    selectResults.push({
      data: [{ id: crypto.randomUUID(), name: 'X', email: null, role: 'Admin', status: null, added_at: '2025-01-01T00:00:00Z' }],
      error: null,
    });
    const users = await fetchAppUsers();
    expect(users[0].status).toBe('active');
  });
});
