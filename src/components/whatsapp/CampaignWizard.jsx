import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../ui/Icon';
import {
  fetchWaSessions, fetchWaTemplates, resolveAudience,
  createWaCampaign, insertCampaignMessages, updateWaCampaign,
  extractVariables,
} from '../../lib/wa';
import { sendBulk, phoneToChatId, renderTemplate } from '../../lib/openwa';

const BULK_LIMIT = 100;
const STEPS = ['Name', 'Session', 'Template', 'Audience', 'Review'];

const STEP_OK = {
  0: (s) => s.name.trim().length >= 2,
  1: (s) => !!s.sessionId,
  2: (s) => !!s.templateId,
  3: (s) => s.audience.length > 0,
  4: () => true,
};

const ContactField = ({ value, onChange }) => (
  <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="">— literal value —</option>
    <option value="name">name</option>
    <option value="phone">phone</option>
    <option value="city">city</option>
    <option value="code">code</option>
    <option value="__custom__">custom value…</option>
  </select>
);

export const CampaignWizard = ({ onClose, onLaunched }) => {
  const [step, setStep] = useState(0);
  const [sessions, setSessions]   = useState([]);
  const [templates, setTemplates] = useState([]);
  const [meta, setMeta] = useState({ cities: [] });

  const [state, setState] = useState({
    name: '',
    sessionId: '',
    templateId: '',
    varMap: {},          // { varName: 'name' | 'phone' | 'city' | 'code' | literal-string }
    customVars: {},      // { varName: literal string when varMap[var] === '__custom__' }
    audience: [],        // resolved rows: { contactId, contactType, name, phone, city }
    groups: ['supplier', 'customer'],
    selectedCities: [],
    delaySec: 3,
    randomize: true,
  });
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState(null);

  const tpl = templates.find((t) => t.id === state.templateId);
  const session = sessions.find((s) => s.id === state.sessionId);
  const variables = useMemo(() => (tpl ? extractVariables(tpl.body) : []), [tpl]);

  useEffect(() => {
    (async () => {
      try {
        const [sess, tpls] = await Promise.all([fetchWaSessions(), fetchWaTemplates()]);
        setSessions(sess.filter((s) => ['ready', 'authenticated'].includes(s.status)));
        setTemplates(tpls);
      } catch (e) { setError(String(e.message || e)); }
    })();
  }, []);

  // Auto-map known variables when template changes
  useEffect(() => {
    if (!variables.length) return;
    const next = { ...state.varMap };
    variables.forEach((v) => {
      if (next[v] === undefined) {
        if (['name', 'phone', 'city', 'code'].includes(v.toLowerCase())) next[v] = v.toLowerCase();
        else next[v] = '__custom__';
      }
    });
    setState((s) => ({ ...s, varMap: next }));
  }, [variables.join('|')]);

  // ─── Audience resolve (debounced on filter change) ─────────────────────────
  useEffect(() => {
    if (step !== 3) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await resolveAudience({
          groups: state.groups,
          cities: state.selectedCities,
        });
        if (cancelled) return;
        const cities = [...new Set(list.map((r) => r.city).filter(Boolean))].sort();
        setMeta((m) => ({ ...m, cities }));
        setState((s) => ({ ...s, audience: list }));
      } catch (e) {
        if (!cancelled) setError(String(e.message || e));
      }
    })();
    return () => { cancelled = true; };
  }, [step, state.groups.join('|'), state.selectedCities.join('|')]);

  // ─── Render helpers ────────────────────────────────────────────────────────
  const buildVars = (row) => {
    const out = {};
    for (const v of variables) {
      const mapVal = state.varMap[v];
      if (mapVal === '__custom__') out[v] = state.customVars[v] ?? '';
      else if (mapVal && row[mapVal] !== undefined) out[v] = String(row[mapVal] ?? '');
      else out[v] = '';
    }
    return out;
  };

  const sample = state.audience[0];
  const samplePreview = useMemo(() => {
    if (!tpl || !sample) return '';
    return renderTemplate(tpl.body, buildVars(sample));
  }, [tpl, sample, state.varMap, state.customVars]);

  // ─── Launch ────────────────────────────────────────────────────────────────
  const launch = async () => {
    setLaunching(true);
    setError(null);
    const audience = state.audience.slice(0, BULK_LIMIT);

    try {
      const campaign = await createWaCampaign({
        name: state.name.trim(),
        sessionId: state.sessionId,
        templateId: state.templateId,
        audience: { groups: state.groups, cities: state.selectedCities, count: audience.length },
        status: 'queued',
        total: audience.length,
      });

      // Build per-recipient payload
      const rows = audience.map((r) => {
        const vars = buildVars(r);
        const body = renderTemplate(tpl.body, vars);
        return {
          contactId: r.contactId, contactType: r.contactType,
          phone: r.phone, chatId: phoneToChatId(r.phone), body, vars,
        };
      }).filter((r) => r.chatId);

      await insertCampaignMessages(campaign.id, state.sessionId, rows);

      const payload = {
        batchId: campaign.id,
        messages: rows.map((r) => ({
          chatId: r.chatId,
          type: 'text',
          content: { text: r.body },
          variables: r.vars,
        })),
        options: {
          delayBetweenMessages: Math.max(1000, state.delaySec * 1000),
          randomizeDelay: state.randomize,
          stopOnError: false,
        },
      };

      const res = await sendBulk(session.openwaId, payload);

      await updateWaCampaign(campaign.id, {
        status: 'running',
        openwaBatchId: res.batchId || campaign.id,
        startedAt: new Date().toISOString(),
      });

      onLaunched?.(campaign);
      onClose();
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLaunching(false);
    }
  };

  // ─── Step content ──────────────────────────────────────────────────────────
  const Step = () => {
    switch (step) {
      case 0: return (
        <div>
          <div className="field-label"><span>Campaign name</span><span className="ur">مہم کا نام</span></div>
          <input className="input" placeholder="e.g. Tomato Auction Wed"
            value={state.name} onChange={(e) => setState({ ...state, name: e.target.value })} autoFocus />
          <div className="small" style={{ marginTop: 10, color: 'var(--text-3)' }}>Used in campaign list only — recipients don't see it.</div>
        </div>
      );

      case 1: return (
        <div>
          <div className="field-label">Pick a WhatsApp session</div>
          {sessions.length === 0 ? (
            <div className="chip danger">No active sessions. Settings → WhatsApp → Connect a number first.</div>
          ) : (
            <div className="col gap-sm">
              {sessions.map((s) => (
                <label key={s.id} className="row" style={{ padding: 10, border: '1px solid var(--glass-border)', borderRadius: 8, cursor: 'pointer', gap: 10 }}>
                  <input type="radio" name="sess" checked={state.sessionId === s.id} onChange={() => setState({ ...state, sessionId: s.id })} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{s.label}</div>
                    <div className="small mono" style={{ color: 'var(--text-3)' }}>{s.phone || s.openwaId}</div>
                  </div>
                  <span className="chip success">{s.status}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      );

      case 2: return (
        <div>
          <div className="field-label">Pick a template</div>
          {templates.length === 0 ? (
            <div className="chip danger">No templates yet. Marketing → Templates → New template.</div>
          ) : (
            <select className="select" value={state.templateId} onChange={(e) => setState({ ...state, templateId: e.target.value, varMap: {}, customVars: {} })}>
              <option value="">— select —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          {tpl && (
            <>
              <div className="divider" />
              <div className="small" style={{ marginBottom: 8 }}>Map variables → contact fields</div>
              {variables.length === 0 ? (
                <div className="small" style={{ color: 'var(--text-3)' }}>No variables in this template.</div>
              ) : (
                <table className="table">
                  <thead><tr><th>Variable</th><th>Source</th><th>Custom value</th></tr></thead>
                  <tbody>
                    {variables.map((v) => (
                      <tr key={v}>
                        <td className="mono">{`{{${v}}}`}</td>
                        <td>
                          <ContactField value={state.varMap[v] || ''} onChange={(val) => setState({ ...state, varMap: { ...state.varMap, [v]: val } })} />
                        </td>
                        <td>
                          {state.varMap[v] === '__custom__' && (
                            <input className="input" placeholder="literal text"
                              value={state.customVars[v] || ''}
                              onChange={(e) => setState({ ...state, customVars: { ...state.customVars, [v]: e.target.value } })} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="divider" />
              <div className="small">Body:</div>
              <pre style={{ background: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13 }}>{tpl.body}</pre>
            </>
          )}
        </div>
      );

      case 3: return (
        <div>
          <div className="field-label">Audience filter</div>
          <div className="row gap-sm" style={{ marginBottom: 10 }}>
            {['supplier', 'customer'].map((g) => (
              <label key={g} className="chip" style={{ cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={state.groups.includes(g)}
                  onChange={(e) => setState({
                    ...state,
                    groups: e.target.checked ? [...state.groups, g] : state.groups.filter((x) => x !== g),
                  })}
                  style={{ marginRight: 6 }}
                />
                {g === 'supplier' ? 'Suppliers' : 'Customers'}
              </label>
            ))}
          </div>
          {meta.cities.length > 0 && (
            <>
              <div className="small" style={{ margin: '10px 0 6px' }}>Cities (empty = all)</div>
              <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
                {meta.cities.map((c) => (
                  <label key={c} className={`chip ${state.selectedCities.includes(c) ? 'success' : ''}`} style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={state.selectedCities.includes(c)}
                      onChange={(e) => setState({
                        ...state,
                        selectedCities: e.target.checked
                          ? [...state.selectedCities, c]
                          : state.selectedCities.filter((x) => x !== c),
                      })}
                      style={{ display: 'none' }}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </>
          )}
          <div className="divider" />
          <div className="row between">
            <div className="num num-xl">{state.audience.length}</div>
            <div className="small" style={{ textAlign: 'right' }}>
              recipients (opt-outs + duplicates removed)<br />
              {state.audience.length > BULK_LIMIT && <span className="chip warning">First {BULK_LIMIT} will send. Chunking coming in v2.</span>}
            </div>
          </div>
        </div>
      );

      case 4: return (
        <div>
          <div className="row" style={{ gap: 16 }}>
            <div style={{ flex: 1 }}>
              <h3 className="h3" style={{ marginTop: 0 }}>Review</h3>
              <table className="table">
                <tbody>
                  <tr><td className="small">Name</td><td><strong>{state.name}</strong></td></tr>
                  <tr><td className="small">Session</td><td>{session?.label}</td></tr>
                  <tr><td className="small">Template</td><td>{tpl?.name}</td></tr>
                  <tr><td className="small">Recipients</td><td><strong>{Math.min(state.audience.length, BULK_LIMIT)}</strong> {state.audience.length > BULK_LIMIT && <span className="tiny">(of {state.audience.length})</span>}</td></tr>
                  <tr><td className="small">Delay between</td><td>
                    <input type="number" className="input num" min={1} max={60} style={{ width: 80 }}
                      value={state.delaySec} onChange={(e) => setState({ ...state, delaySec: Math.max(1, +e.target.value || 3) })}
                    /> seconds
                  </td></tr>
                  <tr><td className="small">Randomize delay</td><td>
                    <label className="row" style={{ gap: 6 }}>
                      <input type="checkbox" checked={state.randomize}
                        onChange={(e) => setState({ ...state, randomize: e.target.checked })} />
                      ±1s jitter
                    </label>
                  </td></tr>
                </tbody>
              </table>
              <div className="small" style={{ marginTop: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                Estimated send time: ~{Math.round((Math.min(state.audience.length, BULK_LIMIT) * state.delaySec) / 60)} min
              </div>
            </div>
            <div style={{ width: 280 }}>
              <div className="small" style={{ marginBottom: 6 }}>Preview (first recipient)</div>
              <div style={{ background: '#dcf8c6', color: '#1a1a1a', padding: '10px 12px', borderRadius: '12px 4px 12px 12px', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {samplePreview || <em>No audience yet.</em>}
              </div>
              {sample && <div className="tiny" style={{ marginTop: 6, color: 'var(--text-3)' }}>To: {sample.name} ({sample.phone})</div>}
            </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  const canNext = STEP_OK[step](state);

  return (
    <div style={backdrop} onClick={launching ? undefined : onClose}>
      <div className="glass" style={modalBox} onClick={(e) => e.stopPropagation()}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <h2 className="h2" style={{ margin: 0 }}>New Campaign</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={launching}><Icon name="x" size={13} /></button>
        </div>

        {/* Stepper */}
        <div className="row" style={{ gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
          {STEPS.map((label, i) => (
            <div key={label} className={`chip ${i === step ? 'success' : i < step ? '' : ''}`}
              style={{ opacity: i > step ? 0.4 : 1, cursor: i < step ? 'pointer' : 'default' }}
              onClick={() => i < step && setStep(i)}>
              {i + 1}. {label}
            </div>
          ))}
        </div>

        <div style={{ minHeight: 280 }}><Step /></div>

        {error && <div className="chip danger" style={{ marginTop: 12, display: 'block' }}>{error}</div>}

        <div className="divider" />
        <div className="row between">
          <button className="btn btn-ghost btn-sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || launching}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary btn-sm" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Next <Icon name="arrow" size={13} />
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={launch} disabled={launching || state.audience.length === 0}>
              {launching ? 'Launching…' : <>Launch <Icon name="bolt" size={13} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const backdrop = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'grid', placeItems: 'center', zIndex: 1000, padding: 16,
};
const modalBox = { padding: 24, width: 720, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto' };
