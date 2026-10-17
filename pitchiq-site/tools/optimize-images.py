"""Convert store-package screenshots (PNG/JPG) to optimized WebP for the site.

Usage:  python3 tools/optimize-images.py path/to/screenshots
Needs:  pip install pillow

Files are matched by their leading number (01..05) and written to
static/assets/screenshots/<name>.webp using the names in src/i18n/tr.json.
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "static" / "assets" / "screenshots"
MAX_W = 540

names = [i["file"] for i in json.loads((ROOT / "src/i18n/tr.json").read_text("utf-8"))["gallery"]["items"]]
src = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
files = sorted(p for p in src.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"})

for p in files:
    m = re.match(r"0?(\d+)", p.stem)
    if not m or not 1 <= int(m.group(1)) <= len(names):
        print(f"skip {p.name} (no leading 01..{len(names):02d})")
        continue
    name = names[int(m.group(1)) - 1]
    im = Image.open(p).convert("RGB")
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    dest = OUT / f"{name}.webp"
    im.save(dest, "WEBP", quality=82, method=6)
    print(f"{p.name} -> {dest.relative_to(ROOT)} ({dest.stat().st_size // 1024} KB)")
