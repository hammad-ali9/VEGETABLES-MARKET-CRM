/* global React, Icon, fmt, fmtShort, useApp */
const { useState: useStateO } = React;

// === All Entries ===
const AllEntriesPage = () => {
  const [open, setOpen] = useStateO(null);
  const data = window.MOCK.entries;
  return (
    <Page titleEn="All Entries" titleUr="تمام اندراجات" sub={`${data.length * 18} records · click any row to edit`}>
      <div className="row gap-sm" style={{marginBottom: 16}}>
        <span className="filter-pill active">All <span className="ur">(کل)</span></span>
        <span className="filter-pill">Cleared <span className="ur">(کلیئر)</span></span>
        <span className="filter-pill">Partial <span className="ur">(جزوی)</span></span>
        <span className="filter-pill">Pending <span className="ur">(باقی)</span></span>
        <div style={{flex:1}}/>
        <div className="tb-search" style={{width: 240}}>
          <Icon name="search" size={14}/>
          <input placeholder="Bilty, vehicle, name…"/>
        </div>
        <button className="btn btn-ghost btn-sm"><Icon name="filter" size={13}/> Filters</button>
        <button className="btn btn-ghost btn-sm"><Icon name="download" size={13}/> Export</button>
      </div>

      <div className="glass" style={{padding: 0, overflow:'hidden'}}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Bilty <span className="ur">بلٹی</span></th>
                <th>Date <span className="ur">تاریخ</span></th>
                <th>Vehicle <span className="ur">گاڑی</span></th>
                <th>Supplier <span className="ur">بیوپاری</span></th>
                <th>City <span className="ur">شہر</span></th>
                <th>Crates <span className="ur">کریٹ</span></th>
                <th>Gross <span className="ur">کل رقم</span></th>
                <th>Earned <span className="ur">آمدنی</span></th>
                <th>Buyers <span className="ur">گاہک</span></th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.id} onClick={() => setOpen(r)}>
                  <td className="mono" style={{color:'var(--orange-400)', fontWeight:600}}>{r.id}</td>
                  <td>{new Date(r.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</td>
                  <td className="mono small">{r.vehicle}</td>
                  <td style={{fontWeight:600}}>{r.supplier}</td>
                  <td className="small">{r.city}</td>
                  <td className="num">{r.crates}</td>
                  <td className="num">{fmt(r.gross)}</td>
                  <td className="num" style={{color:'var(--success)'}}>+{fmt(r.laga + r.labour)}</td>
                  <td>
                    <div className="av-stack">
                      {Array.from({length: Math.min(r.customers, 3)}).map((_,i) => <div key={i} className="av" style={{width:24,height:24,fontSize:10}}>{['A','B','C'][i]}</div>)}
                      {r.customers > 3 && <div className="av" style={{width:24,height:24,fontSize:9,background:'var(--bg-elev-2)'}}>+{r.customers-3}</div>}
                    </div>
                  </td>
                  <td>
                    <span className={`chip ${r.status === 'cleared' ? 'success' : r.status === 'partial' ? 'warn' : 'danger'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td><Icon name="eye" size={14}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row between" style={{padding: '14px 18px', borderTop: '1px solid var(--glass-border)'}}>
          <span className="small">Showing 1–{data.length} of {data.length * 18}</span>
          <div className="row gap-sm">
            <button className="btn btn-ghost btn-sm">‹ Prev</button>
            <span className="chip active">1</span>
            <span className="chip">2</span>
            <span className="chip">3</span>
            <span className="chip">…</span>
            <button className="btn btn-ghost btn-sm">Next ›</button>
          </div>
        </div>
      </div>

      {open && <EntryModal data={open} onClose={() => setOpen(null)} />}
    </Page>
  );
};

const EntryModal = ({ data, onClose }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" onClick={e=>e.stopPropagation()}>
      <div style={{padding: 24, borderBottom: '1px solid var(--glass-border)', position:'sticky', top:0, background:'rgba(10,21,53,0.95)', backdropFilter:'blur(20px)', zIndex:1}}>
        <div className="row">
          <div style={{flex:1}}>
            <div className="row gap-sm" style={{marginBottom:4}}>
              <h2 className="h2">Entry {data.id}</h2>
              <span className={`chip ${data.status === 'cleared' ? 'success' : data.status === 'partial' ? 'warn' : 'danger'}`}>{data.status}</span>
            </div>
            <div className="small">{data.supplier} · {data.vehicle} · {data.crates} crates · {new Date(data.date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
          </div>
          <button className="btn btn-ghost btn-sm"><Icon name="print" size={13}/> Print</button>
          <button className="btn btn-secondary btn-sm"><Icon name="edit" size={13}/> Edit</button>
          <button className="btn btn-ghost btn-icon" onClick={onClose} title="Close">✕</button>
        </div>
      </div>
      <div style={{padding: 24}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16, marginBottom: 16}}>
          <div className="glass" style={{padding: 18}}>
            <div className="row between" style={{marginBottom: 12}}>
              <strong style={{color:'var(--orange-400)'}}>Supplier · بیوپاری</strong>
              <span className="chip warn">Side A</span>
            </div>
            <Row k="Trader" v={data.supplier} ur="بیوپاری"/>
            <Row k="City" v={data.city} ur="شہر"/>
            <Row k="Vehicle" v={data.vehicle} ur="گاڑی"/>
            <Row k="Crates" v={data.crates} ur="کریٹ"/>
            <Row k="Gross" v={fmt(data.gross)} ur="کل"/>
            <Row k="Truck Fare" v={'−'+fmt(data.fare)} ur="کرایہ"/>
            <Row k="Labour" v={'−'+fmt(data.labour)} ur="مزدوری"/>
            <Row k="Laga" v={'−'+fmt(data.laga)} ur="لاگا"/>
            <div className="divider"/>
            <Row k="Net Payable" v={fmt(data.gross - data.fare - data.labour - data.laga)} ur="بقایا" highlight/>
          </div>
          <div className="glass" style={{padding: 18}}>
            <div className="row between" style={{marginBottom: 12}}>
              <strong style={{color:'var(--navy-300)'}}>{data.customers} Customers · گاہک</strong>
              <span className="chip info">Side B</span>
            </div>
            {Array.from({length: Math.min(data.customers, 4)}).map((_,i) => (
              <div key={i} style={{padding: '10px 0', borderBottom: i < Math.min(data.customers,4)-1 ? '1px solid rgba(255,255,255,0.05)' : 'none'}}>
                <div className="row">
                  <div className="av">{['A','B','C','D'][i]}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13}}>{['Ahmed Khan','Bashir Sabzi','Zubair Traders','Iqbal & Sons'][i]}</div>
                    <div className="small">{Math.round(data.crates / data.customers)} crates · Rs.{2400+i*50}/crate</div>
                  </div>
                  <div className="num num-md">{fmt(Math.round(data.gross / data.customers))}</div>
                </div>
              </div>
            ))}
            <div className="divider"/>
            <Row k="Total Receivable" v={fmt(data.gross + data.crates * 5 + Math.round(data.gross/13.78))} ur="کل وصول" highlight/>
          </div>
        </div>

        <div className="glass-strong" style={{padding: 20}}>
          <strong style={{color:'var(--success)'}}>Agency Earnings · ایجنسی آمدنی</strong>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 16, marginTop: 12}}>
            <Stat label="Laga" ur="لاگا" v={fmt(data.laga)}/>
            <Stat label="Labour" ur="مزدوری" v={fmt(data.labour)}/>
            <Stat label="Commission" ur="کمیشن" v={fmt(Math.round(data.gross/13.78))}/>
            <Stat label="Wari" ur="نگواری" v={fmt(data.crates*5)}/>
          </div>
        </div>
      </div>
    </div>
  </div>
);
const Row = ({ k, v, ur, highlight }) => (
  <div className="row between" style={{padding: '6px 0', fontSize: 13}}>
    <span style={{color:'var(--text-3)'}}>{k} <span className="ur" style={{fontSize:11,marginLeft:4}}>{ur}</span></span>
    <span className={highlight ? 'num num-md' : 'num'} style={{color: highlight ? 'var(--orange-400)' : 'var(--text-1)'}}>{v}</span>
  </div>
);
const Stat = ({ label, ur, v }) => (
  <div>
    <div className="tiny">{label} · {ur}</div>
    <div className="num num-md" style={{color:'var(--success)', marginTop: 2}}>{v}</div>
  </div>
);

// === Ledger Search ===
const LedgerPage = () => {
  const [q, setQ] = useStateO('Haji Saleem');
  const [tab, setTab] = useStateO('supplier');
  return (
    <Page titleEn="Ledger Search" titleUr="کھاتہ تلاش" sub="Find any trader or customer's full history">
      <div className="glass" style={{padding: 24, marginBottom: 16}}>
        <div className="row gap-sm">
          <div className="tabs">
            <div className={`tab ${tab==='supplier'?'active':''}`} onClick={()=>setTab('supplier')}>Suppliers · بیوپاری</div>
            <div className={`tab ${tab==='customer'?'active':''}`} onClick={()=>setTab('customer')}>Customers · گاہک</div>
          </div>
          <div className="tb-search" style={{flex:1, width: 'auto'}}>
            <Icon name="search" size={16}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Type name, phone, or city…"/>
          </div>
          <button className="btn btn-primary btn-sm"><Icon name="search" size={13}/> Search</button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns: '300px 1fr', gap: 16}}>
        <div className="glass" style={{padding: 0, height: 'fit-content'}}>
          <div style={{padding: '14px 18px', borderBottom:'1px solid var(--glass-border)'}}>
            <strong style={{fontSize: 12, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em'}}>Matches · 6</strong>
          </div>
          {window.MOCK.suppliers.map((s,i) => (
            <div key={s.id} style={{padding: 14, borderBottom: i<5 ?'1px solid rgba(255,255,255,0.04)':'none', cursor:'pointer', background: i===0 ? 'rgba(255,167,38,0.06)':'transparent'}}>
              <div className="row">
                <div className={`av ${i===0?'orange':''}`}>{s.name[0]}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontWeight: 600, fontSize: 13}}>{s.name}</div>
                  <div className="small">{s.city} · {s.phone}</div>
                </div>
              </div>
              <div className="row between" style={{marginTop: 8, fontSize:11}}>
                <span className="tiny">Balance</span>
                <span className="num" style={{color: s.balance < 0 ? 'var(--danger)' : 'var(--success)'}}>{fmtShort(s.balance)}</span>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="glass" style={{padding: 24, marginBottom: 16}}>
            <div className="row between" style={{marginBottom: 16}}>
              <div className="row">
                <div className="av orange" style={{width:48,height:48,fontSize:18}}>H</div>
                <div>
                  <h2 className="h2">Haji Saleem</h2>
                  <div className="small">Quetta · 0301-2345678 · 18 trucks · since Jan 2024</div>
                </div>
              </div>
              <div className="row gap-sm">
                <button className="btn btn-ghost btn-sm"><Icon name="phone" size={13}/> Call</button>
                <button className="btn btn-ghost btn-sm"><Icon name="chat" size={13}/> WhatsApp</button>
                <button className="btn btn-ghost btn-sm"><Icon name="print" size={13}/> Print Ledger</button>
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 16}}>
              <KPI label="Total Supplied" ur="کل سپلائی" v={fmtShort(8420000)}/>
              <KPI label="Active Advance" ur="فعال بیانہ" v={fmtShort(50000)} accent="var(--success)"/>
              <KPI label="Open Balance" ur="بقایا" v={fmtShort(125000)} accent="var(--danger)"/>
              <KPI label="Avg Rate" ur="اوسط ریٹ" v="Rs. 2,387/cr"/>
            </div>
          </div>

          <div className="glass" style={{padding: 0}}>
            <div className="row between" style={{padding: '14px 18px', borderBottom:'1px solid var(--glass-border)'}}>
              <strong>Truck History · ٹرک تاریخ</strong>
              <span className="small">18 entries</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Bilty</th><th>Date</th><th>Vehicle</th><th>Crates</th><th>Rate</th><th>Gross</th><th>Net Paid</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {window.MOCK.entries.filter(e=>e.supplier==='Haji Saleem').concat(window.MOCK.entries.slice(0,3)).map((r,i) => (
                    <tr key={i}>
                      <td className="mono" style={{color:'var(--orange-400)',fontWeight:600}}>{r.id}</td>
                      <td>{new Date(r.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</td>
                      <td className="mono small">{r.vehicle}</td>
                      <td className="num">{r.crates}</td>
                      <td className="num">Rs.{(r.gross/r.crates).toFixed(0)}</td>
                      <td className="num">{fmt(r.gross)}</td>
                      <td className="num" style={{color:'var(--success)'}}>{fmt(r.gross - r.fare - r.labour - r.laga)}</td>
                      <td><span className={`chip ${r.status==='cleared'?'success':r.status==='partial'?'warn':'danger'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

const KPI = ({ label, ur, v, accent }) => (
  <div className="glass-strong" style={{padding: 14}}>
    <div className="row between" style={{alignItems:'baseline'}}>
      <span className="small" style={{fontWeight:600, color:'var(--text-2)'}}>{label}</span>
      <span className="ur small">{ur}</span>
    </div>
    <div className="num num-lg" style={{marginTop: 4, color: accent || 'var(--text-1)'}}>{v}</div>
  </div>
);

window.AllEntriesPage = AllEntriesPage;
window.LedgerPage = LedgerPage;
