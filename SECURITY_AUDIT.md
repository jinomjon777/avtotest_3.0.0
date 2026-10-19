# Xavfsizlik va tezlik auditi (Phase 12)

## Tuzatildi (kodda)
| Muammo | Tuzatish |
| --- | --- |
| Telegram webhook maxfiy kalitsiz ham ishlayotgan edi (`TELEGRAM_WEBHOOK_SECRET` ixtiyoriy) | Kalit sozlanmagan bo'lsa webhook 503 bilan yopiladi (`TELEGRAM_ALLOW_NO_SECRET=1` — faqat vaqtincha) |
| Edge funksiyalarda CORS hamma joyga ochiq (`*`) | `ALLOWED_ORIGIN` o'zgaruvchisi bilan cheklanadi (o'rnatilmasa avvalgidek ishlaydi) |
| Cloudflare'da xavfsizlik sarlavhalari yo'q (`netlify.toml` faqat Netlify'da ishlaydi) | `public/_headers`: nosniff, X-Frame-Options, HSTS, Referrer/Permissions-Policy, CSP (hozircha Report-Only) |
| `test_results` ga brauzerdan soxta natija yozish | Phase 2: `submit_test` RPC + `post-deploy/001_lock_test_results_writes.sql` |
| Statik savollar uchun xesh/kesh sarlavhalari yo'q | `_headers`: `/assets` va `/fonts` — 1 yil, `/data` — 5 daqiqa + qayta tekshirish |
| **Premium savollar ochiq edi**: `/mavzuli2/*.json` (1100 savol) va `/data/variants/*.json` (61 variant) URL orqali hammaga yuklanardi | Fayllar `supabase/functions/get-questions/data/` ga ko'chirildi; faqat `get-questions` edge funksiyasi beradi: butun fayl — faqat premium, bepul — kunlik limit bilan serverdan tasodifiy 20–40 ta, "Xatolarim" uchun — faqat o'zi ko'rgan savollar. Avval yuklab olinganlarini qaytarib bo'lmaydi |

## Siz bajarishingiz kerak (kod bilan hal bo'lmaydi)
1. **`.env` dagi `VITE_SUPABASE_SERVICE_KEY` va `VITE_ADMIN_SECRET` ni o'chiring va service kalitni almashtiring (rotate).**
   Fayl gitga kirmagan va `src` da ishlatilmaydi (yig'ilgan `dist` da ham yo'q), lekin u ushbu ishga arxiv ichida yuborilgan: kalitni oshkor bo'lgan deb hisoblang. Supabase → Project Settings → API → service_role → *Reset*. `VITE_` prefiksi kalitni brauzer paketiga kiritadi, shuning uchun maxfiy kalit hech qachon bunday nomlanmasin.
2. **Telegram:** funksiya o'zgaruvchilariga `TELEGRAM_WEBHOOK_SECRET` (tasodifiy uzun matn) qo'shing va webhookni shu kalit bilan qayta ro'yxatdan o'tkazing:
   `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FUNKSIYA_URL>&secret_token=<KALIT>`. **Funksiyani shundan oldin deploy qilmang**, aks holda bot to'xtaydi.
3. **CORS:** funksiyalarga `ALLOWED_ORIGIN=https://smartavto.uz` qo'shing (sayt `www` bilan ham ochilsa, avval bitta asosiy manzilga yo'naltiring).
4. **CSP:** deploydan so'ng sayt bo'ylab (test, darslik video, to'lov, Telegram) brauzer konsolida "Content-Security-Policy-Report-Only" ogohlantirishlari qolmaganini tekshiring, so'ng `_headers` da nomini `Content-Security-Policy` ga o'zgartiring.
5. `001_lock_test_results_writes.sql` ni yangi sayt deploy qilinib, `user_answers` ga yozuvlar tushayotgani tasdiqlangandan keyin ishga tushiring.
6. Supabase Auth → "Leaked password protection" ni yoqing.

## Tekshirildi, muammo topilmadi
- **XSS:** `dangerouslySetInnerHTML` faqat `ui/chart.tsx` da (statik konfiguratsiya, foydalanuvchi matni emas). Foydalanuvchi HTML'i hech qayerda chiqarilmaydi.
- **SQL injection:** barcha so'rovlar Supabase klienti yoki parametrli RPC orqali; qo'lda SQL yig'ish yo'q.
- **CSRF:** autentifikatsiya cookie emas, `Authorization: Bearer` sarlavhasida: CSRF qo'llanilmaydi.
- **Admin:** `admin-premium` har so'rovda JWT va `has_role(..., 'admin')` ni serverda tekshiradi; `get_admin_analytics` ham.
- **Premium:** `get-premium-questions` server vaqti bilan tarifni tekshiradi.
- **Rate limiting:** `submit_test` soatiga 60 ta, `track_event` 5 soniyada 1 ta.

## Ma'lum, o'zgartirilmagan xavflar (qaror kerak)
- `auto-confirm-signup` autentifikatsiyasiz: faqat 10 daqiqadan yosh, tasdiqlanmagan hisobni tasdiqlaydi (UUID taxmin qilinmaydi). Bu email tasdiqlashni ongli ravishda o'chirib qo'yadi: boshqa odamning emaili bilan ro'yxatdan o'tish mumkin.
- `get-premium-questions` butun premium bazani bitta javobda beradi: premium foydalanuvchi uni to'liq nusxalashi mumkin.

## Tezlik (haqiqiy `vite build` bilan o'lchandi)
| Ko'rsatkich | Oldin | Keyin |
| --- | --- | --- |
| Asosiy JS (gzip) | 223.6 KB bitta fayl | ~204 KB, 5 fayl (vendor alohida) |
| Ilova kodi o'zgargandan keyin qayta yuklanadigan JS | 223.6 KB | ~94 KB (vendor keshdan) |
| `TestIshlash` (test interfeyslari) | bosh sahifa paketida | alohida chunk (9.8 KB gzip), kerak bo'lganda yuklanadi |
| `belgilar/184782...jpg` | 1.9 MB (CMYK) | 44 KB |

Qilinmadi: `/images` (135 MB) allaqachon asosan WebP va talab bo'yicha yuklanadi; admin paneli (132 KB) allaqachon alohida chunk.
