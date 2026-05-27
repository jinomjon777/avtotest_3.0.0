import { useState } from "react";
import {
  LayoutDashboard, Users, CreditCard, MessageSquare,
  FileText, LogOut, Menu, X, Shield, ChevronRight,
} from "lucide-react";
import AdminDashboard from "./tabs/AdminDashboard";
import AdminUsers     from "./tabs/AdminUsers";
import AdminPayments  from "./tabs/AdminPayments";
import AdminMessages  from "./tabs/AdminMessages";

const CS = {
  bg: "#0A0B14", surface: "#111220", card: "#16172a",
  border: "rgba(255,255,255,0.07)", accent: "#7C6FFF", accentB: "#00C9C4",
  textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.55)",
};

const NAV = [
  { id: "dashboard", label: "Dashboard",      icon: LayoutDashboard },
  { id: "users",     label: "Foydalanuvchilar", icon: Users },
  { id: "payments",  label: "To'lovlar",       icon: CreditCard },
  { id: "messages",  label: "Xabarlar",        icon: MessageSquare },
];

export default function AdminLayout({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab]         = useState("dashboard");
  const [sideOpen, setSide]   = useState(false);

  const active = NAV.find(n => n.id === tab)!;

  const Sidebar = ({ mobile = false }) => (
    <div style={{
      width: mobile ? "100%" : 240,
      background: CS.surface,
      borderRight: `1px solid ${CS.border}`,
      display: "flex", flexDirection: "column",
      height: "100%",
    }}>
      {/* Brand */}
      <div style={{ padding: "24px 20px", borderBottom: `1px solid ${CS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: CS.textPrimary }}>Avtotest</div>
            <div style={{ fontSize: 11, color: CS.textSecondary }}>Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map(n => {
          const isActive = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => { setTab(n.id); setSide(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px", borderRadius: 12, border: "none",
                background: isActive ? "rgba(124,111,255,0.15)" : "transparent",
                color: isActive ? CS.accent : CS.textSecondary,
                cursor: "pointer", textAlign: "left", width: "100%",
                fontWeight: isActive ? 700 : 500, fontSize: 14,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <n.icon size={17} />
              {n.label}
              {isActive && <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "16px 12px", borderTop: `1px solid ${CS.border}` }}>
        <button
          onClick={onLogout}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, border: "none", background: "transparent", color: "#FF5F6D", cursor: "pointer", width: "100%", fontWeight: 600, fontSize: 14 }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,95,109,0.08)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={17} /> Chiqish
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: CS.bg, display: "flex" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        * { box-sizing: border-box; }
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.2)}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.25)!important}
      `}</style>

      {/* Desktop Sidebar */}
      <div style={{ display: "none", width: 240, flexShrink: 0, position: "sticky", top: 0, height: "100vh" }} className="desktop-sidebar">
        <Sidebar />
      </div>
      <style>{`@media(min-width:768px){.desktop-sidebar{display:flex!important}.mobile-topbar{display:none!important}}`}</style>

      {/* Mobile sidebar overlay */}
      {sideOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={() => setSide(false)} />
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 260, zIndex: 1 }}>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ background: CS.surface, borderBottom: `1px solid ${CS.border}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button className="mobile-topbar" onClick={() => setSide(true)} style={{ background: "none", border: "none", cursor: "pointer", color: CS.textSecondary, display: "flex" }}>
              <Menu size={22} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: CS.textPrimary }}>{active.label}</h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(124,111,255,0.1)", border: "1px solid rgba(124,111,255,0.2)", borderRadius: 100, padding: "5px 14px" }}>
            <Shield size={13} color={CS.accent} />
            <span style={{ fontSize: 12, fontWeight: 700, color: CS.accent }}>ADMIN</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {tab === "dashboard" && <AdminDashboard />}
          {tab === "users"     && <AdminUsers />}
          {tab === "payments"  && <AdminPayments />}
          {tab === "messages"  && <AdminMessages />}
        </div>
      </div>

      {/* Always-visible sidebar for desktop */}
      <style>{`
        @media(min-width:768px){
          .desktop-sidebar{display:flex!important;flex-direction:column;position:sticky;top:0;height:100vh}
        }
      `}</style>
    </div>
  );
}
