import { useState } from 'react';
import { Icon } from '../components/ui/Icon';
import { Page } from '../components/layout/Page';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { clearAllData } from '../lib/db';
import { clearData } from '../utils/storage';

const SECTIONS = [
  ['General', 'عمومی', 'settings'],
  ['Rates & Charges', 'ریٹس', 'money'],
  ['Language', 'زبان', 'file'],
  ['WhatsApp API', 'واٹس ایپ', 'chat'],
  ['Backup', 'بیک اپ', 'download'],
  ['Billing', 'بلنگ', 'receipt'],
];

export const SettingsPage = () => {
  const { settings, setSettings, entries, suppliers, customers, advances, expenses, messages } = useApp();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [draft, setDraft] = useState(() => ({
    ...settings,
    rates: { ...settings.rates },
    print: { ...settings.print },
    whatsappApiKey: settings.whatsappApiKey || '',
    whatsappPhoneId: settings.whatsappPhoneId || '',
  }));
  const [section, setSection] = useState(0);
  const [saved, setSaved] = useState(false);

  const set = k => e => setDraft(prev => ({ ...prev, [k]: e.target.value }));
  const setRate = k => e => setDraft(prev => ({ ...prev, rates: { ...prev.rates, [k]: e.target.value } }));
  const setPrint = k => e => setDraft(prev => ({ ...prev, print: { ...prev.print, [k]: e.target.value } }));

  const handleSave = () => {
    setSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCancel = () => {
    setDraft({ ...settings, rates: { ...settings.rates }, print: { ...settings.print }, whatsappApiKey: settings.whatsappApiKey || '', whatsappPhoneId: settings.whatsappPhoneId || '' });
  };

  const handleClearData = async () => {
    const ok = await confirm({
      title: 'Clear All Data',
      message: 'This will permanently erase ALL entries, suppliers, customers, expenses, and advances from the database. This cannot be undone.',
      detail: `${entries.length} entries · ${suppliers.length} suppliers · ${advances.length} advances`,
      confirmLabel: 'Yes, Clear Everything',
      cancelLabel: 'Cancel',
      icon: 'trash',
      danger: true,
    });
    if (ok) {
      await clearAllData();
      clearData();
      window.location.reload();
    }
  };

  return (
    <Page titleEn="Settings" titleUr="ترتیبات" sub="Configure your mandi · rates, language, integrations">
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
        <div className="glass settings-nav" style={{ padding: 8, height: 'fit-content' }}>
          {SECTIONS.map(([en, ur, ic], i) => (
            <a key={i} className={`sb-item ${section === i ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setSection(i)}>
              <Icon name={ic} size={15} />
              <span className="en-label">{en}</span>
              <span className="ur-label ur">{ur}</span>
            </a>
          ))}
        </div>

        <div className="col gap-lg">
          {section === 0 && (
            <>
              <div className="glass" style={{ padding: 24 }}>
                <h2 className="h2">Mandi Profile · منڈی پروفائل</h2>
                <div className="spacer" />
                <div className="input-row">
                  <div className="field">
                    <div className="field-label"><span>Mandi Name</span><span className="ur">منڈی کا نام</span></div>
                    <input className="input" value={draft.mandiName} onChange={set('mandiName')} />
                  </div>
                  <div className="field">
                    <div className="field-label"><span>Owner</span><span className="ur">مالک</span></div>
                    <input className="input" value={draft.owner} onChange={set('owner')} />
                  </div>
                </div>
                <div className="spacer-sm" />
                <div className="input-row">
                  <div className="field">
                    <div className="field-label"><span>City</span><span className="ur">شہر</span></div>
                    <input className="input" value={draft.city} onChange={set('city')} />
                  </div>
                  <div className="field">
                    <div className="field-label"><span>Phone</span><span className="ur">فون</span></div>
                    <input className="input" value={draft.phone} onChange={set('phone')} />
                  </div>
                </div>
              </div>

              <div className="glass" style={{ padding: 24 }}>
                <h2 className="h2">Print Defaults · پرنٹ ترتیبات</h2>
                <div className="spacer" />
                <div className="input-row-3">
                  <div className="field">
                    <div className="field-label"><span>Receipt Size</span></div>
                    <select className="select" value={draft.print.receiptSize} onChange={setPrint('receiptSize')}>
                      <option>Thermal 80mm</option>
                      <option>A5</option>
                      <option>A4</option>
                    </select>
                  </div>
                  <div className="field">
                    <div className="field-label"><span>Print on Save</span></div>
                    <select className="select" value={draft.print.printOnSave} onChange={setPrint('printOnSave')}>
                      <option>Ask each time</option>
                      <option>Always</option>
                      <option>Never</option>
                    </select>
                  </div>
                  <div className="field">
                    <div className="field-label"><span>Logo on Receipt</span></div>
                    <select className="select" value={draft.print.logoOnReceipt} onChange={setPrint('logoOnReceipt')}>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {section === 1 && (
            <div className="glass" style={{ padding: 24 }}>
              <h2 className="h2">Default Rates · ڈیفالٹ ریٹس</h2>
              <div className="spacer" />
              <div className="input-row-3">
                <div className="field">
                  <div className="field-label"><span>Laga / crate</span><span className="ur">لاگا</span></div>
                  <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" value={draft.rates.laga} onChange={setRate('laga')} /></div>
                </div>
                <div className="field">
                  <div className="field-label"><span>Labour / crate</span><span className="ur">مزدوری</span></div>
                  <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" value={draft.rates.labour} onChange={setRate('labour')} /></div>
                </div>
                <div className="field">
                  <div className="field-label"><span>Wari / crate</span><span className="ur">نگواری</span></div>
                  <div className="input-prefix"><span className="pre">Rs.</span><input className="input num" value={draft.rates.wari} onChange={setRate('wari')} /></div>
                </div>
              </div>
              <div className="spacer-sm" />
              <div className="input-row">
                <div className="field">
                  <div className="field-label"><span>Commission Divisor</span><span className="ur">کمیشن تقسیم</span></div>
                  <input className="input num" value={draft.rates.commDiv} onChange={setRate('commDiv')} />
                </div>
                <div className="field">
                  <div className="field-label"><span>Default Crate Capacity</span><span className="ur">کریٹ گنجائش</span></div>
                  <input className="input" value={draft.rates.crateCapacity} onChange={setRate('crateCapacity')} />
                </div>
              </div>
            </div>
          )}

          {section === 2 && (
            <div className="glass" style={{ padding: 24 }}>
              <h2 className="h2">Language · زبان</h2>
              <div className="spacer" />
              <div className="small" style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
                Language display is controlled per-session via the Customize UI panel (palette icon in the sidebar).
                Options: Bilingual, English only, Urdu only.
              </div>
            </div>
          )}

          {section === 3 && (
            <div className="glass" style={{ padding: 24 }}>
              <h2 className="h2">WhatsApp API · واٹس ایپ</h2>
              <div className="spacer" />
              <div className="small" style={{ color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 16 }}>
                Connect your WhatsApp Business API to enable campaign sending from the Marketing module.
              </div>
              <div className="field" style={{ marginBottom: 14 }}>
                <div className="field-label"><span>API Key</span><span className="ur">اے پی آئی کی</span></div>
                <input className="input" type="password" placeholder="whatsapp_api_key_here" value={draft.whatsappApiKey} onChange={set('whatsappApiKey')} />
              </div>
              <div className="field">
                <div className="field-label"><span>Phone Number ID</span><span className="ur">فون نمبر آئی ڈی</span></div>
                <input className="input" placeholder="e.g. 1234567890" value={draft.whatsappPhoneId} onChange={set('whatsappPhoneId')} />
              </div>
              {(draft.whatsappApiKey || draft.whatsappPhoneId) && (
                <div className="chip success" style={{ marginTop: 12, display: 'inline-flex', gap: 6 }}>
                  <Icon name="check" size={12} /> API credentials saved
                </div>
              )}
            </div>
          )}

          {section === 4 && (
            <div className="glass" style={{ padding: 24 }}>
              <h2 className="h2">Backup · بیک اپ</h2>
              <div className="spacer" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="btn btn-ghost" onClick={() => {
                  const data = { entries, suppliers, customers, advances, expenses, messages, settings };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `mandi_backup_${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}>
                  <Icon name="download" size={13} /> Export All Data (JSON)
                </button>
                <div className="divider" />
                <div className="small" style={{ color: 'var(--danger)', fontWeight: 600 }}>Danger Zone</div>
                <button className="btn btn-ghost" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleClearData}>
                  <Icon name="trash" size={13} /> Clear All Data
                </button>
              </div>
            </div>
          )}

          {section === 5 && (
            <div className="glass" style={{ padding: 24 }}>
              <h2 className="h2">Billing · بلنگ</h2>
              <div className="spacer" />
              <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div className="chip active" style={{ marginBottom: 10 }}>Starter Plan</div>
                  <div className="small" style={{ lineHeight: 1.8 }}>
                    ✓ Up to 3 users<br />
                    ✓ Unlimited entries<br />
                    ✓ localStorage persistence<br />
                    ✓ Export to JSON<br />
                    ✗ WhatsApp campaigns<br />
                    ✗ Cloud sync<br />
                    ✗ Multi-branch
                  </div>
                </div>
                <button className="btn btn-primary">Upgrade Plan</button>
              </div>
            </div>
          )}

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Icon name="check" size={13} /> {saved ? 'Saved ✓' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      {confirmDialog}
    </Page>
  );
};
