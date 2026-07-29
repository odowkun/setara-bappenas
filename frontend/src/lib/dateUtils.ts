/**
 * Date and Time Utilities configured for Waktu Indonesia Timur (WIT / UTC+9)
 * Location: Halmahera Utara, Maluku Utara
 */

export const TIMEZONE_WIT = "Asia/Jayapura";
export const TIMEZONE_LABEL_WIT = "WIT";

/**
 * Format ISO date string or Date object into Indonesian format in WIT
 * Example output: "25 Juli 2026, 12:30 WIT"
 */
export function formatDateWIT(
  dateInput?: string | Date | null,
  includeTime: boolean = true
): string {
  if (!dateInput) return "-";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const formattedDate = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: TIMEZONE_WIT,
    });

    if (!includeTime) {
      return formattedDate;
    }

    const formattedTime = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TIMEZONE_WIT,
      hour12: false,
    });

    return `${formattedDate}, ${formattedTime} WIT`;
  } catch (e) {
    return String(dateInput);
  }
}

/**
 * Format HH:mm string or range to append WIT suffix
 * Example output: "09:00 - 15:00 WIT"
 */
export function formatTimeRangeWIT(startTime: string, endTime?: string): string {
  if (!startTime) return "-";
  if (!endTime || startTime === endTime) {
    return `${startTime} WIT`;
  }
  return `${startTime} - ${endTime} WIT`;
}
