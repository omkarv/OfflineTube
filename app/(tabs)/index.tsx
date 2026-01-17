import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator, Pressable } from 'react-native';
import { useStations } from '@/src/hooks/useStations';
import { useOfflineStatus } from '@/src/hooks/useOfflineStatus';
import { useSync } from '@/src/hooks/useSync';
import { useFavorites } from '@/src/hooks/useFavorites';
import { StationCard } from '@/src/components/StationCard';
import { SearchInput } from '@/src/components/SearchInput';
import { OfflineBanner } from '@/src/components/OfflineBanner';
import Station from '@/src/models/Station';

export default function StationsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { stations, loading, error } = useStations({ searchQuery });
  const { isOffline } = useOfflineStatus();
  const { isSyncing, lastSyncAt, needsSync, sync, error: syncError } = useSync();
  const { isStationFavorite, toggleFavoriteStation } = useFavorites();

  const renderItem = ({ item }: { item: Station }) => (
    <StationCard
      station={item}
      isFavorite={isStationFavorite(item.id)}
      onToggleFavorite={toggleFavoriteStation}
    />
  );

  const renderEmpty = () => {
    if (loading || isSyncing) return null;

    if (needsSync || stations.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🚇</Text>
          <Text style={styles.emptyText}>No stations yet</Text>
          <Text style={styles.emptySubtext}>
            {isOffline
              ? 'Connect to the internet to download station data'
              : 'Tap below to download station data'}
          </Text>
          {!isOffline && (
            <Pressable style={styles.syncButton} onPress={sync}>
              <Text style={styles.syncButtonText}>Download Stations</Text>
            </Pressable>
          )}
          {syncError && <Text style={styles.syncError}>{syncError}</Text>}
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {searchQuery ? 'No stations found' : 'No stations available'}
        </Text>
        <Text style={styles.emptySubtext}>
          {searchQuery ? 'Try a different search term' : 'Pull down to refresh'}
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

  const isLoading = loading || isSyncing;

  return (
    <View style={styles.container}>
      {isOffline && <OfflineBanner lastSyncAt={lastSyncAt} />}
      <SearchInput value={searchQuery} onChangeText={setSearchQuery} />
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6b4c35" />
          <Text style={styles.loadingText}>
            {isSyncing ? 'Downloading stations...' : 'Loading stations...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={stations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={stations.length === 0 ? styles.emptyList : undefined}
          extraData={isStationFavorite}
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
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
    maxWidth: 280,
  },
  emptyList: {
    flex: 1,
  },
  syncButton: {
    marginTop: 20,
    backgroundColor: '#6b4c35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  syncError: {
    marginTop: 12,
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
  },
});
