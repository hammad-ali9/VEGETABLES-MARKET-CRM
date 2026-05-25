import { useState, useMemo } from 'react';
import { Icon } from '../components/ui/Icon';
import { Page } from '../components/layout/Page';
import { fmt, fmtShort } from '../utils/format';
import { useApp } from '../context/AppContext';

const StatCard = ({ icon, iconClass, en, ur, value, sub, trend, trendDir }) => (
  <div className="glass stat">
    <div className="stat-head">
      <div className={`stat-icon ${iconClass || ''}`}><Icon name={icon} size={18} /></div>
      {trend && <span className={`stat-trend ${trendDir || 'up'}`}>{trendDir === 'down' ? '↓' : '↑'} {trend}</span>}
    </div>
    <div>
      <div className="stat-label">
        <span className="en">{en}</span>
        <span className="ur">{ur}</span>
      </div>
      <div className="num num-xl" style={{ marginTop: 6 }}>{value}</div>
      {sub && <div className="stat-meta" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  </div>
);

const ExpenseCard = ({ icon, en, ur, value, count, share, onClick }) => (
  <div className="glass stat" onClick={onClick} style={{ cursor: 'pointer' }}>
    <div className="stat-head">
      <div className="stat-icon"><Icon name={icon} size={18} /></div>
      <span className="chip">{share}%</span>
    </div>
    <div>
      <div className="stat-label">
        <span className="en">{en}</span>
        <span className="ur">{ur}</span>
      </div>
      <div className="num num-lg" style={{ marginTop: 6 }}>{fmt(value)}</div>
      <div className="stat-meta" style={{ marginTop: 4 }}>{count}</div>
    </div>
    <div className="bar"><span style={{ width: share + '%' }} /></div>
  </div>
);

const EmptyState = ({ icon = 'list', message, action, onAction }) => (
  <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-3)' }}>
    <Icon name={icon} size={28} />
    <div style={{ marginTop: 10, fontSize: 14, color: 'var(--text-2)' }}>{message}</div>
    {action && onAction && (
      <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={onAction}>{action}</button>
    )}
  </div>
);

