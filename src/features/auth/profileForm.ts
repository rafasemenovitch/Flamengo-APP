import type { Gender } from '@/types/fan';

export interface PersonalDetails {
  givenName: string;
  surname: string;
  cpf: string;
  birthDate: string;
  gender: Gender;
  fanSince: number;
}

export interface PersonalForm extends Omit<PersonalDetails, 'fanSince'> {
  fanSince: string;
}
export const emptyPersonalForm: PersonalForm = {
  givenName: '',
  surname: '',
  cpf: '',
  birthDate: '',
  gender: 'nao-informar',
  fanSince: '',
};
export const GENDERS: [Gender, string][] = [
  ['masculino', 'Masculino'],
  ['feminino', 'Feminino'],
  ['outro', 'Outro'],
  ['nao-informar', 'Prefiro não dizer'],
];
export const digits = (value: string) => value.replace(/\D/g, '');
export const maskCpf = (value: string) =>
  digits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
export const maskDate = (value: string) =>
  digits(value)
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');

export function validCpf(value: string) {
  const cpf = digits(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;
  for (const length of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    const remainder = (sum * 10) % 11;
    if ((remainder === 10 ? 0 : remainder) !== Number(cpf[length])) return false;
  }
  return true;
}

/** Valida sem aceitar o rollover de datas como 31/02 nem deslocar o fuso. */
export function birthDateToIso(value: string, today = new Date()) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return '';
  const [day = 0, month = 0, year = 0] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  if (year < 1900 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
    return '';
  if (date > today) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function personalFormErrors(form: PersonalForm, today = new Date()) {
  const errors: Partial<Record<keyof PersonalForm, string>> = {};
  if (!form.givenName.trim()) errors.givenName = 'Informe seu nome.';
  if (!form.surname.trim()) errors.surname = 'Informe seu sobrenome.';
  if (!validCpf(form.cpf)) errors.cpf = 'Informe um CPF válido.';
  const birthDate = birthDateToIso(form.birthDate, today);
  if (!birthDate) errors.birthDate = 'Informe uma data de nascimento válida (DD/MM/AAAA).';
  if (!GENDERS.some(([gender]) => gender === form.gender))
    errors.gender = 'Escolha uma das opções de gênero.';
  const year = Number(form.fanSince);
  if (
    !/^\d{4}$/.test(form.fanSince) ||
    year > today.getFullYear() ||
    year < 1900 ||
    (birthDate && year < Number(birthDate.slice(0, 4)))
  ) {
    errors.fanSince = 'Informe um ano entre seu nascimento e o ano atual.';
  }
  return errors;
}

export function parsePersonalForm(form: PersonalForm): PersonalDetails {
  if (Object.keys(personalFormErrors(form)).length) throw new Error('INVALID_PROFILE');
  return {
    ...form,
    givenName: form.givenName.trim(),
    surname: form.surname.trim(),
    cpf: digits(form.cpf),
    birthDate: birthDateToIso(form.birthDate),
    fanSince: Number(form.fanSince),
  };
}
