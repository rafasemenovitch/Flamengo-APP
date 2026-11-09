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

## QR Code fixo

Uma vez só, crie o canal `demo` (ligado ao branch `demo`):

```bash
npx eas-cli@latest channel:create demo
```

QR Code fixo: [`docs/qrcode-expo-go.png`](qrcode-expo-go.png). Sempre abre a versão mais
recente publicada. Link equivalente (para mandar por mensagem):

```
exp://u.expo.dev/fc684d85-dbe4-483e-8330-44e088324fd7?channel-name=demo&runtime-version=exposdk%3A58.0.0
```

No painel (https://expo.dev → flamengo-app → Updates) cada publicação também tem um QR
próprio, mas ele aponta só para aquela versão.

## Observações

- O app usa o SDK 58: o Expo Go do celular precisa estar atualizado.
- Ícone e tela de abertura personalizados só aparecem no app instalado (build), não no Expo Go.
