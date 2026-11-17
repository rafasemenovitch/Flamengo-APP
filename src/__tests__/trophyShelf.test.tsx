import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Image, ScrollView } from 'react-native';

import { PressableScale, Text, ThemeProvider } from '@/design-system';
import { TROPHY_GOALS } from '@/data/trophies';
import { TrophyArt } from '@/features/nation/gamification/TrophyArt';
import { TrophyShelf } from '@/features/nation/gamification/TrophyShelf';
import { resolveTrophyRoom } from '@/utils/trophies';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const room = resolveTrophyRoom(TROPHY_GOALS, {
  counters: { matches: 10 },
  completed: { 'manto-sagrado': {} },
});

describe('prateleira de prêmios', () => {
  let screen: ReactTestRenderer;
  afterEach(async () => {
    await act(async () => {
      screen?.unmount();
    });
  });
  it('no perfil só desenha o estágio conquistado e abre o objetivo tocado', async () => {
    const select = jest.fn();
    await act(async () => {
      screen = create(
        <ThemeProvider>
          <TrophyShelf achievements={room} earnedOnly onSelect={select} />
        </ThemeProvider>
      );
    });
    const pieces = screen.root.findAllByType(PressableScale);
    expect(pieces).toHaveLength(2);
    const presence = pieces.find((piece) => piece.props.accessibilityLabel.startsWith('Sempre presente.'))!;
    expect(presence.props.accessibilityLabel).toContain('Medalha de prata.');
    expect(
      pieces.some((piece) => piece.props.accessibilityLabel.includes('Manto Sagrado. Troféu de ouro.'))
    ).toBe(true);
    expect(screen.root.findAllByType(TrophyArt).every((art) => !art.props.locked)).toBe(true);
    expect(screen.root.findAllByType(ScrollView)).toHaveLength(0);
    expect(screen.root.findAllByType(Image)).toHaveLength(2);
    await act(async () => {
      presence.props.onPress();
    });
    expect(select).toHaveBeenCalledWith('sempre-presente');
  });
  it('sem conquistas não mostra peças ou vagas na vitrine', async () => {
    const empty = resolveTrophyRoom(TROPHY_GOALS, { counters: {}, completed: {} });
    await act(async () => {
      screen = create(
        <ThemeProvider>
          <TrophyShelf achievements={empty} earnedOnly onSelect={jest.fn()} />
        </ThemeProvider>
      );
    });
    expect(screen.root.findAllByType(TrophyArt)).toHaveLength(0);
    expect(screen.root.findAllByType(PressableScale)).toHaveLength(0);
    expect(
      screen.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('primeiro objetivo'))
    ).toBe(true);
  });
  it('na sala mantém os objetivos bloqueados visíveis e acessíveis', async () => {
    await act(async () => {
      screen = create(
        <ThemeProvider>
          <TrophyShelf achievements={room} onSelect={jest.fn()} />
        </ThemeProvider>
      );
    });
    expect(screen.root.findAllByType(PressableScale)).toHaveLength(TROPHY_GOALS.length);
    expect(screen.root.findAllByType(TrophyArt).some((art) => art.props.locked)).toBe(true);
    expect(
      screen.root
        .findAllByType(PressableScale)
        .find((piece) => piece.props.accessibilityLabel.startsWith('Até o fim.'))!.props.accessibilityLabel
    ).toContain('A conquistar');
  });
});
