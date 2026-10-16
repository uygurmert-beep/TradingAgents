# -*- coding: utf-8 -*-
"""KELEPİR — web (Netlify) dağıtımı.

İki çıktı üretiyor:

  1) kelepir-web/        Netlify'a sürükle-bırak edilecek klasör.
                         index.html + three.min.js + ikonlar + manifest +
                         servis çalışanı + _headers + netlify.toml
  2) kelepir-tek.html    Tek dosya. three.js içine gömülü; hiçbir yan dosya
                         istemiyor, herhangi bir yere atılıp açılabiliyor.

Kaynak app/www — yani mağaza kabuğuyla BİREBİR aynı derleme. Böylece
web'de denenen sürüm ile mağazaya yüklenen sürüm aynı kod oluyor.
"""
import os, shutil, re

KOK = os.path.dirname(os.path.abspath(__file__))
KAYNAK = os.path.join(KOK, "app", "www")
CIK = os.path.join(os.path.dirname(KOK), "kelepir-web")

if not os.path.exists(os.path.join(KAYNAK, "index.html")):
    raise SystemExit("önce appbuild.py çalıştır")

# ---------- 1) Netlify klasörü ----------
if os.path.exists(CIK):
    shutil.rmtree(CIK)
shutil.copytree(KAYNAK, CIK)

# Servis çalışanı eski index.html'i sunmasın: HTML ve sw.js hiç
# önbelleğe alınmıyor, parmak izi olmayan varlıklar kısa süreli.
open(os.path.join(CIK, "_headers"), "w", encoding="utf-8").write("""\
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: geolocation=(), microphone=(), camera=()

/index.html
  Cache-Control: public, max-age=0, must-revalidate

/sw.js
  Cache-Control: public, max-age=0, must-revalidate

/three.min.js
  Cache-Control: public, max-age=604800
""")

open(os.path.join(CIK, "netlify.toml"), "w", encoding="utf-8").write("""\
# Kelepir — statik tek sayfa. Derleme adımı yok, klasör olduğu gibi yayınlanıyor.
[build]
  publish = "."
  command = ""

# Tek sayfalık uygulama: her yol index.html'e düşsün.
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
""")

open(os.path.join(CIK, "robots.txt"), "w", encoding="utf-8").write(
    "User-agent: *\nAllow: /\n")

# ---------- 2) tek dosya ----------
html = open(os.path.join(KAYNAK, "index.html"), encoding="utf-8").read()
three = open(os.path.join(KOK, "three.min.js"), encoding="utf-8").read()

tek = html.replace('<script src="three.min.js"></script>',
                   "<script>\n" + three + "\n</script>")
assert '<script src="three.min.js">' not in tek, "three.js gömülemedi"

# Yan dosya isteyen bağlantıları çıkar: tek dosya hiçbir şey istemesin.
tek = re.sub(r'\s*<link rel="manifest"[^>]*>', '', tek)
tek = re.sub(r'\s*<link rel="(?:apple-touch-)?icon"[^>]*>', '', tek)

yol = os.path.join(os.path.dirname(KOK), "kelepir-tek.html")
open(yol, "w", encoding="utf-8").write(tek)

print("netlify klasörü:", CIK, "—", len(os.listdir(CIK)), "dosya")
print("tek dosya      :", yol, "—", round(len(tek.encode()) / 1048576, 2), "MB")
