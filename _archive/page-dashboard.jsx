/* global React, Icon, fmt, fmtShort, useApp */
const { useState: useStateD } = React;

// === Mini Sparkline ===
const Spark = ({ data, color = 'var(--orange-500)', height = 36 }) => {
  const w = 120, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="spark" style={{height}}>
      <defs>
        <linearGradient id={`gr-${color.replace(/\W/g,'')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#gr-${color.replace(/\W/g,'')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" />
    </svg>
  );
};

const StatCard = ({ icon, iconClass, en, ur, value, sub, trend, trendDir, spark, sparkColor }) => (
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
      <div className="num num-xl" style={{marginTop: 6}}>{value}</div>
      {sub && <div className="stat-meta" style={{marginTop: 4}}>{sub}</div>}
    </div>
    {spark && <Spark data={spark} color={sparkColor || 'var(--orange-500)'} />}
  </div>
);

// === Dashboard ===
const DashboardPage = () => {
  const { go } = useApp();
  const filters = [
    { id: 'all', en: 'All Time', ur: 'کل وقت' },
    { id: 'month', en: 'This Month', ur: 'اس ماہ' },
    { id: 'week', en: 'This Week', ur: 'اس ہفتہ' },
    { id: 'today', en: 'Today', ur: 'آج' },
    { id: 'custom', en: 'Custom', ur: 'مخصوص' },
  ];
  const [active, setActive] = useStateD('month');

  return (
    <Page titleEn="Dashboard Overview" titleUr="ڈیش بورڈ — آج کا منظر" sub="Welcome back, Khalid · 2026 mandi season">
      {/* Filter row */}
      <div className="filter-row" style={{marginBottom: 24}}>
        {filters.map(f => (
          <div key={f.id} className={`filter-pill ${active === f.id ? 'active' : ''}`} onClick={() => setActive(f.id)}>
            {f.en} <span className="ur">({f.ur})</span>
          </div>
        ))}
        <div style={{flex: 1}} />
        <button className="btn btn-ghost btn-sm"><Icon name="download" size={13}/> Export</button>
        <button className="btn btn-ghost btn-sm"><Icon name="print" size={13}/> Print</button>
      </div>

      {/* Headline KPIs */}
      <div className="section-head">
        <div>
          <h2>Sales Overview</h2>
          <span className="ur">فروخت کا جائزہ</span>
        </div>
        <span className="en-sub">Live · {new Date().toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})}</span>
      </div>
      <div className="grid-4" style={{marginBottom: 32}}>
        <StatCard icon="trend" iconClass="" en="Total Sales" ur="کل فروخت"
          value={fmtShort(5632010)} sub="Gross goods value · 142 trucks"
          trend="+12.4%" trendDir="up" spark={[40,48,52,49,68,72,80,76,92,88,98,108]} />
        <StatCard icon="truck" iconClass="blue" en="Total Purchases" ur="کل خریداری"
          value={fmtShort(3097275)} sub="From 38 suppliers this period"
          trend="+8.1%" trendDir="up" spark={[20,28,32,29,38,36,42,40,52,48,58,64]} sparkColor="var(--navy-300)" />
        <StatCard icon="money" iconClass="green" en="Total Revenue" ur="آمدنی"
          value={fmtShort(591574)} sub="Laga + Wari + Commission + Labour"
          trend="+4.6%" trendDir="up" spark={[12,14,18,16,22,20,28,26,32,30,38,42]} sparkColor="var(--success)" />
        <StatCard icon="chart" iconClass="" en="Net Profit" ur="خالص منافع"
          value={fmtShort(162679)} sub="After expenses & owner shares"
          trend="-2.3%" trendDir="down" spark={[18,22,28,24,32,28,34,30,38,34,40,38]} sparkColor="var(--orange-500)" />
      </div>

      {/* Balances */}
      <div className="section-head">
        <div>
          <h2>Receivables & Payables</h2>
          <span className="ur">واجبات و قرضہ جات</span>
        </div>
        <a className="small" style={{color:'var(--orange-400)', cursor:'pointer'}} onClick={() => go('ledger')}>View ledger →</a>
      </div>
      <div className="grid-4" style={{marginBottom: 32}}>
        <StatCard icon="wallet" iconClass="red" en="Owed to Suppliers" ur="بیوپاریوں کو ادا کرنا"
          value={fmtShort(2002725)} sub="36 open suppliers · 14 cleared today" trend="6 NEW" trendDir="up" />
        <StatCard icon="users" iconClass="green" en="Customer Receivables" ur="گاہکوں سے وصول"
          value={fmtShort(2055903)} sub="42 customers · 8 overdue" trend="+11.2%" trendDir="up" />
        <StatCard icon="wallet" iconClass="blue" en="Active Advances" ur="پیشگی رقم"
          value={fmtShort(85000)} sub="4 farmers · auto-deduction on" />
        <StatCard icon="receipt" iconClass="" en="Today's Cash" ur="آج کی نقدی"
          value={fmtShort(348750)} sub="Cash: Rs.198k · Credit: Rs.150k" />
      </div>

      {/* Two-col: chart + activity */}
      <div style={{display:'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 32}}>
        <div className="glass" style={{padding: 24}}>
          <div className="section-head">
            <div>
              <h2>Daily Throughput</h2>
              <span className="ur">روزانہ کی کاروبار</span>
            </div>
            <div className="tabs">
              <div className="tab active">Sales</div>
              <div className="tab">Crates</div>
              <div className="tab">Trucks</div>
            </div>
          </div>
          <BigChart />
        </div>
        <div className="glass" style={{padding: 24}}>
          <div className="section-head">
            <div>
              <h2>Top Suppliers</h2>
              <span className="ur">سرفہرست بیوپاری</span>
            </div>
          </div>
          <TopList items={[
            { name: 'Haji Saleem', city: 'Quetta', value: 768000, share: 92, av: 'H' },
            { name: 'Muhammad Aslam', city: 'Pishin', value: 942500, share: 100, av: 'M' },
            { name: 'Wali Khan', city: 'Mastung', value: 672000, share: 80, av: 'W' },
            { name: 'Sher Ali', city: 'Khuzdar', value: 805000, share: 86, av: 'S' },
            { name: 'Ghulam Rasool', city: 'Kalat', value: 696000, share: 74, av: 'G' },
          ]} />
        </div>
      </div>

      {/* Expenses Overview */}
      <div className="section-head">
        <div>
          <h2>Expenses Overview</h2>
          <span className="ur">اخراجات کا جائزہ</span>
        </div>
        <a className="small" style={{color:'var(--orange-400)', cursor:'pointer'}} onClick={() => go('expenses')}>Manage expenses →</a>
      </div>
      <div className="grid-4" style={{marginBottom: 32}}>
        <ExpenseCard icon="users" en="Labour" ur="مزدوری" value={103000} count="4 active workers" share={32} onClick={() => go('expenses')} />
        <ExpenseCard icon="bolt" en="Utility Bills" ur="یوٹیلٹی" value={26920} count="3 bills · April" share={8} onClick={() => go('expenses')} />
        <ExpenseCard icon="receipt" en="Shop Rent" ur="دکان کرایہ" value={75000} count="Mandi unit B-12" share={23} onClick={() => go('expenses')} />
        <ExpenseCard icon="money" en="Salaries" ur="تنخواہیں" value={110000} count="2 staff · monthly" share={34} onClick={() => go('expenses')} />
      </div>

      {/* Recent Entries Table */}
      <div className="glass" style={{padding: 24, marginBottom: 32}}>
        <div className="section-head">
          <div>
            <h2>Recent Entries</h2>
            <span className="ur">حالیہ اندراجات</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => go('all-entries')}>View all <Icon name="arrow" size={12}/></button>
        </div>
        <RecentEntriesTable />
      </div>

      {/* Marketing snapshot */}
      <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
        <div className="glass" style={{padding: 24}}>
          <div className="section-head">
            <div>
              <h2>WhatsApp Outreach</h2>
              <span className="ur">واٹس ایپ مہم</span>
            </div>
            <span className="chip success"><span className="live-dot"/>Active</span>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 16, marginTop: 8}}>
            <Mini label="Sent" ur="بھیجے" value="2,508" sub="last 30 days" />
            <Mini label="Read" ur="پڑھے" value="1,952" sub="77.8% read rate" />
            <Mini label="Replied" ur="جواب" value="172" sub="6.9% reply rate" />
          </div>
          <div className="bar" style={{marginTop: 18}}><span style={{width:'77.8%'}}/></div>
          <div className="row between small" style={{marginTop: 8}}>
            <span>Outreach progress</span>
            <span>1,952 / 2,508</span>
          </div>
        </div>
        <div className="glass" style={{padding: 24}}>
          <div className="section-head">
            <div>
              <h2>Today's Activity</h2>
              <span className="ur">آج کی سرگرمی</span>
            </div>
          </div>
          <ActivityFeed />
        </div>
      </div>
    </Page>
  );
};

const ExpenseCard = ({ icon, en, ur, value, count, share, onClick }) => (
  <div className="glass stat" onClick={onClick} style={{cursor:'pointer'}}>
    <div className="stat-head">
      <div className="stat-icon"><Icon name={icon} size={18}/></div>
      <span className="chip">{share}%</span>
    </div>
    <div>
      <div className="stat-label">
        <span className="en">{en}</span>
        <span className="ur">{ur}</span>
      </div>
      <div className="num num-lg" style={{marginTop: 6}}>{fmt(value)}</div>
      <div className="stat-meta" style={{marginTop: 4}}>{count}</div>
    </div>
    <div className="bar"><span style={{width: share + '%'}}/></div>
  </div>
);

const Mini = ({ label, ur, value, sub }) => (
  <div>
    <div className="row between" style={{alignItems:'baseline'}}>
      <span className="small" style={{fontWeight:600,color:'var(--text-2)'}}>{label}</span>
      <span className="ur small">{ur}</span>
    </div>
    <div className="num num-lg" style={{marginTop: 4}}>{value}</div>
    <div className="tiny" style={{marginTop: 2}}>{sub}</div>
  </div>
);

// === Big Chart (multi-series area) ===
const BigChart = () => {
  const days = ['1','3','5','7','9','11','13','15','17','19','21','23','25'];
  const sales = [180,220,210,260,310,290,340,380,360,420,470,440,512];
  const purch = [120,150,140,180,220,200,250,280,260,310,350,330,380];
  const w = 720, h = 220, p = 30;
  const max = Math.max(...sales);
  const x = i => p + (i / (sales.length - 1)) * (w - p * 2);
  const y = v => h - p - (v / max) * (h - p * 2);
  const lineSales = sales.map((v,i) => `${i?'L':'M'}${x(i)},${y(v)}`).join(' ');
  const linePurch = purch.map((v,i) => `${i?'L':'M'}${x(i)},${y(v)}`).join(' ');
  const areaSales = `M${x(0)},${h-p} ${sales.map((v,i) => `L${x(i)},${y(v)}`).join(' ')} L${x(sales.length-1)},${h-p}Z`;

  return (
    <div style={{position:'relative', marginTop: 16}}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%', height: 220}} preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffa726" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#ffa726" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0,1,2,3].map(i => (
          <line key={i} x1={p} x2={w-p} y1={p + i*(h-p*2)/3} y2={p + i*(h-p*2)/3} stroke="rgba(255,255,255,0.04)" />
        ))}
        <path d={areaSales} fill="url(#gradSales)"/>
        <path d={lineSales} stroke="#ffa726" strokeWidth="2.5" fill="none"/>
        <path d={linePurch} stroke="#5b7de0" strokeWidth="2" fill="none" strokeDasharray="3 4"/>
        {sales.map((v,i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#0a1535" stroke="#ffa726" strokeWidth="1.8"/>
        ))}
        {days.map((d,i) => (
          <text key={i} x={x(i)} y={h-8} fontSize="10" fill="rgba(255,255,255,0.4)" textAnchor="middle" fontFamily="JetBrains Mono">{d}</text>
        ))}
      </svg>
      <div style={{display:'flex', gap: 16, marginTop: 12}}>
        <span className="row gap-sm small"><span style={{width:10,height:10,borderRadius:2,background:'#ffa726'}}/>Sales · فروخت</span>
        <span className="row gap-sm small"><span style={{width:10,height:10,borderRadius:2,background:'#5b7de0'}}/>Purchases · خریداری</span>
      </div>
    </div>
  );
};

const TopList = ({ items }) => (
  <div className="col gap-sm" style={{marginTop: 12}}>
    {items.map((it, i) => (
      <div key={i} className="row" style={{padding: '10px 4px', borderBottom: i < items.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}}>
        <div className="av orange">{it.av}</div>
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{fontSize: 13, fontWeight: 600}}>{it.name}</div>
          <div className="small">{it.city}</div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div className="num num-md">{fmtShort(it.value)}</div>
          <div className="bar" style={{width: 80, marginTop: 4}}><span style={{width: it.share + '%'}}/></div>
        </div>
      </div>
    ))}
  </div>
);

const RecentEntriesTable = () => {
  const { go } = useApp();
  const data = window.MOCK.entries.slice(0, 6);
  return (
    <div className="table-wrap" style={{marginTop: 12}}>
      <table className="table">
        <thead>
          <tr>
            <th>Bilty <span className="ur">بلٹی</span></th>
            <th>Date <span className="ur">تاریخ</span></th>
            <th>Vehicle <span className="ur">گاڑی</span></th>
            <th>Supplier <span className="ur">بیوپاری</span></th>
            <th>Crates <span className="ur">کریٹ</span></th>
            <th>Gross <span className="ur">کل</span></th>
            <th>Buyers</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map(r => (
            <tr key={r.id} onClick={() => go('all-entries')}>
              <td className="mono" style={{color:'var(--orange-400)', fontWeight:600}}>{r.id}</td>
              <td>{new Date(r.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</td>
              <td className="mono small">{r.vehicle}</td>
              <td>
                <div style={{fontWeight:600}}>{r.supplier}</div>
                <div className="small">{r.city}</div>
              </td>
              <td className="num">{r.crates}</td>
              <td className="num">{fmt(r.gross)}</td>
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
              <td><Icon name="arrow" size={14}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ActivityFeed = () => {
  const items = [
    { time: '14:42', who: 'Khalid', what: 'created entry TRK-1042', detail: 'Haji Saleem · 320 crates', kind: 'add' },
    { time: '13:18', who: 'Faisal', what: 'recorded payment', detail: 'Rs.85,000 from Iqbal & Sons', kind: 'pay' },
    { time: '12:05', who: 'System', what: 'sent WhatsApp campaign', detail: 'Daily Rate Update · 412 contacts', kind: 'msg' },
    { time: '10:50', who: 'Imran', what: 'updated rate', detail: 'TRK-1041 · Rate Rs.230/crate', kind: 'edit' },
    { time: '09:30', who: 'Khalid', what: 'logged expense', detail: 'Labour weekly · Rs.28,000', kind: 'exp' },
    { time: '08:15', who: 'Khalid', what: 'opened mandi', detail: 'Day started · 4 trucks expected', kind: 'add' },
  ];
  const colorOf = k => k === 'pay' ? 'var(--success)' : k === 'msg' ? 'var(--navy-400)' : k === 'exp' ? 'var(--danger)' : 'var(--orange-500)';
  return (
    <div className="col gap-sm" style={{marginTop: 12}}>
      {items.map((it, i) => (
        <div key={i} style={{display:'grid', gridTemplateColumns:'48px 1fr', gap: 12, padding: '8px 0', borderBottom: i < items.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}}>
          <div className="mono small" style={{color: 'var(--text-3)'}}>{it.time}</div>
          <div>
            <div style={{fontSize: 13}}>
              <span style={{fontWeight:600, color: colorOf(it.kind)}}>{it.who}</span>
              <span style={{color: 'var(--text-2)'}}> {it.what}</span>
            </div>
            <div className="small" style={{marginTop: 2}}>{it.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

window.DashboardPage = DashboardPage;
