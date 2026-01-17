import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useLineStations, useAllTubeLines, StationOnLine } from '@/src/hooks/useTubeLines';
import { useFavorites } from '@/src/hooks/useFavorites';
import { getTextColorForLine } from '@/src/constants/tubeLines';

interface Section {
  title: string;
  data: StationOnLine[];
}

export default function LineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { stations, branches, loading } = useLineStations(id);
  const { lines } = useAllTubeLines();
  const { isStationFavorite, toggleFavoriteStation } = useFavorites();

  const line = lines.find((l) => l.id === id);

  // Group stations by branch if there are multiple branches
  const sections: Section[] = useMemo(() => {
    if (branches.length <= 1) {
      // Single branch or no branch info - show as one list
      return [{ title: 'All Stations', data: stations }];
    }

    // Multiple branches - group by branch
    const branchMap = new Map<string, StationOnLine[]>();

    stations.forEach((s) => {
      const branch = s.branch || 'Main';
      const existing = branchMap.get(branch) || [];
      existing.push(s);
      branchMap.set(branch, existing);
    });

    return Array.from(branchMap.entries())
      .map(([title, data]) => ({ title, data }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [stations, branches]);

  const handleStationPress = (stationId: string) => {
    router.push(`/station/${stationId}`);
  };

  const renderItem = ({ item, index }: { item: StationOnLine; index: number }) => {
    const isFavorite = isStationFavorite(item.station.id);

    return (
      <Pressable
        style={({ pressed }) => [styles.stationRow, pressed && styles.pressed]}
        onPress={() => handleStationPress(item.station.id)}
      >
        <View style={styles.sequenceContainer}>
          <View style={[styles.line, { backgroundColor: line?.color || '#666' }]} />
          <View style={[styles.dot, { backgroundColor: line?.color || '#666' }]} />
          {index < stations.length - 1 && (
            <View style={[styles.lineBelow, { backgroundColor: line?.color || '#666' }]} />
          )}
        </View>
        <View style={styles.stationContent}>
          <Text style={styles.stationName}>{item.station.name}</Text>
          <View style={styles.stationMeta}>
            <Text style={styles.zoneText}>Zone {item.station.zone}</Text>
            {item.station.stepFreeAccess && item.station.stepFreeAccess !== 'none' && (
              <Text style={styles.accessibleBadge}>♿</Text>
            )}
          </View>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            toggleFavoriteStation(item.station.id);
          }}
          style={styles.favoriteButton}
        >
          <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
        </Pressable>
        <Text style={styles.chevron}>{'>'}</Text>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: Section }) => {
    if (branches.length <= 1) return null;

    return (
      <View style={styles.sectionHeader}>
        <View style={[styles.branchIndicator, { backgroundColor: line?.color || '#666' }]} />
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length} stations</Text>
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

  if (!line) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Error' }} />
        <Text style={styles.errorText}>Line not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: line.name,
          headerStyle: { backgroundColor: line.color },
          headerTintColor: getTextColorForLine(line.tflId),
        }}
      />

      <View style={[styles.header, { backgroundColor: line.color }]}>
        <Text style={[styles.headerTitle, { color: getTextColorForLine(line.tflId) }]}>
          {line.name} Line
        </Text>
        <Text style={[styles.headerSubtitle, { color: getTextColorForLine(line.tflId) }]}>
          {stations.length} stations
          {branches.length > 1 ? ` • ${branches.length} branches` : ''}
        </Text>
      </View>

      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.station.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
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
    padding: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  branchIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  sectionCount: {
    fontSize: 13,
    color: '#666',
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    backgroundColor: '#fff',
  },
  pressed: {
    backgroundColor: '#f5f5f5',
  },
  sequenceContainer: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },
  line: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: '50%',
  },
  lineBelow: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: '50%',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 1,
  },
  stationContent: {
    flex: 1,
    paddingVertical: 16,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  stationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoneText: {
    fontSize: 13,
    color: '#666',
  },
  accessibleBadge: {
    fontSize: 12,
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteIcon: {
    fontSize: 18,
  },
  chevron: {
    fontSize: 18,
    color: '#999',
    marginLeft: 4,
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
  },
});
