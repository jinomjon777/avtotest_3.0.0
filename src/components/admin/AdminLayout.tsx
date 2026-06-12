import { useState } from "react";
import {
  LayoutDashboard, Users, CreditCard, MessageSquare,
  LogOut, Shield, Menu, X, TrendingUp,
} from "lucide-react";
import AdminDashboard from "./tabs/AdminDashboard";
import AdminUsers     from "./tabs/AdminUsers";
import AdminPayments  from "./tabs/AdminPayments";
import AdminMessages  from "./tabs/AdminMessages";
import AdminFinance   from "./tabs/AdminFinance";

const NAV = [
  { id: "dashboard", label: "Dashboard",       icon: LayoutDashboard },
  { id: "users",     label: "Foydalanuvchilar", icon: Users },
  { id: "payments",  label: "To'lovlar",        icon: CreditCard },
  { id: "finance",   label: "Moliya",           icon: TrendingUp },
  { id: "messages",  label: "Xabarlar",         icon: MessageSquare },
];

export default function AdminLayout({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab]     = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const active = NAV.find(n => n.id === tab)!;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
        .anav-btn { transition: background 0.15s, color 0.15s; }
        .anav-btn:hover { background: #F1F5F9 !important; }
        .anav-btn.on { background: #EEF2FF !important; color: #4F46E5 !important; font-weight: 700 !important; }
        table { border-collapse: collapse; width: 100%; }
        input, textarea, select { outline: none; font-family: inherit; }
        button { font-family: inherit; }
        @media (max-width: 800px) {
          .anav-desktop { display: none !important; }
          .anav-mobile-btn { display: flex !important; }
        }
        @media (min-width: 801px) {
          .anav-desktop { display: flex !important; }
          .anav-mobile-btn { display: none !important; }
          .anav-mobile-menu { display: none !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 200,
        background: "#fff", borderBottom: "1px solid #E2E8F0",
        height: 58, padding: "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #4F46E5, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#0F172A", lineHeight: 1.2 }}>Avtotest</div>
              <div style={{ fontSize: 10, color: "#94A3B8" }}>Admin Panel</div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="anav-desktop" style={{ display: "flex", gap: 2 }}>
            {NAV.map(n => {
              const Icon = n.icon;
              const on = tab === n.id;
              return (
                <button key={n.id} onClick={() => setTab(n.id)}
                  className={`anav-btn${on ? " on" : ""}`}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 13px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: on ? 700 : 500, background: on ? "#EEF2FF" : "transparent", color: on ? "#4F46E5" : "#64748B" }}>
                  <Icon size={15} />{n.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: "4px 12px", borderRadius: 100, background: "#EEF2FF", border: "1px solid #C7D2FE", display: "flex", alignItems: "center", gap: 5 }}>
            <Shield size={11} color="#4F46E5" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#4F46E5" }}>ADMIN</span>
          </div>
          <button onClick={onLogout}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: 8, border: "1px solid #FEE2E2", background: "#FFF5F5", color: "#EF4444", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            onMouseEnter={e => { e.currentTarget.style.background = "#FEE2E2"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#FFF5F5"; }}>
            <LogOut size={14} />Chiqish
          </button>
          {/* Hamburger */}
          <button className="anav-mobile-btn" style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: 4 }} onClick={() => setMobileNav(v => !v)}>
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      {mobileNav && (
        <div className="anav-mobile-menu" style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "8px 16px 12px" }}>
          {NAV.map(n => {
            const Icon = n.icon;
            const on = tab === n.id;
            return (
              <button key={n.id} onClick={() => { setTab(n.id); setMobileNav(false); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: on ? 700 : 500, background: on ? "#EEF2FF" : "transparent", color: on ? "#4F46E5" : "#475569", width: "100%", textAlign: "left", marginBottom: 2 }}>
                <Icon size={16} />{n.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Page title */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "12px 24px", display: "flex", alignItems: "center", gap: 8 }}>
        <active.icon size={17} color="#4F46E5" />
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{active.label}</h1>
        <span style={{ fontSize: 12, color: "#94A3B8" }}>/ Admin</span>
      </div>

      {/* Content */}
      <main style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }}>
        {tab === "dashboard" && <AdminDashboard />}
        {tab === "users"     && <AdminUsers />}
        {tab === "payments"  && <AdminPayments />}
        {tab === "finance"   && <AdminFinance />}
        {tab === "messages"  && <AdminMessages />}
      </main>
    </div>
  );
}