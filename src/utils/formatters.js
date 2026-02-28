/**
 * Format an ISO datetime string to Italian locale date.
 */
export function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * Format an ISO datetime string to Italian locale date + time.
 */
export function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * Format a number as Italian currency.
 */
export function formatEuro(value) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Format kilograms.
 */
export function formatKg(value) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(2)} kg`;
}

/**
 * Today as YYYY-MM-DD for date inputs.
 */
export function todayISO() {
  return new Date().toISOString().split("T")[0];
}

/**
 * First day of current month as YYYY-MM-DD.
 */
export function firstDayOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
}
