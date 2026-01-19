-- Victoria Flooring Outlet - Vendor Products + Weekly Deals Schema
-- Run this in your Postgres database alongside existing schemas.

CREATE TABLE IF NOT EXISTS vendor_products (
  id SERIAL PRIMARY KEY,
  vendor VARCHAR(100) NOT NULL,
  category VARCHAR(150),
  series VARCHAR(150),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  coverage_sqft_per_box NUMERIC(10,2),
  specs JSONB,
  warranty TEXT,
  features JSONB,
  source_url TEXT,
  source_updated_at TIMESTAMP,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_product_images (
  id SERIAL PRIMARY KEY,
  vendor_product_id INTEGER REFERENCES vendor_products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS weekly_deals (
  id SERIAL PRIMARY KEY,
  vendor_product_id INTEGER REFERENCES vendor_products(id) ON DELETE CASCADE,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  price_per_sqft NUMERIC(10,2),
  compare_at_per_sqft NUMERIC(10,2),
  currency VARCHAR(10) DEFAULT 'CAD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor ON vendor_products(vendor);
CREATE INDEX IF NOT EXISTS idx_vendor_products_category ON vendor_products(category);
CREATE INDEX IF NOT EXISTS idx_vendor_products_series ON vendor_products(series);
CREATE INDEX IF NOT EXISTS idx_vendor_products_active ON vendor_products(active);
CREATE INDEX IF NOT EXISTS idx_vendor_product_images_product ON vendor_product_images(vendor_product_id);
CREATE INDEX IF NOT EXISTS idx_weekly_deals_active ON weekly_deals(is_active, starts_at, ends_at);

CREATE OR REPLACE FUNCTION update_vendor_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_vendor_products_updated_at ON vendor_products;
CREATE TRIGGER update_vendor_products_updated_at
  BEFORE UPDATE ON vendor_products
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_products_updated_at();
