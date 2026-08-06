import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getEvent,
  getEventDocuments,
  getEventEvaluations,
  getEventStands,
  getMainElements,
  getShiftsForEvent,
  getStandTypes,
  getVolunteerNeedsForEvent,
  getVolunteerNeedsForShift,
  getVolunteersForNeed,
} from "@/lib/data/queries";
import {
  addEventStand,
  addVolunteer,
  addVolunteerForMultipleShifts,
  createShift,
  createVolunteerNeed,
  createVolunteerNeedForShifts,
  deleteShift,
  deleteVolunteerNeed,
  removeEventStand,
  removeVolunteer,
  updateEvent,
  updateShift,
  updateVolunteerTime,
} from "@/lib/data/actions";
import { ExportVolunteersButton } from "@/components/export-volunteers-button";
import { AddVolunteerMultiDayForm } from "@/components/add-volunteer-multiday-form";
import { EventDocumentsSection } from "@/components/event-documents-section";
import { EventEvaluationSection } from "@/components/event-evaluation-section";
import { EventWeatherSection } from "@/components/event-weather-section";
import type { Shift, Volunteer, VolunteerNeed } from "@/lib/types/database";

function VolunteerNeedBlock({
  need,
  volunteers,
  eventId,
}: {
  need: VolunteerNeed;
  volunteers: Volunteer[];
  eventId: string;
}) {
  const withAllergi = volunteers.filter((v) => v.allergi_intoleranse?.trim());
  return (
    <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">
            {need.role}{" "}
            <span className={volunteers.length >= need.antall_onsket ? "text-green-600" : "text-amber-600"}>
              ({volunteers.length}/{need.antall_onsket})
            </span>
          </span>
          {withAllergi.length > 0 && (
            <span className="ml-2 text-xs bg-orange-100 text-orange-700 rounded px-1.5 py-0.5">
              {withAllergi.length} allergi/intoleranse
            </span>
          )}
        </div>
        <form action={deleteVolunteerNeed}>
          <input type="hidden" name="id" value={need.id} />
          <input type="hidden" name="event_id" value={eventId} />
          <button className="text-xs text-red-600 hover:underline">Slett behov</button>
        </form>
      </div>
      <ul className="mt-2 flex flex-col gap-1">
        {volunteers.map((v) => (
          <li key={v.id} className="text-sm bg-white border border-slate-200 rounded px-2 py-1.5">
            <div className="flex items-start justify-between">
              <span className="flex flex-col">
                <span>
                  {v.name} · {v.phone}
                  {v.role_override && <span className="text-slate-400"> ({v.role_override})</span>}
                </span>
                {v.allergi_intoleranse && (
                  <span className="text-xs text-orange-700 mt-0.5">⚠ {v.allergi_intoleranse}</span>
                )}
              </span>
              <form action={removeVolunteer}>
                <input type="hidden" name="id" value={v.id} />
                <input type="hidden" name="event_id" value={eventId} />
                <button className="text-xs text-red-600 hover:underline mt-0.5">✕</button>
              </form>
            </div>
            <form action={updateVolunteerTime} className="mt-1.5 flex items-center gap-2 flex-wrap">
              <input type="hidden" name="id" value={v.id} />
              <input type="hidden" name="event_id" value={eventId} />
              <input
                name="time_from"
                type="time"
                defaultValue={v.time_from ?? ""}
                className="border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-600 w-24"
              />
              <span className="text-xs text-slate-400">–</span>
              <input
                name="time_to"
                type="time"
                defaultValue={v.time_to ?? ""}
                className="border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-600 w-24"
              />
              <button className="text-xs text-slate-500 hover:text-slate-800 hover:underline">
                Lagre tid
              </button>
            </form>
          </li>
        ))}
      </ul>
      <form action={addVolunteer} className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input type="hidden" name="volunteer_need_id" value={need.id} />
        <input type="hidden" name="event_id" value={eventId} />
        <input name="name" placeholder="Navn" required className="border border-slate-300 rounded-md px-2 py-1 text-sm" />
        <input name="phone" placeholder="Telefon" required className="border border-slate-300 rounded-md px-2 py-1 text-sm" />
        <input name="allergi_intoleranse" placeholder="Allergi / intoleranse" className="border border-slate-300 rounded-md px-2 py-1 text-sm" />
        <button className="bg-slate-900 text-white rounded-md px-3 py-1 text-sm hover:bg-slate-800">
          Legg til frivillig
        </button>
      </form>
    </div>
  );
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const [standTypes, mainElements, eventStands, shifts, eventNeeds, documents, evaluations] = await Promise.all([
    getStandTypes(),
    getMainElements(),
    getEventStands(id),
    getShiftsForEvent(id),
    getVolunteerNeedsForEvent(id),
    getEventDocuments(id),
    getEventEvaluations(id),
  ]);

  const shiftNeeds = await Promise.all(shifts.map((s) => getVolunteerNeedsForShift(s.id)));
  const allNeeds = [...eventNeeds, ...shiftNeeds.flat()];
  const volunteersByNeed = new Map<string, Volunteer[]>(
    await Promise.all(
      allNeeds.map(async (need) => [need.id, await getVolunteersForNeed(need.id)] as const),
    ),
  );
  const standTypesById = new Map(standTypes.map((s) => [s.id, s]));
  const mainElementsById = new Map(mainElements.map((s) => [s.id, s]));

  const chevron = (
    <svg className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );

  const totalVolunteers = allNeeds.reduce((sum, n) => sum + (volunteersByNeed.get(n.id)?.length ?? 0), 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-2">
        <Link href="/events" className="text-sm text-blue-700 hover:underline">
          ← Arrangementer
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 mt-1">{event.name}</h1>
      </div>

      {/* ── Arrangementsinfo ─────────────────────────────────────────── */}
      <details open className="group bg-white border border-slate-200 rounded-xl overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-50 list-none [&::-webkit-details-marker]:hidden">
          <span className="text-sm font-semibold text-slate-700">Arrangementsinfo</span>
          {chevron}
        </summary>
        <div className="px-4 pb-4 pt-3 border-t border-slate-100">
          <form action={updateEvent} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="hidden" name="id" value={event.id} />
            <input name="name" defaultValue={event.name} required className="border border-slate-300 rounded-md px-3 py-2 text-sm sm:col-span-2" />
            <input name="arrangement_type" defaultValue={event.arrangement_type ?? ""} placeholder="Arrangementstype" className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
            <div />
            <input name="organizer_name" defaultValue={event.organizer_name ?? ""} placeholder="Kontaktperson arrangør" className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
            <input name="organizer_phone" defaultValue={event.organizer_phone ?? ""} placeholder="Telefon arrangør" className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
            <input name="organizer_email" defaultValue={event.organizer_email ?? ""} placeholder="E-post arrangør" type="email" className="border border-slate-300 rounded-md px-3 py-2 text-sm sm:col-span-2" />
            <label className="text-xs text-slate-500 flex flex-col gap-1">
              Dato fra
              <input name="date_from" type="date" defaultValue={event.date_from ?? ""} className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
            </label>
            <label className="text-xs text-slate-500 flex flex-col gap-1">
              Dato til
              <input name="date_to" type="date" defaultValue={event.date_to ?? ""} className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
            </label>
            <input name="location" defaultValue={event.location ?? ""} placeholder="Sted (f.eks. Arendal) — brukes til værmelding" className="border border-slate-300 rounded-md px-3 py-2 text-sm sm:col-span-2" />
            <textarea name="notes" defaultValue={event.notes ?? ""} placeholder="Notater" className="border border-slate-300 rounded-md px-3 py-2 text-sm sm:col-span-2" />
            <textarea name="important_info" defaultValue={event.important_info ?? ""} placeholder="Viktig informasjon (vises tydelig for teamet)" rows={4} className="border border-amber-300 bg-amber-50 rounded-md px-3 py-2 text-sm sm:col-span-2" />
            <button className="sm:col-span-2 bg-slate-100 text-slate-800 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-200">
              Lagre
            </button>
          </form>
        </div>
      </details>

      {/* ── Stands ───────────────────────────────────────────────────── */}
      <details className="group bg-white border border-slate-200 rounded-xl overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-50 list-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            Stands
            {eventStands.length > 0 && (
              <span className="text-xs font-normal text-slate-400">{eventStands.length} stand{eventStands.length !== 1 ? "s" : ""}</span>
            )}
          </span>
          {chevron}
        </summary>
        <div className="px-4 pb-4 pt-3 border-t border-slate-100">
          <form action={addEventStand} className="flex flex-wrap gap-3 mb-4">
            <input type="hidden" name="event_id" value={id} />
            <select name="stand_type_id" required className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1 min-w-[140px]">
              <option value="">Velg standtype…</option>
              {standTypes.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
            <select name="main_element_id" className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1 min-w-[140px]">
              <option value="">Ingen hovedelement</option>
              {mainElements.map((me) => (
                <option key={me.id} value={me.id}>{me.name}</option>
              ))}
            </select>
            <button className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800">
              Legg til stand og generer pakkeliste
            </button>
          </form>
          <ul className="flex flex-col gap-2">
            {eventStands.map((es) => (
              <li key={es.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                <Link href={`/events/${id}/pakkeliste/${es.id}`} className="text-sm font-medium text-blue-700 hover:underline">
                  {es.name_override ??
                    [standTypesById.get(es.stand_type_id ?? "")?.name, mainElementsById.get(es.main_element_id ?? "")?.name]
                      .filter(Boolean).join(" · ") ??
                    "Stand"}
                </Link>
                <form action={removeEventStand}>
                  <input type="hidden" name="id" value={es.id} />
                  <input type="hidden" name="event_id" value={id} />
                  <button className="text-xs text-red-600 hover:underline">Fjern</button>
                </form>
              </li>
            ))}
            {!eventStands.length && <p className="text-slate-400 text-sm">Ingen stands lagt til ennå.</p>}
          </ul>
        </div>
      </details>

      {/* ── Dokumenter ───────────────────────────────────────────────── */}
      <details className="group bg-white border border-slate-200 rounded-xl overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-50 list-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            Dokumenter
            {documents.length > 0 && (
              <span className="text-xs font-normal text-slate-400">{documents.length}</span>
            )}
          </span>
          {chevron}
        </summary>
        <div className="px-4 pb-4 pt-3 border-t border-slate-100">
          <EventDocumentsSection eventId={id} initialDocuments={documents} />
        </div>
      </details>

      {/* ── Vær ──────────────────────────────────────────────────────── */}
      <details className="group bg-white border border-slate-200 rounded-xl overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-50 list-none [&::-webkit-details-marker]:hidden">
          <span className="text-sm font-semibold text-slate-700">Vær</span>
          {chevron}
        </summary>
        <div className="px-4 pb-4 pt-3 border-t border-slate-100">
          <EventWeatherSection event={event} />
        </div>
      </details>

      {/* ── Evaluering ───────────────────────────────────────────────── */}
      <details className="group bg-white border border-slate-200 rounded-xl overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-50 list-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            Evaluering
            {evaluations.length > 0 && (
              <span className="text-xs font-normal text-slate-400">{evaluations.length} punkt{evaluations.length !== 1 ? "er" : ""}</span>
            )}
          </span>
          {chevron}
        </summary>
        <div className="px-4 pb-4 pt-3 border-t border-slate-100">
          <EventEvaluationSection eventId={id} initialEvaluations={evaluations} />
        </div>
      </details>

      {/* ── Vakter & Frivillige ───────────────────────────────────────── */}
      <details className="group bg-white border border-slate-200 rounded-xl overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-50 list-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            Vakter &amp; frivillige
            {shifts.length > 0 && (
              <span className="text-xs font-normal text-slate-400">
                {shifts.length} vakt{shifts.length !== 1 ? "er" : ""}
                {totalVolunteers > 0 && ` · ${totalVolunteers} frivillige`}
              </span>
            )}
          </span>
          {chevron}
        </summary>
        <div className="border-t border-slate-100 divide-y divide-slate-100">

          {/* Legg til vakt */}
          <div className="px-4 py-4">
            <p className="text-xs text-slate-500 mb-3">Del arrangementet opp i vakter med egen standansvarlig og frivillig-behov.</p>
            <form action={createShift} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input type="hidden" name="event_id" value={id} />
              <input name="shift_date" type="date" required className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
              <input name="time_from" type="time" className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
              <input name="time_to" type="time" className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
              <input name="stand_responsible_name" placeholder="Standansvarlig" className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
              <button className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800">
                Legg til vakt
              </button>
            </form>
          </div>

          {/* Vaktliste */}
          {shifts.length > 0 && (
            <div className="px-4 py-4 flex flex-col gap-4">
              {shifts.map((shift, idx) => (
                <div key={shift.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <form action={updateShift} className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                      <input type="hidden" name="id" value={shift.id} />
                      <input type="hidden" name="event_id" value={id} />
                      <input name="shift_date" type="date" defaultValue={shift.shift_date} required className="border border-slate-300 rounded-md px-2 py-1 text-sm" />
                      <input name="time_from" type="time" defaultValue={shift.time_from ?? ""} className="border border-slate-300 rounded-md px-2 py-1 text-sm" />
                      <input name="time_to" type="time" defaultValue={shift.time_to ?? ""} className="border border-slate-300 rounded-md px-2 py-1 text-sm" />
                      <input name="stand_responsible_name" placeholder="Standansvarlig" defaultValue={shift.stand_responsible_name ?? ""} className="border border-slate-300 rounded-md px-2 py-1 text-sm" />
                      <button className="col-span-2 sm:col-span-4 justify-self-start bg-slate-100 text-slate-800 rounded-md px-3 py-1 text-xs font-medium hover:bg-slate-200">
                        Lagre endringer
                      </button>
                    </form>
                    <form action={deleteShift}>
                      <input type="hidden" name="id" value={shift.id} />
                      <input type="hidden" name="event_id" value={id} />
                      <button className="text-xs text-red-600 hover:underline whitespace-nowrap">Slett vakt</button>
                    </form>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {shiftNeeds[idx].map((need) => (
                      <VolunteerNeedBlock key={need.id} need={need} volunteers={volunteersByNeed.get(need.id) ?? []} eventId={id} />
                    ))}
                    <form action={createVolunteerNeed} className="flex flex-wrap gap-2">
                      <input type="hidden" name="shift_id" value={shift.id} />
                      <input name="role" placeholder="Rolle/ansvar" required className="border border-slate-300 rounded-md px-2 py-1 text-sm flex-1 min-w-[120px]" />
                      <input name="antall_onsket" type="number" min={1} defaultValue={1} className="border border-slate-300 rounded-md px-2 py-1 text-sm w-20" />
                      <button className="bg-slate-100 text-slate-800 rounded-md px-3 py-1 text-sm hover:bg-slate-200">
                        Legg til frivillig-behov for vakten
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!shifts.length && (
            <div className="px-4 py-3">
              <p className="text-slate-400 text-sm">Ingen vakter lagt til ennå.</p>
            </div>
          )}

          {/* Frivillig-behov for hele arrangementet */}
          <div className="px-4 py-4">
            <p className="text-xs font-medium text-slate-600 mb-2">Frivillig-behov for hele arrangementet</p>
            <p className="text-xs text-slate-500 mb-3">Behov som ikke er knyttet til én bestemt vakt.</p>
            <form action={createVolunteerNeed} className="flex flex-wrap gap-2 mb-3">
              <input type="hidden" name="event_id" value={id} />
              <input name="role" placeholder="Rolle/ansvar" required className="border border-slate-300 rounded-md px-2 py-1 text-sm flex-1 min-w-[120px]" />
              <input name="antall_onsket" type="number" min={1} defaultValue={1} className="border border-slate-300 rounded-md px-2 py-1 text-sm w-20" />
              <button className="bg-slate-900 text-white rounded-md px-3 py-1.5 text-sm hover:bg-slate-800">Legg til behov</button>
            </form>
            <div className="flex flex-col gap-2">
              {eventNeeds.map((need) => (
                <VolunteerNeedBlock key={need.id} need={need} volunteers={volunteersByNeed.get(need.id) ?? []} eventId={id} />
              ))}
              {!eventNeeds.length && <p className="text-slate-400 text-sm">Ingen behov ennå.</p>}
            </div>
          </div>

          {/* Verktøy for flere dager (kun synlig hvis det finnes vakter) */}
          {shifts.length > 0 && (
            <div className="px-4 py-4 flex flex-col gap-6">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Legg til frivillig for flere dager</p>
                <p className="text-xs text-slate-500 mb-3">Hak av dagene personen er tilgjengelig. Klokkeslett settes til hele vakten som standard.</p>
                <AddVolunteerMultiDayForm
                  eventId={id}
                  shifts={shifts.map((s) => ({ id: s.id, date: s.shift_date, timeFrom: s.time_from ?? null, timeTo: s.time_to ?? null }))}
                  action={addVolunteerForMultipleShifts}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Legg til rolle for flere dager</p>
                <p className="text-xs text-slate-500 mb-3">Velg hvilke vakter rollen skal gjelde for.</p>
                <form action={createVolunteerNeedForShifts} className="flex flex-col gap-3">
                  <input type="hidden" name="event_id" value={id} />
                  <div className="flex flex-wrap gap-2">
                    {shifts.map((s) => (
                      <label key={s.id} className="flex items-center gap-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 cursor-pointer hover:bg-slate-100">
                        <input type="checkbox" name="shift_ids[]" value={s.id} className="accent-slate-800" />
                        {s.shift_date}
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <input name="role" placeholder="Rolle (f.eks. Lunch / Mat ansvarlig)" required className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1 min-w-[200px]" />
                    <input name="antall_onsket" type="number" min={1} defaultValue={1} className="border border-slate-300 rounded-md px-3 py-2 text-sm w-24" />
                    <button className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800">Legg til for valgte dager</button>
                  </div>
                </form>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Eksporter frivilligliste</p>
                <ExportVolunteersButton
                  eventName={event.name}
                  shifts={shifts.map((s) => ({ id: s.id, date: s.shift_date, timeFrom: s.time_from ?? null, timeTo: s.time_to ?? null, standAnsvarlig: s.stand_responsible_name ?? null }))}
                  needs={allNeeds.map((n) => ({ id: n.id, shiftId: n.shift_id ?? null, role: n.role, antallOnsket: n.antall_onsket }))}
                  volunteers={allNeeds.flatMap((n) =>
                    (volunteersByNeed.get(n.id) ?? []).map((v) => ({
                      needId: n.id, name: v.name, phone: v.phone,
                      allergi: v.allergi_intoleranse ?? null, roleOverride: v.role_override ?? null,
                      timeFrom: v.time_from ?? null, timeTo: v.time_to ?? null,
                    }))
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
