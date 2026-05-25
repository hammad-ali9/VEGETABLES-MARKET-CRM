import { useState } from 'react';
import { Icon } from '../components/ui/Icon';
import { Page } from '../components/layout/Page';
import { useApp } from '../context/AppContext';

const KPIBig = ({ icon, iconClass, en, ur, value, sub, trend, trendDir }) => (
  <div className="glass stat">
    <div className="stat-head">
      <div className={`stat-icon ${iconClass || ''}`}><Icon name={icon} /></div>
      {trend && <span className={`stat-trend ${trendDir}`}>{trendDir === 'down' ? '↓' : '↑'} {trend}</span>}
    </div>
    <div className="stat-label"><span className="en">{en}</span><span className="ur">{ur}</span></div>
    <div className="num num-xl">{value}</div>
    <div className="stat-meta">{sub}</div>
  </div>
);

const SAMPLE_CAMPAIGNS = [
  { id: 'M4', name: 'Tomato Auction Wed', sent: 2104, delivered: 2078, read: 1820, replied: 142, ratio: 7.8 },
  { id: 'M5', name: 'Bardana Available', sent: 512, delivered: 498, read: 412, replied: 38, ratio: 9.2 },
];

const CampaignsView = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
    <div className="glass" style={{ padding: 0 }}>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Campaign</th><th>Sent</th><th>Read</th><th>Replied</th><th>Outreach</th><th>Status</th></tr>
          </thead>
          <tbody>
            {SAMPLE_CAMPAIGNS.map(m => (
              <tr key={m.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                  <div className="small">Template · 3 variables</div>
                </td>
                <td className="num">{m.sent.toLocaleString()}</td>
                <td className="num">{m.read.toLocaleString()} <span className="small">({Math.round(m.read / m.sent * 100)}%)</span></td>
                <td className="num">{m.replied}</td>
                <td style={{ width: 140 }}>
                  <div className="bar"><span style={{ width: (m.read / m.sent * 100) + '%' }} /></div>
                  <div className="tiny" style={{ marginTop: 4 }}>{m.ratio}% reply</div>
                </td>
                <td><span className="chip success"><span className="live-dot" />sent</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#25d366', display: 'grid', placeItems: 'center' }}><Icon name="chat" size={16} /></div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Live Preview · پیش نظارہ</div>
          <div className="small">As recipient sees it</div>
        </div>
      </div>
      <div style={{ padding: 20, background: 'linear-gradient(180deg, #075e54, #0a1535)', minHeight: 380 }}>
        <div style={{ maxWidth: 280, marginLeft: 'auto', background: '#dcf8c6', color: '#1a1a1a', padding: '10px 12px', borderRadius: '12px 4px 12px 12px', fontSize: 13, lineHeight: 1.5, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
          <div style={{ fontWeight: 700, color: '#075e54', marginBottom: 4 }}>Your Mandi · ٹماٹر منڈی</div>
          السلام علیکم *حاجی صاحب* 🍅<br />
          آج کا ریٹ:<br />
          ٹماٹر: Rs.2,400 / crate<br />
          Bardana available: Yes<br />
          تشریف لائیں — *Quetta Mandi B-12*
          <div style={{ textAlign: 'right', fontSize: 10, color: '#666', marginTop: 6 }}>14:42 ✓✓</div>
        </div>
        <div style={{ textAlign: 'center', margin: '14px 0', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>2,104 recipients</div>
        <div style={{ maxWidth: 220, background: 'white', color: '#1a1a1a', padding: '10px 12px', borderRadius: '4px 12px 12px 12px', fontSize: 13, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
          Theek hai, kal aata hoon. 5 trucks lounga.
          <div style={{ textAlign: 'right', fontSize: 10, color: '#666', marginTop: 6 }}>14:48</div>
        </div>
      </div>
    </div>
  </div>
);

const TemplatesView = () => (
  <div className="grid-3">
    {[
      { name: 'Daily Rate Update', ur: 'روزانہ ریٹ', vars: 3, used: 28, color: 'var(--orange-500)' },
      { name: 'New Stock Alert', ur: 'نیا اسٹاک', vars: 4, used: 14, color: 'var(--navy-400)' },
      { name: 'Payment Reminder', ur: 'یاد دہانی', vars: 5, used: 42, color: 'var(--success)' },
      { name: 'Eid Greetings', ur: 'عید مبارک', vars: 1, used: 1, color: 'var(--orange-500)' },
      { name: 'Bardana Available', ur: 'باردانہ', vars: 2, used: 8, color: 'var(--navy-400)' },
      { name: 'Custom', ur: 'حسب ضرورت', vars: 0, used: 0, color: 'var(--text-3)', empty: true },
    ].map((t, i) => (
      <div key={i} className="glass stat" style={{ cursor: 'pointer' }}>
        <div className="stat-head">
          <div className="stat-icon" style={{ borderColor: t.color, color: t.color }}><Icon name="file" /></div>
          {!t.empty && <span className="chip">{t.used} sent</span>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
        <div className="ur small">{t.ur}</div>
        <div className="small" style={{ marginTop: 8 }}>{t.empty ? 'Create new template' : `${t.vars} variables · WhatsApp approved`}</div>
      </div>
    ))}
  </div>
);

const InboxView = () => (
  <div className="glass" style={{ padding: 0 }}>
    {[
      { name: 'Haji Saleem', city: 'Quetta', msg: 'Theek hai, kal aata hoon. 5 trucks lounga.', time: '14:48', unread: true },
      { name: 'Ahmed Khan', city: 'Karachi', msg: 'Rate aaj kya hai? 200 crates chahiye.', time: '13:22', unread: true },
      { name: 'Wali Khan', city: 'Mastung', msg: 'Bardana abhi available hai?', time: '11:05', unread: false },
      { name: 'Bashir Sabzi', city: 'Lahore', msg: 'Payment kal kar dunga.', time: 'Yesterday', unread: false },
    ].map((m, i) => (
      <div key={i} className="row" style={{ padding: '14px 18px', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' }}>
        <div className="av">{m.name[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row between"><span style={{ fontWeight: 600, fontSize: 13 }}>{m.name} <span className="small">· {m.city}</span></span><span className="tiny">{m.time}</span></div>
          <div className="small" style={{ marginTop: 4, color: m.unread ? 'var(--text-1)' : 'var(--text-3)', fontWeight: m.unread ? 500 : 400 }}>{m.msg}</div>
        </div>
        {m.unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange-500)' }} />}
      </div>
    ))}
  </div>
);

const ContactsView = ({ suppliers, customers }) => {
  const contacts = [...suppliers.map(s => ({ ...s, group: 'Supplier' })), ...customers.map(c => ({ ...c, group: 'Customer' }))];
  return (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
    <div className="glass" style={{ padding: 0 }}>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Phone</th><th>City</th><th>Group</th><th>Last Msg</th><th>Engaged</th></tr></thead>
          <tbody>
            {contacts.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>No contacts yet — they appear here from entries.</td></tr>
            )}
            {contacts.slice(0, 12).map((c, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td className="mono small">{c.phone || '—'}</td>
                <td className="small">{c.city || '—'}</td>
                <td><span className="chip">{c.group}</span></td>
                <td className="small">{['2h ago', '5h ago', '1d ago', '3d ago', '1w ago'][i % 5]}</td>
                <td><div className="bar" style={{ width: 80 }}><span style={{ width: (40 + i * 7) + '%' }} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div className="glass" style={{ padding: 20 }}>
      <h3 className="h3" style={{ marginTop: 0 }}>Quick Upload</h3>
      <div style={{ border: '2px dashed var(--glass-border-strong)', borderRadius: 12, padding: 28, textAlign: 'center', marginTop: 12 }}>
        <Icon name="download" size={28} />
        <div style={{ marginTop: 10, fontWeight: 600, fontSize: 13 }}>Drop CSV / Excel</div>
        <div className="small" style={{ marginTop: 4 }}>Or browse files</div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}>Choose File</button>
      </div>
      <div className="divider" />
      <div className="small" style={{ lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text-1)' }}>Auto-sync sources:</strong><br />
        ✓ Supplier phones from new entries<br />
        ✓ Customer phones from new entries<br />
        ✓ Manual additions<br />
        ✓ CSV uploads (mapped)
      </div>
    </div>
  </div>
  );
};

export const MarketingPage = () => {
  const { suppliers, customers } = useApp();
  const [tab, setTab] = useState('campaigns');
  return (
    <Page titleEn="WhatsApp Marketing" titleUr="واٹس ایپ مارکیٹنگ" sub="Reach traders and customers · auto-pulled from new entries">
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <KPIBig icon="chat" en="Total Sent" ur="کل بھیجے" value="12,480" sub="last 90 days" trend="+18%" trendDir="up" />
        <KPIBig icon="check" en="Read Rate" ur="پڑھنے کی شرح" value="78.4%" sub="9,792 / 12,480" iconClass="green" trend="+3.1%" trendDir="up" />
        <KPIBig icon="phone" en="Reply Rate" ur="جواب کی شرح" value="6.9%" sub="861 replies" iconClass="blue" trend="+0.4%" trendDir="up" />
        <KPIBig icon="users" en="Active Contacts" ur="فعال نمبرز" value="2,508" sub="from entries + uploads" trend="+142 NEW" trendDir="up" />
      </div>

      <div className="row gap-sm" style={{ marginBottom: 16 }}>
        <div className="tabs">
          <div className={`tab ${tab === 'campaigns' ? 'active' : ''}`} onClick={() => setTab('campaigns')}>Campaigns · مہمات</div>
          <div className={`tab ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')}>Templates · سانچے</div>
          <div className={`tab ${tab === 'inbox' ? 'active' : ''}`} onClick={() => setTab('inbox')}>Inbox · جوابات</div>
          <div className={`tab ${tab === 'contacts' ? 'active' : ''}`} onClick={() => setTab('contacts')}>Contacts · رابطے</div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm"><Icon name="download" size={13} /> Upload CSV</button>
        <button className="btn btn-primary btn-sm"><Icon name="plus" size={13} /> New Campaign</button>
      </div>

      {tab === 'campaigns' && <CampaignsView />}
      {tab === 'templates' && <TemplatesView />}
      {tab === 'inbox' && <InboxView />}
      {tab === 'contacts' && <ContactsView suppliers={suppliers} customers={customers} />}
    </Page>
  );
};
