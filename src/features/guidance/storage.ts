import AsyncStorage from '@react-native-async-storage/async-storage';

export type GuidanceStatus = 'seen' | 'completed' | 'dismissed';
const shownThisRun = new Set<string>();

export function guidanceKey(owner: string, resource: string) {
  return `@flamengo/guidance-v1/${owner}/${resource}`;
}

/** A marca local nunca altera perfil, preferências ou progresso do torcedor. */
export async function claimFirstVisit(owner: string, resource: string) {
  const key = guidanceKey(owner, resource);
  const saved = await AsyncStorage.getItem(key).catch(() => null);
  if (saved || shownThisRun.has(key)) return false;
  shownThisRun.add(key);
  await AsyncStorage.setItem(key, 'seen').catch(() => undefined);
  return true;
}

export function recordGuidance(owner: string, resource: string, status: GuidanceStatus) {
  return AsyncStorage.setItem(guidanceKey(owner, resource), status).catch(() => undefined);
}
