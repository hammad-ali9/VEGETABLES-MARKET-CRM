import { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icon';
import { fetchWaSessions, upsertWaSession, deleteWaSession } from '../../lib/wa';
import {
  listSessions as gwListSessions,
  createSession as gwCreateSession,
  startSession  as gwStartSession,
  stopSession   as gwStopSession,
  getQr         as gwGetQr,
  getSession    as gwGetSession,
  deleteSession as gwDeleteSession,
} from '../../lib/openwa';

const STATUS_COLOR = {
  ready:           'success',
  authenticated:   'success',
  qr:              'warning',
  qr_ready:        'warning',
  authenticating:  'warning',
  initializing:    '',
  created:         '',
  pending:         '',
  disconnected:    'danger',
  failed:          'danger',
};

const StatusChip = ({ status }) => {
  const tone = STATUS_COLOR[status] ?? '';
  const live = ['qr', 'qr_ready', 'authenticating', 'initializing'].includes(status);
  return <span className={`chip ${tone}`}>{live && <span className="live-dot" />}{status || 'unknown'}</span>;
};

// ─── QR modal ────────────────────────────────────────────────────────────────
const QrModal = ({ session, onClose, onAuthenticated }) => {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState(session.status || 'initializing');
  const [err, setErr] = useState(null);
  const stopRef = useRef(false);

  useEffect(() => {
    stopRef.current = false;
    let timer;

    const poll = async () => {
      if (stopRef.current) return;
      try {
        const s = await gwGetSession(session.openwaId);
        setStatus(s.status);
        if (s.status === 'ready' || s.status === 'authenticated') {
          await upsertWaSession({
            id: session.id, openwaId: session.openwaId,
            label: session.label, phone: s.phone || session.phone,
            status: s.status,
          });
          onAuthenticated();
          return;
        }
        if (s.status === 'qr_ready' || s.status === 'qr') {
          try {
            const q = await gwGetQr(session.openwaId);
            if (q?.qrCode) setQr(q.qrCode);
          } catch (_) { /* QR not ready yet */ }
        }
      } catch (e) {
        setErr(String(e.message || e));
      }
      timer = setTimeout(poll, 2500);
    };
    poll();
    return () => { stopRef.current = true; if (timer) clearTimeout(timer); };
  }, [session.openwaId]);

  return (
    <div style={modalBackdrop} onClick={onClose}>
      <div className="glass" style={modalBox} onClick={(e) => e.stopPropagation()}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <h3 className="h3" style={{ margin: 0 }}>Scan QR — {session.label}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={13} /></button>
        </div>
        <div className="small" style={{ marginBottom: 14, lineHeight: 1.5 }}>
          1. Open WhatsApp on your phone<br />
          2. Tap <strong>Settings → Linked Devices → Link a Device</strong><br />
          3. Point camera at the code below
        </div>

        <div style={qrBox}>
          {err && <div className="chip danger">{err}</div>}
          {!err && qr && <img src={qr} alt="QR" style={{ width: 260, height: 260, background: '#fff', padding: 8, borderRadius: 8 }} />}
          {!err && !qr && (
            <div style={{ color: 'var(--text-3)', textAlign: 'center' }}>
              <div className="live-dot" style={{ display: 'inline-block', marginRight: 6 }} />
              Waiting for QR… status: <strong>{status}</strong>
            </div>
          )}
        </div>

        <div className="small" style={{ marginTop: 14, textAlign: 'center' }}>
          Status: <StatusChip status={status} />
        </div>
      </div>
    </div>
  );
};

const modalBackdrop = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
  display: 'grid', placeItems: 'center', zIndex: 1000,
};
const modalBox = { padding: 24, width: 400, maxWidth: '92vw' };
const qrBox = {
  display: 'grid', placeItems: 'center', minHeight: 280,
  background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14,
};

