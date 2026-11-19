#!/usr/bin/env python3
"""Generate og-image.png 1200x630 untuk Synalum (PIL, lokal, tanpa jaringan).

Mengikuti palet docs/DESIGN.md ("Buku besar kampus"): Kertas #F6F4EE,
Tinta #1F2A28, Teal USK #0B5E66, Kunyit #E8A33D, Merah Cap #B3402E.
Tanpa gradient, tanpa emoji, tanpa gambar stok — kartu editorial datar
dengan garis aturan tebal + cap bundar, sesuai detail khas situs.
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
PAPER = (246, 244, 238)   # #F6F4EE Kertas
INK = (31, 42, 40)        # #1F2A28 Tinta
TEAL = (11, 94, 102)      # #0B5E66 Teal USK
TEAL_DARK = (8, 72, 78)
KUNYIT = (232, 163, 61)   # #E8A33D Kunyit
CAP = (179, 64, 46)       # #B3402E Merah Cap
MUTED = (92, 102, 95)
LINE = (221, 214, 196)
CARD = (255, 253, 248)

SERIF_B = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SANS_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
MONO_B = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"

img = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(img)

# garis aturan tebal di atas + bingkai tipis
d.rectangle([0, 0, W, 12], fill=INK)
d.rectangle([36, 36, W - 36, H - 36], outline=LINE, width=2)

# kicker
f_kick = ImageFont.truetype(MONO_B, 30)
d.text((80, 72), "UNIVERSITAS SYIAH KUALA  ·  BANDA ACEH", font=f_kick, fill=CAP)

# judul
f_title = ImageFont.truetype(SERIF_B, 132)
d.text((76, 118), "Synalum", font=f_title, fill=INK)
# garis kunyit di bawah judul
d.rectangle([80, 268, 80 + 130, 278], fill=KUNYIT)

# subjudul
f_sub = ImageFont.truetype(SANS, 38)
d.text((80, 300), "Satu kampus. Tiga jembatan karier.", font=f_sub, fill=INK)
d.text((80, 348), "Magang  ·  Mentorship  ·  Riset", font=f_sub, fill=TEAL)

# tiga baris ledger
f_row = ImageFont.truetype(MONO_B, 28)
f_row2 = ImageFont.truetype(SANS, 30)
rows = [
    ("01", "Mahasiswa", "melamar peluang"),
    ("02", "Alumni", "memposting & mereview"),
    ("03", "Dosen", "riset resmi USK"),
]
y = 428
for no, who, what in rows:
    d.text((80, y), no, font=f_row, fill=KUNYIT)
    d.text((150, y - 2), who, font=f_row2, fill=INK)
    tw = d.textlength(who, font=f_row2)
    d.text((150 + tw + 18, y - 2), "— " + what, font=f_row2, fill=MUTED)
    y += 46

# cap bundar "TERVERIFIK" di kanan
cx, cy, r = 1000, 470, 88
d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=CAP, width=5)
d.ellipse([cx - r + 14, cy - r + 14, cx + r - 14, cy + r - 14], outline=CAP, width=2)
f_cap = ImageFont.truetype(MONO_B, 30)
for i, line in enumerate(["TER-", "VERIFIKASI"]):
    tw = d.textlength(line, font=f_cap)
    d.text((cx - tw / 2, cy - 36 + i * 38), line, font=f_cap, fill=CAP)

# footer url
f_url = ImageFont.truetype(MONO_B, 28)
d.text((80, 556), "synalum.pages.dev", font=f_url, fill=TEAL)

img.save("/home/hatch/workspace/synalum/synalum-client/public/og-image.png", "PNG", optimize=True)
print("saved synalum-client/public/og-image.png")
