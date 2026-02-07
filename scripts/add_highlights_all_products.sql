-- Add highlights to all vendor products for Deal of the Week home page display
-- Generated: 2026-02-06

-- CONTRACT SERIES (IDs 1-13)
-- Standard highlights for Contract series: 4S protection, realistic texture, versatile install

UPDATE vendor_products SET deal_content = jsonb_build_object('highlights', jsonb_build_array(
  'Heavy-traffic durability with 4S scratch and stain protection',
  'Realistic embossed wood grain texture',
  'Glue-down install on any grade level'
)) WHERE id IN (1,2,3,4,5,6,7,8,9,10,11,12,13);

-- CRAFTSMAN SERIES - Wide Planks (IDs 15,16,18,19,20,21,22,23,24,28,31,32)
-- Emphasize design-forward + wide format

UPDATE vendor_products SET deal_content = jsonb_build_object('highlights', jsonb_build_array(
  'Premium 0.55mm wear layer for enhanced durability',
  'Wide-plank format with realistic embossed texture',
  'Design-forward glue-down vinyl with 4S protection'
)) WHERE id IN (15,16,18,19,20,21,22,23,24,28,31,32);

-- CRAFTSMAN SERIES - Large Format Tiles (IDs 14,17,25,26,27,29,30,33)
-- Emphasize tile format + modern aesthetic

UPDATE vendor_products SET deal_content = jsonb_build_object('highlights', jsonb_build_array(
  'Large-format 16×32" tiles for modern, upscale look',
  'Premium 0.55mm wear layer with 4S protection',
  'Realistic stone texture with glue-down stability'
)) WHERE id IN (14,17,25,26,27,29,30,33);

-- ESSENTIALS SERIES (IDs 34-36)
-- Emphasize low-maintenance + versatility

UPDATE vendor_products SET deal_content = jsonb_build_object('highlights', jsonb_build_array(
  'Low-maintenance glue-down vinyl with 4S protection',
  'Versatile neutrals work in any space',
  'Heavy-commercial durability at accessible pricing'
)) WHERE id IN (34,35,36);

-- HARBINGER ACOUSTIC CLICK - Carrara (ID 37)
UPDATE vendor_products SET deal_content = jsonb_build_object('highlights', jsonb_build_array(
  'Rigid composite core with cork backing for stability',
  'Sound reduction with refined upscale finish',
  'Premium performance with acoustic comfort'
)) WHERE id = 37;

-- SIGNATURE ACOUSTIC CLICK SERIES - Wood Planks (IDs 38,39,43,44,45,46,47,48,49,50,51,52,53,56,60,61,62,63,67,68,69)
-- Emphasize sound control + floating click

UPDATE vendor_products SET deal_content = jsonb_build_object('highlights', jsonb_build_array(
  'Floating click install with integrated cork underlayment',
  'Superior sound control for quieter rooms',
  'Realistic embossed wood grain with 0.55mm wear layer'
)) WHERE id IN (38,39,43,44,45,46,47,48,49,50,51,52,53,56,60,61,62,63,67,68,69);

-- SIGNATURE ACOUSTIC CLICK SERIES - Tiles (IDs 40,41,42,54,55,57,58,59,64,65,66)
-- Emphasize tile format + acoustic

UPDATE vendor_products SET deal_content = jsonb_build_object('highlights', jsonb_build_array(
  'Large-format floating click tiles with cork backing',
  'Excellent sound control with IIC/STC ratings',
  'Premium stone realism with easy click install'
)) WHERE id IN (40,41,42,54,55,57,58,59,64,65,66);

-- THE QUIET ZONE SERIES - Wood (IDs 72,74,75,77,79,80,81)
-- Emphasize IXPE acoustic + wood aesthetic

UPDATE vendor_products SET deal_content = jsonb_build_object('highlights', jsonb_build_array(
  'IXPE acoustic backing for quieter, more comfortable rooms',
  'Realistic wood grain with glue-down stability',
  'IIC 72, STC 70 rated for superior sound control'
)) WHERE id IN (72,74,75,77,79,80,81);

-- THE QUIET ZONE SERIES - Tiles (IDs 70,71,73,76,78,82)
-- Emphasize IXPE acoustic + stone aesthetic

UPDATE vendor_products SET deal_content = jsonb_build_object('highlights', jsonb_build_array(
  'IXPE acoustic layer for quieter rooms and soft feel',
  'Large-format tile with premium stone realism',
  'IIC 72, STC 70 rated with glue-down durability'
)) WHERE id IN (70,71,73,76,78,82);

-- Verify update count
SELECT 
  COUNT(*) as products_with_highlights,
  COUNT(DISTINCT series) as series_count
FROM vendor_products 
WHERE deal_content IS NOT NULL 
AND deal_content->>'highlights' IS NOT NULL
AND id < 100;
