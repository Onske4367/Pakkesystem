"use client";

import { useState } from "react";
import { addEvaluationPoint, deleteEvaluationPoint } from "@/lib/data/actions";
import type { EventEvaluation } from "@/lib/types/database";

export function EventEvaluationSection({
  eventId,
  initialEvaluations,
}: {
  eventId: string;
  initialEvaluations: EventEvaluation[];
}) {
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const point = await addEvaluationPoint(eventId, text.trim());
      setEvaluations((prev) => [...prev, point]);
      setText("");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteEvaluationPoint(id, eventId);
    setEvaluations((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div>
      <ol className="flex flex-col gap-2 mb-3 list-none">
        {evaluations.map((ev, i) => (
          <li
            key={ev.id}
            className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm"
          >
            <span className="text-slate-400 shrink-0 font-medium w-5">{i + 1}.</span>
            <span className="flex-1 leading-snug">{ev.text}</span>
            <button
              onClick={() => handleDelete(ev.id)}
              className="text-xs text-red-600 hover:underline shrink-0 mt-0.5"
            >
              Slett
            </button>
          </li>
        ))}
        {!evaluations.length && (
          <p className="text-slate-400 text-sm">Ingen evalueringspunkter ennå.</p>
        )}
      </ol>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Skriv et evalueringspunkt…"
          className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-slate-900 text-white rounded-md px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50 shrink-0"
        >
          {loading ? "…" : "Legg til"}
        </button>
      </form>
    </div>
  );
}
