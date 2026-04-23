-- =============================================
-- KEYDASH — Database Schema
-- Run in Supabase SQL Editor
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_seed INT DEFAULT floor(random() * 10000),
  total_races INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  avg_wpm DECIMAL(6,2) DEFAULT 0,
  best_wpm DECIMAL(6,2) DEFAULT 0,
  avg_accuracy DECIMAL(5,2) DEFAULT 100,
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  trust_score DECIMAL(5,2) DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_profiles_wpm ON profiles(best_wpm DESC);

-- 2. RACE ROOMS
CREATE TABLE race_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard','superhard')),
  word_count INT DEFAULT 20,
  max_players INT DEFAULT 8,
  race_text TEXT NOT NULL,
  phase TEXT DEFAULT 'lobby' CHECK (phase IN ('lobby','countdown','racing','finished')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_rooms_phase ON race_rooms(phase);
CREATE INDEX idx_rooms_code ON race_rooms(code);

-- Auto-generate 6-char room code
CREATE OR REPLACE FUNCTION generate_room_code() RETURNS TRIGGER AS $$
DECLARE chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; result TEXT := ''; i INT;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    FOR i IN 1..6 LOOP result := result || substr(chars, floor(random()*length(chars)+1)::int, 1); END LOOP;
    NEW.code := result;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER before_room_insert BEFORE INSERT ON race_rooms FOR EACH ROW EXECUTE FUNCTION generate_room_code();

-- 3. PARTICIPANTS
CREATE TABLE race_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES race_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id),
  progress DECIMAL(5,4) DEFAULT 0,
  current_wpm DECIMAL(6,2) DEFAULT 0,
  current_word TEXT DEFAULT '',
  final_wpm DECIMAL(6,2),
  final_accuracy DECIMAL(5,2),
  finish_time INT,
  placement INT,
  finished BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, player_id)
);

-- 4. RACE HISTORY
CREATE TABLE race_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES profiles(id),
  room_id UUID REFERENCES race_rooms(id),
  difficulty TEXT NOT NULL,
  wpm DECIMAL(6,2) NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  finish_time INT NOT NULL,
  placement INT NOT NULL,
  player_count INT NOT NULL,
  word_count INT NOT NULL,
  xp_gained INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_history_player ON race_history(player_id, created_at DESC);

-- 5. LEADERBOARD
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID UNIQUE NOT NULL REFERENCES profiles(id),
  username TEXT NOT NULL,
  best_wpm DECIMAL(6,2) NOT NULL,
  avg_wpm DECIMAL(6,2) NOT NULL,
  total_races INT NOT NULL,
  win_rate DECIMAL(5,2) DEFAULT 0,
  level INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_lb_wpm ON leaderboard(best_wpm DESC);

-- 6. AUTO UPDATE STATS
CREATE OR REPLACE FUNCTION update_profile_stats() RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    total_races = total_races + 1,
    total_wins = total_wins + CASE WHEN NEW.placement = 1 THEN 1 ELSE 0 END,
    avg_wpm = (SELECT COALESCE(AVG(wpm),0) FROM race_history WHERE player_id = NEW.player_id),
    best_wpm = GREATEST(best_wpm, NEW.wpm),
    avg_accuracy = (SELECT COALESCE(AVG(accuracy),100) FROM race_history WHERE player_id = NEW.player_id),
    xp = xp + NEW.xp_gained,
    level = GREATEST(1, FLOOR(SQRT((xp + NEW.xp_gained) / 100)) + 1),
    updated_at = NOW()
  WHERE id = NEW.player_id;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER after_history_insert AFTER INSERT ON race_history FOR EACH ROW EXECUTE FUNCTION update_profile_stats();

-- 7. RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_read ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY rooms_read ON race_rooms FOR SELECT USING (true);
CREATE POLICY rooms_create ON race_rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY parts_read ON race_participants FOR SELECT USING (true);
CREATE POLICY parts_write ON race_participants FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY parts_update ON race_participants FOR UPDATE USING (auth.uid() = player_id);
CREATE POLICY hist_read ON race_history FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY hist_write ON race_history FOR INSERT WITH CHECK (auth.uid() = player_id);

-- 8. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE race_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE race_participants;
