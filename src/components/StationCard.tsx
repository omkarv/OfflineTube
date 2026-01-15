import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Station from '../models/Station';

interface StationCardProps {
  station: Station;
}

export function StationCard({ station }: StationCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/station/${station.id}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}
    >
      <View style={styles.content}>
        <Text style={styles.name}>{station.name}</Text>
        <View style={styles.meta}>
          <View style={styles.zoneBadge}>
            <Text style={styles.zoneText}>Zone {station.zone}</Text>
          </View>
          {station.wifiAvailable && (
            <View style={styles.wifiBadge}>
              <Text style={styles.wifiText}>WiFi</Text>
            </View>
          )}
        </View>
      </View>
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
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
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
  chevron: {
    fontSize: 20,
    color: '#999',
    marginLeft: 8,
  },
});
