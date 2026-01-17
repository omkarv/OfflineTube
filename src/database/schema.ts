import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'stations',
      columns: [
        { name: 'naptan_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'zone', type: 'string', isIndexed: true },
        { name: 'wifi_available', type: 'boolean' },
        { name: 'step_free_access', type: 'string', isOptional: true },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'tube_lines',
      columns: [
        { name: 'tfl_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'color', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'station_lines',
      columns: [
        { name: 'station_id', type: 'string', isIndexed: true },
        { name: 'line_id', type: 'string', isIndexed: true },
        { name: 'sequence', type: 'number', isOptional: true },
        { name: 'branch', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'coffee_shops',
      columns: [
        { name: 'google_place_id', type: 'string', isIndexed: true },
        { name: 'station_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'address', type: 'string' },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'distance_meters', type: 'number' },
        { name: 'rating', type: 'number', isOptional: true },
        { name: 'rating_count', type: 'number', isOptional: true },
        { name: 'price_level', type: 'number', isOptional: true },
        { name: 'opening_hours', type: 'string', isOptional: true },
        { name: 'photo_reference', type: 'string', isOptional: true },
        { name: 'has_wifi', type: 'boolean', isOptional: true },
        { name: 'has_seating', type: 'boolean', isOptional: true },
        { name: 'website', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'last_refreshed', type: 'number' },
        { name: 'needs_refresh', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'sync_metadata',
      columns: [
        { name: 'entity_type', type: 'string', isIndexed: true },
        { name: 'last_sync_at', type: 'number' },
        { name: 'sync_version', type: 'number' },
        { name: 'records_synced', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'error_message', type: 'string', isOptional: true },
      ],
    }),
  ],
});
