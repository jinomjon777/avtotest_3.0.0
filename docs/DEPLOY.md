# Deploy: 3.1.0 (xavfsizlik yangilanishi)

## Bir tugma bilan (tavsiya)

GitHub → **Actions → "Deploy production" → Run workflow** → `DEPLOY` deb yozing.
Workflow ketma-ket: to'liq tekshiruv → migratsiya → Edge Functions → `main` ga yuborish (Cloudflare saytni deploy qiladi).
Biror bosqich xato bersa, keyingilari ishlamaydi.

Bir martalik sozlash: GitHub → Settings → Secrets and variables → Actions:

| Secret | Qayerdan |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | supabase.com/dashboard/account/tokens → Generate |
| `SUPABASE_PROJECT_REF` | loyiha URL'idagi identifikator (`https://<REF>.supabase.co`) |
| `SUPABASE_DB_URL` | Project Settings → Database → Connection string → URI (Session pooler), parol qo'yilgan holda |

Ixtiyoriy: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (Cloudflare Git integratsiyasi bo'lmasa, sayt wrangler bilan deploy qilinadi), `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.

Quyidagi qo'lda bajariladigan qadamlar workflow bilan almashtirilmaydi: **0** (zaxira, repo yopiq), **2** (Edge Function secret'lari), **4** (Auth sozlamasi), **6** (R2 ni yopish). Ularni birinchi deploy'dan oldin bir marta bajaring.

---

## Qo'lda (workflow'siz)

Tartib muhim. Har bir qadamni ketma-ket bajaring.

## 0. Tayyorgarlik (5 daqiqa)

1. **Bazaning zaxira nusxasi:** Supabase → Database → Backups (yoki `pg_dump`).
2. **Repo yopiq ekanini tekshiring.** `supabase/question-data/` papkasida premium savollar bor. GitHub repo **Private** bo'lishi shart.
3. **Bitta production loyiha tanlang.** `supabase/config.toml` dagi `project_id` (`lvdndseuobzbgzrarygu`) va `post-deploy/002_reminders_cron.sql` dagi URL (`gbgxfmnfncpigubqnjvd`) ikki xil loyihaga ishora qiladi. Haqiqiy loyihani tanlab, ikkalasini bir xil qiling.

## 1. Migratsiya

`supabase/migrations/20261104000000_security_hardening.sql` faylini Dashboard → SQL Editor'da to'liq bajaring
(yoki `psql "$SUPABASE_DB_URL" -1 -v ON_ERROR_STOP=1 -f ...`). Fayl idempotent — qayta ishga tushirish xavfsiz.
`supabase db push` ISHLATMANG: production migratsiyalar tarixi repodan farq qiladi va u eski migratsiyalarni qayta qo'llashga urinadi.

Bajarilgach SQL Editor'da tekshiring:

```sql
-- contact_messages: faqat 3 ta siyosat (insert / admin select / admin delete)
SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('contact_messages','chek','test_results') ORDER BY 1,2;
-- receipts bucket yopiq bo'lishi kerak (public = false)
SELECT id, public FROM storage.buckets WHERE id = 'receipts';
-- har bir profilda email bor (auth.users bilan sinxron)
SELECT count(*) FILTER (WHERE email IS NULL) AS emailsiz FROM public.profiles;
```

## 2. Edge Function secret'lari

Supabase → Edge Functions → Secrets:

