import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminLayout from "@/components/admin/AdminLayout";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  // Sahifa yangilanganda haqiqiy Supabase Auth sessiyasi va
  // profiles.role = 'admin' ekanini qayta tekshiramiz.
  // sessionStorage flag'iga ishonib bo'lmaydi — u DevTools'da
  // bir qatorda qalbakilashtirilishi mumkin edi.
  useEffect(() => {
    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setIsAuthenticated(false);
        setChecking(false);
        return;
      }

      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });

      setIsAuthenticated(!!isAdmin);
      setChecking(false);
    };

    verify();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setIsAuthenticated(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = (success: boolean) => {
    if (success) setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "hsl(var(--background))", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(124,111,255,0.2)", borderTopColor: "#7C6FFF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!isAuthenticated) return <AdminLogin onLogin={handleLogin} />;
  return <AdminLayout onLogout={handleLogout} />;
}