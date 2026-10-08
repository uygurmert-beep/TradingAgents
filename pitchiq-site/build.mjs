// Pitch IQ static site builder — zero dependencies (Node 18+).
// Renders src/pages/* with src/i18n/<locale>.json + src/config.json into dist/,
// then copies static/ verbatim (static files win, e.g. static/play/index.html).
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import { renderHome } from "./src/pages/home.mjs";
import { renderPrivacy } from "./src/pages/privacy.mjs";
import { renderSupport } from "./src/pages/support.mjs";
import { renderPlay } from "./src/pages/play.mjs";
import { renderNotFound } from "./src/pages/not-found.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "dist");
const readJson = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));

const config = readJson("src/config.json");
const siteUrl = config.siteUrl.replace(/\/$/, "");

// Cache-busting hash for CSS/JS so Netlify can serve them as immutable.
const css = readFileSync(join(root, "src/styles.css"), "utf8");
const js = readFileSync(join(root, "src/main.js"), "utf8");
const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 8);
const assets = { css: `/assets/site.${hash(css)}.css`, js: `/assets/site.${hash(js)}.js` };

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "assets"), { recursive: true });
writeFileSync(join(dist, assets.css.slice(1)), css);
writeFileSync(join(dist, assets.js.slice(1)), js);

const write = (path, html) => {
  const file = join(dist, path, path.endsWith(".html") ? "" : "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
};

const pages = [
  { path: "", render: renderHome, priority: "1.0" },
  { path: "privacy/", render: renderPrivacy, priority: "0.5" },
  { path: "support/", render: renderSupport, priority: "0.6" },
  { path: "play/", render: renderPlay, priority: "0.4" },
];

const sitemap = [];
for (const locale of config.locales) {
  const t = readJson(`src/i18n/${locale}.json`);
  const prefix = locale === config.defaultLocale ? "/" : `/${locale}/`;
  const content = (name) => {
    const file = join(root, `src/content/${name}`);
    return existsSync(file) ? readFileSync(file, "utf8").replaceAll("{{email}}", config.contactEmail) : "";
  };
  const ctx = { t, config, siteUrl, assets, prefix, locale, content, staticExists: (p) => existsSync(join(root, "static", p)) };

  for (const page of pages) {
    write(prefix.slice(1) + page.path, page.render({ ...ctx, path: prefix + page.path }));
    sitemap.push({ loc: siteUrl + prefix + page.path, priority: page.priority });
  }
  if (locale === config.defaultLocale) write("404.html", renderNotFound({ ...ctx, path: "/404" }));
}

cpSync(join(root, "static"), dist, { recursive: true });

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemap.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`).join("\n") +
    `\n</urlset>\n`
);
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

console.log(`Built ${sitemap.length} pages → dist/`);
