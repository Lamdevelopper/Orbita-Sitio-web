/** Shared locale/timezone formatters for the editorial admin surface. */
import { EDITORIAL_LOCALE, EDITORIAL_TIMEZONE } from "../../lib/editorial-contract";

export function formatDateTime(value?: string | null) {
  if (!value) return "Sin cambios registrados";
  return new Intl.DateTimeFormat(EDITORIAL_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: EDITORIAL_TIMEZONE,
  }).format(new Date(value));
}

/** Formats a date-only value without timezone shifts (important for editions). */
export function formatDateOnly(value?: string | null) {
  if (!value) return "Sin fecha";
  const dateOnly = value.slice(0, 10);
  const [year, month, day] = dateOnly.split("-").map(Number);
  if (!year || !month || !day) return "Sin fecha";
  return new Intl.DateTimeFormat(EDITORIAL_LOCALE, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}
