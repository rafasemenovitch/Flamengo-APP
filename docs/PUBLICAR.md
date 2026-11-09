# Publicar o app com QR Code fixo (EAS Update)

Publica o app na nuvem da Expo. O QR Code abre no **Expo Go** de qualquer lugar,
sem o Mac ligado e sem depender de Wi-Fi ou tunnel.

## Primeira vez (uma vez só)

No terminal, dentro de `~/Flamengo-APP`:

```bash
npx eas-cli@latest login            # mesma conta do Expo Go no celular
npx eas-cli@latest init             # cria o projeto na Expo (responda "Y")
npx eas-cli@latest update:configure # liga o projeto ao EAS Update
npm run publicar                    # publica a versão atual
```

## Depois de cada mudança

```bash
npm run publicar
```

O QR Code é o mesmo: quem já abriu recebe a versão nova ao reabrir o app no Expo Go.

## Onde está o QR Code

Em https://expo.dev → seu projeto **flamengo-app** → **Updates** → branch **demo** →
botão **Preview** (mostra o QR Code). Dá para salvar a imagem ou o link e mandar para
outras pessoas (elas também precisam do Expo Go instalado).

## Observações

- O app usa o SDK 58: o Expo Go do celular precisa estar atualizado.
- Ícone e tela de abertura personalizados só aparecem no app instalado (build), não no Expo Go.
