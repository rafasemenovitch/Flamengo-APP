"""
Tratamento "bandeirão" (especificação de identidade, seção 9.1):
duotone vermelho e preto, contraste alto e grão leve.

1) Placeholders próprios (sem fotos de terceiros), desenhados por código:
     python3 scripts/treat-images.py --placeholders
2) Fotos licenciadas: coloque em assets/photos/source/ e rode
     python3 scripts/treat-images.py
   As versões tratadas vão para assets/photos/treated/.
"""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent / "assets" / "photos"
SRC = ROOT / "source"
OUT = ROOT / "treated"
SHADOW = (10, 10, 11)
LIGHT = (200, 16, 46)


def duotone(img, contrast=1.35, grain=0.04, seed=0):
    g = ImageOps.grayscale(img)
    g = ImageOps.autocontrast(g, cutoff=2)
    g = g.point(lambda v: max(0, min(255, int((v - 128) * contrast + 128))))
    out = ImageOps.colorize(g, black=SHADOW, white=LIGHT)
    rnd = random.Random(seed)
    noise = Image.effect_noise(out.size, 64).convert("L")
    noise = noise.point(lambda v: int(v * grain))
    out = Image.composite(Image.new("RGB", out.size, (255, 255, 255)), out, noise)
    return out


def crowd(w, h, seed):
    """Arquibancada em perspectiva + refletores (cena genérica, desenhada)."""
    rnd = random.Random(seed)
    img = Image.new("L", (w, h), 18)
    d = ImageDraw.Draw(img)
    # Céu/refletores
    for i in range(rnd.randint(2, 4)):
        cx = rnd.randint(0, w)
        cy = rnd.randint(-h // 10, h // 6)
        for r in range(int(w * 0.5), 0, -6):
            v = int(30 + 200 * (1 - r / (w * 0.5)) ** 3)
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=max(img.getpixel((min(w - 1, max(0, cx)), min(h - 1, max(0, cy)))), v) if False else v)
    img = img.filter(ImageFilter.GaussianBlur(w / 30))
    d = ImageDraw.Draw(img)
    # Fileiras de torcedores (cabeças e ombros), maiores embaixo
    horizon = int(h * rnd.uniform(0.32, 0.45))
    y = horizon
    row = 0
    while y < h + 40:
        t = (y - horizon) / (h - horizon + 1)
        size = 6 + t * 46
        step = size * 1.15
        x = -rnd.random() * step
        while x < w + step:
            jitter = rnd.uniform(-0.25, 0.25) * size
            lum = int(40 + 150 * (1 - t) * rnd.uniform(0.5, 1.0) + (60 if rnd.random() < 0.07 else 0))
            cx, cy = x + jitter, y + rnd.uniform(-0.2, 0.2) * size
            d.ellipse([cx - size * 0.35, cy - size * 0.5, cx + size * 0.35, cy + size * 0.2], fill=lum)
            d.rounded_rectangle([cx - size * 0.6, cy + size * 0.15, cx + size * 0.6, cy + size * 1.2], radius=int(size * 0.3), fill=max(10, lum - 25))
            # Braços erguidos de vez em quando
            if rnd.random() < 0.12:
                d.line([cx + size * 0.4, cy, cx + size * 0.7, cy - size * 1.1], fill=lum, width=max(1, int(size * 0.18)))
            x += step
        y += size * 0.9
        row += 1
    # Bandeira tremulando em algumas cenas
    if seed % 2 == 0:
        fx, fy, fw, fh = int(w * rnd.uniform(0.15, 0.55)), int(h * 0.18), int(w * 0.38), int(h * 0.16)
        pts_top = [(fx + i, fy + math.sin(i / fw * math.pi * 2 + seed) * fh * 0.15) for i in range(0, fw, 4)]
        pts_bot = [(x, y0 + fh) for x, y0 in reversed(pts_top)]
        d.polygon(pts_top + pts_bot, fill=200)
        d.line([fx, fy - 10, fx, fy + fh * 3], fill=200, width=6)
    return img.convert("RGB")


def placeholders():
    OUT.mkdir(parents=True, exist_ok=True)
    specs = [("hero", 1080, 1350), ("wide-1", 1600, 1000), ("wide-2", 1600, 1000), ("video-1", 1600, 900), ("video-2", 1600, 900), ("square-1", 800, 800), ("square-2", 800, 800)]
    for i, (name, w, h) in enumerate(specs):
        img = duotone(crowd(w, h, seed=i + 3), seed=i)
        img.save(OUT / f"placeholder-{name}.jpg", quality=78, optimize=True, progressive=True)
        print("ok", name)


def treat_sources():
    OUT.mkdir(parents=True, exist_ok=True)
    for p in sorted(SRC.glob("*")):
        if p.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
            continue
        img = Image.open(p).convert("RGB")
        img.thumbnail((1600, 1600))
        duotone(img, seed=hash(p.name) % 1000).save(OUT / f"{p.stem}.jpg", quality=80, optimize=True, progressive=True)
        print("ok", p.name)


if __name__ == "__main__":
    placeholders() if "--placeholders" in sys.argv else treat_sources()
