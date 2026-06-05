import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/ui/Icon';
import { Page } from '../components/layout/Page';
import { useApp } from '../context/AppContext';
import {
  fetchWaCampaigns,
  fetchWaTemplates,
  fetchInboxThreads,
  upsertWaTemplate,
  deleteWaTemplate,
  extractVariables,
} from '../lib/wa';
import { supabase } from '../lib/supabase';
import { CampaignWizard } from '../components/whatsapp/CampaignWizard';

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

const EmptyState = ({ icon = 'chat', title, hint, action }) => (
  <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
    <div style={{ opacity: 0.4, marginBottom: 12 }}><Icon name={icon} size={40} /></div>
    <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
    {hint && <div className="small" style={{ marginTop: 6 }}>{hint}</div>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

const LoadingRow = () => (
  <div className="glass" style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>
    <div className="live-dot" style={{ display: 'inline-block', marginRight: 8 }} />Loading…
  </div>
);

const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const same = d.toDateString() === now.toDateString();
  if (same) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const diff = (now - d) / 86400000;
  if (diff < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString();
};

// ─── Campaigns tab ────────────────────────────────────────────────────────────
const CampaignsView = ({ campaigns, loading, livePreview, onNew }) => {
  if (loading) return <LoadingRow />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
      <div className="glass" style={{ padding: 0 }}>
        {campaigns.length === 0 ? (
          <EmptyState
            icon="chat"
            title="No campaigns yet"
            hint="Create your first campaign to start reaching traders + customers."
            action={<button className="btn btn-primary btn-sm" onClick={onNew}><Icon name="plus" size={13} /> New Campaign</button>}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Campaign</th><th>Sent</th><th>Read</th><th>Replied</th><th>Outreach</th><th>Status</th></tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const readPct = c.sent ? Math.round((c.read / c.sent) * 100) : 0;
                  const replyPct = c.sent ? ((c.replied / c.sent) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div className="small">{c.scheduledAt ? `Scheduled ${fmtTime(c.scheduledAt)}` : 'Manual'} · {c.total} recipients</div>
                      </td>
                      <td className="num">{c.sent.toLocaleString()}</td>
                      <td className="num">{c.read.toLocaleString()} <span className="small">({readPct}%)</span></td>
                      <td className="num">{c.replied}</td>
                      <td style={{ width: 140 }}>
                        <div className="bar"><span style={{ width: readPct + '%' }} /></div>
                        <div className="tiny" style={{ marginTop: 4 }}>{replyPct}% reply</div>
                      </td>
                      <td><span className={`chip ${c.status === 'done' ? 'success' : c.status === 'failed' ? 'danger' : ''}`}>
                        {(c.status === 'running' || c.status === 'queued') && <span className="live-dot" />}{c.status}
                      </span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
          <div style={{ maxWidth: 280, marginLeft: 'auto', background: '#dcf8c6', color: '#1a1a1a', padding: '10px 12px', borderRadius: '12px 4px 12px 12px', fontSize: 13, lineHeight: 1.5, boxShadow: '0 2px 6px rgba(0,0,0,0.2)', whiteSpace: 'pre-wrap' }}>
            {livePreview || 'Pick a template to preview here.'}
            <div style={{ textAlign: 'right', fontSize: 10, color: '#666', marginTop: 6 }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Templates tab ────────────────────────────────────────────────────────────
const TemplateEditor = ({ initial, onSave, onCancel }) => {
  const [name, setName] = useState(initial?.name || '');
  const [nameUr, setNameUr] = useState(initial?.nameUr || '');
  const [body, setBody] = useState(initial?.body || '');
  const vars = useMemo(() => extractVariables(body), [body]);

  const save = async () => {
    if (!name.trim() || !body.trim()) { alert('Name + body required'); return; }
    await onSave({ id: initial?.id, name: name.trim(), nameUr: nameUr.trim(), body, variables: vars });
  };

  return (
    <div className="glass" style={{ padding: 16 }}>
      <h3 className="h3" style={{ marginTop: 0 }}>{initial ? 'Edit template' : 'New template'}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input className="input" placeholder="Name (English)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Name (اردو)" value={nameUr} onChange={(e) => setNameUr(e.target.value)} dir="rtl" />
      </div>
      <textarea
        className="input"
        rows={6}
        placeholder="Body — use {{name}}, {{rate}}, {{city}} for variables"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        style={{ marginTop: 10, width: '100%', fontFamily: 'inherit' }}
      />
      <div className="small" style={{ marginTop: 8 }}>
        Variables detected: {vars.length ? vars.map((v) => <span key={v} className="chip" style={{ marginRight: 4 }}>{`{{${v}}}`}</span>) : <em>none</em>}
      </div>
      <div className="row gap-sm" style={{ marginTop: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

const TemplatesView = ({ templates, loading, onPreview, onChanged }) => {
  const [editing, setEditing] = useState(null);   // null | 'new' | template object

  const handleSave = async (tpl) => {
    await upsertWaTemplate(tpl);
    setEditing(null);
    onChanged();
  };
  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    await deleteWaTemplate(id);
    onChanged();
  };

  if (loading) return <LoadingRow />;

  return (
    <div>
      {editing && (
        <div style={{ marginBottom: 16 }}>
          <TemplateEditor
            initial={editing === 'new' ? null : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}
      <div className="row" style={{ marginBottom: 12 }}>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Icon name="plus" size={13} /> New template</button>
      </div>
      {templates.length === 0 ? (
        <EmptyState icon="file" title="No templates yet" hint="Create a reusable WhatsApp template with {{variables}}." />
      ) : (
        <div className="grid-3">
          {templates.map((t) => (
            <div key={t.id} className="glass stat" style={{ cursor: 'pointer' }} onClick={() => onPreview(t)}>
              <div className="stat-head">
                <div className="stat-icon" style={{ borderColor: 'var(--orange-500)', color: 'var(--orange-500)' }}><Icon name="file" /></div>
                <span className="chip">{t.category}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
              {t.nameUr && <div className="ur small">{t.nameUr}</div>}
              <div className="small" style={{ marginTop: 8 }}>
                {t.variables.length} variables
              </div>
              <div className="row gap-sm" style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(t)}>Edit</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(t.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Inbox tab ────────────────────────────────────────────────────────────────
const InboxView = ({ threads, loading }) => {
  if (loading) return <LoadingRow />;
  if (threads.length === 0) {
    return <EmptyState icon="chat" title="No replies yet" hint="Incoming WhatsApp messages will appear here once your gateway is connected." />;
  }
  return (
    <div className="glass" style={{ padding: 0 }}>
      {threads.map((t, i) => (
        <div key={t.id} className="row" style={{ padding: '14px 18px', borderBottom: i < threads.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' }}>
          <div className="av">{(t.contact_name || t.chat_id || '?')[0].toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row between">
              <span style={{ fontWeight: 600, fontSize: 13 }}>{t.contact_name || t.chat_id?.split('@')[0]}</span>
              <span className="tiny">{fmtTime(t.last_at)}</span>
            </div>
            <div className="small" style={{ marginTop: 4, color: t.unread_count ? 'var(--text-1)' : 'var(--text-3)', fontWeight: t.unread_count ? 500 : 400 }}>
              {t.last_body || '—'}
            </div>
          </div>
          {t.unread_count > 0 && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange-500)' }} />}
        </div>
      ))}
    </div>
  );
};

// ─── Contacts tab ─────────────────────────────────────────────────────────────
const ContactsView = ({ suppliers, customers, setCustomers }) => {
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', city: '' });
  const [saving, setSaving] = useState(false);

  const contacts = [
    ...suppliers.map((s) => ({ ...s, group: 'Supplier' })),
    ...customers.map((c) => ({ ...c, group: 'Customer' })),
  ];
  const filtered = filter
    ? contacts.filter((c) => `${c.name} ${c.phone} ${c.city || ''}`.toLowerCase().includes(filter.toLowerCase()))
    : contacts;

  const handleAdd = async (e) => {
    e?.preventDefault?.();
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name) { alert('Name required'); return; }
    if (!phone) { alert('Phone required'); return; }
    setSaving(true);
    try {
      setCustomers((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name, phone, city: form.city.trim(), code: '', nickname: '', address: '' },
      ]);
      setForm({ name: '', phone: '', city: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
      <div className="glass" style={{ padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)' }}>
          <input
            className="input"
            placeholder="Search by name / phone / city"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Phone</th><th>City</th><th>Group</th></tr></thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>
                  {contacts.length === 0 ? 'No contacts yet — add one →' : 'No matches'}
                </td></tr>
              )}
              {filtered.slice(0, 200).map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td className="mono small">{c.phone || '—'}</td>
                  <td className="small">{c.city || '—'}</td>
                  <td><span className="chip">{c.group}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 200 && (
          <div className="tiny" style={{ padding: '8px 16px', color: 'var(--text-3)' }}>
            Showing first 200 of {filtered.length}. Use search to narrow.
          </div>
        )}
      </div>
      <div className="glass" style={{ padding: 20 }}>
        <h3 className="h3" style={{ marginTop: 0 }}>Add contact · شامل کریں</h3>
        <form onSubmit={handleAdd} className="col gap-sm" style={{ marginTop: 10 }}>
          <input className="input" placeholder="Name · نام"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Phone · 03001234567"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" placeholder="City · شہر (optional)"
            value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            <Icon name="plus" size={13} /> {saving ? 'Saving…' : 'Add to customers'}
          </button>
        </form>
        <div className="divider" />
        <div className="small" style={{ lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-1)' }}>Auto-pulled:</strong><br />
          ✓ Supplier phones from entries ({suppliers.filter((s) => s.phone).length})<br />
          ✓ Customer phones from entries ({customers.filter((c) => c.phone).length})<br />
          <br />
          <strong style={{ color: 'var(--text-1)' }}>Total reachable:</strong>{' '}
          {suppliers.filter((s) => s.phone).length + customers.filter((c) => c.phone).length}
        </div>
        <div className="divider" />
        <div className="tiny" style={{ opacity: 0.7 }}>
          CSV upload + opt-out list coming next.
        </div>
      </div>
    </div>
  );
};

// ─── KPI fetch ────────────────────────────────────────────────────────────────
const fetchKpis = async () => {
  // Aggregate wa_messages over last 90 days
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data, error } = await supabase
    .from('wa_messages')
    .select('status, direction, created_at')
    .gte('created_at', since)
    .limit(20000);
  if (error) throw error;

  const out = (data || []).filter((m) => m.direction === 'out');
  const totalSent = out.filter((m) => ['sent', 'delivered', 'read'].includes(m.status)).length;
  const reads = out.filter((m) => m.status === 'read').length;
  const replies = (data || []).filter((m) => m.direction === 'in').length;

  return {
    totalSent,
    readRate: totalSent ? ((reads / totalSent) * 100).toFixed(1) : '0.0',
    reads,
    replies,
  };
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export const MarketingPage = () => {
  const { suppliers, customers, setCustomers } = useApp();
  const [tab, setTab] = useState('campaigns');

  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [threads, setThreads] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const [loading, setLoading] = useState({ campaigns: true, templates: true, threads: true, kpis: true });
  const [wizardOpen, setWizardOpen] = useState(false);

  const reloadCampaigns = async () => {
    setLoading((l) => ({ ...l, campaigns: true }));
    try { setCampaigns(await fetchWaCampaigns()); }
    catch (e) { console.error(e); }
    finally { setLoading((l) => ({ ...l, campaigns: false })); }
  };
  const reloadTemplates = async () => {
    setLoading((l) => ({ ...l, templates: true }));
    try {
      const list = await fetchWaTemplates();
      setTemplates(list);
      if (!previewTemplate && list[0]) setPreviewTemplate(list[0]);
    } catch (e) { console.error(e); }
    finally { setLoading((l) => ({ ...l, templates: false })); }
  };
  const reloadThreads = async () => {
    setLoading((l) => ({ ...l, threads: true }));
    try { setThreads(await fetchInboxThreads({ limit: 100 })); }
    catch (e) { console.error(e); }
    finally { setLoading((l) => ({ ...l, threads: false })); }
  };
  const reloadKpis = async () => {
    setLoading((l) => ({ ...l, kpis: true }));
    try { setKpis(await fetchKpis()); }
    catch (e) { console.error(e); setKpis({ totalSent: 0, readRate: '0.0', reads: 0, replies: 0 }); }
    finally { setLoading((l) => ({ ...l, kpis: false })); }
  };

  useEffect(() => { reloadCampaigns(); reloadTemplates(); reloadThreads(); reloadKpis(); }, []);

  const activeContacts = suppliers.filter((s) => s.phone).length + customers.filter((c) => c.phone).length;
  const previewBody = previewTemplate?.body
    || (templates[0]?.body)
    || 'Select or create a template to see how it looks on WhatsApp.';

  const handleNewCampaign = () => setWizardOpen(true);

  return (
    <Page titleEn="WhatsApp Marketing" titleUr="واٹس ایپ مارکیٹنگ" sub="Reach traders and customers · auto-pulled from new entries">
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <KPIBig icon="chat"  en="Total Sent"   ur="کل بھیجے"      value={loading.kpis ? '…' : (kpis?.totalSent ?? 0).toLocaleString()} sub="last 90 days" />
        <KPIBig icon="check" en="Read Rate"    ur="پڑھنے کی شرح"   value={loading.kpis ? '…' : `${kpis?.readRate ?? '0.0'}%`} sub={`${(kpis?.reads ?? 0).toLocaleString()} / ${(kpis?.totalSent ?? 0).toLocaleString()}`} iconClass="green" />
        <KPIBig icon="phone" en="Replies"      ur="جوابات"          value={loading.kpis ? '…' : (kpis?.replies ?? 0).toLocaleString()} sub="incoming messages" iconClass="blue" />
        <KPIBig icon="users" en="Active Contacts" ur="فعال نمبرز"    value={activeContacts.toLocaleString()} sub="suppliers + customers with phone" />
      </div>

      <div className="row gap-sm" style={{ marginBottom: 16 }}>
        <div className="tabs">
          <div className={`tab ${tab === 'campaigns' ? 'active' : ''}`} onClick={() => setTab('campaigns')}>Campaigns · مہمات</div>
          <div className={`tab ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')}>Templates · سانچے</div>
          <div className={`tab ${tab === 'inbox' ? 'active' : ''}`} onClick={() => setTab('inbox')}>Inbox · جوابات</div>
          <div className={`tab ${tab === 'contacts' ? 'active' : ''}`} onClick={() => setTab('contacts')}>Contacts · رابطے</div>
        </div>
        <div style={{ flex: 1 }} />
        {tab === 'campaigns' && (
          <button className="btn btn-primary btn-sm" onClick={handleNewCampaign}><Icon name="plus" size={13} /> New Campaign</button>
        )}
      </div>

      {tab === 'campaigns' && <CampaignsView campaigns={campaigns} loading={loading.campaigns} livePreview={previewBody} onNew={handleNewCampaign} />}
      {tab === 'templates' && <TemplatesView templates={templates} loading={loading.templates} onPreview={setPreviewTemplate} onChanged={reloadTemplates} />}
      {tab === 'inbox'     && <InboxView    threads={threads} loading={loading.threads} />}
      {tab === 'contacts'  && <ContactsView suppliers={suppliers} customers={customers} setCustomers={setCustomers} />}

      {wizardOpen && (
        <CampaignWizard
          onClose={() => setWizardOpen(false)}
          onLaunched={() => { reloadCampaigns(); reloadKpis(); }}
        />
      )}
    </Page>
  );
};
