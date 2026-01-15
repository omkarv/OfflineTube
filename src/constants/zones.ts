export const ZONES = ['1', '2', '3', '4', '5', '6'] as const;

export type Zone = (typeof ZONES)[number];

export const parseZone = (zone: string): string[] => {
  if (zone.includes('/')) {
    return zone.split('/');
  }
  return [zone];
};

export const isInZone = (stationZone: string, selectedZones: string[]): boolean => {
  if (selectedZones.length === 0) return true;
  const zones = parseZone(stationZone);
  return zones.some((z) => selectedZones.includes(z));
};
