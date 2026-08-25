import React from "react";
import { groupDigits, parseNum, CURRENCIES } from "../lib/format";

export const Label = ({ children, hint }) => (
  <div className="mb-2">
    <div className="eyebrow text-[0.65rem] text-neutral-400">{children}</div>
    {hint && <div className="text-xs text-neutral-500 mt-1 font-sans leading-relaxed">{hint}</div>}
  </div>
);

export const TextField = ({ label, hint, value, onChange, placeholder, testId, area }) => (
  <div>
    {label && <Label hint={hint}>{label}</Label>}
    {area ? (
      <textarea
        data-testid={testId}
        className="field min-h-[90px] resize-y"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <input
        data-testid={testId}
        className="field"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
  </div>
);

export const MoneyField = ({ label, hint, value, onChange, currency = "IDR", testId, placeholder }) => {
  const symbol = (CURRENCIES[currency] || CURRENCIES.IDR).symbol;
  return (
    <div>
      {label && <Label hint={hint}>{label}</Label>}
      <div className="flex items-stretch border border-brand-line focus-within:border-brand-red transition-colors">
        <span className="px-3 flex items-center bg-[#151515] text-neutral-500 font-mono text-xs border-r border-brand-line">
          {symbol}
        </span>
        <input
          data-testid={testId}
          className="field border-0"
          inputMode="numeric"
          value={groupDigits(value)}
          placeholder={placeholder || "0"}
          onChange={(e) => onChange(parseNum(e.target.value))}
        />
      </div>
    </div>
  );
};

export const NumField = ({ label, hint, value, onChange, testId, suffix, placeholder }) => (
  <div>
    {label && <Label hint={hint}>{label}</Label>}
    <div className="flex items-stretch border border-brand-line focus-within:border-brand-red transition-colors">
      <input
        data-testid={testId}
        className="field border-0"
        inputMode="decimal"
        value={value === null || value === undefined ? "" : value}
        placeholder={placeholder || "0"}
        onChange={(e) => onChange(parseNum(e.target.value))}
      />
      {suffix && (
        <span className="px-3 flex items-center bg-[#151515] text-neutral-500 font-mono text-xs border-l border-brand-line">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

export const Chip = ({ active, onClick, children, testId }) => (
  <button
    type="button"
    data-testid={testId}
    onClick={onClick}
    className={`text-left px-4 py-3 border font-mono text-xs leading-snug transition-colors duration-200 ${
      active
        ? "border-brand-red bg-[#1c1010] text-white"
        : "border-brand-line bg-[#101010] text-neutral-400 hover:border-neutral-600 hover:text-white"
    }`}
  >
    {children}
  </button>
);

export const Toggle = ({ active, onClick, children, testId }) => (
  <button
    type="button"
    data-testid={testId}
    onClick={onClick}
    className={`flex items-start gap-3 w-full text-left px-4 py-3 border transition-colors duration-200 ${
      active ? "border-brand-red bg-[#1c1010]" : "border-brand-line bg-[#101010] hover:border-neutral-600"
    }`}
  >
    <span
      className={`mt-[3px] w-3.5 h-3.5 shrink-0 border ${
        active ? "bg-brand-red border-brand-red" : "border-neutral-600"
      }`}
    />
    <span className={`text-sm font-sans ${active ? "text-white" : "text-neutral-400"}`}>{children}</span>
  </button>
);

export const SectionHead = ({ code, title, desc }) => (
  <div className="mb-8">
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-brand-red text-xs">{code}</span>
      <h3 className="font-display text-2xl md:text-3xl tracking-tight">{title}</h3>
    </div>
    {desc && <p className="text-sm text-neutral-400 mt-3 max-w-2xl leading-relaxed">{desc}</p>}
  </div>
);

export const RowCard = ({ children, onRemove, index, testId }) => (
  <div className="border border-brand-line bg-[#101010] p-5 relative" data-testid={testId}>
    <div className="flex items-center justify-between mb-4">
      <span className="font-mono text-[0.65rem] tracking-[0.2em] text-neutral-500">#{String(index + 1).padStart(2, "0")}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          data-testid={`${testId}-remove`}
          className="font-mono text-[0.65rem] tracking-widest text-neutral-500 hover:text-brand-red transition-colors"
        >
          HAPUS
        </button>
      )}
    </div>
    {children}
  </div>
);
