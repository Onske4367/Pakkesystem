import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/data/actions";

const LINKS = [
  { href: "/events", label: "Arrangementer" },
  { href: "/hovedelementer", label: "Hovedelementer" },
  { href: "/standtyper", label: "Standtyper" },
  { href: "/items", label: "Elementer" },
  { href: "/units", label: "Utstyrsenheter" },
];

export async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <header className="bg-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-4">
        <Link href="/events" className="font-semibold tracking-tight">
          📦 Ønsketransporten
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-md hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="ml-auto">
          <button className="text-sm px-3 py-1.5 rounded-md hover:bg-white/10">Logg ut</button>
        </form>
      </div>
    </header>
  );
}