// ─── Main component ──────────────────────────────────────────────────────────
export const SessionsManager = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [qrSession, setQrSession] = useState(null);
  const [gatewayStatus, setGatewayStatus] = useState({ ok: null, msg: 'checking…' });

  const url = import.meta.env.VITE_OPENWA_URL;
  const keyConfigured = !!import.meta.env.VITE_OPENWA_KEY;

  const refresh = async () => {
    setLoading(true);
    try {
      const local = await fetchWaSessions();
      setSessions(local);

      if (!url) {
        setGatewayStatus({ ok: false, msg: 'VITE_OPENWA_URL not set' });
        return;
      }
      try {
        const remote = await gwListSessions();
        const remoteById = Object.fromEntries((remote || []).map((r) => [r.id, r]));
        // Sync local rows with remote status
        const merged = local.map((s) => {
          const r = remoteById[s.openwaId];
          return r ? { ...s, status: r.status, phone: r.phone || s.phone } : s;
        });
        setSessions(merged);
        setGatewayStatus({ ok: true, msg: 'connected' });
      } catch (e) {
        setGatewayStatus({ ok: false, msg: String(e.message || e) });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleCreate = async () => {
    const label = newLabel.trim();
    if (!label) { alert('Pick a label (e.g. "Quetta Mandi")'); return; }
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (slug.length < 3) { alert('Label too short (need at least 3 letters/digits)'); return; }

    setCreating(true);
    try {
      const remote = await gwCreateSession({ name: slug });
      await gwStartSession(remote.id);
      const row = {
        id: crypto.randomUUID(),
        openwaId: remote.id,
        label,
        status: remote.status || 'initializing',
      };
      await upsertWaSession(row);
      setNewLabel('');
      await refresh();
      setQrSession(row);
    } catch (e) {
      alert(`Could not create session: ${e.message || e}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDisconnect = async (s) => {
    if (!confirm(`Disconnect ${s.label}? You'll need to re-scan QR to reconnect.`)) return;
    try {
      await gwStopSession(s.openwaId).catch(() => {});
      await upsertWaSession({ ...s, status: 'disconnected' });
      refresh();
    } catch (e) { alert(e.message || e); }
  };

  const handleDelete = async (s) => {
    if (!confirm(`Permanently delete ${s.label}? This removes it from the gateway too.`)) return;
    try {
      await gwDeleteSession(s.openwaId).catch(() => {});
      await deleteWaSession(s.id);
      refresh();
    } catch (e) { alert(e.message || e); }
  };

  const handleReconnect = (s) => setQrSession(s);

  return (
    <div className="glass" style={{ padding: 24 }}>
      <h2 className="h2">WhatsApp Sessions · واٹس ایپ سیشن</h2>
      <div className="small" style={{ color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>
        Connect WhatsApp numbers via the OpenWA gateway. Each session = one WA account on a separate phone.
      </div>

      {/* Gateway health */}
      <div className="row" style={{ alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <span className={`chip ${gatewayStatus.ok === true ? 'success' : gatewayStatus.ok === false ? 'danger' : ''}`}>
          {gatewayStatus.ok === null && <span className="live-dot" />}
          Gateway: {gatewayStatus.msg}
        </span>
        {url && <span className="mono small" style={{ color: 'var(--text-3)' }}>{url}</span>}
        {!keyConfigured && url && <span className="chip danger">VITE_OPENWA_KEY missing</span>}
      </div>

      {/* Create */}
      <div className="row gap-sm" style={{ marginBottom: 18 }}>
        <input
          className="input"
          placeholder='Label e.g. "Quetta Mandi B-12"'
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          style={{ maxWidth: 320 }}
          disabled={creating || !gatewayStatus.ok}
        />
        <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={creating || !gatewayStatus.ok}>
          <Icon name="plus" size={13} /> {creating ? 'Creating…' : 'Connect new number'}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="small" style={{ color: 'var(--text-3)' }}><span className="live-dot" style={{ display: 'inline-block', marginRight: 6 }} />Loading sessions…</div>
      ) : sessions.length === 0 ? (
        <div className="small" style={{ color: 'var(--text-3)', textAlign: 'center', padding: 24 }}>
          No sessions yet. Add one above to start sending messages.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Label</th><th>Phone</th><th>Status</th><th style={{ width: 220 }}>Actions</th></tr></thead>
            <tbody>
              {sessions.map((s) => {
                const live = ['ready', 'authenticated'].includes(s.status);
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.label}<div className="tiny mono" style={{ color: 'var(--text-3)' }}>{s.openwaId}</div></td>
                    <td className="mono small">{s.phone || '—'}</td>
                    <td><StatusChip status={s.status} /></td>
                    <td>
                      <div className="row gap-sm">
                        {!live && <button className="btn btn-ghost btn-sm" onClick={() => handleReconnect(s)}>QR</button>}
                        {live  && <button className="btn btn-ghost btn-sm" onClick={() => handleDisconnect(s)}>Disconnect</button>}
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(s)}><Icon name="trash" size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="divider" />
      <div className="tiny" style={{ color: 'var(--text-3)', lineHeight: 1.6 }}>
        <strong>Tip:</strong> Use a separate WhatsApp number per purpose (transactional, marketing). Warm new numbers for ~2 weeks before bulk sending. Avoid spammy templates — bans are sticky.
      </div>

      {qrSession && (
        <QrModal
          session={qrSession}
          onClose={() => { setQrSession(null); refresh(); }}
          onAuthenticated={() => { setQrSession(null); refresh(); }}
        />
      )}
    </div>
  );
};
