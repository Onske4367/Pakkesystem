"use client";

import { useState } from "react";

type ExportShift = {
  id: string;
  date: string;
  timeFrom: string | null;
  timeTo: string | null;
  standAnsvarlig: string | null;
};

type ExportNeed = {
  id: string;
  shiftId: string | null;
  role: string;
  antallOnsket: number;
};

type ExportVolunteer = {
  needId: string;
  name: string;
  phone: string;
  allergi: string | null;
  roleOverride: string | null;
  timeFrom: string | null;
  timeTo: string | null;
};

type Props = {
  eventName: string;
  shifts: ExportShift[];
  needs: ExportNeed[];
  volunteers: ExportVolunteer[];
};

function esc(val: string) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function ExportVolunteersButton({ eventName, shifts, needs, volunteers }: Props) {
  const [selectedShiftId, setSelectedShiftId] = useState<string>("all");

  function buildRows(shiftId: string | "all") {
    const rows: string[][] = [];

    const filteredShifts = shiftId === "all" ? shifts : shifts.filter((s) => s.id === shiftId);

    for (const shift of filteredShifts) {
      const shiftNeeds = needs.filter((n) => n.shiftId === shift.id);
      const timeLabel = [shift.timeFrom, shift.timeTo].filter(Boolean).join("–");

      if (shiftNeeds.length === 0) {
        rows.push([shift.date, timeLabel, shift.standAnsvarlig ?? "", "", "", "", "", "", ""]);
      } else {
        for (const need of shiftNeeds) {
          const needVolunteers = volunteers.filter((v) => v.needId === need.id);
          if (needVolunteers.length === 0) {
            rows.push([
              shift.date, timeLabel, shift.standAnsvarlig ?? "",
              need.role, String(need.antallOnsket), "", "", "", "",
            ]);
          } else {
            for (const v of needVolunteers) {
              const volTime = [v.timeFrom, v.timeTo].filter(Boolean).join("–");
              rows.push([
                shift.date, timeLabel, shift.standAnsvarlig ?? "",
                need.role, String(need.antallOnsket),
                v.name, v.phone, v.allergi ?? "", volTime,
              ]);
            }
          }
        }
      }
    }

    if (shiftId === "all") {
      const eventWideNeeds = needs.filter((n) => n.shiftId === null);
      for (const need of eventWideNeeds) {
        const needVolunteers = volunteers.filter((v) => v.needId === need.id);
        if (needVolunteers.length === 0) {
          rows.push(["(Hele arrangementet)", "", "", need.role, String(need.antallOnsket), "", "", "", ""]);
        } else {
          for (const v of needVolunteers) {
            const volTime = [v.timeFrom, v.timeTo].filter(Boolean).join("–");
            rows.push([
              "(Hele arrangementet)", "", "",
              need.role, String(need.antallOnsket),
              v.name, v.phone, v.allergi ?? "", volTime,
            ]);
          }
        }
      }
    }

    return rows;
  }

  function download() {
    const header = ["Dato", "Tid (vakt)", "Standansvarlig", "Rolle", "Antall ønsket", "Navn", "Telefon", "Allergi/intoleranse", "Tid (frivillig)"];
    const dataRows = buildRows(selectedShiftId);
    const lines = [header, ...dataRows].map((r) => r.map(esc).join(","));
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const label = selectedShiftId === "all"
      ? "alle-dager"
      : shifts.find((s) => s.id === selectedShiftId)?.date ?? selectedShiftId;
    a.download = `frivillige-${eventName.replace(/\s+/g, "-").toLowerCase()}-${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selectedShiftId}
        onChange={(e) => setSelectedShiftId(e.target.value)}
        className="border border-slate-300 rounded-md px-3 py-2 text-sm"
      >
        <option value="all">Alle dager</option>
        {shifts.map((s) => (
          <option key={s.id} value={s.id}>
            {s.date}{s.timeFrom ? ` (${s.timeFrom})` : ""}
          </option>
        ))}
      </select>
      <button
        onClick={download}
        className="bg-slate-100 text-slate-800 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-200"
      >
        ⬇ Eksporter frivilligliste (CSV)
      </button>
    </div>
  );
}
