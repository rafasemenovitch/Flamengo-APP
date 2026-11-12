import {
  birthDateToIso,
  emptyPersonalForm,
  parsePersonalForm,
  personalFormErrors,
  validCpf,
} from '@/features/auth/profileForm';
import { profileFromRow } from '@/services/supabase/profiles';
jest.mock('@/services/supabase/client', () => ({ getSupabase: () => null, requireSupabase: jest.fn() }));

const today = new Date(2026, 10, 11);
const form = {
  ...emptyPersonalForm,
  givenName: ' Rodrigo ',
  surname: ' Teste ',
  cpf: '529.982.247-25',
  birthDate: '01/01/1990',
  fanSince: '2000',
};

describe('dados pessoais de cada torcedor', () => {
  it('valida os dois dígitos do CPF e rejeita sequências repetidas', () => {
    expect(validCpf('529.982.247-25')).toBe(true);
    expect(validCpf('11144477735')).toBe(true);
    expect(validCpf('52998224724')).toBe(false);
    expect(validCpf('11111111111')).toBe(false);
  });

  it('rejeita datas inexistentes, futuras e anos anteriores a 1900', () => {
    expect(birthDateToIso('29/02/2000', today)).toBe('2000-02-29');
    for (const date of ['29/02/2001', '31/04/1990', '12/11/2026', '01/01/1899', '1990-01-01']) {
      expect(birthDateToIso(date, today)).toBe('');
    }
  });

  it('exige nome, sobrenome e um ano de torcida coerente com o nascimento', () => {
    expect(personalFormErrors(form, today)).toEqual({});
    expect(personalFormErrors({ ...form, surname: '', fanSince: '1980' }, today)).toHaveProperty('surname');
    expect(personalFormErrors({ ...form, fanSince: '1980' }, today)).toHaveProperty('fanSince');
    expect(personalFormErrors({ ...form, fanSince: '2027' }, today)).toHaveProperty('fanSince');
  });

  it('preserva prefiro não dizer e normaliza os dados para salvar', () => {
    expect(parsePersonalForm(form)).toMatchObject({
      givenName: 'Rodrigo',
      surname: 'Teste',
      cpf: '52998224725',
      birthDate: '1990-01-01',
      gender: 'nao-informar',
      fanSince: 2000,
    });
  });

  it('monta a identidade pela conta sem herdar dados do perfil demo', () => {
    const base = {
      id: 'a',
      first_name: 'Rodrigo',
      last_name: 'Teste',
      display_name: 'Rodrigo',
      cpf: '52998224725',
      birth_date: '1990-01-01',
      gender: 'masculino' as const,
      fan_since: 2000,
      contact: {},
      preferences: {},
    };
    const rodrigo = profileFromRow(base, 'rodrigo@exemplo.com');
    const marina = profileFromRow(
      { ...base, id: 'b', first_name: 'Marina', display_name: 'Marina', fan_since: 2010 },
      'marina@exemplo.com'
    );
    expect(rodrigo.firstName).toBe('Rodrigo');
    expect(marina.name).toBe('Marina Teste');
    expect(marina.fanSince).toBe(2010);
    expect(rodrigo.favoritePlayerIds).toEqual([]);
    expect(rodrigo.city).toBe('');
    expect(marina.email).toBe('marina@exemplo.com');
  });
});
