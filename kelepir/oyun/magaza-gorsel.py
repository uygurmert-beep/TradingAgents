# -*- coding: utf-8 -*-
"""KELEPİR — mağaza pazarlama görselleri.

İki iş:
  1) Play özellik grafiği 1024×500
  2) Başlıklı ekran görüntüsü çerçeveleri — ham ekran görüntüsü dönüşüm
     oranını düşürüyor; mağazada insanlar başlığı okuyup kaydırıyor. Her
     karede TEK cümle, tek vaat.

Ham ekranlar magaza/ss/{play,ios}/ içinde duruyor (gerekirse onlar da
yüklenebilir); çerçeveli hâller magaza/ss-cerceve/ altına çıkıyor.
"""
import os, io
from PIL import Image, ImageDraw, ImageFilter
from PIL import ImageFont
import cairosvg

F = "/usr/share/fonts/truetype/google-fonts/Poppins-%s.ttf"
def yazi(boy, agirlik="Bold"):
    return ImageFont.truetype(F % agirlik, boy)

ZEMIN  = (11, 16, 18)
ZEMIN2 = (22, 37, 42)
PETROL = (22, 184, 174)
ALTIN  = (240, 180, 82)
BEYAZ  = (236, 242, 241)
GRI    = (147, 165, 164)

KOK    = os.path.dirname(os.path.abspath(__file__))
SS     = KOK + "/magaza/ss"
CIK    = KOK + "/magaza/ss-cerceve"
MAGAZA = KOK + "/magaza"

# ---------- yardımcılar ----------
def degrade(w, h):
    """Sol üstten sağ alta petrole çalan koyu zemin."""
    t = Image.new("RGB", (w, h), ZEMIN)
    d = ImageDraw.Draw(t)
    for y in range(h):
        k = y / max(1, h - 1)
        d.line([(0, y), (w, y)],
               fill=tuple(int(ZEMIN2[i] + (ZEMIN[i] - ZEMIN2[i]) * k) for i in range(3)))
    # sol üstte petrol ışıması
    hale = Image.new("RGB", (w, h), (0, 0, 0))
    hd = ImageDraw.Draw(hale)
    hd.ellipse([-w * .25, -h * .9, w * .55, h * .75], fill=(10, 70, 66))
    hale = hale.filter(ImageFilter.GaussianBlur(w // 7))
    return Image.blend(t, Image.blend(t, hale, .55), .75)

def isaret_png(boy):
    import importlib.util
    spec = importlib.util.spec_from_file_location("ikon", KOK + "/ikon.py")
    # ikon.py çalıştırmadan sadece svg'yi yeniden kurmak yerine, üretilmiş
    # şeffaf PNG'yi kullanıyoruz: tek kaynak, tek görünüm.
    im = Image.open(KOK + "/icon-1024.png").convert("RGBA")
    return im.resize((boy, boy), Image.LANCZOS)

def yuvarlat(im, r):
    maske = Image.new("L", im.size, 0)
    ImageDraw.Draw(maske).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1],
                                            radius=r, fill=255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), maske)
    return out

def sar(d, metin, font, genislik):
    kelimeler, satir, out = metin.split(), "", []
    for k in kelimeler:
        dene = (satir + " " + k).strip()
        if d.textlength(dene, font=font) <= genislik:
            satir = dene
        else:
            if satir: out.append(satir)
            satir = k
    if satir: out.append(satir)
    return out

# ---------- 1) özellik grafiği 1024×500 ----------
def ozellik_grafigi():
    W, H = 1024, 500
    im = degrade(W, H).convert("RGBA")
    d = ImageDraw.Draw(im)

    # Sağ boşluğa taşan soluk filigran: Play bu grafiği bazı yüzeylerde
    # ortadan kırpıyor, sağ kenarda okunacak bir şey bırakmıyoruz.
    fil = isaret_png(560).copy()
    fil.putalpha(fil.getchannel("A").point(lambda v: int(v * 0.10)))
    im.alpha_composite(fil, (W - 300, -60))

    # Sağ yarıda oyunun kendi çizdiği üç araç. Elle hazırlanmış bir tanıtım
    # resmi değil: aynı kod, aynı araba. (ozellik-araclar.js üretiyor.)
    # Alt şeritteki sayılar x≈292–800 arasını kullanıyor; araçlar sağ sütunda
    # kalıyor ve o şeridin üstünde bitiyor.
    for i, (x, y, g) in enumerate([(610, 34, 404), (640, 196, 374)]):
        yol = f"{MAGAZA}/_oz-arac{i}.svg"
        if not os.path.exists(yol):
            continue
        ham = cairosvg.svg2png(url=yol, output_width=g)
        arac = Image.open(io.BytesIO(ham)).convert("RGBA")
        arac.putalpha(arac.getchannel("A").point(
            lambda v, k=(0.95, 0.55)[i]: int(v * k)))
        im.alpha_composite(arac, (x, y))

    mark = yuvarlat(isaret_png(188), 42)
    im.alpha_composite(mark, (72, 70))

    d.text((288, 96), "KELEPİR", font=yazi(84), fill=BEYAZ)
    d.text((292, 196), "OTO GALERİ SİMÜLASYONU", font=yazi(23, "Medium"),
           fill=PETROL)
    d.text((292, 248), "Ucuza al. Doğru tamir et.", font=yazi(34, "Medium"), fill=GRI)
    d.text((292, 292), "Doğru alıcıya sat.", font=yazi(34, "Medium"), fill=GRI)

    # alt şerit: üç kanıt
    y = 380
    # Sayılar _modeller_b.js ile aynı olmalı: mağazada yanlış sayı vaat
    # etmek "yanıltıcı tanıtım" başlığı altında reddedilme sebebi.
    for i, (b, a) in enumerate([("40", "marka"), ("150", "model"), ("0", "reklam")]):
        x = 292 + i * 170
        d.text((x, y), b, font=yazi(44), fill=ALTIN)
        d.text((x, y + 54), a, font=yazi(20, "Medium"), fill=GRI)

    # sağ kenarda ince petrol çizgi — marka imzası
    d.rectangle([W - 10, 0, W, H], fill=PETROL)
    im.convert("RGB").save(f"{MAGAZA}/ozellik-grafigi-1024x500.png")
    print("  özellik grafiği 1024×500")