| Secret | Qiymat | Majburiy |
| --- | --- | --- |
| `SB_SERVICE_ROLE_KEY` | service_role kaliti (**avval Reset qiling**: eski `.env` oshkor bo'lgan) | ha |
| `ALLOWED_ORIGIN` | `https://smartavto.uz,https://www.smartavto.uz` | tavsiya |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `TELEGRAM_CARD_NUMBER`, `TELEGRAM_CARD_HOLDER` | avvalgidek | ha |
| `TELEGRAM_WEBHOOK_SECRET` | uzun tasodifiy matn | ha |
| `REMINDER_CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | avvalgidek | eslatmalar uchun |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2 → API token (faqat o'qish, shu bucket) | videolar uchun |
| `LEGACY_VIDEO_BASE_URL` | `https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev` | faqat o'tish davri |
| `MAX_DEVICES` | `2` (standart) | yo'q |

## 3. Funksiyalarni deploy qilish

```bash
supabase functions deploy get-questions get-video-url check-device admin-premium send-reminders
supabase functions deploy telegram-bot --no-verify-jwt
supabase functions deploy send-reminders --no-verify-jwt   # pg_cron JWT yubormaydi
```

Endi kerak bo'lmagan eski funksiyalarni o'chiring. Ularning vazifasini yangi funksiyalar va baza bajaradi:

```bash
supabase functions delete get-premium-questions
supabase functions delete get-user-access
supabase functions delete auto-confirm-signup
```

Agar `TELEGRAM_WEBHOOK_SECRET` yangi bo'lsa, webhookni qayta ro'yxatdan o'tkazing:

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<REF>.supabase.co/functions/v1/telegram-bot&secret_token=<SECRET>
```

## 4. Auth sozlamasi

Supabase → Authentication → Providers → Email:

- **"Confirm email" yoqilgan bo'lsa** (tavsiya): hisob email tasdiqlangandan keyin ochiladi. O'z SMTP'ingizni ulang (Resend, Brevo va h.k.). Standart Supabase SMTP soatiga bir necha xat yuboradi xolos.
- **O'chirilgan bo'lsa:** foydalanuvchi ro'yxatdan o'tishi bilan tizimga kiradi (avvalgi oqim, lekin endi autentifikatsiyasiz tasdiqlash funksiyasiz).

Yana:

- **"Leaked password protection"** ni yoqing.
- **Redirect URLs** ro'yxatida `https://smartavto.uz/auth/callback` bo'lsin.

## 5. Sayt (Cloudflare)

`git push` qiling. Build buyrug'i `npm run build` bo'lishi kerak: u `vite build` dan keyin prerender va sitemap'ni ham bajaradi. Muhit o'zgaruvchilari: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.

## 6. Videolarni yopish (R2)

1. 2-qadamdagi `R2_*` secret'larini o'rnating va `get-video-url` ni qayta deploy qiling.
2. Saytda Premium hisob bilan bitta videoni ochib, ishlashini tekshiring.
3. Cloudflare → R2 → bucket → Settings → **Public access (r2.dev) → Disable**.
4. `LEGACY_VIDEO_BASE_URL` secret'ini o'chiring.

## 7. Tekshiruv ro'yxati

- [ ] Bepul hisob: "Test ishlash", "Mashq", "Imtihon" ishlaydi. Kunlik limit tugagach xabar chiqadi.
- [ ] Premium hisob: variantlar, mavzuli testlar, videolar ochiladi.
- [ ] Uchinchi qurilmadan kirilganda qurilmalar dialogi chiqadi. Bitta qurilma chiqarilgach, kirish davom etadi.
- [ ] Telegram bot: tarif → email → chek → admin ✅. Premium **avtomatik** faollashadi va foydalanuvchiga xabar keladi.
- [ ] Admin → To'lovlar: Telegram chekini "Ko'rish" imzolangan havola bilan ochadi.
- [ ] Admin → Moliya: faqat tasdiqlangan to'lovlar hisoblanadi.
- [ ] Admin → Sozlamalar → Tariflar: narx o'zgarishi Premium sahifasi va botda ko'rinadi.
- [ ] Brauzer konsolida CSP xatosi yo'q.
- [ ] Anon kalit bilan `contact_messages`, `chek` va `served_questions` o'qilmaydi.

## Orqaga qaytarish

- **Sayt:** Cloudflare'da oldingi deploy'ni "Rollback" qiling.
- **Funksiyalar:** oldingi git commit'dan qayta deploy qiling.
- **Migratsiya:** migratsiya ma'lumot o'chirmaydi (faqat ishlatilmaydigan `public.admin` jadvali). Siyosatlarni qaytarish kerak bo'lsa, zaxira nusxadan foydalaning. Oddiy holatda qaytarish shart emas.
