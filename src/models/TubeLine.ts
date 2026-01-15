import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class TubeLine extends Model {
  static table = 'tube_lines';

  @field('tfl_id') tflId!: string;
  @field('name') name!: string;
  @field('color') color!: string;
}
