ALTER TABLE events ADD COLUMN client_event_id UUID;

-- Backfill pre-existing rows so NOT NULL can be applied. These rows predate
-- client-side IDs, so a random UUID is fine — they'll never match a client retry.
UPDATE events SET client_event_id = gen_random_uuid() WHERE client_event_id IS NULL;

ALTER TABLE events ALTER COLUMN client_event_id SET NOT NULL;
CREATE UNIQUE INDEX idx_events_client_event_id ON events (client_event_id);
