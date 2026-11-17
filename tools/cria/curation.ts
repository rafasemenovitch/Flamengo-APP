/**
 * Curadoria manual da base do Quem é o Cria?: o que nenhuma fonte dá pronto.
 *
 * - `pos`: a posição em que o jogador mais atuou PELO FLAMENGO, numa das 6 do jogo.
 * - `diff`: dificuldade como resposta (facil = ídolo óbvio; dificil = só quem conhece a história).
 * - `aka`: apelidos e grafias que a torcida usa na busca (o nome completo vem da Wikipédia).
 * - `nat`: nacionalidade esportiva quando a infobox não traz ou traz mais de uma.
 *
 * Números (jogos, gols, ano, títulos) NUNCA ficam aqui: vêm das fontes (wikipedia.ts e press.ts).
 */
import type { CriaPosition } from '../../src/data/cria/types';

type Diff = 'facil' | 'medio' | 'dificil';

export interface Curation {
  pos: CriaPosition;
  diff: Diff;
  aka?: string[];
  nat?: string;
  /** Ainda no elenco (números mudam a cada jogo). */
  active?: boolean;
  note?: string;
}

const G: CriaPosition = 'Goleiro';
const Z: CriaPosition = 'Zagueiro';
const L: CriaPosition = 'Lateral';
const V: CriaPosition = 'Volante';
const M: CriaPosition = 'Meia';
const A: CriaPosition = 'Atacante';

const k = (pos: CriaPosition, diff: Diff, aka: string[] = [], extra: Partial<Curation> = {}): Curation => ({
  pos,
  diff,
  aka,
  ...extra,
});

