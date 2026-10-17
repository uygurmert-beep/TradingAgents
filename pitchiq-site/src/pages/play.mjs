import { esc, layout, playButton } from "./layout.mjs";

// Placeholder. Dropping the game's index.html into static/play/ replaces this page at build time.
export function renderPlay(ctx) {
  const { t } = ctx;
  const body = `
    <section class="section doc doc--center">
      <div class="wrap wrap--narrow">
        <h1 class="display">${esc(t.play.title)}</h1>
        <p class="lead">${esc(t.play.text)}</p>
        <div class="cta-row cta-row--center">${playButton(ctx, { event: "Download+PlayPage" })}</div>
      </div>
    </section>`;
  return layout(ctx, { title: t.meta.playTitle, description: t.meta.playDescription, body, footerCta: false });
}
