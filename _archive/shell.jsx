/* global React */
const { useState, useEffect, useRef, useMemo, Fragment, createContext, useContext } = React;

// ===== ICONS (inline SVG) =====
const Icon = ({ name, size = 18, className = '' }) => {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    truck: <><path d="M3 6h11v9H3z"/><path d="M14 9h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
    wallet: <><path d="M3 7h15a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7Z"/><path d="M3 7V5a2 2 0 0 1 2-2h11"/><circle cx="17" cy="14" r="1.5"/></>,
    receipt: <><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
    chart: <><path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-7"/></>,
    chat: <><path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z"/></>,
    users: <><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="6" r="2.5"/><path d="M14.5 14c2.5 0 7 1 7 5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.6-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1 1-1 1.7"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></>,
    bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z"/><path d="M10.5 21a1.5 1.5 0 0 0 3 0"/></>,
    print: <><rect x="6" y="3" width="12" height="6"/><rect x="6" y="14" width="12" height="7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/></>,
    trash: <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
    filter: <><path d="M3 4h18l-7 9v7l-4-2v-5L3 4Z"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></>,
    phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13 1.05.37 2.07.72 3.06a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 6 6l2.02-1.29a2 2 0 0 1 2.11-.45c.99.35 2.01.59 3.06.72a2 2 0 0 1 1.72 2Z"/></>,
    location: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></>,
    money: <><circle cx="12" cy="12" r="9"/><path d="M9 9h4.5a2 2 0 0 1 0 4H9V9ZM9 13h5a2 2 0 0 1 0 4H9v-4ZM12 7v2M12 17v2"/></>,
    box: <><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></>,
    trend: <><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></>,
    check: <><path d="M20 6 9 17l-5-5"/></>,
    x: <><path d="M18 6 6 18M6 6l18 18" transform="scale(0.667)"/></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
    sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    bolt: <><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    rupee: <><path d="M6 4h12M6 9h12M9 4c4 0 5 3 5 5s-1 5-5 5h-3l8 7"/></>,
    wari: <><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></>,
    laga: <><rect x="4" y="6" width="16" height="13" rx="2"/><path d="M9 6V4a3 3 0 0 1 6 0v2"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[name] || <circle cx="12" cy="12" r="9"/>}
    </svg>
  );
};

// ===== HELPERS =====
const fmt = n => 'Rs. ' + Math.round(n).toLocaleString('en-IN');
const fmtShort = n => {
  if (Math.abs(n) >= 10000000) return 'Rs. ' + (n/10000000).toFixed(2) + ' Cr';
  if (Math.abs(n) >= 100000) return 'Rs. ' + (n/100000).toFixed(2) + ' L';
  if (Math.abs(n) >= 1000) return 'Rs. ' + (n/1000).toFixed(1) + 'k';
  return 'Rs. ' + n;
};

// ===== APP CONTEXT =====
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// ===== SIDEBAR =====
const NAV = [
  { id: 'dashboard', en: 'Dashboard', ur: 'ڈیش بورڈ', icon: 'dashboard' },
  { id: 'new-entry', en: 'New Entry', ur: 'نیا اندراج', icon: 'plus', accent: true },
  { id: 'all-entries', en: 'All Entries', ur: 'تمام اندراجات', icon: 'list', badge: '142' },
  { id: 'ledger', en: 'Ledger Search', ur: 'کھاتہ تلاش', icon: 'search' },
  { id: 'advances', en: 'Advances', ur: 'پیشگی ادائیگی', icon: 'wallet' },
  { id: 'expenses', en: 'Expenses', ur: 'اخراجات', icon: 'receipt' },
  { id: 'reports', en: 'Profit & Reports', ur: 'منافع و رپورٹ', icon: 'chart' },
  { id: 'marketing', en: 'WhatsApp Marketing', ur: 'مارکیٹنگ', icon: 'chat' },
  { id: 'users', en: 'Users', ur: 'صارفین', icon: 'users' },
  { id: 'settings', en: 'Settings', ur: 'ترتیبات', icon: 'settings' },
];

