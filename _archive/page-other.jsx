/* global React, Icon, fmt, fmtShort, useApp */
const { useState: useStateM } = React;

// === Marketing / WhatsApp ===
const MarketingPage = () => {
  const [tab, setTab] = useStateM('campaigns');
  return (
    <Page titleEn="WhatsApp Marketing" titleUr="واٹس ایپ مارکیٹنگ" sub="Reach traders and customers · auto-pulled from new entries">
      <div className="grid-4" style={{marginBottom: 24}}>
        <KPIBig icon="chat" en="Total Sent" ur="کل بھیجے" value="12,480" sub="last 90 days" trend="+18%" trendDir="up"/>
        <KPIBig icon="check" en="Read Rate" ur="پڑھنے کی شرح" value="78.4%" sub="9,792 / 12,480" iconClass="green" trend="+3.1%" trendDir="up"/>
        <KPIBig icon="phone" en="Reply Rate" ur="جواب کی شرح" value="6.9%" sub="861 replies" iconClass="blue" trend="+0.4%" trendDir="up"/>
        <KPIBig icon="users" en="Active Contacts" ur="فعال نمبرز" value="2,508" sub="from entries + uploads" trend="+142 NEW" trendDir="up"/>
      </div>

      <div className="row gap-sm" style={{marginBottom: 16}}>
        <div className="tabs">
          <div className={`tab ${tab==='campaigns'?'active':''}`} onClick={()=>setTab('campaigns')}>Campaigns · مہمات</div>
          <div className={`tab ${tab==='templates'?'active':''}`} onClick={()=>setTab('templates')}>Templates · سانچے</div>
          <div className={`tab ${tab==='inbox'?'active':''}`} onClick={()=>setTab('inbox')}>Inbox · جوابات</div>
          <div className={`tab ${tab==='contacts'?'active':''}`} onClick={()=>setTab('contacts')}>Contacts · رابطے</div>
        </div>
        <div style={{flex:1}}/>
        <button className="btn btn-ghost btn-sm"><Icon name="download" size={13}/> Upload CSV</button>
        <button className="btn btn-primary btn-sm"><Icon name="plus" size={13}/> New Campaign</button>
      </div>

      {tab==='campaigns' && <CampaignsView/>}
      {tab==='templates' && <TemplatesView/>}
      {tab==='inbox' && <InboxView/>}
      {tab==='contacts' && <ContactsView/>}
    </Page>
  );
};

const KPIBig = ({ icon, iconClass, en, ur, value, sub, trend, trendDir }) => (
  <div className="glass stat">
    <div className="stat-head">
      <div className={`stat-icon ${iconClass||''}`}><Icon name={icon}/></div>
      {trend && <span className={`stat-trend ${trendDir}`}>{trendDir==='down'?'↓':'↑'} {trend}</span>}
    </div>
    <div className="stat-label"><span className="en">{en}</span><span className="ur">{ur}</span></div>
    <div className="num num-xl">{value}</div>
    <div className="stat-meta">{sub}</div>
  </div>
);

