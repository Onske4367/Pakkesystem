import Link from "next/link";
import { getCategories, getMainElements } from "@/lib/data/queries";
import { createMainElement, deleteMainElement } from "@/lib/data/actions";

export default async function MainElementsPage() {
  const [mainElements, categories] = await Promise.all([getMainElements(), getCategories()]);
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "–";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Hovedelementer</h1>
        <p className="text-sm text-slate-500 mt-1">
          Opprett et hovedelement (f.eks. Sukkerspinn, Pinnevaffel) med obligatoriske elementer og
          trigger-regler én gang — brukes deretter automatisk hver gang det settes opp på en stand
          på et arrangement. Ikke å forveksle med{" "}
          <Link href="/standtyper" className="text-blue-700 hover:underline">
            Standtype
          </Link>{" "}
          (fysisk størrelse: Stand 3x3, Stand 3x6, Annen stand).
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Nytt hovedelement</h2>
        <form action={createMainElement} className="flex flex-wrap gap-3">
          <input
            name="name"
            placeholder="F.eks. Sukkerspinn"
            required
            className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1 min-w-[160px]"
          />
          <select name="category_id" className="border border-slate-300 rounded-md px-3 py-2 text-sm">
            <option value="">Ingen kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800">
            Opprett
          </button>
        </form>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mainElements.map((me) => (
          <div
            key={me.id}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-400 flex flex-col gap-2"
          >
            <Link href={`/hovedelementer/${me.id}`}>
              <div className="font-medium text-slate-900">{me.name}</div>
              <div className="text-xs text-slate-500 mt-1">Kategori: {categoryName(me.category_id)}</div>
            </Link>
            <form action={deleteMainElement} className="mt-auto pt-1">
              <input type="hidden" name="id" value={me.id} />
              <button className="text-xs text-red-600 hover:underline">Slett</button>
            </form>
          </div>
        ))}
        {!mainElements.length && (
          <p className="text-slate-400 text-sm">Ingen hovedelementer opprettet ennå.</p>
        )}
      </section>
    </div>
  );
}
