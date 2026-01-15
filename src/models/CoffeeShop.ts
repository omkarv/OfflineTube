import { Model } from '@nozbe/watermelondb';
import { field, date, relation, json } from '@nozbe/watermelondb/decorators';

export interface OpeningHours {
  weekdayText: string[];
  isOpenNow?: boolean;
  periods?: {
    open: { day: number; time: string };
    close: { day: number; time: string };
  }[];
}

const sanitizeOpeningHours = (raw: any): OpeningHours | null => {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
};

export default class CoffeeShop extends Model {
  static table = 'coffee_shops';
  static associations = {
    stations: { type: 'belongs_to' as const, key: 'station_id' },
  };

  @field('google_place_id') googlePlaceId!: string;
  @field('station_id') stationId!: string;
  @field('name') name!: string;
  @field('address') address!: string;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('distance_meters') distanceMeters!: number;
  @field('rating') rating?: number;
  @field('rating_count') ratingCount?: number;
  @field('price_level') priceLevel?: number;
  @json('opening_hours', sanitizeOpeningHours) openingHours?: OpeningHours | null;
  @field('photo_reference') photoReference?: string;
  @field('has_wifi') hasWifi?: boolean;
  @field('has_seating') hasSeating?: boolean;
  @field('website') website?: string;
  @field('phone') phone?: string;
  @date('last_refreshed') lastRefreshed!: Date;
  @field('needs_refresh') needsRefresh!: boolean;

  @relation('stations', 'station_id') station!: any;
}
