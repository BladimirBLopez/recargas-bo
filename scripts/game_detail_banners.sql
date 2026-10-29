CREATE TABLE IF NOT EXISTS game_detail_banners (
  slug TEXT PRIMARY KEY,
  url TEXT,
  public_id TEXT,
  title TEXT,
  subtitle TEXT,
  chip_1 TEXT,
  chip_2 TEXT,
  chip_3 TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
