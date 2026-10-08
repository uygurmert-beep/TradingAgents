# -*- coding: utf-8 -*-
"""İmza yazı tipi (Saira, SIL OFL 1.1 — font/OFL-Saira.txt) kabuğa gömülür.

Dış kaynak yasak (CLAUDE.md §4.1): font dosyası ağdan değil, base64 olarak
belgenin içinden gelir. Yalnızca başlık/rakam ağırlıkları (600, 700) ve
Türkçe için latin + latin-ext alt kümeleri — toplam ~52 KB."""
import base64, os

KOK = os.path.dirname(os.path.abspath(__file__))
ARALIK = {
  "latin":     "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  "latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
}

def font_css():
    parca = []
    for alt, aralik in ARALIK.items():
        for agirlik in (600, 700):
            yol = os.path.join(KOK, "font", f"saira-{alt}-{agirlik}-normal.woff2")
            veri = base64.b64encode(open(yol, "rb").read()).decode("ascii")
            parca.append("@font-face{font-family:'Saira';font-style:normal;font-display:swap;"
                         f"font-weight:{agirlik};src:url(data:font/woff2;base64,{veri}) format('woff2');"
                         f"unicode-range:{aralik}}}")
    return "\n".join(parca)
