import { getCategories, getItems } from "@/lib/data/queries";
import { createCategory, createItem, deleteItem, updateItemField } from "@/lib/data/actions";
import { EditableField } from "@/components/editable-field";

const UNIT_SUGGESTIONS = ["stk", "pakke", "boks", "rull", "flaske", "liter", "kg", "meter", "sett", "par"];

export default async function ItemsPage() {
  const [items, categories] = await Promise.all([getItems(), getCategories()]);
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "–";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Elementer</h1>
        <p className="text-sm text-slate-500 mt-1">
          Utstyr og forbruksvarer som inngår i standtyper, utstyrsenheter og trigger-regler.
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Nytt element</h2>
        <form action={createItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
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
          <select
            name="category_id"
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Ingen kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="default_min_qty"
            placeholder="Min. antall"
            type="text"
            inputMode="decimal"
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            name="default_supplier"
            placeholder="Kjøpes inn fra"
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            name="unit"
            placeholder="Enhet (stk, pakke...)"
            list="unit-suggestions"
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <button className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800">
            Legg til
          </button>
        </form>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Ny kategori</h2>
        <form action={createCategory} className="flex gap-3">
          <input
            name="name"
            placeholder="F.eks. Fødevare, Drikke, Diverse"
            required
            className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1"
          />
          <button className="bg-slate-100 text-slate-800 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-200">
            Opprett kategori
          </button>
        </form>
      </section>

      <datalist id="unit-suggestions">
        {UNIT_SUGGESTIONS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      <section className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Navn</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Kategori</th>
              <th className="px-4 py-2">Min. antall</th>
              <th className="px-4 py-2">Enhet</th>
              <th className="px-4 py-2">Leverandør</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 font-medium">{item.name}</td>
                <td className="px-4 py-2">
                  {item.kind === "consumable" ? "Forbruksvare" : "Utstyr"}
                </td>
                <td className="px-4 py-2">{categoryName(item.category_id)}</td>
                <td className="px-4 py-2 w-28">
                  <EditableField
                    action={updateItemField}
                    id={item.id}
                    field="default_min_qty"
                    type="text"
                    defaultValue={item.default_min_qty?.toString() ?? ""}
                    placeholder="–"
                  />
                </td>
                <td className="px-4 py-2 w-32">
                  <EditableField
                    action={updateItemField}
                    id={item.id}
                    field="unit"
                    defaultValue={item.unit ?? ""}
                    placeholder="stk, liter…"
                    list="unit-suggestions"
                  />
                </td>
                <td className="px-4 py-2">{item.default_supplier ?? "–"}</td>
                <td className="px-4 py-2 text-right">
                  <form action={deleteItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="text-xs text-red-600 hover:underline">Slett</button>
                  </form>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Ingen elementer ennå.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
