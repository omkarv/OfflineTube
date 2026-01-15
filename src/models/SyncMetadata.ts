import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export type SyncStatus = 'success' | 'partial' | 'failed';

export default class SyncMetadata extends Model {
  static table = 'sync_metadata';

  @field('entity_type') entityType!: string;
  @date('last_sync_at') lastSyncAt!: Date;
  @field('sync_version') syncVersion!: number;
  @field('records_synced') recordsSynced!: number;
  @field('status') status!: SyncStatus;
  @field('error_message') errorMessage?: string;
}
