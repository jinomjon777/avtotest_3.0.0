// learn.ts dagi barcha tl("...") kalitlari 3 tilda mavjudligini tekshiradi.
import fs from "fs"; import path from "path";
const src = fs.readFileSync("src/locales/learn.ts", "utf8");
const defined = new Set([...src.matchAll(/\["([\w.]+)",\s*"((?:[^"\\]|\\.)*)",\s*"((?:[^"\\]|\\.)*)",\s*"((?:[^"\\]|\\.)*)"\]/g)].filter(m => m[2] && m[3] && m[4]).map(m => m[1]));
const used = new Set(); const dyn = [];
(function walk(d){ for (const f of fs.readdirSync(d,{withFileTypes:true})) { const p=path.join(d,f.name); if (f.isDirectory()) walk(p); else if (/\.(tsx?|jsx?)$/.test(f.name) && !p.endsWith("learn.ts")) { const s=fs.readFileSync(p,"utf8"); for (const m of s.matchAll(/\btl\(\s*"([\w.]+)"/g)) used.add(m[1]); for (const m of s.matchAll(/\btl\(\s*`([^`]+)`/g)) dyn.push(m[1]); } } })("src");
const missing=[...used].filter(k=>!defined.has(k));
for (const d of dyn) { const pre=d.split("${")[0]; if (![...defined].some(k=>k.startsWith(pre))) missing.push(pre+"*"); }
console.log(`aniqlangan: ${defined.size}, ishlatilgan: ${used.size}`);
if (missing.length) { console.log("YETISHMAYDI:", missing); process.exit(1); } else console.log("OK: barcha kalitlar 3 tilda mavjud");
