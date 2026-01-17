import { database } from '../database';
import { supabase } from './supabase';
import { setLastSyncAt, setSyncVersion, getSyncVersion } from '../storage/mmkv';
import Station from '../models/Station';
import TubeLine from '../models/TubeLine';
import StationLine from '../models/StationLine';
import CoffeeShop from '../models/CoffeeShop';

interface SyncResult {
  success: boolean;
  stationsCount: number;
  coffeeShopsCount: number;
  error?: string;
}

export async function performInitialSync(): Promise<SyncResult> {
  try {
    console.log('[Sync] Starting initial sync...');

    // Fetch tube lines
    const { data: lines, error: linesError } = await supabase
      .from('tube_lines')
      .select('*');

    if (linesError) throw new Error(`Failed to fetch tube lines: ${linesError.message}`);
    console.log(`[Sync] Fetched ${lines?.length || 0} tube lines`);

    // Fetch stations
    const { data: stations, error: stationsError } = await supabase
      .from('stations')
      .select('*');

    if (stationsError) throw new Error(`Failed to fetch stations: ${stationsError.message}`);
    console.log(`[Sync] Fetched ${stations?.length || 0} stations`);

    // Fetch station-line mappings
    const { data: stationLines, error: slError } = await supabase
      .from('station_lines')
      .select('*');

    if (slError) throw new Error(`Failed to fetch station lines: ${slError.message}`);
    console.log(`[Sync] Fetched ${stationLines?.length || 0} station-line mappings`);

    // Fetch coffee shops
    const { data: coffeeShops, error: csError } = await supabase
      .from('coffee_shops')
      .select('*');

    if (csError) throw new Error(`Failed to fetch coffee shops: ${csError.message}`);
    console.log(`[Sync] Fetched ${coffeeShops?.length || 0} coffee shops`);

    // Write to local database
    await database.write(async () => {
      const tubeLinesCollection = database.get<TubeLine>('tube_lines');
      const stationsCollection = database.get<Station>('stations');
      const stationLinesCollection = database.get<StationLine>('station_lines');
      const coffeeShopsCollection = database.get<CoffeeShop>('coffee_shops');

      // Clear existing data
      const existingLines = await tubeLinesCollection.query().fetch();
      const existingStations = await stationsCollection.query().fetch();
      const existingStationLines = await stationLinesCollection.query().fetch();
      const existingCoffeeShops = await coffeeShopsCollection.query().fetch();

      const deleteOps = [
        ...existingLines.map((r) => r.prepareDestroyPermanently()),
        ...existingStations.map((r) => r.prepareDestroyPermanently()),
        ...existingStationLines.map((r) => r.prepareDestroyPermanently()),
        ...existingCoffeeShops.map((r) => r.prepareDestroyPermanently()),
      ];

      if (deleteOps.length > 0) {
        await database.batch(...deleteOps);
      }

      // Insert tube lines
      const lineIdMap = new Map<string, string>(); // supabase id -> local id
      const lineOps = (lines || []).map((line: any) => {
        return tubeLinesCollection.prepareCreate((record: any) => {
          lineIdMap.set(line.id, record.id);
          record._raw.id = line.id; // Use same ID as Supabase
          record.tflId = line.tfl_id;
          record.name = line.name;
          record.color = line.color;
        });
      });

      // Insert stations
      const stationIdMap = new Map<string, string>();
      const stationOps = (stations || []).map((station: any) => {
        return stationsCollection.prepareCreate((record: any) => {
          stationIdMap.set(station.id, record.id);
          record._raw.id = station.id;
          record.naptanId = station.naptan_id;
          record.name = station.name;
          record.latitude = station.latitude;
          record.longitude = station.longitude;
          record.zone = station.zone;
          record.wifiAvailable = station.wifi_available || false;
          record.stepFreeAccess = station.step_free_access;
          record.updatedAt = new Date(station.updated_at || Date.now());
        });
      });

      // Insert station-line mappings
      const slOps = (stationLines || []).map((sl: any) => {
        return stationLinesCollection.prepareCreate((record: any) => {
          record.stationId = sl.station_id;
          record.lineId = sl.line_id;
        });
      });

      // Insert coffee shops
      const csOps = (coffeeShops || []).map((cs: any) => {
        return coffeeShopsCollection.prepareCreate((record: any) => {
          record._raw.id = cs.id;
          record.googlePlaceId = cs.google_place_id;
          record.stationId = cs.station_id;
          record.name = cs.name;
          record.address = cs.address || '';
          record.latitude = cs.latitude || 0;
          record.longitude = cs.longitude || 0;
          record.distanceMeters = cs.distance_meters || 0;
          record.rating = cs.rating;
          record.ratingCount = cs.rating_count;
          record.priceLevel = cs.price_level;
          record._raw.opening_hours = cs.opening_hours ? JSON.stringify(cs.opening_hours) : null;
          record.photoReference = cs.photo_reference;
          record.hasWifi = cs.has_wifi;
          record.hasSeating = cs.has_seating;
          record.website = cs.website;
          record.phone = cs.phone;
          record.lastRefreshed = new Date(cs.last_google_refresh || Date.now());
          record.needsRefresh = false;
        });
      });

      await database.batch(...lineOps, ...stationOps, ...slOps, ...csOps);
    });

    // Update sync metadata
    setLastSyncAt(new Date().toISOString());
    setSyncVersion(1);

    console.log('[Sync] Initial sync complete!');

    return {
      success: true,
      stationsCount: stations?.length || 0,
      coffeeShopsCount: coffeeShops?.length || 0,
    };
  } catch (error) {
    console.error('[Sync] Error during sync:', error);
    return {
      success: false,
      stationsCount: 0,
      coffeeShopsCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkAndSync(): Promise<void> {
  const lastVersion = getSyncVersion();

  if (lastVersion === 0) {
    // First time - do initial sync
    await performInitialSync();
  }
}
