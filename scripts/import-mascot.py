#!/usr/bin/env python3
"""
Importa do pacote original (urubu_assets_completo/mascote) SÓ as poses do
mascote torcedor que o app usa, redimensionadas e otimizadas para o bundle.

O mascote fica restrito aos momentos interativos (pop-ups, Nação, bolão,
trilha, comunidade e lances do jogo) para não deixar o app infantil.
Para usar outra pose: acrescente aqui, rode o script e registre em
src/design-system/mascot.tsx (MASCOT_POSES).

Uso: python3 scripts/import-mascot.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "urubu_assets_completo" / "mascote"
DST = ROOT / "assets" / "mascot" / "fan"

# pose do app -> arquivo original (número do manifest)
POSES = {
    # Pop-ups de entrada
    "fan-flag": "mascote_37_",  # dia de jogo: agitando bandeira
    "fan-welcome": "mascote_39_",  # boas-vindas: acenando
    # Lances do jogo (avisos)
    "fan-goal": "mascote_01_",
    "fan-almost": "mascote_03_",  # gol do adversário / lance perigoso
    "fan-scarf": "mascote_05_",  # bola rolando
    "fan-victory": "mascote_06_",
    "fan-draw": "mascote_07_",
    "fan-defeat": "mascote_08_",
    # Nação: bolão, trilha, comunidade, quiz
    "fan-trophy": "mascote_26_",
    "fan-quiz": "mascote_28_",
    "fan-level-up": "mascote_31_",
    "fan-high-five": "mascote_32_",
    "fan-community": "mascote_33_",
    "fan-gift": "mascote_24_",
}

# Originais: 640px (meio corpo) e 800px (corpo inteiro). No app o maior uso é ~180pt (@3x ≈ 540px).
MAX_SIDE = 480


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    for old in DST.glob("*.png"):
        old.unlink()
    for pose, prefix in POSES.items():
        matches = sorted(SRC.glob(f"*/{prefix}*.png"))
        if len(matches) != 1:
            raise SystemExit(f"{pose}: esperado 1 arquivo com {prefix}, achei {len(matches)}")
        im = Image.open(matches[0]).convert("RGBA")
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        out = DST / f"{pose}.png"
        im.save(out, optimize=True)
        print(f"{pose:16} <- {matches[0].name} ({im.size[0]}px, {out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
