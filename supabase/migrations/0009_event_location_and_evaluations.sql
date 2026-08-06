-- Add location field to events (used for weather lookup)
ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT;

-- Evaluation points per event
CREATE TABLE IF NOT EXISTS event_evaluations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  text        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE event_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON event_evaluations
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
