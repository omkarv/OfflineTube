import React from 'react';
import { View, Text, StyleSheet, Switch, Pressable, ScrollView } from 'react-native';
import { getPreferences, setPreferences, getLastSyncAt } from '@/src/storage/mmkv';
import { useOfflineStatus } from '@/src/hooks/useOfflineStatus';

export default function SettingsScreen() {
  const { isOnline } = useOfflineStatus();
  const prefs = getPreferences();
  const lastSyncAt = getLastSyncAt();
  const [syncWifiOnly, setSyncWifiOnly] = React.useState(prefs.syncWifiOnly);

  const handleSyncWifiToggle = (value: boolean) => {
    setSyncWifiOnly(value);
    setPreferences({ syncWifiOnly: value });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync</Text>
        <View style={styles.row}>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Sync on WiFi only</Text>
            <Text style={styles.rowSubtitle}>Save mobile data by only syncing when on WiFi</Text>
          </View>
          <Switch
            value={syncWifiOnly}
            onValueChange={handleSyncWifiToggle}
            trackColor={{ true: '#6b4c35' }}
          />
        </View>
        <View style={styles.row}>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Last sync</Text>
            <Text style={styles.rowSubtitle}>{formatDate(lastSyncAt)}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Connection status</Text>
            <Text style={[styles.rowSubtitle, isOnline ? styles.online : styles.offline]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Tube Coffee</Text>
          <Text style={styles.rowSubtitle}>Version 1.0.0</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowSubtitle}>
            Find great coffee shops near London tube stations, even when you're offline.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  rowSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  online: {
    color: '#4caf50',
  },
  offline: {
    color: '#ff9800',
  },
});
