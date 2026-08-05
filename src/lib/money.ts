/**
 * Money is stored as integer centavos everywhere (₱1,250.00 → 125000).
 * Floats are never used for money — they cannot represent 0.01 exactly.
 */

export function formatPeso(centavos: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(centavos / 100);
}

/** "1250.50" or "1,250.50" → 125050. Returns null when not a valid amount. */
export function parsePesoToCentavos(input: string): number | null {
  const cleaned = input.replace(/[₱,\s]/g, "");
  if (!/^\d*\.?\d{0,2}$/.test(cleaned) || cleaned === "" || cleaned === ".") {
    return null;
  }
  return Math.round(parseFloat(cleaned) * 100);
}

/** Centavos → "1250.50", for prefilling a text input. */
export function centavosToInput(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined) return "";
  return (centavos / 100).toFixed(2);
}
