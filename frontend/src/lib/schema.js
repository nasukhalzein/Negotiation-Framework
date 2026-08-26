export const emptyMetric = () => ({ label: "", baseline: null, result: null, unit: "", period: "", impact_value: null });
export const emptyAchievement = () => ({ title: "", impact_value: null, beyond_scope: false, verifiable: false });
export const emptyAlternative = () => ({ label: "", kind: "offer", value: null, probability: 50, weeks_to_activate: 8, is_active: false });

export const CONTEXT_KEYS = ["salary_raise", "job_offer", "business_deal"];
export const ALT_KINDS = ["offer", "client", "side_income", "internal_move", "skill", "other"];

export const defaultInput = () => ({
  lang: "id",
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
