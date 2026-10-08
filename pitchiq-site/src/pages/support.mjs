import { esc, layout } from "./layout.mjs";
import { faqList } from "./home.mjs";

export function renderSupport(ctx) {
  const { t, config, prefix } = ctx;
  const s = t.support;
  const email = esc(config.contactEmail);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: t.meta.supportTitle,
    mainEntity: { "@type": "Organization", name: config.appName, email: config.contactEmail, url: ctx.siteUrl + "/" },
  };

  const body = `
    <section class="section doc">
      <div class="wrap wrap--narrow">
        <header class="doc__head">
          <p class="eyebrow">${esc(s.eyebrow)}</p>
          <h1 class="display">${esc(s.title)}</h1>
          <p class="lead">${esc(s.intro)}</p>
        </header>

        <div class="card email-card">
          <p class="email-card__label" id="email-label">${esc(s.emailLabel)}</p>
          <p class="email-card__value selectable" id="contact-email" aria-labelledby="email-label">${email}</p>
          <div class="cta-row">
            <button type="button" class="btn btn--gold" data-copy="#contact-email" data-copied="${esc(s.copied)}" data-copy-fail="${esc(s.copyFail)}">${esc(s.copy)}</button>
            <a class="btn btn--ghost" href="mailto:${email}">${esc(s.mailto)}</a>
          </div>
          <p class="copy-status" role="status" aria-live="polite"></p>
        </div>

        <section class="prose" aria-labelledby="bug-title">
          <h2 id="bug-title">${esc(s.bugTitle)}</h2>
          <p>${esc(s.bugIntro)}</p>
          <ul>${s.bugItems.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
          <p class="fineprint">${esc(s.bugSubject)}</p>

          <h2>${esc(s.deleteTitle)}</h2>
          <p>${esc(s.deleteText)}</p>
        </section>

        <section aria-labelledby="sfaq-title">
          <h2 id="sfaq-title" class="h2">${esc(s.faqTitle)}</h2>
          ${faqList(t.faq.items)}
          <p><a href="${prefix}privacy/">${esc(s.privacyLink)} →</a></p>
        </section>
      </div>
    </section>`;

  return layout(ctx, { title: t.meta.supportTitle, description: t.meta.supportDescription, body, jsonLd });
}
