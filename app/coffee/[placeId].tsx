import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useCoffeeShop } from '@/src/hooks/useCoffeeShops';
import { formatDistance } from '@/src/utils/distance';

export default function CoffeeShopDetailScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const { coffeeShop, loading, error } = useCoffeeShop(placeId);

  const openMaps = () => {
    if (!coffeeShop) return;
    const url = `https://maps.apple.com/?q=${encodeURIComponent(coffeeShop.name)}&ll=${coffeeShop.latitude},${coffeeShop.longitude}`;
    Linking.openURL(url);
  };

  const openWebsite = () => {
    if (coffeeShop?.website) {
      Linking.openURL(coffeeShop.website);
    }
  };

  const callPhone = () => {
    if (coffeeShop?.phone) {
      Linking.openURL(`tel:${coffeeShop.phone}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <ActivityIndicator size="large" color="#6b4c35" />
      </View>
    );
  }

  if (error || !coffeeShop) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Error' }} />
        <Text style={styles.errorText}>Coffee shop not found</Text>
      </View>
    );
  }

  const renderRating = () => {
    if (!coffeeShop.rating) return null;
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingValue}>{coffeeShop.rating.toFixed(1)}</Text>
        <Text style={styles.ratingStar}>★</Text>
        {coffeeShop.ratingCount && (
          <Text style={styles.ratingCount}>({coffeeShop.ratingCount} reviews)</Text>
        )}
      </View>
    );
  };

  const renderPriceLevel = () => {
    if (coffeeShop.priceLevel === undefined || coffeeShop.priceLevel === null) return null;
    const filled = coffeeShop.priceLevel || 1;
    const empty = 4 - filled;
    return (
      <View style={styles.priceContainer}>
        <Text style={styles.priceFilled}>{'£'.repeat(filled)}</Text>
        <Text style={styles.priceEmpty}>{'£'.repeat(empty)}</Text>
      </View>
    );
  };

  const renderOpeningHours = () => {
    if (!coffeeShop.openingHours?.weekdayText) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Opening Hours</Text>
        {coffeeShop.openingHours.weekdayText.map((day, index) => (
          <Text key={index} style={styles.hoursText}>
            {day}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: coffeeShop.name }} />

      <View style={styles.header}>
        <Text style={styles.name}>{coffeeShop.name}</Text>
        <View style={styles.metaRow}>
          {renderRating()}
          {renderPriceLevel()}
        </View>
        <Text style={styles.distance}>{formatDistance(coffeeShop.distanceMeters)} from station</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        <Pressable onPress={openMaps}>
          <Text style={styles.address}>{coffeeShop.address}</Text>
          <Text style={styles.linkText}>Open in Maps</Text>
        </Pressable>
      </View>

      {(coffeeShop.hasWifi !== null || coffeeShop.hasSeating !== null) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesRow}>
            {coffeeShop.hasWifi && (
              <View style={styles.amenityBadge}>
                <Text style={styles.amenityText}>📶 WiFi</Text>
              </View>
            )}
            {coffeeShop.hasSeating && (
              <View style={styles.amenityBadge}>
                <Text style={styles.amenityText}>🪑 Seating</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {renderOpeningHours()}

      {(coffeeShop.website || coffeeShop.phone) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {coffeeShop.website && (
            <Pressable onPress={openWebsite} style={styles.contactRow}>
              <Text style={styles.linkText}>Visit website</Text>
            </Pressable>
          )}
          {coffeeShop.phone && (
            <Pressable onPress={callPhone} style={styles.contactRow}>
              <Text style={styles.phone}>{coffeeShop.phone}</Text>
              <Text style={styles.linkText}>Call</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Data from Google Places • Last updated{' '}
          {coffeeShop.lastRefreshed?.toLocaleDateString('en-GB') || 'Unknown'}
        </Text>
      </View>
    </ScrollView>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  ratingStar: {
    fontSize: 18,
    color: '#ffc107',
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
  },
  priceFilled: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: '600',
  },
  priceEmpty: {
    fontSize: 16,
    color: '#e0e0e0',
    fontWeight: '600',
  },
  distance: {
    fontSize: 15,
    color: '#6b4c35',
    fontWeight: '500',
  },
  section: {
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  linkText: {
    fontSize: 14,
    color: '#1976d2',
    marginTop: 4,
  },
  amenitiesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  amenityBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#666',
  },
  hoursText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 24,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  phone: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
  },
});
