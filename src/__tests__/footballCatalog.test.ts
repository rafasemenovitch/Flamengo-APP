import { CLUB, SQUAD, TEAMS } from '@/data/demo/seed';
import {
  __setCatalogForTests,
  findSquadPlayer,
  fullSquad,
  matchTeamLogos,
  playerPhoto,
  teamLogo,
} from '@/state/football';

const api = [
  'Flamengo',
  'Vasco DA Gama',
  'Sao Paulo',
  'Gremio',
  'Atletico-MG',
  'Atletico Paranaense',
  'RB Bragantino',
  'Fortaleza EC',
  'Racing Club',
  'Internacional',
  'Penarol',
  'Talleres Cordoba',
].map((name) => ({ name, logo: `https://x/${name}.png` }));

describe('dados reais de futebol no app', () => {
  afterEach(() => __setCatalogForTests(null));

  it('liga cada time do app ao escudo certo', () => {
    const logos = matchTeamLogos([CLUB, ...Object.values(TEAMS)], api);
    expect(logos.get('fla')).toContain('Flamengo');
    expect(logos.get('vas')).toContain('Vasco');
    expect(logos.get('sao')).toContain('Sao Paulo');
    expect(logos.get('gre')).toContain('Gremio');
    expect(logos.get('cam')).toContain('Atletico-MG');
    expect(logos.get('cap')).toContain('Paranaense');
    expect(logos.get('rbb')).toContain('Bragantino');
    expect(logos.get('for')).toContain('Fortaleza');
    expect(logos.get('rac')).toContain('Racing');
    expect(logos.get('pen')).toContain('Penarol');
    expect(logos.get('tal')).toContain('Talleres');
    // "Nacional" não pode pegar o escudo do Internacional.
    expect(logos.get('nac')).toBeUndefined();
    expect(logos.get('int')).toContain('Internacional');
  });

  it('aplica perfil e foto ao elenco e inclui quem mais está no elenco atual', () => {
    const arrascaeta = SQUAD.find((p) => p.apiId === 2612)!;
    __setCatalogForTests({
      savedAt: 0,
      teams: [{ id: 127, name: 'Flamengo', logo: 'https://x/fla.png' }],
      squad: [
        {
          id: 2612,
          name: 'G. de Arrascaeta',
          firstname: 'Giorgian',
          lastname: 'De Arrascaeta Benedetti',
          number: 10,
          position: 'Midfielder',
          photo: 'https://x/2612-recorte.png',
          birthDate: '1994-06-01',
          nationality: 'Uruguay',
          heightCm: 172,
        },
        {
          id: 1646,
          name: 'Lucas Paquetá',
          firstname: 'Lucas',
          lastname: 'Tolentino Coelho de Lima',
          number: 11,
          position: 'Midfielder',
          photo: 'https://x/1646-recorte.png',
          birthDate: null,
          nationality: 'Brazil',
          heightCm: null,
        },
      ],
    });
    expect(teamLogo('fla')).toBe('https://x/fla.png');
    expect(arrascaeta.nationality).toBe('Uruguai');
    expect(arrascaeta.heightCm).toBe(172);
    expect(playerPhoto(arrascaeta)).toBe('https://x/2612-recorte.png');
    const paqueta = findSquadPlayer('api-1646')!;
    expect(paqueta).toMatchObject({
      shortName: 'Lucas Paquetá',
      number: 11,
      position: 'Meia',
      nationality: 'Brasil',
    });
    expect(paqueta.preferredFoot).toBeUndefined();
    expect(fullSquad()).toHaveLength(SQUAD.length + 1);
  });

  it('sem catálogo, sem foto nem escudo: placeholders', () => {
    expect(teamLogo('pal')).toBeUndefined();
    expect(playerPhoto(SQUAD[0])).toBeUndefined();
  });
});
