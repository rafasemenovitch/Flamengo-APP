"""
Gera instâncias estáticas da Anybody (fonte variável: largura 50–150, peso
100–900) para as combinações usadas no app. React Native não aplica eixos de
fonte variável, então cada (largura, peso) vira um arquivo.

Uso:  python3 scripts/build-fonts.py <caminho/Anybody[wdth,wght].ttf>
Fonte: https://github.com/google/fonts/tree/main/ofl/anybody (licença OFL)
"""
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

# (largura, peso) — ver tokens de tipografia (src/design-system/tokens/typography.ts)
INSTANCES = [(150, 900), (120, 900), (110, 900), (100, 700), (100, 600), (85, 800), (75, 800)]
OUT = Path(__file__).resolve().parent.parent / "assets" / "fonts"


def main(src):
    for wdth, wght in INSTANCES:
        font = TTFont(src)
        inst = instancer.instantiateVariableFont(font, {"wdth": wdth, "wght": wght})
        name = f"Anybody-W{wdth}-{wght}"
        for rec in inst["name"].names:
            if rec.nameID in (1, 4, 6, 16):
                rec.string = name
        inst.save(OUT / f"{name}.ttf")
        print("ok", name)


if __name__ == "__main__":
    main(sys.argv[1])
