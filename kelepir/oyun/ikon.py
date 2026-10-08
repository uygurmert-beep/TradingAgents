# -*- coding: utf-8 -*-
"""KELEPİR — uygulama ikonu ve açılış ekranı üretimi.

İşaret: eğik bir fiyat etiketi, içinde ₺. Gerekçe — "kelepir" kelimesinin
görsel karşılığı fiyattır, ev değil. Etiket silueti 48 px'te bile tanınıyor,
₺ ise pazarı tek bakışta Türkiye'ye çiviliyor. Altın etiket = para (oyunun
renk disiplininde kehribar yalnızca paraya ayrılmıştı), arkasındaki petrol
halkası marka rengi.

Üretilenler:
  magaza/ikon/play-512.png        Play mağaza listesi (32-bit, alfa)
  magaza/ikon/appstore-1024.png   App Store (alfa YOK — Apple reddediyor)
  android res/mipmap-*/           uyarlanabilir + eski ikonlar
  android res/drawable*/splash    açılış ekranı
  ios AppIcon.appiconset/         1024 tek boy
"""
import os, io
import cairosvg
from PIL import Image

ZEMIN  = "#0B1012"
ZEMIN2 = "#16252A"
PETROL = "#16B8AE"
ALTIN  = "#F0B452"
ALTIN2 = "#D99A3C"
KOYU   = "#0A1416"

KOK     = os.path.dirname(os.path.abspath(__file__))
KELEPIR = os.path.join(KOK, "..", "kabuk")
MAGAZA  = os.path.join(KOK, "..", "magaza", "ikon")

ETIKET = ("M14,50 L46,17 A9,9 0 0 1 53,14 L82,14 A8,8 0 0 1 90,22 L90,51 "
          "A9,9 0 0 1 87,58 L55,90 A8,8 0 0 1 43,90 L14,61 A8,8 0 0 1 14,50 Z")
LIRA   = ("M52,33 L52,69 L70,78", "M41,49 L69,37", "M41,60 L69,48")

def isaret(olcek=1.0, hale=True):
    """0..100 tuvalde ortalanmış etiket + ₺. olcek: tuval içindeki payı."""
    d = 50 * (1 - olcek)
    halka = (f'<circle cx="50" cy="50" r="45" fill="none" stroke="{PETROL}" '
             f'stroke-width="3.2" opacity=".6"/>') if hale else ""
    lira = "".join(
        f'<path d="{p}" fill="none" stroke="{KOYU}" stroke-width="7.4" '
        f'stroke-linecap="round" stroke-linejoin="round"/>' for p in LIRA)
    # Etiket halkanın içinde kalıyor (0,78), ₺ de etiketin içinde (0,74).
    # İki iç içe kesilme ikonu ucuz gösteriyordu; artık her şekil tam.
    return f'''<g transform="translate({d:.3f},{d:.3f}) scale({olcek:.5f})">
  {halka}
  <g transform="rotate(-10 50 50) translate(50 50) scale(0.78) translate(-50 -50)">
    <path d="{ETIKET}" fill="url(#alt)" stroke="{ALTIN2}" stroke-width="1.6"/>
    <circle cx="34" cy="32" r="8.5" fill="{KOYU}"/>
    <g transform="rotate(10 55 55) translate(57 55) scale(0.80) translate(-55 -55)">{lira}</g>
  </g>
</g>'''

