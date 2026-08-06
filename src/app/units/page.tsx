import Link from "next/link";
import { getEquipmentUnitItems, getEquipmentUnits } from "@/lib/data/queries";
import { createEquipmentUnit, deleteEquipmentUnit } from "@/lib/data/actions";

export default async function UnitsPage() {
  const [units, unitItems] = await Promise.all([getEquipmentUnits(), getEquipmentUnitItems()]);
  const countFor = (unitId: string) => unitItems.filter((l) => l.equipment_unit_id === unitId).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Utstyrsenheter</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gjenbrukbare pakker (f.eks. Hygienekasse, Strøm enhet) som kan legges til direkte eller
          trigges automatisk av en standtype eller kategori.
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Ny utstyrsenhet</h2>
        <form action={createEquipmentUnit} className="flex gap-3">
          <input
            name="name"
            placeholder="F.eks. Hygienekasse"
            required
            className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1"
          />
          <button className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800">
            Opprett
          </button>
        </form>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => (
          <div key={unit.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
            <Link href={`/units/${unit.id}`} className="font-medium text-slate-900 hover:underline">
              {unit.name}
            </Link>
            <span className="text-xs text-slate-500">{countFor(unit.id)} element(er)</span>
            <div className="mt-auto flex justify-between items-center pt-2">
              <Link href={`/units/${unit.id}`} className="text-xs text-blue-700 hover:underline">
                Rediger innhold
              </Link>
              <form action={deleteEquipmentUnit}>
                <input type="hidden" name="id" value={unit.id} />
                <button className="text-xs text-red-600 hover:underline">Slett</button>
              </form>
            </div>
          </div>
        ))}
        {!units.length && (
          <p className="text-slate-400 text-sm">Ingen utstyrsenheter opprettet ennå.</p>
        )}
      </section>
    </div>
  );
}
