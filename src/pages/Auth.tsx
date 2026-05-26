import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Crown, LogIn, Eye, EyeOff, AlertCircle, Mail, Lock, Shield, Zap, Star } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { z } from 'zod';
import logoImg from "@/assets/logo.png";

const emailLoginSchema = z.object({
  email: z.string().email('Email manzili noto\'g\'ri'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
});

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, isLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string })?.returnTo || '/';

  useEffect(() => {
    if (!isLoading && user) {
      navigate(returnTo, { replace: true });
    }
  }, [user, isLoading, navigate, returnTo]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      emailLoginSchema.parse({ email, password });
    } catch (err) {
      if (err instanceof z.ZodError) { setError(err.errors[0].message); return; }
    }
    setIsSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) setError('Email yoki parol noto\'g\'ri');
      else if (signInError.message.includes('Email not confirmed')) setError('Email tasdiqlanmagan');
      else setError(signInError.message);
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  };

  if (isLoading || user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(222_47%_8%)] via-[hsl(222_35%_12%)] to-[hsl(222_47%_8%)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEO title="Kirish yoki Ro'yxatdan o'tish" description="Avtotest Premium hisobingizga kiring." path="/auth" noIndex={true} />
      <div className="min-h-screen bg-gradient-to-br from-[hsl(222_47%_8%)] via-[hsl(222_35%_12%)] to-[hsl(222_47%_8%)] flex">

        {/* Left - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-amber-500/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-amber-400/5 rounded-full blur-[120px]" />

          <div className="relative z-10 text-center max-w-md">
            <div className="flex items-center justify-center gap-3 mb-8">
              <img src={logoImg} alt="Logo" className="w-16 h-16 rounded-2xl shadow-2xl object-contain" width="64" height="64" />
              <div className="text-left">
                <h1 className="text-2xl font-bold text-white font-montserrat tracking-tight">AVTOTEST</h1>
                <div className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-md px-2 py-0.5 mt-0.5">
                  <Crown className="w-3 h-3 text-black" />
                  <span className="text-black text-xs font-extrabold tracking-wide">PREMIUM</span>
                </div>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight font-montserrat">
              Imtihonga eng yaxshi
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">tayyorgarlik tizimi</span>
            </h2>
            <p className="text-white/50 text-base leading-relaxed mb-10">
              Haydovchilik guvohnomasi olish uchun zamonaviy onlayn test platformasi. 1200+ savollar va video darsliklar.
            </p>

            <div className="space-y-3 text-left">
              {[
                { icon: Shield, text: "1200+ ta maxsus savollar bazasi" },
                { icon: Zap, text: "Tezkor va qulay test interfeysi" },
                { icon: Star, text: "PREMIUM guruh va admin yordami" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/8">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-400/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-white/70 font-medium text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <img src={logoImg} alt="Logo" className="w-12 h-12 rounded-xl shadow-xl object-contain" width="48" height="48" />
              <div>
                <p className="text-white font-bold text-lg font-montserrat">AVTOTEST</p>
                <div className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 rounded px-2 py-0.5">
                  <Crown className="w-3 h-3 text-black" />
                  <span className="text-black text-xs font-extrabold">PREMIUM</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white font-montserrat">Xush kelibsiz!</h2>
                <p className="text-white/40 text-sm mt-1">Hisobingizga kiring</p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-300">{error}</span>
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-white/60 text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <Input id="login-email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting}
                      className="h-11 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus:ring-primary/30 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-white/60 text-sm">Parol</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Parolni kiriting" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting}
                      className="h-11 pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus:ring-primary/30 rounded-xl" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 text-base font-semibold bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black border-0 rounded-xl shadow-lg shadow-amber-500/20" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Tekshirilmoqda...</span>
                  ) : (
                    <span className="flex items-center gap-2"><LogIn className="w-4 h-4" />Kirish</span>
                  )}
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-between">
                <button onClick={() => navigate('/')} className="text-sm text-white/30 hover:text-white/60 transition-colors">← Bosh sahifa</button>
                <button onClick={() => navigate('/pro')} className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors">Akkaunt ochish</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
