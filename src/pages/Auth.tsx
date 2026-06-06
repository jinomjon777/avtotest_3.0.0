import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Crown, LogIn, Eye, EyeOff, AlertCircle, Mail, Lock, Shield, Zap, Star } from "lucide-react";
import { SEO } from "@/components/SEO";
import logoImg from "@/assets/logo.png";

const Auth = () => {
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [error,      setError]      = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { user, isLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string })?.returnTo || "/";

  useEffect(() => {
    if (!isLoading && user) navigate(returnTo, { replace: true });
  }, [user, isLoading, navigate, returnTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim())       { setError("Email kiriting"); return; }
    if (!password.trim())    { setError("Parol kiriting"); return; }
    if (password.length < 6) { setError("Parol kamida 6 ta belgi bo'lishi kerak"); return; }

    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) setError("Email yoki parol noto'g'ri");
      else if (signInError.message.includes("Email not confirmed"))  setError("Email tasdiqlanmagan");
      else setError(signInError.message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  if (isLoading || user) {
    return (
      <div className="min-h-screen bg-[hsl(var(--auth-bg))] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEO title="Kirish | Avtotest" description="Avtotest hisobingizga kiring." path="/auth" noIndex={true} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-left { display: none; }
        @media (min-width: 1024px) { .auth-left { display: flex !important; } }
      `}</style>

      <div className="min-h-screen flex bg-[hsl(var(--auth-bg))]">

        {/* ── Left — Branding (desktop only) ── */}
        <div className="auth-left flex-col items-center justify-center p-12 relative overflow-hidden" style={{ flex: 1 }}>
          <div style={{ position: "absolute", top: "15%", left: "5%", width: 300, height: 300, background: "radial-gradient(circle, rgba(124,111,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 250, height: 250, background: "radial-gradient(circle, rgba(0,201,196,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ position: "relative", textAlign: "center", maxWidth: 400 }}>
            <div className="flex items-center justify-center gap-3 mb-8">
              <img src={logoImg} alt="Logo" className="w-16 h-16 rounded-[18px] object-contain" />
              <div style={{ textAlign: "left" }}>
                <div className="text-xl font-extrabold text-[hsl(var(--auth-text))] tracking-tight">AVTOTEST</div>
                <div className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 mt-1" style={{ background: "linear-gradient(90deg, #F5A623, #FFD166)" }}>
                  <Crown className="w-2.5 h-2.5 text-black" />
                  <span className="text-[10px] font-extrabold text-black tracking-widest">PREMIUM</span>
                </div>
              </div>
            </div>

            <h2 className="mb-4 text-3xl font-extrabold text-[hsl(var(--auth-text))] leading-tight">
              Imtihondan birinchi urinishda o'ting
            </h2>
            <p className="mb-8 text-[15px] text-[hsl(var(--auth-text-muted))] leading-relaxed">
              Haydovchilik guvohnomasi uchun eng zamonaviy test platformasi. 1200+ savollar va video darsliklar.
            </p>

            <div className="flex flex-col gap-3 text-left">
              {[
                { icon: Shield, text: "1200+ maxsus savollar bazasi" },
                { icon: Zap,    text: "Tezkor va qulay test interfeysi" },
                { icon: Star,   text: "Premium guruh va admin yordami" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-3 bg-[hsl(var(--auth-card))] border border-[hsl(var(--auth-card-border))]">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4.5 h-4.5 text-primary" style={{ width: 18, height: 18 }} />
                  </div>
                  <span className="text-sm text-[hsl(var(--auth-text-muted))] font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right — Login form ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div style={{ width: "100%", maxWidth: 420 }}>

            {/* Mobile logo */}
            <div className="flex items-center justify-center gap-2.5 mb-8">
              <img src={logoImg} alt="Logo" className="w-11 h-11 rounded-xl object-contain" />
              <div>
                <div className="text-lg font-extrabold text-[hsl(var(--auth-text))]">AVTOTEST</div>
                <div className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5" style={{ background: "linear-gradient(90deg, #F5A623, #FFD166)" }}>
                  <Crown className="w-2 h-2 text-black" />
                  <span className="text-[9px] font-extrabold text-black tracking-widest">PREMIUM</span>
                </div>
              </div>
            </div>

            {/* Card */}
            <div className="rounded-2xl p-7 border shadow-2xl bg-[hsl(var(--auth-card))] border-[hsl(var(--auth-card-border))]">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-1.5 text-[hsl(var(--auth-text))]">Xush kelibsiz!</h2>
                <p className="text-sm text-[hsl(var(--auth-text-muted))]">Hisobingizga kiring</p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/25 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-[hsl(var(--auth-text-muted))] mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      disabled={submitting}
                      className="auth-input w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
                      style={{ boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-[hsl(var(--auth-text-muted))] mb-1.5">Parol</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Parolni kiriting"
                      disabled={submitting}
                      className="auth-input w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-colors"
                      style={{ boxSizing: "border-box" }}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 py-3 rounded-xl border-0 font-bold text-base text-white flex items-center justify-center gap-2 transition-opacity"
                  style={{
                    background: "linear-gradient(135deg, hsl(250 70% 56%), hsl(190 80% 45%))",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                    boxShadow: "0 8px 24px rgba(124,111,255,0.3)",
                  }}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Tekshirilmoqda...
                    </>
                  ) : (
                    <><LogIn className="w-4 h-4" /> Kirish</>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button onClick={() => navigate("/")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">
                  ← Bosh sahifaga qaytish
                </button>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-muted-foreground leading-relaxed">
              Akkaunt ochish uchun adminstratorga murojaat qiling:<br />
              <a href="https://t.me/jumanazarov_0501" target="_blank" rel="noopener noreferrer"
                className="text-primary font-semibold no-underline hover:underline">
                @jumanazarov_0501
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
