import { useState } from 'react';
import { Icon } from '../components/ui/Icon';
import { Page } from '../components/layout/Page';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../components/ui/ConfirmDialog';

const MAX_USERS = 3;

const InviteModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Salesman' });
  const [showPw, setShowPw] = useState(false);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) { alert('Name required.'); return; }
    if (!form.email.trim()) { alert('Username / email required.'); return; }
    if (!form.password.trim()) { alert('Password required.'); return; }
    onSave({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      last: 'Just now',
      status: 'active',
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)' }}>
          <div className="row">
            <div style={{ flex: 1 }}>
              <h2 className="h2">Add User · صارف شامل کریں</h2>
              <div className="small">Grant access to this mandi</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div className="field" style={{ marginBottom: 14 }}>
            <div className="field-label"><span>Full Name <span className="req">*</span></span><span className="ur">نام</span></div>
            <input className="input" placeholder="e.g. Ahmed Khan" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <div className="field-label"><span>Username / Email <span className="req">*</span></span><span className="ur">صارف نام</span></div>
            <input className="input" placeholder="username or email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <div className="field-label"><span>Password <span className="req">*</span></span><span className="ur">پاسورڈ</span></div>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="Set a password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
                <Icon name={showPw ? 'eye-off' : 'eye'} size={16} />
              </button>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 24 }}>
            <div className="field-label"><span>Role</span><span className="ur">کردار</span></div>
            <select className="select" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="Admin">Admin · ایڈمن</option>
              <option value="Accountant">Accountant · محاسب</option>
              <option value="Salesman">Salesman · سیلزمین</option>
            </select>
          </div>
          <div className="row gap-sm" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}><Icon name="plus" size={13} /> Add User</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditModal = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState({ name: user.name, email: user.email, role: user.role, newPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) { alert('Name and username required.'); return; }
    const updated = { ...user, name: form.name.trim(), email: form.email.trim(), role: form.role };
    if (form.newPassword.trim()) updated.password = form.newPassword.trim();
    onSave(updated);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)' }}>
          <div className="row">
            <div style={{ flex: 1 }}>
              <h2 className="h2">Edit User · صارف ترمیم</h2>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div className="field" style={{ marginBottom: 14 }}>
            <div className="field-label"><span>Full Name <span className="req">*</span></span></div>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <div className="field-label"><span>Username / Email <span className="req">*</span></span></div>
            <input className="input" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <div className="field-label">
              <span>New Password</span>
              <span className="small" style={{ color: 'var(--text-3)' }}>Leave blank to keep current</span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter new password…"
                value={form.newPassword}
                onChange={e => set('newPassword', e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
                <Icon name={showPw ? 'eye-off' : 'eye'} size={16} />
              </button>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 24 }}>
            <div className="field-label"><span>Role</span></div>
            <select className="select" value={form.role} onChange={e => set('role', e.target.value)} disabled={user.role === 'Admin'}>
              <option value="Admin">Admin · ایڈمن</option>
              <option value="Accountant">Accountant · محاسب</option>
              <option value="Salesman">Salesman · سیلزمین</option>
            </select>
            {user.role === 'Admin' && <div className="small" style={{ marginTop: 4, color: 'var(--text-3)' }}>Admin role cannot be changed.</div>}
          </div>
          <div className="row gap-sm" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}><Icon name="check" size={13} /> Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UsersPage = () => {
  const { users, setUsers } = useApp();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const handleAdd = user => setUsers(prev => [...prev, user]);
  const handleEdit = updated => setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  const handleRemove = async (id) => {
    const user = users.find(u => u.id === id);
    const ok = await confirm({
      title: 'Remove User',
      message: 'This user account will be permanently removed. They will no longer be able to log in.',
      detail: user ? `${user.name} · ${user.role} · ${user.email || 'no email'}` : undefined,
      confirmLabel: 'Remove User',
    });
    if (ok) setUsers(prev => prev.filter(u => u.id !== id));
  };

  const canInvite = users.length < MAX_USERS;

  return (
    <Page titleEn="Users & Permissions" titleUr="صارفین و اجازت" sub="Up to 3 users · Admin sees everything, others have limited access">
      <div className="row" style={{ marginBottom: 24 }}>
        <div className="glass-strong" style={{ padding: 20, flex: 1, marginRight: 16 }}>
          <div className="row" style={{ alignItems: 'baseline', gap: 16 }}>
            <div className="num" style={{ fontSize: 44, fontWeight: 800, color: 'var(--orange-400)' }}>{users.length}</div>
            <div className="num" style={{ fontSize: 22, color: 'var(--text-3)' }}>/ {MAX_USERS}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Active users</div>
              <div className="small">{canInvite ? `${MAX_USERS - users.length} seat${MAX_USERS - users.length !== 1 ? 's' : ''} available` : 'Plan limit reached — upgrade for more seats'}</div>
            </div>
            {!canInvite && <button className="btn btn-primary btn-sm">Upgrade plan</button>}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => canInvite && setShowModal(true)} disabled={!canInvite}>
          <Icon name="plus" size={13} /> Invite User
        </button>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        {users.map(u => (
          <div key={u.id} className="glass" style={{ padding: 20 }}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <div className="row">
                <div className={`av ${u.role === 'Admin' ? 'orange' : ''}`} style={{ width: 44, height: 44, fontSize: 16 }}>{u.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                  <div className="small">{u.email}</div>
                </div>
              </div>
              <span className={`chip ${u.role === 'Admin' ? 'active' : ''}`}>{u.role}</span>
            </div>
            <div className="divider" />
            <div className="small" style={{ lineHeight: 1.8 }}>
              <div className="row between"><span>Last active</span><span style={{ color: 'var(--text-1)' }}>{u.last}</span></div>
              <div className="row between"><span>Status</span><span className="chip success" style={{ fontSize: 10 }}>{u.status}</span></div>
            </div>
            <div className="row gap-sm" style={{ marginTop: 14 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setEditUser(u)}>Edit</button>
              {u.role !== 'Admin' && (
                <button className="btn btn-ghost btn-sm" onClick={() => handleRemove(u.id)}><Icon name="trash" size={13} /></button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="glass" style={{ padding: 0 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--glass-border)' }}>
          <strong>Permission Matrix · اجازت میٹرکس</strong>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Capability</th><th>Admin</th><th>Accountant</th><th>Salesman</th></tr></thead>
            <tbody>
              {[
                ['View Dashboard', true, true, true],
                ['Create New Entry', true, true, true],
                ['View All Entries', true, true, 'own only'],
                ['Edit / Delete Entries', true, true, false],
                ['Manage Advances', true, true, false],
                ['Log Expenses', true, true, false],
                ['View Profit & Reports', true, false, false],
                ['Marketing / WhatsApp', true, false, false],
                ['Manage Users', true, false, false],
                ['Settings', true, false, false],
              ].map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{r[0]}</td>
                  {r.slice(1).map((v, j) => (
                    <td key={j}>
                      {v === true && <span style={{ color: 'var(--success)' }}><Icon name="check" size={16} /></span>}
                      {v === false && <span style={{ color: 'var(--danger)', opacity: 0.5 }}>✕</span>}
                      {typeof v === 'string' && <span className="chip warn">{v}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <InviteModal onClose={() => setShowModal(false)} onSave={handleAdd} />}
      {editUser && <EditModal user={editUser} onClose={() => setEditUser(null)} onSave={handleEdit} />}
      {confirmDialog}
    </Page>
  );
};
