import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCategories,
  getEquipmentUnits,
  getEvent,
  getEventStand,
  getEventStandItems,
  getItems,
  getMainElements,
  getShiftsForEvent,
  getStandTypes,
} from "@/lib/data/queries";
import {
  addEquipmentUnitToStand,
  addEventStandItem,
  createAndAddEventStandItem,
  removeEventStandItem,
  updateEventStandItem,
  updateEventStandItemsGroupField,
  updateHygieneResponsible,
} from "@/lib/data/actions";
import { GroupToggleCheckbox, InlineTextField, ToggleCheckbox } from "@/components/packing-fields";
import { PrintButton } from "@/components/print-button";
import { ExportCsvButton, type ExportGroup } from "@/components/export-csv-button";
import type { EventStandItem, Item } from "@/lib/types/database";

/**
 * Rød til hentet/kjøpt, gul til pakket+pakkes i er fylt ut (da grønn), og
 * gul igjen ved retur til rengjort er utført (da grønn igjen).
 */
function rowStatus(si: EventStandItem): "red" | "yellow" | "green" {
  if (!si.hentet_kjopt) return "red";
  if (si.returnert) return si.rengjort ? "green" : "yellow";
  return si.pakket && si.pakkes_i?.trim() ? "green" : "yellow";
}

const ROW_STATUS_CLASSES: Record<ReturnType<typeof rowStatus>, string> = {
  red: "bg-red-50",
  yellow: "bg-amber-50",
  green: "bg-green-50",
};

function PackingRow({ si, item, standId }: { si: EventStandItem; item: Item | undefined; standId: string }) {
  return (
    <tr className={`border-b border-slate-100 last:border-0 ${ROW_STATUS_CLASSES[rowStatus(si)]}`}>
      <td className="px-3 py-2 font-medium">
        {item?.name ?? "?"}
        {!si.qty_confirmed && <span className="ml-2 text-xs text-amber-700">bekreft antall</span>}
      </td>
      <td className="px-3 py-2 w-32">
        <InlineTextField
          action={updateEventStandItem}
          id={si.id}
          eventStandId={standId}
          field="qty"
          defaultValue={si.qty?.toString() ?? ""}
          placeholder={item?.unit ?? "antall"}
        />
      </td>
      <td className="px-3 py-2 w-40">
        <InlineTextField
          action={updateEventStandItem}
          id={si.id}
          eventStandId={standId}
          field="supplier"
          defaultValue={si.supplier ?? ""}
        />
      </td>
      <td className="px-3 py-2 text-center">
        <ToggleCheckbox action={updateEventStandItem} id={si.id} eventStandId={standId} field="hentet_kjopt" defaultChecked={si.hentet_kjopt} />
      </td>
      <td className="px-3 py-2 w-32">
        <InlineTextField
          action={updateEventStandItem}
          id={si.id}
          eventStandId={standId}
          field="pakkes_i"
          defaultValue={si.pakkes_i ?? ""}
        />
      </td>
      <td className="px-3 py-2 text-center">
        <ToggleCheckbox action={updateEventStandItem} id={si.id} eventStandId={standId} field="pakket" defaultChecked={si.pakket} />
      </td>
      <td className="px-3 py-2 text-center">
        <ToggleCheckbox action={updateEventStandItem} id={si.id} eventStandId={standId} field="returnert" defaultChecked={si.returnert} />
      </td>
      <td className="px-3 py-2 text-center">
        <ToggleCheckbox action={updateEventStandItem} id={si.id} eventStandId={standId} field="rengjort" defaultChecked={si.rengjort} />
      </td>
      <td className="px-3 py-2 text-right">
        <form action={removeEventStandItem}>
          <input type="hidden" name="id" value={si.id} />
          <input type="hidden" name="event_stand_id" value={standId} />
          <button className="text-xs text-red-600 hover:underline">Fjern</button>
        </form>
      </td>
    </tr>
  );
}

