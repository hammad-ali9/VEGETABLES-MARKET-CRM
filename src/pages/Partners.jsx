import { useState } from 'react';
import { Icon } from '../components/ui/Icon';
import { Page } from '../components/layout/Page';
import { fmt } from '../utils/format';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../components/ui/ConfirmDialog';

const TODAY = new Date().toISOString().split('T')[0];

const REPORT_FILTERS = [
  { id: 'all',    label: 'All Time',      ur: 'کل وقت' },
  { id: 'month',  label: 'This Month',    ur: 'اس ماہ' },
  { id: '3month', label: 'Last 3 Months', ur: '3 ماہ' },
  { id: 'year',   label: 'This Year',     ur: 'اس سال' },
];

const ROLES = ['Partner', 'Investor', 'Silent Partner'];

const filterByDate = (arr, filter) => {
  if (filter === 'all') return arr;
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
  if (filter === '3month') cutoff.setMonth(cutoff.getMonth() - 2);
  if (filter === 'year') cutoff.setMonth(0);
  return arr.filter(e => new Date(e.date) >= cutoff);
};

const filterExpensesByDate = (expenses, filter) => {
  if (filter === 'all') return expenses;
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
  if (filter === '3month') cutoff.setMonth(cutoff.getMonth() - 2);
  if (filter === 'year') cutoff.setMonth(0);
  return Object.fromEntries(
    Object.entries(expenses).map(([k, items]) => [k, items.filter(i => new Date(i.date) >= cutoff)])
  );
};

const calcNetProfit = (entries, expenses) => {
  const totalLaga       = entries.reduce((s, e) => s + (e.laga || 0), 0);
  const totalLabour     = entries.reduce((s, e) => s + (e.labour || 0), 0);
  const totalCommission = entries.reduce((s, e) =>
    s + (e.commission !== undefined ? e.commission : Math.round((e.gross || 0) / 13.78)), 0);
  const totalWari       = entries.reduce((s, e) =>
    s + (e.wari !== undefined ? e.wari : (e.crates || 0) * 5), 0);
  const totalExpenses   = Object.values(expenses).flat().reduce((s, i) => s + (i.amount || 0), 0);
  return totalLaga + totalLabour + totalCommission + totalWari - totalExpenses;
};

// ── Add / Edit Partner Modal ────────────────────────────────────────────────

const PartnerModal = ({ data, onClose, onSave }) => {
  const isEdit = !!data?.id;
  const [form, setForm] = useState(
    data || { name: '', role: 'Partner', sharePercent: '', joinDate: TODAY, phone: '', notes: '' }
  );
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) { alert('Name is required.'); return; }
    const sharePercent = parseFloat(form.sharePercent);
    if (!sharePercent || sharePercent <= 0 || sharePercent > 100) {
      alert('Share % must be between 0.1 and 100.');
      return;
    }
    onSave({ ...form, name: form.name.trim(), sharePercent, payments: form.payments || [] });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)' }}>
          <div className="row">
            <div style={{ flex: 1 }}>
              <h2 className="h2">{isEdit ? 'Edit Partner' : 'Add Partner'} · {isEdit ? 'ترمیم' : 'نیا شراکت دار'}</h2>
              <div className="small">Investor or business partner · سرمایہ کار یا شراکت دار</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <div className="field-label"><span>Full Name <span className="req">*</span></span><span className="ur">نام</span></div>
              <input className="input" placeholder="e.g. Haji Arshad" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="field">
              <div className="field-label"><span>Role</span><span className="ur">کردار</span></div>
              <select className="select" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="field">
              <div className="field-label"><span>Share % <span className="req">*</span></span><span className="ur">منافع حصہ</span></div>
              <div style={{ position: 'relative' }}>
                <input
                  className="input num"
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.5"
                  placeholder="10"
                  style={{ paddingRight: 36 }}
                  value={form.sharePercent}
                  onChange={e => set('sharePercent', e.target.value)}
                />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-3)', fontWeight: 700, pointerEvents: 'none' }}>%</span>
              </div>
            </div>
            <div className="field">
              <div className="field-label"><span>Phone</span><span className="ur">فون</span></div>
              <input className="input" placeholder="03xx-xxxxxxx" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="field">
              <div className="field-label"><span>Join Date</span><span className="ur">تاریخ</span></div>
              <input className="input" type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <div className="field-label"><span>Notes</span><span className="ur">نوٹس</span></div>
              <input className="input" placeholder="Optional remarks…" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="row gap-sm" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Icon name="check" size={13} /> {isEdit ? 'Save Changes' : 'Add Partner'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Record Payment Modal ────────────────────────────────────────────────────

const PaymentModal = ({ partner, shareAmount, onClose, onSave }) => {
  const [form, setForm] = useState({ date: TODAY, amount: shareAmount > 0 ? shareAmount : '', notes: '' });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    const amount = +form.amount;
    if (!amount || amount <= 0) { alert('Amount is required.'); return; }
    onSave({ id: crypto.randomUUID(), date: form.date || TODAY, amount, notes: form.notes.trim() });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)' }}>
          <div className="row">
            <div style={{ flex: 1 }}>
              <h2 className="h2">Record Payment · ادائیگی</h2>
              <div className="small">{partner.name} · {partner.sharePercent}% share{shareAmount > 0 ? ` · ${fmt(shareAmount)} owed` : ''}</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            <div className="field">
              <div className="field-label"><span>Amount <span className="req">*</span></span><span className="ur">رقم</span></div>
              <div className="input-prefix">
                <span className="pre">Rs.</span>
                <input className="input num" type="number" placeholder="0" value={form.amount} onChange={e => set('amount', e.target.value)} />
              </div>
            </div>
            <div className="field">
              <div className="field-label"><span>Date</span><span className="ur">تاریخ</span></div>
              <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <div className="field-label"><span>Notes</span><span className="ur">نوٹس</span></div>
              <input className="input" placeholder="e.g. Q1 profit distribution" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="row gap-sm" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}><Icon name="check" size={13} /> Record Payment</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Payment History Modal ───────────────────────────────────────────────────

