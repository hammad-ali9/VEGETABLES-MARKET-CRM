import { useState } from 'react';
import { Icon } from '../components/ui/Icon';
import { useApp } from '../context/AppContext';

export const LoginPage = () => {
  const { handleLogin } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    setError('');
    if (!email.trim()) { setError('Please enter your username or email.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    const { error: authError } = await handleLogin(email.trim(), password);
    setLoading(false);
    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Incorrect username or password. Please try again.'
        : authError.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSignIn();
  };

  return (
    <div className="login-root">

      {/* ── Left hero panel (hidden on mobile) ── */}
      <div className="login-hero">
        <div className="row">
          <div className="sb-logo" style={{ width: 48, height: 48 }}>YM</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Your Mandi</div>
            <div className="small">Tomato Trading CRM</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 14, color: 'var(--orange-400)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Pakistan's Mandi Operating System
          </div>
          <h1 className="h-display login-hero-headline">
            Run your<br />tomato auction<br />like a pro.
          </h1>
          <p className="body" style={{ maxWidth: 480, fontSize: 16, lineHeight: 1.6 }}>
            One truck in. Many buyers out. Track every laga, wari, and rupee — in Urdu and English, with WhatsApp built in.
          </p>
          <div className="row gap-sm" style={{ marginTop: 32, flexWrap: 'wrap' }}>
            <span className="chip"><span className="tomato" />Trusted by 14 mandis</span>
            <span className="chip">Urdu-first · اردو</span>
            <span className="chip">WhatsApp Sync</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* CTA card */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>Want this for your mandi?</div>
              <div style={{ fontSize: 12, color: 'var(--text-4)', lineHeight: 1.5 }}>We'll set it up for you — any city, any fruit.</div>
            </div>
            <button
              type="button"
              onClick={() => { window.location.href = 'mailto:contact@khata.nexauratechs.com'; }}
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #f5a623, #e8890a)', color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '0.03em', padding: '9px 16px', borderRadius: 8, whiteSpace: 'nowrap', boxShadow: '0 2px 12px rgba(245,166,35,0.35)', border: 'none', cursor: 'pointer' }}
            >
              ✉ Get in Touch
            </button>
          </div>

          {/* Footer line */}
          <div className="small" style={{ color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            <span>© 2026</span>
            <a href="https://www.nexauratechs.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent, #f5a623)', textDecoration: 'none', fontWeight: 600 }}>Nexaura Technologies</a>
            <span>· Built for Fruit Mandi Traders &amp; Arhtis</span>
          </div>
        </div>

        {/* Glow orb */}
        <div style={{ position: 'absolute', top: '40%', right: '-20%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(255,167,38,0.18), transparent 60%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      </div>

      {/* ── Right form panel ── */}
      <div className="login-form-col">
        <div className="glass-strong login-card">

          {/* Brand mark shown only on mobile (hero is hidden) */}
          <div className="row gap-sm login-mobile-brand" style={{ marginBottom: 28 }}>
            <div className="sb-logo" style={{ width: 40, height: 40 }}>YM</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Your Mandi</div>
              <div className="small">Tomato Trading CRM</div>
            </div>
          </div>

          <h2 className="h1" style={{ marginBottom: 6 }}>Welcome back</h2>
          <p className="ur" style={{ fontSize: 16, color: 'var(--text-3)', marginBottom: 32 }}>دوبارہ خوش آمدید</p>

          <div className="col gap-lg">
            <div className="field">
              <div className="field-label">
                <span>Email</span>
                <span className="ur">ای میل</span>
              </div>
              <input
                className="input"
                type="email"
                placeholder="you@yourmandi.pk"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="email"
              />
            </div>

            <div className="field">
              <div className="field-label">
                <span>Password</span>
                <a className="small" style={{ color: 'var(--orange-400)', cursor: 'pointer' }}>Forgot? · بھول گئے؟</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={16} />
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--danger)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary btn-lg"
              onClick={handleSignIn}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1, width: '100%', justifyContent: 'center' }}
            >
              {loading ? 'Signing in…' : <>Sign In · داخلہ <Icon name="arrow" size={14} /></>}
            </button>

            <div className="row" style={{ justifyContent: 'center' }}>
              <span className="small">Need help? · مدد چاہئے؟ <a style={{ color: 'var(--orange-400)' }}>Contact admin</a></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-4)', fontSize: 11 }}>
              <span style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
              SECURE LOGIN
              <span style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
            </div>

            <div className="row gap-sm" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className="chip">📱 SMS OTP</span>
              <span className="chip">🔐 2FA</span>
              <span className="chip">📞 PIN</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
