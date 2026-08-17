/**
 * Lokální náhled webu ZUŠ Morava (Shipard / mustache).
 *
 *   npm install && npm start   ->  http://localhost:3000
 *
 * Struktura = 1:1 podle souborů v Shipardu:
 *   template/page-web.mustache   hlavní šablona webu
 *   scripts/*.mustache           webScripty a dataView šablony
 *   styles/*.less | *.css        LESS/CSS soubory (kompilují se za běhu)
 *   js/*.js                      script.js, cookieconsent-init.js
 *   pages/<slug>.html            obsah stránky (co píšeš do editoru stránky)
 *   pages/<slug>.json            parametry stránky (nepovinné)
 *   data/base.json               globální proměnné
 *   data/dataviews/<jmeno>.json  testovací data pro {{dataView;...}}
 *
 * Co se nenajde lokálně, se přesměruje na produkci (obrázky /att/... apod.).
 */

import express from "express";
import Mustache from "mustache";
import less from "less";
import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const PROD = "https://zusmorava.cz";

// mustache.js escapuje i lomítka (/ -> &#x2F;); vypneme to kvůli URL
Mustache.escape = (t) =>
  String(t).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const abs = (p) => path.join(__dirname, p);
const read = (p) => fs.readFileSync(abs(p), "utf8");
const readJson = (p) => JSON.parse(read(p));
const exists = (p) => fs.existsSync(abs(p));
const listDir = (dir) => (exists(dir) ? fs.readdirSync(abs(dir)) : []);

