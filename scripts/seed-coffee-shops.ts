/**
 * Coffee Shop Seeding Script
 *
 * Fetches coffee shops near each tube station using Google Places API
 * and inserts them into Supabase.
 *
 * Usage:
 *   npx ts-node scripts/seed-coffee-shops.ts
 *
 * Required env vars:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *   GOOGLE_PLACES_API_KEY
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

const SEARCH_RADIUS_METERS = 300;
const MAX_RESULTS_PER_STATION = 20;
const RATE_LIMIT_DELAY_MS = 150; // ~6 requests per second

interface GooglePlace {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  regularOpeningHours?: {
    weekdayDescriptions: string[];
    periods: any[];
  };
  websiteUri?: string;
  nationalPhoneNumber?: string;
}

interface Station {
  id: string;
  naptan_id: string;
  name: string;
  latitude: number;
  longitude: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parsePriceLevel(priceLevel?: string): number | null {
  if (!priceLevel) return null;
  const map: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return map[priceLevel] ?? null;
}

async function searchNearbyPlaces(lat: number, lon: number): Promise<GooglePlace[]> {
  const url = 'https://places.googleapis.com/v1/places:searchNearby';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.regularOpeningHours,places.websiteUri,places.nationalPhoneNumber',
    },
    body: JSON.stringify({
      includedTypes: ['cafe', 'coffee_shop'],
      maxResultCount: MAX_RESULTS_PER_STATION,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lon },
          radius: SEARCH_RADIUS_METERS,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Places API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.places || [];
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  if (!GOOGLE_PLACES_API_KEY) {
    console.error('Missing GOOGLE_PLACES_API_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Fetch all stations
  console.log('Fetching stations from Supabase...');
  const { data: stations, error: stationsError } = await supabase
    .from('stations')
    .select('id, naptan_id, name, latitude, longitude')
    .order('name');

  if (stationsError || !stations) {
    console.error('Error fetching stations:', stationsError);
    process.exit(1);
  }

  console.log(`Found ${stations.length} stations\n`);

  let totalInserted = 0;
  let totalUpdated = 0;
  let stationsProcessed = 0;

  for (const station of stations as Station[]) {
    stationsProcessed++;
    console.log(`[${stationsProcessed}/${stations.length}] Processing ${station.name}...`);

    try {
      const places = await searchNearbyPlaces(station.latitude, station.longitude);
      console.log(`  Found ${places.length} coffee shops`);

      for (const place of places) {
        const distance = calculateDistance(
          station.latitude,
          station.longitude,
          place.location.latitude,
          place.location.longitude
        );

        const coffeeShopData = {
          google_place_id: place.id,
          station_id: station.id,
          name: place.displayName.text,
          address: place.formattedAddress,
          latitude: place.location.latitude,
          longitude: place.location.longitude,
          distance_meters: Math.round(distance),
          rating: place.rating || null,
          rating_count: place.userRatingCount || null,
          price_level: parsePriceLevel(place.priceLevel),
          opening_hours: place.regularOpeningHours
            ? {
                weekdayText: place.regularOpeningHours.weekdayDescriptions,
                periods: place.regularOpeningHours.periods,
              }
            : null,
          website: place.websiteUri || null,
          phone: place.nationalPhoneNumber || null,
          last_google_refresh: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Check if exists
        const { data: existing } = await supabase
          .from('coffee_shops')
          .select('id')
          .eq('google_place_id', place.id)
          .single();

        if (existing) {
          await supabase.from('coffee_shops').update(coffeeShopData).eq('id', existing.id);
          totalUpdated++;
        } else {
          await supabase.from('coffee_shops').insert(coffeeShopData);
          totalInserted++;
        }
      }
    } catch (error) {
      console.error(`  Error processing ${station.name}:`, error);
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
  }

  console.log(`\nDone!`);
  console.log(`Stations processed: ${stationsProcessed}`);
  console.log(`Coffee shops inserted: ${totalInserted}`);
  console.log(`Coffee shops updated: ${totalUpdated}`);

  // Increment sync version
  await supabase.rpc('increment_sync_version', { entity: 'coffee_shops' });
  console.log('Sync version incremented');
}

main().catch(console.error);
