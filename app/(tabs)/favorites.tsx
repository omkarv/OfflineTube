import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator } from 'react-native';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/src/database';
import { useFavorites } from '@/src/hooks/useFavorites';
import { useStationsLines } from '@/src/hooks/useTubeLines';
import { StationCard } from '@/src/components/StationCard';
import { CoffeeShopCard } from '@/src/components/CoffeeShopCard';
import Station from '@/src/models/Station';
import CoffeeShop from '@/src/models/CoffeeShop';

type SectionItem = Station | CoffeeShop;

interface Section {
  title: string;
  data: SectionItem[];
  type: 'station' | 'coffee-header' | 'coffee';
  stationId?: string;
}

export default function FavoritesScreen() {
  const {
    favoriteStations,
    favoriteCoffeeShops,
    toggleFavoriteStation,
    toggleFavoriteCoffeeShop,
    isStationFavorite,
    isCoffeeShopFavorite,
  } = useFavorites();

  const [stations, setStations] = useState<Station[]>([]);
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([]);
  const [coffeeShopStations, setCoffeeShopStations] = useState<Map<string, Station>>(new Map());
  const [loading, setLoading] = useState(true);

  // Get tube lines for favorite stations
  const stationIds = useMemo(() => stations.map((s) => s.id), [stations]);
  const { linesMap } = useStationsLines(stationIds);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        // Fetch favorite stations
        if (favoriteStations.length > 0) {
          const stationsCollection = database.get<Station>('stations');
          const results = await stationsCollection
            .query(Q.where('id', Q.oneOf(favoriteStations)))
            .fetch();
          setStations(results);
        } else {
          setStations([]);
        }

        // Fetch favorite coffee shops
        if (favoriteCoffeeShops.length > 0) {
          const coffeeShopsCollection = database.get<CoffeeShop>('coffee_shops');
          const results = await coffeeShopsCollection
            .query(Q.where('google_place_id', Q.oneOf(favoriteCoffeeShops)))
            .fetch();
          setCoffeeShops(results);

          // Fetch stations for the coffee shops
          const stationIdsForCoffee = [...new Set(results.map((cs) => cs.stationId))];
          if (stationIdsForCoffee.length > 0) {
            const stationsCollection = database.get<Station>('stations');
            const stationResults = await stationsCollection
              .query(Q.where('id', Q.oneOf(stationIdsForCoffee)))
              .fetch();
            const stationMap = new Map<string, Station>();
            stationResults.forEach((s) => stationMap.set(s.id, s));
            setCoffeeShopStations(stationMap);
          }
        } else {
          setCoffeeShops([]);
          setCoffeeShopStations(new Map());
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [favoriteStations, favoriteCoffeeShops]);

  // Build sections with coffee shops grouped by station
  const sections: Section[] = useMemo(() => {
    const result: Section[] = [];

    // Add favorite stations section
    if (stations.length > 0) {
      result.push({ title: 'Stations', data: stations, type: 'station' });
    }

    // Group coffee shops by station
    if (coffeeShops.length > 0) {
      const coffeeByStation = new Map<string, CoffeeShop[]>();

      coffeeShops.forEach((shop) => {
        const existing = coffeeByStation.get(shop.stationId) || [];
        existing.push(shop);
        coffeeByStation.set(shop.stationId, existing);
      });

      // Sort stations by name and add as sections
      const sortedStationIds = [...coffeeByStation.keys()].sort((a, b) => {
        const stationA = coffeeShopStations.get(a);
        const stationB = coffeeShopStations.get(b);
        return (stationA?.name || '').localeCompare(stationB?.name || '');
      });

      // Add a header for coffee shops
      if (sortedStationIds.length > 0) {
        // Use first station's coffee shops as data for the header section
        // We'll render the header differently
        result.push({
          title: 'Coffee Shops',
          data: [], // Empty - this is just a header
          type: 'coffee-header',
        });
      }

      sortedStationIds.forEach((stationId) => {
        const station = coffeeShopStations.get(stationId);
        const shops = coffeeByStation.get(stationId) || [];

        // Sort shops by distance
        shops.sort((a, b) => a.distanceMeters - b.distanceMeters);

        result.push({
          title: station?.name || 'Unknown Station',
          data: shops,
          type: 'coffee',
          stationId,
        });
      });
    }

    return result;
  }, [stations, coffeeShops, coffeeShopStations]);

  const renderItem = ({ item, section }: { item: SectionItem; section: Section }) => {
    if (section.type === 'station') {
      const station = item as Station;
      return (
        <StationCard
          station={station}
          lines={linesMap.get(station.id) || []}
          isFavorite={isStationFavorite(station.id)}
          onToggleFavorite={toggleFavoriteStation}
        />
      );
    }
    if (section.type === 'coffee') {
      return (
        <CoffeeShopCard
          coffeeShop={item as CoffeeShop}
          isFavorite={isCoffeeShopFavorite((item as CoffeeShop).googlePlaceId)}
          onToggleFavorite={toggleFavoriteCoffeeShop}
        />
      );
    }
    return null;
  };

  const renderSectionHeader = ({ section }: { section: Section }) => {
    if (section.type === 'station') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionCount}>{section.data.length}</Text>
        </View>
      );
    }
    if (section.type === 'coffee-header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Coffee Shops</Text>
          <Text style={styles.sectionCount}>{coffeeShops.length}</Text>
        </View>
      );
    }
    // Coffee shop station sub-header
    return (
      <View style={styles.subSectionHeader}>
        <Text style={styles.subSectionTitle}>{section.title}</Text>
        <Text style={styles.subSectionCount}>{section.data.length}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6b4c35" />
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>❤️</Text>
        <Text style={styles.emptyTitle}>No favorites yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap the heart icon on a station or coffee shop to add it to your favorites
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item, index) => {
          if ('naptanId' in item) return (item as Station).id;
          return (item as CoffeeShop).googlePlaceId;
        }}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: 280,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 14,
    color: '#999',
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b4c35',
  },
  subSectionCount: {
    fontSize: 13,
    color: '#999',
  },
});
