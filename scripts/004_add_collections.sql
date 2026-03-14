-- Collections table for grouping links
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for many-to-many relationship between collections and links
CREATE TABLE IF NOT EXISTS collection_links (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, link_id)
);

-- Enable Row Level Security
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections
-- Users can view their own collections OR public collections
CREATE POLICY "Users can view their own or public collections" ON collections
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

-- Only owner can insert
CREATE POLICY "Users can insert their own collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only owner can update
CREATE POLICY "Users can update their own collections" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

-- Only owner can delete
CREATE POLICY "Users can delete their own collections" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for collection_links
-- Anyone can view links in public collections, owners can view any of theirs
CREATE POLICY "Users can view links in their own or public collections" ON collection_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_links.collection_id 
      AND (collections.user_id = auth.uid() OR collections.is_public = TRUE)
    )
  );

-- Only owners can manage links in their collections
CREATE POLICY "Users can manage links in their own collections" ON collection_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_links.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

-- Refine links policy to allow public view if it belongs to a public collection
-- We need to DROP the existing view policy and replace it or add a new one.
-- Existing policy from 003: "Users can view their own links" (auth.uid() = user_id)
CREATE POLICY "Public can view links in public collections" ON links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collection_links
      JOIN collections ON collections.id = collection_links.collection_id
      WHERE collection_links.link_id = links.id AND collections.is_public = TRUE
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON collections(is_public);
CREATE INDEX IF NOT EXISTS idx_collection_links_collection_id ON collection_links(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_links_link_id ON collection_links(link_id);
