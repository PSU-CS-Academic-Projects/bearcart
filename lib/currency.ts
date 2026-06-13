export const MAX_CURRENCY_AMOUNT = 999_999;
export const MAX_CURRENCY_DIGITS = 6;
export const BLOCKED_CURRENCY_KEYS = ["e", "E", "-", ".", "+"];

export function getCurrencyDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, MAX_CURRENCY_DIGITS);
}

export function formatCurrencyInput(value: string): string {
  const digits = getCurrencyDigits(value);
  if (!digits) return "";

  return Number(digits).toLocaleString("en-US");
}

export function parseCurrencyInput(value: string): number | null {
  const digits = getCurrencyDigits(value);
  if (!digits) return null;

  return Number(digits);
}

export function formatPeso(amount: number | null | undefined): string {
  const value = Math.floor(Number(amount ?? 0));

  return `₱${value.toLocaleString("en-US")}`;
}

export function shouldBlockCurrencyKey(
  key: string,
  value: string,
  selectionStart: number | null,
  selectionEnd: number | null
): boolean {
  if (BLOCKED_CURRENCY_KEYS.includes(key)) return true;
  if (!/^\d$/.test(key)) return false;

  const start = selectionStart ?? value.length;
  const end = selectionEnd ?? value.length;
  const selectedDigits = value.slice(start, end).replace(/\D/g, "").length;
  const currentDigits = value.replace(/\D/g, "").length;

  return currentDigits - selectedDigits >= MAX_CURRENCY_DIGITS;
}
