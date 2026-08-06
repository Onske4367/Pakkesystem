"use client";

type Row = {
  group: string;
  name: string;
  qty: string;
  supplier: string;
  hentetKjopt: boolean;
  pakkesI: string;
  pakket: boolean;
  returnert: boolean;
  rengjort: boolean;
};

function escape(val: string) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function ExportCsvButton({ rows, filename }: { rows: Row[]; filename: string }) {
  function download() {
    const header = ["Gruppe", "Hva", "Mengde", "Kjøpes inn fra", "Hentet/Kjøpt", "Pakkes i", "Pakket", "Returnert", "Rengjort"];
    const lines = [
      header.map(escape).join(","),
      ...rows.map((r) =>
        [
          r.group,
          r.name,
          r.qty,
          r.supplier,
          r.hentetKjopt ? "Ja" : "Nei",
          r.pakkesI,
          r.pakket ? "Ja" : "Nei",
          r.returnert ? "Ja" : "Nei",
          r.rengjort ? "Ja" : "Nei",
        ]
          .map(escape)
          .join(","),
      ),
    ];
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="no-print bg-slate-100 text-slate-800 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-200"
    >
      ⬇ Eksporter CSV
    </button>
  );
}
