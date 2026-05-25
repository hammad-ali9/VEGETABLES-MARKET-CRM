/**
 * db.js — Supabase helpers for the production schema.
 *
 * Auth: custom app_users table (NOT Supabase Auth). RLS is disabled.
 * Session stored in localStorage under SESSION_KEY.
 *
 * Table mapping:
 *   truck_records  → entries (supplier side)
 *   customer_sales → entries[].buyerList  (requires truck_record_id column)
 *   suppliers      → suppliers
 *   customers      → customers
 *   expenses       → expenses (individual rows, grouped on load)
 *   app_users      → auth
 */

import { supabase } from './supabase';

const SESSION_KEY = 'mandi_app_session';

// ─── Session ─────────────────────────────────────────────────────────────────

export const getStoredSession = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch { return null; }
};

const storeSession = (user) => localStorage.setItem(SESSION_KEY, JSON.stringify(user));

const currentUserName = () => getStoredSession()?.name || 'Unknown';
const nowStr = () => new Date().toLocaleString();

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const signIn = async (emailOrUser, password) => {
  const val = emailOrUser.trim();
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .or(`email.eq.${val},name.eq.${val}`)
    .eq('password', password)
    .eq('status', 'active')
    .maybeSingle();

  if (error) return { error };
  if (!data) return { error: { message: 'Invalid login credentials' } };
  storeSession(data);
  return { data: { user: data }, error: null };
};

export const signOut = () => {
  localStorage.removeItem(SESSION_KEY);
  return Promise.resolve({ error: null });
};

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const fetchSuppliers = async () => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data || []).map(s => ({
    id: s.id,
    code: s.supplier_code || '',
    name: s.name,
    city: s.city || '',
    phone: s.phone || '',
    status: s.status || 'active',
  }));
};

export const upsertSupplier = async (supplier) => {
  const { error } = await supabase
    .from('suppliers')
    .upsert({
      id: supplier.id,
      name: supplier.name,
      city: supplier.city || '',
      phone: supplier.phone || '',
      status: supplier.status || 'active',
      supplier_code: supplier.code || supplier.supplier_code || '',
    }, { onConflict: 'id' });
  if (error) throw error;
};

// Find supplier by name OR create new one; returns { id, code }
const resolveSupplier = async (name, city, phone, code) => {
  const { data } = await supabase
    .from('suppliers')
    .select('id, supplier_code')
    .ilike('name', name.trim())
    .maybeSingle();
  if (data) return { id: data.id, code: data.supplier_code || code };

  const newId = crypto.randomUUID();
  await upsertSupplier({ id: newId, name: name.trim(), city, phone, code });
  return { id: newId, code };
};

// ─── Customers ───────────────────────────────────────────────────────────────

export const fetchCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data || []).map(c => ({
    id: c.id,
    code: c.customer_code || '',
    name: c.name,
    phone: c.phone || '',
    nickname: c.nickname || '',
    address: c.address || '',
  }));
};

export const upsertCustomer = async (customer) => {
  const { error } = await supabase
    .from('customers')
    .upsert({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      nickname: customer.nickname || '',
      address: customer.address || null,
      customer_code: customer.code || customer.customer_code || '',
    }, { onConflict: 'id' });
  if (error) throw error;
};

// Find customer by name OR create new; returns { id, code }
const resolveCustomer = async (name, phone, code) => {
  const { data } = await supabase
    .from('customers')
    .select('id, customer_code')
    .ilike('name', name.trim())
    .maybeSingle();
  if (data) return { id: data.id, code: data.customer_code || code };

  const newId = crypto.randomUUID();
  await upsertCustomer({ id: newId, name: name.trim(), phone, code });
  return { id: newId, code };
};

// ─── Truck Records ────────────────────────────────────────────────────────────

