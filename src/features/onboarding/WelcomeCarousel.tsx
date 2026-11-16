import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { AccessibilityInfo, Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Button, ClubCrest, Crest, Monogram, palette, Text, useTheme } from '@/design-system';
import { AssistantAvatar } from '@/features/assistant/ChatParts';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { haptic } from '@/utils/haptics';

/** Tempo de cada tela antes de passar sozinha. Para na última (é onde estão os botões). */
const AUTO_MS = 7000;

const PAL = { id: 'pal', code: 'PAL', color: '#006437', shortName: 'Palmeiras' };
const GRE = { id: 'gre', code: 'GRE', color: '#0D80BF', shortName: 'Grêmio' };
const RAC = { id: 'rac', code: 'RAC', color: '#5BB3E6', shortName: 'Racing' };
const WHITE = palette.white;
const SOFT = 'rgba(255,255,255,0.68)';
const FAINT = 'rgba(255,255,255,0.42)';
const LINE = 'rgba(255,255,255,0.14)';
/** Peças sobre o fundo preto (bolhas, blocos da Nação). */
const RAISED = palette.ink850;
/** Fundo das telas pretas: um quase-preto quente no alto, preto embaixo. */
const DARK = ['#170709', palette.ink950] as const;
/** Abertura: o vermelho do clube. */
const RED = [palette.red600, palette.red700] as const;

interface Slide {
  kicker: string;
  title: string;
  caption: string;
  /** O que a área tem: sempre quatro palavras, numa faixa de quatro colunas. */
  features?: [string, string, string, string];
  red?: boolean;
  art: (size: { w: number; h: number }) => ReactNode;
}

/**
 * Boas-vindas: um cartaz de tela inteira por área do app. Desliza com o dedo e passa sozinho
 * até a última tela. Estrutura fixa em todas: arte no alto (sempre abaixo da barra de status e
 * cortada no próprio espaço, nunca invade o texto), depois sobrelinha, título, uma linha de
 * texto e a faixa com o que a área tem. Só a abertura é vermelha; o resto é preto.
 * `mode="welcome"`: só a abertura vermelha, fixa, com "Criar conta ou entrar" e "Entrar como
 * visitante" (a primeira tela do app). `mode="tour"`: as áreas do app, depois de entrar e
 * também pelas configurações; o último botão diz `doneLabel`.
 */