def svg(olcek=1.0, yuvarlak=0.0, zemin=True, hale=True, seffaf=False):
    kose = f'rx="{yuvarlak}" ry="{yuvarlak}"' if yuvarlak else ""
    arka = "" if (seffaf or not zemin) else f'''
  <rect x="0" y="0" width="100" height="100" {kose} fill="url(#zem)"/>'''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <radialGradient id="zem" cx="32%" cy="24%" r="92%">
      <stop offset="0" stop-color="{ZEMIN2}"/><stop offset="1" stop-color="{ZEMIN}"/>
    </radialGradient>
    <linearGradient id="alt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F7C877"/><stop offset="1" stop-color="{ALTIN}"/>
    </linearGradient>
  </defs>{arka}{isaret(olcek, hale)}</svg>'''

def yaz(yol, kaynak, boy, alfa=True, zeminRenk=None):
    os.makedirs(os.path.dirname(yol), exist_ok=True)
    png = cairosvg.svg2png(bytestring=kaynak.encode("utf-8"),
                           output_width=boy, output_height=boy)
    im = Image.open(io.BytesIO(png)).convert("RGBA")
    if not alfa:
        art = Image.new("RGB", im.size, zeminRenk or ZEMIN)
        art.paste(im, (0, 0), im)
        im = art
    im.save(yol, "PNG")

# ================= mağaza ikonları =================
tam = svg(olcek=0.92, zemin=True, hale=True)
yaz(f"{MAGAZA}/play-512.png", tam, 512, alfa=True)           # Play: alfa serbest
yaz(f"{MAGAZA}/appstore-1024.png", tam, 1024, alfa=False)    # Apple: alfa YASAK
yaz(f"{MAGAZA}/ikon-1024.png", tam, 1024, alfa=True)

# ================= Android =================
RES = f"{KELEPIR}/android/app/src/main/res"
# Uyarlanabilir ikon: 108dp tuvalin ortasındaki 66dp güvenli bölge. İşareti
# 0.52'ye çekiyoruz ki hangi maske gelirse gelsin (daire, squircle, yaprak)
# kırpılmasın.
on = svg(olcek=0.52, zemin=False, hale=True, seffaf=True)
for klasor, boy in (("mipmap-mdpi",108), ("mipmap-hdpi",162), ("mipmap-xhdpi",216),
                    ("mipmap-xxhdpi",324), ("mipmap-xxxhdpi",432)):
    yaz(f"{RES}/{klasor}/ic_launcher_foreground.png", on, boy, alfa=True)
eski  = svg(olcek=0.80, zemin=True, hale=True, yuvarlak=18)
yuvar = svg(olcek=0.78, zemin=True, hale=True, yuvarlak=50)
for klasor, boy in (("mipmap-mdpi",48), ("mipmap-hdpi",72), ("mipmap-xhdpi",96),
                    ("mipmap-xxhdpi",144), ("mipmap-xxxhdpi",192)):
    yaz(f"{RES}/{klasor}/ic_launcher.png", eski, boy, alfa=True)
    yaz(f"{RES}/{klasor}/ic_launcher_round.png", yuvar, boy, alfa=True)

os.makedirs(f"{RES}/mipmap-anydpi-v26", exist_ok=True)
for ad in ("ic_launcher", "ic_launcher_round"):
    open(f"{RES}/mipmap-anydpi-v26/{ad}.xml", "w").write(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/kelepirZemin"/>\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
        '    <monochrome android:drawable="@mipmap/ic_launcher_foreground"/>\n'
        '</adaptive-icon>\n')

splash = svg(olcek=0.30, zemin=True, hale=True)
for klasor, boy in (("drawable",480), ("drawable-port-mdpi",480),
                    ("drawable-port-hdpi",800), ("drawable-port-xhdpi",1280),
                    ("drawable-port-xxhdpi",1600), ("drawable-port-xxxhdpi",1920)):
    yaz(f"{RES}/{klasor}/splash.png", splash, boy, alfa=False)

# ================= iOS =================
IOS = f"{KELEPIR}/ios/App/App/Assets.xcassets"
yaz(f"{IOS}/AppIcon.appiconset/AppIcon-512@2x.png", tam, 1024, alfa=False)
open(f"{IOS}/AppIcon.appiconset/Contents.json", "w").write('''{
  "images" : [ { "filename" : "AppIcon-512@2x.png", "idiom" : "universal",
      "platform" : "ios", "size" : "1024x1024" } ],
  "info" : { "author" : "xcode", "version" : 1 }
}''')
spl = f"{IOS}/Splash.imageset"
for ad in ("splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"):
    yaz(f"{spl}/{ad}", svg(olcek=0.18, zemin=True, hale=True), 2732, alfa=False)

# ================= PWA / web =================
W = os.path.dirname(os.path.abspath(__file__))
yaz(f"{W}/icon-192.png", tam, 192, alfa=True)
yaz(f"{W}/icon-512.png", tam, 512, alfa=True)
yaz(f"{W}/icon-maskable-512.png", svg(olcek=0.60, zemin=True, hale=True), 512, alfa=True)
yaz(f"{W}/icon-1024.png", tam, 1024, alfa=True)

# Oyun içi işaret (ui.js LOGO_SVG) ile aynı kalsın diye tek kaynaktan üret
open(f"{W}/logo-isaret.svg", "w", encoding="utf-8").write(svg(olcek=0.9, zemin=False, seffaf=True))
print("ikonlar hazır")
