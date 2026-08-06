import { notFound } from "next/navigation";
import Link from "next/link";
import { getPackingGraph } from "@/lib/data/queries";
import {
  addMandatoryItem,
  createTriggerRule,
  deleteTriggerRule,
  removeMandatoryItem,
  updateMainElementCategory,
} from "@/lib/data/actions";
import { expandEventStand } from "@/lib/packing/expand";
import type { TriggerRule } from "@/lib/types/database";

export default async function MainElementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const graph = await getPackingGraph();
  const mainElement = graph.mainElements.find((s) => s.id === id);
  if (!mainElement) notFound();

  const itemsById = new Map(graph.items.map((i) => [i.id, i]));
  const equipmentUnitsById = new Map(graph.equipmentUnits.map((u) => [u.id, u]));
  const categoriesById = new Map(graph.categories.map((c) => [c.id, c]));

  const mandatoryItems = graph.mainElementMandatoryItems.filter((m) => m.main_element_id === id);

  const relevantRules = graph.triggerRules.filter(
    (r) =>
      r.source_main_element_id === id ||
      (mainElement.category_id && r.source_category_id === mainElement.category_id),
  );

  function sourceLabel(rule: TriggerRule): string {
    if (rule.source_main_element_id) return `Hovedelement: ${mainElement!.name}`;
    if (rule.source_item_id) return `Element: ${itemsById.get(rule.source_item_id)?.name ?? "?"}`;
    if (rule.source_category_id) return `Kategori: ${categoriesById.get(rule.source_category_id)?.name ?? "?"}`;
    return "?";
  }

  function targetLabel(rule: TriggerRule): string {
    if (rule.target_item_id) return `Element: ${itemsById.get(rule.target_item_id)?.name ?? "?"}`;
    if (rule.target_equipment_unit_id)
      return `Utstyrsenhet: ${equipmentUnitsById.get(rule.target_equipment_unit_id)?.name ?? "?"}`;
    return "?";
  }

  const preview = expandEventStand({ mainElementId: id }, graph);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/hovedelementer" className="text-sm text-blue-700 hover:underline">
          ← Hovedelementer
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 mt-1">{mainElement.name}</h1>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Kategori</h2>
        <form action={updateMainElementCategory} className="flex gap-3">
          <input type="hidden" name="main_element_id" value={id} />
          <select
            name="category_id"
            defaultValue={mainElement.category_id ?? ""}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1"
          >
            <option value="">Ingen kategori</option>
            {graph.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="bg-slate-100 text-slate-800 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-200">
            Lagre
          </button>
        </form>
        {preview.requiresHygieneResponsible && (
          <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            ⚠️ Kategori Fødevare: dette hovedelementet krever en navngitt Hygieneansvarlig hver
            gang det settes opp på et arrangement.
          </p>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Obligatoriske elementer</h2>
        <p className="text-xs text-slate-500 mb-3">
          Legges alltid til når dette hovedelementet brukes på et arrangement.
        </p>
        <form action={addMandatoryItem} className="flex flex-wrap gap-3 mb-4">
          <input type="hidden" name="main_element_id" value={id} />
          <select name="item_id" required className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1 min-w-[160px]">
            <option value="">Velg element…</option>
            {graph.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800">
            Legg til
          </button>
        </form>
        <ul className="flex flex-wrap gap-2">
          {mandatoryItems.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1 text-sm"
            >
              {itemsById.get(m.item_id)?.name ?? "?"}
              <form action={removeMandatoryItem}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="main_element_id" value={id} />
                <button className="text-red-600 text-xs">✕</button>
              </form>
            </li>
          ))}
          {!mandatoryItems.length && <p className="text-slate-400 text-sm">Ingen ennå.</p>}
        </ul>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Trigger-regler</h2>
        <p className="text-xs text-slate-500 mb-3">
          Å velge en kilde (dette hovedelementet, et element, eller en kategori) legger automatisk
          til målet (et element eller en hel utstyrsenhet) i pakkelisten.
        </p>
        <form action={createTriggerRule} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <input type="hidden" name="return_to_main_element_id" value={id} />
          <div className="flex gap-2">
            <select name="source_type" defaultValue="main_element" className="border border-slate-300 rounded-md px-2 py-2 text-sm">
              <option value="main_element">Hovedelement</option>
              <option value="item">Element</option>
              <option value="category">Kategori</option>
            </select>
            <select name="source_id" defaultValue={id} className="border border-slate-300 rounded-md px-2 py-2 text-sm flex-1">
              <option value={id}>{mainElement.name} (denne)</option>
              {graph.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
              {graph.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <select name="target_type" defaultValue="item" className="border border-slate-300 rounded-md px-2 py-2 text-sm">
              <option value="item">Element</option>
              <option value="equipment_unit">Utstyrsenhet</option>
            </select>
            <select name="target_id" className="border border-slate-300 rounded-md px-2 py-2 text-sm flex-1">
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
          </div>
          <button className="sm:col-span-2 bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800">
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
                {sourceLabel(rule)} <span className="text-slate-400">→</span> {targetLabel(rule)}
              </span>
              <form action={deleteTriggerRule}>
                <input type="hidden" name="id" value={rule.id} />
                <input type="hidden" name="return_to_main_element_id" value={id} />
                <button className="text-xs text-red-600 hover:underline">Slett</button>
              </form>
            </li>
          ))}
          {!relevantRules.length && <p className="text-slate-400 text-sm">Ingen regler ennå.</p>}
        </ul>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Forhåndsvisning av full pakkeliste
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
          {!preview.items.length && <p className="text-slate-400 text-sm">Tom pakkeliste.</p>}
        </ul>
      </section>
    </div>
  );
}
