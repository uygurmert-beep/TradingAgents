// Pitch IQ — tiny progressive enhancements. The site works without this file.
(function () {
  var root = document.documentElement;

  // Theme toggle: flips between light/dark and remembers the choice.
  var toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var current = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // Copy-to-clipboard for the support e-mail (mailto is not reliable on every phone).
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    var target = document.querySelector(btn.getAttribute("data-copy"));
    var status = btn.closest(".email-card") && btn.closest(".email-card").querySelector(".copy-status");
    var label = btn.textContent;
    if (!target) return;

    function selectText() {
      var range = document.createRange();
      range.selectNodeContents(target);
      var sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    function done(ok) {
      var msg = btn.getAttribute(ok ? "data-copied" : "data-copy-fail");
      btn.textContent = ok ? msg : label;
      if (status) status.textContent = msg;
      if (!ok) selectText();
      setTimeout(function () { btn.textContent = label; }, 2200);
    }

    btn.addEventListener("click", function () {
      var text = target.textContent.trim();
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallback()); });
      } else {
        done(fallback());
      }
      function fallback() {
        selectText();
        try { return document.execCommand("copy"); } catch (e) { return false; }
      }
    });
  });
})();
