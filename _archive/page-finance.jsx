/* global React, Icon, fmt, fmtShort, useApp */
const { useState: useStateB } = React;

// === Advances ===
const AdvancesPage = () => {
  const list = window.MOCK.advances;
  const total = list.reduce((s,a)=>s+a.given,0);
  const remaining = list.reduce((s,a)=>s+a.remaining,0);
  return (
    <Page titleEn="Advance Payments" titleUr="پیشگی ادائیگیاں" sub="Pre-payments to suppliers · auto-deduct on next entry">
      <div className="grid-4" style={{marginBottom: 24}}>
        <div className="glass stat">
          <div className="stat-head"><div className="stat-icon"><Icon name="wallet"/></div><span className="chip warn">4 active</span></div>
          <div className="stat-label"><span className="en">Total Given</span><span className="ur">کل دی گئی</span></div>
          <div className="num num-xl">{fmt(total)}</div>
          <div className="stat-meta">across 4 farmers · 12 month period</div>
        </div>
        <div className="glass stat">
          <div className="stat-head"><div className="stat-icon green"><Icon name="check"/></div></div>
          <div className="stat-label"><span className="en">Recovered</span><span className="ur">واپس آئی</span></div>
          <div className="num num-xl" style={{color:'var(--success)'}}>{fmt(total - remaining)}</div>
          <div className="bar" style={{marginTop: 8}}><span style={{width: ((total-remaining)/total*100)+'%'}}/></div>
        </div>
        <div className="glass stat">
          <div className="stat-head"><div className="stat-icon red"><Icon name="clock"/></div></div>
          <div className="stat-label"><span className="en">Outstanding</span><span className="ur">باقی</span></div>
          <div className="num num-xl" style={{color:'var(--danger)'}}>{fmt(remaining)}</div>
          <div className="stat-meta">avg cycle 22 days</div>
        </div>
        <div className="glass stat" style={{background: 'linear-gradient(135deg, rgba(255,167,38,0.12), rgba(255,167,38,0.02))'}}>
          <div className="stat-head"><div className="stat-icon"><Icon name="bolt"/></div></div>
          <div className="stat-label"><span className="en">Auto-Deduct</span><span className="ur">خودکار کٹوتی</span></div>
          <div className="num num-xl" style={{color:'var(--orange-400)'}}>ON</div>
          <div className="stat-meta">manual override available</div>
        </div>
      </div>

      <div className="row gap-sm" style={{marginBottom: 16}}>
        <button className="btn btn-primary"><Icon name="plus" size={13}/> New Advance · نیا بیانہ</button>
        <span className="filter-pill active">All</span>
        <span className="filter-pill">Active</span>
        <span className="filter-pill">Cleared</span>
        <div style={{flex:1}}/>
        <button className="btn btn-ghost btn-sm"><Icon name="print" size={13}/> Print Sheet</button>
      </div>

      <div className="glass" style={{padding:0}}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Supplier <span className="ur">بیوپاری</span></th>
                <th>Given on <span className="ur">تاریخ</span></th><th>Amount <span className="ur">رقم</span></th>
                <th>Used <span className="ur">استعمال</span></th><th>Remaining <span className="ur">باقی</span></th>
                <th>Progress</th><th>Notes</th><th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(a => (
                <tr key={a.id}>
                  <td className="mono" style={{color:'var(--orange-400)',fontWeight:600}}>{a.id}</td>
                  <td style={{fontWeight:600}}>{a.supplier}</td>
                  <td>{new Date(a.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'})}</td>
                  <td className="num">{fmt(a.given)}</td>
                  <td className="num" style={{color:'var(--text-3)'}}>{fmt(a.used)}</td>
                  <td className="num" style={{color: a.remaining ? 'var(--orange-400)' : 'var(--success)', fontWeight: 600}}>{fmt(a.remaining)}</td>
                  <td style={{width: 140}}>
                    <div className="bar"><span style={{width: (a.used/a.given*100)+'%'}}/></div>
                    <div className="tiny" style={{marginTop: 4}}>{Math.round(a.used/a.given*100)}% used</div>
                  </td>
                  <td className="small">{a.notes}</td>
                  <td><div className="row gap-sm"><Icon name="edit" size={14}/><Icon name="print" size={14}/></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  );
};

// === Expenses ===
const ExpensesPage = () => {
  const [open, setOpen] = useStateB(null);
  const cats = [
    { id: 'labour', en: 'Labour', ur: 'مزدوری', icon: 'users', items: window.MOCK.expenses.labour },
    { id: 'utility', en: 'Utility Bills', ur: 'یوٹیلٹی', icon: 'bolt', items: window.MOCK.expenses.utility },
    { id: 'food', en: 'Food', ur: 'کھانا', icon: 'box', items: window.MOCK.expenses.food },
    { id: 'salary', en: 'Salaries', ur: 'تنخواہیں', icon: 'money', items: window.MOCK.expenses.salary },
    { id: 'rent', en: 'Shop Rent', ur: 'دکان کرایہ', icon: 'receipt', items: window.MOCK.expenses.rent },
    { id: 'parking', en: 'Parking Fees', ur: 'پارکنگ', icon: 'truck', items: window.MOCK.expenses.parking },
    { id: 'other', en: 'Other', ur: 'دیگر', icon: 'sparkle', items: window.MOCK.expenses.other },
  ];
  const total = cats.reduce((s,c) => s + c.items.reduce((ss,i) => ss + i.amount, 0), 0);

  return (
    <Page titleEn="Expenses" titleUr="اخراجات" sub="Click any card to view, add, or delete entries">
      <div className="glass-strong" style={{padding: 24, marginBottom: 24, display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap: 24}}>
        <div>
          <div className="row between" style={{alignItems:'baseline'}}>
            <strong style={{fontSize: 14, color:'var(--text-2)'}}>Total this month</strong>
            <span className="ur small">اس ماہ کے کل اخراجات</span>
          </div>
          <div className="num" style={{fontSize: 44, fontWeight: 800, marginTop: 8}}>{fmt(total)}</div>
          <div className="small" style={{marginTop: 4}}>{cats.reduce((s,c)=>s+c.items.length,0)} entries · April 2026</div>
        </div>
        <KPIm label="Recurring" ur="مستقل" v={fmt(total * 0.74)}/>
        <KPIm label="One-time" ur="ایک بار" v={fmt(total * 0.26)}/>
        <KPIm label="vs Last month" ur="پچھلے سے" v="+8.4%" accent="var(--orange-400)"/>
      </div>

      <div className="grid-4" style={{marginBottom: 24}}>
        {cats.slice(0,4).map(c => <CatCard key={c.id} c={c} onClick={()=>setOpen(c)}/>)}
      </div>
      <div className="grid-3">
        {cats.slice(4).map(c => <CatCard key={c.id} c={c} onClick={()=>setOpen(c)}/>)}
      </div>

      {open && <CatModal cat={open} onClose={()=>setOpen(null)}/>}
    </Page>
  );
};

const CatCard = ({ c, onClick }) => {
  const sum = c.items.reduce((s,i)=>s+i.amount,0);
  return (
    <div className="glass stat" style={{cursor:'pointer'}} onClick={onClick}>
      <div className="stat-head">
        <div className="stat-icon"><Icon name={c.icon}/></div>
        <button className="btn btn-ghost btn-sm" style={{padding:'4px 8px'}} onClick={(e)=>{e.stopPropagation();}}><Icon name="plus" size={12}/></button>
      </div>
      <div className="stat-label">
        <span className="en">{c.en}</span>
        <span className="ur">{c.ur}</span>
      </div>
      <div className="num num-xl">{fmt(sum)}</div>
      <div className="row between" style={{fontSize: 11}}>
        <span className="tiny">{c.items.length} entries</span>
        <span style={{color:'var(--orange-400)', fontWeight: 600}}>View →</span>
      </div>
    </div>
  );
};

const CatModal = ({ cat, onClose }) => {
  const sum = cat.items.reduce((s,i)=>s+i.amount,0);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{maxWidth: 880}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:24, borderBottom:'1px solid var(--glass-border)', position:'sticky', top:0, background:'rgba(10,21,53,0.95)', backdropFilter:'blur(20px)'}}>
          <div className="row">
            <div className="stat-icon"><Icon name={cat.icon}/></div>
            <div style={{flex:1}}>
              <h2 className="h2">{cat.en} <span className="ur" style={{fontSize:16,color:'var(--text-3)',marginLeft:8}}>{cat.ur}</span></h2>
              <div className="small">{cat.items.length} entries · Total {fmt(sum)}</div>
            </div>
            <button className="btn btn-primary btn-sm"><Icon name="plus" size={13}/> Add Entry</button>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{padding: 24}}>
          <div className="glass" style={{padding:0}}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Item</th><th>Period</th><th>Date</th><th>Amount</th><th></th></tr>
                </thead>
                <tbody>
                  {cat.items.map(it => (
                    <tr key={it.id}>
                      <td>
                        <div style={{fontWeight:600}}>{it.name}</div>
                        {it.role && <div className="small">{it.role}</div>}
                      </td>
                      <td><span className="chip">{it.period}</span></td>
                      <td>{new Date(it.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</td>
                      <td className="num num-md">{fmt(it.amount)}</td>
                      <td><div className="row gap-sm"><Icon name="edit" size={14}/><Icon name="trash" size={14} className="text-danger"/></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPIm = ({ label, ur, v, accent }) => (
  <div>
    <div className="row between" style={{alignItems:'baseline'}}>
      <span className="small" style={{fontWeight:600, color:'var(--text-2)'}}>{label}</span>
      <span className="ur small">{ur}</span>
    </div>
    <div className="num num-lg" style={{marginTop: 4, color: accent || 'var(--text-1)'}}>{v}</div>
  </div>
);

// === Reports / Profit ===
const ReportsPage = () => {
  return (
    <Page titleEn="Profit & Reports" titleUr="منافع و رپورٹ" sub="How the agency earns — month by month">
      <div className="row gap-sm" style={{marginBottom: 16}}>
        <span className="filter-pill active">This Month</span>
        <span className="filter-pill">Last 3 Months</span>
        <span className="filter-pill">YTD</span>
        <span className="filter-pill">Custom</span>
        <div style={{flex:1}}/>
        <button className="btn btn-ghost btn-sm"><Icon name="download" size={13}/> Export PDF</button>
        <button className="btn btn-ghost btn-sm"><Icon name="print" size={13}/> Print</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 24}}>
        <div className="glass" style={{padding: 24}}>
          <div className="section-head"><div><h2>Profit Composition</h2><span className="ur">منافع کی تشکیل</span></div></div>
          <ProfitWaterfall/>
        </div>
        <div className="glass" style={{padding: 24}}>
          <div className="section-head"><div><h2>Revenue Streams</h2><span className="ur">آمدنی ذرائع</span></div></div>
          <Donut/>
        </div>
      </div>

      <div className="glass" style={{padding: 24}}>
        <div className="section-head">
          <div><h2>Monthly P&L · ماہانہ تفصیل</h2></div>
          <div className="tabs"><div className="tab active">Net</div><div className="tab">Gross</div><div className="tab">By Category</div></div>
        </div>
        <div className="table-wrap" style={{marginTop: 12}}>
          <table className="table">
            <thead>
              <tr><th>Month</th><th>Crates</th><th>Laga</th><th>Labour</th><th>Commission</th><th>Wari</th><th>Market</th><th>Gross Earnings</th><th>Expenses</th><th>Net Profit</th></tr>
            </thead>
            <tbody>
              {[
                ['Apr 2026', 12480, 124800, 124800, 152400, 62400, 35000, 499400, 336620, 162780],
                ['Mar 2026', 11200, 112000, 112000, 138900, 56000, 32000, 450900, 312400, 138500],
                ['Feb 2026', 9800, 98000, 98000, 119600, 49000, 28000, 392600, 285200, 107400],
                ['Jan 2026', 8400, 84000, 84000, 102100, 42000, 24000, 336100, 268700, 67400],
                ['Dec 2025', 7200, 72000, 72000, 87800, 36000, 22000, 289800, 245100, 44700],
              ].map((r,i) => (
                <tr key={i} style={i===0 ? {background:'rgba(255,167,38,0.04)'} : {}}>
                  <td style={{fontWeight:600}}>{r[0]} {i===0 && <span className="chip active" style={{marginLeft:6}}>Current</span>}</td>
                  <td className="num">{r[1].toLocaleString()}</td>
                  <td className="num">{fmt(r[2])}</td>
                  <td className="num">{fmt(r[3])}</td>
                  <td className="num">{fmt(r[4])}</td>
                  <td className="num">{fmt(r[5])}</td>
                  <td className="num">{fmt(r[6])}</td>
                  <td className="num" style={{color:'var(--success)'}}>{fmt(r[7])}</td>
                  <td className="num" style={{color:'var(--danger)'}}>−{fmt(r[8])}</td>
                  <td className="num num-md" style={{color:'var(--orange-400)', fontWeight:700}}>{fmt(r[9])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  );
};

const ProfitWaterfall = () => {
  const items = [
    { label: 'Laga', ur: 'لاگا', v: 124800, color: '#ffa726' },
    { label: 'Labour', ur: 'مزدوری', v: 124800, color: '#ffb84d' },
    { label: 'Commission', ur: 'کمیشن', v: 152400, color: '#ffcc80' },
    { label: 'Wari', ur: 'نگواری', v: 62400, color: '#ff8c42' },
    { label: 'Market', ur: 'مارکیٹ', v: 35000, color: '#d97706' },
    { label: 'Expenses', ur: 'اخراجات', v: -336620, color: '#f87171' },
    { label: 'Net', ur: 'خالص', v: 162780, color: '#34d399' },
  ];
  const max = Math.max(...items.map(i=>Math.abs(i.v)));
  return (
    <div style={{marginTop: 18}}>
      {items.map((it,i) => (
        <div key={i} style={{marginBottom: 12}}>
          <div className="row between" style={{marginBottom: 4, fontSize: 12}}>
            <span style={{fontWeight:600}}>{it.label} <span className="ur small">{it.ur}</span></span>
            <span className="num num-md" style={{color: it.color}}>{it.v < 0 ? '−':'+'}{fmt(Math.abs(it.v))}</span>
          </div>
          <div className="bar" style={{height: 8}}>
            <span style={{width: (Math.abs(it.v)/max*100)+'%', background: it.color}}/>
          </div>
        </div>
      ))}
    </div>
  );
};

const Donut = () => {
  const data = [
    { label: 'Commission', v: 31, color: '#ffa726' },
    { label: 'Laga', v: 25, color: '#5b7de0' },
    { label: 'Labour', v: 25, color: '#34d399' },
    { label: 'Wari', v: 12, color: '#f87171' },
    { label: 'Market', v: 7, color: '#a78bfa' },
  ];
  let acc = 0;
  const r = 70, c = 2 * Math.PI * r;
  return (
    <div className="row" style={{marginTop: 18, alignItems: 'center', gap: 24}}>
      <svg viewBox="0 0 200 200" style={{width: 180, height: 180}}>
        <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="22"/>
        {data.map((d,i) => {
          const dash = (d.v/100) * c;
          const off = c * (1 - acc/100);
          acc += d.v;
          return <circle key={i} cx="100" cy="100" r={r} fill="none" stroke={d.color} strokeWidth="22" strokeDasharray={`${dash} ${c}`} strokeDashoffset={-((acc - d.v)/100)*c} transform="rotate(-90 100 100)"/>;
        })}
        <text x="100" y="96" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.5)">Total</text>
        <text x="100" y="116" textAnchor="middle" fontSize="20" fontWeight="700" fill="white" fontFamily="JetBrains Mono">499k</text>
      </svg>
      <div style={{flex:1}}>
        {data.map(d => (
          <div key={d.label} className="row between" style={{padding:'6px 0', fontSize: 12.5}}>
            <span className="row gap-sm"><span style={{width:10,height:10,background:d.color,borderRadius:2}}/>{d.label}</span>
            <span className="num">{d.v}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

window.AdvancesPage = AdvancesPage;
window.ExpensesPage = ExpensesPage;
window.ReportsPage = ReportsPage;
