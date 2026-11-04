#!/usr/bin/env node
// SEO uchun statik HTML: har bir ochiq sahifa uchun alohida fayl (dist/<yo'l>.html) — to'g'ri <title>,
// description, canonical, Open Graph, JSON-LD va sahifaning asosiy MATNI (H1, bo'limlar, FAQ, maqola).
// Qidiruv robotlari (ayniqsa JS'ni to'liq bajarmaydigan Yandex) sahifani JS'siz ham to'liq ko'radi;
// brauzerda React yuklangach #root mazmunini o'zi chizadi (bir xil mazmun).
//
//   vite build && node scripts/prerender.mjs          — dist/ ichida HTML va sitemap.xml
//   node scripts/prerender.mjs --sitemap-only         — faqat public/sitemap.xml ni yangilash
//
// Cloudflare (Workers Assets, html_handling: auto-trailing-slash) "/avtotest" so'roviga
// "avtotest.html" ni qaytaradi; qolgan marshrutlar SPA rejimida index.html ga tushadi.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SITE = "https://smartavto.uz";
const sitemapOnly = process.argv.includes("--sitemap-only");

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const t = readJson("src/locales/uz-lat.json");
const landings = readJson("src/data/seoLandings.json");

// blogArticles.ts — TypeScript; esbuild bilan vaqtincha JS'ga aylantirib import qilamiz
async function loadBlog() {
  const out = await build({
    entryPoints: [path.join(ROOT, "src/data/blogArticles.ts")],
    bundle: true, write: false, format: "esm", platform: "node", logLevel: "error",
  });
  const tmp = path.join(ROOT, "node_modules", ".cache", `blog-${process.pid}.mjs`);
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, out.outputFiles[0].text);
  try {
    return (await import(tmp)).blogArticles;
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

const esc = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;
const today = new Date().toISOString().slice(0, 10);

const NAV = [
  ["/test-ishlash", "Test ishlash"], ["/variant", "Test variantlari"], ["/mavzuli", "Mavzuli testlar"],
  ["/belgilar", "Yo'l belgilari"], ["/darslik", "Video darslik"], ["/blog", "Blog"], ["/pro", "Premium"], ["/contact", "Aloqa"],
];
const navHtml = `<nav aria-label="Asosiy bo'limlar"><ul>${NAV.map(([h, l]) => `<li><a href="${h}">${esc(l)}</a></li>`).join("")}</ul></nav>`;

/** @type {{path:string,title:string,description:string,keywords?:string,h1:string,body:string,ld?:object[],lastmod?:string,priority:number,changefreq:string,ogType?:string}[]} */
const routes = [];
const add = (r) => routes.push({ priority: 0.7, changefreq: "weekly", ...r });

add({
  path: "/", title: t.home.seoTitle, description: t.home.seoDescription, h1: t.home.heroTitle, priority: 1.0,
  body: `<p>${esc(t.home.seoDescription)}</p>`,
});
add({ path: "/test-ishlash", title: "Test ishlash", description: "YHQ imtihon testlari: 20 yoki 50 ta tasodifiy savol, real imtihon vaqti bilan. Ro'yxatdan o'tmasdan bepul boshlang.", h1: "Test ishlash — YHQ onlayn testlari", priority: 0.95, body: "<p>20 savol — 25 daqiqa, 50 savol — 50 daqiqa. Lotin, kirill va rus tillarida.</p>" });
add({ path: "/avto-test-2026", title: "Avto Test 2026 — Onlayn YHQ Test Savollari", description: "Avto test 2026: yangilangan YHQ savollari, real imtihon formatida bepul onlayn test. Haydovchilik guvohnomasi (prava) imtihoniga tayyorgarlik ko'ring — hoziroq boshlang!", h1: "Avto Test 2026 — onlayn YHQ test savollari", priority: 0.9, body: "" });
add({ path: "/avto-test-20-savol", title: "Avto Test 20 Savol — Onlayn 20 Savollik Test", description: "Avto test 20 savol: real imtihon formatida, 25 daqiqada onlayn test ishlang. 20 savollik avtotest bilan haydovchilik guvohnomasi imtihoniga tayyorlaning — bepul boshlang!", h1: "Avto Test 20 savol — onlayn 20 savollik test", priority: 0.9, body: "" });
add({ path: "/variant", title: "Test variantlari - 63 variant", description: "Haydovchilik guvohnomasi uchun 63 ta rasmiy test varianti: har birida 20 savol, natija va xatolar tahlili.", h1: "Test variantlari — 63 variant", priority: 0.8, body: "" });
add({ path: "/mavzuli", title: "Mavzuli testlar - YHQ bo'yicha mavzular", description: "Yo'l harakati qoidalari bo'yicha mavzuli testlar: har bir mavzuni alohida mashq qiling va zaif joylaringizni aniqlang.", h1: "Mavzuli testlar", priority: 0.8, body: "" });
add({ path: "/belgilar", title: t.belgilar.seoTitle, description: t.belgilar.seoDesc, h1: t.belgilar.title, priority: 0.8, body: "" });
add({ path: "/darslik", title: t.darslik.seoTitle, description: t.darslik.seoDesc, keywords: "YHQ darslik, video darslar", h1: t.darslik.title, priority: 0.7, body: "" });
add({ path: "/pro", title: t.pro.seoTitle, description: t.pro.seoDescription, keywords: t.pro.seoKeywords, h1: "Premium obuna", priority: 0.7, body: "" });
add({ path: "/qoshimcha", title: t.qoshimcha.seoTitle, description: t.qoshimcha.seoDesc, h1: t.qoshimcha.title, priority: 0.6, changefreq: "monthly", body: "" });
add({ path: "/contact", title: t.contact.seoTitle, description: t.contact.seoDescription, h1: "Aloqa", priority: 0.5, changefreq: "monthly", body: "" });

for (const p of landings) {
  const sections = p.sections.map((s) => `<section><h2>${esc(s.h2)}</h2>${(s.paragraphs ?? []).map((x) => `<p>${esc(x)}</p>`).join("")}${(s.bullets ?? []).length ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}</section>`).join("");
  const faq = p.faq?.length ? `<section><h2>Ko'p beriladigan savollar</h2>${p.faq.map((f) => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join("")}</section>` : "";
  const links = p.links?.length ? `<ul>${p.links.map((l) => `<li><a href="${esc(l.to)}">${esc(l.label)}</a></li>`).join("")}</ul>` : "";
  add({
    path: p.path, title: p.title, description: p.description, keywords: p.keywords, h1: p.h1, priority: 0.85,
    body: `<p>${esc(p.lead)}</p>${sections}${faq}${links}`,
    ld: p.faq?.length ? [{
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
    }] : [],
  });
}

const blog = await loadBlog();
add({
  path: "/blog", title: "Blog — Avto Test va Prava Imtihoni Bo'yicha Maqolalar",
  description: "Avto test, YHQ savollari, yo'l belgilari va prava imtihoniga tayyorgarlik bo'yicha foydali maqolalar va amaliy maslahatlar.",
  h1: "Blog", priority: 0.7,
  body: `<ul>${blog.map((a) => `<li><a href="/blog/${a.slug}">${esc(a.title)}</a> — ${esc(a.excerpt)}</li>`).join("")}</ul>`,
  lastmod: blog.map((a) => a.publishedDate).sort().at(-1),
});
for (const a of blog) {
  add({
    path: `/blog/${a.slug}`, title: a.seoTitle, description: a.seoDescription, keywords: a.keywords, h1: a.title,
    priority: 0.6, changefreq: "monthly", lastmod: a.publishedDate, ogType: "article",
    body: `<p><time datetime="${a.publishedDate}">${a.publishedDate}</time></p>${a.sections.map((s) => `<section><h2>${esc(s.heading)}</h2>${s.paragraphs.map((x) => `<p>${esc(x)}</p>`).join("")}</section>`).join("")}${a.relatedLinks?.length ? `<ul>${a.relatedLinks.map((l) => `<li><a href="${esc(l.path)}">${esc(l.label)}</a></li>`).join("")}</ul>` : ""}`,
    ld: [{
      "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.seoDescription,
      datePublished: a.publishedDate, dateModified: a.publishedDate, inLanguage: "uz",
      author: { "@type": "Organization", name: "Smartavto.uz" },
      publisher: { "@type": "Organization", name: "Smartavto.uz", logo: { "@type": "ImageObject", url: `${SITE}/logo-premium.png` } },
      mainEntityOfPage: `${SITE}/blog/${a.slug}`,
    }],
  });
}

// ── sitemap.xml ─────────────────────────────────────────────────────
function sitemap() {
  const urls = routes.map((r) => `  <url>\n    <loc>${SITE}${r.path}</loc>\n    <lastmod>${r.lastmod ?? today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority.toFixed(2)}</priority>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- AVTOMATIK: node scripts/prerender.mjs. Qo'lda o'zgartirmang. -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

if (sitemapOnly) {
  fs.writeFileSync(path.join(ROOT, "public/sitemap.xml"), sitemap());
  console.log(`public/sitemap.xml: ${routes.length} ta URL`);
  process.exit(0);
}

// ── HTML fayllar ────────────────────────────────────────────────────
const templatePath = path.join(DIST, "index.html");
if (!fs.existsSync(templatePath)) {
  console.error("dist/index.html topilmadi — avval `vite build` ni ishga tushiring");
  process.exit(1);
}
const template = fs.readFileSync(templatePath, "utf8");

function setMeta(html, attr, key, value) {
  const re = new RegExp(`<meta\\s+(?:data-rh="true"\\s+)?${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`, "i");
  // data-rh: react-helmet-async brauzerda shu teglarni o'zinikiga almashtiradi (takror teg qolmaydi)
  const tag = `<meta data-rh="true" ${attr}="${key}" content="${esc(value)}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function render(r) {
  const fullTitle = r.path === "/" ? r.title : `${r.title} | Smartavto`;
  const url = `${SITE}${r.path}`;
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`);
  html = setMeta(html, "name", "description", r.description);
  if (r.keywords) html = setMeta(html, "name", "keywords", r.keywords);
  html = html.replace(/<link (?:data-rh="true" )?rel="canonical" href="[^"]*"\s*\/?>/, `<link data-rh="true" rel="canonical" href="${url}" />`);
  html = html.replace(/<link rel="alternate" hreflang="uz" href="[^"]*"\s*\/?>/, `<link rel="alternate" hreflang="uz" href="${url}" />`);
  html = setMeta(html, "property", "og:url", url);
  html = setMeta(html, "property", "og:type", r.ogType ?? "website");
  html = setMeta(html, "property", "og:title", fullTitle);
  html = setMeta(html, "property", "og:description", r.description);
  html = setMeta(html, "name", "twitter:title", fullTitle);
  html = setMeta(html, "name", "twitter:description", r.description);
  if (r.ld?.length) html = html.replace("</head>", `    ${r.ld.map(jsonLd).join("\n    ")}\n  </head>`);

  // #root ichidagi statik mazmun. Fayl SPA "fallback" sifatida boshqa yo'lda ochilsa (faqat index.html),
  // inline skript uni darhol olib tashlaydi — boshqa sahifada bosh sahifa matni ko'rinmaydi.
  const content =
    `<div id="prerender" data-path="${r.path}" style="max-width:860px;margin:0 auto;padding:24px 16px;font-family:system-ui,sans-serif;line-height:1.6">` +
    `<header><a href="/"><strong>Smartavto.uz</strong></a>${navHtml}</header>` +
    `<main><h1>${esc(r.h1)}</h1>${r.body}</main>` +
    `<footer><p>© ${new Date().getFullYear()} Smartavto.uz</p></footer></div>` +
    `<script>(function(){var e=document.getElementById("prerender");if(e&&e.getAttribute("data-path")!==location.pathname.replace(/\\/$/,"")&&!(location.pathname==="/"&&e.getAttribute("data-path")==="/"))e.remove()})()</script>`;
  html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*(<script type="module")/, `<div id="root">${content}</div>\n    $1`);
  if (!html.includes('id="prerender"')) {
    // Vite skripti <head> ichida bo'lsa
    html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*<\/body>/, `<div id="root">${content}</div>\n  </body>`);
  }
  return html;
}

let n = 0;
for (const r of routes) {
  const html = render(r);
  if (!html.includes('id="prerender"')) throw new Error(`#root topilmadi: ${r.path}`);
  const file = r.path === "/" ? path.join(DIST, "index.html") : path.join(DIST, `${r.path.slice(1)}.html`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  n++;
}
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap());
console.log(`prerender: ${n} ta sahifa, sitemap.xml ${routes.length} ta URL`);
