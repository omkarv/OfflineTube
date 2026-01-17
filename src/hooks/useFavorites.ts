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
    setFavoriteStations((prev) => {
      const isCurrentlyFavorite = prev.includes(stationId);
      const updated = isCurrentlyFavorite
        ? prev.filter((id) => id !== stationId)
        : [...prev, stationId];
      setPreferences({ favoriteStations: updated });
      return updated;
    });
  }, []);

  const toggleFavoriteCoffeeShop = useCallback((placeId: string) => {
    setFavoriteCoffeeShops((prev) => {
      const isCurrentlyFavorite = prev.includes(placeId);
      const updated = isCurrentlyFavorite
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId];
      setPreferences({ favoriteCoffeeShops: updated });
      return updated;
    });
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
