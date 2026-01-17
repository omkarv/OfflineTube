// Official TfL tube line colors
export const TUBE_LINE_COLORS: Record<string, string> = {
  bakerloo: '#B36305',
  central: '#E32017',
  circle: '#FFD300',
  district: '#00782A',
  'hammersmith-city': '#F3A9BB',
  jubilee: '#A0A5A9',
  metropolitan: '#9B0056',
  northern: '#000000',
  piccadilly: '#003688',
  victoria: '#0098D4',
  'waterloo-city': '#95CDBA',
  // DLR and others
  dlr: '#00A4A7',
  'london-overground': '#EE7C0E',
  'elizabeth': '#6950A1',
  tram: '#84B817',
};

// For display purposes - map TfL IDs to friendly names
export const TUBE_LINE_NAMES: Record<string, string> = {
  bakerloo: 'Bakerloo',
  central: 'Central',
  circle: 'Circle',
  district: 'District',
  'hammersmith-city': 'Hammersmith & City',
  jubilee: 'Jubilee',
  metropolitan: 'Metropolitan',
  northern: 'Northern',
  piccadilly: 'Piccadilly',
  victoria: 'Victoria',
  'waterloo-city': 'Waterloo & City',
  dlr: 'DLR',
  'london-overground': 'Overground',
  'elizabeth': 'Elizabeth',
  tram: 'Tram',
};

// Get contrasting text color for a background
export function getTextColorForLine(lineId: string): string {
  const darkBackgrounds = ['bakerloo', 'central', 'district', 'metropolitan', 'northern', 'piccadilly', 'victoria', 'elizabeth'];
  return darkBackgrounds.includes(lineId) ? '#FFFFFF' : '#000000';
}
