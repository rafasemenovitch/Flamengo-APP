import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Image, ScrollView } from 'react-native';

import { PressableScale, ThemeProvider } from '@/design-system';
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
  it('no perfil desenha as taças e só o estágio atual das medalhas conquistadas', async () => {
    const select = jest.fn();
    await act(async () => {
      screen = create(
        <ThemeProvider>
          <TrophyShelf achievements={room} profilePreview onSelect={select} />
        </ThemeProvider>
      );
    });
    const pieces = screen.root.findAllByType(PressableScale);
    expect(pieces).toHaveLength(15);
    const presence = pieces.find((piece) => piece.props.accessibilityLabel.startsWith('Sempre presente.'))!;
    expect(presence.props.accessibilityLabel).toContain('Medalha de prata.');
    expect(
      pieces.some((piece) => piece.props.accessibilityLabel.includes('Manto Sagrado. Medalha de ouro.'))
    ).toBe(true);
    const art = screen.root.findAllByType(TrophyArt);
    expect(
      art.filter((piece) => piece.props.award.kind === 'trophy').every((piece) => piece.props.locked)
    ).toBe(true);
    const medals = art.filter((piece) => piece.props.award.kind === 'medal');
    expect(medals).toHaveLength(10);
    expect(medals.every((piece) => piece.props.hanging)).toBe(true);
    expect(medals.filter((piece) => piece.props.locked)).toHaveLength(8);
    expect(screen.root.findAllByType(ScrollView)).toHaveLength(0);
    expect(screen.root.findAllByType(Image)).toHaveLength(15);
    await act(async () => {
      presence.props.onPress();
    });
    expect(select).toHaveBeenCalledWith('sempre-presente');
  });
  it('sem conquistas mostra cinco taças e dez medalhas penduradas bloqueadas', async () => {
    const empty = resolveTrophyRoom(TROPHY_GOALS, { counters: {}, completed: {} });
    await act(async () => {
      screen = create(
        <ThemeProvider>
          <TrophyShelf achievements={empty} profilePreview onSelect={jest.fn()} />
        </ThemeProvider>
      );
    });
    const art = screen.root.findAllByType(TrophyArt);
    expect(art).toHaveLength(15);
    expect(art.every((piece) => piece.props.locked)).toBe(true);
    expect(art.filter((piece) => piece.props.hanging && piece.props.award.kind === 'medal')).toHaveLength(10);
    expect(
      screen.root
        .findAllByType(PressableScale)
        .every((piece) => piece.props.accessibilityLabel.includes('A conquistar'))
    ).toBe(true);
  });
  it('atualiza a mesma taça no perfil e na sala quando o momento especial é conquistado', async () => {
    const select = jest.fn();
    const unlocked = resolveTrophyRoom(TROPHY_GOALS, { counters: {}, completed: { 'ate-o-fim': {} } });
    const empty = resolveTrophyRoom(TROPHY_GOALS, { counters: {}, completed: {} });
    const render = (goals: typeof room, profilePreview: boolean) => (
      <ThemeProvider>
        <TrophyShelf achievements={goals} profilePreview={profilePreview} onSelect={select} />
      </ThemeProvider>
    );
    await act(async () => {
      screen = create(render(empty, true));
    });
    await act(async () => {
      screen.update(render(unlocked, true));
    });
    const cup = screen.root
      .findAllByType(PressableScale)
      .find((piece) => piece.props.accessibilityLabel.startsWith('Até o fim.'))!;
    const award = cup.findByType(TrophyArt).props.award;
    expect(cup.findByType(TrophyArt).props.locked).toBe(false);
    expect(screen.root.findAllByType(TrophyArt).filter((piece) => !piece.props.locked)).toHaveLength(1);
    await act(async () => {
      cup.props.onPress();
    });
    expect(select).toHaveBeenCalledWith('ate-o-fim');
    await act(async () => {
      screen.update(render(unlocked, false));
    });
    const roomCup = screen.root
      .findAllByType(PressableScale)
      .find((piece) => piece.props.accessibilityLabel.startsWith('Até o fim.'))!;
    expect(roomCup.findByType(TrophyArt).props.locked).toBe(false);
    expect(roomCup.findByType(TrophyArt).props.award).toEqual(award);
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
