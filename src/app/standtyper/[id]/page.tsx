import { notFound } from "next/navigation";
import Link from "next/link";
import { getPackingGraph } from "@/lib/data/queries";
import { createTriggerRule, deleteTriggerRule } from "@/lib/data/actions";
import { expandEventStand } from "@/lib/packing/expand";
import type { TriggerRule } from "@/lib/types/database";

export default async function StandTypeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const graph = await getPackingGraph();
  const standType = graph.standTypes.find((s) => s.id === id);
  if (!standType) notFound();

  const itemsById = new Map(graph.items.map((i) => [i.id, i]));
  const equipmentUnitsById = new Map(graph.equipmentUnits.map((u) => [u.id, u]));

  const relevantRules = graph.triggerRules.filter((r) => r.source_stand_type_id === id);

  function targetLabel(rule: TriggerRule): string {
    if (rule.target_item_id) return `Element: ${itemsById.get(rule.target_item_id)?.name ?? "?"}`;
    if (rule.target_equipment_unit_id)
      return `Utstyrsenhet: ${equipmentUnitsById.get(rule.target_equipment_unit_id)?.name ?? "?"}`;
    return "?";
  }

  const preview = expandEventStand({ standTypeId: id }, graph);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/standtyper" className="text-sm text-blue-700 hover:underline">
          ← Standtyper
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 mt-1">{standType.name}</h1>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Trigger-regler</h2>
        <p className="text-xs text-slate-500 mb-3">
          Å velge denne standtypen på et arrangement legger automatisk til målet (et element eller
          en hel utstyrsenhet) i pakkelisten — f.eks. Stand 3x3 → Telt 3x3, eller alle standtyper →
          Strøm enhet.
        </p>
        <form action={createTriggerRule} className="flex flex-wrap gap-3 mb-4">
          <input type="hidden" name="return_to_stand_type_id" value={id} />
          <input type="hidden" name="source_type" value="stand_type" />
          <input type="hidden" name="source_id" value={id} />
          <select name="target_type" defaultValue="equipment_unit" className="border border-slate-300 rounded-md px-2 py-2 text-sm">
            <option value="item">Element</option>
            <option value="equipment_unit">Utstyrsenhet</option>
          </select>
          <select name="target_id" className="border border-slate-300 rounded-md px-2 py-2 text-sm flex-1 min-w-[160px]">
            {graph.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
            {graph.equipmentUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <button className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800">
            Legg til regel
          </button>
        </form>
        <ul className="flex flex-col gap-2">
          {relevantRules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm"
            >
              <span>
                {standType.name} <span className="text-slate-400">→</span> {targetLabel(rule)}
              </span>
              <form action={deleteTriggerRule}>
                <input type="hidden" name="id" value={rule.id} />
                <input type="hidden" name="return_to_stand_type_id" value={id} />
                <button className="text-xs text-red-600 hover:underline">Slett</button>
              </form>
            </li>
          ))}
          {!relevantRules.length && <p className="text-slate-400 text-sm">Ingen regler ennå.</p>}
        </ul>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Forhåndsvisning (kun det denne standtypen genererer)
        </h2>
        <ul className="flex flex-wrap gap-2">
          {preview.items.map(({ item, suggestedQty, needsQtyConfirmation }) => (
            <li key={item.id} className="bg-slate-100 rounded-full px-3 py-1 text-sm">
              {item.name}
              {needsQtyConfirmation && (
                <span className="ml-1 text-xs text-amber-700">(min: {suggestedQty ?? "–"})</span>
              )}
            </li>
          ))}
          {!preview.items.length && <p className="text-slate-400 text-sm">Ingen elementer ennå.</p>}
        </ul>
      </section>
    </div>
  );
}