export const CURATION: Record<string, Curation> = {
  // Anos 1930–1940
  leonidas: k(A, 'medio', ['Diamante Negro', 'Homem de Borracha']),
  'domingos-da-guia': k(Z, 'medio', ['Divino Mestre']),
  zizinho: k(M, 'medio', ['Mestre Ziza']),
  pirillo: k(A, 'dificil', ['Sylvio Pirillo']),
  fausto: k(V, 'dificil', ['Maravilha Negra']),
  bria: k(V, 'dificil', ['Bría'], { nat: 'PRY' }),
  peracio: k(A, 'dificil'),
  'jayme-de-almeida': k(Z, 'dificil', ['Jayme', 'Jayme de Almeida Filho'], { nat: 'BRA' }),
  veve: k(A, 'dificil'),
  // Anos 1950
  dida: k(A, 'medio'),
  'henrique-frade': k(A, 'dificil', ['Henrique']),
  evaristo: k(A, 'dificil', ['Evaristo']),
  rubens: k(M, 'dificil', ['Doutor Rúbis']),
  joel: k(A, 'dificil'),
  zagallo: k(A, 'medio', ['Lobo', 'Velho Lobo', 'Mário Jorge Lobo Zagallo'], { nat: 'BRA' }),
  jordan: k(L, 'dificil', [], { note: 'Lance! chama de zagueiro; a Wikipédia, de volante. Era lateral-esquerdo na linha de 3 da época.' }),
  jadir: k(V, 'dificil'),
  dequinha: k(V, 'dificil'),
  indio: k(A, 'dificil'),
  moacir: k(M, 'dificil'),
  // Anos 1960
  'gerson-canhotinha': k(M, 'medio', ['Canhotinha de Ouro', 'Papagaio']),
  carlinhos: k(M, 'dificil', ['Violino', 'Carlinhos Violino']),
  'silva-batuta': k(A, 'dificil', ['Silva'], { nat: 'BRA' }),
  almir: k(A, 'dificil', ['Almir'], { nat: 'BRA' }),
  'paulo-henrique': k(L, 'dificil'),
  fio: k(A, 'medio', ['Fio']),
  doval: k(A, 'dificil', ['Narciso Doval', 'Gringo'], { nat: 'ARG' }),
  'rodrigues-neto': k(L, 'dificil'),
  // Anos 1970
  zico: k(M, 'facil', ['Galinho', 'Galinho de Quintino', 'Arthur Antunes Coimbra'], { nat: 'BRA' }),
  junior: k(L, 'facil', ['Capacete', 'Maestro']),
  adilio: k(M, 'facil', ['Brown']),
  andrade: k(V, 'medio', ['Tromba']),
  cantarele: k(G, 'medio', ['Cantareli']),
  leandro: k(L, 'facil', ['Peixe-Frito']),
  raul: k(G, 'medio', ['Raul Plassmann']),
  rondinelli: k(Z, 'medio', ['Deus da Raça']),
  manguito: k(Z, 'dificil'),
  carpegiani: k(V, 'medio', ['Paulo César Carpegiani']),
  'claudio-adao': k(A, 'dificil'),
  tita: k(M, 'medio'),
  'luisinho-lemos': k(A, 'dificil', ['Luisinho Tombo']),
  geraldo: k(M, 'dificil', ['Geraldo Assoviador']),
  'paulo-cesar-caju': k(M, 'dificil', ['PC Caju', 'Paulo Cézar Caju']),
  'toninho-baiano': k(L, 'dificil'),
  // Anos 1980
  nunes: k(A, 'medio', ['João Danado', 'Artilheiro das Decisões']),
  mozer: k(Z, 'medio', ['Carlos Mozer']),
  bebeto: k(A, 'facil'),
  'renato-gaucho': k(A, 'facil', ['Renato Portaluppi']),
  leonardo: k(L, 'medio'),
  aldair: k(Z, 'medio'),
  'jorginho-1980': k(L, 'medio', ['Jorge de Amorim Campos']),
  zinho: k(M, 'medio', ['Enceradeira']),
  socrates: k(M, 'medio', ['Doutor', 'Magrão']),
  gaucho: k(A, 'dificil'),
  alcindo: k(A, 'dificil', ['Bugre']),
  uidemar: k(V, 'dificil'),
  // Anos 1990
  'marcelinho-carioca': k(M, 'medio', ['Pé de Anjo']),
  'junior-baiano': k(Z, 'medio'),
  'paulo-nunes': k(A, 'medio'),
  djalminha: k(M, 'medio'),
  'charles-guerreiro': k(L, 'dificil', ['Charles'], { nat: 'BRA' }),
  'gilmar-rinaldi': k(G, 'dificil', ['Gilmar'], { nat: 'BRA' }),
  romario: k(A, 'facil', ['Baixinho']),
  savio: k(A, 'medio', ['Anjo Loiro'], { nat: 'BRA' }),
  edmundo: k(A, 'medio', ['Animal']),
  'ze-roberto': k(M, 'dificil', [], { nat: 'BRA' }),
  clemer: k(G, 'dificil'),
  // Anos 2000
  petkovic: k(M, 'facil', ['Pet', 'Petkovic', 'Dejan Petković']),
  edilson: k(A, 'medio', ['Capetinha']),
  juan: k(Z, 'medio', [], { nat: 'BRA' }),
  athirson: k(L, 'dificil'),
  'julio-cesar': k(G, 'medio'),
  felipe: k(M, 'dificil', ['Felipe Maestro']),
  obina: k(A, 'medio', ['Obina Mito']),
  'renato-augusto': k(M, 'medio'),
  ibson: k(M, 'medio'),
  'leo-moura': k(L, 'facil', ['Leonardo Moura']),
  'fabio-luciano': k(Z, 'dificil'),
  'ronaldo-angelim': k(Z, 'medio', ['Angelim']),
  kleberson: k(V, 'dificil'),
  adriano: k(A, 'facil', ['Imperador', 'Didico']),
  'vagner-love': k(A, 'medio', ['Love']),
  toro: k(V, 'dificil'),
  'juninho-paulista': k(M, 'dificil', ['Juninho']),
  williams: k(V, 'dificil'),
  'diego-tardelli': k(A, 'dificil', ['Tardelli']),
  // Anos 2010
  ronaldinho: k(M, 'medio', ['Ronaldinho Gaúcho', 'R10', 'Bruxo']),
  'thiago-neves': k(M, 'dificil'),
  deivid: k(A, 'dificil'),
  hernane: k(A, 'medio', ['Brocador']),
  elias: k(V, 'dificil'),
  'paulo-victor': k(G, 'dificil', ['PV'], { nat: 'BRA' }),
  'andre-santos': k(L, 'dificil'),
  'everton-2014': k(A, 'medio', ['Everton']),
  guerrero: k(A, 'medio', ['Paolo Guerrero', 'Predador']),
  mancuello: k(M, 'dificil', [], { nat: 'ARG' }),
  rever: k(Z, 'dificil'),
  diego: k(M, 'medio', ['Diego Ribas'], { nat: 'BRA' }),
  'juan-2016': k(L, 'dificil', ['Juan Maldonado'], { nat: 'BRA', note: 'Lateral de 2006–2010, homônimo do zagueiro Juan.' }),
  para: k(L, 'dificil'),
  muralha: k(G, 'dificil', ['Muralha']),
  'diego-alves': k(G, 'facil', [], { nat: 'BRA' }),
  cuellar: k(V, 'medio', ['Gustavo Cuéllar']),
  'everton-ribeiro': k(M, 'facil', ['Éverton Ribeiro', 'ER7']),
  paqueta: k(M, 'medio', ['Paquetá'], { active: true }),
  'vinicius-junior': k(A, 'medio', ['Vini Jr', 'Vini', 'Vinicius'], { nat: 'BRA' }),
  vizeu: k(A, 'dificil', ['Vizeu']),
  rodinei: k(L, 'medio'),
  'willian-arao': k(V, 'medio', ['Arão']),
  'rodrigo-caio': k(Z, 'medio', [], { nat: 'BRA' }),
  'pablo-mari': k(Z, 'medio', ['Marí']),
  rafinha: k(L, 'medio'),
  'filipe-luis': k(L, 'facil', ['Filipe'], { nat: 'BRA' }),
  reinier: k(M, 'dificil'),
  // Anos 2020 e elenco atual
  gabigol: k(A, 'facil', ['Gabriel Barbosa', 'Gabigol', 'Gabi']),
  'bruno-henrique': k(A, 'facil', ['BH'], { active: true }),
  arrascaeta: k(M, 'facil', ['Arrasca', 'De Arrascaeta'], { active: true }),
  gerson: k(M, 'medio', ['Coringa']),
  pedro: k(A, 'facil', [], { active: true }),
  michael: k(A, 'medio'),
  'david-luiz': k(Z, 'medio', [], { nat: 'BRA' }),
  'thiago-maia': k(V, 'medio', [], { nat: 'BRA' }),
  santos: k(G, 'dificil'),
  'matheus-cunha': k(G, 'dificil', [], { active: true }),
  'fabricio-bruno': k(Z, 'medio'),
  'everton-cebolinha': k(A, 'medio', ['Cebolinha']),
  'ayrton-lucas': k(L, 'medio', [], { active: true }),
  'leo-pereira': k(Z, 'medio', [], { active: true }),
  rossi: k(G, 'medio', ['Agustín Rossi'], { active: true }),
  varela: k(L, 'medio', ['Guillermo Varela'], { nat: 'URY', active: true }),
  pulgar: k(V, 'medio', ['Erick Pulgar'], { active: true }),
  'de-la-cruz': k(M, 'medio', ['Nico de la Cruz'], { nat: 'URY', active: true }),
  'luiz-araujo': k(A, 'medio', [], { active: true }),
  plata: k(A, 'medio', ['Gonzalo Plata'], { nat: 'ECU', active: true }),
  'leo-ortiz': k(Z, 'medio', [], { nat: 'BRA', active: true }),
  'alex-sandro': k(L, 'medio', [], { active: true }),
  danilo: k(Z, 'medio', [], { active: true }),
  'jorginho-2025': k(V, 'medio', ['Jorge Luiz Frello Filho'], { nat: 'ITA', active: true }),
  saul: k(M, 'medio', ['Saúl Ñíguez'], { active: true }),
  'samuel-lino': k(A, 'medio', [], { active: true }),
  carrascal: k(M, 'medio', ['Jorge Carrascal'], { active: true }),
  wesley: k(L, 'dificil'),
  allan: k(V, 'dificil', [], { active: true }),
  vina: k(L, 'dificil', ['Matías Viña'], { nat: 'URY', active: true }),
  // Mais de 100 jogos (List of CR Flamengo players)
  'renato-abreu': k(M, 'medio', []),
  'vitinho': k(A, 'medio', []),
  'matheuzinho': k(L, 'medio', []),
  'joao-gomes': k(V, 'medio', []),
  'marcio-araujo': k(V, 'medio', []),
  'gabriel-2013': k(A, 'dificil', ['Gabriel Pinto']),
  'paulinho': k(A, 'dificil', []),
  'wallace': k(Z, 'dificil', ['Wallace Reis']),
  'iranildo': k(M, 'dificil', []),
  'beto': k(M, 'medio', []),
  'liminha': k(M, 'dificil', ['João Crevelim']),
  'murilo': k(L, 'dificil', []),
  'fabinho': k(V, 'dificil', []),
  'ze-carlos': k(G, 'medio', []),
  'ailton': k(V, 'dificil', ['Ailton Ferraz']),
  'fabio-baiano': k(M, 'dificil', []),
  'marquinhos': k(M, 'dificil', []),
  'leandro-machado': k(A, 'dificil', []),
  'lucio-bala': k(A, 'dificil', ['Lúcio']),
  'luiz-alberto': k(Z, 'dificil', []),
  'gilberto': k(L, 'dificil', []),
  'alessandro': k(L, 'dificil', []),
  'jonatas': k(M, 'dificil', []),
  'welinton': k(Z, 'dificil', []),
  'luiz-antonio': k(V, 'dificil', []),
  'dionisio': k(A, 'dificil', []),
  'caio-cambalhota': k(A, 'dificil', ['Caio']),
  'lico': k(A, 'medio', []),
  'uri-geller': k(A, 'dificil', ['Uri Geller', 'Júlio César']),
  'adalberto': k(Z, 'dificil', []),
  'victor-hugo': k(M, 'dificil', []),
  'airton-beleza': k(A, 'dificil', ['Airton']),
  'reyes': k(Z, 'dificil', ['Francisco Reyes'], { nat: 'ARG' }),
  'andrezinho': k(A, 'dificil', []),
  'maurinho': k(L, 'dificil', []),
  'david-braz': k(Z, 'dificil', []),
  'gilmar-popoca': k(M, 'dificil', ['Popoca']),
};
