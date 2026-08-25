export const CURRENCIES = {
  IDR: { symbol: "Rp", locale: "id-ID" },
  USD: { symbol: "$", locale: "en-US" },
  SGD: { symbol: "S$", locale: "en-US" },
};

export function money(value, currency = "IDR") {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return "—";
  const cfg = CURRENCIES[currency] || CURRENCIES.IDR;
  return `${cfg.symbol} ${Number(value).toLocaleString(cfg.locale, { maximumFractionDigits: 0 })}`;
}

export function shortMoney(value, currency = "IDR") {
  if (!value) return "—";
  const cfg = CURRENCIES[currency] || CURRENCIES.IDR;
  const v = Number(value);
  if (currency === "IDR") {
    if (v >= 1e9) return `${cfg.symbol} ${(v / 1e9).toFixed(1)} M`;
    if (v >= 1e6) return `${cfg.symbol} ${(v / 1e6).toFixed(1)} jt`;
    if (v >= 1e3) return `${cfg.symbol} ${(v / 1e3).toFixed(0)} rb`;
  }
  return money(v, currency);
}

export function parseNum(str) {
  if (str === "" || str === null || str === undefined) return null;
  const digits = String(str).replace(/[^\d.-]/g, "");
  if (digits === "" || digits === "-") return null;
  const n = Number(digits);
  return Number.isNaN(n) ? null : n;
}

export function groupDigits(value) {
  if (value === null || value === undefined || value === "") return "";
  return Number(value).toLocaleString("id-ID");
}