const HistoryModal = ({ partner, onClose, onDeletePayment }) => {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const payments = [...(partner.payments || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const total = payments.reduce((s, p) => s + p.amount, 0);

  const handleDelete = async (pay) => {
    const ok = await confirm({
      title: 'Delete Payment',
      message: 'This payment record will be permanently deleted.',
      detail: `${fmt(pay.amount)} · ${pay.date}`,
      confirmLabel: 'Delete',
    });
    if (ok) onDeletePayment(partner.id, pay.id);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)' }}>
          <div className="row">
            <div style={{ flex: 1 }}>
              <h2 className="h2">{partner.name} · Payment History</h2>
              <div className="small">{payments.length} payment{payments.length !== 1 ? 's' : ''} · Total {fmt(total)}</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)' }}>
              <Icon name="clock" size={24} />
              <div style={{ marginTop: 10 }}>No payments recorded yet.</div>
            </div>
          ) : (
            <div className="glass" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Amount</th><th>Notes</th><th></th></tr>
                  </thead>
                  <tbody>
                    {payments.map(pay => (
                      <tr key={pay.id}>
                        <td>{new Date(pay.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                        <td className="num num-md" style={{ color: 'var(--success)' }}>{fmt(pay.amount)}</td>
                        <td className="small">{pay.notes || '—'}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => handleDelete(pay)}>
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

// ── Partner Card ────────────────────────────────────────────────────────────

const PartnerCard = ({ partner, shareAmount, onEdit, onDelete, onPay, onHistory }) => {
  const totalPaid   = (partner.payments || []).reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, shareAmount - totalPaid);
  const paidPct     = shareAmount > 0 ? Math.min(100, (totalPaid / shareAmount) * 100) : 0;
  const isSettled   = shareAmount > 0 && outstanding === 0;

  return (
    <div className="glass" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{partner.name}</div>
          <div className="row gap-sm">
            <span className="chip">{partner.role}</span>
            <span className="chip warn" style={{ fontWeight: 700 }}>{partner.sharePercent}% share</span>
            {isSettled && <span className="chip" style={{ background: 'rgba(52,211,153,0.15)', color: 'var(--success)', fontWeight: 600 }}>Settled ✓</span>}
          </div>
        </div>
        <div className="row gap-sm">
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} title="Edit" onClick={onEdit}>
            <Icon name="edit" size={13} />
          </button>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} title="Delete" onClick={onDelete}>
            <Icon name="trash" size={13} />
          </button>
        </div>
      </div>

      {/* Amounts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div style={{ background: 'rgba(255,167,38,0.08)', borderRadius: 8, padding: '10px 12px' }}>
          <div className="tiny" style={{ color: 'var(--text-3)', marginBottom: 4 }}>Share Amount</div>
          <div className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--orange-400)' }}>
            {shareAmount > 0 ? fmt(shareAmount) : '—'}
          </div>
        </div>
        <div style={{ background: 'rgba(52,211,153,0.08)', borderRadius: 8, padding: '10px 12px' }}>
          <div className="tiny" style={{ color: 'var(--text-3)', marginBottom: 4 }}>Paid</div>
          <div className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>
            {totalPaid > 0 ? fmt(totalPaid) : '—'}
          </div>
        </div>
        <div style={{ background: outstanding > 0 ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)', borderRadius: 8, padding: '10px 12px' }}>
          <div className="tiny" style={{ color: 'var(--text-3)', marginBottom: 4 }}>Outstanding</div>
          <div className="num" style={{ fontSize: 14, fontWeight: 700, color: outstanding > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {outstanding > 0 ? fmt(outstanding) : '—'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {shareAmount > 0 && (
        <div>
          <div className="bar">
            <span style={{ width: paidPct + '%', background: isSettled ? 'var(--success)' : 'var(--orange-400)' }} />
          </div>
          <div className="tiny" style={{ marginTop: 4, color: 'var(--text-3)' }}>
            {Math.round(paidPct)}% paid · {(partner.payments || []).length} payment{(partner.payments || []).length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Meta */}
      {(partner.phone || partner.joinDate) && (
        <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
          {partner.phone && <span className="tiny" style={{ color: 'var(--text-3)' }}><Icon name="phone" size={11} /> {partner.phone}</span>}
          {partner.joinDate && <span className="tiny" style={{ color: 'var(--text-3)' }}><Icon name="calendar" size={11} /> Joined {new Date(partner.joinDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>}
        </div>
      )}

      {/* Actions */}
      <div className="row gap-sm" style={{ marginTop: 2 }}>
        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={onPay}>
          <Icon name="plus" size={12} /> Pay Now
        </button>
        <button className="btn btn-ghost btn-sm" title="Payment history" onClick={onHistory}>
          <Icon name="clock" size={13} />
        </button>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────

export const PartnersPage = () => {
  const { partners, setPartners, entries, expenses } = useApp();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [filter, setFilter]         = useState('all');
  const [showAdd, setShowAdd]       = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [payTarget, setPayTarget]   = useState(null);
  const [histTarget, setHistTarget] = useState(null);

  const fe   = filterByDate(entries, filter);
  const fexp = filterExpensesByDate(expenses, filter);
  const netProfit   = calcNetProfit(fe, fexp);
  const filterLabel = REPORT_FILTERS.find(f => f.id === filter)?.label || 'All Time';

  const activePartners    = partners.filter(p => p.status !== 'inactive');
  const totalSharePct     = activePartners.reduce((s, p) => s + (p.sharePercent || 0), 0);
  const totalDistributed  = partners.reduce((s, p) => s + (p.payments || []).reduce((ss, pp) => ss + pp.amount, 0), 0);
  const totalOutstanding  = activePartners.reduce((s, p) => {
    const owed = netProfit > 0 ? Math.round(netProfit * (p.sharePercent / 100)) : 0;
    const paid = (p.payments || []).reduce((ss, pp) => ss + pp.amount, 0);
    return s + Math.max(0, owed - paid);
  }, 0);

  const handleAdd    = p  => setPartners(prev => [{ ...p, id: crypto.randomUUID(), status: 'active' }, ...prev]);
  const handleEdit   = up => setPartners(prev => prev.map(p => p.id === up.id ? up : p));
  const handlePay    = (partnerId, payment) =>
    setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, payments: [...(p.payments || []), payment] } : p));
  const handleDelPay = (partnerId, payId) =>
    setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, payments: (p.payments || []).filter(pp => pp.id !== payId) } : p));

  const handleDelete = async (id) => {
    const p = partners.find(x => x.id === id);
    const ok = await confirm({
      title: 'Remove Partner',
      message: 'This partner and all their payment records will be permanently deleted.',
      detail: p ? `${p.name} · ${p.sharePercent}% share` : undefined,
      confirmLabel: 'Remove Partner',
    });
    if (ok) setPartners(prev => prev.filter(x => x.id !== id));
  };

  return (
    <Page titleEn="Partners & Investors" titleUr="شراکت دار و سرمایہ کار" sub="Profit-share tracking · منافع کا حصہ">

      {/* Filter bar */}
      <div className="row gap-sm" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={13} /> Add Partner · نیا شراکت دار
        </button>
        {REPORT_FILTERS.map(f => (
          <span key={f.id} className={`filter-pill ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label} <span className="ur">({f.ur})</span>
          </span>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="glass stat">
          <div className="stat-head">
            <div className={`stat-icon ${netProfit >= 0 ? 'green' : 'red'}`}><Icon name="chart" /></div>
          </div>
          <div className="stat-label"><span className="en">Net Profit</span><span className="ur">خالص منافع</span></div>
          <div className="num num-xl" style={{ color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {netProfit !== 0 ? fmt(Math.abs(netProfit)) : '—'}
          </div>
          <div className="stat-meta">{filterLabel} · {netProfit < 0 ? 'net loss' : 'after expenses'}</div>
        </div>
        <div className="glass stat">
          <div className="stat-head"><div className="stat-icon"><Icon name="users" /></div></div>
          <div className="stat-label"><span className="en">Partners</span><span className="ur">شراکت دار</span></div>
          <div className="num num-xl">{activePartners.length}</div>
          <div className="stat-meta">{totalSharePct.toFixed(1)}% total share allocated</div>
        </div>
        <div className="glass stat">
          <div className="stat-head"><div className="stat-icon green"><Icon name="check" /></div></div>
          <div className="stat-label"><span className="en">Distributed</span><span className="ur">تقسیم شدہ</span></div>
          <div className="num num-xl" style={{ color: 'var(--success)' }}>
            {totalDistributed > 0 ? fmt(totalDistributed) : '—'}
          </div>
          <div className="stat-meta">all-time payments made</div>
        </div>
        <div className="glass stat">
          <div className="stat-head"><div className="stat-icon red"><Icon name="clock" /></div></div>
          <div className="stat-label"><span className="en">Outstanding</span><span className="ur">باقی</span></div>
          <div className="num num-xl" style={{ color: totalOutstanding > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {totalOutstanding > 0 ? fmt(totalOutstanding) : '—'}
          </div>
          <div className="stat-meta">owed for {filterLabel.toLowerCase()}</div>
        </div>
      </div>

      {/* Partners grid */}
      {partners.length === 0 ? (
        <div className="glass" style={{ padding: 56, textAlign: 'center' }}>
          <Icon name="users" size={32} />
          <div style={{ marginTop: 14, fontWeight: 700, fontSize: 18 }}>No partners yet · کوئی شراکت دار نہیں</div>
          <div className="small" style={{ marginTop: 6, color: 'var(--text-3)' }}>
            Add investors or partners to track their profit share automatically.
          </div>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={13} /> Add First Partner
          </button>
        </div>
      ) : (
        <>
          {netProfit <= 0 && (
            <div className="glass" style={{ padding: '12px 18px', marginBottom: 16, borderLeft: '3px solid var(--orange-400)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="bolt" size={15} />
              <span className="small">Net profit is zero or negative for the selected period — partner shares show Rs. 0. Try a different date range.</span>
            </div>
          )}
          <div className="grid-3">
            {partners.map(p => {
              const shareAmt = netProfit > 0 ? Math.round(netProfit * (p.sharePercent / 100)) : 0;
              return (
                <PartnerCard
                  key={p.id}
                  partner={p}
                  shareAmount={shareAmt}
                  onEdit={() => setEditItem(p)}
                  onDelete={() => handleDelete(p.id)}
                  onPay={() => setPayTarget({ partner: p, shareAmt })}
                  onHistory={() => setHistTarget(p.id)}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Modals */}
      {showAdd && (
        <PartnerModal onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}
      {editItem && (
        <PartnerModal data={editItem} onClose={() => setEditItem(null)} onSave={handleEdit} />
      )}
      {payTarget && (
        <PaymentModal
          partner={payTarget.partner}
          shareAmount={payTarget.shareAmt}
          onClose={() => setPayTarget(null)}
          onSave={pay => { handlePay(payTarget.partner.id, pay); setPayTarget(null); }}
        />
      )}
      {histTarget && (() => {
        const p = partners.find(x => x.id === histTarget);
        return p ? (
          <HistoryModal
            partner={p}
            onClose={() => setHistTarget(null)}
            onDeletePayment={handleDelPay}
          />
        ) : null;
      })()}
      {confirmDialog}
    </Page>
  );
};
