import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import CoffeeShop from '../models/CoffeeShop';

export function useCoffeeShops(stationId: string) {
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCoffeeShops = async () => {
      if (!stationId) {
        setCoffeeShops([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const coffeeShopsCollection = database.get<CoffeeShop>('coffee_shops');
        const results = await coffeeShopsCollection
          .query(Q.where('station_id', stationId))
          .fetch();

        // Sort by distance
        results.sort((a, b) => a.distanceMeters - b.distanceMeters);

        setCoffeeShops(results);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch coffee shops'));
      } finally {
        setLoading(false);
      }
    };

    fetchCoffeeShops();
  }, [stationId]);

  return { coffeeShops, loading, error };
}

export function useCoffeeShop(placeId: string) {
  const [coffeeShop, setCoffeeShop] = useState<CoffeeShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCoffeeShop = async () => {
      if (!placeId) {
        setCoffeeShop(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const coffeeShopsCollection = database.get<CoffeeShop>('coffee_shops');
        const results = await coffeeShopsCollection
          .query(Q.where('google_place_id', placeId))
          .fetch();

        setCoffeeShop(results[0] || null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch coffee shop'));
      } finally {
        setLoading(false);
      }
    };

    fetchCoffeeShop();
  }, [placeId]);

  return { coffeeShop, loading, error };
}
