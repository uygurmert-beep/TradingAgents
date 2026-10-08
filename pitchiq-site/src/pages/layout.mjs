// Shared helpers + page shell (head, header, footer).

export const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const PLAY_ICON = `<svg class="btn-play__icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M5 3.5v17a1 1 0 0 0 1.5.86l14-8.5a1 1 0 0 0 0-1.72l-14-8.5A1 1 0 0 0 5 3.5Z"/></svg>`;

// Primary download CTA. Uses Google's official badge if it was dropped into static/assets/badges/.
export function playButton(ctx, { size = "lg", label, event = "Download" } = {}) {
  const { t, config, staticExists } = ctx;
  const href = esc(config.links.googlePlay);
  const track = `plausible-event-name=${event}`;
  const attrs = `href="${href}" rel="noopener" data-cta="google-play"`;
  if (size !== "sm" && staticExists("assets/badges/google-play-tr.png")) {
    return `<a class="btn-badge ${track}" ${attrs}><img src="/assets/badges/google-play-tr.png" alt="${esc(t.common.ctaPlay)}" width="216" height="64"></a>`;
  }
  if (size === "sm") {
    return `<a class="btn btn--gold btn--sm ${track}" ${attrs}>${PLAY_ICON}<span>${esc(label || t.common.ctaPlaySmall)}</span></a>`;
  }
  return `<a class="btn btn--gold btn-play ${track}" ${attrs}>${PLAY_ICON}<span class="btn-play__text"><small>${esc(t.common.ctaPlayOverline)}</small>${esc(label || t.common.ctaPlay)}</span></a>`;
}

export function browserButton(ctx, cls = "btn--ghost") {
  return `<a class="btn ${cls} plausible-event-name=TryInBrowser" href="${esc(ctx.config.links.play)}">${esc(ctx.t.common.ctaBrowser)}</a>`;
}

export function screenshot(file, alt, { eager = false, cls = "" } = {}) {
  const loading = eager ? `fetchpriority="high"` : `loading="lazy" decoding="async"`;
  return `<img class="shot ${cls}" src="/assets/screenshots/${esc(file)}.webp" alt="${esc(alt)}" width="540" height="1170" ${loading}>`;
}

export function layout(ctx, { title, description, body, jsonLd, noindex = false, footerCta = true }) {
  const { t, config, siteUrl, assets, path, prefix } = ctx;
  const canonical = siteUrl + path;
  const ogImage = `${siteUrl}/assets/icons/feature-graphic.png`;
  const n = t.common.nav;
  const home = prefix;
  const plausible = config.analytics.plausibleDomain
    ? `<script defer data-domain="${esc(config.analytics.plausibleDomain)}" src="https://plausible.io/js/script.tagged-events.outbound-links.js"></script>`
    : "";
  const hreflang =
    config.locales.length > 1
      ? config.locales
          .map((l) => {
            const p = l === config.defaultLocale ? path.replace(prefix, "/") : path.replace(prefix, `/${l}/`);
            return `<link rel="alternate" hreflang="${l}" href="${siteUrl + p}">`;
          })
          .join("\n  ")
      : "";
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="${t.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${noindex ? `<meta name="robots" content="noindex">` : `<link rel="canonical" href="${canonical}">`}
  ${hreflang}
  <meta name="theme-color" content="#0F5132" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#041A10" media="(prefers-color-scheme: dark)">
  <meta name="color-scheme" content="light dark">
  <link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg">
  <link rel="icon" type="image/png" sizes="48x48" href="/assets/icons/favicon-48.png">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(config.appName)}">
  <meta property="og:locale" content="${t.ogLocale}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1024">
  <meta property="og:image:height" content="500">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${ogImage}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;600;800&family=Barlow+Condensed:wght@600;700&display=swap">
  <link rel="stylesheet" href="${assets.css}">
  <script>try{var m=localStorage.getItem("theme");if(m==="light"||m==="dark")document.documentElement.dataset.theme=m}catch(e){}</script>
  <script defer src="${assets.js}"></script>
  ${plausible}
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : ""}
</head>
<body>
  <a class="skip" href="#main">${esc(t.common.skip)}</a>
  <header class="site-header">
    <div class="wrap site-header__inner">
      <a class="brand" href="${home}" aria-label="${esc(config.appName)} — ${esc(t.common.backHome)}">
        <img src="/assets/icons/brand-96.png" alt="" width="36" height="36">
        <span>PITCH <b>IQ</b></span>
      </a>
      <nav class="site-nav" aria-label="${esc(t.common.a11y.mainNav)}">
        <a href="${home}#modlar">${esc(n.modes)}</a>
        <a href="${home}#iq-testi">${esc(n.iq)}</a>
        <a href="${home}#fiyatlar">${esc(n.pricing)}</a>
        <a href="${home}#sss">${esc(n.faq)}</a>
        <a href="${prefix}support/">${esc(n.support)}</a>
      </nav>
      <div class="site-header__actions">
        <button class="theme-toggle" type="button" aria-label="${esc(t.common.themeToggle)}" data-theme-toggle>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 3a9 9 0 1 0 9 9A9 9 0 0 0 12 3Zm0 16V5a7 7 0 0 1 0 14Z"/></svg>
        </button>
        ${playButton(ctx, { size: "sm", event: "Download+Header" })}
      </div>
    </div>
  </header>

  <main id="main">
${body}
  </main>

  <footer class="site-footer">
    <div class="wrap site-footer__grid">
      <div>
        <a class="brand brand--footer" href="${home}"><img src="/assets/icons/brand-96.png" alt="" width="40" height="40" loading="lazy"><span>PITCH <b>IQ</b></span></a>
        <p>${esc(t.footer.tagline)}</p>
        ${footerCta ? playButton(ctx, { event: "Download+Footer" }) : ""}
      </div>
      <nav aria-label="${esc(t.common.a11y.footerNav)}" class="site-footer__links">
        <a href="${prefix}privacy/">${esc(t.footer.privacy)}</a>
        <a href="${prefix}support/">${esc(t.footer.support)}</a>
        <a href="${esc(config.links.play)}">${esc(t.footer.play)}</a>
        <span>${esc(t.footer.contact)}: <span class="selectable">${esc(config.contactEmail)}</span></span>
      </nav>
    </div>
    <div class="wrap site-footer__legal">
      <p>${esc(t.footer.legal)}</p>
      <p>© ${year} ${esc(config.appName)}. ${esc(t.footer.copyright)}</p>
    </div>
  </footer>
</body>
</html>
`;
}
