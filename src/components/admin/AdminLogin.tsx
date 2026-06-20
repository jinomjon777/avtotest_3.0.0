import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Eye, EyeOff, Lock, User } from "lucide-react";

const CS = {
  bg: "#0A0B14", card: "#16172a", border: "rgba(255,255,255,0.07)",
  accent: "#7C6FFF", accentB: "#00C9C4",
  textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.55)",
};

export default function AdminLogin({ onLogin }: { onLogin: (s: boolean) => void }) {
  const [login, setLogin]     = useState("");
  const [parol, setParol]     = useState("");
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1) Haqiqiy Supabase Auth orqali kirish (login maydoniga email kiritiladi)
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: login.trim(),
        password: parol,
      });

      if (authErr || !authData.user) {
        setError("Login yoki parol noto'g'ri");
        setLoading(false);
        return;
      }

      // 2) Bu hisobning haqiqatan ham admin ekanini has_role() orqali
      //    tekshiramiz. user_roles jadvali profiles'dan ALOHIDA —
      //    oddiy foydalanuvchi bu yerga o'zi yoza olmaydi.
      const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
        _user_id: authData.user.id,
        _role: "admin",
      });

      if (roleErr || !isAdmin) {
        await supabase.auth.signOut();
        setError("Bu hisobda admin huquqi yo'q");
        setLoading(false);
        return;
      }

      onLogin(true);
    } catch {
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: CS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input::placeholder{color:rgba(255,255,255,0.25)}`}</style>

      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Shield size={30} color="#fff" />
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: CS.textPrimary }}>Admin Panel</h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: CS.textSecondary }}>Avtotest boshqaruv tizimi</p>
        </div>

        <div style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 20, padding: "32px 28px" }}>
          <form onSubmit={handleSubmit}>
            {/* Login */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: CS.textSecondary, marginBottom: 8 }}>Login</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                <input
                  type="text"
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  placeholder="Login"
                  required
                  style={{ width: "100%", padding: "12px 14px 12px 42px", background: "rgba(255,255,255,0.05)", border: `1px solid ${CS.border}`, borderRadius: 12, color: CS.textPrimary, fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(124,111,255,0.5)")}
                  onBlur={e => (e.target.style.borderColor = CS.border)}
                />
              </div>
            </div>

            {/* Parol */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: CS.textSecondary, marginBottom: 8 }}>Parol</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                <input
                  type={show ? "text" : "password"}
                  value={parol}
                  onChange={e => setParol(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: "100%", padding: "12px 44px 12px 42px", background: "rgba(255,255,255,0.05)", border: `1px solid ${CS.border}`, borderRadius: 12, color: CS.textPrimary, fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(124,111,255,0.5)")}
                  onBlur={e => (e.target.style.borderColor = CS.border)}
                />
                <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex" }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(255,95,109,0.12)", border: "1px solid rgba(255,95,109,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#FF5F6D" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {loading ? (
                <><div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Tekshirilmoqda...</>
              ) : (
                <><Shield size={16} /> Kirish</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}