# assets/brand

Material de marca do app. **Nada aqui é oficial.**

- Não baixe logos, escudos, fotos de jogadores ou vídeos da internet.
- Enquanto não houver material licenciado, `index.ts` mantém tudo como `null` e o app
  desenha placeholders vetoriais próprios (escudo genérico, imagens com degradê + ícone).
- Para trocar: adicione os arquivos nesta pasta e aponte-os em `index.ts`.

## Ícone e splash

`icon.png`, `adaptive-icon.png` e `splash.png` são gerados por `scripts/generate-brand-assets.py`
a partir do escudo genérico. Com o escudo oficial autorizado, ajuste o script e rode
`python3 scripts/generate-brand-assets.py`.
