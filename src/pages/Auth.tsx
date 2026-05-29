import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Crown, LogIn, Eye, EyeOff, AlertCircle, Mail, Lock, Shield, Zap, Star } from 'lucide-react';
import { SEO } from '@/components/SEO';
import logoImg from "@/assets/logo.png";

const Auth = () => {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [error,       setError]       = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const { user, isLoading, signIn } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const returnTo  = (location.state as { returnTo?: string })?.returnTo || '/';

  useEffect(() => {
    if (!isLoading && user) navigate(returnTo, { replace: true });
  }, [user, isLoading, navigate, returnTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim())    { setError('Email kiriting'); return; }
    if (!password.trim()) { setError('Parol kiriting'); return; }
    if (password.length < 6) { setError('Parol kamida 6 ta belgi bo\'lishi kerak'); return; }

    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) setError('Email yoki parol noto\'g\'ri');
      else if (signInError.message.includes('Email not confirmed'))  setError('Email tasdiqlanmagan');
      else setError(signInError.message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  if (isLoading || user) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0B14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(124,111,255,0.2)', borderTopColor: '#7C6FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <SEO title="Kirish | Avtotest" description="Avtotest hisobingizga kiring." path="/auth" noIndex={true} />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-input::placeholder { color: rgba(255,255,255,0.2); }
        .auth-input:focus { border-color: rgba(124,111,255,0.5) !important; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0A0B14', display: 'flex' }}>

        {/* ── Chap — Brending (faqat desktop) ── */}
        <div style={{ display: 'none', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', position: 'relative', overflow: 'hidden' }}
          className="auth-left">
          <div style={{ position: 'absolute', top: '15%', left: '5%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(124,111,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 250, height: 250, background: 'radial-gradient(circle, rgba(0,201,196,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', textAlign: 'center', maxWidth: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
              <img src={logoImg} alt="Logo" style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'contain' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>AVTOTEST</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'linear-gradient(90deg, #F5A623, #FFD166)', borderRadius: 6, padding: '2px 8px', marginTop: 2 }}>
                  <Crown style={{ width: 11, height: 11, color: '#000' }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#000', letterSpacing: '0.06em' }}>PREMIUM</span>
                </div>
              </div>
            </div>

            <h2 style={{ margin: '0 0 16px', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: '#fff', lineHeight: 1.2, fontFamily: "'Syne', sans-serif" }}>
              Imtihondan birinchi urinishda o'ting
            </h2>
            <p style={{ margin: '0 0 32px', fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
              Haydovchilik guvohnomasi uchun eng zamonaviy test platformasi. 1200+ savollar va video darsliklar.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
              {[
                { icon: Shield, text: '1200+ maxsus savollar bazasi' },
                { icon: Zap,    text: 'Tezkor va qulay test interfeysi' },
                { icon: Star,   text: 'Premium guruh va admin yordami' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,111,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon style={{ width: 18, height: 18, color: '#7C6FFF' }} />
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── O'ng — Login formasi ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>

            {/* Mobile logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
              <img src={logoImg} alt="Logo" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'contain' }} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>AVTOTEST</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'linear-gradient(90deg, #F5A623, #FFD166)', borderRadius: 5, padding: '1px 7px' }}>
                  <Crown style={{ width: 9, height: 9, color: '#000' }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#000', letterSpacing: '0.06em' }}>PREMIUM</span>
                </div>
              </div>
            </div>

            {/* Card */}
            <div style={{ background: '#16172a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '28px 24px', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#fff' }}>Xush kelibsiz!</h2>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Hisobingizga kiring</p>
              </div>

              {error && (
                <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,95,109,0.1)', border: '1px solid rgba(255,95,109,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle style={{ width: 15, height: 15, color: '#FF5F6D', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#FF5F6D' }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 7 }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.25)' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      disabled={submitting}
                      className="auth-input"
                      style={{ width: '100%', padding: '11px 14px 11px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    />
                  </div>
                </div>

                {/* Parol */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 7 }}>Parol</label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.25)' }} />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Parolni kiriting"
                      disabled={submitting}
                      className="auth-input"
                      style={{ width: '100%', padding: '11px 44px 11px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
                      {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                    </button>
                  </div>
                </div>

                {/* Kirish tugmasi */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ marginTop: 6, padding: '13px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7C6FFF, #00C9C4)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(124,111,255,0.3)' }}
                >
                  {submitting ? (
                    <>
                      <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Tekshirilmoqda...
                    </>
                  ) : (
                    <><LogIn style={{ width: 17, height: 17 }} /> Kirish</>
                  )}
                </button>
              </form>

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button onClick={() => navigate('/')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                  ← Bosh sahifaga qaytish
                </button>
              </div>
            </div>

            <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
              Akkaunt ochish uchun adminstratorga murojaat qiling:<br />
              <a href="https://t.me/jumanazarov_0501" target="_blank" rel="noopener noreferrer"
                style={{ color: '#7C6FFF', fontWeight: 600, textDecoration: 'none' }}>
                @jumanazarov_0501
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <style>{`
        @media (min-width: 1024px) {
          .auth-left { display: flex !important; }
        }
      `}</style>
    </>
  );
};

export default Auth;
