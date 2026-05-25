import { useState, useEffect, useCallback } from 'react';
import { AppCtx } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TweaksPanel, TweakSection, TweakRadio } from './components/ui/TweaksPanel';
import { DashboardPage } from './pages/Dashboard';
import { NewEntryPage } from './pages/NewEntry';
import { AllEntriesPage, LedgerPage } from './pages/Entries';
import { AdvancesPage, ExpensesPage, ReportsPage } from './pages/Finance';
import { PartnersPage } from './pages/Partners';
import { MarketingPage } from './pages/Marketing';
import { UsersPage } from './pages/Users';
import { LoginPage } from './pages/Login';
import { SettingsPage } from './pages/Settings';
import {
  getStoredSession,
  signIn,
  signOut,
  loadAllData,
  saveFullEntry,
  deleteTruckRecord,
  upsertSupplier,
  upsertCustomer,
  upsertAdvance,
  deleteAdvance,
  upsertExpenseRow,
  deleteExpenseRow,
  upsertAppUser,
  deleteAppUser,
  upsertPartner,
  deletePartner,
  upsertPartnerPayment,
  deletePartnerPayment,
} from './lib/db';

const TWEAK_DEFAULTS = {
  theme: 'navy',
  sidebar: 'expanded',
  density: 'comfortable',
  card: 'elevated',
  lang: 'bilingual',
  mode: 'light',
};

const EMPTY_EXPENSES = { labour: [], utility: [], food: [], rent: [], parking: [], salary: [], charity: [] };

const DEFAULT_SETTINGS = {
  mandiName: 'Your Mandi · Tomato Trading',
  owner: 'Khalid Abbasi',
  city: 'Quetta',
  phone: '0301-2345678',
  rates: { laga: 10, labour: 10, wari: 5, commDiv: 13.78, crateCapacity: '20 kg' },
  print: { receiptSize: 'Thermal 80mm', printOnSave: 'Ask each time', logoOnReceipt: 'Yes' },
  whatsappApiKey: '',
  whatsappPhoneId: '',
};

const DEFAULT_USERS = [
  { id: 'U1', name: 'Khalid Abbasi', role: 'Admin', email: 'khalid@yourmandi.pk', last: 'Just now', status: 'active' },
];

const PAGES = {
  dashboard: DashboardPage,
  'new-entry': NewEntryPage,
  'all-entries': AllEntriesPage,
  ledger: LedgerPage,
  advances: AdvancesPage,
  expenses: ExpensesPage,
  reports: ReportsPage,
  partners: PartnersPage,
  marketing: MarketingPage,
  users: UsersPage,
  settings: SettingsPage,
  login: LoginPage,
};

