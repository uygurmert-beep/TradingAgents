// Renders brand/*.svg into the PNG sizes the stores and the site need.
// Usage: node tools/render-brand.cjs   (needs Playwright + Chromium, and the
// Anton / Barlow Condensed fonts installed locally for the feature graphic)
const { readFileSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");
let playwright;
try { playwright = require("playwright"); } catch { playwright = require(require("node:child_process").execSync("npm root -g").toString().trim() + "/playwright"); }

const root = join(__dirname, "..");
const brand = (f) => readFileSync(join(root, "brand", f), "utf8");
const JOBS = [
  // [svg, output, width, height, transparent]
  ["pitchiq-icon.svg", "brand/export/play-store-icon-512.png", 512, 512],
  ["pitchiq-icon.svg", "brand/export/app-store-icon-1024.png", 1024, 1024],
  ["pitchiq-icon.svg", "brand/export/pwa-maskable-512.png", 512, 512],
  ["pitchiq-icon.svg", "brand/export/pwa-maskable-192.png", 192, 192],
  ["pitchiq-icon-rounded.svg", "brand/export/pwa-icon-192.png", 192, 192, true],
  ["pitchiq-icon-rounded.svg", "brand/export/pwa-icon-512.png", 512, 512, true],
  ["adaptive-foreground.svg", "brand/export/android-adaptive-foreground-432.png", 432, 432, true],
  ["adaptive-background.svg", "brand/export/android-adaptive-background-432.png", 432, 432],
  ["adaptive-monochrome.svg", "brand/export/android-adaptive-monochrome-432.png", 432, 432, true],
  ["feature-graphic.svg", "brand/export/play-feature-graphic-1024x500.png", 1024, 500],
  ["logo-horizontal-dark.svg", "brand/export/logo-horizontal-dark.png", 1280, 320, true],
  ["logo-horizontal-light.svg", "brand/export/logo-horizontal-light.png", 1280, 320, true],
  // website
  ["pitchiq-icon-rounded.svg", "static/assets/icons/icon-512.png", 512, 512, true],
  ["pitchiq-icon.svg", "static/assets/icons/icon-1024.png", 1024, 1024],
  ["pitchiq-icon.svg", "static/assets/icons/apple-touch-icon.png", 180, 180],
  ["pitchiq-icon-rounded.svg", "static/assets/icons/favicon-48.png", 48, 48, true],
  ["pitchiq-icon-rounded.svg", "static/assets/icons/brand-96.png", 96, 96, true],
  ["feature-graphic.svg", "static/assets/icons/feature-graphic.png", 1024, 500],
];

(async () => {
  mkdirSync(join(root, "brand/export"), { recursive: true });
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  for (const [svg, out, w, h, transparent] of JOBS) {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><body style="margin:0;background:transparent">${brand(svg).replace("<svg ", `<svg width="${w}" height="${h}" `)}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(root, out), omitBackground: !!transparent, clip: { x: 0, y: 0, width: w, height: h } });
    console.log(out);
  }
  await browser.close();
})();