# ---------- 2) başlıklı çerçeveler ----------
BASLIK = {
  "01-giris":    ("Galerini sıfırdan kur", "Üç başlangıç, iki zorluk. Kararlar senin."),
  "02-pazar":    ("Her gün yeni ilanlar", "Kimi kelepir, kimi tuzak. Farkı sen bulacaksın."),
  "03-arac":     ("Ekspertiz ₺2.500", "Ödemezsen kusuru satarken öğrenirsin."),
  "04-pazarlik": ("Karşındaki insan", "Yüzünü oku, sabrını ölç, fiyatı kır."),
  "05-garaj":    ("Kârını gör, sonra sat", "Maliyet, tamir, başabaş — hepsi kartın üstünde."),
  "06-filo":     ("Satmak zorunda değilsin", "Kiraya ver, her gün para kazansın."),
  "07-sirala":   ("Türkiye sıralaması", "61 galeri arasında kaçıncısın?"),
  "08-3b":       ("Galerini gez", "Listeden çık, mekânı yürüyerek dolaş."),
}

def cerceve(kaynak, hedef, W, H):
    os.makedirs(hedef, exist_ok=True)
    for ad, (b, a) in BASLIK.items():
        yol = f"{kaynak}/{ad}.png"
        if not os.path.exists(yol): continue
        im = degrade(W, H).convert("RGBA")
        d = ImageDraw.Draw(im)
        kenar = int(W * 0.075)
        ustAlan = int(H * 0.235)

        fb = yazi(int(W * 0.072))
        fa = yazi(int(W * 0.036), "Medium")
        satirlar = sar(d, b, fb, W - kenar * 2)
        y = int(H * 0.055)
        for s in satirlar:
            d.text((kenar, y), s, font=fb, fill=BEYAZ); y += int(W * 0.088)
        for s in sar(d, a, fa, W - kenar * 2):
            d.text((kenar, y + 6), s, font=fa, fill=PETROL); y += int(W * 0.048)

        ss = Image.open(yol).convert("RGBA")
        hedefW = W - kenar * 2
        oran = hedefW / ss.size[0]
        yeni = (hedefW, int(ss.size[1] * oran))
        ss = ss.resize(yeni, Image.LANCZOS)
        kalan = H - ustAlan - int(H * 0.03)
        if yeni[1] > kalan:
            ss = ss.crop((0, 0, yeni[0], kalan))
        ss = yuvarlat(ss, int(W * 0.045))

        golge = Image.new("RGBA", im.size, (0, 0, 0, 0))
        gd = ImageDraw.Draw(golge)
        gd.rounded_rectangle([kenar, ustAlan + 8, kenar + ss.size[0], ustAlan + ss.size[1]],
                             radius=int(W * 0.045), fill=(0, 0, 0, 150))
        golge = golge.filter(ImageFilter.GaussianBlur(int(W * 0.02)))
        im.alpha_composite(golge)
        im.alpha_composite(ss, (kenar, ustAlan))

        # petrol hairline çerçeve
        ImageDraw.Draw(im).rounded_rectangle(
            [kenar, ustAlan, kenar + ss.size[0] - 1, ustAlan + ss.size[1] - 1],
            radius=int(W * 0.045), outline=(22, 184, 174, 90), width=2)

        im.convert("RGB").save(f"{hedef}/{ad}.png")
    print(f"  çerçeveler {W}×{H} → {hedef.split('/')[-1]}")

if __name__ == "__main__":
    os.makedirs(CIK, exist_ok=True)
    ozellik_grafigi()
    cerceve(f"{SS}/play", f"{CIK}/play", 1080, 1920)
    cerceve(f"{SS}/ios",  f"{CIK}/ios",  1290, 2796)
    print("bitti")