export default function App() {
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [route, setRoute] = useState('login');
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [entries, setEntriesState] = useState([]);
  const [suppliers, setSuppliersState] = useState([]);
  const [customers, setCustomersState] = useState([]);
  const [advances, setAdvancesState] = useState([]);
  const [expenses, setExpensesState] = useState(EMPTY_EXPENSES);
  const [partners, setPartnersState] = useState([]);
  const [users, setUsersState] = useState(DEFAULT_USERS);
  const [messages, setMessagesState] = useState([]);
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);

  // ─── Load all data from Supabase ─────────────────────────────────────────────
  const loadUserData = useCallback(async () => {
    setDataLoading(true);
    try {
      const data = await loadAllData();
      applyData(data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  const applyData = (data) => {
    setEntriesState(data.entries || []);
    setSuppliersState(data.suppliers || []);
    setCustomersState(data.customers || []);
    setAdvancesState(data.advances || []);
    setExpensesState(data.expenses || EMPTY_EXPENSES);
    setPartnersState(data.partners || []);
    setMessagesState(data.messages || []);
    if (data.users?.length) setUsersState(data.users);
    if (data.settings) setSettingsState(data.settings);
  };

  // ─── Auth — custom session from localStorage ────────────────────────────────
  useEffect(() => {
    const session = getStoredSession();
    setAuthUser(session);
    setAuthLoading(false);
    if (session) {
      setRoute('dashboard');
      loadUserData();
    }
  }, [loadUserData]);

  // Removed the second useEffect that was double-loading data on authUser change

  // ─── Wrapped setters — update state + persist to Supabase ──────────────────

  const setEntries = useCallback((updater) => {
    setEntriesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const prevIds = new Set(prev.map(e => e.id));
      const nextIds = new Set(next.map(e => e.id));
      next.forEach(e => {
        if (!prevIds.has(e.id) || JSON.stringify(prev.find(p => p.id === e.id)) !== JSON.stringify(e))
          saveFullEntry(e).catch(err => {
            console.error('DB save failed:', err);
            alert(`Save failed: ${err?.message || err}. Check console for details.`);
          });
      });
      prev.forEach(e => { if (!nextIds.has(e.id)) deleteTruckRecord(e.id).catch(console.error); });
      return next;
    });
  }, []);

  const setSuppliers = useCallback((updater) => {
    setSuppliersState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const prevIds = new Set(prev.map(s => s.id));
      next.forEach(s => {
        if (s.id && (!prevIds.has(s.id) || JSON.stringify(prev.find(p => p.id === s.id)) !== JSON.stringify(s)))
          upsertSupplier(s).catch(console.error);
      });
      return next;
    });
  }, []);

  const setCustomers = useCallback((updater) => {
    setCustomersState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const prevIds = new Set(prev.map(c => c.id));
      next.forEach(c => {
        if (c.id && (!prevIds.has(c.id) || JSON.stringify(prev.find(p => p.id === c.id)) !== JSON.stringify(c)))
          upsertCustomer(c).catch(console.error);
      });
      return next;
    });
  }, []);


  const setAdvances = useCallback((updater) => {
    setAdvancesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const prevIds = new Set(prev.map(a => a.id));
      const nextIds = new Set(next.map(a => a.id));
      next.forEach(a => {
        if (!prevIds.has(a.id) || JSON.stringify(prev.find(p => p.id === a.id)) !== JSON.stringify(a))
          upsertAdvance(a).catch(console.error);
      });
      prev.forEach(a => { if (!nextIds.has(a.id)) deleteAdvance(a.id).catch(console.error); });
      return next;
    });
  }, []);

  const setExpenses = useCallback((updater) => {
    setExpensesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Diff individual expense items across all categories
      const flatten = obj => Object.entries(obj).flatMap(([type, arr]) =>
        (arr || []).map(e => ({ ...e, type }))
      );
      const prevFlat = flatten(prev);
      const nextFlat = flatten(next);
      const prevIds = new Set(prevFlat.map(e => e.id));
      const nextIds = new Set(nextFlat.map(e => e.id));
      nextFlat.forEach(e => {
        if (e.id && (!prevIds.has(e.id) || JSON.stringify(prevFlat.find(p => p.id === e.id)) !== JSON.stringify(e)))
          upsertExpenseRow(e).catch(console.error);
      });
      prevFlat.forEach(e => {
        if (e.id && !nextIds.has(e.id)) deleteExpenseRow(e.id).catch(console.error);
      });
      return next;
    });
  }, []);

  const setPartners = useCallback((updater) => {
    setPartnersState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const prevById = Object.fromEntries(prev.map(p => [p.id, p]));
      const nextIds  = new Set(next.map(p => p.id));

      next.forEach(p => {
        const prevP = prevById[p.id];
        const { payments: np, ...pData }   = p;
        const { payments: pp, ...prevPData } = prevP || {};
        if (!prevP || JSON.stringify(pData) !== JSON.stringify(prevPData))
          upsertPartner(p).catch(console.error);

        const prevPays   = prevP?.payments || [];
        const nextPays   = p.payments || [];
        const prevPayIds = new Set(prevPays.map(x => x.id));
        const nextPayIds = new Set(nextPays.map(x => x.id));
        nextPays.forEach(pay => {
          const old = prevPays.find(x => x.id === pay.id);
          if (!prevPayIds.has(pay.id) || JSON.stringify(old) !== JSON.stringify(pay))
            upsertPartnerPayment({ ...pay, partnerId: p.id }).catch(console.error);
        });
        prevPays.forEach(pay => {
          if (!nextPayIds.has(pay.id)) deletePartnerPayment(pay.id).catch(console.error);
        });
      });

      prev.forEach(p => { if (!nextIds.has(p.id)) deletePartner(p.id).catch(console.error); });
      return next;
    });
  }, []);

  const setMessages = useCallback((updater) => {
    setMessagesState(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, []);

  const setUsers = useCallback((updater) => {
    setUsersState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const prevIds = new Set(prev.map(u => u.id));
      const nextIds = new Set(next.map(u => u.id));
      next.forEach(u => {
        if (!prevIds.has(u.id) || JSON.stringify(prev.find(p => p.id === u.id)) !== JSON.stringify(u))
          upsertAppUser(u).catch(console.error);
      });
      prev.forEach(u => { if (!nextIds.has(u.id)) deleteAppUser(u.id).catch(console.error); });
      return next;
    });
  }, []);

  const setSettings = useCallback((updater) => {
    setSettingsState(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, []);

  // ─── UI tweaks ──────────────────────────────────────────────────────────────
  const setTweak = (k, v) => {
    setTweaks(prev => typeof k === 'object' ? { ...prev, ...k } : { ...prev, [k]: v });
  };

  useEffect(() => {
    const r = document.documentElement;
    r.dataset.theme = tweaks.theme;
    r.dataset.sidebar = tweaks.sidebar;
    r.dataset.density = tweaks.density;
    r.dataset.card = tweaks.card;
    r.dataset.lang = tweaks.lang;
    r.dataset.mode = tweaks.mode;
  }, [tweaks]);

  useEffect(() => {
    const handler = e => {
      if (e.key === 'n' || e.key === 'N') {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        go('new-entry');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const go = id => {
    setRoute(id);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleLogin = async (emailOrUser, password) => {
    const { data, error } = await signIn(emailOrUser, password);
    if (error) return { error };
    setAuthUser(data.user);
    setRoute('dashboard');
    loadUserData();
    return { error: null };
  };

  const handleLogout = () => {
    signOut();
    setAuthUser(null);
    setRoute('login');
    setEntriesState([]);
    setSuppliersState([]);
    setCustomersState([]);
    setAdvancesState([]);
    setExpensesState(EMPTY_EXPENSES);
    setPartnersState([]);
    setMessagesState([]);
    setUsersState(DEFAULT_USERS);
    setSettingsState(DEFAULT_SETTINGS);
  };

  // ─── Loading screen ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-app)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <div className="live-dot" style={{ display: 'inline-block', marginBottom: 12 }} />
          <div style={{ fontSize: 14 }}>Loading…</div>
        </div>
      </div>
    );
  }

  const Cur = PAGES[route] || DashboardPage;

  const ctxValue = {
    route, go, tweaks, setTweak,
    mobileNavOpen, setMobileNavOpen,
    authUser, handleLogin, handleLogout,
    dataLoading,
    entries, setEntries,
    suppliers, setSuppliers,
    customers, setCustomers,
    advances, setAdvances,
    expenses, setExpenses,
    partners, setPartners,
    users, setUsers,
    messages, setMessages,
    settings, setSettings,
    editingEntry, setEditingEntry,
  };

  if (route === 'login' || !authUser) {
    return (
      <AppCtx.Provider value={ctxValue}>
        <LoginPage />
      </AppCtx.Provider>
    );
  }

  return (
    <AppCtx.Provider value={ctxValue}>
      <div className="app">
        <Sidebar onOpenTweaks={() => setTweaksOpen(true)} />
        {mobileNavOpen && <div className="mobile-overlay" onClick={() => setMobileNavOpen(false)} />}
        {dataLoading ? (
          <div style={{ display: 'grid', placeItems: 'center', flex: 1, color: 'var(--text-3)', fontSize: 14 }}>
            <div><div className="live-dot" style={{ display: 'inline-block', marginRight: 8 }} />Loading your data…</div>
          </div>
        ) : (
          <Cur />
        )}
      </div>
      <TweaksPanel title="Customize UI" open={tweaksOpen} onClose={() => setTweaksOpen(false)}>
        <TweakSection title="Color theme">
          <TweakRadio value={tweaks.theme} onChange={v => setTweak('theme', v)}
            options={[{ label: 'Navy', value: 'navy' }, { label: 'Hybrid', value: 'hybrid' }, { label: 'Warm', value: 'warm' }]} />
        </TweakSection>
        <TweakSection title="Mode">
          <TweakRadio value={tweaks.mode} onChange={v => setTweak('mode', v)}
            options={[{ label: 'Dark', value: 'dark' }, { label: 'Light', value: 'light' }]} />
        </TweakSection>
        <TweakSection title="Sidebar">
          <TweakRadio value={tweaks.sidebar} onChange={v => setTweak('sidebar', v)}
            options={[{ label: 'Expanded', value: 'expanded' }, { label: 'Collapsed', value: 'collapsed' }]} />
        </TweakSection>
        <TweakSection title="Density">
          <TweakRadio value={tweaks.density} onChange={v => setTweak('density', v)}
            options={[{ label: 'Comfortable', value: 'comfortable' }, { label: 'Compact', value: 'compact' }]} />
        </TweakSection>
        <TweakSection title="Card style">
          <TweakRadio value={tweaks.card} onChange={v => setTweak('card', v)}
            options={[{ label: 'Elevated', value: 'elevated' }, { label: 'Flat', value: 'flat' }, { label: 'Bordered', value: 'bordered' }]} />
        </TweakSection>
        <TweakSection title="Language">
          <TweakRadio value={tweaks.lang} onChange={v => setTweak('lang', v)}
            options={[{ label: 'Bilingual', value: 'bilingual' }, { label: 'EN', value: 'en' }, { label: 'UR', value: 'ur' }]} />
        </TweakSection>
      </TweaksPanel>
    </AppCtx.Provider>
  );
}
