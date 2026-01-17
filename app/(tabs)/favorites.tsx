import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator } from 'react-native';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/src/database';
import { useFavorites } from '@/src/hooks/useFavorites';
import { StationCard } from '@/src/components/StationCard';
import { CoffeeShopCard } from '@/src/components/CoffeeShopCard';
import Station from '@/src/models/Station';
import CoffeeShop from '@/src/models/CoffeeShop';

type SectionItem = Station | CoffeeShop;

interface Section {
  title: string;
  data: SectionItem[];
  type: 'station' | 'coffee';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        if (favoriteStations.length > 0) {
          const stationsCollection = database.get<Station>('stations');
          const results = await stationsCollection
            .query(Q.where('id', Q.oneOf(favoriteStations)))
            .fetch();
          setStations(results);
        } else {
          setStations([]);
        }

        if (favoriteCoffeeShops.length > 0) {
          const coffeeShopsCollection = database.get<CoffeeShop>('coffee_shops');
          const results = await coffeeShopsCollection
            .query(Q.where('google_place_id', Q.oneOf(favoriteCoffeeShops)))
            .fetch();
          setCoffeeShops(results);
        } else {
          setCoffeeShops([]);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [favoriteStations, favoriteCoffeeShops]);

  const sections: Section[] = [];
  if (stations.length > 0) {
    sections.push({ title: 'Stations', data: stations, type: 'station' });
  }
  if (coffeeShops.length > 0) {
    sections.push({ title: 'Coffee Shops', data: coffeeShops, type: 'coffee' });
  }

  const renderItem = ({ item, section }: { item: SectionItem; section: Section }) => {
    if (section.type === 'station') {
      return (
        <StationCard
          station={item as Station}
          isFavorite={isStationFavorite((item as Station).id)}
          onToggleFavorite={toggleFavoriteStation}
        />
      );
    }
    return (
      <CoffeeShopCard
        coffeeShop={item as CoffeeShop}
        isFavorite={isCoffeeShopFavorite((item as CoffeeShop).googlePlaceId)}
        onToggleFavorite={toggleFavoriteCoffeeShop}
      />
    );
  };

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length}</Text>
    </View>
  );

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
});
