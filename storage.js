import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY = '@dateInvite/selections';

export async function loadInvite() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveInvite(data) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function clearInvite() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
