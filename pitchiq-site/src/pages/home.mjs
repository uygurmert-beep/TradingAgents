import { esc, layout, playButton, browserButton, screenshot } from "./layout.mjs";

const list = (items) => items.map((i) => `<li>${esc(i)}</li>`).join("");

export function renderHome(ctx) {
  const { t, config, siteUrl } = ctx;
  const p = t.pricing;
  const shots = t.gallery.items;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "MobileApplication",
      name: config.appName,
      description: t.meta.homeDescription,
      url: siteUrl + "/",
      image: `${siteUrl}/assets/icons/icon-512.png`,
      screenshot: shots.map((s) => `${siteUrl}/assets/screenshots/${s.file}.webp`),
      applicationCategory: "GameApplication",
      applicationSubCategory: "Trivia",
      operatingSystem: "ANDROID",
      inLanguage: t.lang,
      installUrl: config.links.googlePlay,
      downloadUrl: config.links.googlePlay,
      offers: [
        { "@type": "Offer", name: p.free.name, price: "0", priceCurrency: config.pricing.currency },
        { "@type": "Offer", name: p.monthly.name, price: config.pricing.monthly.replace(",", "."), priceCurrency: config.pricing.currency },
        { "@type": "Offer", name: p.yearly.name, price: config.pricing.yearly.replace(",", "."), priceCurrency: config.pricing.currency },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: t.faq.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  const body = `
    <section class="hero" aria-labelledby="hero-title">
      <div class="wrap hero__grid">
        <div class="hero__copy">
          <p class="eyebrow eyebrow--gold">${esc(t.hero.eyebrow)}</p>
          <h1 id="hero-title" class="display">${esc(t.hero.title)}</h1>
          <p class="hero__sub">${esc(t.hero.subtitle)}</p>
          <div class="cta-row">
            ${playButton(ctx, { event: "Download+Hero" })}
            ${browserButton(ctx, "btn--ghost-light")}
          </div>
          <p class="hero__note">${esc(t.hero.note)} · ${esc(t.common.iosSoon)}</p>
        </div>
        <div class="hero__visual">
          <div class="phone">${screenshot(shots[0].file, t.hero.screenshotAlt, { eager: true })}</div>
        </div>
      </div>
    </section>

    <section class="stats" aria-label="${esc(t.common.a11y.highlights)}">
      <ul class="wrap stats__list">
        ${t.stats.map((s) => `<li class="stat"><span class="stat__icon" aria-hidden="true">${s.icon}</span><span class="stat__value">${esc(s.value)}</span><span class="stat__label">${esc(s.label)}</span></li>`).join("")}
      </ul>
    </section>

    <section id="modlar" class="section" aria-labelledby="modes-title">
      <div class="wrap">
        <header class="section__head">
          <p class="eyebrow">${esc(t.modes.eyebrow)}</p>
          <h2 id="modes-title" class="display">${esc(t.modes.title)}</h2>
          <p class="lead">${esc(t.modes.subtitle)}</p>
        </header>
        <ul class="modes">
          ${t.modes.items.map((m) => `<li class="card mode"><span class="mode__icon" aria-hidden="true">${m.icon}</span><h3>${esc(m.name)}</h3><p>${esc(m.text)}</p></li>`).join("")}
        </ul>
      </div>
    </section>

    <section id="iq-testi" class="section section--alt" aria-labelledby="iq-title">
      <div class="wrap split">
        <div>
          <p class="eyebrow">${esc(t.iq.eyebrow)}</p>
          <h2 id="iq-title" class="display">${esc(t.iq.title)}</h2>
          <p class="lead">${esc(t.iq.text)}</p>
          <div class="iq-meter" role="img" aria-label="${esc(t.common.a11y.iqScale)}">
            <div class="iq-meter__bar"><span class="iq-meter__fill"></span><span class="iq-meter__pin"><b>148</b></span></div>
            <div class="iq-meter__scale"><span>0 · ${esc(t.iq.rankLow)}</span><span>200 · ${esc(t.iq.rankHigh)}</span></div>
          </div>
        </div>
        <div class="split__visual"><div class="phone phone--sm">${screenshot(shots[4].file, t.iq.screenshotAlt)}</div></div>
      </div>
    </section>

    <section id="gunun-maci" class="section" aria-labelledby="daily-title">
      <div class="wrap split split--rev">
        <div>
          <p class="eyebrow">${esc(t.daily.eyebrow)}</p>
          <h2 id="daily-title" class="display">${esc(t.daily.title)}</h2>
          <p class="lead">${esc(t.daily.text)}</p>
          <ul class="checks">${list(t.daily.points)}</ul>
        </div>
        <div class="split__visual" aria-hidden="true">
          <div class="share-card">
            <p class="share-card__title">${esc(t.daily.shareTitle)}</p>
            <p class="share-card__grid">🟩🟩🟨<br>🟩🟥🟩<br>🟩🟩🟩</p>
            <p class="share-card__score">8/9 · ⏱ 1:42</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--alt" aria-labelledby="how-title">
      <div class="wrap">
        <header class="section__head">
          <p class="eyebrow">${esc(t.how.eyebrow)}</p>
          <h2 id="how-title" class="display">${esc(t.how.title)}</h2>
        </header>
        <ol class="steps">
          ${t.how.steps.map((s, i) => `<li class="card step"><span class="step__num" aria-hidden="true">${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join("")}
        </ol>
      </div>
    </section>

    <section class="section" aria-labelledby="gallery-title">
      <div class="wrap">
        <header class="section__head">
          <p class="eyebrow">${esc(t.gallery.eyebrow)}</p>
          <h2 id="gallery-title" class="display">${esc(t.gallery.title)}</h2>
          <p class="hint">${esc(t.gallery.hint)} →</p>
        </header>
      </div>
      <ul class="gallery" tabindex="0" aria-label="${esc(t.gallery.title)}">
        ${shots.map((s) => `<li class="gallery__item"><div class="phone phone--sm">${screenshot(s.file, s.alt)}</div></li>`).join("")}
      </ul>
    </section>

    <section id="fiyatlar" class="section section--alt" aria-labelledby="pricing-title">
      <div class="wrap">
        <header class="section__head">
          <p class="eyebrow">${esc(p.eyebrow)}</p>
          <h2 id="pricing-title" class="display">${esc(p.title)}</h2>
        </header>
        <div class="plans">
          <article class="card plan">
            <h3>${esc(p.free.name)}</h3>
            <p class="plan__price">${esc(p.free.price)}</p>
            <ul class="checks">${list(p.free.features)}</ul>
            ${playButton(ctx, { size: "sm", label: p.free.cta, event: "Download+Free" })}
          </article>
          <article class="card plan">
            <h3>${esc(p.monthly.name)}</h3>
            <p class="plan__price">${esc(config.pricing.monthly)} TL <small>${esc(p.monthly.period)}</small></p>
            <ul class="checks">${list(p.monthly.features)}</ul>
            ${playButton(ctx, { size: "sm", label: p.monthly.cta, event: "Download+ProMonthly" })}
          </article>
          <article class="card plan plan--best">
            <p class="plan__badge">${esc(p.yearly.badge)}</p>
            <h3>${esc(p.yearly.name)}</h3>
            <p class="plan__price">${esc(config.pricing.yearly)} TL <small>${esc(p.yearly.period)}</small></p>
            <p class="plan__save">${esc(p.yearly.save)}</p>
            <ul class="checks">${list(p.yearly.features)}</ul>
            ${playButton(ctx, { size: "sm", label: p.yearly.cta, event: "Download+ProYearly" })}
          </article>
        </div>
        <p class="fineprint">${esc(p.note)}</p>
      </div>
    </section>

    <section id="sss" class="section" aria-labelledby="faq-title">
      <div class="wrap wrap--narrow">
        <header class="section__head">
          <p class="eyebrow">${esc(t.faq.eyebrow)}</p>
          <h2 id="faq-title" class="display">${esc(t.faq.title)}</h2>
        </header>
        ${faqList(t.faq.items)}
      </div>
    </section>

    <section class="final-cta" aria-labelledby="final-title">
      <div class="wrap final-cta__inner">
        <h2 id="final-title" class="display">${esc(t.finalCta.title)}</h2>
        <p>${esc(t.finalCta.text)}</p>
        <div class="cta-row cta-row--center">
          ${playButton(ctx, { event: "Download+Final" })}
          ${browserButton(ctx, "btn--ghost-light")}
        </div>
      </div>
    </section>`;

  return layout(ctx, { title: t.meta.homeTitle, description: t.meta.homeDescription, body, jsonLd, footerCta: false });
}

export function faqList(items) {
  return `<div class="faq">${items
    .map((f) => `<details class="faq__item"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
    .join("")}</div>`;
}
