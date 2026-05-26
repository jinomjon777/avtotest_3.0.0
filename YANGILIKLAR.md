# Avtotest — Yangiliklar va O'zgarishlar

## Yangilangan fayllar

### 🎨 Sahifalar (src/pages/)
- **Home.tsx** — To'liq qayta loyihalangan bosh sahifa
  - Qora fon (`#0A0B14`), Syne shrifti, geometrik grid overlay
  - Interaktiv test card mockup
  - Animatsiyali statistika counter (Intersection Observer)
  - 3-tab quick navigation (Variantlar, Mavzuli, Yo'l belgilari)
  - Testimonials, Features, Social links bo'limlari

- **Pro.tsx** — To'liq qayta loyihalangan Premium sahifa
  - Oddiy vs Premium jadval
  - Hover effektli plan cardlar (Haftalik / Oylik / 3 Oylik)
  - "Qanday olish" 3-qadam yo'riqnomasi

### 🔒 Xavfsizlik (src/hooks/)
- **useAccessState.ts** — Yangilangan
  - Edge Function'ga murojaat qiladi (eski: to'g'ridan DB o'qish)
  - Cache mexanizmi qo'shildi (60 soniya)
  - Fallback qoldirildi (server ishlamas holatda)

### 🛡️ Backend (supabase/)
- **functions/get-user-access/index.ts** — Yangi Edge Function
  - Access tekshiruvi server-side
  - JWT tekshiruvi
  - Server vaqti bilan tariff hisoblash

- **migrations/20260526_security_fixes.sql** — Xavfsizlik migratsiyasi
  - Admin parollarini bcrypt bilan hashlash
  - `chek` jadvaliga RLS qo'shildi
  - `tariff_days` ni foydalanuvchi o'zgartira olmasligi uchun trigger
  - Rate limiting jadvali va funksiyasi
  - Audit log

### ⚙️ Konfiguratsiya
- **netlify.toml** — CSP, X-Frame-Options va boshqa xavfsizlik headerlari

## Deploy qilish tartibi

### 1. Supabase migratsiyani ishga tushiring
```bash
supabase db push
# yoki Supabase Dashboard > SQL Editor'da
# supabase/migrations/20260526_security_fixes.sql ni bajarib oling
```

### 2. Edge Function deploy qiling
```bash
supabase functions deploy get-user-access
```

### 3. Netlify'ga deploy qiling
```bash
npm run build
# yoki Netlify avtomatik deploy qiladi (git push bilan)
```

### 4. Muhit o'zgaruvchilarini tekshiring
`.env.example` asosida `.env.local` fayl yarating:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

## Eslatmalar
- Yangi dizayn `Syne` shriftini Google Fonts CDN orqali oladi (internet kerak)
- Edge Function Supabase Pro plan talab qilmaydi (bepul tier'da ishlaydi)
- SQL migratsiyadan oldin database backup oling!
