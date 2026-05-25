/* global React, ReactDOM */
const { useState: useStateApp, useEffect: useEffectApp } = React;

const App = () => {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "navy",
    "sidebar": "expanded",
    "density": "comfortable",
    "card": "elevated",
    "lang": "bilingual",
    "mode": "dark"
  }/*EDITMODE-END*/;

  const [tweaks, setTweaks] = useStateApp(TWEAK_DEFAULTS);
  const [route, setRoute] = useStateApp('dashboard');

  const setTweak = (k, v) => {
    const next = typeof k === 'object' ? {...tweaks, ...k} : {...tweaks, [k]: v};
    setTweaks(next);
    window.parent.postMessage({type: '__edit_mode_set_keys', edits: typeof k === 'object' ? k : {[k]: v}}, '*');
  };

  // edit-mode wiring
  const [editOpen, setEditOpen] = useStateApp(false);
  useEffectApp(() => {
    const handler = (e) => {
      if (!e.data || !e.data.type) return;
      if (e.data.type === '__activate_edit_mode') setEditOpen(true);
      else if (e.data.type === '__deactivate_edit_mode') setEditOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({type: '__edit_mode_available'}, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  // Apply tweaks to root
  useEffectApp(() => {
    const r = document.documentElement;
    r.dataset.theme = tweaks.theme;
    r.dataset.sidebar = tweaks.sidebar;
    r.dataset.density = tweaks.density;
    r.dataset.card = tweaks.card;
    r.dataset.lang = tweaks.lang;
    r.dataset.mode = tweaks.mode;
  }, [tweaks]);

  const go = (id) => { setRoute(id); window.scrollTo({top:0, behavior:'instant'}); };

  const PAGES = {
    'dashboard': window.DashboardPage,
    'new-entry': window.NewEntryPage,
    'all-entries': window.AllEntriesPage,
    'ledger': window.LedgerPage,
    'advances': window.AdvancesPage,
    'expenses': window.ExpensesPage,
    'reports': window.ReportsPage,
    'marketing': window.MarketingPage,
    'users': window.UsersPage,
    'settings': window.SettingsPage,
    'login': window.LoginPage,
  };
  const Cur = PAGES[route] || window.DashboardPage;

  if (route === 'login') {
    return (
      <window.AppCtx.Provider value={{ route, go, tweaks, setTweak }}>
        <Cur/>
        {editOpen && <TweaksUI tweaks={tweaks} setTweak={setTweak} onClose={()=>{setEditOpen(false); window.parent.postMessage({type:'__edit_mode_dismissed'},'*');}}/>}
      </window.AppCtx.Provider>
    );
  }

  return (
    <window.AppCtx.Provider value={{ route, go, tweaks, setTweak }}>
      <div className="app" data-screen-label={`${String(Object.keys(PAGES).indexOf(route)+1).padStart(2,'0')} ${route}`}>
        <window.Sidebar/>
        <Cur/>
      </div>
      {editOpen && <TweaksUI tweaks={tweaks} setTweak={setTweak} onClose={()=>{setEditOpen(false); window.parent.postMessage({type:'__edit_mode_dismissed'},'*');}}/>}
    </window.AppCtx.Provider>
  );
};

const TweaksUI = ({ tweaks, setTweak, onClose }) => (
  <window.TweaksPanel onClose={onClose}>
    <window.TweakSection title="Color theme" subtitle="Sample warmth vs agency brand">
      <window.TweakRadio value={tweaks.theme} onChange={(v)=>setTweak('theme', v)}
        options={[{label:'Navy', value:'navy'},{label:'Hybrid', value:'hybrid'},{label:'Warm', value:'warm'}]}/>
    </window.TweakSection>
    <window.TweakSection title="Mode">
      <window.TweakRadio value={tweaks.mode} onChange={(v)=>setTweak('mode', v)}
        options={[{label:'Dark', value:'dark'},{label:'Light', value:'light'}]}/>
    </window.TweakSection>
    <window.TweakSection title="Sidebar">
      <window.TweakRadio value={tweaks.sidebar} onChange={(v)=>setTweak('sidebar', v)}
        options={[{label:'Expanded', value:'expanded'},{label:'Collapsed', value:'collapsed'}]}/>
    </window.TweakSection>
    <window.TweakSection title="Density">
      <window.TweakRadio value={tweaks.density} onChange={(v)=>setTweak('density', v)}
        options={[{label:'Comfortable', value:'comfortable'},{label:'Compact', value:'compact'}]}/>
    </window.TweakSection>
    <window.TweakSection title="Card style">
      <window.TweakRadio value={tweaks.card} onChange={(v)=>setTweak('card', v)}
        options={[{label:'Elevated', value:'elevated'},{label:'Flat', value:'flat'},{label:'Bordered', value:'bordered'}]}/>
    </window.TweakSection>
    <window.TweakSection title="Language">
      <window.TweakRadio value={tweaks.lang} onChange={(v)=>setTweak('lang', v)}
        options={[{label:'Bilingual', value:'bilingual'},{label:'EN', value:'en'},{label:'UR', value:'ur'}]}/>
    </window.TweakSection>
  </window.TweaksPanel>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
