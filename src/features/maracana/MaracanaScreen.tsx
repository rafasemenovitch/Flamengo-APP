import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type TextInputInstance,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Button, ErrorState, IconButton, Text, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { useDemoLocation } from '@/hooks/useMatch';
import type { RootScreenProps } from '@/navigation/types';
import { IS_DEMO, services } from '@/services';
import {
  areaCenter,
  distanceM,
  gatesOf,
  isInside,
  nearest,
  nearestBlock,
  nearestGate,
  poisOf,
  search,
  type PoiInfo,
} from '@/services/stadium/query';
import type { PoiCategory } from '@/services/stadium/types';
import { haptic } from '@/utils/haptics';
import darkStyle from '../../../map/styles/maracana-dark.json';
import lightStyle from '../../../map/styles/maracana-light.json';
import type { FromMap, ToMap } from '../../../map/web/protocol';
import { openDirections, travelModeFor } from '../stadium/directions';
import { ALL_CATEGORIES, CATEGORY, GROUPS } from './categories';
import { AreaPicker } from './components/AreaPicker';
import { GateDetail, HelpRows, PoiDetail, SectorDetail } from './components/Details';
import { LevelPanel } from './components/LevelPanel';
import { LocationNotice } from './components/LocationNotice';
import { MapSheet, type Snap } from './components/MapSheet';
import { PlaceRow, SearchField, SheetLabel, Shortcuts, WhereAmI, meters } from './components/SheetParts';
import { DemoLocationPicker } from './DemoLocationPicker';
import { StadiumMapView, type StadiumMapHandle } from './StadiumMapView';
import { useDeviceLocation } from './useDeviceLocation';
import { useTodayTicket } from './useTodayTicket';

const VENUE = 'maracana';
type Selection = { kind: 'poi' | 'sector' | 'gate'; id: string } | null;
/** "Mais perto de você" sem filtro: um de cada coisa que o torcedor mais procura. */
const ESSENTIALS: PoiCategory[] = ['banheiro', 'alimentacao', 'bebidas', 'posto_medico', 'saida_emergencia'];
/** Ponto fora do estádio usado na simulação "Fora" (perto da Praça Saens Peña, ~1,4 km). */
const OUTSIDE_DEMO: [number, number] = [-43.2329, -22.9244];
/** Precisão a partir da qual a posição é "aproximada" (metros). */
const ROUGH = 30;
/** Nível escolhido sem área: vale para a sessão (volta ao reabrir a tela). */
let sessionLevel: string | null = null;
const HELP_FOR: Partial<Record<PoiCategory, string[]>> = {
  seguranca: ['seguranca', 'pm'],
  juizado: ['juizado', 'mprj'],
  acolhimento: ['acolhimento', 'ligue180'],
};

/**
 * MODO MARACANÃ: mapa 3D do estádio, aberto a qualquer torcedor, com ou sem ingresso.
 * O mapa (WebView) só desenha e avisa dos toques; toda a interface é daqui.
 */
