import { useState, useEffect, useCallback } from 'react';
import { getPreferences, setPreferences } from '../storage/mmkv';

export function useFavorites() {
  const [favoriteStations, setFavoriteStations] = useState<string[]>([]);
  const [favoriteCoffeeShops, setFavoriteCoffeeShops] = useState<string[]>([]);

  useEffect(() => {
    const prefs = getPreferences();
    setFavoriteStations(prefs.favoriteStations);
    setFavoriteCoffeeShops(prefs.favoriteCoffeeShops);
  }, []);

  const toggleFavoriteStation = useCallback((stationId: string) => {
    // Read directly from storage to avoid stale state across multiple hook instances
    const current = getPreferences().favoriteStations;
    const isCurrentlyFavorite = current.includes(stationId);
    const updated = isCurrentlyFavorite
      ? current.filter((id) => id !== stationId)
      : [...current, stationId];
    setPreferences({ favoriteStations: updated });
    setFavoriteStations(updated);
  }, []);

  const toggleFavoriteCoffeeShop = useCallback((placeId: string) => {
    // Read directly from storage to avoid stale state across multiple hook instances
    const current = getPreferences().favoriteCoffeeShops;
    const isCurrentlyFavorite = current.includes(placeId);
    const updated = isCurrentlyFavorite
      ? current.filter((id) => id !== placeId)
      : [...current, placeId];
    setPreferences({ favoriteCoffeeShops: updated });
    setFavoriteCoffeeShops(updated);
  }, []);

  const isStationFavorite = useCallback(
    (stationId: string) => favoriteStations.includes(stationId),
    [favoriteStations]
  );

  const isCoffeeShopFavorite = useCallback(
    (placeId: string) => favoriteCoffeeShops.includes(placeId),
    [favoriteCoffeeShops]
  );

  return {
    favoriteStations,
    favoriteCoffeeShops,
    toggleFavoriteStation,
    toggleFavoriteCoffeeShop,
    isStationFavorite,
    isCoffeeShopFavorite,
  };
}
