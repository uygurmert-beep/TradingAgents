import { esc, layout } from "./layout.mjs";

export function renderNotFound(ctx) {
  const { t, prefix } = ctx;
  const body = `
    <section class="section doc doc--center">
      <div class="wrap wrap--narrow">
        <p class="eyebrow">404</p>
        <h1 class="display">${esc(t.notFound.title)}</h1>
        <p class="lead">${esc(t.notFound.text)}</p>
        <div class="cta-row cta-row--center"><a class="btn btn--gold" href="${prefix}">${esc(t.common.backHome)}</a></div>
      </div>
    </section>`;
  return layout(ctx, { title: t.meta.notFoundTitle, description: t.notFound.text, body, noindex: true, footerCta: false });
}