export const fetchTruckRecords = async () => {
  const { data, error } = await supabase
    .from('truck_records')
    .select('*, suppliers(id, name, city, phone, supplier_code)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const deleteTruckRecord = async (id) => {
  // customer_sales ON DELETE CASCADE handles child rows
  const { error } = await supabase.from('truck_records').delete().eq('id', id);
  if (error) throw error;
};

// ─── Customer Sales ───────────────────────────────────────────────────────────

export const fetchCustomerSales = async () => {
  const { data, error } = await supabase
    .from('customer_sales')
    .select('*, customers(id, name, phone, customer_code)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// ─── Save full entry (truck_record + customer_sales) ─────────────────────────

export const saveFullEntry = async (entry) => {
  const userName = currentUserName();
  const now = nowStr();
  const totalCrates = (entry.ownerList || []).reduce((s, o) => s + (o.crates || 0), 0);

  // 1. Resolve supplier (find existing or create)
  const { id: supplierId, code: supplierCode } = await resolveSupplier(
    entry.supplier || '',
    entry.city || '',
    entry.phone || '',
    entry.supplierCode || ''
  );

  // 2. Upsert truck_record
  const truckRow = {
    id: entry.id,
    supplier_id: supplierId,
    truck_no: entry.vehicle || '',
    loading_date: entry.date,
    builty_no: entry.bilty || null,
    carriage: entry.laga || 0,          // market fee (laga)
    sale_date: null,
    advance: entry.advance || 0,
    parties: (entry.ownerList || []).map((o, i) => ({
      id: String(i),
      rate: o.rate || 0,
      crates: o.crates || 0,
      personName: o.name || '',
    })),
    added_by: userName,
    added_at_str: now,
    payment_mode: entry.payments?.[0]?.method || entry.payment_mode || 'Credit',
    remarks: entry.remarks || null,
    truck_fare: entry.fare || 0,
    labour_charges: entry.labour || 0,
    advance_date: null,
    bardana: entry.bardana || 0,
    bardana_date: null,
  };

  const { error: truckErr } = await supabase
    .from('truck_records')
    .upsert(truckRow, { onConflict: 'id' });
  if (truckErr) throw truckErr;

  // 3. Delete old sales for this truck then re-insert (clean replace)
  await supabase.from('customer_sales').delete().eq('truck_record_id', entry.id);

  // 4. Insert customer_sales
  const commPercent = entry.commDiv
    ? parseFloat((100 / entry.commDiv).toFixed(4))
    : 7.25;
  const wariRate = entry.logRate || 5;

  const validBuyers = (entry.buyerList || []).filter(b => b.name?.trim());
  for (const b of validBuyers) {
    const { id: customerId, code: customerCode } = await resolveCustomer(
      b.name, b.phone || '', b.code || ''
    );
    const saleRow = {
      id: b.id && b.id !== b.name ? String(b.id) : crypto.randomUUID(),
      customer_id: customerId,
      truck_record_id: entry.id,
      date: b.date || entry.date,
      crates: b.crates || 0,
      rate: b.price || 0,
      bill_no: b.bill || '',
      comm_percent: commPercent,
      wari_rate: wariRate,
      advance: b.advance || 0,
      added_by: userName,
      added_at_str: now,
      advance_method: b.type || 'Cash',
      payment_mode: b.type || 'Cash',
      discount: b.discount || 0,
    };
    const { error: saleErr } = await supabase
      .from('customer_sales')
      .upsert(saleRow, { onConflict: 'id' });
    if (saleErr) throw saleErr;
  }

  return { supplierId, supplierCode };
};

// ─── Supplier Advances ────────────────────────────────────────────────────────

export const fetchAdvances = async () => {
  const { data, error } = await supabase
    .from('supplier_advances')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(a => ({
    id: a.id,
    supplier: a.supplier_name,
    supplierId: a.supplier_id,
    date: a.date,
    given: a.amount,
    used: a.used,
    remaining: a.remaining,
    notes: a.notes || '',
    appliedTo: a.applied_to || [],
  }));
};

export const upsertAdvance = async (advance) => {
  // Resolve supplier_id if not present
  let supplierId = advance.supplierId || null;
  if (!supplierId && advance.supplier) {
    const { data } = await supabase
      .from('suppliers')
      .select('id')
      .ilike('name', advance.supplier.trim())
      .maybeSingle();
    supplierId = data?.id || null;
  }
  const { error } = await supabase
    .from('supplier_advances')
    .upsert({
      id: advance.id,
      supplier_id: supplierId,
      supplier_name: advance.supplier || '',
      date: advance.date,
      amount: advance.given || 0,
      used: advance.used || 0,
      remaining: advance.remaining || 0,
      notes: advance.notes || null,
      applied_to: advance.appliedTo || [],
      added_by: currentUserName(),
      added_at_str: advance.added_at_str || nowStr(),
    }, { onConflict: 'id' });
  if (error) throw error;
};

export const deleteAdvance = async (id) => {
  const { error } = await supabase.from('supplier_advances').delete().eq('id', id);
  if (error) throw error;
};

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const fetchExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const upsertExpenseRow = async (expense) => {
  const { error } = await supabase
    .from('expenses')
    .upsert({
      id: expense.id,
      date: expense.date,
      type: expense.type || 'charity',
      amount: expense.amount || 0,
      notes: expense.notes || expense.name || '',
      added_by: expense.added_by || currentUserName(),
      added_at_str: expense.added_at_str || nowStr(),
    }, { onConflict: 'id' });
  if (error) throw error;
};

export const deleteExpenseRow = async (id) => {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
};

// ─── Partners ─────────────────────────────────────────────────────────────────

export const fetchPartners = async () => {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const upsertPartner = async (partner) => {
  const { error } = await supabase
    .from('partners')
    .upsert({
      id: partner.id,
      name: partner.name,
      role: partner.role || 'Partner',
      share_percent: partner.sharePercent || 0,
      join_date: partner.joinDate || null,
      phone: partner.phone || '',
      notes: partner.notes || '',
      status: partner.status || 'active',
      added_by: partner.added_by || currentUserName(),
      added_at_str: partner.added_at_str || nowStr(),
    }, { onConflict: 'id' });
  if (error) throw error;
};

export const deletePartner = async (id) => {
  const { error } = await supabase.from('partners').delete().eq('id', id);
  if (error) throw error;
};

// ─── Partner Payments ─────────────────────────────────────────────────────────

export const fetchPartnerPayments = async () => {
  const { data, error } = await supabase
    .from('partner_payments')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const upsertPartnerPayment = async (payment) => {
  const { error } = await supabase
    .from('partner_payments')
    .upsert({
      id: payment.id,
      partner_id: payment.partnerId,
      date: payment.date,
      amount: payment.amount || 0,
      notes: payment.notes || '',
      added_by: payment.added_by || currentUserName(),
      added_at_str: payment.added_at_str || nowStr(),
    }, { onConflict: 'id' });
  if (error) throw error;
};

export const deletePartnerPayment = async (id) => {
  const { error } = await supabase.from('partner_payments').delete().eq('id', id);
  if (error) throw error;
};

// ─── Bulk load ────────────────────────────────────────────────────────────────

export const loadAllData = async () => {
  const [truckRecords, customerSales, suppliers, customers, expenseRows, advances, appUsers, partnerRows, partnerPaymentRows] =
    await Promise.all([
      fetchTruckRecords(),
      fetchCustomerSales(),
      fetchSuppliers(),
      fetchCustomers(),
      fetchExpenses(),
      fetchAdvances(),
      fetchAppUsers(),
      fetchPartners().catch(() => []),
      fetchPartnerPayments().catch(() => []),
    ]);

  // Build map: truck_record_id → customer_sales[]
  const salesByTruck = {};
  customerSales.forEach(s => {
    if (s.truck_record_id) {
      (salesByTruck[s.truck_record_id] = salesByTruck[s.truck_record_id] || []).push(s);
    }
  });

  // Transform truck_records → app entries
  const entries = truckRecords.map(r => {
    const sup = r.suppliers || {};
    const sales = salesByTruck[r.id] || [];
    const totalCrates = (r.parties || []).reduce((s, p) => s + (p.crates || 0), 0);
    const gross = (r.parties || []).reduce((s, p) => s + (p.crates || 0) * (p.rate || 0), 0);
    const labour = r.labour_charges || 0;
    const laga = r.carriage || 0;
    const fare = r.truck_fare || 0;
    const advance = r.advance || 0;
    const bardana = r.bardana || 0;
    const balance = gross - labour - laga - fare - advance - bardana;

    const buyerList = sales.map(s => {
      const cust = s.customers || {};
      const bGross = (s.crates || 0) * (s.rate || 0);
      const commPct = s.comm_percent || 7.25;
      return {
        id: s.id,
        customerId: s.customer_id,
        name: cust.name || '',
        phone: cust.phone || '',
        code: cust.customer_code || '',
        crates: s.crates || 0,
        price: s.rate || 0,
        bill: s.bill_no || '',
        discount: s.discount || 0,
        advance: s.advance || 0,
        type: s.payment_mode || 'Cash',
        date: s.date || r.loading_date,
        wariRate: s.wari_rate || 5,
        commPercent: commPct,
        commission: Math.round(bGross * commPct / 100),
        wari: (s.crates || 0) * (s.wari_rate || 5),
      };
    });

    const custGross = buyerList.reduce((s, b) => s + (b.crates || 0) * (b.price || 0), 0);
    const commission = buyerList.reduce((s, b) => s + (b.commission || 0), 0);
    const wari = buyerList.reduce((s, b) => s + (b.wari || 0), 0);

    return {
      id: r.id,
      date: r.loading_date,
      supplier: sup.name || '',
      supplierId: r.supplier_id,
      supplierCode: sup.supplier_code || '',
      city: sup.city || '',
      phone: sup.phone || '',
      vehicle: r.truck_no || '',
      bilty: r.builty_no || '',
      crates: totalCrates,
      gross,
      fare,
      labour,
      laga,
      advance,
      bardana,
      labourRate: totalCrates > 0 ? Math.round(labour / totalCrates) : 10,
      lagaRate: totalCrates > 0 ? Math.round(laga / totalCrates) : 20,
      balance,
      remarks: r.remarks || '',
      payment_mode: r.payment_mode || 'Cash',
      status: 'pending',
      ownerList: (r.parties || []).map(p => ({
        name: p.personName || '',
        crates: p.crates || 0,
        rate: p.rate || 0,
      })),
      buyerList,
      customers: buyerList.length,
      custGross,
      commission,
      wari,
      custRemaining: custGross + commission + wari,
      logRate: 5,
      commDiv: 13.78,
      payments: [],
    };
  });

  // Transform expense rows → categorised object (app format)
  const EMPTY_EXPENSES = { labour: [], utility: [], food: [], rent: [], parking: [], salary: [], charity: [] };
  const validCategories = new Set(Object.keys(EMPTY_EXPENSES));
  const expenses = { ...EMPTY_EXPENSES };
  expenseRows.forEach(e => {
    const cat = validCategories.has(e.type) ? e.type : 'charity';
    expenses[cat].push({ id: e.id, date: e.date, amount: e.amount || 0, notes: e.notes || '', name: e.notes || '' });
  });

  // Build partners with embedded payments
  const partners = partnerRows.map(r => ({
    id: r.id,
    name: r.name,
    role: r.role || 'Partner',
    sharePercent: r.share_percent || 0,
    joinDate: r.join_date || '',
    phone: r.phone || '',
    notes: r.notes || '',
    status: r.status || 'active',
    payments: partnerPaymentRows
      .filter(pp => pp.partner_id === r.id)
      .map(pp => ({ id: pp.id, date: pp.date, amount: pp.amount || 0, notes: pp.notes || '' })),
  }));

  return {
    entries,
    suppliers,
    customers,
    expenses,
    advances,
    partners,
    users: appUsers,
    messages: [],
    settings: null,
  };
};

// ─── App Users ───────────────────────────────────────────────────────────────

export const fetchAppUsers = async () => {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, name, email, role, status, added_at')
    .order('added_at');
  if (error) throw error;
  return (data || []).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || 'Salesman',
    status: u.status || 'active',
    last: 'N/A',
  }));
};

export const upsertAppUser = async (user) => {
  const row = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'Salesman',
    status: user.status || 'active',
  };
  if (user.password) row.password = user.password;
  const { error } = await supabase
    .from('app_users')
    .upsert(row, { onConflict: 'id' });
  if (error) throw error;
};

export const deleteAppUser = async (id) => {
  const { error } = await supabase.from('app_users').delete().eq('id', id);
  if (error) throw error;
};

// ─── Legacy stubs (keep other pages compilable during transition) ─────────────

export const upsertEntry = saveFullEntry;
export const deleteEntry = deleteTruckRecord;
export const saveExpenses = async () => {};
export const upsertMessage = async () => {};
export const saveSettings = async () => {};
export const migrateLocalStorage = async () => {};
export const loadData = () => null;
export const clearAllData = async () => {
  // Delete in FK-safe order (children before parents)
  const tables = ['customer_sales', 'supplier_advances', 'expenses', 'truck_records', 'customers', 'suppliers'];
  for (const table of tables) {
    await supabase.from(table).delete().not('id', 'is', null);
  }
};
export const getSession = async () => ({ data: { session: null }, error: null });
