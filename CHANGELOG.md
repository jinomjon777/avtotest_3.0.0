# O'zgarishlar

## 3.1.0 — 2026-11-04 · To'liq xavfsizlik va sifat auditi

### Xavfsizlik (kritik)
- **Premium savollarni o'g'irlash yopildi.** Bepul hisob ochiq `question_locator.json` dagi kalitlarni "saqlab" (`toggle_saved_question`) yoki soxta javob yuborib (`submit_test`) butun premium bazani `get-questions → keys` orqali olishi mumkin edi. Endi egalik faqat server haqiqatan bergan savollar asosida aniqlanadi (`served_questions`).
- **Premium videolar yopildi.** 209 ta ommaviy `r2.dev` havolasi sayt paketidan va `public/malumotlar.json` dan olib tashlandi. Havolani endi `get-video-url` beradi: premium va qurilma tekshiruvidan keyin, imzolangan va muddatli holda.
- **Aloqa xabarlari himoyalandi.** `contact_own_select` siyosati anon kalit bilan barcha ism, telefon va xabarlarni o'qishga ruxsat berardi. Endi ularni faqat admin o'qiydi.
- **To'lov cheklari yopildi.** `receipts` bucket endi ommaviy emas; admin chekni 10 daqiqalik imzolangan havola orqali ko'radi.

### Xavfsizlik (yuqori va o'rta)
- **Telegram bot:**
  - chek kelgan paytdagi tarif va summa muhrlanadi (avval keyin tanlangan tarif yozilishi mumkin edi);
  - ✅ bosilganda premium darhol beriladi;
  - barcha matn HTML-escape qilinadi;
  - email tekshirish urinishlari cheklangan.
- **`grant_premium()`:** premium berishning yagona atomar yo'li. Faol tarifni uzaytiradi, bitta chek ikki marta ishlatilmaydi.
- **Yagona premium ta'rifi:** `access_state()`. Avval 4 xil ta'rif bor edi.
- **Tarif himoyasi:**
  - `protect_tariff_fields` endi SQL Editor'dagi o'zgarishni jimgina bekor qilmaydi;
  - `profiles.email` brauzerdan o'zgartirilmaydi va `auth.users` bilan sinxron.
- **Qurilma limiti endi server tomonida.**
  - Google orqali kirishda ham ishlaydi.
  - Eski qurilmalar 30 kunda o'zi bo'shaydi.
  - Foydalanuvchi qurilmalarini boshqaradi; haftasiga 3 tagacha boshqa qurilmani chiqara oladi.
- **Autentifikatsiyasiz `auto-confirm-signup` olib tashlandi.** Endi Supabase "Confirm email" sozlamasi ishlatiladi.
- **Huquqlar qisqartirildi:**
  - `has_role()` boshqa foydalanuvchining rolini oshkor qilmaydi;
  - `check_rate_limit` faqat server uchun;
  - `test_results` ga to'g'ridan-to'g'ri yozish yopildi;
  - eski `admin` jadvali o'chirildi.
- **Edge Functions:**
  - umumiy `_shared` moduli;
  - CORS ruxsat ro'yxati (avval `*`);
  - service kalit nomlari birlashtirildi (`SB_SERVICE_ROLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`);
  - ichki xato matnlari foydalanuvchiga chiqmaydi.
- **CSP majburiy rejimga o'tkazildi** (avval faqat Report-Only edi), HSTS `includeSubDomains`.

### Admin panel
- **Moliya** endi faqat tasdiqlangan to'lovlar (`chek`) asosida. Avval joriy tarifdan "taxmin" qilinardi.
- **To'lovlar:** holatlar (kutilmoqda, tasdiqlangan, rad etilgan), tasdiqlash va rad etish, chekni imzolangan havola bilan ko'rish.
- **Tariflar narxi** "Sozlamalar → Tariflar"dan o'zgartiriladi. Premium sahifasi, bot va moliya bitta manbadan (`plans`) oladi.
- **1000 qator chegarasi:** barcha ro'yxatlar sahifalab to'liq o'qiladi.
- **Bazada bo'lmagan RPC'lar** (`admin_create_user`, `admin_delete_user`) edge funksiyaga ko'chirildi.

### Foydalanuvchi uchun
- **Premium "Test ishlash"** butun bazani (~3.5 MB) emas, faqat kerakli savollarni yuklaydi.
- **Rus tili** tanlanganda bepul testda haqiqiy rus tilidagi savollar chiqadi (339 ta). Avval kirillcha o'zbek savollari chiqardi.
- **Profil:** "To'lovlarim" (holati bilan) va "Qurilmalar" bo'limlari. Eski, ishlamaydigan chek havolasi olib tashlandi.
- **Premium belgisi** (`is_pro`) endi muddati tugaganda to'g'ri o'chadi.

### SEO
- Har bir ochiq sahifa uchun statik HTML (25 ta): to'g'ri title, description, canonical, Open Graph, JSON-LD (FAQ, Article) va to'liq matn.
- `sitemap.xml` build paytida avtomatik yaratiladi.
- Takroriy canonical teglari yo'qotildi; eski `public/static/` nusxalari o'chirildi.

### Kod sifati
- TypeScript `strict: true`, ESLint 0 xato / 0 ogohlantirish.
- Supabase turlari migratsiyalardan yaratiladi (`scripts/gen-db-types.py`).
- `index.html` dagi global `!important` CSS qatlamlari olib tashlandi.
- Savol formatlari bitta modulda (`questionFormat.ts`).
- Ishlatilmaydigan kod o'chirildi: 95 ta fayl (shundan 59 tasi `src/` da), 33 ta npm paket, eski `mavzuli/` ilovasi, `avtotest/`, `netlify.toml`, `bun.lock`.
- CI: turlar, lint, build, Deno check va SQL testlar. SQL testlar soni 174 tadan 208 taga yetdi.
