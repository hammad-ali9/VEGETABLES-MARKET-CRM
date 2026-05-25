import { useState } from 'react';
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
  const { entries, expenses } = useApp();
  const [activeFilter, setActiveFilter] = useState('all');

  const fe = filterEntriesByDate(entries, activeFilter);
  const fexp = filterExpensesByDate(expenses, activeFilter);

  const totalLaga       = fe.reduce((s, e) => s + (e.laga || 0), 0);
  const totalLabour     = fe.reduce((s, e) => s + (e.labour || 0), 0);
  const totalCommission = fe.reduce((s, e) =>
    s + (e.commission !== undefined ? e.commission : Math.round((e.gross || 0) / 13.78)), 0);
  const totalWari       = fe.reduce((s, e) =>
    s + (e.wari !== undefined ? e.wari : (e.crates || 0) * 5), 0);
  const totalExpenses   = Object.values(fexp).flat().reduce((s, i) => s + (i.amount || 0), 0);
  const grossEarnings   = totalLaga + totalLabour + totalCommission + totalWari;
  const netProfit       = grossEarnings - totalExpenses;

  const waterfallItems = [
    { label: 'Laga',       ur: 'لاگا',     v: totalLaga,       color: '#ffa726' },
    { label: 'Labour',     ur: 'مزدوری',   v: totalLabour,     color: '#ffb84d' },
    { label: 'Commission', ur: 'کمیشن',    v: totalCommission, color: '#ffcc80' },
    { label: 'Wari',       ur: 'نگواری',   v: totalWari,       color: '#ff8c42' },
    { label: 'Expenses',   ur: 'اخراجات',  v: -totalExpenses,  color: '#f87171' },
    { label: 'Net Profit', ur: 'خالص',     v: netProfit,       color: netProfit >= 0 ? '#34d399' : '#f87171' },
  ];

  const hasData = entries.length > 0 || Object.values(expenses).flat().length > 0;
  const filterLabel = REPORT_FILTERS.find(f => f.id === activeFilter)?.label || 'All Time';

  return (
    <Page titleEn="Profit & Reports" titleUr="منافع و رپورٹ" sub={`${fe.length} entr${fe.length !== 1 ? 'ies' : 'y'} · ${filterLabel}`}>
      <div className="row gap-sm" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {REPORT_FILTERS.map(f => (
          <span key={f.id} className={`filter-pill ${activeFilter === f.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.id)}>
            {f.label} <span className="ur">({f.ur})</span>
          </span>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={() => window.print()}><Icon name="print" size={13} /> Print</button>
      </div>

      {!hasData ? (
        <div className="glass" style={{ padding: 48, textAlign: 'center' }}>
          <Icon name="chart" size={36} />
          <div style={{ marginTop: 16, fontWeight: 700, fontSize: 18 }}>No data yet</div>
          <div className="small" style={{ marginTop: 8 }}>Add entries and expenses to see profit reports here.</div>
        </div>
      ) : (
        <>
          <div className="grid-4" style={{ marginBottom: 24 }}>
            <div className="glass stat">
              <div className="stat-label"><span className="en">Gross Earnings</span><span className="ur">کل آمدنی</span></div>
              <div className="num num-xl" style={{ marginTop: 6, color: 'var(--success)' }}>{grossEarnings > 0 ? fmt(grossEarnings) : '—'}</div>
              <div className="stat-meta">laga + labour + comm + wari</div>
            </div>
            <div className="glass stat">
              <div className="stat-label"><span className="en">Total Expenses</span><span className="ur">کل اخراجات</span></div>
              <div className="num num-xl" style={{ marginTop: 6, color: 'var(--danger)' }}>{totalExpenses > 0 ? fmt(totalExpenses) : '—'}</div>
            </div>
            <div className="glass stat">
              <div className="stat-label"><span className="en">Net Profit</span><span className="ur">خالص منافع</span></div>
              <div className="num num-xl" style={{ marginTop: 6, color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(Math.abs(netProfit))}</div>
              <div className="stat-meta">{netProfit < 0 ? 'Net loss' : 'After all expenses'}</div>
            </div>
            <div className="glass stat">
              <div className="stat-label"><span className="en">Trucks</span><span className="ur">ٹرک</span></div>
              <div className="num num-xl" style={{ marginTop: 6 }}>{fe.length}</div>
              <div className="stat-meta">{filterLabel}</div>
            </div>
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <div className="section-head"><div><h2>Profit Breakdown</h2><span className="ur">منافع کی تشکیل</span></div></div>
            <ProfitWaterfall items={waterfallItems} />
          </div>
        </>
      )}
    </Page>
  );
};
