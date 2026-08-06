"use client";

import * as XLSX from "xlsx";

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

export function ExportCsvButton({ rows, filename }: { rows: Row[]; filename: string }) {
  function download() {
    const header = ["Gruppe", "Hva", "Mengde", "Kjøpes inn fra", "Hentet/Kjøpt", "Pakkes i", "Pakket", "Returnert", "Rengjort"];
    const data = rows.map((r) => [
      r.group,
      r.name,
      r.qty,
      r.supplier,
      r.hentetKjopt ? "Ja" : "Nei",
      r.pakkesI,
      r.pakket ? "Ja" : "Nei",
      r.returnert ? "Ja" : "Nei",
      r.rengjort ? "Ja" : "Nei",
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);

    // Auto column widths
    const colWidths = header.map((h, i) => {
      const maxLen = Math.max(h.length, ...data.map((row) => String(row[i] ?? "").length));
      return { wch: Math.min(maxLen + 2, 40) };
    });
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pakkeliste");

    const xlsxFilename = filename.replace(/\.csv$/, "") + ".xlsx";
    XLSX.writeFile(wb, xlsxFilename);
  }

  return (
    <button
      onClick={download}
      className="no-print bg-slate-100 text-slate-800 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-200"
    >
      ⬇ Eksporter Excel
    </button>
  );
}
