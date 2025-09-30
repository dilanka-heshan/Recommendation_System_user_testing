-- SQL schema for YouTube Recommendation Analytics in Supabase
-- Execute these commands in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create video_interactions table
CREATE TABLE IF NOT EXISTS video_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  video_id VARCHAR(50), -- YouTube video IDs are typically 11 characters, but allowing more space
  interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('view', 'click', 'select', 'deselect')),
  is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
  session_id VARCHAR(100),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for better query performance
  INDEX idx_video_interactions_user_id (user_id),
  INDEX idx_video_interactions_session_id (session_id),
  INDEX idx_video_interactions_timestamp (timestamp),
  INDEX idx_video_interactions_video_id (video_id),
  INDEX idx_video_interactions_interaction_type (interaction_type)
);

-- Create recommendation_sessions table
CREATE TABLE IF NOT EXISTS recommendation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  session_id VARCHAR(100) UNIQUE,
  recommended_videos JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of video IDs
  selected_videos JSONB NOT NULL DEFAULT '[]'::jsonb,    -- Array of video IDs
  total_recommended INTEGER NOT NULL DEFAULT 0,
  selected_recommended INTEGER NOT NULL DEFAULT 0,
  recommendation_accuracy DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- Percentage with 2 decimal places
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for better query performance
  INDEX idx_recommendation_sessions_user_id (user_id),
  INDEX idx_recommendation_sessions_session_id (session_id),
  INDEX idx_recommendation_sessions_timestamp (timestamp),
  INDEX idx_recommendation_sessions_accuracy (recommendation_accuracy)
);

-- Add comments to tables and columns for documentation
COMMENT ON TABLE video_interactions IS 'Tracks individual user interactions with videos';
COMMENT ON COLUMN video_interactions.user_id IS 'UUID of the user performing the interaction';
COMMENT ON COLUMN video_interactions.video_id IS 'YouTube video ID';
COMMENT ON COLUMN video_interactions.interaction_type IS 'Type of interaction: view, click, select, or deselect';
COMMENT ON COLUMN video_interactions.is_recommended IS 'Whether this video was part of the recommendation set';
COMMENT ON COLUMN video_interactions.session_id IS 'Session identifier to group related interactions';

COMMENT ON TABLE recommendation_sessions IS 'Tracks recommendation accuracy and user selections per session';
COMMENT ON COLUMN recommendation_sessions.user_id IS 'UUID of the user in this session';
COMMENT ON COLUMN recommendation_sessions.session_id IS 'Unique session identifier';
COMMENT ON COLUMN recommendation_sessions.recommended_videos IS 'JSON array of recommended video IDs';
COMMENT ON COLUMN recommendation_sessions.selected_videos IS 'JSON array of video IDs selected by user';
COMMENT ON COLUMN recommendation_sessions.total_recommended IS 'Total number of videos recommended';
COMMENT ON COLUMN recommendation_sessions.selected_recommended IS 'Number of recommended videos that were selected';
COMMENT ON COLUMN recommendation_sessions.recommendation_accuracy IS 'Percentage accuracy of recommendations';

-- Enable Row Level Security (RLS) for data protection
ALTER TABLE video_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (adjust based on your auth requirements)
-- Allow users to read and write their own data
CREATE POLICY "Users can view their own video interactions"
  ON video_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video interactions"
  ON video_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own recommendation sessions"
  ON recommendation_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendation sessions"
  ON recommendation_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically calculate session metrics
CREATE OR REPLACE FUNCTION calculate_session_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total_recommended from array length
  NEW.total_recommended = jsonb_array_length(NEW.recommended_videos);
  
  -- Calculate selected_recommended by counting matches
  NEW.selected_recommended = (
    SELECT COUNT(*)
    FROM jsonb_array_elements_text(NEW.selected_videos) AS selected
    WHERE selected IN (
      SELECT jsonb_array_elements_text(NEW.recommended_videos)
    )
  );
  
  -- Calculate accuracy percentage
  IF NEW.total_recommended > 0 THEN
    NEW.recommendation_accuracy = ROUND(
      (NEW.selected_recommended::decimal / NEW.total_recommended::decimal) * 100, 2
    );
  ELSE
    NEW.recommendation_accuracy = 0.00;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate metrics on insert/update
CREATE TRIGGER trigger_calculate_session_metrics
  BEFORE INSERT OR UPDATE ON recommendation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_metrics();

-- Create view for analytics dashboard (optional but useful)
CREATE OR REPLACE VIEW analytics_summary AS
SELECT 
  rs.user_id,
  COUNT(DISTINCT rs.session_id) as total_sessions,
  AVG(rs.recommendation_accuracy) as avg_accuracy,
  SUM(rs.total_recommended) as total_videos_recommended,
  SUM(rs.selected_recommended) as total_videos_selected,
  COUNT(vi.id) as total_interactions,
  COUNT(DISTINCT vi.video_id) as unique_videos_interacted,
  DATE_TRUNC('day', rs.timestamp) as date
FROM recommendation_sessions rs
LEFT JOIN video_interactions vi ON rs.user_id = vi.user_id AND rs.session_id = vi.session_id
GROUP BY rs.user_id, DATE_TRUNC('day', rs.timestamp)
ORDER BY date DESC;

-- Grant necessary permissions (adjust based on your service role)
GRANT ALL ON video_interactions TO authenticated;
GRANT ALL ON recommendation_sessions TO authenticated;
GRANT SELECT ON analytics_summary TO authenticated;