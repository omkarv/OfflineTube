/**
 * TfL Station Seeding Script
 *
 * Fetches all London Underground stations from the TfL Unified API
 * and inserts them into Supabase.
 *
 * Usage:
 *   npx ts-node scripts/seed-stations.ts
 *
 * Required env vars:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY (service role key, not anon)
 *   TFL_APP_KEY (optional, for higher rate limits)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const TFL_APP_KEY = process.env.TFL_APP_KEY || '';

const TFL_API_BASE = 'https://api.tfl.gov.uk';

interface TfLStopPoint {
  naptanId: string;
  commonName: string;
  lat: number;
  lon: number;
  stopType: string;
  lines: { id: string; name: string }[];
  additionalProperties: { key: string; value: string }[];
}

interface TfLLine {
  id: string;
  name: string;
}

async function fetchTubeLines(): Promise<TfLLine[]> {
  const url = `${TFL_API_BASE}/Line/Mode/tube${TFL_APP_KEY ? `?app_key=${TFL_APP_KEY}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch tube lines: ${response.statusText}`);
  }
  return response.json();
}

async function fetchStationsForLine(lineId: string): Promise<TfLStopPoint[]> {
  const url = `${TFL_API_BASE}/Line/${lineId}/StopPoints${TFL_APP_KEY ? `?app_key=${TFL_APP_KEY}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch stations for ${lineId}: ${response.statusText}`);
  }
  return response.json();
}

function extractZone(additionalProperties: { key: string; value: string }[]): string {
  const zoneProp = additionalProperties.find((p) => p.key === 'Zone');
  if (zoneProp) {
    return zoneProp.value;
  }
  return 'Unknown';
}

function hasWifi(additionalProperties: { key: string; value: string }[]): boolean {
  const wifiProp = additionalProperties.find((p) => p.key === 'WiFi');
  return wifiProp?.value === 'yes';
}

function getStepFreeAccess(additionalProperties: { key: string; value: string }[]): string | null {
  const accessProp = additionalProperties.find((p) => p.key === 'AccessibleEquipment');
  return accessProp?.value || null;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('Fetching tube lines from TfL API...');
  const lines = await fetchTubeLines();
  console.log(`Found ${lines.length} tube lines`);

  // Collect all unique stations across all lines
  const stationMap = new Map<string, TfLStopPoint>();
  const stationLineMap = new Map<string, Set<string>>();

  for (const line of lines) {
    console.log(`Fetching stations for ${line.name}...`);
    const stations = await fetchStationsForLine(line.id);

    for (const station of stations) {
      if (station.stopType === 'NaptanMetroStation') {
        stationMap.set(station.naptanId, station);

        if (!stationLineMap.has(station.naptanId)) {
          stationLineMap.set(station.naptanId, new Set());
        }
        stationLineMap.get(station.naptanId)!.add(line.id);
      }
    }

    // Small delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`\nFound ${stationMap.size} unique tube stations`);

  // Get tube line IDs from Supabase
  const { data: dbLines, error: linesError } = await supabase
    .from('tube_lines')
    .select('id, tfl_id');

  if (linesError) {
    console.error('Error fetching tube lines from Supabase:', linesError);
    process.exit(1);
  }

  const lineIdMap = new Map(dbLines?.map((l) => [l.tfl_id, l.id]) || []);

  // Insert stations
  console.log('\nInserting stations into Supabase...');
  let inserted = 0;
  let updated = 0;

  for (const [naptanId, station] of stationMap) {
    const stationData = {
      naptan_id: naptanId,
      name: station.commonName.replace(' Underground Station', '').replace(' Station', ''),
      latitude: station.lat,
      longitude: station.lon,
      zone: extractZone(station.additionalProperties),
      wifi_available: hasWifi(station.additionalProperties),
      step_free_access: getStepFreeAccess(station.additionalProperties),
      updated_at: new Date().toISOString(),
    };

    const { data: existingStation, error: checkError } = await supabase
      .from('stations')
      .select('id')
      .eq('naptan_id', naptanId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`Error checking station ${naptanId}:`, checkError);
      continue;
    }

    let stationId: string;

    if (existingStation) {
      // Update existing
      const { error: updateError } = await supabase
        .from('stations')
        .update(stationData)
        .eq('id', existingStation.id);

      if (updateError) {
        console.error(`Error updating station ${station.commonName}:`, updateError);
        continue;
      }
      stationId = existingStation.id;
      updated++;
    } else {
      // Insert new
      const { data: newStation, error: insertError } = await supabase
        .from('stations')
        .insert(stationData)
        .select('id')
        .single();

      if (insertError || !newStation) {
        console.error(`Error inserting station ${station.commonName}:`, insertError);
        continue;
      }
      stationId = newStation.id;
      inserted++;
    }

    // Link station to lines
    const lineIds = stationLineMap.get(naptanId);
    if (lineIds) {
      for (const tflLineId of lineIds) {
        const dbLineId = lineIdMap.get(tflLineId);
        if (dbLineId) {
          await supabase.from('station_lines').upsert(
            { station_id: stationId, line_id: dbLineId },
            { onConflict: 'station_id,line_id' }
          );
        }
      }
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Updated: ${updated}`);

  // Increment sync version
  await supabase.rpc('increment_sync_version', { entity: 'stations' });
  console.log('Sync version incremented');
}

main().catch(console.error);
