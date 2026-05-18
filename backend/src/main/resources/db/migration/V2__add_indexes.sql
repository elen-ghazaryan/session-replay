CREATE INDEX idx_events_session_id ON events (session_id);
CREATE INDEX idx_events_timestamp  ON events (timestamp);
CREATE INDEX idx_sessions_start_time ON sessions (start_time);
