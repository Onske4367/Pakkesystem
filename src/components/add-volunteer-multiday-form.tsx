"use client";

import { useState, useTransition } from "react";

type ShiftOption = {
  id: string;
  date: string;
  timeFrom: string | null;
  timeTo: string | null;
};

type Props = {
  eventId: string;
  shifts: ShiftOption[];
  action: (formData: FormData) => Promise<void>;
};

export function AddVolunteerMultiDayForm({ eventId, shifts, action }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [times, setTimes] = useState<Record<string, { from: string; to: string }>>({});
  const [isPending, startTransition] = useTransition();

  function toggle(shiftId: string, shift: ShiftOption) {
    const nowSelected = !selected[shiftId];
    setSelected((prev) => ({ ...prev, [shiftId]: nowSelected }));
    if (nowSelected && !times[shiftId]) {
      setTimes((prev) => ({
        ...prev,
        [shiftId]: { from: shift.timeFrom ?? "", to: shift.timeTo ?? "" },
      }));
    }
  }

  const selectedShifts = shifts.filter((s) => selected[s.id]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    selectedShifts.forEach((s) => {
      fd.append("shift_ids[]", s.id);
      fd.set(`time_from_${s.id}`, times[s.id]?.from ?? "");
      fd.set(`time_to_${s.id}`, times[s.id]?.to ?? "");
    });
    startTransition(async () => {
      await action(fd);
      form.reset();
      setSelected({});
      setTimes({});
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="event_id" value={eventId} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="name" placeholder="Navn" required className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
        <input name="phone" placeholder="Telefon" required className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
        <input name="allergi_intoleranse" placeholder="Allergi / intoleranse (valgfri)" className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
        <input name="role" placeholder="Rolle (blank = Generell frivillig)" className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-slate-500">Velg dager og juster klokkeslett ved behov:</p>
        {shifts.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer min-w-[130px]">
              <input
                type="checkbox"
                checked={!!selected[s.id]}
                onChange={() => toggle(s.id, s)}
                className="accent-slate-800"
              />
              <span>{s.date}</span>
            </label>
            {selected[s.id] && (
              <>
                <input
                  type="time"
                  value={times[s.id]?.from ?? ""}
                  onChange={(e) => setTimes((p) => ({ ...p, [s.id]: { ...p[s.id], from: e.target.value } }))}
                  className="border border-slate-300 rounded-md px-2 py-1 text-sm w-28"
                />
                <span className="text-slate-400 text-sm">–</span>
                <input
                  type="time"
                  value={times[s.id]?.to ?? ""}
                  onChange={(e) => setTimes((p) => ({ ...p, [s.id]: { ...p[s.id], to: e.target.value } }))}
                  className="border border-slate-300 rounded-md px-2 py-1 text-sm w-28"
                />
              </>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending || selectedShifts.length === 0}
        className="self-start bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-40"
      >
        {isPending ? "Lagrer…" : `Legg til for ${selectedShifts.length || "valgte"} dag(er)`}
      </button>
    </form>
  );
}
