import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import TubeLine from '../models/TubeLine';
import StationLine from '../models/StationLine';
import Station from '../models/Station';

export interface TubeLineInfo {
  id: string;
  tflId: string;
  name: string;
  color: string;
}

// Get all available tube lines
export function useAllTubeLines() {
  const [lines, setLines] = useState<TubeLineInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLines = async () => {
      try {
        const tubeLines = database.get<TubeLine>('tube_lines');
        const results = await tubeLines.query().fetch();
        setLines(
          results.map((line) => ({
            id: line.id,
            tflId: line.tflId,
            name: line.name,
            color: line.color,
          }))
        );
      } catch (error) {
        console.error('Error fetching tube lines:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLines();
  }, []);

  return { lines, loading };
}

// Get tube lines for a specific station
export function useStationLines(stationId: string) {
  const [lines, setLines] = useState<TubeLineInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLines = async () => {
      if (!stationId) {
        setLoading(false);
        return;
      }
      try {
        const stationLines = database.get<StationLine>('station_lines');
        const tubeLines = database.get<TubeLine>('tube_lines');

        // Get line IDs for this station
        const stationLineRecords = await stationLines
          .query(Q.where('station_id', stationId))
          .fetch();
        const lineIds = stationLineRecords.map((sl) => sl.lineId);

        if (lineIds.length === 0) {
          setLines([]);
          setLoading(false);
          return;
        }

        // Get the actual tube line records
        const lineRecords = await tubeLines
          .query(Q.where('id', Q.oneOf(lineIds)))
          .fetch();

        setLines(
          lineRecords.map((line) => ({
            id: line.id,
            tflId: line.tflId,
            name: line.name,
            color: line.color,
          }))
        );
      } catch (error) {
        console.error('Error fetching station lines:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLines();
  }, [stationId]);

  return { lines, loading };
}

// Batch fetch tube lines for multiple stations at once (more efficient)
export function useStationsLines(stationIds: string[]) {
  const [linesMap, setLinesMap] = useState<Map<string, TubeLineInfo[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLines = async () => {
      if (stationIds.length === 0) {
        setLinesMap(new Map());
        setLoading(false);
        return;
      }

      try {
        const stationLines = database.get<StationLine>('station_lines');
        const tubeLines = database.get<TubeLine>('tube_lines');

        // Get all station-line relationships for these stations
        const stationLineRecords = await stationLines
          .query(Q.where('station_id', Q.oneOf(stationIds)))
          .fetch();

        // Get unique line IDs
        const lineIds = [...new Set(stationLineRecords.map((sl) => sl.lineId))];

        if (lineIds.length === 0) {
          setLinesMap(new Map());
          setLoading(false);
          return;
        }

        // Get all tube line records
        const lineRecords = await tubeLines
          .query(Q.where('id', Q.oneOf(lineIds)))
          .fetch();

        // Create a map of line ID to line info
        const lineInfoMap = new Map<string, TubeLineInfo>();
        lineRecords.forEach((line) => {
          lineInfoMap.set(line.id, {
            id: line.id,
            tflId: line.tflId,
            name: line.name,
            color: line.color,
          });
        });

        // Build the station -> lines map
        const result = new Map<string, TubeLineInfo[]>();
        stationLineRecords.forEach((sl) => {
          const lineInfo = lineInfoMap.get(sl.lineId);
          if (lineInfo) {
            const existing = result.get(sl.stationId) || [];
            existing.push(lineInfo);
            result.set(sl.stationId, existing);
          }
        });

        setLinesMap(result);
      } catch (error) {
        console.error('Error fetching stations lines:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLines();
  }, [stationIds.join(',')]);

  return { linesMap, loading };
}

export interface StationOnLine {
  station: Station;
  sequence: number | null;
  branch: string | null;
}

// Get stations for a specific line, ordered by sequence
export function useLineStations(lineId: string) {
  const [stations, setStations] = useState<StationOnLine[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStations = async () => {
      if (!lineId) {
        setLoading(false);
        return;
      }

      try {
        const stationLinesCollection = database.get<StationLine>('station_lines');
        const stationsCollection = database.get<Station>('stations');

        // Get all station-line records for this line
        const stationLineRecords = await stationLinesCollection
          .query(Q.where('line_id', lineId))
          .fetch();

        if (stationLineRecords.length === 0) {
          setStations([]);
          setBranches([]);
          setLoading(false);
          return;
        }

        // Get unique station IDs
        const stationIds = [...new Set(stationLineRecords.map((sl) => sl.stationId))];

        // Fetch all stations
        const stationRecords = await stationsCollection
          .query(Q.where('id', Q.oneOf(stationIds)))
          .fetch();

        // Create station map for quick lookup
        const stationMap = new Map<string, Station>();
        stationRecords.forEach((s) => stationMap.set(s.id, s));

        // Build station list with sequence info
        const result: StationOnLine[] = stationLineRecords
          .map((sl) => {
            const station = stationMap.get(sl.stationId);
            if (!station) return null;
            return {
              station,
              sequence: sl.sequence ?? null,
              branch: sl.branch ?? null,
            };
          })
          .filter((s): s is StationOnLine => s !== null);

        // Sort by sequence (nulls last)
        result.sort((a, b) => {
          if (a.sequence === null && b.sequence === null) {
            return a.station.name.localeCompare(b.station.name);
          }
          if (a.sequence === null) return 1;
          if (b.sequence === null) return -1;
          return a.sequence - b.sequence;
        });

        // Get unique branches
        const uniqueBranches = [...new Set(result.map((s) => s.branch).filter((b): b is string => b !== null))];

        setStations(result);
        setBranches(uniqueBranches);
      } catch (error) {
        console.error('Error fetching line stations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [lineId]);

  return { stations, branches, loading };
}
