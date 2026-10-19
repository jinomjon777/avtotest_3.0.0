// SEO landing sahifalar tekshiruvi: uzunliklar, takrorlanmaslik, sitemap va marshrutlar.
import fs from "fs";
const pages = JSON.parse(fs.readFileSync("src/data/seoLandings.json", "utf8"));
const sitemap = fs.readFileSync("public/sitemap.xml", "utf8");
const app = fs.readFileSync("src/App.tsx", "utf8");
const errs = [];
const seen = (name) => { const m = new Map(); return (v, who) => { const k = v.trim().toLowerCase(); if (m.has(k)) errs.push(`${name} takrorlangan: "${v.slice(0, 50)}" (${m.get(k)} va ${who})`); else m.set(k, who); }; };
const uTitle = seen("title"), uDesc = seen("description"), uH1 = seen("H1"), uPara = seen("abzats"), uFaq = seen("FAQ savoli"), uH2 = seen("H2");
for (const p of pages) {
  const w = p.path;
  if (p.title.length + 11 > 60) errs.push(`${w}: title (Smartavto bilan) ${p.title.length + 11} > 60`);
  if (p.description.length < 110 || p.description.length > 165) errs.push(`${w}: description ${p.description.length} belgi (110–165 kerak)`);
  if (p.faq.length < 3) errs.push(`${w}: FAQ kamida 3 ta`);
  if (p.sections.length < 3) errs.push(`${w}: kamida 3 ta H2 bo'lim`);
  if (p.links.length < 3) errs.push(`${w}: kamida 3 ta ichki havola`);
  uTitle(p.title, w); uDesc(p.description, w); uH1(p.h1, w);
  p.faq.forEach((f) => uFaq(f.question, w));
  p.sections.forEach((s) => { uH2(s.h2, w); (s.paragraphs ?? []).forEach((t) => uPara(t, w)); });
  if (!sitemap.includes(`<loc>https://smartavto.uz${w}</loc>`)) errs.push(`${w}: sitemap.xml da yo'q`);
  for (const l of p.links) if (l.to.startsWith("/") && l.to.split("/").length === 2 && !pages.some(x => x.path === l.to) && !app.includes(`path="${l.to}"`)) errs.push(`${w}: havola ${l.to} marshrutda yo'q`);
}
if (!app.includes("seoLandings.map")) errs.push("App.tsx da landing marshrutlari yo'q");
console.log(`${pages.length} ta landing tekshirildi`);
if (errs.length) { console.log(errs.join("\n")); process.exit(1); } else console.log("OK");
