import { useApp } from '../../context/AppContext';
import { Icon } from '../ui/Icon';
import { signOut as dbSignOut } from '../../lib/db';

export const NAV = [
  { id: 'dashboard',   en: 'Dashboard',         ur: 'ڈیش بورڈ',         icon: 'dashboard' },
  { id: 'new-entry',   en: 'New Entry',          ur: 'نیا اندراج',        icon: 'plus',      accent: true },
  { id: 'all-entries', en: 'All Entries',        ur: 'تمام اندراجات',     icon: 'list' },
  { id: 'ledger',      en: 'Ledger Search',      ur: 'کھاتہ تلاش',        icon: 'search' },
  { id: 'advances',    en: 'Advances',           ur: 'پیشگی ادائیگی',     icon: 'wallet' },
  { id: 'expenses',    en: 'Expenses',           ur: 'اخراجات',           icon: 'receipt' },
  { id: 'reports',     en: 'Profit & Reports',   ur: 'منافع و رپورٹ',     icon: 'chart' },
  { id: 'partners',    en: 'Partners',           ur: 'شراکت دار',         icon: 'handshake' },
  { id: 'marketing',   en: 'WhatsApp Marketing', ur: 'مارکیٹنگ',          icon: 'chat' },
  { id: 'users',       en: 'Users',              ur: 'صارفین',            icon: 'users' },
  { id: 'settings',    en: 'Settings',           ur: 'ترتیبات',           icon: 'settings' },
];

export const Sidebar = ({ onOpenTweaks }) => {
  const { route, go, mobileNavOpen, setMobileNavOpen, settings, handleLogout } = useApp();
  const mandiName = settings?.mandiName?.split('·')[0]?.trim() || 'Your Mandi';
  const mandiSub = settings?.mandiName?.includes('·') ? settings.mandiName.split('·').slice(1).join('·').trim() : (settings?.city || 'Pak');
  return (
    <aside className={`sidebar${mobileNavOpen ? ' mobile-open' : ''}`}>
      <div className="sb-brand">
        <div className="sb-logo">
          <img src="/assets/agency-logo.jpeg" alt="NT" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
        </div>
        <div className="sb-brand-text">
          <span className="name">{mandiName}</span>
          <span className="sub">{mandiSub}</span>
        </div>
        <button
          className="mobile-close-btn"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close menu"
          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 18, padding: 4, lineHeight: 1 }}
        >✕</button>
      </div>

      <nav className="sb-nav">
        <div className="sb-section">Main · مین</div>
        {NAV.slice(0, 8).map(it => (
          <a
            key={it.id}
            data-tip={it.en}
            className={`sb-item ${route === it.id ? 'active' : ''}`}
            onClick={() => go(it.id)}
          >
            <Icon name={it.icon} />
            <span className="en-label">{it.en}</span>
            <span className="ur-label ur">{it.ur}</span>
          </a>
        ))}
        <div className="sb-section">Tools · اوزار</div>
        {NAV.slice(8).map(it => (
          <a
            key={it.id}
            data-tip={it.en}
            className={`sb-item ${route === it.id ? 'active' : ''}`}
            onClick={() => go(it.id)}
          >
            <Icon name={it.icon} />
            <span className="en-label">{it.en}</span>
            <span className="ur-label ur">{it.ur}</span>
          </a>
        ))}
      </nav>

      <a
        data-tip="Log Out"
        className="sb-item"
        onClick={() => { if (window.confirm('Log out?')) handleLogout?.(); }}
        style={{ color: 'var(--danger)', marginTop: 'auto' }}
      >
        <Icon name="logout" />
        <span className="en-label">Log Out</span>
        <span className="ur-label ur">لاگ آؤٹ</span>
      </a>
    </aside>
  );
};
