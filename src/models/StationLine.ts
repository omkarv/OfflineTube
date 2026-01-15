import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export default class StationLine extends Model {
  static table = 'station_lines';
  static associations = {
    stations: { type: 'belongs_to' as const, key: 'station_id' },
    tube_lines: { type: 'belongs_to' as const, key: 'line_id' },
  };

  @field('station_id') stationId!: string;
  @field('line_id') lineId!: string;

  @relation('stations', 'station_id') station!: any;
  @relation('tube_lines', 'line_id') line!: any;
}
