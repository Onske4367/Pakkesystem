import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEquipmentUnitItems, getItems } from "@/lib/data/queries";
import { PrintButton } from "@/components/print-button";
import type { EquipmentUnit } from "@/lib/types/database";

export default async function UnitLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: unit } = await supabase
    .from("equipment_units")
    .select("*")
    .eq("id", id)
    .maybeSingle<EquipmentUnit>();
  if (!unit) notFound();

  const [allItems, allLinks] = await Promise.all([getItems(), getEquipmentUnitItems()]);
  const links = allLinks.filter((l) => l.equipment_unit_id === id);
  const itemsById = new Map(allItems.map((i) => [i.id, i]));

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Sidestørrelse for Brother QL-1100 kontinuerlig 103mm-tape. Endre
          papirstørrelse i utskriftsdialogen på maskinen din hvis du bruker en
          annen DK-tape/etikettstørrelse. */}
      <style>{`
        @media print {
          @page { size: 103mm auto; margin: 4mm; }
        }
      `}</style>

      <PrintButton className="no-print bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800" />

      <div
        id="label"
        className="bg-white border border-slate-300 print:border-0 w-[103mm] p-3 text-black"
      >
        <div className="text-[26px] font-bold leading-tight break-words text-center">{unit.name}</div>
        <div className="mt-2 border-t-2 border-black/30 pt-2 flex flex-col gap-1.5">
          {links.map((link) => {
            const item = itemsById.get(link.item_id);
            return (
              <div key={link.id} className="text-[16px] leading-tight flex justify-between gap-3">
                <span className="break-words">{item?.name ?? "?"}</span>
                {link.min_qty != null && (
                  <span className="shrink-0 whitespace-nowrap font-medium">
                    {link.min_qty} {item?.unit ?? ""}
                  </span>
                )}
              </div>
            );
          })}
          {!links.length && <div className="text-[16px] text-slate-500">Ingen elementer</div>}
        </div>
      </div>
    </div>
  );
}
