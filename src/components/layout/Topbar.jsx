import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../ui/Icon';

export const Topbar = ({ titleEn, titleUr, sub }) => {
  const { go, tweaks, setTweak, setMobileNavOpen, settings } = useApp();
  const [search, setSearch] = useState('');
  const ownerName = settings?.owner || 'Admin';
  const avatar = ownerName[0]?.toUpperCase() || 'A';

  const handleMenuToggle = () => {
    if (window.innerWidth <= 768) {
      setMobileNavOpen(prev => !prev);
    } else {
      setTweak('sidebar', tweaks.sidebar === 'expanded' ? 'collapsed' : 'expanded');
    }
  };

  return (
    <header className="topbar">
      <button className="tb-icon" title="Menu" onClick={handleMenuToggle}>
        <Icon name="menu" />
      </button>
      <div className="topbar-title">
        <span className="ur">{titleUr}</span>
        <span className="en">{titleEn}{sub && <span style={{ color: 'var(--text-4)' }}> · {sub}</span>}</span>
      </div>
      <div className="topbar-spacer" />
      <div className="tb-search">
        <Icon name="search" size={14} />
        <input
          placeholder="Search trader, customer, bilty…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && search.trim()) go('ledger');
          }}
        />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 12, padding: '0 4px' }}>✕</button>}
        <span className="kbd">⌘K</span>
      </div>
      <button className="tb-icon" title="Notifications">
        <Icon name="bell" />
      </button>
      <button className="btn btn-primary btn-sm tb-new-entry" onClick={() => go('new-entry')}>
        <Icon name="plus" size={14} /> <span className="tb-new-label">New Entry</span>
      </button>
      <div className="tb-avatar" title={ownerName}>{avatar}</div>
    </header>
  );
};