export function MaracanaScreen({ navigation, route }: RootScreenProps<'StadiumMode'>) {
  const theme = useTheme();
  const { colors, layout, scheme } = theme;
  const insets = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();

  const data = useAsync(() => services.venueMap.getStadiumData(VENUE));
  const legacy = useAsync(() => services.stadium.getStadium());
  const queues = useAsync(() => services.stadium.getQueues());
  const ticket = useTodayTicket();
  const refreshQueues = queues.refresh;
  useEffect(() => {
    const t = setInterval(refreshQueues, 60_000);
    return () => clearInterval(t);
  }, [refreshQueues]);

  const map = useRef<StadiumMapHandle>(null);
  const send = useCallback((msg: ToMap) => map.current?.send(msg), []);
  const [ready, setReady] = useState(false);
  const [level, setLevel] = useState('all');
  const [area, setArea] = useState<{ id: string; block?: string } | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [snap, setSnap] = useState<Snap>('collapsed');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [picker, setPicker] = useState(false);
  const [topH, setTopH] = useState(110);
  const [headerH, setHeaderH] = useState(150);
  const [demoPanel, setDemoPanel] = useState(false);
  const device = useDeviceLocation();
  const [demoLoc] = useDemoLocation();
  const searchRef = useRef<TextInputInstance>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const sections = useRef<Record<string, number>>({});

  const d = data.data;
  const pois = useMemo(() => (d ? poisOf(d) : []), [d]);
  const gates = useMemo(() => (d ? gatesOf(d) : []), [d]);
  const areaInfo = d?.levels.areas.find((a) => a.id === area?.id);

  const heights = useMemo(() => {
    const collapsed = headerH + 18 + Math.max(insets.bottom, 12);
    return {
      collapsed,
      mid: Math.max(collapsed + 220, Math.round(H * 0.5)),
      full: H - insets.top - 64,
    };
  }, [headerH, insets.bottom, insets.top, H]);

  // ─── mensagens do mapa
  const onMap = useCallback(
    (msg: FromMap) => {
      if (msg.type === 'loaded' && d)
        send({
          type: 'init',
          data: d,
          styles: { light: lightStyle as never, dark: darkStyle as never },
          theme: scheme,
        });
      if (msg.type === 'ready') setReady(true);
      if (msg.type === 'levelChanged') setLevel(msg.level);
      if (msg.type === 'poiTapped' || msg.type === 'sectorTapped' || msg.type === 'gateTapped') {
        haptic.select();
        setSelection({
          kind: msg.type === 'poiTapped' ? 'poi' : msg.type === 'sectorTapped' ? 'sector' : 'gate',
          id: msg.id,
        });
        setSearching(false);
        setSnap('mid');
      }
    },
    [d, scheme, send]
  );

  useEffect(() => {
    if (ready) send({ type: 'setTheme', theme: scheme });
  }, [ready, scheme, send]);

  // O mapa centraliza no espaço livre entre o topo, a coluna de níveis e a folha recolhida.
  useEffect(() => {
    if (ready) send({ type: 'setInsets', top: topH, bottom: heights.collapsed, right: 64 });
  }, [ready, topH, heights.collapsed, send]);

  // Área inicial: a do setor vindo de fora (ingresso) ou a do ingresso de hoje.
  const started = useRef(false);
  useEffect(() => {
    if (!ready || started.current || ticket.loading || legacy.loading) return;
    started.current = true;
    const fromRoute = legacy.data?.sectors.find((s) => s.id === route.params?.sectorId)?.areaId;
    const fromTicket = ticket.data?.areaId;
    const id = fromRoute ?? fromTicket;
    if (id) {
      const block = fromTicket === id ? ticket.data?.block : undefined;
      // Sincroniza com o mapa, que acabou de ficar pronto (sistema externo).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArea({ id, block });
      send({ type: 'setArea', area: id, block });
    } else if (sessionLevel) send({ type: 'setLevel', level: sessionLevel });
    const tab = route.params?.tab;
    if (tab === 'chegar' || tab === 'filas') {
      setSnap('full');
      setTimeout(() => scroll.current?.scrollTo({ y: sections.current[tab] ?? 0, animated: true }), 400);
    }
  }, [ready, ticket.loading, ticket.data, legacy.loading, legacy.data, route.params, send]);

  // ─── ações
  const applyArea = (id: string | null, block?: string) => {
    haptic.select();
    setArea(id ? { id, block } : null);
    send({ type: 'setArea', area: id, block });
    if (!id) {
      send({ type: 'setLevel', level: 'all' });
      send({ type: 'recenter' });
    }
  };
  const applyGroup = (key: string | null) => {
    haptic.select();
    setGroup(key);
    const g = GROUPS.find((x) => x.key === key);
    send({ type: 'setFilters', hidden: g ? ALL_CATEGORIES.filter((c) => !g.categories.includes(c)) : [] });
    if (g && level === 'all')
      send({ type: 'setLevel', level: areaInfo?.defaultLevel ?? d?.venue.defaultLevel ?? '1' });
    if (g && snap === 'collapsed') setSnap('mid');
  };
  const openPoi = (p: PoiInfo) => {
    haptic.select();
    send({ type: 'focusPoi', id: p.id });
    setSelection({ kind: 'poi', id: p.id });
    setSearching(false);
    searchRef.current?.blur();
    setSnap('mid');
  };
  const closeDetail = () => {
    setSelection(null);
    send({ type: 'clearSelection' });
  };

  // ─── derivados
  const activeLevel = level === 'all' ? (areaInfo?.defaultLevel ?? null) : level;

  // Você no mapa: GPS do aparelho ou a posição simulada do painel de demonstração.
  const user = ((): { at: [number, number]; accuracy: number; level: string | null } | null => {
    if (!d) return null;
    if (demoLoc.kind === 'real')
      return device.position
        ? {
            at: [device.position.lng, device.position.lat],
            accuracy: device.position.accuracy,
            level: activeLevel,
          }
        : null;
    if (demoLoc.kind === 'outside') return { at: OUTSIDE_DEMO, accuracy: 15, level: null };
    if (demoLoc.kind === 'gate') {
      const g = gates.find((x) => x.id === demoLoc.id);
      return g ? { at: g.coords, accuracy: 8, level: null } : null;
    }
    const seat = area?.id ?? ticket.data?.areaId ?? 'leste-inferior';
    const lvl =
      (seat === area?.id && activeLevel) || d.levels.areas.find((a) => a.id === seat)?.defaultLevel || '1';
    const at = areaCenter(d, seat, lvl);
    return at ? { at, accuracy: 12, level: lvl } : null;
  })();
  const inside = !!d && !!user && isInside(d, user.at);
  const locating = demoLoc.kind === 'real' && device.status === 'locating';

  const [uLng, uLat, uAcc, uLevel] = user ? [user.at[0], user.at[1], user.accuracy, user.level] : [];
  useEffect(() => {
    if (!ready) return;
    if (uLng !== undefined && uLat !== undefined)
      send({ type: 'setUserLocation', lng: uLng, lat: uLat, accuracy: uAcc ?? 0, level: uLevel ?? null });
    else send({ type: 'clearUserLocation' });
  }, [ready, uLng, uLat, uAcc, uLevel, send]);

  // Primeira posição dentro do estádio (ou troca de simulação): a câmera vai até você.
  const followed = useRef<string>('');
  const hasUser = !!user;
  useEffect(() => {
    if (!ready || !hasUser || !inside) return;
    const key = demoLoc.kind === 'real' ? 'gps' : JSON.stringify(demoLoc);
    if (followed.current === key) return;
    followed.current = key;
    send({ type: 'focusUser' });
  }, [ready, hasUser, inside, demoLoc, send]);

  const locate = () => {
    haptic.select();
    if (user && inside) send({ type: 'focusUser' });
    else if (demoLoc.kind === 'real') void device.request();
  };

  const from =
    user && inside && user.level && activeLevel === user.level
      ? user.at
      : d && area && activeLevel
        ? areaCenter(d, area.id, activeLevel)
        : null;
  const groupCats = GROUPS.find((g) => g.key === group)?.categories;
  // Calculados a cada render: o React Compiler cuida da memorização.
  const near = (() => {
    if (!d || !activeLevel) return [];
    if (from) {
      const list = nearest(pois, from, { level: activeLevel, categories: groupCats });
      if (groupCats) return list.slice(0, 8);
      // Sem filtro: o mais perto de cada essencial.
      return ESSENTIALS.map((c) => list.find((p) => p.category === c)).filter(
        (p): p is (typeof list)[number] => !!p
      );
    }
    return groupCats
      ? pois.filter((p) => p.level === activeLevel && groupCats.includes(p.category)).slice(0, 8)
      : [];
  })();
  // Busca: o que está no seu nível e mais perto de você vem primeiro.
  const found = (() => {
    if (!d || !query) return [];
    const hits = search(d, query, activeLevel ?? undefined);
    if (!from || !activeLevel) return hits;
    const rank = (h: (typeof hits)[number]) =>
      h.kind !== 'poi' ? -1 : (h.poi.level === activeLevel ? 0 : 1e6) + distanceM(from, h.poi.coords);
    return [...hits].sort((a, b) => rank(a) - rank(b));
  })();
  const results = found.slice(0, 30);
  const blockOf = (p: PoiInfo) => (d ? nearestBlock(d, p.coords, p.level) : undefined);
  const poiMeta = (p: PoiInfo) =>
    p.level === null
      ? `Área externa · perto do ${(d && nearestGate(d, p.coords)?.name) ?? 'portão'}`
      : [`Nível ${p.level}`, blockOf(p) && `bloco ${blockOf(p)}`].filter(Boolean).join(' · ');
  const sectorName = (id?: string) => {
    const s = d?.levels.sectors.find((x) => x.id === id);
    return s?.ticketName ?? s?.name;
  };
  const waitOf = (gateId: string) => queues.data?.find((q) => q.gateId === gateId)?.waitMinutes;

  const ticketLine =
    ticket.data && ticket.data.areaId === area?.id
      ? `Do seu ingresso · Portão ${ticket.data.gate} · entrada pela face`
      : undefined;

  if (data.error)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgCanvas, paddingTop: insets.top }}>
        <IconButton
          icon="chevron-back"
          variant="plain"
          accessibilityLabel="Voltar"
          onPress={() => navigation.goBack()}
        />
        <ErrorState onRetry={data.reload} />
      </View>
    );

  // ─── conteúdo da folha
  const detail = (() => {
    if (!d || !selection) return null;
    if (selection.kind === 'poi') {
      const p = pois.find((x) => x.id === selection.id);
      if (!p) return null;
      const help = (HELP_FOR[p.category] ?? [])
        .map((id) => d.venue.help.find((h) => h.id === id))
        .filter((h): h is NonNullable<typeof h> => !!h);
      return (
        <PoiDetail
          poi={p}
          block={blockOf(p)}
          gate={p.level === null ? nearestGate(d, p.coords)?.name : undefined}
          sectorName={sectorName(p.sector)}
          distance={
            from ? nearest([p], from, { level: p.level ?? activeLevel ?? '1' })[0]?.distance : undefined
          }
          help={help}
          onClose={closeDetail}
        />
      );
    }
    if (selection.kind === 'sector') {
      const s = d.levels.sectors.find((x) => x.id === selection.id);
      if (!s) return null;
      const a = d.levels.areas.find((x) => x.sectors.includes(s.id));
      return (
        <SectorDetail
          sector={s}
          area={a}
          isMine={!!a && a.id === area?.id && activeLevel === s.level}
          onHere={() => a && applyArea(a.id, s.blocks[0])}
          onClose={closeDetail}
        />
      );
    }
    const g = gates.find((x) => x.id === selection.id);
    if (!g) return null;
    return (
      <GateDetail
        gate={g}
        station={d.venue.transit.find((t) => t.id === g.station)}
        wait={waitOf(g.id)}
        sectors={[
          ...new Set(
            d.levels.sectors.filter((s) => s.gates.includes(g.id) && s.ticketName).map((s) => s.ticketName!)
          ),
        ]}
        onClose={closeDetail}
      />
    );
  })();

  // ─── avisos de localização
  const myGate =
    ticket.data?.gate ??
    (areaInfo && d?.levels.sectors.find((s) => areaInfo.sectors.includes(s.id))?.gates[0]) ??
    (user && d ? nearestGate(d, user.at)?.id : undefined);
  const notice = (() => {
    if (user && !inside && d) {
      const dist = distanceM(user.at, d.venue.center as [number, number]);
      const g = gates.find((x) => x.id === myGate);
      return (
        <LocationNotice
          overline="Fora do estádio"
          title="Você está fora do Maracanã"
          body={`A ${dist < 1000 ? `${Math.round(dist / 10) * 10} m` : `${(dist / 1000).toFixed(1).replace('.', ',')} km`} daqui.${
            g ? ` ${ticket.data ? 'Seu ingresso entra pelo' : 'O mais perto é o'} ${g.name}.` : ''
          }`}
          primary={
            g
              ? {
                  label: `Como chegar ao ${g.name}`,
                  icon: 'navigate-outline',
                  onPress: () =>
                    openDirections(
                      { coords: { latitude: g.coords[1], longitude: g.coords[0] }, label: g.name },
                      dist > 1500 ? 'transit' : 'walking'
                    ),
                }
              : undefined
          }
        />
      );
    }
    if (demoLoc.kind !== 'real') return null;
    if (device.status === 'explain')
      return (
        <LocationNotice
          overline="Sua localização"
          title="Mostrar onde você está?"
          body="Só enquanto o Modo Maracanã estiver aberto, para pôr você no mapa e achar o que fica mais perto."
          secondary={{ label: 'Agora não', onPress: device.dismiss }}
          primary={{
            label: 'Usar localização',
            icon: 'location-outline',
            onPress: () => void device.accept(),
          }}
        />
      );
    if (device.status === 'denied')
      return (
        <LocationNotice
          overline="Sua localização"
          title="A localização está desligada para o app"
          body="Dá para escolher seu setor e ver o que fica mais perto do mesmo jeito."
          secondary={{ label: 'Escolher setor', onPress: () => setPicker(true) }}
          primary={{
            label: 'Abrir ajustes',
            icon: 'settings-outline',
            onPress: () => void Linking.openSettings(),
          }}
        />
      );
    if (device.status === 'off')
      return (
        <LocationNotice
          overline="Sua localização"
          title="O GPS do celular está desligado"
          body="Ligue a localização nos ajustes do celular para aparecer no mapa."
          primary={{
            label: 'Tentar de novo',
            icon: 'location-outline',
            onPress: () => void device.request(),
          }}
        />
      );
    if (device.status === 'error')
      return (
        <LocationNotice
          overline="Sua localização"
          title="Não deu para achar você agora"
          body="Tente de novo em alguns segundos, de preferência longe de paredes."
          primary={{
            label: 'Tentar de novo',
            icon: 'location-outline',
            onPress: () => void device.request(),
          }}
        />
      );
    return null;
  })();
  const statusLine =
    user && inside && user.accuracy > ROUGH
      ? `Localização aproximada · ±${Math.round(user.accuracy)} m`
      : undefined;

  const home = (
    <>
      {searching || query ? (
        <View>
          <SheetLabel>
            {!query
              ? 'Busca'
              : found.length > results.length
                ? `${found.length} resultados · os ${results.length} mais perto`
                : `${found.length} ${found.length === 1 ? 'resultado' : 'resultados'}`}
          </SheetLabel>
          {results.map((r, i) =>
            r.kind === 'poi' ? (
              <PlaceRow
                key={`p${r.poi.id}`}
                category={r.poi.category}
                title={r.poi.name}
                meta={poiMeta(r.poi)}
                onPress={() => openPoi(r.poi)}
              />
            ) : r.kind === 'gate' ? (
              <PlaceRow
                key={`g${r.gate.id}`}
                title={r.gate.name}
                meta={r.gate.street}
                right={waitOf(r.gate.id) !== undefined ? `${waitOf(r.gate.id)} min` : undefined}
                onPress={() => {
                  setSelection({ kind: 'gate', id: r.gate.id });
                  setSearching(false);
                  setSnap('mid');
                }}
              />
            ) : (
              <PlaceRow
                key={`a${r.id}${i}`}
                title={r.name}
                meta="Marcar como onde você está"
                onPress={() => {
                  applyArea(r.id);
                  setQuery('');
                  setSearching(false);
                  searchRef.current?.blur();
                }}
              />
            )
          )}
          {!!query && results.length === 0 && (
            <Text
              variant="bodyM"
              tone="secondary"
              style={{ paddingHorizontal: layout.gutter, paddingVertical: 16 }}
            >
              Nada com “{query}”. Tente banheiro, comida, médico ou portão.
            </Text>
          )}
        </View>
      ) : (
        <>
          <Shortcuts active={group} onChange={applyGroup} />

          {area && near.length > 0 && (
            <SheetLabel>
              {groupCats ? GROUPS.find((g) => g.key === group)!.near : 'Mais perto de você'}
            </SheetLabel>
          )}
          {!area && group && near.length > 0 && <SheetLabel>{`No nível ${activeLevel}`}</SheetLabel>}
          {near.map((p) => (
            <PlaceRow
              key={p.id}
              category={p.category}
              title={groupCats ? p.name : CATEGORY[p.category].label}
              meta={poiMeta(p)}
              right={'distance' in p ? meters((p as { distance: number }).distance) : undefined}
              onPress={() => openPoi(p)}
            />
          ))}
          {!area && (
            <View style={{ paddingHorizontal: layout.gutter, marginTop: 24, gap: 14 }}>
              <Text variant="bodyM" tone="secondary">
                Diga onde você está e o mapa mostra o banheiro, a comida e a saída mais perto.
              </Text>
              <Button
                label="Escolher meu setor"
                variant="secondary"
                icon="location-outline"
                onPress={() => setPicker(true)}
              />
            </View>
          )}

          <View onLayout={(e) => (sections.current.filas = e.nativeEvent.layout.y)}>
            <SheetLabel>Portões</SheetLabel>
            {gates.map((g) => (
              <PlaceRow
                key={g.id}
                title={g.nickname ? `${g.name} · ${g.nickname}` : g.name}
                meta={g.street}
                right={waitOf(g.id) !== undefined ? `${waitOf(g.id)} min` : undefined}
                onPress={() => {
                  haptic.select();
                  setSelection({ kind: 'gate', id: g.id });
                  setSnap('mid');
                }}
              />
            ))}
            <Text variant="bodyS" tone="tertiary" style={{ paddingHorizontal: layout.gutter, marginTop: 8 }}>
              Fila estimada, simulada · atualiza a cada minuto
            </Text>
          </View>

          <View onLayout={(e) => (sections.current.chegar = e.nativeEvent.layout.y)}>
            <SheetLabel>Chegar ao Maracanã</SheetLabel>
            {legacy.data?.transport.map((t) => (
              <PlaceRow
                key={t.id}
                title={t.title.replace(' — ', ' · ')}
                meta={`Portão ${t.bestGateIds.join(', ')} · ${t.walkMinutes} min a pé`}
                onPress={() => openDirections({ query: t.mapsQuery, label: t.title }, travelModeFor(t.mode))}
              />
            ))}
          </View>

          {d && (
            <>
              <SheetLabel>Ajuda e denúncia</SheetLabel>
              <HelpRows channels={d.venue.help} />
            </>
          )}
          <Text variant="bodyS" tone="tertiary" style={{ paddingHorizontal: layout.gutter, marginTop: 20 }}>
            Banheiros, bares e serviços estão em posições aproximadas até termos as plantas oficiais.
          </Text>
        </>
      )}
    </>
  );

  const levels = d?.levels.levels.filter((l) => l.public).map((l) => l.id) ?? [];
  const showSide = snap !== 'full';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      {d && <StadiumMapView ref={map} onMessage={onMap} background={colors.bgCanvas} />}

      {/* Topo: voltar, título e o aviso de posições aproximadas */}
      <LinearGradient
        colors={[colors.bgCanvas, `${colors.bgCanvas}E6`, `${colors.bgCanvas}00`]}
        locations={[0, 0.55, 1]}
        pointerEvents="box-none"
        onLayout={(e) => setTopH(Math.round(e.nativeEvent.layout.height) - 24)}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          paddingTop: insets.top + 4,
          paddingBottom: 36,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
          <IconButton
            icon="chevron-back"
            variant="plain"
            accessibilityLabel="Voltar"
            onPress={() => navigation.goBack()}
          />
          <Pressable
            style={{ flex: 1, alignItems: 'center', gap: 4 }}
            // Painel de demonstração escondido (toque longo no título), como na Home.
            onLongPress={IS_DEMO ? () => setDemoPanel(true) : undefined}
            delayLongPress={600}
            accessible={false}
          >
            <Text variant="titleM" accessibilityRole="header">
              Modo Maracanã
            </Text>
            <Badge label="Posições aproximadas" icon="flask-outline" style={{ alignSelf: 'center' }} />
          </Pressable>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      {/* Lateral: nível e recentralizar */}
      {d && showSide && (
        <View style={{ position: 'absolute', right: 12, top: topH + 4, gap: 10, alignItems: 'center' }}>
          <LevelPanel
            levels={levels}
            active={level}
            onChange={(l) => {
              if (!area) sessionLevel = l === 'all' ? null : l;
              send({ type: 'setLevel', level: l });
            }}
          />
          <IconButton
            icon="scan-outline"
            accessibilityLabel="Recentralizar o mapa"
            onPress={() => {
              haptic.select();
              send({ type: 'recenter' });
            }}
            style={{ backgroundColor: colors.bgRaised, borderWidth: 1, borderColor: colors.lineHairline }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {locating && (
              <View
                accessibilityLiveRegion="polite"
                style={{
                  position: 'absolute',
                  right: 52,
                  height: 32,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  justifyContent: 'center',
                  backgroundColor: colors.bgRaised,
                  borderWidth: 1,
                  borderColor: colors.lineHairline,
                }}
              >
                <Text variant="labelM" numberOfLines={1}>
                  Posicionando…
                </Text>
              </View>
            )}
            <IconButton
              icon={user && inside ? 'navigate' : 'navigate-outline'}
              accessibilityLabel={locating ? 'Minha localização, posicionando' : 'Minha localização'}
              onPress={locate}
              style={{
                backgroundColor: user && inside ? colors.accent : colors.bgRaised,
                borderWidth: 1,
                borderColor: user && inside ? colors.accent : colors.lineHairline,
              }}
            />
          </View>
        </View>
      )}

      <MapSheet
        snap={snap}
        onSnap={setSnap}
        heights={heights}
        header={
          <View onLayout={(e) => setHeaderH(Math.round(e.nativeEvent.layout.height))}>
            {/* Avisos de localização ficam no topo fixo: aparecem mesmo com a folha recolhida. */}
            {notice && <View style={{ marginTop: -12, marginBottom: 8 }}>{notice}</View>}
            <WhereAmI
              area={areaInfo?.name}
              level={area ? (activeLevel ?? undefined) : undefined}
              ticketLine={[ticketLine, statusLine].filter(Boolean).join('\n') || undefined}
              onPress={() => setPicker(true)}
            />
            <SearchField
              ref={searchRef}
              value={query}
              onChange={setQuery}
              onFocus={() => {
                setSearching(true);
                setSelection(null);
                setSnap('full');
              }}
              onClear={() => {
                setQuery('');
                setSearching(false);
                searchRef.current?.blur();
              }}
            />
          </View>
        }
      >
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 32 }}
        >
          {detail ? <View style={{ paddingTop: 12 }}>{detail}</View> : home}
        </ScrollView>
      </MapSheet>

      {IS_DEMO && (
        <Modal
          visible={demoPanel}
          transparent
          animationType="slide"
          onRequestClose={() => setDemoPanel(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
            onPress={() => setDemoPanel(false)}
            accessible={false}
          >
            <Pressable onPress={() => undefined} accessible={false}>
              <SafeAreaView
                edges={['bottom']}
                style={{
                  backgroundColor: colors.bgRaised,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  padding: layout.gutter,
                  gap: 12,
                }}
              >
                <DemoLocationPicker />
                <Button
                  label="Pronto"
                  fullWidth
                  onPress={() => setDemoPanel(false)}
                  style={{ marginTop: 8 }}
                />
              </SafeAreaView>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {d && (
        <AreaPicker
          key={picker ? 'aberto' : 'fechado'}
          visible={picker}
          areas={d.levels.areas}
          value={area?.id ?? null}
          block={area?.block}
          onClose={() => setPicker(false)}
          onApply={applyArea}
        />
      )}
    </View>
  );
}