const TopList = ({ items }) => {
  if (!items.length) return <EmptyState icon="truck" message="No entries yet" />;
  return (
    <div className="col gap-sm" style={{ marginTop: 12 }}>
      {items.map((it, i) => (
        <div key={i} className="row" style={{ padding: '10px 4px', borderBottom: i < items.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
          <div className="av orange">{it.av}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{it.name}</div>
            <div className="small">{it.city}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="num num-md">{fmt(it.value)}</div>
            <div className="bar" style={{ width: 80, marginTop: 4 }}><span style={{ width: it.share + '%' }} /></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const RecentEntriesTable = ({ entries }) => {
  const { go } = useApp();
  if (!entries.length) {
    return (
      <EmptyState
        icon="plus"
        message="No entries recorded yet."
        action="Add first entry"
        onAction={() => go('new-entry')}
      />
    );
  }
  return (
    <div className="table-wrap" style={{ marginTop: 12 }}>
      <table className="table">
        <thead>
          <tr>
            <th>Bilty <span className="ur">بلٹی</span></th>
            <th>Date <span className="ur">تاریخ</span></th>
            <th>Supplier <span className="ur">بیوپاری</span></th>
            <th>Crates <span className="ur">کریٹ</span></th>
            <th>Gross <span className="ur">کل</span></th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.slice(0, 6).map(r => (
            <tr key={r.id} onClick={() => go('all-entries')}>
              <td className="mono" style={{ color: 'var(--orange-400)', fontWeight: 600 }}>{r.id}</td>
              <td>{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
              <td>
                <div style={{ fontWeight: 600 }}>{r.supplier}</div>
                <div className="small">{r.city}</div>
              </td>
              <td className="num">{r.crates}</td>
              <td className="num">{fmt(r.gross)}</td>
              <td>
                <span className={`chip ${r.status === 'cleared' ? 'success' : r.status === 'partial' ? 'warn' : 'danger'}`}>
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const filtersByDate = (entries, active) => {
  if (active === 'all') return entries;
  const now = new Date();
  const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sow = new Date(sod); sow.setDate(sod.getDate() - sod.getDay());
  const som = new Date(now.getFullYear(), now.getMonth(), 1);
  return entries.filter(e => {
    const d = new Date(e.date);
    if (active === 'today') return d >= sod;
    if (active === 'week')  return d >= sow;
    if (active === 'month') return d >= som;
    return true;
  });
};

export const DashboardPage = () => {
  const { go, entries, expenses, advances } = useApp();
  const filters = [
    { id: 'all',   en: 'All Time',    ur: 'کل وقت' },
    { id: 'month', en: 'This Month',  ur: 'اس ماہ' },
    { id: 'week',  en: 'This Week',   ur: 'اس ہفتہ' },
    { id: 'today', en: 'Today',       ur: 'آج' },
  ];
  const [active, setActive] = useState('all');

  const fe = useMemo(() => filtersByDate(entries, active), [entries, active]);

  const totalSales = fe.reduce((s, e) => s + (e.gross || 0), 0);
  const totalRevenue = fe.reduce((s, e) =>
    s + (e.laga || 0) + (e.labour || 0)
      + (e.commission !== undefined ? e.commission : Math.round((e.gross || 0) / 13.78))
      + (e.wari !== undefined ? e.wari : (e.crates || 0) * 5), 0);

  const allExpenseItems = Object.values(expenses).flat();
  const totalExpenses = allExpenseItems.reduce((s, i) => s + (i.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const supplierPayables = fe
    .filter(e => e.status !== 'cleared')
    .reduce((s, e) => s + Math.max(0,
      e.balance !== undefined
        ? e.balance
        : (e.gross || 0) - (e.laga || 0) - (e.labour || 0) - (e.fare || 0) - (e.advance || 0) - (e.bardana || 0)
    ), 0);

  const customerReceivables = fe.reduce((s, e) =>
    s + (e.custRemaining !== undefined
      ? e.custRemaining
      : (e.gross || 0) + (e.crates || 0) * 5 + Math.round((e.gross || 0) / 13.78)), 0);

  const activeAdvancesTotal = advances.reduce((s, a) => s + (a.remaining || 0), 0);
  const activeAdvancesCount = advances.filter(a => (a.remaining || 0) > 0).length;

  const supplierMap = {};
  fe.forEach(e => {
    if (!supplierMap[e.supplier]) supplierMap[e.supplier] = { name: e.supplier, city: e.city || '', value: 0 };
    supplierMap[e.supplier].value += (e.gross || 0);
  });
  const topSuppliers = Object.values(supplierMap).sort((a, b) => b.value - a.value).slice(0, 5);
  const maxVal = topSuppliers[0]?.value || 1;
  const topSuppliersFormatted = topSuppliers.map(s => ({ ...s, share: Math.round(s.value / maxVal * 100), av: s.name[0] }));

  const labourTotal = (expenses.labour || []).reduce((s, i) => s + i.amount, 0);
  const utilityTotal = (expenses.utility || []).reduce((s, i) => s + i.amount, 0);
  const rentTotal = (expenses.rent || []).reduce((s, i) => s + i.amount, 0);
  const salaryTotal = (expenses.salary || []).reduce((s, i) => s + i.amount, 0);

  const v = n => n > 0 ? fmt(n) : '—';
  const hasData = entries.length > 0 || allExpenseItems.length > 0;
  const label = filters.find(f => f.id === active)?.en || 'All Time';

  return (
    <Page
      titleEn="Dashboard"
      titleUr="ڈیش بورڈ"
      sub={`${fe.length} entr${fe.length !== 1 ? 'ies' : 'y'} · ${label} · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
    >
      <div className="filter-row" style={{ marginBottom: 24 }}>
        {filters.map(f => (
          <div key={f.id} className={`filter-pill ${active === f.id ? 'active' : ''}`} onClick={() => setActive(f.id)}>
            {f.en} <span className="ur">({f.ur})</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={() => window.print()}><Icon name="print" size={13} /> Print</button>
      </div>

      {!hasData && (
        <div className="glass" style={{ padding: 48, textAlign: 'center', marginBottom: 32 }}>
          <Icon name="truck" size={44} />
          <div style={{ marginTop: 18, fontWeight: 700, fontSize: 20 }}>Ready to start</div>
          <div className="small" style={{ marginTop: 8, maxWidth: 420, margin: '8px auto 0', lineHeight: 1.6 }}>
            Add your first truck entry to see sales, profit, receivables, and more.
          </div>
          <div className="row gap-sm" style={{ justifyContent: 'center', marginTop: 24 }}>
            <button className="btn btn-primary" onClick={() => go('new-entry')}><Icon name="plus" size={14} /> New Entry</button>
            <button className="btn btn-ghost" onClick={() => go('expenses')}><Icon name="receipt" size={14} /> Log Expenses</button>
          </div>
        </div>
      )}

      <div className="section-head">
        <div><h2>Sales Overview</h2><span className="ur">فروخت کا جائزہ</span></div>
        <span className="en-sub">Live · {label}</span>
      </div>
      <div className="grid-4" style={{ marginBottom: 32 }}>
        <StatCard icon="trend" en="Total Sales" ur="کل فروخت" value={v(totalSales)} sub={`${fe.length} truck${fe.length !== 1 ? 's' : ''} recorded`} />
        <StatCard icon="money" iconClass="green" en="Total Revenue" ur="آمدنی" value={v(totalRevenue)} sub="Laga + Labour + Commission + Wari" />
        <StatCard icon="receipt" en="Total Expenses" ur="کل اخراجات" value={v(totalExpenses)} sub={`${allExpenseItems.length} entries logged`} />
        <StatCard icon="chart" en="Net Profit" ur="خالص منافع" value={v(Math.abs(netProfit))} sub={netProfit < 0 ? 'Net loss' : 'After all expenses'} trendDir={netProfit < 0 ? 'down' : 'up'} />
      </div>

      <div className="section-head">
        <div><h2>Receivables & Payables</h2><span className="ur">واجبات و قرضہ جات</span></div>
        <a className="small" style={{ color: 'var(--orange-400)', cursor: 'pointer' }} onClick={() => go('ledger')}>View ledger →</a>
      </div>
      <div className="grid-4" style={{ marginBottom: 32 }}>
        <StatCard icon="wallet" iconClass="red" en="Owed to Suppliers" ur="بیوپاریوں کو ادا کرنا" value={v(supplierPayables)} sub={`${fe.filter(e => e.status !== 'cleared').length} unpaid entries`} />
        <StatCard icon="users" iconClass="green" en="Customer Receivables" ur="گاہکوں سے وصول" value={v(customerReceivables)} sub={`${fe.length} entries`} />
        <StatCard icon="wallet" iconClass="blue" en="Active Advances" ur="پیشگی رقم" value={v(activeAdvancesTotal)} sub={`${activeAdvancesCount} active advance${activeAdvancesCount !== 1 ? 's' : ''}`} />
        <StatCard icon="dashboard" en="Today's Entries" ur="آج کے اندراجات" value={filtersByDate(entries, 'today').length || '—'} sub="Truck entries recorded today" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 32 }} className="dash-main-grid">
        <div className="glass" style={{ padding: 24, minWidth: 0, overflow: 'hidden' }}>
          <div className="section-head">
            <div><h2>Recent Entries</h2><span className="ur">حالیہ اندراجات</span></div>
            {entries.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => go('all-entries')}>View all <Icon name="arrow" size={12} /></button>
            )}
          </div>
          <RecentEntriesTable entries={fe} />
        </div>
        <div className="glass" style={{ padding: 24, minWidth: 0 }}>
          <div className="section-head"><div><h2>Top Suppliers</h2><span className="ur">سرفہرست بیوپاری</span></div></div>
          <TopList items={topSuppliersFormatted} />
        </div>
      </div>

      {allExpenseItems.length > 0 && (
        <>
          <div className="section-head">
            <div><h2>Expenses Overview</h2><span className="ur">اخراجات کا جائزہ</span></div>
            <a className="small" style={{ color: 'var(--orange-400)', cursor: 'pointer' }} onClick={() => go('expenses')}>Manage →</a>
          </div>
          <div className="grid-4" style={{ marginBottom: 32 }}>
            <ExpenseCard icon="users" en="Labour" ur="مزدوری" value={labourTotal} count={`${(expenses.labour || []).length} entries`} share={Math.round(labourTotal / Math.max(totalExpenses, 1) * 100)} onClick={() => go('expenses')} />
            <ExpenseCard icon="bolt" en="Utility Bills" ur="یوٹیلٹی" value={utilityTotal} count={`${(expenses.utility || []).length} entries`} share={Math.round(utilityTotal / Math.max(totalExpenses, 1) * 100)} onClick={() => go('expenses')} />
            <ExpenseCard icon="receipt" en="Shop Rent" ur="دکان کرایہ" value={rentTotal} count={`${(expenses.rent || []).length} entries`} share={Math.round(rentTotal / Math.max(totalExpenses, 1) * 100)} onClick={() => go('expenses')} />
            <ExpenseCard icon="money" en="Salaries" ur="تنخواہیں" value={salaryTotal} count={`${(expenses.salary || []).length} entries`} share={Math.round(salaryTotal / Math.max(totalExpenses, 1) * 100)} onClick={() => go('expenses')} />
          </div>
        </>
      )}
    </Page>
  );
};
