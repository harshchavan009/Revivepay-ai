// Safari-safe date formatting and parsing utility

export function safeDate(dateInput: string | number | Date | null | undefined): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? new Date() : dateInput;
  }
  if (typeof dateInput === "number") {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  // Sanitize space-separated SQL datetimes (e.g., "2026-08-29 18:23:32" -> "2026-08-29T18:23:32")
  let str = String(dateInput).trim();
  if (!str) return new Date();

  // If it's a timestamp string like "1724930000"
  if (/^\d{10,13}$/.test(str)) {
    const num = Number(str);
    const d = new Date(num < 1e11 ? num * 1000 : num);
    if (!isNaN(d.getTime())) return d;
  }

  // Replace space before time with T for ISO compliance
  if (str.includes(" ") && !str.includes("T")) {
    str = str.replace(" ", "T");
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatTimeSafe(dateInput: string | number | Date | null | undefined): string {
  try {
    const d = safeDate(dateInput);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "";
  }
}

export function formatDateSafe(
  dateInput: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = safeDate(dateInput);
    return d.toLocaleString(
      "en-IN",
      options || {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  } catch {
    return "";
  }
}
