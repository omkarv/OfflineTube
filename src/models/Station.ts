import { Model } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';

export default class Station extends Model {
  static table = 'stations';
  static associations = {
    coffee_shops: { type: 'has_many' as const, foreignKey: 'station_id' },
    station_lines: { type: 'has_many' as const, foreignKey: 'station_id' },
  };

  @field('naptan_id') naptanId!: string;
  @field('name') name!: string;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('zone') zone!: string;
  @field('wifi_available') wifiAvailable!: boolean;
  @field('step_free_access') stepFreeAccess?: string;
  @date('updated_at') updatedAt!: Date;

  @children('coffee_shops') coffeeShops!: any;
  @children('station_lines') stationLines!: any;
}