/* ================================================================== */
/* Úpravy šablon, aby je sežral mustache.js                            */
/* ================================================================== */
function normalize(tpl, label = "") {
  let out = tpl;

  // {{#!webBlocks.kolotoc.items}} – vykřičník je rozšíření Shipardu
  out = out.replace(/\{\{([#^/])!/g, "{{$1");

  // překlep {{{promenna}} -> {{{promenna}}}
  out = out.replace(/\{\{\{([^{}]+)\}\}(?!\})/g, (m, name) => {
    console.warn(`  ⚠  ${label}: neuzavřený tag {{{${name.trim()}}} – doplněno }`);
    return `{{{${name}}}}`;
  });

  return out;
}

/* ================================================================== */
/* Shipard shortcode:  {{dataView;classId:...;webScript:...;...}}      */
/* ================================================================== */
const DATAVIEW_RE = /\{\{\s*dataView;([^{}]*?)\}\}/g;

/** najde soubor bez ohledu na velikost písmen */
function findFile(dir, basename, ext) {
  const want = (basename + ext).toLowerCase();
  const hit = listDir(dir).find((f) => f.toLowerCase() === want);
  return hit ? `${dir}/${hit}` : null;
}

/** e10.web.dataView.Articles -> ["aktuality", "e10.web.dataView.Articles", "e10.web.Articles", "Articles"] */
function nameCandidates(params) {
  const c = [];
  if (params.webScript) c.push(params.webScript);
  if (params.classId) {
    c.push(params.classId);
    c.push(params.classId.replace(/\.dataView\./i, "."));
    c.push(params.classId.split(".").pop());
  }
  return [...new Set(c.filter(Boolean))];
}

function parseParams(raw) {
  const params = {};
  for (const part of raw.split(";")) {
    const i = part.indexOf(":");
    if (i > 0) params[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return params;
}

function placeholder(text) {
  return `<div style="border:2px dashed #c00;background:#fff5f5;color:#900;padding:1rem;margin:1rem 0;font:13px/1.5 monospace;white-space:pre-wrap">${text}</div>`;
}

function renderDataViews(html, baseView) {
  return html.replace(DATAVIEW_RE, (match, raw) => {
    const params = parseParams(raw);
    const cands = nameCandidates(params);

    const tplPath = cands.map((c) => findFile("scripts", c, ".mustache")).find(Boolean);
    if (!tplPath) {
      return placeholder(
        `Nenalezen webScript pro:\n${match}\n\nHledal jsem v scripts/:\n` +
          cands.map((c) => `  ${c}.mustache`).join("\n")
      );
    }

    const dataPath = cands.map((c) => findFile("data/dataviews", c, ".json")).find(Boolean);
    if (!dataPath) {
      return placeholder(
        `Chybí testovací data pro:\n${match}\n\nVytvoř soubor data/dataviews/${cands[0]}.json`
      );
    }

    const loaded = readJson(dataPath);
    const data = loaded.data ?? loaded;

    // respektuj maxCount – ořízni všechna pole v datech
    const max = parseInt(params.maxCount, 10);
    if (Number.isFinite(max)) {
      for (const [k, v] of Object.entries(data)) {
        if (Array.isArray(v)) data[k] = v.slice(0, max);
      }
    }

    // Mustache neumí porovnávat, takže showAs převedeme na příznaky
    // (showAsMap / showAsList). Šablona pak umí rozlišit mapu od seznamu.
    const showAs = {};
    if (params.showAs) {
      showAs["showAs" + params.showAs[0].toUpperCase() + params.showAs.slice(1)] = true;
    }

    const view = { ...baseView, ...params, ...showAs, data, params };
    try {
      return Mustache.render(normalize(read(tplPath), tplPath), view);
    } catch (err) {
      return placeholder(`Chyba v ${tplPath}:\n${err.message}`);
    }
  });
}

/* ================================================================== */
/* Data pro render stránky                                             */
/* ================================================================== */
function deepMerge(a = {}, b = {}) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    out[k] =
      v && typeof v === "object" && !Array.isArray(v) ? deepMerge(a[k] || {}, v) : v;
  }
  return out;
}

/** URL -> základ souborů ve složce pages/ (podporuje i podsložky) */
function resolvePage(slug) {
  for (const base of [`pages/${slug}`, `pages/${slug}/index`]) {
    if (exists(`${base}.html`) || exists(`${base}.json`)) return base;
  }
  return null;
}

function buildView(base, slug) {
  const globals = readJson("data/base.json");
  const pageData = exists(`${base}.json`) ? readJson(`${base}.json`) : {};
  const view = deepMerge(globals, pageData);

  const layouts = ["layoutSidebarNone", "layoutSidebarLeft", "layoutSidebarRight", "layoutSidebarBoth"];
  if (!layouts.some((k) => view.page[k])) view.page.layoutSidebarNone = true;
  if (!view.page.pageTitle) view.page.pageTitle = `${slug} – lokální náhled`;

  let content;
  if (exists(`${base}.html`)) {
    // běžná stránka: obsah z editoru Shipardu
    content = read(`${base}.html`);
  } else if (view.render) {
    // stránka generovaná obsahovou šablonou (např. e10.web.articles.mustache)
    const name = String(view.render).replace(/\.mustache$/i, "");
    const tplPath = findFile("scripts", name, ".mustache");
    content = tplPath
      ? Mustache.render(normalize(read(tplPath), tplPath), view)
      : placeholder(`Nenalezena obsahová šablona scripts/${name}.mustache`);
  } else {
    content = placeholder(
      `${base}.json neobsahuje ani "render", ani k němu neexistuje ${base}.html`
    );
  }

  // v obsahu ještě rozbal {{dataView;...}}, pak teprve jde do page-web.mustache
  view.pageText = renderDataViews(content, view);
  return view;
}

/* ================================================================== */
/* Live reload                                                         */
/* ================================================================== */
const clients = new Set();
const RELOAD_SNIPPET = `
<script>new EventSource("/__reload").onmessage = () => location.reload();</script>`;

chokidar
  .watch(["template", "pages", "data", "public", "scripts", "styles", "js"].map(abs), {
    ignoreInitial: true,
  })
  .on("all", (_e, file) => {
    console.log("↻ změna:", path.relative(__dirname, file));
    for (const c of clients) c.write("data: reload\n\n");
  });

/* ================================================================== */
/* Server                                                              */
/* ================================================================== */
const app = express();

app.get("/__reload", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  clients.add(res);
  req.on("close", () => clients.delete(res));
});

// statika: public/ a js/
app.use(express.static(abs("public")));
app.use(express.static(abs("js")));

// CSS: kompilace LESS za běhu (/style.css -> styles/style.less)
app.get(/.*\.css$/, async (req, res, next) => {
  const name = path.basename(req.path).replace(/\.css$/, "");
  const lessPath = findFile("styles", name, ".less");
  const cssPath = findFile("styles", name, ".css");

  if (lessPath) {
    try {
      const out = await less.render(read(lessPath), {
        paths: [abs("styles")],
        filename: lessPath,
      });
      return res.type("css").send(out.css);
    } catch (err) {
      console.error(`  ✗ LESS ${lessPath}: ${err.message} (řádek ${err.line})`);
      return res.type("css").send(`/* LESS chyba: ${err.message} na řádku ${err.line} */`);
    }
  }
  if (cssPath) return res.type("css").send(read(cssPath));
  next();
});

// stránky (včetně vnořených URL typu /aktuality/35)
app.get(/.*/, (req, res, next) => {
  const slug = decodeURIComponent(req.path).replace(/^\/|\/$/g, "") || "index";
  if (slug.includes("..")) return next();

  const base = resolvePage(slug);
  if (!base) return next();

  try {
    const tpl = normalize(read("template/page-web.mustache"), "page-web.mustache");
    let html = Mustache.render(tpl, buildView(base, slug));
    html = html.replace("</body>", RELOAD_SNIPPET + "\n</body>");
    res.type("html").send(html);
  } catch (err) {
    console.error(err);
    res.status(500).type("html").send(`<pre style="color:#b00;padding:2rem">${err.stack}</pre>`);
  }
});

// zbytek (obrázky /att/..., fonty, neznámé soubory) -> produkce
// Proxy (ne redirect): fonty mají cross-origin CORS blokované prohlížečem,
// takže je potřeba je stáhnout na serveru a poslat jako by byly z localhostu.
app.use(async (req, res) => {
  try {
    const upstream = await fetch(PROD + req.originalUrl);
    if (!upstream.ok && upstream.status !== 304) {
      res.status(upstream.status).end();
      return;
    }
    const contentType = upstream.headers.get("content-type");
    if (contentType) res.type(contentType);
    res.status(upstream.status);
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    console.error(err);
    res.status(502).end();
  }
});

app.listen(PORT, () => {
  const pages = listDir("pages")
    .filter((f) => /\.(html|json)$/.test(f))
    .map((f) => f.replace(/\.(html|json)$/, ""))
    .filter((v, i, a) => a.indexOf(v) === i);
  console.log(`\n  ➜  http://localhost:${PORT}`);
  console.log(`  ➜  stránky: ${pages.join(", ") || "(žádné)"}`);
  console.log(`  ➜  scripts: ${listDir("scripts").join(", ") || "(žádné)"}\n`);
});
