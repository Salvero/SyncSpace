-- ============================================
-- SYNCSPACE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ROOMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true,
    title TEXT DEFAULT 'Untitled Room',
    snapshot_url TEXT
);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Policies for rooms
-- 1. Anyone can read public rooms
CREATE POLICY "Public rooms are viewable by everyone"
    ON rooms FOR SELECT
    USING (is_public = true);

-- 2. Owners can read their own rooms (public or private)
CREATE POLICY "Users can view own rooms"
    ON rooms FOR SELECT
    USING (auth.uid() = owner_id);

-- 3. Authenticated users can create rooms
CREATE POLICY "Authenticated users can create rooms"
    ON rooms FOR INSERT
    WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);

-- 4. Owners can update their rooms
CREATE POLICY "Users can update own rooms"
    ON rooms FOR UPDATE
    USING (auth.uid() = owner_id);

-- 5. Owners can delete their rooms
CREATE POLICY "Users can delete own rooms"
    ON rooms FOR DELETE
    USING (auth.uid() = owner_id);

-- ============================================
-- 2. NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
    content TEXT DEFAULT '',
    x FLOAT DEFAULT 0,
    y FLOAT DEFAULT 0,
    width FLOAT,
    height FLOAT,
    color TEXT DEFAULT 'yellow',
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Policies for notes
-- 1. Anyone can read notes in public rooms
CREATE POLICY "Notes in public rooms are viewable"
    ON notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM rooms
            WHERE rooms.id = notes.room_id
            AND rooms.is_public = true
        )
    );

-- 2. Room owners can read all notes in their rooms
CREATE POLICY "Room owners can view all notes"
    ON notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM rooms
            WHERE rooms.id = notes.room_id
            AND rooms.owner_id = auth.uid()
        )
    );

-- 3. Anyone can insert notes in public rooms (for collaboration)
CREATE POLICY "Anyone can add notes to public rooms"
    ON notes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM rooms
            WHERE rooms.id = notes.room_id
            AND rooms.is_public = true
        )
    );

-- 4. Room owners can insert notes
CREATE POLICY "Room owners can add notes"
    ON notes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM rooms
            WHERE rooms.id = notes.room_id
            AND rooms.owner_id = auth.uid()
        )
    );

-- 5. Anyone can update notes in public rooms
CREATE POLICY "Anyone can update notes in public rooms"
    ON notes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM rooms
            WHERE rooms.id = notes.room_id
            AND rooms.is_public = true
        )
    );

-- 6. Room owners can update notes
CREATE POLICY "Room owners can update notes"
    ON notes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM rooms
            WHERE rooms.id = notes.room_id
            AND rooms.owner_id = auth.uid()
        )
    );

-- 7. Room owners can delete notes
CREATE POLICY "Room owners can delete notes"
    ON notes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM rooms
            WHERE rooms.id = notes.room_id
            AND rooms.owner_id = auth.uid()
        )
    );

-- ============================================
-- 3. EDGES TABLE (connections between notes)
-- ============================================
CREATE TABLE IF NOT EXISTS edges (
    id TEXT PRIMARY KEY,
    room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;

-- Policies for edges (same as notes)
CREATE POLICY "Edges in public rooms are viewable"
    ON edges FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM rooms
            WHERE rooms.id = edges.room_id
            AND rooms.is_public = true
        )
    );

CREATE POLICY "Room owners can view edges"
    ON edges FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM rooms
            WHERE rooms.id = edges.room_id
            AND rooms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can add edges to public rooms"
    ON edges FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM rooms
            WHERE rooms.id = edges.room_id
            AND rooms.is_public = true
        )
    );

CREATE POLICY "Room owners can manage edges"
    ON edges FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM rooms
            WHERE rooms.id = edges.room_id
            AND rooms.owner_id = auth.uid()
        )
    );

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notes_room_id ON notes(room_id);
CREATE INDEX IF NOT EXISTS idx_edges_room_id ON edges(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_owner_id ON rooms(owner_id);

-- ============================================
-- 5. UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
