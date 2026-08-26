"""Rule-based negotiation engine: PACT scoring, BATNA analysis, number engine (bilingual)."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from texts import t

CTX_CFG = {
    "salary_raise": {"stretch": 1.30, "cap": 1.40, "annual": True},
    "job_offer": {"stretch": 1.35, "cap": 1.62, "annual": True},
    "business_deal": {"stretch": 1.25, "cap": 1.50, "annual": False},
}

TIMING_W = {
    "salary_raise": {
        "review_cycle_near": 6, "recent_win": 6, "company_growing": 5, "scope_increased": 5,
        "hard_to_replace": 5, "competing_offer": 6, "hiring_freeze": -8, "recent_miss": -7,
    },
    "job_offer": {
        "role_urgent": 6, "competing_offer": 7, "quarter_hiring_target": 4, "referral_champion": 5,
        "niche_skill": 5, "budget_locked": -7, "already_resigned": -8, "long_unemployed": -6,
    },
    "business_deal": {
        "client_deadline": 6, "inbound_lead": 6, "budget_cycle_open": 5, "pipeline_full": 6,
        "unique_capability": 5, "tender_price_war": -7, "cashflow_pressure": -8, "client_shopping": -5,
    },
}

NEGATIVE_TIMING = {"hiring_freeze", "recent_miss", "budget_locked", "already_resigned",
                   "long_unemployed", "tender_price_war", "cashflow_pressure", "client_shopping"}


class Metric(BaseModel):
    label: str = ""
    baseline: Optional[float] = None
    result: Optional[float] = None
    unit: str = ""
    period: str = ""
    impact_value: Optional[float] = None


class Achievement(BaseModel):
    title: str = ""
    impact_value: Optional[float] = None
    beyond_scope: bool = False
    verifiable: bool = False


class Alternative(BaseModel):
    label: str = ""
    kind: str = "other"
    value: Optional[float] = None
    probability: int = 50
    weeks_to_activate: int = 8
    is_active: bool = False


class NegotiationInput(BaseModel):
    lang: str = "id"
    context: str = "salary_raise"
    role: str = ""
    tenure_months: int = 12
    currency: str = "IDR"
    current_value: Optional[float] = None
    offer_value: Optional[float] = None
    target_value: Optional[float] = None
    market_p50: Optional[float] = None
    market_p75: Optional[float] = None
    metrics: List[Metric] = Field(default_factory=list)
    achievements: List[Achievement] = Field(default_factory=list)
    internal_band_known: bool = False
    scope_growth_note: str = ""
    timing_factors: List[str] = Field(default_factory=list)
    alternatives: List[Alternative] = Field(default_factory=list)
    monthly_expense: Optional[float] = None
    relationship_importance: int = 3


def _clamp(v, lo, hi):
    return max(lo, min(hi, v))


def _round_money(v: float) -> float:
    if v <= 0:
        return 0
    if v >= 100_000_000:
        step = 1_000_000
    elif v >= 10_000_000:
        step = 500_000
    elif v >= 1_000_000:
        step = 250_000
    else:
        step = 50_000
    return round(v / step) * step


def fmt_money(v, currency: str = "IDR") -> str:
    if v is None:
        return "—"
    n = int(round(float(v)))
    if currency == "IDR":
        return "Rp " + f"{n:,}".replace(",", ".")
    symbol = {"USD": "$", "SGD": "S$"}.get(currency, currency + " ")
    return f"{symbol}{n:,}"


def _delta_pct(m: Metric) -> Optional[float]:
    if m.baseline is None or m.result is None or m.baseline == 0:
        return None
    return (m.result - m.baseline) / abs(m.baseline) * 100


def _cfg(context: str):
    return CTX_CFG.get(context, CTX_CFG["salary_raise"])


def score_pact(inp: NegotiationInput, impact_ratio: float) -> Dict[str, Any]:
    quantified = [m for m in inp.metrics if _delta_pct(m) is not None and m.label.strip()]
    p = min(len(quantified), 3) * 5.0
    if impact_ratio >= 5:
        p += 10
    elif impact_ratio >= 3:
        p += 8
    elif impact_ratio >= 1:
        p += 6
    elif impact_ratio > 0:
        p += 3

    named_ach = [x for x in inp.achievements if x.title.strip()]
    with_value = [x for x in named_ach if x.impact_value]
    a = min(len(with_value), 3) * 5.0
    if any(x.beyond_scope for x in named_ach):
        a += 5
    if any(x.verifiable for x in named_ach):
        a += 5
    if not named_ach:
        a = 0

    c = 0.0
    if inp.market_p50:
        c += 9
    if inp.market_p75:
        c += 5
    if inp.internal_band_known:
        c += 5
    base = inp.current_value or inp.offer_value or 0
    if inp.market_p50 and base and base < inp.market_p50:
        c += 6
    elif inp.market_p50 and base and base < inp.market_p50 * 1.1:
        c += 3
    if inp.scope_growth_note.strip():
        c += 3

    weights = TIMING_W.get(inp.context, TIMING_W["salary_raise"])
    tscore = 8.0 + sum(weights.get(k, 0) for k in inp.timing_factors)

    return {
        "P": round(_clamp(p, 0, 25)),
        "A": round(_clamp(a, 0, 25)),
        "C": round(_clamp(c, 0, 25)),
        "T": round(_clamp(tscore, 0, 25)),
        "total": round(_clamp(p, 0, 25) + _clamp(a, 0, 25) + _clamp(c, 0, 25) + _clamp(tscore, 0, 25)),
        "quantified_metrics": len(quantified),
    }


def score_batna(inp: NegotiationInput) -> Dict[str, Any]:
    tx = t(inp.lang)
    alts = [a for a in inp.alternatives if a.label.strip()]
    if not alts:
        return {"score": 8, "tier": tx["batna_tiers"]["none"], "best": None,
                "expected_value": 0.0, "alternatives": []}

    scored = []
    for a in alts:
        prob = _clamp(a.probability, 0, 100) / 100
        speed = _clamp(1 - (a.weeks_to_activate / 26), 0.1, 1.0)
        scored.append({
            "label": a.label,
            "kind": a.kind,
            "value": a.value or 0,
            "probability": a.probability,
            "weeks_to_activate": a.weeks_to_activate,
            "is_active": a.is_active,
            "expected_value": round((a.value or 0) * prob),
            "strength": round(_clamp(prob * 60 + speed * 25 + (15 if a.is_active else 0), 0, 100)),
        })

    scored.sort(key=lambda x: (x["strength"], x["expected_value"]), reverse=True)
    best = scored[0]
    score = _clamp(best["strength"] * 0.8 + min(len(scored), 3) * 4, 0, 100)
    key = ("dominant" if score >= 75 else "strong" if score >= 55 else "moderate" if score >= 35 else "weak")
    return {
        "score": round(score),
        "tier": tx["batna_tiers"][key],
        "tier_key": key,
        "best": best,
        "expected_value": best["expected_value"],
        "alternatives": scored,
    }


def build_numbers(inp: NegotiationInput, leverage: int, batna: Dict[str, Any], impact_ratio: float) -> Dict[str, Any]:
    tx = t(inp.lang)
    cfg = _cfg(inp.context)
    ctx_tx = tx["ctx"].get(inp.context, tx["ctx"]["salary_raise"])
    base = inp.current_value or inp.offer_value or 0
    if not base:
        return {"available": False, "reason": tx["no_base"]}

    p50 = inp.market_p50
    p75 = inp.market_p75 or (p50 * 1.18 if p50 else None)

    market_target = p75 or (p50 * 1.15 if p50 else base * 1.22)
    impact_target = base * (1 + 0.08 + min(0.30, impact_ratio * 0.03))
    raw_target = max(market_target, impact_target) * (0.92 + (leverage / 100) * 0.16)

    cap_value = base * cfg["cap"] * (0.92 + (leverage / 100) * 0.16)
    target = min(raw_target, cap_value)
    capped = raw_target > cap_value * 1.02

    if inp.target_value:
        target = min(max(target, inp.target_value * 0.98), cap_value * 1.1)

    anchor_mult = 1.06 + (leverage / 100) * 0.09
    anchor = target * anchor_mult

    reservation = max(base, batna["expected_value"] or 0)
    if inp.monthly_expense and cfg["annual"]:
        reservation = max(reservation, inp.monthly_expense * 1.15)

    batna_superior = reservation > target
    if batna_superior:
        target = reservation * 1.05
        anchor = target * anchor_mult
        capped = False

    counterpart_max = max((p75 or base * cfg["stretch"]), base * cfg["stretch"])
    anchor_r, target_r, reservation_r = _round_money(anchor), _round_money(target), _round_money(reservation)
    mid = _round_money((target_r + reservation_r) / 2)
    zopa_low, zopa_high = reservation_r, _round_money(counterpart_max)

    ladder = [
        {"step": i + 1, "label": tx["ladder"][i]["label"], "note": tx["ladder"][i]["note"], "value": v}
        for i, v in enumerate([anchor_r, target_r, mid, reservation_r])
    ]

    pos = None
    if p50:
        pos = tx["market_pos"]["below"] if base < p50 * 0.95 else \
            tx["market_pos"]["at"] if base <= p50 * 1.1 else tx["market_pos"]["above"]

    return {
        "available": True,
        "base": _round_money(base),
        "anchor": anchor_r,
        "target": target_r,
        "compromise": mid,
        "reservation": reservation_r,
        "capped": capped,
        "batna_superior": batna_superior,
        "batna_note": tx["batna_note"].format(res=fmt_money(reservation_r, inp.currency),
                                              anchor=fmt_money(anchor_r, inp.currency)) if batna_superior else None,
        "staged_plan": tx["staged_plan"].format(
            now=fmt_money(target_r, inp.currency),
            later=fmt_money(_round_money(min(raw_target, base * 1.75)), inp.currency)) if capped else None,
        "increase_pct": round((target_r - base) / base * 100, 1),
        "anchor_increase_pct": round((anchor_r - base) / base * 100, 1),
        "market_p50": _round_money(p50) if p50 else None,
        "market_p75": _round_money(p75) if p75 else None,
        "market_position": pos,
        "zopa": {"low": zopa_low, "high": zopa_high, "exists": zopa_high > zopa_low},
        "ladder": ladder,
        "non_monetary": ctx_tx["nonmon"],
    }


def build_gaps(inp: NegotiationInput, pact: Dict[str, Any], batna: Dict[str, Any]) -> List[Dict[str, str]]:
    g = t(inp.lang)["gaps"]
    out = []
    if pact["P"] < 15:
        out.append(g["P"])
    if pact["A"] < 15:
        out.append(g["A"])
    if pact["C"] < 14:
        out.append(g["C"])
    if pact["T"] < 12:
        out.append(g["T"])
    if batna["score"] < 35:
        out.append(g["B"])
    return out


def build_risks(inp: NegotiationInput, numbers: Dict[str, Any], leverage: int, batna: Dict[str, Any]) -> List[Dict[str, str]]:
    tx = t(inp.lang)
    r, lv = tx["risks"], tx["levels"]
    out = []
    if numbers.get("available") and not numbers["zopa"]["exists"]:
        out.append({"level": lv["high"], **r["no_zopa"]})
    if numbers.get("available") and numbers["anchor_increase_pct"] > 45 and leverage < 60:
        out.append({"level": lv["medium"],
                    "title": r["aggressive"]["title"].format(pct=numbers["anchor_increase_pct"]),
                    "detail": r["aggressive"]["detail"]})
    if leverage < 40:
        out.append({"level": lv["high"], **r["low_leverage"]})
    if any(k in inp.timing_factors for k in ("hiring_freeze", "budget_locked", "cashflow_pressure")):
        out.append({"level": lv["medium"], **r["freeze"]})
    if batna["score"] >= 60 and inp.relationship_importance >= 4:
        out.append({"level": lv["low"], **r["relationship"]})
    if not out:
        out.append({"level": lv["low"], **r["clear"]})
    return out


def build_script(inp: NegotiationInput, numbers: Dict[str, Any], batna: Dict[str, Any]) -> Dict[str, Any]:
    tx = t(inp.lang)
    s = tx["script"]
    cur = inp.currency
    ctx = inp.context if inp.context in CTX_CFG else "salary_raise"
    role = inp.role or ("peran ini" if inp.lang == "id" else "this role")

    top_metric = next((m for m in inp.metrics if _delta_pct(m) is not None and m.label.strip()), None)
    top_ach = next((a for a in inp.achievements if a.impact_value and a.title.strip()), None) or \
        next((a for a in inp.achievements if a.title.strip()), None)

    perf = (f"{top_metric.label} {'bergerak dari' if inp.lang == 'id' else 'moved from'} "
            f"{top_metric.baseline:g} {'ke' if inp.lang == 'id' else 'to'} {top_metric.result:g} "
            f"{top_metric.unit} {top_metric.period}".strip()) if top_metric else s["perf_fallback"]
    ach = top_ach.title if top_ach else s["ach_fallback"]

    body = [
        s["body_perf"].format(perf=perf),
        s["body_ach"].format(ach=ach),
        s["body_comp"].format(
            p50=fmt_money(numbers.get("market_p50") or numbers.get("target"), cur),
            p75=fmt_money(numbers.get("market_p75") or numbers.get("anchor"), cur),
            base=fmt_money(numbers.get("base"), cur)),
        s["body_time_review"] if "review_cycle_near" in inp.timing_factors else s["body_time_default"],
    ]

    weeks = (batna["best"] or {}).get("weeks_to_activate", 4) if batna["best"] else 4
    objections = []
    for o in s["objections"][ctx]:
        objections.append({
            "objection": o["objection"],
            "response": o["response"].format(
                tenure=inp.tenure_months, perf=perf, weeks=max(2, weeks),
                p50=fmt_money(numbers.get("market_p50") or numbers.get("target"), cur),
                p75=fmt_money(numbers.get("market_p75") or numbers.get("anchor"), cur)),
        })
    if batna["score"] >= 55:
        objections.append({
            "objection": s["batna_obj"]["objection"],
            "response": s["batna_obj"]["response"].format(weeks=max(2, weeks)),
        })

    anchor = numbers.get("anchor")
    return {
        "opening": s["opening"][ctx].format(role=role),
        "body": body,
        "ask": s["ask"].format(anchor=fmt_money(anchor, cur)) if anchor else s["ask_nonum"],
        "silence_rule": s["silence"],
        "objections": objections,
        "closing": s["closing"],
        "counterpart": tx["ctx"][ctx]["counterpart"],
    }


def build_checklist(inp: NegotiationInput, pact: Dict[str, Any], batna: Dict[str, Any], numbers: Dict[str, Any]) -> List[Dict[str, Any]]:
    items = t(inp.lang)["checklist"]
    done = [
        pact["quantified_metrics"] >= 2,
        any(a.impact_value and a.title.strip() for a in inp.achievements),
        bool(inp.market_p50 and inp.market_p75),
        numbers.get("available", False),
        batna["score"] >= 45,
        False, False, False, False,
    ]
    return [{"phase": it["phase"], "task": it["task"], "done": done[i]} for i, it in enumerate(items)]


def analyze(inp: NegotiationInput) -> Dict[str, Any]:
    tx = t(inp.lang)
    ctx = inp.context if inp.context in CTX_CFG else "salary_raise"
    base = inp.current_value or inp.offer_value or 0
    total_impact = sum([m.impact_value or 0 for m in inp.metrics] + [a.impact_value or 0 for a in inp.achievements])
    annual_base = base * 12 if _cfg(ctx)["annual"] else base
    impact_ratio = (total_impact / annual_base) if annual_base else 0

    pact = score_pact(inp, impact_ratio)
    batna = score_batna(inp)
    leverage = round(_clamp(pact["total"] * 0.7 + batna["score"] * 0.3, 0, 100))
    tier_key = "dominant" if leverage >= 75 else "strong" if leverage >= 58 else "building" if leverage >= 40 else "weak"
    colors = {"dominant": "strong", "strong": "good", "building": "medium", "weak": "weak"}

    numbers = build_numbers(inp, leverage, batna, impact_ratio)
    return {
        "context": tx["ctx"][ctx]["label"],
        "context_key": ctx,
        "lang": inp.lang,
        "leverage_score": leverage,
        "tier": {**tx["tiers"][tier_key], "color": colors[tier_key], "key": tier_key},
        "pact": pact,
        "batna": batna,
        "impact": {
            "total_value": round(total_impact),
            "ratio": round(impact_ratio, 2),
            "statement": tx["impact_yes"].format(ratio=round(impact_ratio, 1)) if impact_ratio >= 1 else tx["impact_no"],
        },
        "numbers": numbers,
        "gaps": build_gaps(inp, pact, batna),
        "risks": build_risks(inp, numbers, leverage, batna),
        "script": build_script(inp, numbers, batna),
        "checklist": build_checklist(inp, pact, batna, numbers),
        "readiness_pct": leverage,
    }
