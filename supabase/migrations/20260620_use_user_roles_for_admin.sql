-- ============================================================
-- AVTOTEST — Admin tekshiruvini mavjud user_roles/has_role
-- tizimiga o'tkazish
--
-- Eslatma: loyihada allaqachon (20251223...sql) profiles'dan
-- ALOHIDA user_roles jadvali, app_role enum va RLS-recursiyadan
-- himoyalangan has_role() SECURITY DEFINER funksiyasi bor edi.
-- Bu — Supabase'ning rasmiy tavsiya qilgan patterni. Shu sababli
-- profiles.role ustuni qo'shish o'rniga shu mavjud tizimdan
-- foydalanamiz.
-- ============================================================

-- 1) Agar oldingi "20260620_real_admin_auth.sql" migratsiyasi
--    allaqachon qo'llangan bo'lsa — undan qolgan profiles.role
--    ustunini va trigger'dagi role qatorini bekor qilamiz.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

CREATE OR REPLACE FUNCTION protect_tariff_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role') != 'service_role' THEN
    NEW.tariff_days        := OLD.tariff_days;
    NEW.tariff_start_date  := OLD.tariff_start_date;
    NEW.tariff_end_date    := OLD.tariff_end_date;
    NEW.is_trial_used      := OLD.is_trial_used;
    NEW.trial_start_date   := OLD.trial_start_date;
    NEW.trial_end_date     := OLD.trial_end_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) Admin panel foydalanuvchilar ro'yxatini ko'rishi uchun
--    profiles jadvalida qo'shimcha SELECT policy. has_role()
--    SECURITY DEFINER bo'lgani uchun RLS recursiyasiga olib
--    kelmaydi.
DROP POLICY IF EXISTS "admins_select_all_profiles" ON public.profiles;
CREATE POLICY "admins_select_all_profiles"
  ON public.profiles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- DIQQAT: profiles UPDATE/DELETE uchun admin'ga alohida RLS
-- policy QASDAN qo'shilmadi — barcha admin amallari faqat
-- admin-premium Edge Function orqali (service_role bilan, RLS
-- chetlab o'tilgan holda, lekin has_role() tekshiruvi bilan)
-- bajariladi. Bu hujum yuzasini kichraytiradi.

-- ============================================================
-- QO'LDA BAJARILADIGAN QADAM:
--
-- O'zingizning hisobingizga (yoki kerakli adminga) admin rolini
-- berish uchun SQL Editor'da:
--
--   INSERT INTO public.user_roles (user_id, role)
--   VALUES ('<auth.users.id qiymati>', 'admin')
--   ON CONFLICT (user_id, role) DO NOTHING;
--
-- (Yangi ro'yxatdan o'tgan har bir foydalanuvchiga avtomatik
-- 'user' roli `handle_new_user()` trigger orqali beriladi —
-- bu allaqachon mavjud, unga tegmang.)
-- ============================================================