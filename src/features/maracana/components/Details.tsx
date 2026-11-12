import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, View } from 'react-native';

import { Button, DemoBadge, Text, useTheme } from '@/design-system';
import type { GateInfo, PoiInfo } from '@/services/stadium/query';
import type { Area, HelpChannel, Sector, TransitStation } from '@/services/stadium/types';
import { openDirections } from '../../stadium/directions';
import { CATEGORY } from '../categories';
import { CategoryMark, Field, meters } from './SheetParts';

function Header({ overline, title, onClose }: { overline: string; title: string; onClose: () => void }) {
  const { colors, layout } = useTheme();
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: layout.gutter, gap: 12 }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="overline" tone="tertiary">
          {overline}
        </Text>
        <Text variant="displayM" accessibilityRole="header">
          {title}
        </Text>
      </View>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        style={{ width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' }}
      >
        <Ionicons name="close" size={24} color={colors.inkPrimary} />
      </Pressable>
    </View>
  );
}

function Fields({ children }: { children: React.ReactNode }) {
  const { colors, layout } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 20,
        marginTop: 20,
        marginHorizontal: layout.gutter,
        paddingTop: 16,
        borderTopWidth: 1,
        borderColor: colors.lineHairline,
      }}
    >
      {children}
    </View>
  );
}

/** Canais de ajuda com telefone, um por linha (toque liga). */
export function HelpRows({ channels }: { channels: HelpChannel[] }) {
  const { colors, layout } = useTheme();
  return (
    <View>
      {channels.map((h) => (
        <Pressable
          key={h.id}
          disabled={!h.phone && !h.url}
          onPress={() => Linking.openURL(h.phone ? `tel:${h.phone.replace(/\D/g, '')}` : h.url!)}
          accessibilityRole={h.phone || h.url ? 'button' : 'text'}
          accessibilityLabel={`${h.name}. ${h.description}${h.phone ? `. Ligar ${h.phone}` : ''}`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            minHeight: 60,
            paddingVertical: 10,
            paddingHorizontal: layout.gutter,
            borderBottomWidth: 1,
            borderColor: colors.lineHairline,
            backgroundColor: pressed ? colors.bgRaised2 : 'transparent',
          })}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="titleS">{h.name}</Text>
            <Text variant="bodyS" tone="secondary">
              {h.description}
            </Text>
          </View>
          {h.phone && (
            <Text variant="displayS" tone="brand">
              {h.phone}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

export function PoiDetail({
  poi,
  block,
  gate,
  sectorName,
  distance,
  help,
  onClose,
}: {
  poi: PoiInfo;
  block?: string;
  /** Para pontos na área externa: o portão mais perto. */
  gate?: string;
  sectorName?: string;
  distance?: number;
  /** Canais ligados a este ponto (segurança, Juizado, acolhimento). */
  help: HelpChannel[];
  onClose: () => void;
}) {
  const { layout } = useTheme();
  const where = [
    poi.level === null ? 'Área externa' : `Nível ${poi.level}`,
    block ? `bloco ${block}` : gate ? `perto do ${gate}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
  const connects = poi.levels.filter((l) => l !== '0' && l !== '4');
  return (
    <View>
      <Header overline={where} title={poi.name} onClose={onClose} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: layout.gutter,
          marginTop: 10,
        }}
      >
        <CategoryMark category={poi.category} size={24} />
        <Text variant="bodyM" tone="secondary" style={{ flex: 1 }}>
          {connects.length > 1
            ? `Liga os níveis ${connects.join(', ')}`
            : CATEGORY[poi.category].label !== poi.name
              ? CATEGORY[poi.category].label
              : ''}
        </Text>
        {poi.confidence === 'estimado' && <DemoBadge label="Posição aproximada" />}
      </View>
      {(sectorName || distance !== undefined) && (
        <Fields>
          {sectorName && <Field label="Perto do setor" value={sectorName} grow />}
          {distance !== undefined && <Field label="Daqui" value={meters(distance)} />}
        </Fields>
      )}
      {help.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <HelpRows channels={help} />
        </View>
      )}
    </View>
  );
}

export function SectorDetail({
  sector,
  area,
  isMine,
  onHere,
  onClose,
}: {
  sector: Sector;
  area?: Area;
  isMine: boolean;
  onHere: () => void;
  onClose: () => void;
}) {
  const { layout } = useTheme();
  const blocks = sector.blocks.length
    ? `${sector.blocks[0]}–${sector.blocks[sector.blocks.length - 1]}`
    : '—';
  return (
    <View>
      <Header overline="Setor" title={area?.name ?? sector.ticketName ?? sector.name} onClose={onClose} />
      <Text variant="bodyM" tone="secondary" style={{ paddingHorizontal: layout.gutter, marginTop: 6 }}>
        {sector.name}
        {sector.visitor ? ' · torcida visitante' : ''}
      </Text>
      <Fields>
        <Field label="Nível" value={sector.level} />
        <Field label={sector.gates.length > 1 ? 'Portões' : 'Portão'} value={sector.gates.join(' · ')} />
        <Field label="Blocos" value={blocks} grow />
      </Fields>
      <View style={{ paddingHorizontal: layout.gutter, marginTop: 20 }}>
        {isMine ? (
          <Text variant="labelM" tone="brand">
            Você está aqui
          </Text>
        ) : (
          <Button label="Estou aqui" variant="secondary" icon="location-outline" onPress={onHere} fullWidth />
        )}
      </View>
    </View>
  );
}

export function GateDetail({
  gate,
  station,
  wait,
  sectors,
  onClose,
}: {
  gate: GateInfo;
  station?: TransitStation;
  wait?: number;
  /** Setores que entram por este portão (nomes de ingresso). */
  sectors: string[];
  onClose: () => void;
}) {
  const { layout } = useTheme();
  return (
    <View>
      <Header overline="Entrada" title={gate.name} onClose={onClose} />
      <Text variant="bodyM" tone="secondary" style={{ paddingHorizontal: layout.gutter, marginTop: 6 }}>
        {gate.street}
        {gate.nickname ? ` · lado ${gate.nickname === 'UERJ' ? 'da UERJ' : `do ${gate.nickname}`}` : ''}
      </Text>
      <Fields>
        {wait !== undefined && <Field label="Fila agora" value={`${wait} min`} />}
        <Field label="Setores" value={sectors.join(', ') || '—'} grow lines={2} />
      </Fields>
      {station && (
        <Text variant="bodyS" tone="secondary" style={{ paddingHorizontal: layout.gutter, marginTop: 12 }}>
          Estação mais perto: {station.name.replace('Estação ', '')} ({station.lines.join(', ')})
        </Text>
      )}
      <View style={{ paddingHorizontal: layout.gutter, marginTop: 20 }}>
        <Button
          label={`Rota até o ${gate.name}`}
          icon="navigate-outline"
          onPress={() =>
            openDirections(
              { coords: { latitude: gate.coords[1], longitude: gate.coords[0] }, label: gate.name },
              'walking'
            )
          }
          fullWidth
        />
      </View>
    </View>
  );
}
