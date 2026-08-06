import { fetchWeather } from "@/lib/weather";
import type { Event } from "@/lib/types/database";

const DAYS_NO = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
const MONTHS_NO = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return `${DAYS_NO[d.getUTCDay()]} ${d.getUTCDate()}. ${MONTHS_NO[d.getUTCMonth()]}`;
}

export async function EventWeatherSection({ event }: { event: Event }) {
  if (!event.location) {
    return (
      <p className="text-slate-400 text-sm">
        Ingen sted angitt. Legg til sted i <strong className="text-slate-600">Arrangementsinfo</strong> for å se værmelding.
      </p>
    );
  }

  if (!event.date_from) {
    return (
      <p className="text-slate-400 text-sm">
        Legg til dato på arrangementet for å se værmelding.
      </p>
    );
  }

  const forecasts = await fetchWeather(event.location, event.date_from, event.date_to);

  if (!forecasts || forecasts.length === 0) {
    return (
      <p className="text-slate-400 text-sm">
        Ingen værdata tilgjengelig — stedet ble ikke funnet, eller arrangementet er mer enn 10 dager frem i tid.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-col divide-y divide-slate-100">
        {forecasts.map((f) => (
          <div key={f.date} className="flex items-center gap-3 py-2 text-sm">
            <span className="w-36 text-slate-500 shrink-0 text-xs">{formatDate(f.date)}</span>
            <span className="text-xl shrink-0">{f.emoji}</span>
            <span className="text-slate-600 text-xs shrink-0">{f.description}</span>
            <span className="font-medium shrink-0">
              {f.tempMax !== null ? `${Math.round(f.tempMax)}°` : "—"}
            </span>
            {f.tempMin !== null && (
              <span className="text-slate-400 shrink-0">{Math.round(f.tempMin)}°</span>
            )}
            {f.precipitation !== null && f.precipitation > 0 && (
              <span className="text-blue-600 text-xs shrink-0">{f.precipitation} mm</span>
            )}
            {f.windSpeed !== null && (
              <span className="text-slate-400 text-xs shrink-0">{Math.round(f.windSpeed)} m/s</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-2">
        Data fra Yr / Meteorologisk institutt · {event.location}
      </p>
    </div>
  );
}
