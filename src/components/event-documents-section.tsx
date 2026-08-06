"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveEventDocument, deleteEventDocument } from "@/lib/data/actions";
import type { EventDocument } from "@/lib/types/database";

export function EventDocumentsSection({
  eventId,
  initialDocuments,
}: {
  eventId: string;
  initialDocuments: EventDocument[];
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${eventId}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("event-documents")
        .upload(filePath, file);
      if (uploadError) throw new Error(uploadError.message);
      const doc = await saveEventDocument(eventId, filePath, file.name, file.size, file.type);
      setDocuments((prev) => [...prev, doc]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opplasting feilet");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(doc: EventDocument) {
    setError(null);
    try {
      await deleteEventDocument(doc.id, doc.file_path, eventId);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sletting feilet");
    }
  }

  async function handleDownload(doc: EventDocument) {
    const supabase = createClient();
    const { data, error: urlError } = await supabase.storage
      .from("event-documents")
      .createSignedUrl(doc.file_path, 60);
    if (urlError || !data) return;
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div>
      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <ul className="flex flex-col gap-2 mb-3">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm"
          >
            <button
              onClick={() => handleDownload(doc)}
              className="text-blue-700 hover:underline text-left truncate flex-1"
            >
              {doc.name}
            </button>
            <button
              onClick={() => handleDelete(doc)}
              className="text-xs text-red-600 hover:underline ml-3 shrink-0"
            >
              Slett
            </button>
          </li>
        ))}
        {!documents.length && <p className="text-slate-400 text-sm">Ingen dokumenter lastet opp.</p>}
      </ul>

      <label
        className={`inline-flex items-center gap-2 bg-slate-100 text-slate-800 rounded-md px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-200 ${uploading ? "opacity-50 pointer-events-none" : ""}`}
      >
        {uploading ? "Laster opp…" : "Last opp dokument"}
        <input type="file" className="hidden" disabled={uploading} onChange={handleFileChange} />
      </label>
    </div>
  );
}
