import { useState } from "react";
import {
  LayoutDashboard, Users, CreditCard, MessageSquare,
  LogOut, Shield, Menu, X, ChevronDown,
} from "lucide-react";
import AdminDashboard from "./tabs/AdminDashboard";
import AdminUsers     from "./tabs/AdminUsers";
import AdminPayments  from "./tabs/AdminPayments";
import AdminMessages  from "./tabs/AdminMessages";

const NAV = [
  { id: "dashboard", label: "Dashboard",       icon: LayoutDashboard },
  { id: "users",     label: "Foydalanuvchilar", icon: Users },
  { id: "payments",  label: "To'lovlar",        icon: CreditCard },
  { id: "messages",  label: "Xabarlar",         icon: MessageSquare },
];

export default function AdminLayout({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab]       = useState("dashboard");
  const [menuOpen, setMenu] = useState(false);

  const active = NAV.find(n => n.id === tab)!;

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6FB", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
        input::placeholder, textarea::placeholder { color: #94A3B8 !important; }
        .admin-nav-btn { transition: all 0.15s ease; }
        .admin-nav-btn:hover { background: #F1F5F9 !important; color: #1E293B !important; }
        .admin-nav-btn.active { background: #EEF2FF !important; color: #6C5FF5 !important; }
        .admin-tab-btn { transition: all 0.15s ease; }
        .admin-tab-btn:hover { background: #F8FAFC !important; }
        .admin-tab-btn.active-tab {
          background: #fff !important;
          color: #1E293B !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        @media (max-width: 768px) {
          .admin-topnav { display: none !important; }
          .admin-mobile-menu { display: flex !important; }
        }
        @media (min-width: 769px) {
          .admin-topnav { display: flex !important; }
          .admin-mobile-menu { display: none !important; }
          .admin-hamburger { display: none !important; }
        }
      `}</style>

      {/* ── Top Header ── */}
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #E2E8F0",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}>
        {/* Left: Logo + Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #6C5FF5, #00C9C4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Shield size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#0F172A", lineHeight: 1.2 }}>Avtotest</div>
              <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500 }}>Admin Panel</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="admin-topnav" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {NAV.map(n => {
              const isActive = tab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  className={`admin-nav-btn${isActive ? " active" : ""}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "7px 14px", borderRadius: 8, border: "none",
                    background: isActive ? "#EEF2FF" : "transparent",
                    color: isActive ? "#6C5FF5" : "#64748B",
                    cursor: "pointer", fontSize: 13, fontWeight: isActive ? 700 : 500,
                  }}
                >
                  <n.icon size={15} />
                  {n.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Admin badge + Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#EEF2FF", border: "1px solid #C7D2FE",
            borderRadius: 100, padding: "5px 14px",
          }}>
            <Shield size={12} color="#6C5FF5" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6C5FF5" }}>ADMIN</span>
          </div>

          {/* Hamburger */}
          <button
            className="admin-hamburger"
            onClick={() => setMenu(!menuOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", display: "flex", padding: 6 }}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button
            onClick={onLogout}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8, border: "1px solid #FEE2E2",
              background: "#FFF5F5", color: "#EF4444",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#FEE2E2"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#FFF5F5"; }}
          >
            <LogOut size={14} /> Chiqish
          </button>
        </div>
      </header>

      {/* Mobile dropdown nav */}
      {menuOpen && (
        <div className="admin-mobile-menu" style={{
          background: "#fff", borderBottom: "1px solid #E2E8F0",
          flexDirection: "column", padding: "8px 16px 12px",
          gap: 2,
        }}>
          {NAV.map(n => {
            const isActive = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => { setTab(n.id); setMenu(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 8, border: "none",
                  background: isActive ? "#EEF2FF" : "transparent",
                  color: isActive ? "#6C5FF5" : "#475569",
                  cursor: "pointer", fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  textAlign: "left", width: "100%",
                }}
              >
                <n.icon size={16} />
                {n.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Page title bar ── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #E2E8F0",
        padding: "14px 24px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <active.icon size={18} color="#6C5FF5" />
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
          {active.label}
        </h1>
        <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginLeft: 4 }}>
          / Admin
        </span>
      </div>

      {/* ── Content ── */}
      <main style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
        {tab === "dashboard" && <AdminDashboard />}
        {tab === "users"     && <AdminUsers />}
        {tab === "payments"  && <AdminPayments />}
        {tab === "messages"  && <AdminMessages />}
      </main>
    </div>
  );
}