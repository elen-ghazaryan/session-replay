ALTER TABLE events ADD COLUMN client_event_id UUID NOT NULL;
CREATE UNIQUE INDEX idx_events_client_event_id ON events (client_event_id);