import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = '@dateInvite/selections';

export function storageKeyFor(inviteId) {
  return inviteId ? `${BASE}:${inviteId}` : BASE;
}

export async function loadInvite(inviteId) {
  const raw = await AsyncStorage.getItem(storageKeyFor(inviteId));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveInvite(inviteId, data) {
  await AsyncStorage.setItem(storageKeyFor(inviteId), JSON.stringify(data));
}

export async function clearInvite(inviteId) {
  await AsyncStorage.removeItem(storageKeyFor(inviteId));
}
