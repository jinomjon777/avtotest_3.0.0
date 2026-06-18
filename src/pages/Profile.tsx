import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO } from '@/components/SEO';
import { MainLayout } from '@/components/layout/MainLayout';
import { useUserValidation } from '@/hooks/useUserValidation';
import { useRegistrationAge } from '@/hooks/useRegistrationAge';
import { useTrialStatus, formatTimeRemaining } from '@/hooks/useTrialStatus';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User, LogOut, Trophy, CheckCircle, XCircle, Clock,
  Edit2, Save, X, Calendar, FileText, AlertCircle, Crown, Mail, Phone
} from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  id: string;
  variant: number;
  correct_answers: number;
  total_questions: number;
  time_taken_seconds: number | null;
  completed_at: string;
}

const PURPLE = "hsl(250 70% 56%)";
const BLUE = "hsl(220 80% 55%)";
const CYAN = "hsl(190 80% 50%)";
const BEIGE = "hsl(40 30% 95%)";

const Profile = () => {
  const { user, profile, signOut, isLoading, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const registrationDays = useRegistrationAge(user?.id);
  const trialStatus = useTrialStatus();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [checkLink, setCheckLink] = useState<string | null>(null);

  useUserValidation('/auth');

  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username || '');
      setEditFullName(profile.full_name || '');
    }
  }, [profile]);

  useEffect(() => {
    const fetchCheck = async () => {
      if (!user?.email) return;
      try {
        const { data, error } = await (supabase
          .from('chek' as any).select('link').eq('email', user.email)
          .maybeSingle() as unknown as Promise<{ data: { link: string } | null; error: { message: string } | null }>);
        if (!error && data?.link) setCheckLink(data.link);
      } catch {}
    };
    fetchCheck();
  }, [user]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('test_results').select('*').eq('user_id', user.id)
          .order('completed_at', { ascending: false });
        setResults(data || []);
      } catch {} finally { setLoadingResults(false); }
    };
    fetchResults();
  }, [user]);

  const handleSignOut = async () => { await signOut(); navigate('/auth'); };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        username: editUsername.trim() || null,
        full_name: editFullName.trim() || null,
      }).eq('id', user.id);
      if (error) toast.error(t('profile.updateFailed') + ': ' + error.message);
      else { toast.success(t('profile.updateSuccess')); await refreshProfile(); setIsEditing(false); }
    } catch { toast.error(t('profile.genericError')); }
    finally { setIsSaving(false); }
  };

  const handleCancelEdit = () => {
    setEditUsername(profile?.username || '');
    setEditFullName(profile?.full_name || '');
    setIsEditing(false);
  };

  const formatTime = (s: number | null) => {
    if (!s) return '--:--';
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const bestByVariant = results.reduce((acc, r) => {
    if (!acc[r.variant] || r.correct_answers > acc[r.variant].correct_answers) acc[r.variant] = r;
    return acc;
  }, {} as Record<number, TestResult>);
  const sortedVariants = Object.keys(bestByVariant).map(Number).sort((a, b) => a - b);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[hsl(250_70%_56%/0.2)] border-t-[hsl(250_70%_56%)] rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!user) return null;

  const displayName = profile?.full_name || profile?.username || t('profile.defaultName');
  const totalCorrect = results.reduce((s, r) => s + r.correct_answers, 0);
  const totalQuestions = results.reduce((s, r) => s + r.total_questions, 0);
  const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const stats = [
    { icon: Trophy, label: t('profile.statTotal'), value: results.length, color: PURPLE, bg: "hsl(250 70% 56% / 0.1)" },
    { icon: FileText, label: t('profile.statVariants'), value: sortedVariants.length, color: BLUE, bg: "hsl(220 80% 55% / 0.1)" },
    { icon: CheckCircle, label: t('profile.statCorrect'), value: totalCorrect, color: CYAN, bg: "hsl(190 80% 50% / 0.1)" },
    { icon: XCircle, label: t('profile.statWrong'), value: totalQuestions - totalCorrect, color: "hsl(0 70% 60%)", bg: "hsl(0 70% 60% / 0.1)" },
  ];

  return (
    <MainLayout>
      <SEO title={t('profile.seoTitle')} description={t('profile.seoDesc')} path="/profile" noIndex />

      <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BEIGE} 0%, hsl(0 0% 100%) 100%)` }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10">
          {/* Profile Header */}
          <Card className="border-0 rounded-3xl overflow-hidden mb-6 shadow-sm">
            <div className="relative p-6 md:p-8" style={{
              background: `linear-gradient(135deg, ${PURPLE} 0%, ${BLUE} 50%, ${CYAN} 100%)`
            }}>
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ background: "white", filter: "blur(60px)" }} />
              <div className="relative z-10 flex items-center gap-4">
                <Avatar className="h-20 w-20 md:h-24 md:w-24 bg-white/20 backdrop-blur-sm border-2 border-white/30">
                  <AvatarFallback className="bg-transparent text-white text-2xl md:text-3xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl font-bold text-white truncate font-montserrat">{displayName}</h1>
                  <p className="text-white/80 text-sm truncate">{user.email || user.phone}</p>
                  {profile?.is_pro && (
                    <div className="inline-flex items-center gap-1.5 mt-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                      <Crown className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-bold text-white">PREMIUM</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="hidden md:flex bg-white/15 hover:bg-white/25 text-white border-0 rounded-xl gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('profile.logout')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Trial Timer */}
          {trialStatus.isTrialActive && !trialStatus.isPro && (
            <Card className="p-5 mb-6 border-0 rounded-2xl shadow-sm" style={{
              background: `linear-gradient(135deg, hsl(220 80% 55% / 0.08), hsl(190 80% 50% / 0.08))`,
              border: `1px solid hsl(220 80% 55% / 0.2)`
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                    background: `linear-gradient(135deg, ${BLUE}, ${CYAN})`
                  }}>
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[hsl(230_25%_15%)]">{t('profile.trialTitle')}</h3>
                    <p className="text-xs text-[hsl(230_15%_50%)]">{t('profile.trialDesc')}</p>
                  </div>
                </div>
                <div className="text-2xl font-bold" style={{ color: BLUE }}>{formatTimeRemaining(trialStatus.timeRemaining)}</div>
              </div>
            </Card>
          )}

          {trialStatus.isTrialUsed && !trialStatus.isTrialActive && !trialStatus.isPro && (
            <Card className="p-5 mb-6 border-0 rounded-2xl bg-[hsl(0_70%_60%/0.05)] border border-[hsl(0_70%_60%/0.2)]">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-10 h-10 text-[hsl(0_70%_55%)] flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-[hsl(230_25%_15%)] mb-1">{t('profile.trialEndedTitle')}</h3>
                  <p className="text-sm text-[hsl(230_15%_50%)] mb-2">{t('profile.trialEndedDesc')}</p>
                  <Button
                    size="sm"
                    onClick={() => navigate('/pro')}
                    className="rounded-xl text-white font-bold border-0"
                    style={{ background: `linear-gradient(135deg, ${PURPLE}, ${BLUE})` }}
                  >
                    {t('profile.getPremium')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.map((stat, i) => (
              <Card key={i} className="p-4 border-0 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: stat.bg }}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div className="text-xl font-bold text-[hsl(230_25%_15%)]">{stat.value}</div>
                <div className="text-xs text-[hsl(230_15%_50%)]">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Profile Edit */}
          <Card className="p-5 mb-6 border-0 rounded-2xl bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[hsl(230_25%_15%)] flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(250 70% 56% / 0.1)" }}>
                  <User className="w-4 h-4" style={{ color: PURPLE }} />
                </div>
                {t('profile.infoTitle')}
              </h2>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5 rounded-xl border-[hsl(230_20%_88%)]">
                  <Edit2 className="w-3.5 h-3.5" /> {t('profile.edit')}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving} className="rounded-xl">
                    <X className="w-3.5 h-3.5 mr-1" /> {t('profile.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="rounded-xl text-white border-0"
                    style={{ background: `linear-gradient(135deg, ${PURPLE}, ${BLUE})` }}
                  >
                    {isSaving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                    {t('profile.save')}
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm">{t('profile.fullNameLabel')}</Label>
                  <Input id="fullName" placeholder={t('profile.fullNamePlaceholder')} value={editFullName} onChange={(e) => setEditFullName(e.target.value)} disabled={isSaving} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-sm">{t('profile.usernameLabel')}</Label>
                  <Input id="username" placeholder="@username" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} disabled={isSaving} className="rounded-xl" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: User, label: t('profile.fieldFullName'), value: profile?.full_name || '-' },
                  { icon: User, label: t('profile.fieldUsername'), value: profile?.username ? `@${profile.username}` : '-' },
                  { icon: Mail, label: t('profile.fieldEmail'), value: user.email || '-' },
                  { icon: Phone, label: t('profile.fieldPhone'), value: user.phone || '-' },
                  { icon: FileText, label: t('profile.fieldCheck'), value: checkLink && checkLink !== 'yuklanmagan' ? checkLink : null, isLink: true },
                  { icon: Calendar, label: t('profile.fieldRegistered'), value: registrationDays !== null ? `${registrationDays} ${t('profile.daysAgo')}` : '-' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[hsl(40_30%_97%)]">
                    <item.icon className="w-4 h-4 text-[hsl(230_15%_55%)] mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[hsl(230_15%_50%)]">{item.label}</p>
                      {item.isLink && item.value ? (
                        <a href={item.value} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline" style={{ color: PURPLE }}>{t('profile.download')}</a>
                      ) : (
                        <p className="text-sm font-medium text-[hsl(230_25%_15%)] truncate">{item.value || '-'}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Results */}
          <Card className="border-0 rounded-2xl bg-white shadow-sm overflow-hidden mb-6">
            <div className="flex items-center justify-between p-5 border-b border-[hsl(230_20%_94%)]">
              <h2 className="font-bold text-[hsl(230_25%_15%)] flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(190 80% 50% / 0.1)" }}>
                  <Trophy className="w-4 h-4" style={{ color: CYAN }} />
                </div>
                {t('profile.bestResultsTitle')}
              </h2>
            </div>
            <div className="p-5">
              {loadingResults ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <div className="flex-1 space-y-2"><Skeleton className="w-24 h-4" /><Skeleton className="w-16 h-3" /></div>
                      <Skeleton className="w-12 h-6 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : sortedVariants.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title={t('profile.noResultsTitle')}
                  description={t('profile.noResultsDesc')}
                  actionLabel={t('profile.startTestAction')}
                  onAction={() => navigate('/test-ishlash')}
                />
              ) : (
                <div className="space-y-2">
                  {sortedVariants.map((variant) => {
                    const r = bestByVariant[variant];
                    const score = Math.round((r.correct_answers / r.total_questions) * 100);
                    const passed = score >= 80;
                    return (
                      <div key={variant} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[hsl(40_30%_97%)] transition-colors">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{
                          background: passed ? `linear-gradient(135deg, ${CYAN}, ${BLUE})` : "linear-gradient(135deg, hsl(0 70% 65%), hsl(0 70% 55%))"
                        }}>
                          {variant}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[hsl(230_25%_15%)] text-sm">{t('profile.variantLabel')} {variant}</p>
                          <div className="flex items-center gap-3 text-xs text-[hsl(230_15%_50%)]">
                            <span>{r.correct_answers}/{r.total_questions}</span>
                            <span>⏱ {formatTime(r.time_taken_seconds)}</span>
                          </div>
                        </div>
                        <div className="px-2.5 py-1 rounded-full text-xs font-bold" style={{
                          background: passed ? "hsl(190 80% 50% / 0.12)" : "hsl(0 70% 60% / 0.12)",
                          color: passed ? CYAN : "hsl(0 70% 50%)"
                        }}>
                          {score}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Mobile Logout */}
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="md:hidden w-full gap-2 rounded-xl border-[hsl(0_70%_60%/0.3)] text-[hsl(0_70%_55%)] hover:bg-[hsl(0_70%_60%/0.08)]"
          >
            <LogOut className="w-4 h-4" />
            {t('profile.logoutFull')}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;