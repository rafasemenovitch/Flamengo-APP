import type { User } from '@supabase/supabase-js';

import type { PersonalDetails } from '@/features/auth/profileForm';
import type { FanProfile } from '@/types/fan';
import type { ProfileService } from '@/services/adapters';
import { getSupabase, requireSupabase } from './client';

interface ProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  cpf: string;
  birth_date: string;
  gender: FanProfile['gender'];
  fan_since: number;
  contact: Partial<
    Pick<FanProfile, 'phone' | 'cep' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state'>
  >;
  preferences: Partial<Pick<FanProfile, 'favoritePlayerIds' | 'interests' | 'notifications' | 'privacy'>>;
}

export const defaultNotifications: FanProfile['notifications'] = {
  goals: true,
  matchStart: true,
  matchEnd: true,
  lineups: true,
  news: false,
  tickets: true,
  store: false,
};

export function profileFromRow(row: ProfileRow, email: string): FanProfile {
  return {
    id: row.id,
    name: `${row.first_name} ${row.last_name}`,
    firstName: row.display_name || row.first_name.split(' ')[0] || row.first_name,
    email,
    cpf: row.cpf,
    birthDate: row.birth_date,
    gender: row.gender,
    fanSince: row.fan_since,
    phone: row.contact.phone ?? '',
    cep: row.contact.cep ?? '',
    street: row.contact.street ?? '',
    number: row.contact.number ?? '',
    complement: row.contact.complement ?? '',
    neighborhood: row.contact.neighborhood ?? '',
    city: row.contact.city ?? '',
    state: row.contact.state ?? '',
    favoritePlayerIds: row.preferences.favoritePlayerIds ?? [],
    interests: row.preferences.interests ?? [],
    notifications: { ...defaultNotifications, ...row.preferences.notifications },
    privacy: {
      showInRankings: false,
      shareCity: false,
      personalizedContent: true,
      ...row.preferences.privacy,
    },
  };
}

export async function loadFanProfile(user: User): Promise<FanProfile | null> {
  const { data, error } = await requireSupabase()
    .from('fan_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? profileFromRow(data as ProfileRow, user.email ?? '') : null;
}

export async function createFanProfile(user: User, details: PersonalDetails): Promise<FanProfile> {
  const { data, error } = await requireSupabase()
    .from('fan_profiles')
    .insert({
      id: user.id,
      first_name: details.givenName,
      last_name: details.surname,
      display_name: details.givenName.split(' ')[0],
      cpf: details.cpf,
      birth_date: details.birthDate,
      gender: details.gender,
      fan_since: details.fanSince,
    })
    .select()
    .single();
  if (error?.code === '23505') {
    const existing = await loadFanProfile(user);
    if (existing) return existing;
  }
  if (error) throw error;
  return profileFromRow(data as ProfileRow, user.email ?? '');
}

export async function updateFanProfile(
  user: User,
  patch: Partial<Omit<FanProfile, 'id'>>
): Promise<FanProfile> {
  // Nunca confiar num id enviado pelo formulário. O usuário vem da sessão atual.
  const current = await loadFanProfile(user);
  if (!current) throw new Error('PROFILE_INCOMPLETE');
  const next = { ...current, ...patch };
  const [first, ...last] = next.name.trim().split(/\s+/);
  const { data, error } = await requireSupabase()
    .from('fan_profiles')
    .update({
      first_name: first,
      last_name: last.join(' '),
      display_name: next.firstName.trim() || first,
      cpf: next.cpf.replace(/\D/g, ''),
      birth_date: next.birthDate,
      gender: next.gender,
      fan_since: next.fanSince,
      contact: {
        phone: next.phone,
        cep: next.cep,
        street: next.street,
        number: next.number,
        complement: next.complement,
        neighborhood: next.neighborhood,
        city: next.city,
        state: next.state,
      },
      preferences: {
        favoritePlayerIds: next.favoritePlayerIds,
        interests: next.interests,
        notifications: next.notifications,
        privacy: next.privacy,
      },
    })
    .eq('id', user.id)
    .select()
    .single();
  if (error) throw error;
  return profileFromRow(data as ProfileRow, user.email ?? '');
}

/** O assistente e qualquer outro leitor de services.profile também respeitam a conta. */
export function withAccountProfile(demo: ProfileService): ProfileService {
  const currentUser = async () => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.user ?? null;
  };
  return {
    ...demo,
    async getProfile() {
      const user = await currentUser();
      if (!user) return demo.getProfile();
      const profile = await loadFanProfile(user);
      if (!profile) throw new Error('PROFILE_INCOMPLETE');
      return profile;
    },
    async updateProfile(patch) {
      const user = await currentUser();
      return user ? updateFanProfile(user, patch) : demo.updateProfile(patch);
    },
  };
}
