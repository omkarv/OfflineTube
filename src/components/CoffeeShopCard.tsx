import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import CoffeeShop from '../models/CoffeeShop';
import { formatDistance } from '../utils/distance';

interface CoffeeShopCardProps {
  coffeeShop: CoffeeShop;
  isFavorite?: boolean;
  onToggleFavorite?: (placeId: string) => void;
}

export function CoffeeShopCard({ coffeeShop, isFavorite = false, onToggleFavorite }: CoffeeShopCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/coffee/${coffeeShop.googlePlaceId}`);
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    onToggleFavorite?.(coffeeShop.googlePlaceId);
  };

  const renderRating = () => {
    if (!coffeeShop.rating) return null;
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingStar}>★</Text>
        <Text style={styles.ratingText}>{coffeeShop.rating.toFixed(1)}</Text>
        {coffeeShop.ratingCount && (
          <Text style={styles.ratingCount}>({coffeeShop.ratingCount})</Text>
        )}
      </View>
    );
  };

  const renderPriceLevel = () => {
    if (coffeeShop.priceLevel === undefined || coffeeShop.priceLevel === null) return null;
    const price = '£'.repeat(coffeeShop.priceLevel || 1);
    return <Text style={styles.priceLevel}>{price}</Text>;
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {coffeeShop.name}
          </Text>
          {renderPriceLevel()}
        </View>

        <Text style={styles.address} numberOfLines={1}>
          {coffeeShop.address}
        </Text>

        <View style={styles.meta}>
          <Text style={styles.distance}>{formatDistance(coffeeShop.distanceMeters)}</Text>
          {renderRating()}
          {coffeeShop.hasWifi && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>WiFi</Text>
            </View>
          )}
          {coffeeShop.hasSeating && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Seating</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  priceLevel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  address: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distance: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b4c35',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingStar: {
    fontSize: 13,
    color: '#ffc107',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  ratingCount: {
    fontSize: 12,
    color: '#888',
  },
  badge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#666',
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
