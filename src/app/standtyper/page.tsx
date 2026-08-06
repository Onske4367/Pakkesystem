import Link from "next/link";
import { getStandTypes } from "@/lib/data/queries";
import { createStandType, deleteStandType } from "@/lib/data/actions";

export default async function StandTypesPage() {
  const standTypes = await getStandTypes();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Standtyper</h1>
        <p className="text-sm text-slate-500 mt-1">
          Fysisk standstørrelse (f.eks. Stand 3x3, Stand 3x6, Annen stand). Ikke å forveksle med{" "}
          <Link href="/hovedelementer" className="text-blue-700 hover:underline">
            Hovedelement
          </Link>{" "}
          (hva som selges/gjøres på standen, f.eks. Sukkerspinn).
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Ny standtype</h2>
        <form action={createStandType} className="flex gap-3">
          <input
            name="name"
            placeholder="F.eks. Stand 3x3"
            required
            className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1"
          />
          <button className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800">
            Opprett
          </button>
        </form>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Navn</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {standTypes.map((st) => (
              <tr key={st.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 font-medium">
                  <Link href={`/standtyper/${st.id}`} className="text-blue-700 hover:underline">
                    {st.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-right">
                  <form action={deleteStandType}>
                    <input type="hidden" name="id" value={st.id} />
                    <button className="text-xs text-red-600 hover:underline">Slett</button>
                  </form>
                </td>
              </tr>
            ))}
            {!standTypes.length && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-slate-400">
                  Ingen standtyper opprettet ennå.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
