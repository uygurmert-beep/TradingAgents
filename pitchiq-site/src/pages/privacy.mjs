import { esc, layout } from "./layout.mjs";

export function renderPrivacy(ctx) {
  const { t, config, content } = ctx;
  const d = new Date(config.privacyEffectiveDate + "T00:00:00Z");
  const dateTr = d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const dateEn = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  const body = `
    <article class="section doc">
      <div class="wrap wrap--narrow">
        <header class="doc__head">
          <h1 class="display">${esc(t.privacy.title)}</h1>
          <p class="doc__meta">${esc(t.privacy.updated)}: <time datetime="${config.privacyEffectiveDate}">${dateTr}</time> · <a href="#en">${esc(t.privacy.langSwitch)}</a></p>
        </header>
        <div class="prose" id="tr">${content("privacy-tr.html")}</div>

        <hr class="doc__sep">

        <section class="prose" id="en" lang="en" aria-labelledby="privacy-en-title">
          <h1 id="privacy-en-title" class="display">Privacy Policy</h1>
          <p class="doc__meta">Effective date: <time datetime="${config.privacyEffectiveDate}">${dateEn}</time> · <a href="#tr" lang="tr">${esc(t.privacy.langSwitchTr)}</a></p>
          ${content("privacy-en.html")}
        </section>
      </div>
    </article>`;

  return layout(ctx, { title: t.meta.privacyTitle, description: t.meta.privacyDescription, body });
}
