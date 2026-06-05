import { useState, useMemo } from 'react';
import { Icon } from '../components/ui/Icon';
import { Page } from '../components/layout/Page';
import { fmt, fmtShort } from '../utils/format';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../components/ui/ConfirmDialog';

const TODAY = new Date().toISOString().split('T')[0];

// === Advances ===

const NewAdvanceModal = ({ onClose, onSave }) => {
  const { suppliers } = useApp();
  const [form, setForm] = useState({ supplier: '', date: TODAY, amount: '', notes: '' });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.supplier.trim()) { alert('Supplier name required.'); return; }
    const amount = +form.amount || 0;
    if (!amount) { alert('Amount required.'); return; }
    onSave({
      id: crypto.randomUUID(),
      supplier: form.supplier.trim(),
      date: form.date || TODAY,
      given: amount,
      used: 0,
      remaining: amount,
      notes: form.notes.trim(),
      appliedTo: [],
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)' }}>
          <div className="row">
            <div style={{ flex: 1 }}>
              <h2 className="h2">New Advance · نیا بیانہ</h2>
              <div className="small">Pre-payment to a supplier</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div className="field" style={{ marginBottom: 14 }}>
            <div className="field-label"><span>Supplier Name <span className="req">*</span></span><span className="ur">بیوپاری</span></div>
            <input
              className="input"
              list="adv-suppliers"
              placeholder="Type or select…"
              value={form.supplier}
              onChange={e => set('supplier', e.target.value)}
            />
            <datalist id="adv-suppliers">
              {suppliers.map(s => <option key={s.id} value={s.name} />)}
            </datalist>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="field">
              <div className="field-label"><span>Amount <span className="req">*</span></span><span className="ur">رقم</span></div>
              <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" placeholder="0" value={form.amount} onChange={e => set('amount', e.target.value)} /></div>
            </div>
            <div className="field">
              <div className="field-label"><span>Date</span><span className="ur">تاریخ</span></div>
              <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 24 }}>
            <div className="field-label"><span>Notes</span><span className="ur">نوٹس</span></div>
            <input className="input" placeholder="Optional remarks…" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="row gap-sm" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}><Icon name="check" size={13} /> Save Advance</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditAdvanceModal = ({ data, onClose, onSave }) => {
  const [form, setForm] = useState({ ...data });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const handleSave = () => { onSave(form); onClose(); };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)' }}>
          <div className="row">
            <div style={{ flex: 1 }}><h2 className="h2">Edit Advance · {data.id}</h2><div className="small">{data.supplier}</div></div>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="field">
              <div className="field-label"><span>Amount Given</span><span className="ur">رقم</span></div>
              <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" value={form.given} onChange={e => set('given', +e.target.value || 0)} /></div>
            </div>
            <div className="field">
              <div className="field-label"><span>Amount Used</span><span className="ur">استعمال</span></div>
              <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" value={form.used || 0} onChange={e => { const u = +e.target.value || 0; set('used', u); set('remaining', Math.max(0, form.given - u)); }} /></div>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <div className="field-label"><span>Date</span></div>
            <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 24 }}>
            <div className="field-label"><span>Notes</span></div>
            <input className="input" value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="row gap-sm" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}><Icon name="check" size={13} /> Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdvancesPage = () => {
  const { advances, setAdvances } = useApp();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filter, setFilter] = useState('all');

  const total = advances.reduce((s, a) => s + (a.given || 0), 0);
  const remaining = advances.reduce((s, a) => s + (a.remaining || 0), 0);
  const recovered = total - remaining;

  const filtered = filter === 'all' ? advances
    : filter === 'active' ? advances.filter(a => (a.remaining || 0) > 0)
    : advances.filter(a => (a.remaining || 0) === 0);

  const handleSave = adv => setAdvances(prev => [adv, ...prev]);
  const handleEdit = updated => setAdvances(prev => prev.map(a => a.id === updated.id ? updated : a));
  const handleDelete = async (id) => {
    const adv = advances.find(a => a.id === id);
    const ok = await confirm({
      title: 'Delete Advance',
      message: 'This advance payment record will be permanently deleted.',
      detail: adv ? `${adv.supplier} · Rs. ${(adv.given || 0).toLocaleString()} · ${adv.date}` : undefined,
      confirmLabel: 'Delete Advance',
    });
    if (ok) setAdvances(prev => prev.filter(a => a.id !== id));
  };

  return (
    <Page titleEn="Advance Payments" titleUr="پیشگی ادائیگیاں" sub="Pre-payments to suppliers · auto-deduct on next entry">
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="glass stat">
          <div className="stat-head">
            <div className="stat-icon"><Icon name="wallet" /></div>
            <span className="chip warn">{advances.filter(a => (a.remaining||0) > 0).length} active</span>
          </div>
          <div className="stat-label"><span className="en">Total Given</span><span className="ur">کل دی گئی</span></div>
          <div className="num num-xl">{total > 0 ? fmt(total) : '—'}</div>
          <div className="stat-meta">{advances.length} advance{advances.length !== 1 ? 's' : ''} recorded</div>
        </div>
        <div className="glass stat">
          <div className="stat-head"><div className="stat-icon green"><Icon name="check" /></div></div>
          <div className="stat-label"><span className="en">Recovered</span><span className="ur">واپس آئی</span></div>
          <div className="num num-xl" style={{ color: 'var(--success)' }}>{recovered > 0 ? fmt(recovered) : '—'}</div>
          {total > 0 && <div className="bar" style={{ marginTop: 8 }}><span style={{ width: (recovered / total * 100) + '%' }} /></div>}
        </div>
        <div className="glass stat">
          <div className="stat-head"><div className="stat-icon red"><Icon name="clock" /></div></div>
          <div className="stat-label"><span className="en">Outstanding</span><span className="ur">باقی</span></div>
          <div className="num num-xl" style={{ color: 'var(--danger)' }}>{remaining > 0 ? fmt(remaining) : '—'}</div>
        </div>
        <div className="glass stat">
          <div className="stat-head"><div className="stat-icon"><Icon name="bolt" /></div></div>
          <div className="stat-label"><span className="en">Auto-Deduct</span><span className="ur">خودکار کٹوتی</span></div>
          <div className="num num-xl" style={{ color: 'var(--orange-400)' }}>ON</div>
          <div className="stat-meta">manual override available</div>
        </div>
      </div>

      <div className="row gap-sm" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Icon name="plus" size={13} /> New Advance · نیا بیانہ</button>
        {['all', 'active', 'cleared'].map(f => (
          <span key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'active' ? 'Active · فعال' : 'Cleared · کلیئر'}
          </span>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={() => window.print()}><Icon name="print" size={13} /> Print Sheet</button>
      </div>

      <div className="glass" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
            <Icon name="wallet" size={28} />
            <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-2)' }}>
              {advances.length === 0 ? 'No advances recorded yet.' : 'No advances match this filter.'}
            </div>
            {advances.length === 0 && (
              <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                <Icon name="plus" size={13} /> New Advance
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Supplier <span className="ur">بیوپاری</span></th>
                  <th>Given on <span className="ur">تاریخ</span></th>
                  <th>Amount <span className="ur">رقم</span></th>
                  <th>Used <span className="ur">استعمال</span></th>
                  <th>Remaining <span className="ur">باقی</span></th>
                  <th>Progress</th>
                  <th>Applied To</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td className="mono" style={{ color: 'var(--orange-400)', fontWeight: 600 }}>{a.id}</td>
                    <td style={{ fontWeight: 600 }}>{a.supplier}</td>
                    <td>{new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                    <td className="num">{fmt(a.given)}</td>
                    <td className="num" style={{ color: 'var(--text-3)' }}>{fmt(a.used || 0)}</td>
                    <td className="num" style={{ color: a.remaining ? 'var(--orange-400)' : 'var(--success)', fontWeight: 600 }}>{fmt(a.remaining || 0)}</td>
                    <td style={{ width: 140 }}>
                      <div className="bar"><span style={{ width: ((a.used || 0) / Math.max(a.given, 1) * 100) + '%' }} /></div>
                      <div className="tiny" style={{ marginTop: 4 }}>{Math.round((a.used || 0) / Math.max(a.given, 1) * 100)}% used</div>
                    </td>
                    <td>
                      {(a.appliedTo || []).length > 0
                        ? (a.appliedTo || []).map(id => (
                            <span key={id} className="chip" style={{ fontSize: 10, marginRight: 4, marginBottom: 2 }}>{id}</span>
                          ))
                        : <span className="tiny" style={{ color: 'var(--text-4)' }}>—</span>
                      }
                    </td>
                    <td className="small">{a.notes || '—'}</td>
                    <td>
                      <div className="row gap-sm" onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => setEditItem(a)}><Icon name="edit" size={13} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => handleDelete(a.id)}><Icon name="trash" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <NewAdvanceModal onClose={() => setShowModal(false)} onSave={handleSave} />}
      {editItem && <EditAdvanceModal data={editItem} onClose={() => setEditItem(null)} onSave={handleEdit} />}
      {confirmDialog}
    </Page>
  );
};

