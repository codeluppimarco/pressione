// Helper "solo lato client": usano i getter locali di Date (getFullYear,
// getHours, ...) quindi sono corretti solo se il runtime è il browser
// dell'utente (fuso Europe/Rome). Sul server (Vercel, UTC) danno un
// risultato sbagliato — non chiamarli in Server Component/Action.
export function toLocalDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toLocalTimeInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Helper corretti ovunque (anche server-side): usano Intl con timeZone
// esplicito invece dei getter locali di Date, quindi non dipendono dal
// fuso orario del runtime che li esegue.
const DEFAULT_TIME_ZONE = "Europe/Rome";

function getTimeZoneOffsetMinutes(utcInstant: number, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(new Date(utcInstant));
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return (asUtc - utcInstant) / 60000;
}

// Converte una data/ora "civile" (es. quella scritta da un utente in un
// form, o letta da un CSV) nell'istante UTC corretto, assumendo che quei
// numeri rappresentino l'ora locale del fuso indicato (default
// Europe/Rome) — indipendentemente dal fuso del runtime che esegue
// questa funzione. Necessario perché i Server Actions girano sul server
// (UTC), non nel browser dell'utente: costruire la data con
// `new Date(year, month, day, hour, minute)` o `new Date("...T...")`
// lì la interpreterebbe come UTC, sfasando il risultato di 1-2 ore.
export function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string = DEFAULT_TIME_ZONE,
): Date {
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute);
  const offsetMinutes = getTimeZoneOffsetMinutes(naiveUtc, timeZone);
  return new Date(naiveUtc - offsetMinutes * 60000);
}

// Variante comoda per i form: "YYYY-MM-DD" + "HH:MM" (i formati nativi
// di <input type="date">/<input type="time">). Ritorna null se il
// formato non è quello atteso.
export function parseLocalDateTime(date: string, time: string): Date | null {
  const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = time.match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) {
    return null;
  }

  const [, year, month, day] = dateMatch;
  const [, hour, minute] = timeMatch;

  return zonedDateTimeToUtc(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
  );
}
