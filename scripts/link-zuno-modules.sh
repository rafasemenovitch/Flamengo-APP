#!/usr/bin/env bash
# PONTE TEMPORÁRIA (pouco espaço em disco): cria node_modules/ com um symlink
# por pacote apontando para o node_modules do Zuno (mesmas versões de Expo/RN).
# Somente leitura — nada é escrito no Zuno. Quando houver espaço:
#   rm -rf node_modules && npm install
set -euo pipefail
ZUNO_NM="${ZUNO_NM:-$HOME/Developer/ZUNO/Código/app/node_modules}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NM="$ROOT/node_modules"
[ -d "$ZUNO_NM" ] || { echo "Zuno node_modules não encontrado em $ZUNO_NM"; exit 1; }
rm -rf "$NM"; mkdir -p "$NM/.bin"
for entry in "$ZUNO_NM"/* "$ZUNO_NM"/.package-lock.json; do
  name="$(basename "$entry")"
  if [[ "$name" == @* ]]; then
    mkdir -p "$NM/$name"
    for sub in "$entry"/*; do ln -s "$sub" "$NM/$name/$(basename "$sub")"; done
  elif [[ "$name" != ".package-lock.json" ]]; then
    ln -s "$entry" "$NM/$name"
  fi
done
for bin in expo tsc; do ln -s "$(readlink -f "$ZUNO_NM/.bin/$bin")" "$NM/.bin/$bin"; done
echo "node_modules ligado ao Zuno ($(ls "$NM" | wc -l | tr -d ' ') entradas)."
