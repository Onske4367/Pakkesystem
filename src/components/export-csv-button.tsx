"use client";

import * as XLSX from "xlsx";

export type ExportRow = {
  name: string;
  qty: string;
  supplier: string;
  hentetKjopt: boolean;
  pakkesI: string;
  pakket: boolean;
  returnert: boolean;
  rengjort: boolean;
};

export type ExportGroup = {
  label: string | null;
  items: ExportRow[];
};

const COLS = ["Hva", "Mengde", "Kjøpes inn fra", "Hentet/Kjøpt", "Pakkes i", "Pakket", "Returnert", "Rengjort"];

const HEADER_STYLE = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "1E293B" }, patternType: "solid" as const },
};

const COL_HEADER_STYLE = {
  font: { bold: true },
  fill: { fgColor: { rgb: "F1F5F9" }, patternType: "solid" as const },
};

function cell(v: string | number, s?: object): XLSX.CellObject {
  return { v, t: "s", s } as XLSX.CellObject;
}

export function ExportCsvButton({ groups, filename }: { groups: ExportGroup[]; filename: string }) {
  function download() {
    const ws: XLSX.WorkSheet = {};
    let r = 0;

    // Column header row
    COLS.forEach((h, c) => { ws[XLSX.utils.encode_cell({ r, c })] = cell(h, COL_HEADER_STYLE); });
    r++;

    for (const group of groups) {
      if (group.label) {
        // Group header row spanning all columns
        COLS.forEach((_, c) => {
          ws[XLSX.utils.encode_cell({ r, c })] = cell(c === 0 ? group.label! : "", HEADER_STYLE);
        });
        r++;
      }
      for (const row of group.items) {
        const vals = [
          row.name,
          row.qty,
          row.supplier,
          row.hentetKjopt ? "Ja" : "Nei",
          row.pakkesI,
          row.pakket ? "Ja" : "Nei",
          row.returnert ? "Ja" : "Nei",
          row.rengjort ? "Ja" : "Nei",
        ];
        vals.forEach((v, c) => { ws[XLSX.utils.encode_cell({ r, c })] = cell(v); });
        r++;
      }
    }

    ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r - 1, c: COLS.length - 1 } });
    ws["!cols"] = [{ wch: 28 }, { wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];

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
