import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import Station from '../models/Station';

interface UseStationsOptions {
  searchQuery?: string;
  lineFilter?: string[];
  zoneFilter?: string[];
}

export function useStations(options: UseStationsOptions = {}) {
  const { searchQuery = '', lineFilter = [], zoneFilter = [] } = options;
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const stationsCollection = database.get<Station>('stations');

        let query = stationsCollection.query();

        // Apply search filter
        if (searchQuery.trim()) {
          query = stationsCollection.query(
            Q.where('name', Q.like(`%${Q.sanitizeLikeString(searchQuery)}%`))
          );
        }

        // Apply zone filter
        if (zoneFilter.length > 0) {
          const zoneConditions = zoneFilter.map((zone) =>
            Q.or(Q.where('zone', zone), Q.where('zone', Q.like(`%${zone}%`)))
          );
          query = stationsCollection.query(
            Q.and(
              searchQuery.trim()
                ? Q.where('name', Q.like(`%${Q.sanitizeLikeString(searchQuery)}%`))
                : Q.where('name', Q.notEq('')),
              Q.or(...zoneConditions)
            )
          );
        }

        const results = await query.fetch();

        // If line filter is applied, we need to filter in memory
        // since it requires joining with station_lines table
        let filteredResults = results;
        if (lineFilter.length > 0) {
          const stationLinesCollection = database.get('station_lines');
          const tubeLines = database.get('tube_lines');

          // Get line IDs for the selected lines
          const selectedLines = await tubeLines
            .query(Q.where('tfl_id', Q.oneOf(lineFilter)))
            .fetch();
          const selectedLineIds = new Set(selectedLines.map((l: any) => l.id));

          // Get station IDs that belong to selected lines
          const stationLineRecords = await stationLinesCollection
            .query(Q.where('line_id', Q.oneOf([...selectedLineIds])))
            .fetch();
          const stationIdsOnLines = new Set(stationLineRecords.map((sl: any) => sl.stationId));

          filteredResults = results.filter((s) => stationIdsOnLines.has(s.id));
        }

        // Sort by name
        filteredResults.sort((a, b) => a.name.localeCompare(b.name));

        setStations(filteredResults);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch stations'));
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [searchQuery, lineFilter.join(','), zoneFilter.join(',')]);

  return { stations, loading, error };
}

export function useStation(stationId: string) {
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStation = async () => {
      try {
        setLoading(true);
        const stationsCollection = database.get<Station>('stations');
        const result = await stationsCollection.find(stationId);
        setStation(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch station'));
      } finally {
        setLoading(false);
      }
    };

    if (stationId) {
      fetchStation();
    }
  }, [stationId]);

  return { station, loading, error };
}
