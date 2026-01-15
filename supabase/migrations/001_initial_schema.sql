-- Tube Coffee Initial Schema
-- Run this in Supabase SQL Editor or via migrations

-- Tube lines
CREATE TABLE IF NOT EXISTS tube_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tfl_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stations
CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    naptan_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    zone TEXT NOT NULL,
    wifi_available BOOLEAN DEFAULT false,
    step_free_access TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stations_name ON stations(name);
CREATE INDEX IF NOT EXISTS idx_stations_zone ON stations(zone);
CREATE INDEX IF NOT EXISTS idx_stations_naptan ON stations(naptan_id);

-- Station-line junction (many-to-many)
CREATE TABLE IF NOT EXISTS station_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
    line_id UUID REFERENCES tube_lines(id) ON DELETE CASCADE,
    UNIQUE(station_id, line_id)
);

CREATE INDEX IF NOT EXISTS idx_station_lines_station ON station_lines(station_id);
CREATE INDEX IF NOT EXISTS idx_station_lines_line ON station_lines(line_id);

-- Coffee shops
CREATE TABLE IF NOT EXISTS coffee_shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_place_id TEXT UNIQUE NOT NULL,
    station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters INTEGER,
    rating DECIMAL(2,1),
    rating_count INTEGER,
    price_level SMALLINT,
    opening_hours JSONB,
    photo_reference TEXT,
    has_wifi BOOLEAN,
    has_seating BOOLEAN,
    website TEXT,
    phone TEXT,
    last_google_refresh TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coffee_shops_station ON coffee_shops(station_id);
CREATE INDEX IF NOT EXISTS idx_coffee_shops_place_id ON coffee_shops(google_place_id);

-- Sync versioning for delta sync
CREATE TABLE IF NOT EXISTS sync_versions (
    id SERIAL PRIMARY KEY,
    entity_type TEXT UNIQUE NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize sync versions
INSERT INTO sync_versions (entity_type, version) VALUES
    ('stations', 1),
    ('coffee_shops', 1),
    ('full_sync', 1)
ON CONFLICT (entity_type) DO NOTHING;

-- Change log for delta sync tracking
CREATE TABLE IF NOT EXISTS change_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    sync_version INTEGER NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_log_version ON change_log(sync_version);
CREATE INDEX IF NOT EXISTS idx_change_log_entity ON change_log(entity_type, entity_id);

-- Function to increment sync version
CREATE OR REPLACE FUNCTION increment_sync_version(entity TEXT)
RETURNS INTEGER AS $$
DECLARE
    new_version INTEGER;
BEGIN
    UPDATE sync_versions
    SET version = version + 1, changed_at = NOW()
    WHERE entity_type = entity
    RETURNING version INTO new_version;

    RETURN new_version;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log station changes
CREATE OR REPLACE FUNCTION log_station_change()
RETURNS TRIGGER AS $$
DECLARE
    current_version INTEGER;
BEGIN
    SELECT version INTO current_version FROM sync_versions WHERE entity_type = 'stations';

    IF TG_OP = 'DELETE' THEN
        INSERT INTO change_log (entity_type, entity_id, operation, sync_version)
        VALUES ('stations', OLD.id, TG_OP, current_version);
        RETURN OLD;
    ELSE
        INSERT INTO change_log (entity_type, entity_id, operation, sync_version)
        VALUES ('stations', NEW.id, TG_OP, current_version);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER station_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON stations
FOR EACH ROW EXECUTE FUNCTION log_station_change();

-- Trigger to log coffee shop changes
CREATE OR REPLACE FUNCTION log_coffee_shop_change()
RETURNS TRIGGER AS $$
DECLARE
    current_version INTEGER;
BEGIN
    SELECT version INTO current_version FROM sync_versions WHERE entity_type = 'coffee_shops';

    IF TG_OP = 'DELETE' THEN
        INSERT INTO change_log (entity_type, entity_id, operation, sync_version)
        VALUES ('coffee_shops', OLD.id, TG_OP, current_version);
        RETURN OLD;
    ELSE
        INSERT INTO change_log (entity_type, entity_id, operation, sync_version)
        VALUES ('coffee_shops', NEW.id, TG_OP, current_version);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER coffee_shop_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON coffee_shops
FOR EACH ROW EXECUTE FUNCTION log_coffee_shop_change();

-- Seed tube lines
INSERT INTO tube_lines (tfl_id, name, color) VALUES
    ('bakerloo', 'Bakerloo', '#B36305'),
    ('central', 'Central', '#E32017'),
    ('circle', 'Circle', '#FFD300'),
    ('district', 'District', '#00782A'),
    ('hammersmith-city', 'Hammersmith & City', '#F3A9BB'),
    ('jubilee', 'Jubilee', '#A0A5A9'),
    ('metropolitan', 'Metropolitan', '#9B0056'),
    ('northern', 'Northern', '#000000'),
    ('piccadilly', 'Piccadilly', '#003688'),
    ('victoria', 'Victoria', '#0098D4'),
    ('waterloo-city', 'Waterloo & City', '#95CDBA')
ON CONFLICT (tfl_id) DO UPDATE SET
    name = EXCLUDED.name,
    color = EXCLUDED.color;
