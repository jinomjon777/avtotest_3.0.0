/**
 * Static HTML Generator for SEO
 * 
 * This script generates static HTML snapshots for each route
 * to ensure search engine bots can see content without JavaScript.
 * 
 * Run after build: node scripts/generate-static-html.js
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

// SEO routes with their content
const routes = [
  {
    path: '/',
    title: 'Avtotestlar 2026 - Avtotestu | Avtomaktab Online Imtihonlar',
    description: 'Haydovchilik guvohnomasini olish uchun YHQ testlari, yo\'l belgilari va onlayn avtotestlar. 2026 yil yangilangan savollar bilan prava olishga tayyorlaning.',
    h1: 'Avtoexclusive o\'quv markazi!',
    content: `
      <p>Professional haydovchilik guvohnomasini olish uchun zamonaviy platforma</p>
      <h2>Bizning Afzalliklar</h2>
      <ul>
        <li>Professional Avtomaktab - Tajribali ustozlar rahbarligida sifatli ta'lim oling.</li>
        <li>Zamonaviy Avto Texnika - Eng so'nggi texnologiyalar bilan jihozlangan avtomobillar.</li>
      </ul>
      <h2>AvtoTest haqida</h2>
      <p>AvtoTest — bu haydovchilik guvohnomasi olishni xohlovchilar uchun yaratilgan zamonaviy onlayn platforma bo'lib, foydalanuvchilarga Yo'l harakati qoidalari (YHQ) bo'yicha test savollarini interaktiv tarzda yechish imkonini beradi.</p>
    `
  },
  {
    path: '/belgilar',
    title: 'Yo\'l Belgilari 2026 | Avtotestu - Barcha Kategoriyalar',
    description: 'O\'zbekiston yo\'l belgilari to\'liq ro\'yxati: ogohlantiruvchi, taqiqlovchi, buyuruvchi, axborot belgilari. Rasmlar va tushuntirishlar bilan.',
    h1: 'Yo\'l Belgilari',
    content: `
      <p>O'zbekiston Respublikasi yo'l belgilarining to'liq katalogi</p>
      <h2>Belgilar kategoriyalari</h2>
      <ul>
        <li>Ogohlantiruvchi belgilar - Xavfli joylar haqida ogohlantiradi</li>
        <li>Taqiqlovchi belgilar - Ma'lum harakatlarni taqiqlaydi</li>
        <li>Buyuruvchi belgilar - Majburiy ko'rsatmalar beradi</li>
        <li>Axborot belgilari - Foydali ma'lumotlar beradi</li>
        <li>Xizmat ko'rsatish belgilari - Xizmatlar joylashuvini ko'rsatadi</li>
      </ul>
    `
  },
  {
    path: '/variant',
    title: 'Test Variantlari 2026 | Avtotestu - 40 ta Variant',
    description: 'YHQ test variantlari - 40 ta variant, har birida 20 ta savol. Haqiqiy imtihonga tayyorgarlik uchun.',
    h1: 'Test Variantlari',
    content: `
      <p>YHQ imtihoniga tayyorgarlik uchun 40 ta test varianti</p>
      <h2>Variant tanlang</h2>
      <p>Har bir variantda 20 ta savol mavjud. Testni tugatgandan so'ng natijangizni ko'rasiz.</p>
      <ul>
        <li>Variant 1-10: Boshlang'ich daraja</li>
        <li>Variant 11-20: O'rta daraja</li>
        <li>Variant 21-30: Yuqori daraja</li>
        <li>Variant 31-40: Ekspert daraja</li>
      </ul>
    `
  },
  {
    path: '/mavzuli',
    title: 'Mavzuli Testlar 2026 | Avtotestu - Mavzu bo\'yicha o\'rganing',
    description: 'YHQ mavzulari bo\'yicha testlar: yo\'l belgilari, svetofor, ustunlik, to\'xtash va to\'xtab turish qoidalari.',
    h1: 'Mavzuli Testlar',
    content: `
      <p>Mavzu bo'yicha YHQ testlari - har bir mavzuni alohida o'rganing</p>
      <h2>Mavzular ro'yxati</h2>
      <ul>
        <li>Yo'l belgilari va chiziqlar</li>
        <li>Svetofor signallari</li>
        <li>Tartibga soluvchi ishoralari</li>
        <li>Harakatlanish ustunligi</li>
        <li>To'xtash va to'xtab turish</li>
        <li>Yo'l harakati xavfsizligi</li>
      </ul>
    `
  },
  {
    path: '/test-ishlash',
    title: 'Test Ishlash 2026 | Avtotestu - Onlayn YHQ Testi',
    description: 'YHQ onlayn test - tezkor rejimda 20 ta tasodifiy savol. Natijani darhol ko\'ring va xatolarni tahlil qiling.',
    h1: 'Test Ishlash',
    content: `
      <p>YHQ bo'yicha onlayn test topshiring</p>
      <h2>Test rejimi</h2>
      <p>Tezkor test - 20 ta tasodifiy savol, vaqt chegarasiz</p>
      <h2>Qanday ishlaydi?</h2>
      <ol>
        <li>Boshlash tugmasini bosing</li>
        <li>Har bir savolga javob bering</li>
        <li>Test yakunida natijangizni ko'ring</li>
        <li>Xatolaringizni tahlil qiling</li>
      </ol>
    `
  },
  {
    path: '/darslik',
    title: 'YHQ Darslik 2026 | Avtotestu - Yo\'l Harakati Qoidalari Kitobi',
    description: 'Yo\'l harakati qoidalari to\'liq darslik - barcha boblar, qoidalar va tushuntirishlar. Prava olish uchun nazariy bilim.',
    h1: 'YHQ Darslik',
    content: `
      <p>Yo'l harakati qoidalari bo'yicha to'liq darslik</p>
      <h2>Darslik tarkibi</h2>
      <ul>
        <li>1-bob: Umumiy qoidalar</li>
        <li>2-bob: Haydovchi vazifalari</li>
        <li>3-bob: Piyodalar vazifalari</li>
        <li>4-bob: Yo'l belgilari</li>
        <li>5-bob: Yo'l chiziqlari</li>
        <li>6-bob: Svetofor va tartibga soluvchi</li>
      </ul>
    `
  },
  {
    path: '/qoshimcha',
    title: 'Qo\'shimcha Ma\'lumotlar | Avtotestu - Foydali Resurslar',
    description: 'Haydovchilik guvohnomasi olish uchun qo\'shimcha ma\'lumotlar: hujjatlar, talablar, manzillar.',
    h1: 'Qo\'shimcha Ma\'lumotlar',
    content: `
      <p>Haydovchilik guvohnomasi olish uchun foydali ma'lumotlar</p>
      <h2>Kerakli hujjatlar</h2>
      <ul>
        <li>Pasport nusxasi</li>
        <li>Tibbiy ma'lumotnoma</li>
        <li>Foto 3x4</li>
        <li>Davlat boji to'lovi kvitansiyasi</li>
      </ul>
    `
  },
  {
    path: '/pro',
    title: 'Pro Obuna | Avtotestu - Premium Imkoniyatlar',
    description: 'Avtotestu Pro obunasi - cheksiz testlar, statistika, reklama yo\'q. Premium imkoniyatlar bilan tezroq tayyorlaning.',
    h1: 'Pro Obuna',
    content: `
      <p>Premium imkoniyatlar bilan tezroq tayyorlaning</p>
      <h2>Pro afzalliklari</h2>
      <ul>
        <li>Cheksiz test topshirish</li>
        <li>Batafsil statistika</li>
        <li>Reklama yo'q</li>
        <li>Ustuvor yordam</li>
      </ul>
    `
  },
  {
    path: '/contact',
    title: 'Aloqa | Avtotestu - Bog\'lanish',
    description: 'Avtotestu bilan bog\'laning - savollar, takliflar va hamkorlik uchun. Telegram, email va ijtimoiy tarmoqlar.',
    h1: 'Bog\'lanish',
    content: `
      <p>Biz bilan bog'laning</p>
      <h2>Aloqa ma'lumotlari</h2>
      <ul>
        <li>Telegram: @avtotestu</li>
        <li>Email: info@avtotestu.uz</li>
      </ul>
      <h2>Ish vaqti</h2>
      <p>Dushanba - Shanba: 9:00 - 18:00</p>
    `
  }
];

function generateStaticHTML(route) {
  const canonical = `https://www.avtotestu.uz${route.path}`;
  
  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${route.title}</title>
  <meta name="description" content="${route.description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${route.title}">
  <meta property="og:description" content="${route.description}">
  <meta property="og:image" content="https://www.avtotestu.uz/rasm1.webp">
  <meta property="og:locale" content="uz_UZ">
  
  <!-- Prerender.io hint -->
  <meta name="fragment" content="!">
  
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a365d; }
    h2 { color: #2d3748; margin-top: 24px; }
    ul, ol { padding-left: 20px; }
    li { margin: 8px 0; }
    p { line-height: 1.6; color: #4a5568; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/">Bosh sahifa</a> |
      <a href="/test-ishlash">Test ishlash</a> |
      <a href="/belgilar">Yo'l belgilari</a> |
      <a href="/variant">Variantlar</a> |
      <a href="/mavzuli">Mavzuli</a>
    </nav>
  </header>
  <main>
    <h1>${route.h1}</h1>
    ${route.content}
  </main>
  <footer>
    <p>© 2026 Avtotestu.uz - Haydovchilik guvohnomasi olish uchun YHQ testlari</p>
  </footer>
</body>
</html>`;
}

// Generate static HTML for each route
console.log('🔧 Generating static HTML for SEO...\n');

routes.forEach(route => {
  const filePath = route.path === '/' 
    ? join(distDir, 'static', 'index.html')
    : join(distDir, 'static', route.path, 'index.html');
  
  const dir = dirname(filePath);
  
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  const html = generateStaticHTML(route);
  writeFileSync(filePath, html, 'utf-8');
  
  console.log(`✅ Generated: /static${route.path === '/' ? '' : route.path}/index.html`);
});

console.log('\n✨ Static HTML generation complete!');
console.log('\nThese files serve as fallback for bots that cannot execute JavaScript.');
