export interface DayForecast {
  date: string; // YYYY-MM-DD
  emoji: string;
  description: string;
  tempMax: number | null;
  tempMin: number | null;
  precipitation: number | null; // mm total for the day
  windSpeed: number | null; // m/s at noon
}

function symbolEmoji(code: string): string {
  if (code.includes("thunder")) return "⛈";
  if (code.includes("snow") || code.includes("sleet")) return "🌨";
  if (code.includes("heavyrain")) return "🌧";
  if (code.includes("rain") || code.includes("shower")) return "🌦";
  if (code.includes("fog")) return "🌫";
  if (code.startsWith("cloudy")) return "☁️";
  if (code.includes("partlycloudy") || code.includes("fair")) return "⛅";
  if (code.includes("clearsky")) return "☀️";
  return "🌡";
}

function symbolDescription(code: string): string {
  if (code.includes("thunder")) return "Tordenvær";
  if (code.includes("snow")) return "Snø";
  if (code.includes("sleet")) return "Sludd";
  if (code.includes("heavyrain")) return "Kraftig regn";
  if (code.includes("rain") || code.includes("shower")) return "Regn";
  if (code.includes("fog")) return "Tåke";
  if (code.startsWith("cloudy")) return "Overskyet";
  if (code.includes("partlycloudy")) return "Delvis skyet";
  if (code.includes("fair")) return "Lettskyet";
  if (code.includes("clearsky")) return "Klart";
  return "Variabelt";
}

// Returns the list of dates (YYYY-MM-DD) in the range [from, to] inclusive
function dateRange(from: string, to: string | null): string[] {
  const dates: string[] = [];
  const d = new Date(from + "T12:00:00Z");
  const end = new Date((to ?? from) + "T12:00:00Z");
  while (d <= end) {
    dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dates.slice(0, 10); // Met.no goes ~10 days
}

export async function fetchWeather(
  location: string,
  dateFrom: string,
  dateTo: string | null,
): Promise<DayForecast[] | null> {
  try {
    // Geocode with Nominatim
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      {
        headers: { "User-Agent": "onsketransporten-pakking/1.0 (post@onsketransporten.no)" },
        next: { revalidate: 3600 },
      },
    );
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    if (!geoData.length) return null;
    const { lat, lon } = geoData[0];

    // Fetch Met.no forecast
    const wxRes = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${parseFloat(lat).toFixed(4)}&lon=${parseFloat(lon).toFixed(4)}`,
      {
        headers: { "User-Agent": "onsketransporten-pakking/1.0 (post@onsketransporten.no)" },
        next: { revalidate: 1800 },
      },
    );
    if (!wxRes.ok) return null;
    const wxData = await wxRes.json();

    const timeseries: Array<{
      time: string;
      data: {
        instant: { details: { air_temperature: number; wind_speed: number } };
        next_1_hours?: { summary: { symbol_code: string }; details: { precipitation_amount: number } };
        next_6_hours?: { summary: { symbol_code: string }; details: { precipitation_amount: number; air_temperature_max: number; air_temperature_min: number } };
        next_12_hours?: { summary: { symbol_code: string } };
      };
    }> = wxData.properties?.timeseries ?? [];

    const dates = dateRange(dateFrom, dateTo);

    return dates.map((date) => {
      const dayEntries = timeseries.filter((e) => e.time.startsWith(date));
      if (!dayEntries.length) return null;

      // Find noon entry for symbol and wind
      const noonEntry = dayEntries.find((e) => e.time.includes("T12:")) ?? dayEntries[Math.floor(dayEntries.length / 2)];
      const symbolCode =
        noonEntry.data.next_6_hours?.summary.symbol_code ??
        noonEntry.data.next_1_hours?.summary.symbol_code ??
        noonEntry.data.next_12_hours?.summary.symbol_code ??
        "partlycloudy_day";

      // Temp max/min from 06:00 next_12_hours, or across all entries
      const temps = dayEntries.map((e) => e.data.instant.details.air_temperature);
      const h6 = dayEntries.find((e) => e.time.includes("T06:"))?.data.next_6_hours;
      const h12 = dayEntries.find((e) => e.time.includes("T06:"))?.data.next_12_hours;
      const tempMax = h6?.details.air_temperature_max ?? (h12 ? null : temps.length ? Math.max(...temps) : null);
      const tempMin = h6?.details.air_temperature_min ?? (temps.length ? Math.min(...temps) : null);

      // Total precipitation for the day
      const precipitation = dayEntries.reduce((sum, e) => {
        return sum + (e.data.next_1_hours?.details.precipitation_amount ?? 0);
      }, 0);

      const windSpeed = noonEntry.data.instant.details.wind_speed ?? null;

      const forecast: DayForecast = {
        date,
        emoji: symbolEmoji(symbolCode),
        description: symbolDescription(symbolCode),
        tempMax,
        tempMin,
        precipitation: precipitation > 0 ? Math.round(precipitation * 10) / 10 : 0,
        windSpeed,
      };
      return forecast;
    }).filter((d): d is DayForecast => d !== null);
  } catch {
    return null;
  }
}
