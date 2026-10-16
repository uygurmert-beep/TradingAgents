import re

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

shell=open('shell.html',encoding='utf-8').read()
MODULLER = (
          'hata.js','aracciz.js','kayit.js','i18n.js','ses.js','game.js','kanca.js','world.js','rehber.js',
          'gunlukritim.js','koleksiyon.js','galeri.js','konsinye.js','yangorev.js','kolay.js','foto.js','parca.js','takas.js','ilanfoto.js','piyasa.js','grup.js','canli.js','sirala.js','cila.js','yuz.js',
          'kisisel.js','karne.js','meydan.js','paylas.js','demo.js','ui.js','app.js')
parcalar=[open(f,encoding='utf-8').read() for f in MODULLER]
cakismaKontrol(MODULLER)
from yazitipi import font_css
out=shell.replace('/*FONT*/', font_css()).replace('/*BUNDLE*/', "\n".join(parcalar))
# Artifact kendi dosyasını yanında yayınlıyor: CDN'e bağımlı kalma.
out=out.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.149.0/three.min.js"></script>',
                '<script src="three.min.js"></script>')
open('preloved.html','w',encoding='utf-8').write(out)
print("built", len(out), "bytes")
