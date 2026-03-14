-- Add user_id column to links table
ALTER TABLE links ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to tags table
ALTER TABLE tags ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable Row Level Security on all tables
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running the script)
DROP POLICY IF EXISTS "Users can view their own links" ON links;
DROP POLICY IF EXISTS "Users can insert their own links" ON links;
DROP POLICY IF EXISTS "Users can update their own links" ON links;
DROP POLICY IF EXISTS "Users can delete their own links" ON links;

DROP POLICY IF EXISTS "Users can view their own tags" ON tags;
DROP POLICY IF EXISTS "Users can insert their own tags" ON tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON tags;

DROP POLICY IF EXISTS "Users can view their own link_tags" ON link_tags;
DROP POLICY IF EXISTS "Users can insert their own link_tags" ON link_tags;
DROP POLICY IF EXISTS "Users can delete their own link_tags" ON link_tags;

-- RLS Policies for links table
CREATE POLICY "Users can view their own links" ON links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own links" ON links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links" ON links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links" ON links
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for tags table
CREATE POLICY "Users can view their own tags" ON tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for link_tags table (join table)
-- Users can only see/modify link_tags where they own both the link and the tag
CREATE POLICY "Users can view their own link_tags" ON link_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM links WHERE links.id = link_tags.link_id AND links.user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own link_tags" ON link_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM links WHERE links.id = link_tags.link_id AND links.user_id = auth.uid()) AND
    EXISTS (SELECT 1 FROM tags WHERE tags.id = link_tags.tag_id AND tags.user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own link_tags" ON link_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM links WHERE links.id = link_tags.link_id AND links.user_id = auth.uid())
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
