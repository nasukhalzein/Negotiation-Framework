export const emptyMetric = () => ({ label: "", baseline: null, result: null, unit: "", period: "", impact_value: null });
export const emptyAchievement = () => ({ title: "", impact_value: null, beyond_scope: false, verifiable: false });
export const emptyAlternative = () => ({ label: "", kind: "offer", value: null, probability: 50, weeks_to_activate: 8, is_active: false });

export const defaultInput = () => ({
  context: "salary_raise",
  role: "",
  tenure_months: 12,
  currency: "IDR",
  current_value: null,
  offer_value: null,
  target_value: null,
  market_p50: null,
  market_p75: null,
  metrics: [emptyMetric()],
  achievements: [emptyAchievement()],
  internal_band_known: false,
  scope_growth_note: "",
  timing_factors: [],
  alternatives: [emptyAlternative()],
  monthly_expense: null,
  relationship_importance: 3,
});

export const ALT_KINDS = [
  { key: "offer", label: "Offer kerja lain" },
  { key: "client", label: "Klien / project lain" },
  { key: "side_income", label: "Penghasilan sampingan" },
  { key: "internal_move", label: "Pindah divisi internal" },
  { key: "skill", label: "Skill / sertifikasi baru" },
  { key: "other", label: "Lainnya" },
];

export const STEPS = [
  { key: "context", label: "Konteks", code: "00" },
  { key: "performance", label: "Performance", code: "P" },
  { key: "achievement", label: "Achievement", code: "A" },
  { key: "comparison", label: "Comparison", code: "C" },
  { key: "timing", label: "Timing", code: "T" },
  { key: "batna", label: "BATNA", code: "B" },
];
