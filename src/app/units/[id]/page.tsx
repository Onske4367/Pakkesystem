import { notFound } from "next/navigation";
import Link from "next/link";
import { getPackingGraph } from "@/lib/data/queries";
import {
  addEquipmentUnitItem,
  createTriggerRule,
  deleteTriggerRule,
  removeEquipmentUnitItem,
  renameEquipmentUnit,
  updateEquipmentUnitItemQty,
} from "@/lib/data/actions";
import { EditableText } from "@/components/editable-text";
import { EditableField } from "@/components/editable-field";
import type { TriggerRule } from "@/lib/types/database";

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const graph = await getPackingGraph();
  const unit = graph.equipmentUnits.find((u) => u.id === id);
  if (!unit) notFound();

  const links = graph.equipmentUnitItems.filter((l) => l.equipment_unit_id === id);
  const itemsById = new Map(graph.items.map((i) => [i.id, i]));
  const mainElementsById = new Map(graph.mainElements.map((m) => [m.id, m]));
  const standTypesById = new Map(graph.standTypes.map((s) => [s.id, s]));
  const categoriesById = new Map(graph.categories.map((c) => [c.id, c]));
  const equipmentUnitsById = new Map(graph.equipmentUnits.map((u) => [u.id, u]));

  const rulesTriggeringThisUnit = graph.triggerRules.filter((r) => r.target_equipment_unit_id === id);

  function sourceLabel(rule: TriggerRule): string {
    if (rule.source_main_element_id)
      return `Hovedelement: ${mainElementsById.get(rule.source_main_element_id)?.name ?? "?"}`;
    if (rule.source_stand_type_id)
      return `Standtype: ${standTypesById.get(rule.source_stand_type_id)?.name ?? "?"}`;
    if (rule.source_item_id) return `Element: ${itemsById.get(rule.source_item_id)?.name ?? "?"}`;
    if (rule.source_category_id)
      return `Kategori: ${categoriesById.get(rule.source_category_id)?.name ?? "?"}`;
    if (rule.source_equipment_unit_id)
      return `Utstyrsenhet: ${equipmentUnitsById.get(rule.source_equipment_unit_id)?.name ?? "?"}`;
    return "?";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href="/units" className="text-sm text-blue-700 hover:underline">
            ← Utstyrsenheter
          </Link>
          <EditableText
            action={renameEquipmentUnit}
            id={unit.id}
            defaultValue={unit.name}
            className="block text-xl font-semibold text-slate-900 mt-1 border border-transparent hover:border-slate-300 focus:border-slate-400 rounded-md px-2 py-1 -mx-2"
          />
        </div>
        <Link
          href={`/units/${unit.id}/etikett`}
          target="_blank"
          className="shrink-0 text-sm bg-slate-100 text-slate-800 rounded-md px-3 py-2 hover:bg-slate-200"
        >
          🖨️ Skriv ut etikett
        </Link>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Legg til element</h2>
        <form action={addEquipmentUnitItem} className="flex flex-wrap gap-3">
          <input type="hidden" name="equipment_unit_id" value={id} />
          <select name="item_id" required className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1 min-w-[160px]">
            <option value="">Velg element…</option>
            {graph.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <input
            name="min_qty"
            placeholder="Minimum"
            inputMode="decimal"
            className="border border-slate-300 rounded-md px-3 py-2 text-sm w-32"
          />
          <button className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800">
            Legg til
          </button>
        </form>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Element</th>
              <th className="px-4 py-2">Minimum</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 font-medium">{itemsById.get(link.item_id)?.name ?? "–"}</td>
                <td className="px-4 py-2 w-40">
                  <div className="flex items-center gap-2">
                    <EditableField
                      action={updateEquipmentUnitItemQty}
                      id={link.id}
                      field="value"
                      defaultValue={link.min_qty?.toString() ?? ""}
                      placeholder="Antall"
                      extraFields={{ equipment_unit_id: id }}
                      className="border border-slate-300 rounded-md px-2 py-1 text-sm w-20"
                    />
                    {itemsById.get(link.item_id)?.unit && (
                      <span className="text-xs text-slate-500">{itemsById.get(link.item_id)?.unit}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-right">
                  <form action={removeEquipmentUnitItem}>
                    <input type="hidden" name="id" value={link.id} />
                    <input type="hidden" name="equipment_unit_id" value={id} />
                    <button className="text-xs text-red-600 hover:underline">Fjern</button>
                  </form>
                </td>
              </tr>
            ))}
            {!links.length && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Ingen elementer i denne enheten ennå.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Legges til automatisk når…</h2>
        <p className="text-xs text-slate-500 mb-3">
          Denne utstyrsenheten legges automatisk til i pakkelisten når kilden under velges — f.eks.
          en standtype, et hovedelement, en kategori, eller at en annen utstyrsenhet trigges.
        </p>
        <form action={createTriggerRule} className="flex flex-wrap gap-3 mb-4">
          <input type="hidden" name="return_to_equipment_unit_id" value={id} />
          <input type="hidden" name="target_type" value="equipment_unit" />
          <input type="hidden" name="target_id" value={id} />
          <select name="source_type" defaultValue="stand_type" className="border border-slate-300 rounded-md px-2 py-2 text-sm">
            <option value="stand_type">Standtype</option>
            <option value="main_element">Hovedelement</option>
            <option value="category">Kategori</option>
            <option value="item">Element</option>
            <option value="equipment_unit">Utstyrsenhet</option>
          </select>
          <select name="source_id" className="border border-slate-300 rounded-md px-2 py-2 text-sm flex-1 min-w-[160px]">
            {graph.standTypes.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
            {graph.mainElements.map((me) => (
              <option key={me.id} value={me.id}>
                {me.name}
              </option>
            ))}
            {graph.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            {graph.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
            {graph.equipmentUnits
              .filter((u) => u.id !== id)
              .map((u) => (
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
          {rulesTriggeringThisUnit.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm"
            >
              <span>
                {sourceLabel(rule)} <span className="text-slate-400">→</span> {unit.name}
              </span>
              <form action={deleteTriggerRule}>
                <input type="hidden" name="id" value={rule.id} />
                <input type="hidden" name="return_to_equipment_unit_id" value={id} />
                <button className="text-xs text-red-600 hover:underline">Slett</button>
              </form>
            </li>
          ))}
          {!rulesTriggeringThisUnit.length && <p className="text-slate-400 text-sm">Ingen regler ennå.</p>}
        </ul>
      </section>
    </div>
  );
}
