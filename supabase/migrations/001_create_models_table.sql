-- Create models table
CREATE TABLE IF NOT EXISTS models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  file_size BIGINT,
  file_type VARCHAR(50),
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_models_is_active ON models(is_active);
CREATE INDEX IF NOT EXISTS idx_models_category ON models(category);
CREATE INDEX IF NOT EXISTS idx_models_created_at ON models(created_at DESC);

-- Enable Row Level Security
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Models are viewable by everyone" ON models
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert models" ON models
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Updated policy to allow authenticated users to update all models
DROP POLICY IF EXISTS "Users can update their own models" ON models;
CREATE POLICY "Authenticated users can update models" ON models
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own models" ON models
  FOR DELETE USING (auth.uid() = created_by);

-- Insert actual models from your collection
INSERT INTO models (name, description, file_path, thumbnail_url, category, is_active, is_featured, file_size, file_type, tags) VALUES
('Backpack', 'Customizable backpack with multiple compartments', '/models/Backpack.glb', '/thumbnails/backpack.jpg', 'Bags', true, true, 1536000, 'glb', ARRAY['backpack', 'custom', 'travel']),
('Baseball Caps', 'Customizable baseball caps', '/models/Baseball caps.glb', '/thumbnails/baseball-caps.jpg', 'Caps', true, false, 512000, 'glb', ARRAY['baseball', 'caps', 'headwear']),
('Baseball Jersey', 'Professional baseball jersey', '/models/Baseball-Jersey.glb', '/thumbnails/baseball-jersey.jpg', 'Baseball', true, false, 1024000, 'glb', ARRAY['baseball', 'jersey', 'sports']),
('Basketball Jersey Top And Long Shorts', 'Complete basketball uniform with long shorts', '/models/Basketball Jersey Top And Long Shorts.glb', '/thumbnails/basketball-long.jpg', 'Jerseys', true, true, 1536000, 'glb', ARRAY['basketball', 'jersey', 'shorts']),
('Basketball Jersey and Shorts', 'Standard basketball uniform', '/models/Basketball Jersey and Shorts.glb', '/thumbnails/basketball-shorts.jpg', 'Jerseys', true, false, 1024000, 'glb', ARRAY['basketball', 'jersey', 'uniform']),
('Duffle Bag', 'Large capacity duffle bag', '/models/Duffle Bag.glb', '/thumbnails/duffle-bag.jpg', 'Bags', true, false, 2048000, 'glb', ARRAY['duffle', 'bag', 'travel']),
('Flag Football Top with Hoodie', 'Flag football jersey with hoodie', '/models/Flag football top with hoodie.glb', '/thumbnails/flag-football.jpg', 'Hoodies', true, false, 1536000, 'glb', ARRAY['football', 'hoodie', 'jersey']),
('Half Short', 'Athletic half-length shorts', '/models/Half short.glb', '/thumbnails/half-short.jpg', 'Shorts', true, false, 512000, 'glb', ARRAY['shorts', 'athletic', 'half']),
('Hoodie', 'Classic pullover hoodie', '/models/Hoodie.glb', '/thumbnails/hoodie.jpg', 'Hoodies', true, true, 1024000, 'glb', ARRAY['hoodie', 'pullover', 'casual']),
('Polo Shirts Long Sleeve', 'Long sleeve polo shirt', '/models/Polo shirts long sleeve.glb', '/thumbnails/polo-long.jpg', 'Polos', true, false, 768000, 'glb', ARRAY['polo', 'long-sleeve', 'shirt']),
('Polo Shirts Short Sleeve', 'Short sleeve polo shirt', '/models/Polo shirts short sleeve.glb', '/thumbnails/polo-short.jpg', 'Polos', true, false, 512000, 'glb', ARRAY['polo', 'short-sleeve', 'shirt']),
('Soccer Jersey Crew Neck', 'Soccer jersey with crew neck', '/models/Soccer jersey crew neck.glb', '/thumbnails/soccer-crew.jpg', 'Soccer', true, false, 768000, 'glb', ARRAY['soccer', 'jersey', 'crew-neck']),
('Soccer Jersey V-Neck', 'Soccer jersey with v-neck', '/models/Soccer jersey v-neck.glb', '/thumbnails/soccer-vneck.jpg', 'Soccer', true, false, 768000, 'glb', ARRAY['soccer', 'jersey', 'v-neck']),
('Standard Bottom Cut, Cuffed', 'Standard cuffed athletic shorts', '/models/Standard bottom cut, cuffed.glb', '/thumbnails/standard-cuffed.jpg', 'Shorts', true, false, 512000, 'glb', ARRAY['shorts', 'cuffed', 'athletic']),
('Track and Field Compression Shorts', 'Compression shorts for track and field', '/models/Track and field compression shorts.glb', '/thumbnails/track-compression.jpg', 'Track & Field', true, false, 384000, 'glb', ARRAY['track', 'compression', 'shorts']),
('Track and Field Mid-Length Shorts', 'Mid-length track and field shorts', '/models/Track and field mid-len gth shorts.glb', '/thumbnails/track-mid.jpg', 'Track & Field', true, false, 512000, 'glb', ARRAY['track', 'mid-length', 'shorts']),
('Track and Field Split Shorts', 'Split shorts for track and field', '/models/Track and field split shorts.glb', '/thumbnails/track-split.jpg', 'Track & Field', true, false, 384000, 'glb', ARRAY['track', 'split', 'shorts']),
('Track and Field Top Crop Top', 'Crop top for track and field', '/models/Track and field top crop top.glb', '/thumbnails/track-crop.jpg', 'Track & Field', true, false, 384000, 'glb', ARRAY['track', 'crop-top', 'athletic']),
('Track and Field Top Short Sleeve', 'Short sleeve track and field top', '/models/Track and field top short sleeve.glb', '/thumbnails/track-short.jpg', 'Track & Field', true, false, 512000, 'glb', ARRAY['track', 'short-sleeve', 'top']),
('Track and Field Top Tank Top', 'Tank top for track and field', '/models/Track and field top tank top.glb', '/thumbnails/track-tank.jpg', 'Track & Field', true, false, 384000, 'glb', ARRAY['track', 'tank-top', 'athletic']),
('Volleyball Long Sleeve Tops', 'Long sleeve volleyball top', '/models/Volleyball long sleeve tops.glb', '/thumbnails/volleyball-long.jpg', 'Volleyball', true, false, 768000, 'glb', ARRAY['volleyball', 'long-sleeve', 'top']),
('Volleyball Short Sleeve Tops', 'Short sleeve volleyball top', '/models/Volleyball short sleeve tops.glb', '/thumbnails/volleyball-short.jpg', 'Volleyball', true, false, 512000, 'glb', ARRAY['volleyball', 'short-sleeve', 'top']),
('Volleyball Shorts Spandex 4', 'Spandex volleyball shorts style 4', '/models/Volleyball shorts spandex 4.glb', '/thumbnails/volleyball-spandex4.jpg', 'Volleyball', true, false, 384000, 'glb', ARRAY['volleyball', 'spandex', 'shorts']),
('Volleyball Shorts Spandex', 'Standard spandex volleyball shorts', '/models/Volleyball shorts spandex.glb', '/thumbnails/volleyball-spandex.jpg', 'Volleyball', true, false, 384000, 'glb', ARRAY['volleyball', 'spandex', 'shorts']),
('Volleyball Spandex', 'Volleyball spandex uniform', '/models/Volleyball spandex.glb', '/thumbnails/volleyball-spandex-alt.jpg', 'Volleyball', true, false, 384000, 'glb', ARRAY['volleyball', 'spandex', 'uniform']),
('Basketball Shooting Shirt Long Sleeve', 'Long sleeve basketball shooting shirt', '/models/basketball shooting shirt long sleeve without hoodie.glb', '/thumbnails/basketball-long.jpg', 'Jerseys', true, false, 768000, 'glb', ARRAY['basketball', 'shooting-shirt', 'long-sleeve']),
('Basketball Shooting Shirt with Hoodie', 'Basketball shooting shirt with hoodie', '/models/basketball shooting shirt short sleeve with hoodie.glb', '/thumbnails/basketball-hoodie.jpg', 'Jerseys', true, true, 1024000, 'glb', ARRAY['basketball', 'shooting-shirt', 'hoodie']),
('Basketball Shooting Shirt Short Sleeve', 'Short sleeve basketball shooting shirt', '/models/basketball shooting shirt, short sleeve without a hoodie.glb', '/thumbnails/basketball-short.jpg', 'Jerseys', true, false, 512000, 'glb', ARRAY['basketball', 'shooting-shirt', 'short-sleeve']),
('Long Pants', 'Athletic long pants', '/models/long pants.glb', '/thumbnails/long-pants.jpg', 'Shorts', false, false, 768000, 'glb', ARRAY['pants', 'long', 'athletic']);