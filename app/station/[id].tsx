import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useStation } from '@/src/hooks/useStations';
import { useCoffeeShops } from '@/src/hooks/useCoffeeShops';
import { useFavorites } from '@/src/hooks/useFavorites';
import { CoffeeShopCard } from '@/src/components/CoffeeShopCard';
import CoffeeShop from '@/src/models/CoffeeShop';

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { station, loading: stationLoading, error: stationError } = useStation(id);
  const { coffeeShops, loading: shopsLoading, error: shopsError } = useCoffeeShops(id);
  const { isCoffeeShopFavorite, toggleFavoriteCoffeeShop } = useFavorites();

  const loading = stationLoading || shopsLoading;
  const error = stationError || shopsError;

  const renderItem = ({ item }: { item: CoffeeShop }) => (
    <CoffeeShopCard
      coffeeShop={item}
      isFavorite={isCoffeeShopFavorite(item.googlePlaceId)}
      onToggleFavorite={toggleFavoriteCoffeeShop}
    />
  );

  const renderHeader = () => {
    if (!station) return null;
    return (
      <View style={styles.header}>
        <View style={styles.stationInfo}>
          <View style={styles.zoneBadge}>
            <Text style={styles.zoneText}>Zone {station.zone}</Text>
          </View>
          {station.wifiAvailable && (
            <View style={styles.wifiBadge}>
              <Text style={styles.wifiText}>Station WiFi Available</Text>
            </View>
          )}
        </View>
        <Text style={styles.coffeeCount}>
          {coffeeShops.length} coffee shop{coffeeShops.length !== 1 ? 's' : ''} nearby
        </Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>☕</Text>
        <Text style={styles.emptyText}>No coffee shops found</Text>
        <Text style={styles.emptySubtext}>
          We couldn't find any coffee shops near this station
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <ActivityIndicator size="large" color="#6b4c35" />
      </View>
    );
  }

  if (error || !station) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Error' }} />
        <Text style={styles.errorText}>Station not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: station.name }} />
      <FlatList
        data={coffeeShops}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={coffeeShops.length === 0 ? styles.emptyList : undefined}
        extraData={isCoffeeShopFavorite}
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
  header: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  stationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  zoneBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  zoneText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  wifiBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  wifiText: {
    fontSize: 13,
    color: '#1976d2',
  },
  coffeeCount: {
    fontSize: 15,
    color: '#6b4c35',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptyList: {
    flex: 1,
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
  },
});
