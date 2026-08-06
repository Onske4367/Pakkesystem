-- Add important_info to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS important_info TEXT;

-- Event documents table
CREATE TABLE IF NOT EXISTS event_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  file_size   BIGINT,
  mime_type   TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-documents', 'event-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Autentisert kan laste opp event-dokumenter"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-documents');

CREATE POLICY "Autentisert kan lese event-dokumenter"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'event-documents');

CREATE POLICY "Autentisert kan slette event-dokumenter"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-documents');
