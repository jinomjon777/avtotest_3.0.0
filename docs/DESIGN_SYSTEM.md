# SmartAvto dizayn tizimi (o'quv bo'limlari)

Kabinet, Xatolarim, Zaif mavzular, Mashq va Real imtihon sahifalari shu qoidalar bo'yicha qurilgan.

## Tamoyillar
- Mobil birinchi: asosiy tugma 48 px balandlikda (`h-12`), qo'shimchalari 44 px (`h-11`).
- Tekis dizayn: gradient, blur va ortiqcha animatsiya yo'q. Karta = `Card` + `border-border`.
- Har sahifada bitta aniq asosiy harakat (CTA), qolganlari `outline` yoki `ghost`.
- Uzbek-first: matnlar `src/locales/learn.ts` da (lotin, kirill, rus). Sahifada qattiq yozilgan matn bo'lmasin.

## Ranglar (faqat semantik tokenlar)
| Ma'no | Token | Qachon |
| --- | --- | --- |
| Yaxshi | `success` | natija ≥ 85% |
| O'rtacha | `warning` | 70–84% |
| Zaif | `destructive` | < 70% |
| Ma'lumot kam | `muted` | hisoblash uchun javob yetarli emas |
| Asosiy harakat | `primary` | tugma, tanlangan holat |

Foizni rangga aylantirish faqat `toneFor()` (`src/lib/learnTheme.ts`) orqali. Qo'lda `text-green-500` kabi ranglar yozilmaydi.

## Komponentlar
- `ProgressRing` — bitta asosiy ko'rsatkich (tayyorlik).
- `MeterBar` — qatordagi foiz (mavzu aniqligi, savollar progressi).
- `Card` — tekis konteyner. `EmptyState` — bo'sh holat, doim harakat tugmasi bilan.
- `PracticeSession` — darhol tekshiruvli mashq. `ExamSession` — taymerli, yakunda natija beradigan imtihon.
- `MistakeCard` — xato savol: savol, sizning javobingiz, to'g'ri javob.

## Holatlar
- Yuklanish: `Skeleton`, matn bilan emas.
- Bo'sh: nima uchun bo'shligi + keyingi qadam tugmasi.
- Migratsiya qo'llanmagan (`isSetupMissing`): "bo'lim sozlanmagan" xabari, sahifa yiqilmaydi.
- Xatolik: `common.error` + "Qayta urinish".

## Natija "variant" kodlari (`test_results.variant`)
- 1–63: oddiy variantlar. 98: real imtihon. 99: mashq.

## Yangi sahifa uchun tekshiruv ro'yxati
1. Matnlar `learn.ts` da va `node scripts/check-learn-i18n.mjs` o'tadi.
2. Ranglar `toneFor` orqali.
3. Bitta CTA, 375 px kenglikda gorizontal skroll yo'q.
4. Yuklanish, bo'sh va xatolik holatlari bor.
