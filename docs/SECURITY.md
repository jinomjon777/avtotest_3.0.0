# Xavfsizlik modeli

Oxirgi to'liq audit: 2026-11-04 (3.1.0). Har bir band `supabase/tests/80_hardening_test.sql` bilan tekshiriladi.

## Asosiy tamoyillar

1. **Brauzerga ishonilmaydi.** Premium holati, savollar, videolar va natijalar faqat serverda tekshiriladi (Edge Functions + RLS + `SECURITY DEFINER` funksiyalar).
2. **"Premium"ning yagona ta'rifi:** `public.access_state(uid)`. `is_premium_now()`, `get_user_access_state()`, `get-questions`, `get-video-url` va sayt (`useAccessState`) shundan foydalanadi. Tugash sanalari trigger orqali doim to'ldiriladi.
3. **Pul bilan bog'liq hamma narsa atomar va takrorlanmas.** Premium faqat `grant_premium()` orqali beriladi: faol tarifni uzaytiradi, bir chekni ikki marta ishlata olmaydi.

## Ma'lumotlar va kirish huquqlari

| Obyekt | Brauzer (anon / authenticated) | Server |
| --- | --- | --- |
| `profiles` | o'zini o'qiydi; faqat ism/username/sozlamalarni o'zgartiradi (tarif, sinov, email trigger bilan himoyalangan) | hammasi |
| `chek` | o'z to'lovlarini o'qiydi; yozish yo'q | bot, admin-premium |
| `contact_messages` | yozish (5/daqiqa); o'qish va o'chirish faqat admin | — |
| `test_results` | o'zini o'qiydi; yozish faqat `submit_test()` (60/soat) | — |
| `served_questions` | yo'q | get-questions yozadi va o'qiydi |
| `user_sessions`, `device_removals` | yo'q | check-device |
| `plans` | o'qish | admin-premium |
| `receipts` bucket | yo'q (yopiq) | bot yuklaydi; admin 10 daqiqalik imzolangan havola oladi |

## Premium kontent

- **Savollar:** `get-questions`. Premium foydalanuvchi butun faylni oladi. Bepul foydalanuvchi kunlik limit bilan ko'pi bilan 3 × 40 ta tasodifiy savol oladi. "Xatolarim" uchun faqat server **ilgari bergan** savollar qaytariladi (`served_questions`).
- **Videolar:** `get-video-url`. R2 uchun imzolangan, 3 soatda eskiradigan havola beradi. Saytda faqat video kaliti turadi.
- **Qurilmalar:** bir hisob uchun ko'pi bilan `MAX_DEVICES` (2) ta qurilma. Premium kontent so'rovida `x-device-id` tekshiriladi. Boshqa qurilmani haftasiga ko'pi bilan 3 marta chiqarish mumkin, 30 kun faol bo'lmagan qurilma avtomatik bo'shaydi.

## Edge Functions

- Har bir funksiya JWT'ni `auth.getUser()` bilan tekshiradi. `admin-premium` qo'shimcha ravishda `has_role(uid, 'admin')` ni ham tekshiradi.
- CORS: faqat `ALLOWED_ORIGIN` (standart: smartavto.uz va lokal manzillar).
- `telegram-bot`: `X-Telegram-Bot-Api-Secret-Token` majburiy. Barcha matnlar HTML-escape qilinadi. Admin tugmalari faqat `TELEGRAM_ADMIN_CHAT_ID` dan qabul qilinadi.
- `send-reminders`: cron `x-cron-secret` bilan chaqiradi (vaqtga bog'liq bo'lmagan solishtirish). Sinov xabari 10 daqiqada 3 marta bilan cheklangan.

## Sayt

- CSP **majburiy** (`public/_headers`). Unda HSTS, `frame-ancestors 'none'`, nosniff va COOP ham bor.
- Brauzer paketida maxfiy kalit yo'q. Faqat `VITE_SUPABASE_URL` va anon kalit (`.env.example`).

## Ma'lum, ongli qabul qilingan cheklovlar

- **Javob kalitlari bepul bazada ochiq.** Bepul bazadagi (700 ta savol) to'g'ri javoblar brauzerda turadi. Bu bepul tarifning o'zi. Test natijasi (`submit_test`) o'z-o'ziga mosligi bo'yicha tekshiriladi, lekin javobni server qayta hisoblamaydi. Natijalar faqat foydalanuvchining o'z statistikasiga ta'sir qiladi: reyting yoki mukofot yo'q.
- **Premium foydalanuvchi o'zi ko'rgan savollarni nusxalay oladi.** Buning oldini olish texnik jihatdan mumkin emas. Qurilma limiti hisobni ommaviy ulashishni qiyinlashtiradi.
- **Ro'yxatdan o'tish ochiq.** Bitta odam bir nechta bepul hisob ochishi mumkin. Har biri kunlik limit bilan cheklangan, premium bazani olishga yo'l yo'q.