const Sidebar = () => {
  const { route, go, tweaks } = useApp();
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-logo">YM</div>
        <div className="sb-brand-text">
          <span className="name">Your Mandi</span>
          <span className="sub">Tomato Trading · Quetta</span>
        </div>
      </div>

      <nav className="sb-nav">
        <div className="sb-section">Main · مین</div>
        {NAV.slice(0, 7).map(it => (
          <a key={it.id} className={`sb-item ${route === it.id ? 'active' : ''}`} onClick={() => go(it.id)}>
            <Icon name={it.icon} />
            <span className="en-label">{it.en}</span>
            <span className="ur-label ur">{it.ur}</span>
            {it.badge && <span className="badge">{it.badge}</span>}
          </a>
        ))}
        <div className="sb-section">Tools · اوزار</div>
        {NAV.slice(7).map(it => (
          <a key={it.id} className={`sb-item ${route === it.id ? 'active' : ''}`} onClick={() => go(it.id)}>
            <Icon name={it.icon} />
            <span className="en-label">{it.en}</span>
            <span className="ur-label ur">{it.ur}</span>
          </a>
        ))}
      </nav>

      <div className="sb-help glass" style={{padding: 14, fontSize: 12, color: 'var(--text-2)'}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom: 6}}>
          <Icon name="bolt" size={14} />
          <strong style={{color: 'var(--orange-400)', fontSize: 11.5, textTransform:'uppercase', letterSpacing:'0.06em'}}>Pro Tip</strong>
        </div>
        <div style={{lineHeight: 1.5, marginBottom: 8}}>Press <span className="mono" style={{padding:'1px 5px',background:'var(--bg-elev-2)',borderRadius:4,fontSize:11}}>N</span> anytime to start a new entry.</div>
      </div>

      <a className="sb-item" onClick={() => go('login')} style={{color: 'var(--danger)'}}>
        <Icon name="logout" />
        <span className="en-label">Log Out</span>
        <span className="ur-label ur">لاگ آؤٹ</span>
      </a>
    </aside>
  );
};

// ===== TOPBAR =====
const Topbar = ({ titleEn, titleUr, sub }) => {
  const { go, tweaks, setTweak } = useApp();
  return (
    <header className="topbar">
      <button className="tb-icon" title="Toggle sidebar" onClick={() => {
        const next = tweaks.sidebar === 'expanded' ? 'collapsed' : 'expanded';
        setTweak('sidebar', next);
      }}><Icon name="menu" /></button>
      <div className="topbar-title">
        <span className="ur">{titleUr}</span>
        <span className="en">{titleEn} {sub && <span style={{color:'var(--text-4)'}}>· {sub}</span>}</span>
      </div>
      <div className="topbar-spacer" />
      <div className="tb-search">
        <Icon name="search" size={14} />
        <input placeholder="Search trader, customer, bilty…" />
        <span className="kbd">⌘K</span>
      </div>
      <button className="tb-icon" title="Notifications"><Icon name="bell" /><span className="dot"/></button>
      <button className="btn btn-primary btn-sm" onClick={() => go('new-entry')}>
        <Icon name="plus" size={14} /> New Entry
      </button>
      <div className="tb-avatar" title="Khalid Abbasi · Admin">K</div>
    </header>
  );
};

// ===== PAGE WRAPPER =====
const Page = ({ titleEn, titleUr, sub, children }) => (
  <main className="main">
    <Topbar titleEn={titleEn} titleUr={titleUr} sub={sub} />
    {children}
  </main>
);

window.Icon = Icon;
window.fmt = fmt;
window.fmtShort = fmtShort;
window.AppCtx = AppCtx;
window.useApp = useApp;
window.Sidebar = Sidebar;
window.Topbar = Topbar;
window.Page = Page;
window.NAV = NAV;
