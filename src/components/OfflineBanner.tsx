import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OfflineBannerProps {
  lastSyncAt?: string | null;
}

export function OfflineBanner({ lastSyncAt }: OfflineBannerProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📶</Text>
      <View style={styles.content}>
        <Text style={styles.title}>You're offline</Text>
        <Text style={styles.subtitle}>
          {lastSyncAt
            ? `Using data from ${formatDate(lastSyncAt)}`
            : 'Showing cached data'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ffcc80',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e65100',
  },
  subtitle: {
    fontSize: 12,
    color: '#f57c00',
    marginTop: 2,
  },
});
