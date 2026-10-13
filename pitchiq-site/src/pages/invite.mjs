import { esc, layout, browserButton } from "./layout.mjs";

// /davet/KOD → Netlify rewrites to this page (netlify.toml). The code is read from the URL in the browser,
// shown big for typing into the app, and carried into the Play link (install referrer) and the web game (?ref=).
export function renderInvite(ctx) {
  const { t, config } = ctx;
  const v = t.invite;
  const body = `
    <section class="section doc doc--center">
      <div class="wrap wrap--narrow">
        <p class="eyebrow">${esc(v.eyebrow)}</p>
        <h1 class="display">${esc(v.title)}</h1>
        <p class="lead">${esc(v.text)}</p>
        <div class="invite-code" data-invite-code hidden>
          <span class="invite-code__label">${esc(v.codeLabel)}</span>
          <strong data-invite-value></strong>
          <button class="btn btn--ghost btn--sm" type="button" data-invite-copy>${esc(v.copy)}</button>
        </div>
        <ol class="invite-steps">${v.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
        <div class="cta-row cta-row--center">
          <a class="btn btn--gold plausible-event-name=Download+Invite" data-invite-play href="${esc(config.links.googlePlay)}" rel="noopener">${esc(v.cta)}</a>
          ${browserButton(ctx)}
        </div>
        <p class="invite-fine">${esc(v.fine)}</p>
      </div>
    </section>
    <script>
    (function () {
      var m = location.pathname.match(/\\/davet\\/([A-Za-z0-9-]+)/) || location.search.match(/[?&]ref=([A-Za-z0-9-]+)/);
      if (!m) return;
      var code = m[1].toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^PIQ(?=[A-Z0-9]{6}$)/, "");
      if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) return;
      var box = document.querySelector("[data-invite-code]");
      box.hidden = false;
      document.querySelector("[data-invite-value]").textContent = code;
      var play = document.querySelector("[data-invite-play]");
      play.href += (play.href.indexOf("?") < 0 ? "?" : "&") + "referrer=" + encodeURIComponent("ref=" + code);
      document.querySelectorAll('a[href="${esc(config.links.play)}"]').forEach(function (a) { a.href = "${esc(config.links.play)}?ref=" + code; });
      var btn = document.querySelector("[data-invite-copy]"), label = btn.textContent;
      btn.addEventListener("click", function () {
        var done = function () { btn.textContent = ${JSON.stringify(v.copied)}; setTimeout(function () { btn.textContent = label; }, 1600); };
        try { navigator.clipboard.writeText(code).then(done, done); } catch (e) { done(); }
      });
    })();
    </script>`;
  return layout(ctx, { title: v.metaTitle, description: v.metaDescription, body, footerCta: false, noindex: true });
}
