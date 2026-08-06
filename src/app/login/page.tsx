import { signIn } from "@/lib/data/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-xs bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
        <div className="text-3xl mb-2">📦</div>
        <h1 className="text-lg font-semibold text-slate-900 mb-1">Ønsketransporten</h1>
        <p className="text-sm text-slate-500 mb-6">Skriv inn PIN-koden for å logge inn.</p>

        {error && (
          <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-left">
            {decodeURIComponent(error)}
          </p>
        )}

        <form action={signIn} className="flex flex-col items-center gap-4">
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            required
            placeholder="PIN-kode"
            autoFocus
            className="w-full text-center text-xl tracking-[0.5em] border border-slate-300 rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button className="w-full bg-slate-900 text-white rounded-md py-2.5 text-sm font-medium hover:bg-slate-800">
            Logg inn
          </button>
        </form>
      </div>
    </div>
  );
}
