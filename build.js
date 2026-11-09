// Baut die Website: kopiert site/ und content/ nach dist/ und fasst alle Texte in dist/projekte.json zusammen.
// Läuft automatisch auf Vercel (siehe vercel.json). Lokal: `node build.js`
// Keine Abhängigkeiten nötig.

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SITE = path.join(ROOT, "site");
const CONTENT = path.join(ROOT, "content");
const OUT = path.join(ROOT, "dist");

const SCREENS = ["wand", "e1", "e2", "e3", "e4"];
const IMG = /\.(jpe?g|png|gif|webp|avif|svg)$/i;
const LED = /\.(gif|png|apng|jpe?g|webp|mp4|m4v|webm|mov)$/i;
const BLACK = /^(schwarz|black|-|none|aus)?$/i;

const warnings = [];
const warn = msg => warnings.push(msg);

// ---- Hilfsfunktionen ----
const sortNat = arr => arr.sort((a, b) => a.localeCompare(b, "de", { numeric: true }));
const list = (dir, re) => fs.existsSync(dir) ? sortNat(fs.readdirSync(dir).filter(f => !f.startsWith(".") && re.test(f))) : [];
const url = (...parts) => "content/" + parts.map(encodeURIComponent).join("/");

// Kopfteil (zwischen --- und ---) lesen: einfache "schlüssel: wert"-Zeilen, eine Ebene eingerückt für "led:"
function frontmatter(raw) {
  const m = raw.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  let group = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const mm = line.match(/^(\s*)([^:\s][^:]*?):\s*(.*)$/);
    if (!mm) continue;
    const [, indent, keyRaw, valRaw] = mm;
    const key = keyRaw.trim().toLowerCase();
    const val = valRaw.replace(/\s+#.*$/, "").trim().replace(/^(["'])(.*)\1$/, "$2");
    if (indent.length && group) { group[key] = val; continue; }
    if (val === "") { group = meta[key] = {}; } else { group = null; meta[key] = val; }
  }
  return { meta, body: raw.slice(m[0].length) };
}

// Sehr kleines Markdown: Absätze, ## Zwischentitel, [Link](url), **fett**, *kursiv*
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function inline(s) {
  return esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${u.replace(/"/g, "&quot;")}" target="_blank" rel="noopener">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
function markdown(src) {
  return src.trim().split(/\r?\n\s*\r?\n/).filter(b => b.trim()).map(b => {
    b = b.trim().replace(/\s*\r?\n\s*/g, " ");
    const h = b.match(/^#{1,6}\s+(.*)$/);
    return h ? `<h3>${inline(h[1])}</h3>` : `<p>${inline(b)}</p>`;
  }).join("\n");
}

function readText(dir) {
  const file = path.join(dir, "text.md");
  if (!fs.existsSync(file)) return { meta: {}, html: "" };
  const { meta, body } = frontmatter(fs.readFileSync(file, "utf8"));
  return { meta, html: markdown(body) };
}

// LED-Zuordnung: zuerst aus "led:" im Kopfteil, sonst Dateien namens wand.*, e1.* … im Ordner led/
function readLed(dir, folder, meta) {
  const ledDir = path.join(dir, "led");
  const files = list(ledDir, LED);
  const out = {};
  for (const id of SCREENS) {
    const given = meta.led && typeof meta.led === "object" ? meta.led[id] : undefined;
    let file = null;
    if (given !== undefined) {
      if (!BLACK.test(given)) {
        if (files.includes(given)) file = given;
        else warn(`${folder}: LED-Datei «${given}» für ${id} fehlt im Ordner led/`);
      }
    } else {
      file = files.find(f => f.replace(/\.[^.]+$/, "").toLowerCase() === id) || null;
    }
    out[id] = file ? url(folder, "led", file) : null;
  }
  return out;
}

// ---- Los geht's ----
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SITE, OUT, { recursive: true });
if (fs.existsSync(CONTENT)) {
  fs.cpSync(CONTENT, path.join(OUT, "content"), { recursive: true, filter: src => !/\.md$/i.test(src) && !path.basename(src).startsWith(".") });
}

const folders = fs.existsSync(CONTENT)
  ? sortNat(fs.readdirSync(CONTENT).filter(f => fs.statSync(path.join(CONTENT, f)).isDirectory() && !f.startsWith(".")))
  : [];

const projects = [];
const pages = {};

for (const folder of folders) {
  const dir = path.join(CONTENT, folder);
  const { meta, html } = readText(dir);
  const led = readLed(dir, folder, meta);

  if (folder.startsWith("_")) {
    // Sonderseiten: _definition, _praevention …
    const key = folder.slice(1);
    const seitenDir = fs.existsSync(path.join(dir, "seiten")) ? "seiten" : "";
    const seiten = list(path.join(dir, seitenDir), IMG).map(f => seitenDir ? url(folder, seitenDir, f) : url(folder, f));
    const pdf = list(dir, /\.pdf$/i)[0];
    pages[key] = { key, titel: meta.titel || key[0].toUpperCase() + key.slice(1), html, seiten, pdf: pdf ? url(folder, pdf) : null, led };
    if (!seiten.length && !html && !pdf) warn(`${folder}: weder Text noch Seiten gefunden`);
    continue;
  }

  const bilder = list(path.join(dir, "bilder"), IMG).map(f => ({ name: f, url: url(folder, "bilder", f) }));
  const nrFromFolder = (folder.match(/^(\d+)/) || [])[1];
  projects.push({
    slug: folder.replace(/^\d+[-_ ]*/, "").toLowerCase().replace(/[^a-z0-9äöü]+/g, "-").replace(/^-|-$/g, "") || folder,
    nr: meta.nr || (nrFromFolder ? String(+nrFromFolder) : ""),
    titel: meta.titel || folder.replace(/^\d+[-_ ]*/, ""),
    autorin: meta.autorin || meta["autor"] || "",
    datum: meta.datum || "",
    quelle: meta.quelle || "",
    html,
    bilder,
    led,
  });
  if (!html) warn(`${folder}: text.md fehlt oder ist leer`);
  if (SCREENS.every(id => !led[id])) warn(`${folder}: keine LED-Dateien – alle Panels bleiben schwarz`);
}

projects.sort((a, b) => (+a.nr || 1e9) - (+b.nr || 1e9));
// eindeutige Slugs
const seen = {};
for (const p of projects) { const s = p.slug; seen[s] = (seen[s] || 0) + 1; if (seen[s] > 1) p.slug = s + "-" + seen[s]; }

fs.writeFileSync(path.join(OUT, "projekte.json"), JSON.stringify({ projects, pages }, null, 1));

console.log(`✓ ${projects.length} Projekte, ${Object.keys(pages).length} Sonderseiten → dist/`);
for (const w of warnings) console.log("  ⚠ " + w);
