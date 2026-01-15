import { createMMKV, type MMKV } from 'react-native-mmkv';

let _storage: MMKV | null = null;

const getStorage = (): MMKV => {
  if (!_storage) {
    _storage = createMMKV({ id: 'tube-coffee' });
  }
  return _storage;
};

export const storage = {
  getString: (key: string): string | undefined => getStorage().getString(key),
  set: (key: string, value: string | number | boolean): void => getStorage().set(key, value),
  getNumber: (key: string): number | undefined => getStorage().getNumber(key),
  getBoolean: (key: string): boolean | undefined => getStorage().getBoolean(key),
  remove: (key: string): boolean => getStorage().remove(key),
};

export interface UserPreferences {
  favoriteStations: string[];
  favoriteCoffeeShops: string[];
  preferredLines: string[];
  preferredZones: string[];
  lastViewedStationId: string | null;
  hasCompletedOnboarding: boolean;
  syncWifiOnly: boolean;
  lastAppOpenedAt: string | null;
}

const defaultPreferences: UserPreferences = {
  favoriteStations: [],
  favoriteCoffeeShops: [],
  preferredLines: [],
  preferredZones: [],
  lastViewedStationId: null,
  hasCompletedOnboarding: false,
  syncWifiOnly: false,
  lastAppOpenedAt: null,
};

export const getPreferences = (): UserPreferences => {
  const stored = storage.getString('preferences');
  if (!stored) return defaultPreferences;
  try {
    return { ...defaultPreferences, ...JSON.parse(stored) };
  } catch {
    return defaultPreferences;
  }
};

export const setPreferences = (prefs: Partial<UserPreferences>): void => {
  const current = getPreferences();
  const updated = { ...current, ...prefs };
  storage.set('preferences', JSON.stringify(updated));
};

export const getSyncVersion = (): number => {
  return storage.getNumber('lastSyncVersion') ?? 0;
};

export const setSyncVersion = (version: number): void => {
  storage.set('lastSyncVersion', version);
};

export const getLastSyncAt = (): string | null => {
  return storage.getString('lastSyncAt') ?? null;
};

export const setLastSyncAt = (date: string): void => {
  storage.set('lastSyncAt', date);
};
