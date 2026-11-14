import { Children, type ReactNode } from 'react';
import { Text as RNText } from 'react-native';

/**
 * CORREÇÃO ÓTICA DAS MAIÚSCULAS DA ANYBODY (regra fixa do projeto, ver CLAUDE.md).
 *
 * Na Anybody as minúsculas são altíssimas: a maiúscula para em 1350 unidades e
 * o "l" sobe até 1570 (medido em todas as instâncias de assets/fonts). Em
 * palavras com maiúscula + minúsculas ("Flamengo", "Palmeiras") a inicial fica
 * mais baixa que as hastes ao lado e a palavra parece "afundar".
 *
 * Correção: dentro de palavras que também têm minúsculas, cada maiúscula é
 * ampliada até a altura das hastes (1570 / 1350 ≈ 1,163). Palavras só em
 * maiúsculas ("GOL!", "FLA", códigos) e números ficam como estão. Letra
 * maiúscula sozinha abrindo frase ("O Flamengo", "A fila") é artigo e também é
 * ampliada; no meio da frase ("Portão A") é código e fica como está.
 *
 * Aplicada automaticamente pelo <Text> do design system sempre que a fonte
 * final for uma Anybody, então vale para todas as telas, atuais e futuras.
 */
export const ANYBODY_CAP_SCALE = 1570 / 1350;

export const isAnybody = (fontFamily: unknown) =>
  typeof fontFamily === 'string' && fontFamily.startsWith('Anybody');

export type CapSegment = { text: string; cap: boolean };

/** Divide o texto em trechos normais e maiúsculas a ampliar. */
export function splitCaps(text: string): CapSegment[] {
  const out: CapSegment[] = [];
  const push = (t: string, cap: boolean) => {
    const last = out[out.length - 1];
    if (last && !last.cap && !cap) last.text += t;
    else out.push({ text: t, cap });
  };
  // Palavra = sequência de letras; o resto (espaços, números, sinais) passa direto.
  const parts = text.split(/(\p{L}+)/u);
  parts.forEach((part, i) => {
    if (!part) return;
    const mixed = /\p{Ll}/u.test(part) && /\p{Lu}/u.test(part);
    // Letra maiúscula sozinha abrindo frase ("O Flamengo", "A fila") é artigo: amplia.
    // Fora disso é código ("Portão A", "Bloco C") e fica como está.
    const before = parts.slice(0, i).join('').trimEnd();
    const opensSentence = before === '' || /[.!?:]$/.test(before);
    const nextWord = parts.slice(i + 1).find((p) => /\p{L}/u.test(p));
    const article =
      part.length === 1 && /\p{Lu}/u.test(part) && opensSentence && !!nextWord && /\p{Ll}/u.test(nextWord);
    if (article) {
      push(part, true);
      return;
    }
    if (!mixed) {
      push(part, false);
      return;
    }
    for (const ch of part) push(ch, /\p{Lu}/u.test(ch));
  });
  return out;
}

/** Aplica a correção aos textos (strings) de `children`; elementos aninhados ficam como estão. */
export function withCapCorrection(children: ReactNode, fontSize: number): ReactNode {
  const capStyle = { fontSize: fontSize * ANYBODY_CAP_SCALE };
  const fix = (node: ReactNode, key: number): ReactNode => {
    if (typeof node !== 'string') return node;
    const segments = splitCaps(node);
    if (!segments.some((s) => s.cap)) return node;
    return segments.map((s, i) =>
      s.cap ? (
        <RNText key={`${key}-${i}`} style={capStyle}>
          {s.text}
        </RNText>
      ) : (
        s.text
      )
    );
  };
  const arr = Children.toArray(children);
  if (arr.length === 0) return children;
  return typeof children === 'string' ? fix(children, 0) : arr.map((c, i) => fix(c, i));
}
