// Bundles src/*.js + demo/app.js into one self-contained HTML file (demo/dist/pitch-iq-prototip.html).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORDER = ["text", "search", "daily", "limit", "hints", "ranks", "share", "players.sample"];
const strip = (src) => src.replace(/^import .*$/gm, "").replace(/^export (?=(const|function|async function|let|class) )/gm, "");
const kit = ORDER.map((m) => `// ---- src/${m}.js\n` + strip(readFileSync(join(root, "src", `${m}.js`), "utf8"))).join("\n");
const app = strip(readFileSync(join(root, "demo/app.js"), "utf8"));
const html = readFileSync(join(root, "demo/index.html"), "utf8").replace("/*__KIT__*/", () => `(() => {\n${kit}\n${app}\n})();`).replace("/*__APP__*/", "");
mkdirSync(join(root, "demo/dist"), { recursive: true });
writeFileSync(join(root, "demo/dist/pitch-iq-prototip.html"), html);
console.log("demo/dist/pitch-iq-prototip.html", Math.round(html.length / 1024) + " KB");
