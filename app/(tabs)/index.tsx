import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useStations } from '@/src/hooks/useStations';
import { useOfflineStatus } from '@/src/hooks/useOfflineStatus';
import { StationCard } from '@/src/components/StationCard';
import { SearchInput } from '@/src/components/SearchInput';
import { OfflineBanner } from '@/src/components/OfflineBanner';
import { getLastSyncAt } from '@/src/storage/mmkv';
import Station from '@/src/models/Station';

export default function StationsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { stations, loading, error } = useStations({ searchQuery });
  const { isOffline } = useOfflineStatus();
  const lastSyncAt = getLastSyncAt();

  const renderItem = ({ item }: { item: Station }) => <StationCard station={item} />;

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {searchQuery ? 'No stations found' : 'No stations available'}
        </Text>
        <Text style={styles.emptySubtext}>
          {searchQuery
            ? 'Try a different search term'
            : 'Pull down to refresh or check your connection'}
        </Text>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isOffline && <OfflineBanner lastSyncAt={lastSyncAt} />}
      <SearchInput value={searchQuery} onChangeText={setSearchQuery} />
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6b4c35" />
          <Text style={styles.loadingText}>Loading stations...</Text>
        </View>
      ) : (
        <FlatList
          data={stations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={stations.length === 0 ? styles.emptyList : undefined}
        />
      )}
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
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d32f2f',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptyList: {
    flex: 1,
  },
});