export function WelcomeCarousel({
  mode = 'welcome',
  onStart,
  onGuest,
  onClose,
  doneLabel = 'Pronto',
}: {
  mode?: 'welcome' | 'tour';
  onStart?: () => void;
  onGuest?: () => void;
  onClose?: () => void;
  doneLabel?: string;
}) {
  const { layout } = useTheme();
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  // Altura livre para a arte em cada tela (o texto muda de tamanho de uma para outra).
  const [artH, setArtH] = useState<Record<number, number>>({});
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then(setScreenReader)
      .catch(() => undefined);
  }, []);

  const slides = mode === 'welcome' ? SLIDES.slice(0, 1) : SLIDES.slice(1);
  const last = index === slides.length - 1;
  const footerH = (mode === 'welcome' ? 156 : 96) + Math.max(insets.bottom, 16);
  // Faixa livre no alto: nada da arte fica sob o relógio e a bateria.
  // Celular baixo (SE, minis): espaçamentos um pouco menores para a arte não encolher demais.
  const short = H < 740;
  const top = insets.top + (short ? 16 : 28);

  const goTo = (i: number) => {
    scroll.current?.scrollTo({ x: i * W, animated: !reduceMotion });
    setIndex(i);
  };

  useEffect(() => {
    if (held || reduceMotion || screenReader || last) return;
    const t = setTimeout(() => {
      scroll.current?.scrollTo({ x: (index + 1) * W, animated: true });
      setIndex(index + 1);
    }, AUTO_MS);
    return () => clearTimeout(t);
  }, [index, held, reduceMotion, screenReader, last, W]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.ink950 }}>
      <ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => setHeld(true)}
        onMomentumScrollEnd={(e) => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / W));
          setHeld(false);
        }}
        accessibilityRole="adjustable"
        accessibilityLabel={`Apresentação, tela ${index + 1} de ${slides.length}`}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment' && !last) goTo(index + 1);
          if (e.nativeEvent.actionName === 'decrement' && index > 0) goTo(index - 1);
        }}
      >
        {slides.map((s, i) => (
          <LinearGradient
            key={s.kicker}
            colors={s.red ? RED : DARK}
            start={{ x: 0, y: 0 }}
            end={s.red ? { x: 1, y: 0.4 } : { x: 0, y: 0.6 }}
            style={{ width: W, height: H, overflow: 'hidden' }}
          >
            {s.red && <Stripes w={W} h={H} />}
            <View
              style={{ flex: 1, marginTop: top, overflow: 'hidden' }}
              onLayout={(e) => {
                const v = Math.round(e.nativeEvent.layout.height);
                setArtH((prev) => (prev[i] === v ? prev : { ...prev, [i]: v }));
              }}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {artH[i] ? s.art({ w: W, h: artH[i] }) : null}
            </View>
            <View
              accessible
              accessibilityLabel={`${s.kicker}. ${s.title}. ${s.caption}${s.features ? `. ${s.features.join(', ')}` : ''}`}
              style={{
                paddingHorizontal: layout.gutter,
                paddingTop: short ? 16 : 28,
                marginBottom: footerH + (short ? 14 : 24),
              }}
            >
              <Text variant="overline" style={{ color: s.red ? SOFT : palette.red400 }}>
                {s.kicker}
              </Text>
              <Text variant="displayL" style={{ color: WHITE, marginTop: short ? 8 : 12 }}>
                {s.title}
              </Text>
              <Text variant="bodyL" style={{ color: SOFT, marginTop: short ? 8 : 14 }}>
                {s.caption}
              </Text>
              {s.features && <FeatureStrip items={s.features} gap={short ? 16 : 26} />}
            </View>
          </LinearGradient>
        ))}
      </ScrollView>

      {/* Rodapé fixo: progresso e ações. */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: layout.gutter,
          paddingBottom: Math.max(insets.bottom, 16),
          gap: 16,
        }}
      >
        {slides.length > 1 && (
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Tela ${index + 1} de ${slides.length}`}
            style={{ flexDirection: 'row', gap: 6 }}
          >
            {slides.map((_, i) => (
              <View
                key={i}
                style={{
                  height: 3,
                  flex: i === index ? 3 : 1,
                  borderRadius: 2,
                  backgroundColor: i === index ? WHITE : 'rgba(255,255,255,0.22)',
                }}
              />
            ))}
          </View>
        )}
        {mode === 'welcome' ? (
          <View style={{ gap: 10 }}>
            <Button
              label="Criar conta ou entrar"
              variant="light"
              onPress={() => {
                haptic.select();
                onStart?.();
              }}
              fullWidth
            />
            <Button label="Entrar como visitante" variant="onMedia" onPress={() => onGuest?.()} fullWidth />
          </View>
        ) : (
          <Button
            label={last ? doneLabel : 'Próxima'}
            variant="light"
            icon={last ? 'checkmark' : 'arrow-forward'}
            iconPosition="right"
            onPress={() => (last ? onClose?.() : goTo(index + 1))}
            fullWidth
          />
        )}
      </View>
    </View>
  );
}

/** Quatro caixas iguais, com contorno e texto centralizado: o que a área tem. */
function FeatureStrip({ items, gap }: { items: readonly string[]; gap: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: gap }}>
      {items.map((t) => (
        <View
          key={t}
          style={{
            flex: 1,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.32)',
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        >
          <Text variant="labelM" style={{ color: WHITE, textAlign: 'center' }} numberOfLines={1}>
            {t}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Encaixa a arte no espaço que sobrou: desenhada para ~420 pt de altura, encolhe por inteiro
 * em telas baixas (nunca corta nem invade o texto) e fica centrada.
 */
function Fit({ h, children }: { h: number; children: ReactNode }) {
  const [natural, setNatural] = useState(0);
  const k = natural ? Math.min(1, h / natural) : 1;
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View
        onLayout={(e) => setNatural(Math.round(e.nativeEvent.layout.height))}
        style={{ transform: [{ scale: k }], opacity: natural ? 1 : 0 }}
      >
        {children}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────── cartazes

const SLIDES: Slide[] = [
  {
    kicker: 'Flamengo App',
    title: 'Bem-vindo à Nação',
    caption: 'Jogo, ingresso, estádio e torcida.\nTudo num app só.',
    red: true,
    art: (s) => <WelcomeArt {...s} />,
  },
  {
    kicker: 'Dia de jogo',
    title: 'O jogo no seu bolso',
    caption: 'Placar e lances na hora.\nSaiu gol, o celular avisa.',
    features: ['Ao vivo', 'Lances', 'Escalação', 'Alertas'],
    art: (s) => <LiveArt {...s} />,
  },
  {
    kicker: 'Modo Maracanã',
    title: 'O Maracanã em 3D',
    caption: 'Do portão até a sua cadeira.\nE o banheiro e o lanche mais perto.',
    features: ['Seu lugar', 'Rotas', 'Banheiros', 'Comida'],
    art: (s) => <MaracanaArt {...s} />,
  },
  {
    kicker: 'Ingressos',
    title: 'Comprou, entrou',
    caption: 'Sem papel e sem QR Code.\nNo Maracanã, você entra pelo rosto.',
    features: ['Compra', 'Carteira', 'Biometria', 'Sócio'],
    art: (s) => <TicketArt {...s} />,
  },
  {
    kicker: 'Nação',
    title: 'Torcer vale pontos',
    caption: 'Palpite, voto e acerto sobem você\nna trilha de prêmios.',
    features: ['Bolões', 'Enquetes', 'Quizzes', 'Trilha'],
    art: (s) => <NationArt {...s} />,
  },
  {
    kicker: 'Assistente Fla',
    title: 'Tira a dúvida aqui',
    caption: 'Portão, fila, horário, ingresso.\nO assistente responde na hora.',
    features: ['Jogos', 'Ingressos', 'Estádio', 'Sócio'],
    art: (s) => <AssistantArt {...s} />,
  },
];

/** Listras rubro-negras em diagonal (o manto), discretas, na tela inteira da abertura. */
function Stripes({ w, h }: { w: number; h: number }) {
  const band = 34;
  const n = Math.ceil((w + h) / (band * 2)) + 2;
  return (
    <Svg width={w} height={h} style={{ position: 'absolute', left: 0, top: 0 }}>
      {Array.from({ length: n }, (_, i) => {
        const x = i * band * 2 - h;
        return (
          <Path
            key={i}
            d={`M${x} ${h} L${x + band} ${h} L${x + band + h} 0 L${x + h} 0 Z`}
            fill={palette.ink950}
            opacity={0.12}
          />
        );
      })}
    </Svg>
  );
}

function WelcomeArt({ w, h }: { w: number; h: number }) {
  const mono = Math.min(w * 0.8, (h * 0.86) / (577 / 600));
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Monogram color="white" width={mono} />
    </View>
  );
}

/** Placar grande com os escudos e, embaixo, o lance a lance em linhas com fios. */
function LiveArt({ w, h }: { w: number; h: number }) {
  const inner = w - 40;
  const big = Math.min(inner * 0.3, 112);
  const plays: [string, string, string, boolean][] = [
    ["64'", 'Gol do Flamengo', 'Pedro, de cabeça', true],
    ["58'", 'Cartão amarelo', 'Palmeiras', false],
    ["52'", 'Substituição', 'Entra Bruno Henrique, sai Arrascaeta', false],
    ["45'", 'Fim do 1º tempo', 'Flamengo 1 × 1 Palmeiras', false],
  ];
  return (
    <Fit h={h}>
      <View style={{ width: inner }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.redLive }} />
          <Text variant="overline" style={{ color: WHITE }}>
            {"Ao vivo · 67' · Maracanã"}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 18,
          }}
        >
          <View style={{ alignItems: 'center', gap: 6, width: 64 }}>
            <ClubCrest size={48} />
            <Text variant="labelM" style={{ color: SOFT }}>
              Flamengo
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Text variant="displayHero" style={{ color: WHITE, fontSize: big, lineHeight: big * 1.04 }}>
              2
            </Text>
            <Text variant="displayM" style={{ color: FAINT }}>
              ×
            </Text>
            <Text variant="displayHero" style={{ color: FAINT, fontSize: big, lineHeight: big * 1.04 }}>
              1
            </Text>
          </View>
          <View style={{ alignItems: 'center', gap: 6, width: 64 }}>
            <Crest team={PAL} size={48} />
            <Text variant="labelM" style={{ color: SOFT }}>
              Palmeiras
            </Text>
          </View>
        </View>
        <Text variant="overline" style={{ color: FAINT, marginTop: 22, marginBottom: 4 }}>
          Lance a lance
        </Text>
        {plays.slice(0, h < 420 ? 2 : 4).map(([min, title, sub, hot]) => (
          <View
            key={min}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 10,
              borderTopWidth: 1,
              borderColor: LINE,
            }}
          >
            <Text variant="displayS" style={{ color: hot ? palette.red400 : SOFT, width: 40 }}>
              {min}
            </Text>
            <View style={{ flex: 1 }}>
              <Text variant="titleS" style={{ color: WHITE }} numberOfLines={1}>
                {title}
              </Text>
              <Text variant="bodyS" style={{ color: SOFT }} numberOfLines={1}>
                {sub}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Fit>
  );
}

/** Imagem do modelo 3D (assets/onboarding/maracana.png, 390 × 520, `npm run map:onboarding`). */
const MAP_W = 390;
const MAP_H = 520;

/** O estádio em 3D, na diagonal, fundindo com o preto nas bordas. */
function MaracanaArt({ w, h }: { w: number; h: number }) {
  const k = Math.max(w / MAP_W, h / MAP_H);
  return (
    <View style={{ flex: 1 }}>
      <Image
        source={require('../../../assets/onboarding/maracana.png')}
        style={{
          position: 'absolute',
          left: (w - MAP_W * k) / 2,
          top: (h - MAP_H * k) / 2,
          width: MAP_W * k,
          height: MAP_H * k,
        }}
        accessible={false}
      />
      <LinearGradient
        colors={[DARK[0], 'rgba(23,7,9,0)']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: h * 0.28 }}
      />
      <LinearGradient
        colors={['rgba(14,8,9,0)', '#0E0809']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h * 0.3 }}
      />
      <Text
        variant="footnote"
        style={{ position: 'absolute', right: 20, bottom: 2, color: FAINT, fontSize: 10 }}
      >
        © OpenStreetMap
      </Text>
    </View>
  );
}

/** Rosto reconhecido: cantos de leitura e um rosto em traço, desenho próprio. */
function FaceMark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M6 16V9a3 3 0 0 1 3-3h7M32 6h7a3 3 0 0 1 3 3v7M42 32v7a3 3 0 0 1-3 3h-7M16 42H9a3 3 0 0 1-3-3v-7"
        stroke={WHITE}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={18} cy={20} r={2.2} fill={WHITE} />
      <Circle cx={30} cy={20} r={2.2} fill={WHITE} />
      <Path
        d="M24 21v6h-2M18 32c3.5 3 8.5 3 12 0"
        stroke={WHITE}
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/** Ingresso de papel claro sobre o preto, inclinado, com o selo de entrada pelo rosto. */
function TicketHero({ w }: { w: number }) {
  const tw = Math.min(w - 88, 300);
  const ink = palette.ink950;
  const muted = palette.ink500;
  return (
    <View style={{ width: tw + 24, paddingVertical: 26, alignItems: 'center', alignSelf: 'center' }}>
      <View
        style={{
          position: 'absolute',
          top: 18,
          width: tw,
          height: 168,
          borderRadius: 16,
          backgroundColor: RAISED,
          transform: [{ rotate: '6deg' }, { translateX: 12 }],
        }}
      />
      <View
        style={{
          width: tw,
          borderRadius: 16,
          backgroundColor: palette.ink50,
          padding: 18,
          gap: 14,
          transform: [{ rotate: '-3deg' }],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ClubCrest size={28} />
          <Crest team={PAL} size={28} />
          <View style={{ flex: 1 }} />
          <Text variant="overline" style={{ color: muted }}>
            Brasileirão
          </Text>
        </View>
        <View>
          <Text variant="displayM" style={{ color: ink, fontSize: 22, lineHeight: 26 }} numberOfLines={1}>
            Flamengo × Palmeiras
          </Text>
          <Text variant="bodyS" style={{ color: muted }}>
            Domingo, 16h · Maracanã
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            gap: 22,
            borderTopWidth: 1,
            borderStyle: 'dashed',
            borderColor: 'rgba(10,10,11,0.2)',
            paddingTop: 12,
          }}
        >
          {[
            ['Setor', 'Leste Inferior'],
            ['Bloco', '118'],
            ['Portão', 'D'],
          ].map(([k, v]) => (
            <View key={k}>
              <Text variant="overline" style={{ color: muted }}>
                {k}
              </Text>
              <Text variant="titleM" style={{ color: ink }}>
                {v}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: palette.red600,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: palette.ink950,
        }}
      >
        <FaceMark size={38} />
      </View>
    </View>
  );
}

/** O ingresso em destaque e, embaixo, a carteira: os próximos jogos já comprados. */
function TicketArt({ w, h }: { w: number; h: number }) {
  const inner = w - 40;
  const wallet: [
    string,
    string,
    { id: string; code: string; color: string; shortName: string },
    string,
    string,
  ][] = [
    ['16', 'Nov', PAL, 'Flamengo × Palmeiras', 'Hoje · Portão D'],
    ['23', 'Nov', GRE, 'Flamengo × Grêmio', 'Leste Inferior · Bloco 118'],
    ['04', 'Dez', RAC, 'Flamengo × Racing', 'Libertadores · Norte'],
  ];
  return (
    <Fit h={h}>
      <View style={{ width: inner }}>
        <TicketHero w={w} />
        <Text variant="overline" style={{ color: FAINT, marginTop: 18, marginBottom: 4 }}>
          Na sua carteira
        </Text>
        {wallet.slice(0, h < 420 ? 2 : 3).map(([day, month, team, title, sub], i) => (
          <View
            key={day}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 10,
              borderTopWidth: 1,
              borderColor: LINE,
            }}
          >
            <View style={{ width: 40, alignItems: 'center' }}>
              <Text variant="displayS" style={{ color: i === 0 ? palette.red400 : WHITE }}>
                {day}
              </Text>
              <Text variant="overline" style={{ color: FAINT }}>
                {month}
              </Text>
            </View>
            <Crest team={team} size={28} />
            <View style={{ flex: 1 }}>
              <Text variant="titleS" style={{ color: WHITE }} numberOfLines={1}>
                {title}
              </Text>
              <Text variant="bodyS" style={{ color: SOFT }} numberOfLines={1}>
                {sub}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Fit>
  );
}

/** Mosaico da Nação: bolão, enquete, quiz e a trilha de prêmios. */
function NationArt({ w, h }: { w: number; h: number }) {
  const gap = 10;
  const inner = w - 40;
  const col = (inner - gap) / 2;
  const tall = 276;
  const half = (tall - gap) / 2;
  const tile = (bg: string, children: ReactNode, height: number, width = col) => (
    <View
      style={{
        width,
        height,
        borderRadius: 16,
        backgroundColor: bg,
        padding: 14,
        justifyContent: 'space-between',
      }}
    >
      {children}
    </View>
  );
  return (
    <Fit h={h}>
      <View style={{ width: inner, gap }}>
        <View style={{ flexDirection: 'row', gap }}>
          {tile(
            palette.red600,
            <>
              <Text variant="overline" style={{ color: SOFT }}>
                Bolão
              </Text>
              <View>
                <Text variant="displayXl" style={{ color: WHITE }} numberOfLines={1}>
                  2 × 1
                </Text>
                <Text variant="bodyS" style={{ color: SOFT }}>
                  seu palpite
                </Text>
              </View>
              <Text variant="displayS" style={{ color: WHITE }}>
                +10 pts
              </Text>
            </>,
            tall
          )}
          <View style={{ gap }}>
            {tile(
              RAISED,
              <>
                <Text variant="overline" style={{ color: SOFT }}>
                  Enquete
                </Text>
                <Text variant="titleS" style={{ color: WHITE }}>
                  Craque do jogo?
                </Text>
                <View style={{ gap: 6 }}>
                  {[0.64, 0.36].map((v, i) => (
                    <View key={i} style={{ height: 6, borderRadius: 3, backgroundColor: LINE }}>
                      <View
                        style={{
                          width: `${v * 100}%`,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: i ? FAINT : palette.red400,
                        }}
                      />
                    </View>
                  ))}
                </View>
              </>,
              half
            )}
            {tile(
              RAISED,
              <>
                <Text variant="overline" style={{ color: SOFT }}>
                  Quiz
                </Text>
                <Text variant="titleS" style={{ color: WHITE }}>
                  Ano do 1º Mundial?
                </Text>
                <Text variant="displayS" style={{ color: palette.red400 }}>
                  1981
                </Text>
              </>,
              half
            )}
          </View>
        </View>
        {tile(
          RAISED,
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View>
                <Text variant="overline" style={{ color: SOFT }}>
                  Trilha de prêmios
                </Text>
                <Text variant="displayM" style={{ color: WHITE }}>
                  Raça
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text variant="displayM" style={{ color: WHITE }}>
                  1.482
                </Text>
                <Text variant="bodyS" style={{ color: SOFT }}>
                  pts
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[1, 1, 1, 0.78, 0].map((v, i) => (
                <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: LINE }}>
                  <View
                    style={{
                      width: `${v * 100}%`,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: palette.red600,
                    }}
                  />
                </View>
              ))}
            </View>
          </View>,
          120,
          inner
        )}
      </View>
    </Fit>
  );
}

/** Conversa com o Assistente Fla: o avatar dele ao lado de cada resposta, como no chat do app. */
function AssistantArt({ w, h }: { w: number; h: number }) {
  const inner = w - 40;
  const mine = (text: string) => (
    <View
      style={{
        alignSelf: 'flex-end',
        maxWidth: inner * 0.78,
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 18,
        borderBottomRightRadius: 6,
        backgroundColor: WHITE,
      }}
    >
      <Text variant="bodyM" style={{ color: palette.ink950 }}>
        {text}
      </Text>
    </View>
  );
  const reply = (text: string, expression: 'happy' | 'talking') => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
      <AssistantAvatar expression={expression} size={40} />
      <View
        style={{
          maxWidth: inner - 50 - 12,
          paddingHorizontal: 16,
          paddingVertical: 11,
          borderRadius: 18,
          borderBottomLeftRadius: 6,
          backgroundColor: RAISED,
        }}
      >
        <Text variant="bodyM" style={{ color: WHITE }}>
          {text}
        </Text>
      </View>
    </View>
  );
  return (
    <Fit h={h}>
      <View style={{ width: inner, gap: 12 }}>
        {h >= 420 && mine('Qual o portão do meu setor?')}
        {h >= 420 && reply('Leste Inferior entra pelo Portão D, na Av. Maracanã.', 'talking')}
        {mine('E a fila agora?')}
        {reply('9 minutos. No C, ao lado, 6.', 'talking')}
        {mine('E o banheiro mais perto?')}
        {reply('Atrás do Bloco 118, a 1 minuto. Quer a rota?', 'happy')}
      </View>
    </Fit>
  );
}