const CampaignsView = () => (
  <div style={{display:'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16}}>
    <div className="glass" style={{padding: 0}}>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Campaign</th><th>Sent</th><th>Read</th><th>Replied</th><th>Outreach</th><th>Status</th></tr>
          </thead>
          <tbody>
            {window.MOCK.messages.concat([
              {id:'M4',name:'Tomato Auction Wed', sent:2104, delivered:2078, read:1820, replied:142, ratio:7.8},
              {id:'M5',name:'Bardana Available', sent:512, delivered:498, read:412, replied:38, ratio:9.2},
            ]).map(m => (
              <tr key={m.id}>
                <td>
                  <div style={{fontWeight:600}}>{m.name}</div>
                  <div className="small">Template · 3 variables</div>
                </td>
                <td className="num">{m.sent.toLocaleString()}</td>
                <td className="num">{m.read.toLocaleString()} <span className="small">({Math.round(m.read/m.sent*100)}%)</span></td>
                <td className="num">{m.replied}</td>
                <td style={{width: 140}}>
                  <div className="bar"><span style={{width: (m.read/m.sent*100)+'%'}}/></div>
                  <div className="tiny" style={{marginTop: 4}}>{m.ratio}% reply</div>
                </td>
                <td><span className="chip success"><span className="live-dot"/>sent</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <WhatsappPreview/>
  </div>
);

const WhatsappPreview = () => (
  <div className="glass" style={{padding: 0, overflow: 'hidden'}}>
    <div style={{padding: '14px 18px', borderBottom: '1px solid var(--glass-border)', display:'flex',alignItems:'center',gap:10}}>
      <div style={{width:32, height:32, borderRadius:'50%', background: '#25d366', display:'grid', placeItems:'center'}}><Icon name="chat" size={16}/></div>
      <div>
        <div style={{fontSize:13,fontWeight:700}}>Live Preview · پیش نظارہ</div>
        <div className="small">As recipient sees it</div>
      </div>
    </div>
    <div style={{padding: 20, background: 'linear-gradient(180deg, #075e54, #0a1535)', minHeight: 380}}>
      <div style={{maxWidth: 280, marginLeft: 'auto', background: '#dcf8c6', color: '#1a1a1a', padding: '10px 12px', borderRadius: '12px 4px 12px 12px', fontSize: 13, lineHeight: 1.5, boxShadow: '0 2px 6px rgba(0,0,0,0.2)'}}>
        <div style={{fontWeight: 700, color: '#075e54', marginBottom: 4}}>Your Mandi · ٹماٹر منڈی</div>
        السلام علیکم *حاجی صاحب* 🍅<br/>
        آج کا ریٹ:<br/>
        ٹماٹر: Rs.2,400 / crate<br/>
        Bardana available: Yes<br/>
        تشریف لائیں — *Quetta Mandi B-12*
        <div style={{textAlign:'right', fontSize: 10, color: '#666', marginTop: 6}}>14:42 ✓✓</div>
      </div>
      <div style={{textAlign:'center', margin: '14px 0', color: 'rgba(255,255,255,0.4)', fontSize:11}}>2,104 recipients</div>
      <div style={{maxWidth: 220, background: 'white', color: '#1a1a1a', padding: '10px 12px', borderRadius: '4px 12px 12px 12px', fontSize: 13, boxShadow: '0 2px 6px rgba(0,0,0,0.2)'}}>
        Theek hai, kal aata hoon. 5 trucks lounga.
        <div style={{textAlign:'right', fontSize: 10, color: '#666', marginTop: 6}}>14:48</div>
      </div>
    </div>
  </div>
);

const TemplatesView = () => (
  <div className="grid-3">
    {[
      { name: 'Daily Rate Update', ur: 'روزانہ ریٹ', vars: 3, used: 28, color:'var(--orange-500)' },
      { name: 'New Stock Alert', ur: 'نیا اسٹاک', vars: 4, used: 14, color:'var(--navy-400)' },
      { name: 'Payment Reminder', ur: 'یاد دہانی', vars: 5, used: 42, color:'var(--success)' },
      { name: 'Eid Greetings', ur: 'عید مبارک', vars: 1, used: 1, color:'var(--orange-500)' },
      { name: 'Bardana Available', ur: 'باردانہ', vars: 2, used: 8, color:'var(--navy-400)' },
      { name: 'Custom', ur: 'حسب ضرورت', vars: 0, used: 0, color:'var(--text-3)', empty: true },
    ].map((t,i) => (
      <div key={i} className="glass stat" style={{cursor:'pointer'}}>
        <div className="stat-head">
          <div className="stat-icon" style={{borderColor: t.color, color: t.color}}><Icon name="file"/></div>
          {!t.empty && <span className="chip">{t.used} sent</span>}
        </div>
        <div style={{fontSize: 14, fontWeight: 700}}>{t.name}</div>
        <div className="ur small">{t.ur}</div>
        <div className="small" style={{marginTop: 8}}>{t.empty ? 'Create new template' : `${t.vars} variables · WhatsApp approved`}</div>
      </div>
    ))}
  </div>
);

const InboxView = () => (
  <div className="glass" style={{padding:0}}>
    {[
      { name: 'Haji Saleem', city: 'Quetta', msg: 'Theek hai, kal aata hoon. 5 trucks lounga.', time: '14:48', unread: true },
      { name: 'Ahmed Khan', city: 'Karachi', msg: 'Rate aaj kya hai? 200 crates chahiye.', time: '13:22', unread: true },
      { name: 'Wali Khan', city: 'Mastung', msg: 'Bardana abhi available hai?', time: '11:05', unread: false },
      { name: 'Bashir Sabzi', city: 'Lahore', msg: 'Payment kal kar dunga.', time: 'Yesterday', unread: false },
    ].map((m,i) => (
      <div key={i} className="row" style={{padding: '14px 18px', borderBottom: i<3 ? '1px solid rgba(255,255,255,0.04)':'none', cursor:'pointer'}}>
        <div className="av">{m.name[0]}</div>
        <div style={{flex:1, minWidth:0}}>
          <div className="row between"><span style={{fontWeight:600,fontSize:13}}>{m.name} <span className="small">· {m.city}</span></span><span className="tiny">{m.time}</span></div>
          <div className="small" style={{marginTop:4, color: m.unread ? 'var(--text-1)' : 'var(--text-3)', fontWeight: m.unread ? 500:400}}>{m.msg}</div>
        </div>
        {m.unread && <span style={{width:8,height:8,borderRadius:'50%',background:'var(--orange-500)'}}/>}
      </div>
    ))}
  </div>
);

const ContactsView = () => (
  <div style={{display:'grid', gridTemplateColumns: '1fr 320px', gap: 16}}>
    <div className="glass" style={{padding: 0}}>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Phone</th><th>Source</th><th>Group</th><th>Last Msg</th><th>Engaged</th></tr></thead>
          <tbody>
            {window.MOCK.suppliers.concat(window.MOCK.customers).slice(0,9).map((c,i) => (
              <tr key={i}>
                <td style={{fontWeight:600}}>{c.name}</td>
                <td className="mono small">{c.phone}</td>
                <td><span className="chip">{i%2===0?'Entry':'CSV upload'}</span></td>
                <td><span className="chip">{i<6?'Suppliers':'Customers'}</span></td>
                <td className="small">{['2h ago','5h ago','1d ago','3d ago','1w ago'][i%5]}</td>
                <td><div className="bar" style={{width: 80}}><span style={{width: (40 + i*7)+'%'}}/></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div className="glass" style={{padding: 20}}>
      <h3 className="h3" style={{marginTop: 0}}>Quick Upload</h3>
      <div style={{border: '2px dashed var(--glass-border-strong)', borderRadius: 12, padding: 28, textAlign: 'center', marginTop: 12}}>
        <Icon name="download" size={28} className=""/>
        <div style={{marginTop: 10, fontWeight: 600, fontSize: 13}}>Drop CSV / Excel</div>
        <div className="small" style={{marginTop: 4}}>Or browse files</div>
        <button className="btn btn-ghost btn-sm" style={{marginTop: 14}}>Choose File</button>
      </div>
      <div className="divider"/>
      <div className="small" style={{lineHeight: 1.6}}>
        <strong style={{color:'var(--text-1)'}}>Auto-sync sources:</strong><br/>
        ✓ Supplier phones from new entries<br/>
        ✓ Customer phones from new entries<br/>
        ✓ Manual additions<br/>
        ✓ CSV uploads (mapped)
      </div>
    </div>
  </div>
);

// === Users ===
const UsersPage = () => {
  return (
    <Page titleEn="Users & Permissions" titleUr="صارفین و اجازت" sub="Up to 3 users · Admin sees everything, others have limited access">
      <div className="row" style={{marginBottom: 24}}>
        <div className="glass-strong" style={{padding: 20, flex:1, marginRight: 16}}>
          <div className="row" style={{alignItems:'baseline', gap: 16}}>
            <div className="num" style={{fontSize: 44, fontWeight: 800, color:'var(--orange-400)'}}>3</div>
            <div className="num" style={{fontSize: 22, color:'var(--text-3)'}}>/ 3</div>
            <div style={{flex:1}}>
              <div style={{fontWeight: 600}}>Active users</div>
              <div className="small">Plan limit reached — upgrade for more seats</div>
            </div>
            <button className="btn btn-primary btn-sm">Upgrade plan</button>
          </div>
        </div>
        <button className="btn btn-primary"><Icon name="plus" size={13}/> Invite User</button>
      </div>

      <div className="grid-3" style={{marginBottom: 24}}>
        {window.MOCK.users.map(u => (
          <div key={u.id} className="glass" style={{padding: 20}}>
            <div className="row between" style={{marginBottom: 14}}>
              <div className="row">
                <div className={`av ${u.role==='Admin'?'orange':''}`} style={{width:44,height:44,fontSize:16}}>{u.name[0]}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:14}}>{u.name}</div>
                  <div className="small">{u.email}</div>
                </div>
              </div>
              <span className={`chip ${u.role==='Admin'?'active':''}`}>{u.role}</span>
            </div>
            <div className="divider"/>
            <div className="small" style={{lineHeight: 1.8}}>
              <div className="row between"><span>Last active</span><span style={{color:'var(--text-1)'}}>{u.last}</span></div>
              <div className="row between"><span>Status</span><span className="chip success" style={{fontSize:10}}>{u.status}</span></div>
              <div className="row between"><span>Entries created</span><span style={{color:'var(--text-1)'}} className="num">{Math.floor(Math.random()*120+20)}</span></div>
            </div>
            <div className="row gap-sm" style={{marginTop: 14}}>
              <button className="btn btn-ghost btn-sm" style={{flex:1}}>Edit</button>
              <button className="btn btn-ghost btn-sm"><Icon name="trash" size={13}/></button>
            </div>
          </div>
        ))}
      </div>

      <div className="glass" style={{padding: 0}}>
        <div style={{padding:'14px 18px', borderBottom:'1px solid var(--glass-border)'}}>
          <strong>Permission Matrix · اجازت میٹرکس</strong>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Capability</th><th>Admin</th><th>Accountant</th><th>Salesman</th></tr></thead>
            <tbody>
              {[
                ['View Dashboard', true, true, true],
                ['Create New Entry', true, true, true],
                ['View All Entries', true, true, 'own only'],
                ['Edit / Delete Entries', true, true, false],
                ['Manage Advances', true, true, false],
                ['Log Expenses', true, true, false],
                ['View Profit & Reports', true, false, false],
                ['Marketing / WhatsApp', true, false, false],
                ['Manage Users', true, false, false],
                ['Settings', true, false, false],
              ].map((r,i) => (
                <tr key={i}>
                  <td style={{fontWeight: 600}}>{r[0]}</td>
                  {r.slice(1).map((v,j) => (
                    <td key={j}>
                      {v === true && <span style={{color:'var(--success)'}}><Icon name="check" size={16}/></span>}
                      {v === false && <span style={{color:'var(--danger)', opacity: 0.5}}>✕</span>}
                      {typeof v === 'string' && <span className="chip warn">{v}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  );
};

// === Login ===
const LoginPage = () => {
  const { go } = useApp();
  return (
    <div style={{minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', position:'relative', zIndex: 1}}>
      <div style={{padding: 64, display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden'}}>
        <div className="row">
          <div className="sb-logo" style={{width:48,height:48}}>YM</div>
          <div>
            <div style={{fontSize:18,fontWeight:800}}>Your Mandi</div>
            <div className="small">Tomato Trading CRM</div>
          </div>
        </div>
        <div>
          <div style={{fontSize:14, color:'var(--orange-400)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom: 10}}>Pakistan's Mandi Operating System</div>
          <h1 className="h-display" style={{fontSize: 56, marginBottom: 18}}>Run your<br/>tomato auction<br/>like a pro.</h1>
          <p className="body" style={{maxWidth: 480, fontSize: 16, lineHeight: 1.6}}>One truck in. Many buyers out. Track every laga, wari, and rupee — in Urdu and English, with WhatsApp built in.</p>
          <div className="row gap-sm" style={{marginTop: 32}}>
            <span className="chip"><span className="tomato"/>Trusted by 14 mandis</span>
            <span className="chip">Urdu-first · اردو</span>
            <span className="chip">WhatsApp Sync</span>
          </div>
        </div>
        <div className="small" style={{color:'var(--text-4)'}}>© 2026 Naked Tech · Built for Quetta Mandi</div>

        <div style={{position:'absolute', top: '40%', right: '-20%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(255,167,38,0.18), transparent 60%)', filter:'blur(40px)', pointerEvents:'none'}}/>
      </div>

      <div style={{display:'grid', placeItems:'center', padding: 40}}>
        <div className="glass-strong" style={{padding: 40, width: '100%', maxWidth: 460}}>
          <h2 className="h1" style={{marginBottom:6}}>Welcome back</h2>
          <p className="ur" style={{fontSize: 16, color:'var(--text-3)', marginBottom: 32}}>دوبارہ خوش آمدید</p>

          <div className="col gap-lg">
            <div className="field">
              <div className="field-label"><span>Email or Phone</span><span className="ur">ای میل یا فون</span></div>
              <input className="input" defaultValue="khalid@yourmandi.pk"/>
            </div>
            <div className="field">
              <div className="field-label"><span>Password</span><a className="small" style={{color:'var(--orange-400)'}}>Forgot? · بھول گئے؟</a></div>
              <input className="input" type="password" defaultValue="••••••••••"/>
            </div>
            <button className="btn btn-primary btn-lg" onClick={()=>go('dashboard')}>Sign In · داخلہ <Icon name="arrow" size={14}/></button>
            <div className="row" style={{justifyContent:'center'}}>
              <span className="small">Need help? · مدد چاہئے؟ <a style={{color:'var(--orange-400)'}}>Contact admin</a></span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap: 10, color:'var(--text-4)', fontSize:11}}>
              <span style={{flex:1, height:1, background:'var(--glass-border)'}}/>
              SECURE LOGIN
              <span style={{flex:1, height:1, background:'var(--glass-border)'}}/>
            </div>
            <div className="row gap-sm" style={{justifyContent:'center'}}>
              <span className="chip">📱 SMS OTP</span>
              <span className="chip">🔐 2FA</span>
              <span className="chip">📞 PIN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// === Settings ===
const SettingsPage = () => (
  <Page titleEn="Settings" titleUr="ترتیبات" sub="Configure your mandi · rates, language, integrations">
    <div style={{display:'grid', gridTemplateColumns:'240px 1fr', gap: 16}}>
      <div className="glass" style={{padding: 8, height:'fit-content'}}>
        {[
          ['General','عمومی','settings'],
          ['Rates & Charges','ریٹس','money'],
          ['Language','زبان','file'],
          ['WhatsApp API','واٹس ایپ','chat'],
          ['Backup','بیک اپ','download'],
          ['Billing','بلنگ','receipt'],
        ].map(([en,ur,ic],i) => (
          <a key={i} className={`sb-item ${i===0?'active':''}`}>
            <Icon name={ic} size={15}/>
            <span className="en-label">{en}</span>
            <span className="ur-label ur">{ur}</span>
          </a>
        ))}
      </div>

      <div className="col gap-lg">
        <div className="glass" style={{padding: 24}}>
          <h2 className="h2">Mandi Profile · منڈی پروفائل</h2>
          <div className="spacer"/>
          <div className="input-row">
            <div className="field"><div className="field-label"><span>Mandi Name</span><span className="ur">منڈی کا نام</span></div><input className="input" defaultValue="Your Mandi · Tomato Trading"/></div>
            <div className="field"><div className="field-label"><span>Owner</span><span className="ur">مالک</span></div><input className="input" defaultValue="Khalid Abbasi"/></div>
          </div>
          <div className="spacer-sm"/>
          <div className="input-row">
            <div className="field"><div className="field-label"><span>City</span><span className="ur">شہر</span></div><input className="input" defaultValue="Quetta"/></div>
            <div className="field"><div className="field-label"><span>Phone</span><span className="ur">فون</span></div><input className="input" defaultValue="0301-2345678"/></div>
          </div>
        </div>

        <div className="glass" style={{padding: 24}}>
          <h2 className="h2">Default Rates · ڈیفالٹ ریٹس</h2>
          <div className="spacer"/>
          <div className="input-row-3">
            <div className="field"><div className="field-label"><span>Laga / crate</span><span className="ur">لاگا</span></div><div className="input-prefix"><span className="pre">Rs.</span><input className="input num" defaultValue="10"/></div></div>
            <div className="field"><div className="field-label"><span>Labour / crate</span><span className="ur">مزدوری</span></div><div className="input-prefix"><span className="pre">Rs.</span><input className="input num" defaultValue="10"/></div></div>
            <div className="field"><div className="field-label"><span>Wari / crate</span><span className="ur">نگواری</span></div><div className="input-prefix"><span className="pre">Rs.</span><input className="input num" defaultValue="5"/></div></div>
          </div>
          <div className="spacer-sm"/>
          <div className="input-row">
            <div className="field"><div className="field-label"><span>Commission Divisor</span><span className="ur">کمیشن تقسیم</span></div><input className="input num" defaultValue="13.78"/></div>
            <div className="field"><div className="field-label"><span>Default Crate Capacity</span><span className="ur">کریٹ گنجائش</span></div><input className="input" defaultValue="20 kg"/></div>
          </div>
        </div>

        <div className="glass" style={{padding: 24}}>
          <h2 className="h2">Print Defaults · پرنٹ ترتیبات</h2>
          <div className="spacer"/>
          <div className="input-row-3">
            <div className="field"><div className="field-label"><span>Receipt Size</span></div><select className="select"><option>Thermal 80mm</option><option>A5</option><option>A4</option></select></div>
            <div className="field"><div className="field-label"><span>Print on Save</span></div><select className="select"><option>Ask each time</option><option>Always</option><option>Never</option></select></div>
            <div className="field"><div className="field-label"><span>Logo on Receipt</span></div><select className="select"><option>Yes</option><option>No</option></select></div>
          </div>
        </div>

        <div className="row" style={{justifyContent:'flex-end'}}>
          <button className="btn btn-ghost">Cancel</button>
          <button className="btn btn-primary"><Icon name="check" size={13}/> Save Changes</button>
        </div>
      </div>
    </div>
  </Page>
);

window.MarketingPage = MarketingPage;
window.UsersPage = UsersPage;
window.LoginPage = LoginPage;
window.SettingsPage = SettingsPage;
