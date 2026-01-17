import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Station from '../models/Station';
import { TubeLineInfo } from '../hooks/useTubeLines';
import { TUBE_LINE_COLORS, getTextColorForLine } from '../constants/tubeLines';

interface StationCardProps {
  station: Station;
  lines?: TubeLineInfo[];
  isFavorite?: boolean;
  onToggleFavorite?: (stationId: string) => void;
}

export function StationCard({ station, lines = [], isFavorite = false, onToggleFavorite }: StationCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/station/${station.id}`);
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    onToggleFavorite?.(station.id);
  };

  const renderLineBadges = () => {
    if (lines.length === 0) return null;
    // Deduplicate lines by tflId (same line can appear multiple times due to branches)
    const uniqueLines = lines.filter(
      (line, index, self) => self.findIndex((l) => l.tflId === line.tflId) === index
    );
    return (
      <View style={styles.linesContainer}>
        {uniqueLines.map((line) => {
          const bgColor = line.color || TUBE_LINE_COLORS[line.tflId] || '#666';
          const textColor = getTextColorForLine(line.tflId);
          return (
            <View
              key={line.tflId}
              style={[styles.lineBadge, { backgroundColor: bgColor }]}
            >
              <Text style={[styles.lineText, { color: textColor }]} numberOfLines={1}>
                {line.name}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}
    >
      <View style={styles.content}>
        <Text style={styles.name}>{station.name}</Text>
        {renderLineBadges()}
        <View style={styles.meta}>
          <View style={styles.zoneBadge}>
            <Text style={styles.zoneText}>Zone {station.zone}</Text>
          </View>
          {station.stepFreeAccess && station.stepFreeAccess !== 'none' && (
            <View style={styles.accessibleBadge}>
              <Text style={styles.accessibleIcon}>♿</Text>
              <Text style={styles.accessibleText}>
                {station.stepFreeAccess === 'full' ? 'Step-free' : 'Partial'}
              </Text>
            </View>
          )}
          {station.wifiAvailable && (
            <View style={styles.wifiBadge}>
              <Text style={styles.wifiText}>WiFi</Text>
            </View>
          )}
        </View>
      </View>
      {onToggleFavorite && (
        <Pressable onPress={handleFavoritePress} style={styles.favoriteButton}>
          <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
        </Pressable>
      )}
      <Text style={styles.chevron}>{'>'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  pressed: {
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  linesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  lineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  lineText: {
    fontSize: 11,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoneBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  zoneText: {
    fontSize: 12,
    color: '#666',
  },
  accessibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  accessibleIcon: {
    fontSize: 11,
  },
  accessibleText: {
    fontSize: 12,
    color: '#2e7d32',
  },
  wifiBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  wifiText: {
    fontSize: 12,
    color: '#1976d2',
  },
  favoriteButton: {
    padding: 8,
    marginRight: 4,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  chevron: {
    fontSize: 20,
    color: '#999',
    marginLeft: 4,
  },
});
