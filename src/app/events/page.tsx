import Link from "next/link";
import { getEvents } from "@/lib/data/queries";
import { createEvent } from "@/lib/data/actions";

function formatDateRange(from: string | null, to: string | null) {
  if (!from && !to) return "Dato ikke satt";
  if (from && to && from !== to) return `${from} – ${to}`;
  return from ?? to ?? "";
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Arrangementer</h1>
        <p className="text-sm text-slate-500 mt-1">
          Opprett et arrangement, legg til stands, vakter og frivillige.
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Nytt arrangement</h2>
        <form action={createEvent} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            name="name"
            placeholder="Navn (f.eks. Arendalsuka 2026)"
            required
            className="border border-slate-300 rounded-md px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="arrangement_type"
            placeholder="Arrangementstype"
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <div />
          <input
            name="organizer_name"
            placeholder="Kontaktperson arrangør"
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            name="organizer_phone"
            placeholder="Telefon arrangør"
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            name="organizer_email"
            placeholder="E-post arrangør"
            type="email"
            className="border border-slate-300 rounded-md px-3 py-2 text-sm sm:col-span-2"
          />
          <label className="text-xs text-slate-500 flex flex-col gap-1">
            Dato fra
            <input name="date_from" type="date" className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-slate-500 flex flex-col gap-1">
            Dato til
            <input name="date_to" type="date" className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
          </label>
          <textarea
            name="notes"
            placeholder="Notater"
            className="border border-slate-300 rounded-md px-3 py-2 text-sm sm:col-span-2"
          />
          <button className="sm:col-span-2 bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800">
            Opprett arrangement
          </button>
        </form>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((ev) => (
          <Link
            key={ev.id}
            href={`/events/${ev.id}`}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-400"
          >
            <div className="font-medium text-slate-900">{ev.name}</div>
            <div className="text-xs text-slate-500 mt-1">{formatDateRange(ev.date_from, ev.date_to)}</div>
            {ev.organizer_name && (
              <div className="text-xs text-slate-500 mt-1">Arrangør: {ev.organizer_name}</div>
            )}
          </Link>
        ))}
        {!events.length && <p className="text-slate-400 text-sm">Ingen arrangementer ennå.</p>}
      </section>
    </div>
  );
}
