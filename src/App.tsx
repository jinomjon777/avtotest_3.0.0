import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { lazy, Suspense, Component, ReactNode } from "react";
import Home from "./pages/Home";
import TestIshlash from "./pages/TestIshlash";

interface EBState { hasError: boolean; }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', err, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Xatolik yuz berdi</h2>
          <p style={{ margin: 0, color: '#64748b', textAlign: 'center' }}>Sahifa yuklanishida muammo bo'ldi. Iltimos, sahifani yangilang.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{ padding: '10px 24px', background: '#1E2350', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            Qayta yuklash
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Belgilar    = lazy(() => import("./pages/Belgilar"));
const Contact     = lazy(() => import("./pages/Contact"));
const Darslik     = lazy(() => import("./pages/Darslik"));
const Qoshimcha   = lazy(() => import("./pages/Qoshimcha"));
const Variant     = lazy(() => import("./pages/Variant"));
const MavzuliTestlar = lazy(() => import("./pages/MavzuliTestlar"));
const Pro         = lazy(() => import("./pages/Pro"));
const Auth        = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/auth/callback"));
const Profile     = lazy(() => import("./pages/Profile"));
const Dashboard   = lazy(() => import("./pages/Dashboard"));
const Admin       = lazy(() => import("./pages/Admin"));
const NotFound    = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#7C6FFF', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                </div>
              }>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/"              element={<Home />} />
                    <Route path="/dashboard"     element={<Dashboard />} />
                    <Route path="/test-ishlash"  element={<TestIshlash />} />
                    <Route path="/belgilar"      element={<Belgilar />} />
                    <Route path="/contact"       element={<Contact />} />
                    <Route path="/darslik"       element={<Darslik />} />
                    <Route path="/qoshimcha"     element={<Qoshimcha />} />
                    <Route path="/variant"       element={<Variant />} />
                    <Route path="/mavzuli"       element={<MavzuliTestlar />} />
                    <Route path="/pro"           element={<Pro />} />
                    <Route path="/auth"          element={<Auth />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/profile"       element={<Profile />} />
                    <Route path="/admin"         element={<Admin />} />
                    <Route path="*"              element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </Suspense>
            </TooltipProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
