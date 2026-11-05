import type { Stadium } from '@/types/stadium';

/**
 * Maracanã ESQUEMÁTICO: setores, portões e serviços posicionados num
 * desenho próprio (viewBox 0–100). Não é planta oficial.
 */
export const STADIUM: Stadium = {
  id: 'maracana',
  name: 'Maracanã',
  nickname: 'Templo do Futebol',
  capacity: 78_000,
  address: 'Av. Pres. Castelo Branco, Portão 3 — Maracanã, Rio de Janeiro',
  sectors: [
    { id: 'norte', name: 'Norte', arc: [315, 45], ring: 'lower' },
    { id: 'leste-inf', name: 'Leste Inferior', arc: [45, 135], ring: 'lower' },
    { id: 'leste-sup', name: 'Leste Superior', arc: [45, 135], ring: 'upper' },
    { id: 'sul', name: 'Sul', arc: [135, 225], ring: 'lower' },
    { id: 'oeste-inf', name: 'Oeste Inferior', arc: [225, 315], ring: 'lower' },
    { id: 'oeste-sup', name: 'Oeste Superior', arc: [225, 315], ring: 'upper' },
    { id: 'visitante', name: 'Visitante', arc: [160, 200], ring: 'upper' },
  ],
  gates: [
    { id: 'A', label: 'Portão A', sectorIds: ['norte'], x: 50, y: 3, accessible: true },
    { id: 'B', label: 'Portão B', sectorIds: ['visitante'], x: 25, y: 92, accessible: false },
    { id: 'C', label: 'Portão C', sectorIds: ['leste-inf', 'leste-sup'], x: 97, y: 50, accessible: true },
    { id: 'E', label: 'Portão E', sectorIds: ['sul'], x: 50, y: 97, accessible: true },
    { id: 'F', label: 'Portão F', sectorIds: ['oeste-inf', 'oeste-sup'], x: 3, y: 50, accessible: true },
  ],
  facilities: [
    { id: 'wc1', type: 'restroom', label: 'Banheiros Norte', x: 35, y: 12, nearSectorIds: ['norte'] },
    { id: 'wc2', type: 'restroom', label: 'Banheiros Leste', x: 88, y: 35, nearSectorIds: ['leste-inf', 'leste-sup'] },
    { id: 'wc3', type: 'restroom', label: 'Banheiros Sul', x: 65, y: 88, nearSectorIds: ['sul'] },
    { id: 'wc4', type: 'restroom', label: 'Banheiros Oeste', x: 12, y: 65, nearSectorIds: ['oeste-inf', 'oeste-sup'] },
    { id: 'fd1', type: 'food', label: 'Bar Norte', x: 65, y: 12, nearSectorIds: ['norte'] },
    { id: 'fd2', type: 'food', label: 'Bar Leste', x: 88, y: 65, nearSectorIds: ['leste-inf', 'leste-sup'] },
    { id: 'fd3', type: 'food', label: 'Bar Sul', x: 35, y: 88, nearSectorIds: ['sul'] },
    { id: 'fd4', type: 'food', label: 'Bar Oeste', x: 12, y: 35, nearSectorIds: ['oeste-inf', 'oeste-sup'] },
    { id: 'st1', type: 'store', label: 'Loja oficial', x: 80, y: 18, nearSectorIds: ['norte', 'leste-inf'] },
    { id: 'fa1', type: 'first-aid', label: 'Posto médico', x: 20, y: 18, nearSectorIds: ['norte', 'oeste-inf'] },
    { id: 'ac1', type: 'accessibility', label: 'Acesso PcD', x: 80, y: 82, nearSectorIds: ['sul', 'leste-inf'] },
  ],
  transport: [
    { id: 't1', mode: 'metro', title: 'Metrô — Estação Maracanã', details: 'Linha 2. Saída pela passarela direto para o estádio.', walkMinutes: 6 },
    { id: 't2', mode: 'train', title: 'Trem — Estação Maracanã', details: 'Ramais Deodoro, Santa Cruz e Japeri.', walkMinutes: 8 },
    { id: 't3', mode: 'metro', title: 'Metrô — Estação São Cristóvão', details: 'Alternativa com menos fila na saída.', walkMinutes: 14 },
    { id: 't4', mode: 'bus', title: 'Ônibus', details: 'Linhas com parada na Av. Radial Oeste e Rua São Francisco Xavier.', walkMinutes: 5 },
    { id: 't5', mode: 'app', title: 'Transporte por app', details: 'Ponto de embarque e desembarque na Rua Eurico Rabelo.', walkMinutes: 7 },
  ],
  parking: [
    { id: 'pk1', name: 'Estacionamento credenciado (demo)', distance: '400 m do Portão A', price: 'R$ 60,00', note: 'Reserva antecipada pelo app — simulado' },
    { id: 'pk2', name: 'Estacionamento UERJ (demo)', distance: '700 m do Portão F', price: 'R$ 50,00' },
  ],
};

/** Esperas simuladas por portão (minutos) em dia de jogo. */
export const GATE_QUEUES: Record<string, number> = { A: 18, B: 6, C: 9, E: 14, F: 7 };

export const MATCH_DAY_NOTICES = [
  'Portões abrem 2h30 antes do jogo.',
  'Leve documento com foto e o ingresso no app.',
  'Não é permitida a entrada com guarda-chuva, objetos de vidro ou sinalizadores.',
];