// === Expenses ===

const AddExpenseForm = ({ catId, onClose, onSave }) => {
  const needsRole = catId === 'labour' || catId === 'salary';
  const needsPeriod = catId === 'salary' || catId === 'rent' || catId === 'utility';
  const [form, setForm] = useState({ name: '', role: '', period: 'Monthly', date: TODAY, amount: '' });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) { alert('Name is required.'); return; }
    const amount = +form.amount || 0;
    if (!amount) { alert('Amount is required.'); return; }
    const notes = [form.name.trim(), form.role.trim(), form.period].filter(Boolean).join(' · ');
    onSave({ id: crypto.randomUUID(), name: form.name.trim(), role: form.role.trim(), period: form.period, date: form.date || TODAY, amount, notes });
    onClose();
  };

  return (
    <div style={{ padding: '20px 24px', borderTop: '1px solid var(--glass-border)', background: 'rgba(255,167,38,0.03)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange-400)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add Entry</div>
      <div style={{ display: 'grid', gridTemplateColumns: needsRole ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 12 }}>
        <div className="field">
          <div className="field-label"><span>Name <span className="req">*</span></span></div>
          <input className="input" placeholder="e.g. Ali Hassan" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        {needsRole && (
          <div className="field">
            <div className="field-label"><span>Role / Position</span></div>
            <input className="input" placeholder="e.g. Loader" value={form.role} onChange={e => set('role', e.target.value)} />
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: needsPeriod ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {needsPeriod && (
          <div className="field">
            <div className="field-label"><span>Period</span></div>
            <select className="select" value={form.period} onChange={e => set('period', e.target.value)}>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Yearly</option>
              <option>One-time</option>
            </select>
          </div>
        )}
        <div className="field">
          <div className="field-label"><span>Date</span></div>
          <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="field">
          <div className="field-label"><span>Amount <span className="req">*</span></span></div>
          <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" placeholder="0" value={form.amount} onChange={e => set('amount', e.target.value)} /></div>
        </div>
      </div>
      <div className="row gap-sm" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave}><Icon name="check" size={12} /> Save</button>
      </div>
    </div>
  );
};

const CatCard = ({ c, onClick }) => {
  const sum = c.items.reduce((s, i) => s + i.amount, 0);
  return (
    <div className="glass stat" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div className="stat-head">
        <div className="stat-icon"><Icon name={c.icon} /></div>
        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={e => { e.stopPropagation(); onClick(); }}><Icon name="plus" size={12} /></button>
      </div>
      <div className="stat-label">
        <span className="en">{c.en}</span>
        <span className="ur">{c.ur}</span>
      </div>
      <div className="num num-xl">{sum > 0 ? fmt(sum) : '—'}</div>
      <div className="row between" style={{ fontSize: 11 }}>
        <span className="tiny">{c.items.length} entries</span>
        <span style={{ color: 'var(--orange-400)', fontWeight: 600 }}>View →</span>
      </div>
    </div>
  );
};

const CatModal = ({ cat, onClose, onAddItem, onDeleteItem }) => {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const sum = cat.items.reduce((s, i) => s + i.amount, 0);

  const handleDeleteItem = async (catId, it) => {
    const ok = await confirm({
      title: 'Delete Expense',
      message: `This ${cat.en.toLowerCase()} expense entry will be permanently deleted.`,
      detail: `${it.name || it.notes || '—'} · Rs. ${(it.amount || 0).toLocaleString()}`,
      confirmLabel: 'Delete',
    });
    if (ok) onDeleteItem(catId, it.id);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 880 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)' }}>
          <div className="row">
            <div className="stat-icon"><Icon name={cat.icon} /></div>
            <div style={{ flex: 1 }}>
              <h2 className="h2">{cat.en} <span className="ur" style={{ fontSize: 16, color: 'var(--text-3)', marginLeft: 8 }}>{cat.ur}</span></h2>
              <div className="small">{cat.items.length} entries · Total {fmt(sum)}</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}><Icon name="plus" size={13} /> Add Entry</button>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>

        {showForm && (
          <AddExpenseForm
            catId={cat.id}
            onClose={() => setShowForm(false)}
            onSave={item => { onAddItem(cat.id, item); setShowForm(false); }}
          />
        )}

        <div style={{ padding: 24 }}>
          {cat.items.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
              <Icon name="plus" size={24} />
              <div style={{ marginTop: 10 }}>No entries yet. Click "Add Entry" to record one.</div>
            </div>
          ) : (
            <div className="glass" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Item</th><th>Period</th><th>Date</th><th>Amount</th><th></th></tr>
                  </thead>
                  <tbody>
                    {cat.items.map(it => (
                      <tr key={it.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{it.name}</div>
                          {it.role && <div className="small">{it.role}</div>}
                        </td>
                        <td><span className="chip">{it.period || 'One-time'}</span></td>
                        <td>{new Date(it.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                        <td className="num num-md">{fmt(it.amount)}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => handleDeleteItem(cat.id, it)}>
                            <Icon name="trash" size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        {confirmDialog}
      </div>
    </div>
  );
};

export const ExpensesPage = () => {
  const { expenses, setExpenses } = useApp();
  const [open, setOpen] = useState(null);

  const cats = [
    { id: 'labour',  en: 'Labour',       ur: 'مزدوری',     icon: 'users',   items: expenses.labour  || [] },
    { id: 'utility', en: 'Utility Bills', ur: 'یوٹیلٹی',   icon: 'bolt',    items: expenses.utility || [] },
    { id: 'food',    en: 'Food',          ur: 'کھانا',      icon: 'box',     items: expenses.food    || [] },
    { id: 'salary',  en: 'Salaries',      ur: 'تنخواہیں',   icon: 'money',   items: expenses.salary  || [] },
    { id: 'rent',    en: 'Shop Rent',     ur: 'دکان کرایہ', icon: 'receipt', items: expenses.rent    || [] },
    { id: 'parking', en: 'Parking Fees',  ur: 'پارکنگ',     icon: 'truck',   items: expenses.parking || [] },
    { id: 'charity', en: 'Charity',        ur: 'صدقہ',        icon: 'heart',   items: expenses.charity || [] },
  ];

  const total = cats.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.amount, 0), 0);
  const totalCount = cats.reduce((s, c) => s + c.items.length, 0);
  const allItems = cats.flatMap(c => c.items);
  const recurringTotal = allItems.filter(i => i.period && i.period !== 'One-time').reduce((s, i) => s + i.amount, 0);
  const oneTimeTotal = allItems.filter(i => !i.period || i.period === 'One-time').reduce((s, i) => s + i.amount, 0);

  const openCat = open ? cats.find(c => c.id === open) : null;

  const handleAddItem = (catId, item) => {
    setExpenses(prev => ({ ...prev, [catId]: [...(prev[catId] || []), item] }));
    if (openCat) setOpen(catId);
  };

  const handleDeleteItem = (catId, itemId) => {
    setExpenses(prev => ({ ...prev, [catId]: (prev[catId] || []).filter(i => i.id !== itemId) }));
  };

  return (
    <Page titleEn="Expenses" titleUr="اخراجات" sub="Click any card to view, add, or delete entries">
      <div className="glass-strong expenses-header-grid" style={{ padding: 24, marginBottom: 24 }}>
        <div>
          <div className="row between" style={{ alignItems: 'baseline' }}>
            <strong style={{ fontSize: 14, color: 'var(--text-2)' }}>Total this month</strong>
            <span className="ur small">اس ماہ کے کل اخراجات</span>
          </div>
          <div className="num" style={{ fontSize: 44, fontWeight: 800, marginTop: 8 }}>{total > 0 ? fmt(total) : '—'}</div>
          <div className="small" style={{ marginTop: 4 }}>{totalCount} entries · {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</div>
        </div>
        <div>
          <div className="row between" style={{ alignItems: 'baseline' }}>
            <span className="small" style={{ fontWeight: 600, color: 'var(--text-2)' }}>Recurring</span>
            <span className="ur small">مستقل</span>
          </div>
          <div className="num num-lg" style={{ marginTop: 4 }}>{recurringTotal > 0 ? fmt(recurringTotal) : '—'}</div>
        </div>
        <div>
          <div className="row between" style={{ alignItems: 'baseline' }}>
            <span className="small" style={{ fontWeight: 600, color: 'var(--text-2)' }}>One-time</span>
            <span className="ur small">ایک بار</span>
          </div>
          <div className="num num-lg" style={{ marginTop: 4 }}>{oneTimeTotal > 0 ? fmt(oneTimeTotal) : '—'}</div>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {cats.slice(0, 4).map(c => <CatCard key={c.id} c={c} onClick={() => setOpen(c.id)} />)}
      </div>
      <div className="grid-3">
        {cats.slice(4).map(c => <CatCard key={c.id} c={c} onClick={() => setOpen(c.id)} />)}
      </div>

      {open && openCat && (
        <CatModal
          cat={openCat}
          onClose={() => setOpen(null)}
          onAddItem={handleAddItem}
          onDeleteItem={handleDeleteItem}
        />
      )}
    </Page>
  );
};

// === Reports ===
const ProfitWaterfall = ({ items }) => {
  const max = Math.max(...items.map(i => Math.abs(i.v)), 1);
  return (
    <div style={{ marginTop: 18 }}>
      {items.map((it, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div className="row between" style={{ marginBottom: 4, fontSize: 12 }}>
            <span style={{ fontWeight: 600 }}>{it.label} <span className="ur small">{it.ur}</span></span>
            <span className="num num-md" style={{ color: it.color }}>{it.v < 0 ? '−' : '+'}{fmt(Math.abs(it.v))}</span>
          </div>
          <div className="bar" style={{ height: 8 }}>
            <span style={{ width: (Math.abs(it.v) / max * 100) + '%', background: it.color }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const REPORT_FILTERS = [
  { id: 'all',    label: 'All Time',      ur: 'کل وقت' },
  { id: 'month',  label: 'This Month',    ur: 'اس ماہ' },
  { id: '3month', label: 'Last 3 Months', ur: '3 ماہ' },
  { id: 'year',   label: 'This Year',     ur: 'اس سال' },
];

const filterEntriesByDate = (entries, filter) => {
  if (filter === 'all') return entries;
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
  if (filter === '3month') cutoff.setMonth(cutoff.getMonth() - 2);
  if (filter === 'year')   cutoff.setMonth(0);
  return entries.filter(e => new Date(e.date) >= cutoff);
};

const filterExpensesByDate = (expenses, filter) => {
  if (filter === 'all') return expenses;
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
  if (filter === '3month') cutoff.setMonth(cutoff.getMonth() - 2);
  if (filter === 'year')   cutoff.setMonth(0);
  return Object.fromEntries(
    Object.entries(expenses).map(([k, items]) => [k, items.filter(i => new Date(i.date) >= cutoff)])
  );
};

export const ReportsPage = () => {
  const { entries, expenses, partners, settings, advances } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));

  // Helper function to parse notes JSON
  const parseNotes = (partner) => {
    let notesText = partner.notes || '';
    let investment = 0;
    let purpose = '';
    let dateRepaid = '';
    try {
      const parsed = JSON.parse(partner.notes);
      if (parsed && typeof parsed === 'object') {
        notesText = parsed.text || '';
        investment = parsed.investment || 0;
        purpose = parsed.purpose || '';
        dateRepaid = parsed.dateRepaid || '';
      }
    } catch (e) {
      // Plain text
    }
    return { notesText, investment, purpose, dateRepaid };
  };

  // Helper function to calculate supplier balances (same as LedgerPage)
  const calculateSupplierLedger = (supplierName, entriesList, advancesList) => {
    const key = supplierName.trim().toLowerCase();
    const supplierEntries = entriesList.filter(e => {
      const matchesSupplier = (e.supplier || '').trim().toLowerCase() === key;
      const matchesOwner = (e.ownerList || []).some(o => (o.name || '').trim().toLowerCase() === key);
      return matchesSupplier || matchesOwner;
    });

    let totalSales = 0;
    let totalFreight = 0;
    let totalCrates = 0;

    supplierEntries.forEach(e => {
      const slice = (e.ownerList || []).find(o => (o.name || '').trim().toLowerCase() === key) || null;
      if (slice) {
        totalCrates += slice.crates || 0;
        totalSales += (slice.crates || 0) * (slice.rate || 0);
        const totalCr = (e.ownerList || []).reduce((s, o) => s + (o.crates || 0), 0) || e.crates || 1;
        const share = (slice.crates || 0) / totalCr;
        totalFreight += Math.round((e.fare || 0) * share);
      } else if ((e.supplier || '').trim().toLowerCase() === key) {
        totalCrates += e.crates || 0;
        totalSales += e.gross || 0;
        totalFreight += e.fare || 0;
      }
    });

    const laborCost = totalCrates * 10;
    const commission = totalCrates * 20;
    const totalDeductions = totalFreight + laborCost + commission;
    const netGoodsValue = totalSales - totalDeductions;

    const totalAdvances = advancesList
      .filter(a => a.supplier.trim().toLowerCase() === key)
      .reduce((s, a) => s + (a.given || 0), 0);

    const balance = netGoodsValue - totalAdvances;
    return {
      crates: totalCrates,
      sales: totalSales,
      freight: totalFreight,
      labor: laborCost,
      commission,
      netGoodsValue,
      advances: totalAdvances,
      balance
    };
  };

  // Helper function to calculate customer balances (same as LedgerPage)
  const calculateCustomerLedger = (customerName, entriesList) => {
    let totalCrates = 0;
    let totalGross = 0;
    let totalPayable = 0;
    let totalPaid = 0;

    const key = customerName.trim().toLowerCase();
    entriesList.forEach(e => {
      (e.buyerList || []).forEach(b => {
        if ((b.name || '').trim().toLowerCase() === key) {
          const bGross = (b.crates || 0) * (b.price || 0);
          const bWari  = b.wari !== undefined ? b.wari : (b.crates || 0) * (e.logRate || 5);
          const bComm  = b.commission !== undefined ? b.commission : Math.round(bGross / (e.commDiv || 13.78));
          
          totalCrates += b.crates || 0;
          totalGross += bGross;
          totalPayable += bGross + bComm + bWari - (b.discount || 0);
          totalPaid += b.advance || 0;
        }
      });
    });

    return {
      crates: totalCrates,
      gross: totalGross,
      payable: totalPayable,
      paid: totalPaid,
      balance: totalPayable - totalPaid
    };
  };

  // Helper function to get customer recovery
  const getBuyerRecovery = (b, e) => {
    const bGross = (b.crates || 0) * (b.price || 0);
    const bWari  = b.wari !== undefined ? b.wari : (b.crates || 0) * (e.logRate || 5);
    const bComm  = b.commission !== undefined ? b.commission : Math.round(bGross / (e.commDiv || 13.78));
    const saleVal = bGross + bComm + bWari - (b.discount || 0);

    if ((b.crates === 0 && b.advance > 0) || (b.bill || '').includes('RECOVERY')) {
      return b.advance;
    }
    if (b.type === 'Cash' || b.type === 'Bank') {
      return saleVal;
    }
    return b.advance || 0;
  };

  // --- All unique suppliers and customers ---
  const allSuppliers = useMemo(() => {
    const names = new Set();
    entries.forEach(e => {
      const sName = (e.supplier || '').trim();
      if (sName) names.add(sName);
      (e.ownerList || []).forEach(o => {
        const oName = (o.name || '').trim();
        if (oName) names.add(oName);
      });
    });
    return Array.from(names).sort();
  }, [entries]);

  const allCustomers = useMemo(() => {
    const names = new Set();
    entries.forEach(e => {
      (e.buyerList || []).forEach(b => {
        const bName = (b.name || '').trim();
        if (bName) names.add(bName);
      });
    });
    return Array.from(names).sort();
  }, [entries]);

  // --- Supplier and Customer Ledgers (Lifetime) ---
  const supplierLedgers = useMemo(() => {
    return allSuppliers.map(name => {
      const ledger = calculateSupplierLedger(name, entries, advances);
      const contactObj = entries.find(e => (e.supplier || '').trim().toLowerCase() === name.toLowerCase()) || 
                         entries.find(e => (e.ownerList || []).some(o => (o.name || '').trim().toLowerCase() === name.toLowerCase()));
      return { name, city: contactObj?.city || '', phone: contactObj?.phone || '', ...ledger };
    });
  }, [allSuppliers, entries, advances]);

  const customerLedgers = useMemo(() => {
    return allCustomers.map(name => {
      const ledger = calculateCustomerLedger(name, entries);
      const contactObj = entries.flatMap(e => e.buyerList || []).find(b => (b.name || '').trim().toLowerCase() === name.toLowerCase());
      return { name, phone: contactObj?.phone || '', ...ledger };
    });
  }, [allCustomers, entries]);

  // --- Accounts Receivable (AR) & Accounts Payable (AP) ---
  const accountsReceivable = useMemo(() => {
    return customerLedgers.reduce((s, c) => s + Math.max(0, c.balance), 0);
  }, [customerLedgers]);

  // --- Lenders Details (Lifetime) ---
  const lendersDetails = useMemo(() => {
    return partners
      .filter(p => p.status !== 'inactive' && p.role === 'Lender')
      .map(p => {
        const { notesText, investment: loanAmount, purpose, dateRepaid } = parseNotes(p);
        const totalPaid = (p.payments || []).reduce((s, pay) => s + pay.amount, 0);
        const outstanding = Math.max(0, loanAmount - totalPaid);
        const isSettled = loanAmount > 0 && outstanding === 0;

        let actualRepaidDate = '';
        if (isSettled && p.payments?.length > 0) {
          const sortedPays = [...p.payments].sort((a, b) => new Date(a.date) - new Date(b.date));
          actualRepaidDate = sortedPays[sortedPays.length - 1].date;
        } else if (dateRepaid) {
          actualRepaidDate = dateRepaid;
        } else {
          actualRepaidDate = 'Outstanding';
        }

        return {
          ...p,
          loanAmount,
          purpose,
          dateRepaid: actualRepaidDate,
          totalPaid,
          outstanding,
          joinDate: p.joinDate
        };
      });
  }, [partners]);

  const outstandingLoans = useMemo(() => {
    return lendersDetails.reduce((s, l) => s + l.outstanding, 0);
  }, [lendersDetails]);

  // --- Partners & Investors Details (Lifetime) ---
  const parsedPartners = useMemo(() => {
    return partners
      .filter(p => p.status !== 'inactive' && p.role !== 'Lender')
      .map(p => {
        const { notesText, investment } = parseNotes(p);
        return {
          ...p,
          notesText,
          investment
        };
      });
  }, [partners]);

  const totalInvestmentVal = useMemo(() => {
    return parsedPartners.reduce((s, p) => s + p.investment, 0);
  }, [parsedPartners]);

  // --- Monthly calculations ---
  const monthlyMetrics = useMemo(() => {
    let cratesReceived = 0;
    let cratesSold = 0;
    let purchaseVal = 0;
    let salesVal = 0;
    let recoveries = 0;
    let supplierPayments = 0;

    // Process entries
    entries.forEach(e => {
      const entryInMonth = e.date && e.date.startsWith(selectedMonth);
      if (entryInMonth) {
        cratesReceived += e.crates || 0;
        purchaseVal += e.gross || 0;
      }

      // Add supplier payments from entry.payments
      (e.payments || []).forEach(pay => {
        if (pay.date && pay.date.startsWith(selectedMonth)) {
          supplierPayments += pay.amount || 0;
        }
      });

      // Process buyers
      (e.buyerList || []).forEach(b => {
        const bDate = b.date || e.date;
        if (bDate && bDate.startsWith(selectedMonth)) {
          cratesSold += b.crates || 0;
          const bGross = (b.crates || 0) * (b.price || 0);
          const bWari  = b.wari !== undefined ? b.wari : (b.crates || 0) * (e.logRate || 5);
          const bComm  = b.commission !== undefined ? b.commission : Math.round(bGross / (e.commDiv || 13.78));
          salesVal += bGross + bComm + bWari - (b.discount || 0);
          recoveries += getBuyerRecovery(b, e);
        }
      });
    });

    // Add supplier payments from advances
    advances.forEach(a => {
      if (a.date && a.date.startsWith(selectedMonth)) {
        supplierPayments += a.given || 0;
      }
    });

    // Process expenses in selected month
    let operatingExpenses = 0;
    let salaries = 0;

    Object.entries(expenses).forEach(([category, items]) => {
      (items || []).forEach(item => {
        if (item.date && item.date.startsWith(selectedMonth)) {
          if (category === 'salary') {
            salaries += item.amount || 0;
          } else if (category !== 'charity') {
            operatingExpenses += item.amount || 0;
          }
        }
      });
    });

    // Lenders
    let newLoans = 0;
    let loanRepayments = 0;
    lendersDetails.forEach(l => {
      if (l.joinDate && l.joinDate.startsWith(selectedMonth)) {
        newLoans += l.loanAmount || 0;
      }
      (l.payments || []).forEach(pay => {
        if (pay.date && pay.date.startsWith(selectedMonth)) {
          loanRepayments += pay.amount || 0;
        }
      });
    });

    // Partners & Investors
    let newInvestments = 0;
    let partnerPayments = 0;
    parsedPartners.forEach(p => {
      if (p.joinDate && p.joinDate.startsWith(selectedMonth)) {
        newInvestments += p.investment || 0;
      }
      (p.payments || []).forEach(pay => {
        if (pay.date && pay.date.startsWith(selectedMonth)) {
          partnerPayments += pay.amount || 0;
        }
      });
    });

    const grossProfit = recoveries - operatingExpenses - salaries;
    const charity = grossProfit > 0 ? Math.round(grossProfit * 0.10) : 0;
    const netProfit = grossProfit - charity;

    // Calculate monthly partner/investor shares
    let totalPartnersShare = 0;
    let totalInvestorsShare = 0;
    const sharesList = parsedPartners.map(p => {
      let sharePct = p.sharePercent || 0;
      let calculatedShare = 0;
      if (sharePct > 0) {
        calculatedShare = netProfit * (sharePct / 100);
      } else if (p.investment > 0 && totalInvestmentVal > 0) {
        calculatedShare = netProfit * (p.investment / totalInvestmentVal);
        sharePct = (p.investment / totalInvestmentVal) * 100;
      }
      const roundedShare = Math.round(calculatedShare);
      if (p.role === 'Investor') {
        totalInvestorsShare += roundedShare;
      } else {
        totalPartnersShare += roundedShare;
      }
      return {
        ...p,
        effectiveSharePct: sharePct,
        calculatedShare: roundedShare
      };
    });

    const cashInflow = recoveries + newLoans + newInvestments;
    const cashOutflow = operatingExpenses + salaries + supplierPayments + loanRepayments + partnerPayments;

    return {
      cratesReceived,
      cratesSold,
      purchaseVal,
      salesVal,
      recoveries,
      operatingExpenses,
      salaries,
      grossProfit,
      charity,
      netProfit,
      totalPartnersShare,
      totalInvestorsShare,
      newLoans,
      newInvestments,
      supplierPayments,
      loanRepayments,
      partnerPayments,
      cashInflow,
      cashOutflow,
      sharesList
    };
  }, [entries, advances, expenses, selectedMonth, lendersDetails, parsedPartners, totalInvestmentVal]);

  // --- Lifetime calculations ---
  const lifetimeMetrics = useMemo(() => {
    let cratesReceived = 0;
    let cratesSold = 0;
    let purchaseVal = 0;
    let salesVal = 0;
    let recoveries = 0;
    let supplierPayments = 0;

    entries.forEach(e => {
      cratesReceived += e.crates || 0;
      purchaseVal += e.gross || 0;
      (e.payments || []).forEach(pay => {
        supplierPayments += pay.amount || 0;
      });
      (e.buyerList || []).forEach(b => {
        cratesSold += b.crates || 0;
        const bGross = (b.crates || 0) * (b.price || 0);
        const bWari  = b.wari !== undefined ? b.wari : (b.crates || 0) * (e.logRate || 5);
        const bComm  = b.commission !== undefined ? b.commission : Math.round(bGross / (e.commDiv || 13.78));
        salesVal += bGross + bComm + bWari - (b.discount || 0);
        recoveries += getBuyerRecovery(b, e);
      });
    });

    advances.forEach(a => {
      supplierPayments += a.given || 0;
    });

    let operatingExpenses = 0;
    let salaries = 0;

    Object.entries(expenses).forEach(([category, items]) => {
      (items || []).forEach(item => {
        if (category === 'salary') {
          salaries += item.amount || 0;
        } else if (category !== 'charity') {
          operatingExpenses += item.amount || 0;
        }
      });
    });

    let newLoans = 0;
    let loanRepayments = 0;
    lendersDetails.forEach(l => {
      newLoans += l.loanAmount || 0;
      (l.payments || []).forEach(pay => {
        loanRepayments += pay.amount || 0;
      });
    });

    let newInvestments = 0;
    let partnerPayments = 0;
    parsedPartners.forEach(p => {
      newInvestments += p.investment || 0;
      (p.payments || []).forEach(pay => {
        partnerPayments += pay.amount || 0;
      });
    });

    const grossProfit = recoveries - operatingExpenses - salaries;
    const charity = grossProfit > 0 ? Math.round(grossProfit * 0.10) : 0;
    const netProfit = grossProfit - charity;

    let totalPartnersShare = 0;
    let totalInvestorsShare = 0;
    const sharesList = parsedPartners.map(p => {
      let sharePct = p.sharePercent || 0;
      let calculatedShare = 0;
      if (sharePct > 0) {
        calculatedShare = netProfit * (sharePct / 100);
      } else if (p.investment > 0 && totalInvestmentVal > 0) {
        calculatedShare = netProfit * (p.investment / totalInvestmentVal);
        sharePct = (p.investment / totalInvestmentVal) * 100;
      }
      const roundedShare = Math.round(calculatedShare);
      if (p.role === 'Investor') {
        totalInvestorsShare += roundedShare;
      } else {
        totalPartnersShare += roundedShare;
      }
      return {
        ...p,
        effectiveSharePct: sharePct,
        calculatedShare: roundedShare
      };
    });

    const cashInflow = recoveries + newLoans + newInvestments;
    const cashOutflow = operatingExpenses + salaries + supplierPayments + loanRepayments + partnerPayments;

    return {
      cratesReceived,
      cratesSold,
      purchaseVal,
      salesVal,
      recoveries,
      operatingExpenses,
      salaries,
      grossProfit,
      charity,
      netProfit,
      totalPartnersShare,
      totalInvestorsShare,
      newLoans,
      newInvestments,
      supplierPayments,
      loanRepayments,
      partnerPayments,
      cashInflow,
      cashOutflow,
      sharesList
    };
  }, [entries, advances, expenses, lendersDetails, parsedPartners, totalInvestmentVal]);

  const accountsPayable = useMemo(() => {
    const supplierTotal = supplierLedgers.reduce((s, sup) => s + Math.max(0, sup.balance), 0);
    const loansTotal = outstandingLoans;
    let unpaidSharesTotal = 0;
    lifetimeMetrics.sharesList.forEach(p => {
      const totalPaid = (p.payments || []).reduce((s, pay) => s + pay.amount, 0);
      const unpaid = Math.max(0, p.calculatedShare - totalPaid);
      unpaidSharesTotal += unpaid;
    });

    return supplierTotal + loansTotal + unpaidSharesTotal;
  }, [supplierLedgers, outstandingLoans, lifetimeMetrics.sharesList]);

  // --- Salary expenses list for selected month ---
  const monthlySalariesList = useMemo(() => {
    const list = [];
    (expenses.salary || []).forEach(item => {
      if (item.date && item.date.startsWith(selectedMonth)) {
        list.push(item);
      }
    });
    return list.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [expenses.salary, selectedMonth]);

  // --- Operating expenses categories list for selected month ---
  const monthlyOperatingExpensesBreakdown = useMemo(() => {
    const breakdown = {};
    Object.entries(expenses).forEach(([category, items]) => {
      if (category !== 'salary' && category !== 'charity') {
        let total = 0;
        let count = 0;
        (items || []).forEach(item => {
          if (item.date && item.date.startsWith(selectedMonth)) {
            total += item.amount || 0;
            count++;
          }
        });
        if (total > 0) {
          breakdown[category] = { total, count };
        }
      }
    });
    return Object.entries(breakdown).map(([category, data]) => ({
      category,
      ...data
    }));
  }, [expenses, selectedMonth]);

  // Formatting date for label
  const monthLabel = useMemo(() => {
    if (!selectedMonth) return '';
    const [yr, mn] = selectedMonth.split('-');
    return new Date(yr, mn - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  return (
    <Page titleEn="Company Summary & Reports" titleUr="کمپنی رپورٹ اور کارکردگی" sub={`Business performance summary for ${monthLabel}`}>
      <style>{`
        @media print {
          .sidebar, .topbar, .noprint, .btn, .filter-pill, input, select {
            display: none !important;
          }
          body, .app, #root {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
            display: block !important;
          }
          .page-content {
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .printable-report {
            width: 100% !important;
            max-width: 100% !important;
            padding: 10px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
          .printable-report * {
            color: black !important;
            text-shadow: none !important;
          }
          .printable-report table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 10px !important;
            font-size: 11px !important;
          }
          .printable-report th, .printable-report td {
            border: 1px solid #333 !important;
            padding: 4px 8px !important;
            background: transparent !important;
          }
          .printable-report th {
            font-weight: bold !important;
            background-color: #f3f4f6 !important;
          }
          .summary-kpi-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 8px !important;
            margin-bottom: 15px !important;
          }
          .kpi-card {
            border: 1px solid #333 !important;
            padding: 6px 10px !important;
            background: transparent !important;
            box-shadow: none !important;
            border-radius: 4px !important;
          }
          .kpi-card-title {
            font-size: 9px !important;
            color: #555 !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
          }
          .kpi-card-value {
            font-size: 14px !important;
            font-weight: bold !important;
          }
          .report-section {
            page-break-inside: avoid !important;
            margin-bottom: 15px !important;
          }
          .report-title {
            font-size: 18px !important;
            font-weight: bold !important;
            text-align: center !important;
            margin-bottom: 2px !important;
          }
          .report-subtitle {
            font-size: 11px !important;
            text-align: center !important;
            margin-bottom: 15px !important;
            color: #444 !important;
          }
        }
        
        .summary-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .kpi-card {
          padding: 16px;
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        .kpi-card-title {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .kpi-card-value {
          font-size: 20px;
          font-weight: 800;
          font-family: var(--font-mono);
        }
        .kpi-card-meta {
          font-size: 10px;
          color: var(--text-4);
          margin-top: 4px;
        }
        .report-section {
          margin-bottom: 28px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 6px;
        }
        .section-header h3 {
          font-size: 14px;
          font-weight: 700;
          color: var(--orange-400);
        }
        .section-header .ur {
          font-size: 14px;
          color: var(--text-3);
        }
      `}</style>

      {/* Control bar */}
      <div className="row gap-sm noprint" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="row gap-xs" style={{ alignItems: 'center' }}>
          <span className="small" style={{ fontWeight: 600 }}>Select Month:</span>
          <input
            type="month"
            className="input"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{ width: 180, padding: '6px 12px', borderRadius: 8 }}
          />
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
          <Icon name="print" size={13} /> Print Company Summary
        </button>
      </div>

      <div className="printable-report">
        {/* Printable Header */}
        <div style={{ display: 'none' }} className="print-only">
          <div className="report-title">{settings?.mandiName || 'Tomato Trading Mandi'}</div>
          <div className="report-subtitle">Company Monthly Summary Report — {monthLabel}</div>
        </div>

        {/* 12-Card Monthly KPI Grid */}
        <div className="report-section">
          <div className="section-header noprint">
            <h3>Monthly Performance Summary</h3>
            <span className="ur">ماہانہ کاروباری کارکردگی کا خلاصہ</span>
          </div>
          <div className="summary-kpi-grid">
            <div className="glass kpi-card">
              <div className="kpi-card-title">Crates Received</div>
              <div className="kpi-card-value">{monthlyMetrics.cratesReceived.toLocaleString()}</div>
              <div className="kpi-card-meta">Supplier crates in {monthLabel}</div>
            </div>
            <div className="glass kpi-card">
              <div className="kpi-card-title">Crates Sold</div>
              <div className="kpi-card-value">{monthlyMetrics.cratesSold.toLocaleString()}</div>
              <div className="kpi-card-meta">Buyer crates in {monthLabel}</div>
            </div>
            <div className="glass kpi-card">
              <div className="kpi-card-title">Purchase Value</div>
              <div className="kpi-card-value">{fmt(monthlyMetrics.purchaseVal)}</div>
              <div className="kpi-card-meta">Supplier gross goods value</div>
            </div>
            <div className="glass kpi-card">
              <div className="kpi-card-title">Sales Value</div>
              <div className="kpi-card-value">{fmt(monthlyMetrics.salesVal)}</div>
              <div className="kpi-card-meta">Buyer gross goods value</div>
            </div>
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--success)' }}>
              <div className="kpi-card-title">Recoveries (Collections)</div>
              <div className="kpi-card-value" style={{ color: 'var(--success)' }}>{fmt(monthlyMetrics.recoveries)}</div>
              <div className="kpi-card-meta">Actual cash collected from buyers</div>
            </div>
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--danger)' }}>
              <div className="kpi-card-title">Operating Expenses</div>
              <div className="kpi-card-value" style={{ color: 'var(--danger)' }}>{fmt(monthlyMetrics.operatingExpenses)}</div>
              <div className="kpi-card-meta">Utility, food, rent, parking, etc.</div>
            </div>
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--danger)' }}>
              <div className="kpi-card-title">Employee Salaries</div>
              <div className="kpi-card-value" style={{ color: 'var(--danger)' }}>{fmt(monthlyMetrics.salaries)}</div>
              <div className="kpi-card-meta">Salaries paid in month</div>
            </div>
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--success)' }}>
              <div className="kpi-card-title">Gross Profit</div>
              <div className="kpi-card-value" style={{ color: 'var(--success)' }}>{fmt(monthlyMetrics.grossProfit)}</div>
              <div className="kpi-card-meta">Recoveries minus all expenses</div>
            </div>
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--orange-400)' }}>
              <div className="kpi-card-title">10% Charity / Sadaqah</div>
              <div className="kpi-card-value" style={{ color: 'var(--orange-400)' }}>{fmt(monthlyMetrics.charity)}</div>
              <div className="kpi-card-meta">Auto-deducted from gross profit</div>
            </div>
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--success)' }}>
              <div className="kpi-card-title">Net Profit</div>
              <div className="kpi-card-value" style={{ color: monthlyMetrics.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(monthlyMetrics.netProfit)}</div>
              <div className="kpi-card-meta">After 10% Sadaqah deduction</div>
            </div>
            <div className="glass kpi-card">
              <div className="kpi-card-title">AR / AP Status</div>
              <div className="kpi-card-value" style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div>Receivable: <span className="mono" style={{ color: 'var(--success)', fontWeight: 700 }}>{fmtShort(accountsReceivable)}</span></div>
                <div>Payable: <span className="mono" style={{ color: 'var(--danger)', fontWeight: 700 }}>{fmtShort(accountsPayable)}</span></div>
              </div>
              <div className="kpi-card-meta">Outstanding receivables/liabilities</div>
            </div>
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--orange-400)' }}>
              <div className="kpi-card-title">Outstanding Loans</div>
              <div className="kpi-card-value" style={{ color: outstandingLoans > 0 ? 'var(--danger)' : 'var(--success)' }}>{fmt(outstandingLoans)}</div>
              <div className="kpi-card-meta">Total active loan liability</div>
            </div>
          </div>
        </div>

        {/* Suppliers Outstanding Balances Section */}
        <div className="report-section">
          <div className="section-header">
            <h3>Suppliers (Beoparis) Ledger Summaries & Balances</h3>
            <span className="ur">بیوپاری بقایہ جات اور خلاصہ</span>
          </div>
          <div className="glass" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Supplier Name</th>
                    <th>City</th>
                    <th className="right">Crates Received</th>
                    <th className="right">Gross Purchases</th>
                    <th className="right">Advances/Paid</th>
                    <th className="right">Outstanding Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierLedgers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>No supplier records found.</td>
                    </tr>
                  ) : (
                    supplierLedgers.map((s, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.city || '—'}</td>
                        <td className="num right">{s.crates.toLocaleString()}</td>
                        <td className="num right">{fmt(s.sales)}</td>
                        <td className="num right" style={{ color: 'var(--danger)' }}>{fmt(s.advances)}</td>
                        <td className="num right" style={{ fontWeight: 700, color: s.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {fmt(Math.abs(s.balance))}
                        </td>
                        <td>
                          <span className={`chip ${s.balance >= 0 ? 'success' : 'danger'}`}>
                            {s.balance >= 0 ? 'Owed to Supplier' : 'Supplier Owes Mandi'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {supplierLedgers.length > 0 && (
                  <tfoot>
                    <tr style={{ fontWeight: 700 }}>
                      <td colSpan={2}>Aggregate Supplier Totals</td>
                      <td className="num right">{supplierLedgers.reduce((s, x) => s + x.crates, 0).toLocaleString()}</td>
                      <td className="num right">{fmt(supplierLedgers.reduce((s, x) => s + x.sales, 0))}</td>
                      <td className="num right" style={{ color: 'var(--danger)' }}>{fmt(supplierLedgers.reduce((s, x) => s + x.advances, 0))}</td>
                      <td className="num right" style={{ color: 'var(--success)' }}>
                        {fmt(supplierLedgers.reduce((s, x) => s + x.balance, 0))}
                      </td>
                      <td>—</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Buyers Outstanding Balances Section */}
        <div className="report-section">
          <div className="section-header">
            <h3>Buyers (Customers) Ledger Summaries & Balances</h3>
            <span className="ur">گاہک بقایہ جات اور خلاصہ</span>
          </div>
          <div className="glass" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th className="right">Crates Purchased</th>
                    <th className="right">Gross Sales Value</th>
                    <th className="right">Total Payable (Due)</th>
                    <th className="right">Total Recovered (Paid)</th>
                    <th className="right">Current Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {customerLedgers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>No customer records found.</td>
                    </tr>
                  ) : (
                    customerLedgers.map((c, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>{c.phone || '—'}</td>
                        <td className="num right">{c.crates.toLocaleString()}</td>
                        <td className="num right">{fmt(c.gross)}</td>
                        <td className="num right">{fmt(c.payable)}</td>
                        <td className="num right" style={{ color: 'var(--success)' }}>{fmt(c.paid)}</td>
                        <td className="num right" style={{ fontWeight: 700, color: c.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                          {fmt(c.balance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {customerLedgers.length > 0 && (
                  <tfoot>
                    <tr style={{ fontWeight: 700 }}>
                      <td colSpan={2}>Aggregate Customer Totals</td>
                      <td className="num right">{customerLedgers.reduce((s, x) => s + x.crates, 0).toLocaleString()}</td>
                      <td className="num right">{fmt(customerLedgers.reduce((s, x) => s + x.gross, 0))}</td>
                      <td className="num right">{fmt(customerLedgers.reduce((s, x) => s + x.payable, 0))}</td>
                      <td className="num right" style={{ color: 'var(--success)' }}>{fmt(customerLedgers.reduce((s, x) => s + x.paid, 0))}</td>
                      <td className="num right" style={{ color: 'var(--danger)' }}>
                        {fmt(customerLedgers.reduce((s, x) => s + x.balance, 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Partners & Investors Profit Distribution Section */}
        <div className="report-section">
          <div className="section-header">
            <h3>Partners & Investors Monthly Profit Shares</h3>
            <span className="ur">شراکت دار و سرمایہ کار منافع تقسیم</span>
          </div>
          <div className="glass" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Partner / Investor Name</th>
                    <th>Contact</th>
                    <th>Role</th>
                    <th className="right">Share %</th>
                    <th className="right">Investment Amount</th>
                    <th className="right">Profit Share in {monthLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyMetrics.sharesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>No active partners or investors found.</td>
                    </tr>
                  ) : (
                    monthlyMetrics.sharesList.map((p, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>{p.phone || '—'}</td>
                        <td><span className="chip">{p.role}</span></td>
                        <td className="num right">{p.effectiveSharePct.toFixed(1)}%</td>
                        <td className="num right">{fmt(p.investment)}</td>
                        <td className="num right" style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(p.calculatedShare)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Loan details & Tracker Section */}
        <div className="report-section">
          <div className="section-header">
            <h3>Lenders Loan details & Outstanding Tracker</h3>
            <span className="ur">قرض کی تفصیلات اور بقایہ جات</span>
          </div>
          <div className="glass" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Lender Name</th>
                    <th>Contact</th>
                    <th className="right">Loan Amount</th>
                    <th>Date Received</th>
                    <th>Purpose of Loan</th>
                    <th>Repayment Date / Status</th>
                    <th className="right">Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {lendersDetails.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>No active loans found.</td>
                    </tr>
                  ) : (
                    lendersDetails.map((l, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{l.name}</td>
                        <td>{l.phone || '—'}</td>
                        <td className="num right">{fmt(l.loanAmount)}</td>
                        <td>{l.joinDate ? new Date(l.joinDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                        <td>{l.purpose || '—'}</td>
                        <td>
                          {l.outstanding === 0 ? (
                            <span className="chip success">Paid: {new Date(l.dateRepaid).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          ) : (
                            <span className="chip warn">Outstanding</span>
                          )}
                        </td>
                        <td className="num right" style={{ fontWeight: 700, color: l.outstanding > 0 ? 'var(--danger)' : 'var(--success)' }}>
                          {fmt(l.outstanding)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Salaries & Expenses Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="report-section section-grid">
          <div>
            <div className="section-header">
              <h3>Monthly Salaries</h3>
              <span className="ur">تنخواہیں</span>
            </div>
            <div className="glass" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Period</th>
                      <th className="right">Salary Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySalariesList.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: 20 }}>No salaries recorded this month.</td>
                      </tr>
                    ) : (
                      monthlySalariesList.map((s, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td><span className="chip">{s.period || 'Monthly'}</span></td>
                          <td className="num right" style={{ color: 'var(--danger)', fontWeight: 600 }}>{fmt(s.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {monthlySalariesList.length > 0 && (
                    <tfoot>
                      <tr style={{ fontWeight: 700 }}>
                        <td colSpan={2}>Total Salaries</td>
                        <td className="num right" style={{ color: 'var(--danger)' }}>{fmt(monthlyMetrics.salaries)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          <div>
            <div className="section-header">
              <h3>Operating Expenses Category Summary</h3>
              <span className="ur">دیگر اخراجات کا خلاصہ</span>
            </div>
            <div className="glass" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Expense Category</th>
                      <th className="right">No. of Entries</th>
                      <th className="right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyOperatingExpensesBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: 20 }}>No operating expenses recorded this month.</td>
                      </tr>
                    ) : (
                      monthlyOperatingExpensesBreakdown.map((exp, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{exp.category}</td>
                          <td className="num right">{exp.count}</td>
                          <td className="num right" style={{ color: 'var(--danger)', fontWeight: 600 }}>{fmt(exp.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {monthlyOperatingExpensesBreakdown.length > 0 && (
                    <tfoot>
                      <tr style={{ fontWeight: 700 }}>
                        <td colSpan={2}>Total Operating Expenses</td>
                        <td className="num right" style={{ color: 'var(--danger)' }}>{fmt(monthlyMetrics.operatingExpenses)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Flow Statement Section */}
        <div className="report-section">
          <div className="section-header">
            <h3>Cash Flow Statement (Inflows vs Outflows)</h3>
            <span className="ur">کیش فلو اسٹیٹمنٹ (آمد اور اخراج)</span>
          </div>
          <div className="glass" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cash Inflow Sources (Monthly)</th>
                    <th className="right">Amount</th>
                    <th>Cash Outflow Allocations (Monthly)</th>
                    <th className="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Customer Recoveries · گاہک وصولی</td>
                    <td className="num right" style={{ color: 'var(--success)' }}>{fmt(monthlyMetrics.recoveries)}</td>
                    <td>Operating Expenses · کاروباری اخراجات</td>
                    <td className="num right" style={{ color: 'var(--danger)' }}>{fmt(monthlyMetrics.operatingExpenses)}</td>
                  </tr>
                  <tr>
                    <td>New Loans Received · حاصل کردہ قرض</td>
                    <td className="num right" style={{ color: 'var(--success)' }}>{fmt(monthlyMetrics.newLoans)}</td>
                    <td>Employee Salaries · ملازمین تنخواہ</td>
                    <td className="num right" style={{ color: 'var(--danger)' }}>{fmt(monthlyMetrics.salaries)}</td>
                  </tr>
                  <tr>
                    <td>New Partner/Investor Investments · سرمایہ کاری</td>
                    <td className="num right" style={{ color: 'var(--success)' }}>{fmt(monthlyMetrics.newInvestments)}</td>
                    <td>Supplier Payments & Advances · ادائیگی بیوپاری</td>
                    <td className="num right" style={{ color: 'var(--danger)' }}>{fmt(monthlyMetrics.supplierPayments)}</td>
                  </tr>
                  <tr>
                    <td>—</td>
                    <td>—</td>
                    <td>Loan Repayments · قرض واپسی</td>
                    <td className="num right" style={{ color: 'var(--danger)' }}>{fmt(monthlyMetrics.loanRepayments)}</td>
                  </tr>
                  <tr>
                    <td>—</td>
                    <td>—</td>
                    <td>Partner Profit Payments · ادائیگی منافع</td>
                    <td className="num right" style={{ color: 'var(--danger)' }}>{fmt(monthlyMetrics.partnerPayments)}</td>
                  </tr>
                  <tr style={{ fontWeight: 700, background: 'var(--bg-app-2)' }}>
                    <td>Total Inflow · کل آمد</td>
                    <td className="num right" style={{ color: 'var(--success)' }}>{fmt(monthlyMetrics.cashInflow)}</td>
                    <td>Total Outflow · کل اخراج</td>
                    <td className="num right" style={{ color: 'var(--danger)' }}>{fmt(monthlyMetrics.cashOutflow)}</td>
                  </tr>
                  <tr style={{ fontWeight: 800, fontSize: 13, background: 'var(--orange-950-alpha, rgba(245,166,35,0.08))' }}>
                    <td colSpan={2}>Net Cash Movement (Inflow - Outflow)</td>
                    <td colSpan={2} className="num right" style={{ color: (monthlyMetrics.cashInflow - monthlyMetrics.cashOutflow) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {fmt(monthlyMetrics.cashInflow - monthlyMetrics.cashOutflow)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Overall/Lifetime Business Summary Card Dashboard */}
        <div className="report-section" style={{ borderTop: '3px solid var(--orange-500)', paddingTop: 20 }}>
          <div className="section-header">
            <h3>Overall Lifetime Business Summary Card Dashboard</h3>
            <span className="ur">مجموعی زندگی بھر کی کاروباری خلاصہ رپورٹ</span>
          </div>
          <div className="summary-kpi-grid">
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--orange-400)', background: 'var(--bg-app-2)' }}>
              <div className="kpi-card-title">Lifetime Crates Received</div>
              <div className="kpi-card-value" style={{ color: 'var(--orange-400)' }}>{lifetimeMetrics.cratesReceived.toLocaleString()}</div>
              <div className="kpi-card-meta">Total supplier crates ever received</div>
            </div>
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--orange-400)', background: 'var(--bg-app-2)' }}>
              <div className="kpi-card-title">Lifetime Crates Sold</div>
              <div className="kpi-card-value" style={{ color: 'var(--orange-400)' }}>{lifetimeMetrics.cratesSold.toLocaleString()}</div>
              <div className="kpi-card-meta">Total buyer crates ever sold</div>
            </div>
            <div className="glass kpi-card" style={{ background: 'var(--bg-app-2)' }}>
              <div className="kpi-card-title">Lifetime Purchases Value</div>
              <div className="kpi-card-value">{fmt(lifetimeMetrics.purchaseVal)}</div>
              <div className="kpi-card-meta">Total supplier goods value to date</div>
            </div>
            <div className="glass kpi-card" style={{ background: 'var(--bg-app-2)' }}>
              <div className="kpi-card-title">Lifetime Sales Value</div>
              <div className="kpi-card-value">{fmt(lifetimeMetrics.salesVal)}</div>
              <div className="kpi-card-meta">Total buyer goods value to date</div>
            </div>
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--success)', background: 'var(--bg-app-2)' }}>
              <div className="kpi-card-title">Lifetime Recoveries</div>
              <div className="kpi-card-value" style={{ color: 'var(--success)' }}>{fmt(lifetimeMetrics.recoveries)}</div>
              <div className="kpi-card-meta">Total recoveries collected to date</div>
            </div>
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--danger)', background: 'var(--bg-app-2)' }}>
              <div className="kpi-card-title">Lifetime Operating Expenses</div>
              <div className="kpi-card-value" style={{ color: 'var(--danger)' }}>{fmt(lifetimeMetrics.operatingExpenses)}</div>
              <div className="kpi-card-meta">Total operating expenses ever paid</div>
            </div>
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--danger)', background: 'var(--bg-app-2)' }}>
              <div className="kpi-card-title">Lifetime Salaries Paid</div>
              <div className="kpi-card-value" style={{ color: 'var(--danger)' }}>{fmt(lifetimeMetrics.salaries)}</div>
              <div className="kpi-card-meta">Total employee salaries ever paid</div>
            </div>
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--success)', background: 'var(--bg-app-2)' }}>
              <div className="kpi-card-title">Lifetime Gross Profit</div>
              <div className="kpi-card-value" style={{ color: 'var(--success)' }}>{fmt(lifetimeMetrics.grossProfit)}</div>
              <div className="kpi-card-meta">Cumulative recoveries minus expenses</div>
            </div>
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--orange-400)', background: 'var(--bg-app-2)' }}>
              <div className="kpi-card-title">Lifetime Sadaqah (10%)</div>
              <div className="kpi-card-value" style={{ color: 'var(--orange-400)' }}>{fmt(lifetimeMetrics.charity)}</div>
              <div className="kpi-card-meta">Cumulative Sadaqah contributions</div>
            </div>
            <div className="glass kpi-card" style={{ borderLeft: '3px solid var(--success)', background: 'var(--bg-app-2)' }}>
              <div className="kpi-card-title">Lifetime Net Profit</div>
              <div className="kpi-card-value" style={{ color: lifetimeMetrics.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(lifetimeMetrics.netProfit)}</div>
              <div className="kpi-card-meta">Cumulative profit after Sadaqah</div>
            </div>
            <div className="glass kpi-card" style={{ background: 'var(--bg-app-2)' }}>
              <div className="kpi-card-title">Lifetime Partners' profit</div>
              <div className="kpi-card-value">{fmt(lifetimeMetrics.totalPartnersShare)}</div>
              <div className="kpi-card-meta">Cumulative profit share for partners</div>
            </div>
            <div className="glass kpi-card" style={{ background: 'var(--bg-app-2)' }}>
              <div className="kpi-card-title">Lifetime Investors' profit</div>
              <div className="kpi-card-value">{fmt(lifetimeMetrics.totalInvestorsShare)}</div>
              <div className="kpi-card-meta">Cumulative profit share for investors</div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

