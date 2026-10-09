# -*- coding: utf-8 -*-
"""KELEPİR — mağaza kabuğu için tam HTML belgesi.
Yerel three.js, mobil meta'lar, manifest. CDN'e hiç bağımlılık yok:
uygulama ilk açılıştan itibaren tamamen çevrimdışı çalışıyor."""
import json, shutil, os, re

AD      = "Kelepir"
AD_UZUN = "Kelepir — Galeri Simülasyonu"
ZEMIN   = "#F3F1EC"


def cakismaKontrol(dosyalar):
    """İki modül aynı üst düzey adı tanımlıyorsa derlemeyi durdur."""
    sahip = {}
    cakisma = []
    desen = re.compile(r'^(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)', re.M)
    for d in dosyalar:
        metin = open(d, encoding='utf-8').read()
        for ad in set(desen.findall(metin)):
            if ad in sahip and sahip[ad] != d:
                cakisma.append((ad, sahip[ad], d))
            else:
                sahip.setdefault(ad, d)
    if cakisma:
        satir = "\n".join(f"  {a}  →  {b} ve {c}" for a, b, c in sorted(cakisma))
        raise SystemExit("DERLEME DURDU — üst düzey ad çakışması:\n" + satir)

shell = open('shell.html', encoding='utf-8').read()
MODULLER = (
          'hata.js','aracciz.js','kayit.js','i18n.js','ses.js','game.js','kanca.js','world.js','rehber.js',
          'gunlukritim.js','koleksiyon.js','galeri.js','konsinye.js','yangorev.js','kolay.js','foto.js','parca.js','takas.js','ilanfoto.js','piyasa.js','grup.js','canli.js','sirala.js','cila.js','yuz.js',
          'kisisel.js','karne.js','meydan.js','paylas.js','demo.js','ui.js','app.js')
parcalar=[open(f,encoding='utf-8').read() for f in MODULLER]
cakismaKontrol(MODULLER)
from yazitipi import font_css
govde = shell.replace('/*FONT*/', font_css()).replace('/*BUNDLE*/', "\n".join(parcalar))
govde = govde.replace(
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.149.0/three.min.js"></script>',
    '<script src="three.min.js"></script>')
assert 'cdnjs' not in govde and 'http://' not in govde, "kabukta dış kaynak kaldı"

os.makedirs('app/www', exist_ok=True)

manifest = {
  "name": AD_UZUN, "short_name": AD, "id": "/",
  "start_url": "./index.html", "scope": "./", "display": "standalone",
  "orientation": "portrait", "background_color": ZEMIN, "theme_color": ZEMIN,
  "lang": "tr", "dir": "ltr",
  "description": "İkinci el araç alıp satarak galerini büyüttüğün, "
                 "çevrimdışı çalışan bir pazarlık oyunu.",
  "categories": ["games", "simulation"],
  "icons": [
    {"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
    {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
  ]
}
open('app/www/manifest.webmanifest', 'w', encoding='utf-8').write(
    json.dumps(manifest, indent=1, ensure_ascii=False))

head = f'''<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="{ZEMIN}">
<meta name="color-scheme" content="dark">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="{AD}">
<meta name="format-detection" content="telephone=no">
<meta name="referrer" content="no-referrer">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
<style>
html,body{{margin:0;padding:0;background:{ZEMIN};overscroll-behavior:none;
  -webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;
  -webkit-user-select:none;user-select:none;height:100%}}
input,textarea{{-webkit-user-select:text;user-select:text}}
</style>
'''
tail = '''
</body>
</html>
'''
i = govde.index('<div id="app"')
out = head + govde[:i] + '</head>\n<body>\n' + govde[i:] + tail
open('app/www/index.html', 'w', encoding='utf-8').write(out)

for f in ('three.min.js', 'sw.js'):
    shutil.copyfile(f, 'app/www/' + f)
for f in ('icon-192.png', 'icon-512.png', 'icon-maskable-512.png'):
    if os.path.exists(f):
        shutil.copyfile(f, 'app/www/' + f)

print("app build:", len(out), "bytes")
