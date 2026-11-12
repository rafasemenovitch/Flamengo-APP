import type { PoiCategory } from '@/services/stadium/types';
import lightStyle from '../../../map/styles/maracana-light.json';

/** Cor de cada categoria: a mesma do mapa (vem do estilo, não é repetida aqui). */
export const CATEGORY_COLOR = (lightStyle.metadata as { 'fla:poi': Record<PoiCategory, string> })['fla:poi'];

export const CATEGORY: Record<PoiCategory, { label: string }> = {
  banheiro: { label: 'Banheiro' },
  banheiro_acessivel: { label: 'Banheiro acessível' },
  alimentacao: { label: 'Comida' },
  bebidas: { label: 'Bebidas' },
  loja: { label: 'Loja' },
  elevador: { label: 'Elevador' },
  escada_rolante: { label: 'Escada rolante' },
  escada: { label: 'Escada' },
  posto_medico: { label: 'Posto médico' },
  informacao: { label: 'Informação' },
  sala_sensorial: { label: 'Sala sensorial' },
  bilheteria: { label: 'Ingressos' },
  estacionamento: { label: 'Estacionamento' },
  saida_emergencia: { label: 'Saída' },
  seguranca: { label: 'Segurança' },
  juizado: { label: 'Juizado do Torcedor' },
  acolhimento: { label: 'Acolhimento à mulher' },
};

/** Atalhos da folha inferior; `icon` é o pictograma (o mesmo do mapa) que representa o grupo. */
export const GROUPS: {
  key: string;
  label: string;
  /** Título da lista filtrada. */
  near: string;
  icon: PoiCategory;
  categories: PoiCategory[];
}[] = [
  {
    key: 'banheiros',
    near: 'Banheiros mais perto',
    label: 'Banheiros',
    icon: 'banheiro',
    categories: ['banheiro', 'banheiro_acessivel'],
  },
  {
    key: 'comer',
    near: 'Onde comer mais perto',
    label: 'Comer',
    icon: 'alimentacao',
    categories: ['alimentacao', 'bebidas'],
  },
  {
    key: 'saude',
    near: 'Atendimento médico mais perto',
    label: 'Saúde',
    icon: 'posto_medico',
    categories: ['posto_medico'],
  },
  {
    key: 'acessivel',
    near: 'Acessibilidade mais perto',
    label: 'Acessível',
    icon: 'banheiro_acessivel',
    categories: ['banheiro_acessivel', 'elevador', 'sala_sensorial', 'informacao'],
  },
  {
    key: 'lojas',
    near: 'Lojas mais perto',
    label: 'Lojas',
    icon: 'loja',
    categories: ['loja', 'bilheteria'],
  },
  {
    key: 'saidas',
    near: 'Saídas mais perto',
    label: 'Saídas',
    icon: 'saida_emergencia',
    categories: ['saida_emergencia'],
  },
  {
    key: 'ajuda',
    near: 'Onde pedir ajuda',
    label: 'Ajuda',
    icon: 'seguranca',
    categories: ['seguranca', 'juizado', 'acolhimento', 'informacao'],
  },
];

export const ALL_CATEGORIES = Object.keys(CATEGORY) as PoiCategory[];
