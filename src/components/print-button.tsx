"use client";

export function PrintButton({ className }: { className?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className={
        className ??
        "no-print bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800"
      }
    >
      🖨️ Skriv ut
    </button>
  );
}
