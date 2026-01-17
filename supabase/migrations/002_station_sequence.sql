-- Add sequence and branch data for station ordering on lines

ALTER TABLE station_lines
ADD COLUMN IF NOT EXISTS sequence INTEGER,
ADD COLUMN IF NOT EXISTS branch TEXT;

-- Add index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_station_lines_sequence ON station_lines(line_id, sequence);

-- Update unique constraint to include branch (same station can appear on different branches)
ALTER TABLE station_lines DROP CONSTRAINT IF EXISTS station_lines_station_id_line_id_key;
ALTER TABLE station_lines ADD CONSTRAINT station_lines_unique UNIQUE(station_id, line_id, branch);