export default async function PakkelistePage({
  params,
}: {
  params: Promise<{ id: string; standId: string }>;
}) {
  const { id: eventId, standId } = await params;
  const [event, eventStand] = await Promise.all([getEvent(eventId), getEventStand(standId)]);
  if (!event || !eventStand || eventStand.event_id !== eventId) notFound();

  const [items, standTypes, mainElements, categories, equipmentUnits, standItems, shifts] = await Promise.all([
    getItems(),
    getStandTypes(),
    getMainElements(),
    getCategories(),
    getEquipmentUnits(),
    getEventStandItems(standId),
    getShiftsForEvent(eventId),
  ]);
  const standType = eventStand.stand_type_id
    ? standTypes.find((s) => s.id === eventStand.stand_type_id)
    : undefined;
  const mainElement = mainElements.find((s) => s.id === eventStand.main_element_id);
  const category = mainElement?.category_id
    ? categories.find((c) => c.id === mainElement.category_id)
    : undefined;
  const requiresHygieneResponsible = category?.name.trim().toLowerCase() === "fødevare";
  const itemsById = new Map(items.map((i) => [i.id, i]));
  const equipmentUnitsById = new Map(equipmentUnits.map((u) => [u.id, u]));

  const missingResponsible = shifts.filter((s) => !s.stand_responsible_name?.trim());
  const usedItemIds = new Set(standItems.map((si) => si.item_id));
  const addableItems = items.filter((item) => !usedItemIds.has(item.id));
  const usedUnitIds = new Set(standItems.map((si) => si.source_equipment_unit_id).filter(Boolean));
  const addableUnits = equipmentUnits.filter((u) => !usedUnitIds.has(u.id));

  // Grupper pakkelisten under en kategorioverskrift per utstyrsenhet elementene kom fra.
  const ungrouped = standItems.filter((si) => !si.source_equipment_unit_id);
  const groupedUnitIds = [...new Set(standItems.map((si) => si.source_equipment_unit_id).filter(Boolean))] as string[];
  const groups: { label: string | null; unitId: string | null; items: EventStandItem[] }[] = [
    ...(ungrouped.length
      ? [{ label: groupedUnitIds.length ? "Øvrige elementer" : null, unitId: null, items: ungrouped }]
      : []),
    ...groupedUnitIds.map((unitId) => ({
      label: equipmentUnitsById.get(unitId)?.name ?? "Ukjent enhet",
      unitId,
      items: standItems.filter((si) => si.source_equipment_unit_id === unitId),
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/events/${eventId}`} className="text-sm text-blue-700 hover:underline no-print">
            ← {event.name}
          </Link>
          <h1 className="text-xl font-semibold text-slate-900 mt-1">
            Pakkeliste –{" "}
            {eventStand.name_override ??
              [standType?.name, mainElement?.name].filter(Boolean).join(" · ") ??
              "Stand"}
          </h1>
          <p className="print-only text-sm text-slate-500 mt-0.5">{event.name}</p>
        </div>
        <div className="flex gap-2 shrink-0 no-print">
          <ExportCsvButton
            filename={`pakkeliste-${event.name.replace(/\s+/g, "-").toLowerCase()}`}
            groups={groups.map((g): ExportGroup => ({
              label: g.label,
              items: g.items.map((si) => ({
                name: itemsById.get(si.item_id)?.name ?? "?",
                qty: si.qty?.toString() ?? "",
                supplier: si.supplier ?? "",
                hentetKjopt: si.hentet_kjopt,
                pakkesI: si.pakkes_i ?? "",
                pakket: si.pakket,
                returnert: si.returnert,
                rengjort: si.rengjort,
              })),
            }))}
          />
          <PrintButton />
        </div>
      </div>

      {requiresHygieneResponsible && (
        <section
          className={`border rounded-xl p-4 ${
            eventStand.hygiene_responsible_name?.trim()
              ? "bg-white border-slate-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            🧼 Hygieneansvarlig <span className="font-normal text-slate-400">(kreves — kategori Fødevare)</span>
          </h2>
          <InlineTextField
            action={updateHygieneResponsible}
            id={eventStand.id}
            eventStandId={eventStand.id}
            field="hygiene_responsible_name"
            defaultValue={eventStand.hygiene_responsible_name ?? ""}
            placeholder="Navn på hygieneansvarlig"
            className="border border-slate-300 rounded-md px-3 py-2 text-sm w-full sm:w-80"
          />
        </section>
      )}

      {missingResponsible.length > 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          ⚠️ {missingResponsible.length} vakt(er) mangler Standansvarlig. Sett dette på{" "}
          <Link href={`/events/${eventId}`} className="underline">
            arrangementssiden
          </Link>
          .
        </p>
      )}

      <section className="no-print bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Legg til utstyrsenhet</h2>
        <form action={addEquipmentUnitToStand} className="flex flex-wrap gap-3">
          <input type="hidden" name="event_stand_id" value={standId} />
          <select name="equipment_unit_id" required className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1 min-w-[160px]">
            <option value="">Velg utstyrsenhet…</option>
            {addableUnits.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <button className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800">
            Legg til enhet
          </button>
        </form>
        {!addableUnits.length && (
          <p className="text-xs text-slate-400 mt-2">Alle tilgjengelige utstyrsenheter er allerede lagt til.</p>
        )}
      </section>

      <section className="no-print bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Legg til frittstående element</h2>
        <form action={addEventStandItem} className="flex flex-wrap gap-3">
          <input type="hidden" name="event_stand_id" value={standId} />
          <select name="item_id" required className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1 min-w-[160px]">
            <option value="">Velg element…</option>
            {addableItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800">
            Legg til
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            …eller opprett et helt nytt element
          </h3>
          <form action={createAndAddEventStandItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input type="hidden" name="event_stand_id" value={standId} />
            <input
              name="name"
              placeholder="Navn (f.eks. Motor, Sukker)"
              required
              className="border border-slate-300 rounded-md px-3 py-2 text-sm lg:col-span-2"
            />
            <select name="kind" className="border border-slate-300 rounded-md px-3 py-2 text-sm">
              <option value="equipment">Utstyr</option>
              <option value="consumable">Forbruksvare</option>
            </select>
            <input
              name="default_min_qty"
              placeholder="Min. antall"
              type="text"
              inputMode="decimal"
              className="border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
            <input
              name="unit"
              placeholder="Enhet (stk, liter…)"
              list="unit-suggestions"
              className="border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
            <input
              name="default_supplier"
              placeholder="Kjøpes inn fra"
              className="border border-slate-300 rounded-md px-3 py-2 text-sm lg:col-span-2"
            />
            <button className="bg-slate-100 text-slate-800 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-200">
              Opprett og legg til
            </button>
          </form>
          <datalist id="unit-suggestions">
            {["stk", "pakke", "boks", "rull", "flaske", "liter", "kg", "meter", "sett", "par"].map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-3 py-2">Hva</th>
              <th className="px-3 py-2">Mengde</th>
              <th className="px-3 py-2">Kjøpes inn fra</th>
              <th className="px-3 py-2 text-center">Hentet/Kjøpt</th>
              <th className="px-3 py-2">Pakkes i</th>
              <th className="px-3 py-2 text-center">Pakket</th>
              <th className="px-3 py-2 text-center">Returnert</th>
              <th className="px-3 py-2 text-center">Rengjort</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          {groups.map((group, gi) => (
            <tbody key={group.label ?? `group-${gi}`}>
              {group.label && (
                <tr className="bg-slate-800">
                  <td colSpan={3} className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                    {group.label}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <GroupToggleCheckbox
                      action={updateEventStandItemsGroupField}
                      eventStandId={standId}
                      sourceEquipmentUnitId={group.unitId}
                      field="hentet_kjopt"
                      title="Kryss av Hentet/Kjøpt for alle i denne enheten"
                    />
                  </td>
                  <td className="px-3 py-1.5" />
                  <td className="px-3 py-1.5 text-center">
                    <GroupToggleCheckbox
                      action={updateEventStandItemsGroupField}
                      eventStandId={standId}
                      sourceEquipmentUnitId={group.unitId}
                      field="pakket"
                      title="Kryss av Pakket for alle i denne enheten"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <GroupToggleCheckbox
                      action={updateEventStandItemsGroupField}
                      eventStandId={standId}
                      sourceEquipmentUnitId={group.unitId}
                      field="returnert"
                      title="Kryss av Returnert for alle i denne enheten"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <GroupToggleCheckbox
                      action={updateEventStandItemsGroupField}
                      eventStandId={standId}
                      sourceEquipmentUnitId={group.unitId}
                      field="rengjort"
                      title="Kryss av Rengjort for alle i denne enheten"
                    />
                  </td>
                  <td className="px-3 py-1.5" />
                </tr>
              )}
              {group.items.map((si) => (
                <PackingRow key={si.id} si={si} item={itemsById.get(si.item_id)} standId={standId} />
              ))}
            </tbody>
          ))}
          {!standItems.length && (
            <tbody>
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                  Ingen elementer generert.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </section>
    </div>
  );
}
