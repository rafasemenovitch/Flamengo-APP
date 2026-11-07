"""
ATENÇÃO: o ícone e o splash atuais vêm da arte oficial em LOGO/ (CRF vermelho
em fundo preto). Rodar este script SOBRESCREVE com o escudo genérico antigo.

Gera ícone do app, ícone adaptativo (Android) e imagem do splash a partir do
escudo GENÉRICO de placeholder (o mesmo desenhado em brand.tsx).

Quando houver escudo oficial licenciado, troque `draw_shield` por colar o
PNG oficial e rode de novo:

    python3 scripts/generate-brand-assets.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "assets" / "brand"
RED = (200, 16, 46, 255)
RED_DARK = (110, 10, 25, 255)
INK = (17, 17, 20, 255)
BG = (10, 10, 12, 255)
WHITE = (255, 255, 255, 255)
SS = 4  # supersampling para bordas suaves


def bezier(p0, p1, p2, p3, steps=40):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        mt = 1 - t
        x = mt**3 * p0[0] + 3 * mt**2 * t * p1[0] + 3 * mt * t**2 * p2[0] + t**3 * p3[0]
        y = mt**3 * p0[1] + 3 * mt**2 * t * p1[1] + 3 * mt * t**2 * p2[1] + t**3 * p3[1]
        pts.append((x, y))
    return pts


def shield_points():
    # Mesmo desenho de SHIELD_PATH (viewBox 100 x 104).
    pts = [(50, 4), (92, 16), (92, 52)]
    pts += bezier((92, 52), (92, 76), (72, 92), (50, 100))[1:]
    pts += bezier((50, 100), (28, 92), (8, 76), (8, 52))[1:]
    pts += [(8, 16)]
    return pts


def _shield_mask(canvas, scale_in_canvas):
    w = canvas.width
    s = w * scale_in_canvas / 100
    ox = (w - 100 * s) / 2
    oy = (canvas.height - 104 * s) / 2
    pts = [(ox + x * s, oy + y * s) for x, y in shield_points()]
    mask = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    return mask, oy, s


def draw_shield(size, scale_in_canvas, canvas):
    """Escudo centralizado: contorno branco (escudo maior por trás) + corpo vermelho/preto."""
    outline, _, _ = _shield_mask(canvas, scale_in_canvas)
    canvas.paste(Image.new("RGBA", canvas.size, WHITE), (0, 0), outline)
    mask, oy, s = _shield_mask(canvas, scale_in_canvas * 0.9)
    top = Image.new("RGBA", canvas.size, RED)
    bottom = Image.new("RGBA", canvas.size, INK)
    split = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(split).rectangle([0, oy + 52 * s, canvas.width, canvas.height], fill=255)
    canvas.paste(Image.composite(bottom, top, split), (0, 0), mask)


def stripes(canvas, alpha=38):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    w, h = canvas.size
    band = w // 9
    for i in range(-4, 12):
        x0 = i * band * 2
        d.polygon([(x0, h), (x0 + band, h), (x0 + band + h * 0.45, 0), (x0 + h * 0.45, 0)], fill=RED_DARK[:3] + (alpha,))
    return Image.alpha_composite(canvas, layer)


def save(img, name, size):
    img.resize((size, size), Image.LANCZOS).save(OUT / name)
    print("ok", name)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    big = 1024 * SS

    icon = stripes(Image.new("RGBA", (big, big), BG))
    draw_shield(big, 0.58, icon)
    save(icon, "icon.png", 1024)

    # Android adaptativo: só o escudo, dentro da zona segura (~66%).
    fg = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw_shield(big, 0.46, fg)
    save(fg, "adaptive-icon.png", 1024)

    splash = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw_shield(big, 0.9, splash)
    save(splash, "splash.png", 1024)


if __name__ == "__main__":
    main()
