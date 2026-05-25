/* global React, Icon, fmt, useApp */
const { useState: useStateNE, useMemo: useMemoNE } = React;

const NewEntryPage = () => {
  return (
    <Page titleEn="New Entry" titleUr="نیا اندراج" sub="Record one truck — supplier in, customers out">
      <div className="row gap-sm" style={{marginBottom: 16}}>
        <span className="chip active"><Icon name="bolt" size={11}/> Auto-saving draft</span>
        <span className="chip">Bilty TRK-1043</span>
        <span className="chip">{new Date().toLocaleDateString('en-GB')}</span>
        <div style={{flex:1}}/>
        <button className="btn btn-ghost btn-sm"><Icon name="trash" size={13}/> Discard</button>
        <button className="btn btn-secondary btn-sm">Save Draft</button>
        <button className="btn btn-primary btn-sm"><Icon name="check" size={13}/> Save & Print Receipt</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16}}>
        <SupplierForm />
        <CustomerForm />
      </div>

      <div className="spacer-lg"/>
      <LiveSummary />
    </Page>
  );
};

const SectionHead = ({ num, en, ur, icon }) => (
  <div className="row" style={{marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--glass-border)'}}>
    <div style={{width: 32, height: 32, borderRadius: 8, background: 'rgba(255,167,38,0.1)', color: 'var(--orange-400)', display:'grid', placeItems:'center'}}>
      <Icon name={icon} size={15}/>
    </div>
    <div style={{flex:1}}>
      <div style={{fontSize: 13, fontWeight: 700}}>{en}</div>
      <div className="ur small">{ur}</div>
    </div>
    {num && <span className="tiny mono">{num}</span>}
  </div>
);

const Field = ({ en, ur, req, children, hint }) => (
  <div className="field">
    <div className="field-label">
      <span>{en}{req && <span className="req">*</span>}</span>
      <span className="ur">{ur}</span>
    </div>
    {children}
    {hint && <div className="tiny" style={{marginTop:2, color:'var(--orange-400)'}}>{hint}</div>}
  </div>
);

const SupplierForm = () => {
  const [crates, setCrates] = useStateNE(320);
  const [rate, setRate] = useStateNE(2400);
  const [fare, setFare] = useStateNE(28000);
  const [advance, setAdvance] = useStateNE(0);
  const [bardana, setBardana] = useStateNE(0);
  const gross = crates * rate;
  const labour = crates * 10;
  const laga = crates * 10;
  const totalDed = labour + laga + fare + advance + bardana;
  const balance = gross - totalDed;

  return (
    <div className="glass" style={{padding: 24, position:'relative', overflow:'hidden'}}>
      <div style={{position:'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--orange-500), transparent)'}}/>

      <div className="row" style={{marginBottom: 18}}>
        <div style={{width: 40, height: 40, borderRadius: 10, background:'linear-gradient(135deg, rgba(255,167,38,0.2), rgba(255,167,38,0.05))', border:'1px solid rgba(255,167,38,0.3)', display:'grid', placeItems:'center', color:'var(--orange-400)'}}>
          <Icon name="truck" size={18}/>
        </div>
        <div style={{flex:1}}>
          <div className="row" style={{alignItems:'baseline', gap: 8}}>
            <h2 className="h2">Supplier (IN)</h2>
            <span className="ur" style={{fontSize: 16}}>بیوپاری</span>
          </div>
          <div className="small">Goods coming in — what we owe the trader</div>
        </div>
        <span className="chip active">Side A</span>
      </div>

      {/* Live mini summary */}
      <div className="glass-strong" style={{padding: 14, marginBottom: 18, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 12}}>
        <div>
          <div className="tiny">Gross / کل رقم</div>
          <div className="num num-md" style={{color:'var(--text-1)'}}>{fmt(gross)}</div>
        </div>
        <div>
          <div className="tiny">Deductions / کٹوتیاں</div>
          <div className="num num-md" style={{color:'var(--danger)'}}>−{fmt(totalDed)}</div>
        </div>
        <div>
          <div className="tiny">Net Payable / بقایا</div>
          <div className="num num-md" style={{color:'var(--orange-400)'}}>{fmt(balance)}</div>
        </div>
      </div>

      <SectionHead num="1–2" en="Trader Identity" ur="بیوپاری کا تعارف" icon="user"/>
      <div className="input-row">
        <Field en="Trader Name" ur="بیوپاری نام" req>
          <input className="input" placeholder="e.g. Haji Saleem" defaultValue="Haji Saleem"/>
        </Field>
        <Field en="City" ur="شہر" req>
          <input className="input" placeholder="e.g. Quetta" defaultValue="Quetta"/>
        </Field>
      </div>

      <div className="spacer-sm"/>

      <SectionHead num="3–9" en="Truck Data" ur="ٹرک کی تفصیلات" icon="truck"/>
      <div className="input-row">
        <Field en="Phone Number" ur="فون نمبر">
          <input className="input" placeholder="03XX-XXXXXXX" defaultValue="0301-2345678"/>
        </Field>
        <Field en="Bilty Number" ur="بلٹی نمبر">
          <input className="input" placeholder="BLT-123" defaultValue="BLT-1042"/>
        </Field>
      </div>
      <div className="spacer-sm"/>
      <div className="input-row">
        <Field en="Vehicle Number" ur="گاڑی نمبر" req>
          <input className="input mono" defaultValue="LES-1842"/>
        </Field>
        <Field en="Loading Date" ur="لوڈنگ تاریخ" req>
          <input className="input" type="date" defaultValue="2026-04-26"/>
        </Field>
      </div>
      <div className="spacer-sm"/>
      <div className="input-row-3">
        <Field en="Truck Fare" ur="ٹرک کرایہ">
          <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" value={fare} onChange={e=>setFare(+e.target.value||0)}/></div>
        </Field>
        <Field en="Labour /crate" ur="مزدوری" hint={`Auto · Total ${fmt(labour)}`}>
          <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" defaultValue="10"/></div>
        </Field>
        <Field en="Laga /crate" ur="لاگا" hint={`Auto · Total ${fmt(laga)}`}>
          <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" defaultValue="10"/></div>
        </Field>
      </div>

      <div className="spacer-sm"/>

      <SectionHead num="10–13" en="Goods Owners" ur="مالکان / پارٹیز" icon="users"/>
      <div className="glass-strong" style={{padding: 14, marginBottom: 10}}>
        <div className="row between" style={{marginBottom: 10}}>
          <strong style={{fontSize: 12, color:'var(--orange-400)'}}>Owner 1</strong>
          <button className="btn btn-ghost btn-sm" style={{padding:'4px 8px'}}><Icon name="trash" size={11}/></button>
        </div>
        <Field en="Owner Name" ur="مالک کا نام" req>
          <input className="input" defaultValue="Haji Saleem"/>
        </Field>
        <div className="spacer-sm"/>
        <div className="input-row-3">
          <Field en="Crates" ur="کریٹ" req>
            <input className="input num" type="number" value={crates} onChange={e=>setCrates(+e.target.value||0)}/>
          </Field>
          <Field en="Rate /crate" ur="ریٹ" req>
            <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" value={rate} onChange={e=>setRate(+e.target.value||0)}/></div>
          </Field>
          <Field en="Total" ur="کل رقم">
            <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" value={gross.toLocaleString()} readOnly style={{color:'var(--orange-400)', fontWeight:700}}/></div>
          </Field>
        </div>
      </div>
      <button className="btn btn-ghost btn-sm" style={{width:'100%'}}><Icon name="plus" size={12}/> Add Another Owner · مزید شخص</button>

      <div className="spacer"/>

      <SectionHead num="15–18" en="Advance & Bardana" ur="بیانہ و باردانہ" icon="wallet"/>
      <div className="input-row">
        <Field en="Advance" ur="بیانہ / ایڈوانس" hint="Rs.50,000 active advance available">
          <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" value={advance} onChange={e=>setAdvance(+e.target.value||0)} placeholder="0"/></div>
        </Field>
        <Field en="Advance Date" ur="تاریخ بیانہ">
          <input className="input" type="date"/>
        </Field>
      </div>
      <div className="spacer-sm"/>
      <div className="input-row">
        <Field en="Bardana" ur="باردانہ">
          <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" value={bardana} onChange={e=>setBardana(+e.target.value||0)} placeholder="0"/></div>
        </Field>
        <Field en="Bardana Date" ur="تاریخ باردانہ">
          <input className="input" type="date"/>
        </Field>
      </div>

      <div className="spacer"/>

      <SectionHead num="19–22" en="Payment Recording" ur="ادائیگی" icon="money"/>
      <div className="input-row-3">
        <Field en="Payment Amount" ur="ادائیگی">
          <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" placeholder="0"/></div>
        </Field>
        <Field en="Payment Date" ur="تاریخ ادائیگی">
          <input className="input" type="date" defaultValue="2026-04-26"/>
        </Field>
        <Field en="Method" ur="صورت">
          <select className="select"><option>💵 Cash · نقد</option><option>📋 Credit · ادھار</option><option>🏦 Bank</option></select>
        </Field>
      </div>
      <div className="spacer-sm"/>
      <button className="btn btn-ghost btn-sm" style={{width:'100%'}}><Icon name="plus" size={12}/> Add Another Payment</button>

      <div className="spacer"/>
      <Field en="Remarks / Notes" ur="نوٹس">
        <textarea className="textarea" placeholder="Optional notes about this entry…"/>
      </Field>
    </div>
  );
};

const CustomerForm = () => {
  const [crates, setCrates] = useStateNE(80);
  const [price, setPrice] = useStateNE(2650);
  const [discount, setDiscount] = useStateNE(0);
  const [advance, setAdvance] = useStateNE(0);
  const gross = crates * price;
  const wari = crates * 5;
  const commission = Math.round(gross / 13.78);
  const total = gross + commission + wari - discount;
  const remaining = total - advance;

  return (
    <div className="glass" style={{padding: 24, position:'relative', overflow:'hidden'}}>
      <div style={{position:'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--navy-400), transparent)'}}/>

      <div className="row" style={{marginBottom: 18}}>
        <div style={{width: 40, height: 40, borderRadius: 10, background:'linear-gradient(135deg, rgba(91,125,224,0.2), rgba(91,125,224,0.05))', border:'1px solid rgba(91,125,224,0.3)', display:'grid', placeItems:'center', color:'var(--navy-300)'}}>
          <Icon name="users" size={18}/>
        </div>
        <div style={{flex:1}}>
          <div className="row" style={{alignItems:'baseline', gap: 8}}>
            <h2 className="h2">Customer (OUT)</h2>
            <span className="ur" style={{fontSize: 16}}>خریدار</span>
          </div>
          <div className="small">Goods going out — what customers owe us</div>
        </div>
        <span className="chip info">Side B</span>
      </div>

      <div className="glass-strong" style={{padding: 14, marginBottom: 18, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 12}}>
        <div>
          <div className="tiny">Gross / کل مال</div>
          <div className="num num-md">{fmt(gross)}</div>
        </div>
        <div>
          <div className="tiny">+ Comm + Wari</div>
          <div className="num num-md" style={{color:'var(--success)'}}>+{fmt(commission + wari)}</div>
        </div>
        <div>
          <div className="tiny">Remaining / بقایہ</div>
          <div className="num num-md" style={{color:'var(--navy-300)'}}>{fmt(remaining)}</div>
        </div>
      </div>

      <SectionHead num="1–3" en="Customer Profile" ur="خریدار پروفائل" icon="user"/>
      <Field en="Buyer Name" ur="نام خریدار" req>
        <input className="input" placeholder="e.g. Ahmed Khan" defaultValue="Ahmed Khan"/>
      </Field>
      <div className="spacer-sm"/>
      <div className="input-row">
        <Field en="Address" ur="ایڈریس">
          <input className="input" placeholder="e.g. Karachi" defaultValue="Karachi"/>
        </Field>
        <Field en="Phone Number" ur="فون نمبر">
          <input className="input" placeholder="03XX-XXXXXXX" defaultValue="0321-5556677"/>
        </Field>
      </div>
      <div className="spacer-sm"/>
      <Field en="Nickname" ur="عرفیت / شہر">
        <input className="input" placeholder="Optional"/>
      </Field>

      <div className="spacer"/>

      <SectionHead num="—" en="Rate Settings" ur="ریٹ سیٹنگ" icon="settings"/>
      <div className="input-row">
        <Field en="Log Rate" ur="لاگ ریٹ">
          <input className="input num" defaultValue="5"/>
        </Field>
        <Field en="Commission Divisor" ur="کمیشن تقسیم" hint="÷13.78 (auto)">
          <input className="input num" defaultValue="13.78"/>
        </Field>
      </div>

      <div className="spacer"/>

      <SectionHead num="4–11" en="Purchase Data" ur="خریداری ڈیٹا" icon="box"/>
      <div className="glass-strong" style={{padding: 14, marginBottom: 10}}>
        <div className="row between" style={{marginBottom: 10}}>
          <strong style={{fontSize: 12, color:'var(--navy-300)'}}>Purchase 1</strong>
          <button className="btn btn-ghost btn-sm" style={{padding:'4px 8px'}}><Icon name="trash" size={11}/></button>
        </div>
        <div className="input-row">
          <Field en="Purchase Date" ur="تاریخ خریداری" req>
            <input className="input" type="date" defaultValue="2026-04-26"/>
          </Field>
          <Field en="Bill Number" ur="بل نمبر">
            <input className="input mono" defaultValue="1105"/>
          </Field>
        </div>
        <div className="spacer-sm"/>
        <div className="input-row-3">
          <Field en="Crates" ur="تعداد کریٹ" req>
            <input className="input num" type="number" value={crates} onChange={e=>setCrates(+e.target.value||0)}/>
          </Field>
          <Field en="Price /crate" ur="فی کریٹ" req>
            <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" value={price} onChange={e=>setPrice(+e.target.value||0)}/></div>
          </Field>
          <Field en="Gross" ur="کل" hint="Auto">
            <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" value={gross.toLocaleString()} readOnly style={{color:'var(--navy-300)', fontWeight:700}}/></div>
          </Field>
        </div>
        <div className="spacer-sm"/>
        <div className="input-row-3">
          <Field en="Wari (Rs.5/crate)" ur="نگواری" hint={`Auto · ${fmt(wari)}`}>
            <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" value={wari.toLocaleString()} readOnly/></div>
          </Field>
          <Field en="Commission (÷13.78)" ur="کمیشن" hint={`Auto · ${fmt(commission)}`}>
            <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" value={commission.toLocaleString()} readOnly/></div>
          </Field>
          <Field en="Discount" ur="رعایت">
            <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" value={discount} onChange={e=>setDiscount(+e.target.value||0)}/></div>
          </Field>
        </div>
        <div className="spacer-sm"/>
        <div className="input-row">
          <Field en="Advance Cash" ur="ادائیگی نقد">
            <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" type="number" value={advance} onChange={e=>setAdvance(+e.target.value||0)}/></div>
          </Field>
          <Field en="Type" ur="ادھار/نقد">
            <select className="select"><option>💵 Cash · نقد</option><option>📋 Credit · ادھار</option></select>
          </Field>
        </div>
      </div>
      <button className="btn btn-ghost btn-sm" style={{width:'100%'}}><Icon name="plus" size={12}/> Add Another Purchase · مزید خریداری</button>

      <div className="spacer"/>

      <SectionHead num="14–19" en="Record Payments" ur="رقم کی وصولی" icon="money"/>
      <div className="input-row-3">
        <Field en="Amount" ur="رقم">
          <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" placeholder="0"/></div>
        </Field>
        <Field en="Payment Date" ur="تاریخ ادائیگی">
          <input className="input" type="date" defaultValue="2026-04-26"/>
        </Field>
        <Field en="Method" ur="صورت">
          <select className="select"><option>💵 Cash</option><option>🏦 Bank</option><option>📋 Credit</option></select>
        </Field>
      </div>
      <div className="spacer-sm"/>
      <button className="btn btn-ghost btn-sm" style={{width:'100%'}}><Icon name="plus" size={12}/> Add Another Payment</button>
    </div>
  );
};

const LiveSummary = () => (
  <div className="glass-strong" style={{padding: 24, position: 'sticky', bottom: 16}}>
    <div className="row between" style={{marginBottom: 16}}>
      <div>
        <h2 className="h2">Live Bill Summary</h2>
        <span className="ur small">بل کا خلاصہ</span>
      </div>
      <span className="chip success"><span className="live-dot"/>Auto-calculated</span>
    </div>
    <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap: 16}}>
      <SummaryStat en="Truck Gross" ur="کل ٹرک" value={768000} accent="var(--orange-400)"/>
      <SummaryStat en="Customer Gross" ur="خریدار کل" value={212000} accent="var(--navy-300)"/>
      <SummaryStat en="Agency Earned" ur="ایجنسی آمدنی" value={9600} accent="var(--success)" sub="laga + labour + comm + wari"/>
      <SummaryStat en="Supplier Payable" ur="بیوپاری بقایا" value={734400} accent="var(--orange-400)"/>
      <SummaryStat en="Customer Receivable" ur="گاہک بقایا" value={221450} accent="var(--navy-300)"/>
    </div>
  </div>
);

const SummaryStat = ({ en, ur, value, accent, sub }) => (
  <div>
    <div className="row between" style={{alignItems:'baseline'}}>
      <span className="small" style={{fontWeight: 600, color:'var(--text-2)'}}>{en}</span>
      <span className="ur small">{ur}</span>
    </div>
    <div className="num num-lg" style={{marginTop: 4, color: accent}}>{fmt(value)}</div>
    {sub && <div className="tiny" style={{marginTop: 2}}>{sub}</div>}
  </div>
);

window.NewEntryPage = NewEntryPage;
