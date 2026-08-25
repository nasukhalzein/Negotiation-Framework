"""Backend tests for PACT Negotiation Engine API."""
import os
import json
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "User-Agent": "pytest-qa/1.0"})
    return s


def base_payload(**kw):
    p = {
        "context": "salary_raise",
        "role": "Senior Data Analyst",
        "tenure_months": 24,
        "currency": "IDR",
        "current_value": 14000000,
        "market_p50": 18000000,
        "market_p75": 24000000,
        "metrics": [],
        "achievements": [],
        "timing_factors": [],
        "alternatives": [],
    }
    p.update(kw)
    return p


FULL_METRIC = {"label": "Churn rate", "baseline": 8, "result": 5, "unit": "%",
               "period": "Q1-Q2 2026", "impact_value": 400000000}
FULL_ACH = {"title": "Bangun dashboard retensi", "impact_value": 150000000,
            "beyond_scope": True, "verifiable": True}
FULL_ALT = {"label": "Offer PT Maju", "kind": "offer", "value": 22000000,
            "probability": 70, "weeks_to_activate": 4, "is_active": True}


# ---------- Module: /api/meta ----------
class TestMeta:
    def test_meta(self, api):
        r = api.get(f"{BASE_URL}/api/meta")
        assert r.status_code == 200
        d = r.json()
        keys = [c["key"] for c in d["contexts"]]
        for k in ["salary_raise", "job_offer", "business_deal", "freelance_rate", "vendor", "other"]:
            assert k in keys
        tf = {t["key"]: t["weight"] for t in d["timing_factors"]}
        assert tf["hiring_freeze"] < 0 and tf["recent_win"] > 0
        assert all("label" in c and "counterpart" in c for c in d["contexts"])


# ---------- Module: /api/analyze structure ----------
class TestAnalyzeStructure:
    def test_full_payload_structure(self, api):
        payload = base_payload(
            metrics=[FULL_METRIC], achievements=[FULL_ACH],
            timing_factors=["review_cycle_near", "recent_win"],
            alternatives=[FULL_ALT], internal_band_known=True,
            scope_growth_note="Nambah 2 anak tim",
        )
        r = api.post(f"{BASE_URL}/api/analyze", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["leverage_score", "tier", "pact", "batna", "impact", "numbers",
                  "gaps", "risks", "script", "checklist", "readiness_pct"]:
            assert k in d, f"missing {k}"
        assert 0 <= d["leverage_score"] <= 100
        p = d["pact"]
        for pil in "PACT":
            assert 0 <= p[pil] <= 25, f"{pil}={p[pil]} out of range"
        assert p["total"] == p["P"] + p["A"] + p["C"] + p["T"]
        b = d["batna"]
        assert b["best"]["expected_value"] == round(22000000 * 0.7)
        n = d["numbers"]
        assert n["available"] is True
        assert n["anchor"] > n["target"] >= n["compromise"] >= n["reservation"], n
        assert "zopa" in n and set(["low", "high", "exists"]) <= set(n["zopa"])
        assert len(n["ladder"]) == 4
        assert isinstance(n["non_monetary"], list) and len(n["non_monetary"]) >= 3
        sc = d["script"]
        assert all(k in sc for k in ["opening", "body", "ask", "silence_rule", "objections", "closing"])
        assert len(sc["objections"]) >= 4
        assert isinstance(d["checklist"], list) and len(d["checklist"]) >= 5
        # high leverage expected
        assert d["leverage_score"] > 55, f"leverage too low: {d['leverage_score']}"

    def test_reality_cap_salary_raise(self, api):
        payload = base_payload(market_p50=40000000, market_p75=60000000,
                               metrics=[FULL_METRIC], achievements=[FULL_ACH],
                               alternatives=[FULL_ALT],
                               timing_factors=["review_cycle_near", "recent_win", "company_growing"])
        d = api.post(f"{BASE_URL}/api/analyze", json=payload).json()
        n = d["numbers"]
        assert n["target"] <= 14000000 * 1.62, n["target"]
        assert n["capped"] is True
        assert n["staged_plan"]


# ---------- Module: dynamic scoring behaviour ----------
class TestDynamicScoring:
    def _score(self, api, **kw):
        r = api.post(f"{BASE_URL}/api/analyze", json=base_payload(**kw))
        assert r.status_code == 200, r.text
        return r.json()

    def test_metrics_increase_p(self, api):
        low = self._score(api)
        high = self._score(api, metrics=[FULL_METRIC])
        assert high["pact"]["P"] > low["pact"]["P"]

    def test_achievements_increase_a(self, api):
        low = self._score(api)
        high = self._score(api, achievements=[FULL_ACH])
        assert high["pact"]["A"] > low["pact"]["A"]

    def test_negative_timing_lowers_t(self, api):
        pos = self._score(api, timing_factors=["review_cycle_near", "recent_win"])
        neg = self._score(api, timing_factors=["hiring_freeze", "recent_miss"])
        assert neg["pact"]["T"] < pos["pact"]["T"]
        assert neg["leverage_score"] < pos["leverage_score"]

    def test_batna_alternative_raises_score_and_reservation(self, api):
        none_alt = self._score(api)
        with_alt = self._score(api, alternatives=[FULL_ALT])
        assert with_alt["batna"]["score"] > none_alt["batna"]["score"]
        assert with_alt["batna"]["tier"] != none_alt["batna"]["tier"]
        # reservation rises because expected_value 15.4M > 14M base
        assert with_alt["numbers"]["reservation"] > none_alt["numbers"]["reservation"]

    def test_comparison_pillar_reacts_to_market_data(self, api):
        no_mkt = self._score(api, market_p50=None, market_p75=None)
        with_mkt = self._score(api, internal_band_known=True, scope_growth_note="scope naik")
        assert with_mkt["pact"]["C"] > no_mkt["pact"]["C"]

    def test_reservation_never_below_current(self, api):
        d = self._score(api, alternatives=[{**FULL_ALT, "value": 5000000}])
        assert d["numbers"]["reservation"] >= 14000000


# ---------- Module: all contexts ----------
class TestContexts:
    @pytest.mark.parametrize("ctx", ["salary_raise", "job_offer", "business_deal",
                                     "freelance_rate", "vendor", "other"])
    def test_context_ok(self, api, ctx):
        r = api.post(f"{BASE_URL}/api/analyze", json=base_payload(
            context=ctx, metrics=[FULL_METRIC], alternatives=[FULL_ALT]))
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["numbers"]["available"] is True
        assert d["numbers"]["non_monetary"]
        assert d["script"]["counterpart"]

    def test_non_monetary_and_counterpart_differ(self, api):
        seen_nm, seen_cp = {}, {}
        for ctx in ["salary_raise", "job_offer", "business_deal", "freelance_rate", "vendor", "other"]:
            d = api.post(f"{BASE_URL}/api/analyze", json=base_payload(context=ctx)).json()
            seen_nm[ctx] = tuple(d["numbers"]["non_monetary"])
            seen_cp[ctx] = d["script"]["counterpart"]
        assert len(set(seen_nm.values())) == 6, seen_nm
        assert len(set(seen_cp.values())) >= 4, seen_cp


# ---------- Module: edge cases ----------
class TestEdgeCases:
    def test_empty_payload(self, api):
        r = api.post(f"{BASE_URL}/api/analyze", json={})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["numbers"]["available"] is False
        assert d["numbers"].get("reason")
        assert d["leverage_score"] >= 0
        assert d["script"]["ask"]
        assert d["gaps"]

    def test_zopa_absent_when_batna_huge(self, api):
        d = api.post(f"{BASE_URL}/api/analyze", json=base_payload(
            current_value=8000000, market_p50=None, market_p75=None,
            alternatives=[{**FULL_ALT, "value": 60000000, "probability": 100}])).json()
        assert d["numbers"]["zopa"]["exists"] is False, d["numbers"]["zopa"]
        assert any("ZOPA" in x["title"] for x in d["risks"])

    def test_ladder_monotonic_when_batna_dominant(self, api):
        """Reservation from a dominant BATNA must not exceed anchor/target (ladder must stay ordered)."""
        d = api.post(f"{BASE_URL}/api/analyze", json=base_payload(
            current_value=8000000, market_p50=None, market_p75=None,
            alternatives=[{**FULL_ALT, "value": 60000000, "probability": 100}])).json()
        n = d["numbers"]
        vals = [s["value"] for s in n["ladder"]]
        assert vals == sorted(vals, reverse=True), f"ladder not descending: {vals}"

    def test_invalid_context_falls_back(self, api):
        r = api.post(f"{BASE_URL}/api/analyze", json=base_payload(context="bogus_ctx"))
        assert r.status_code in (200, 422), r.text
        if r.status_code == 200:
            assert r.json()["numbers"]["available"] is True

    def test_bad_types_rejected(self, api):
        r = api.post(f"{BASE_URL}/api/analyze", json={"current_value": "abc"})
        assert r.status_code == 422

    def test_metric_zero_baseline_no_crash(self, api):
        r = api.post(f"{BASE_URL}/api/analyze", json=base_payload(
            metrics=[{"label": "New signups", "baseline": 0, "result": 100, "unit": "user"}]))
        assert r.status_code == 200, r.text


# ---------- Module: FIX 1 - ladder ordering / batna_superior ----------
class TestLadderOrdering:
    CASES = {
        "batna_far_above_cap": dict(current_value=8000000, market_p50=None, market_p75=None,
                                    alternatives=[{**FULL_ALT, "value": 60000000, "probability": 100}]),
        "batna_slightly_below_target": dict(current_value=14000000,
                                            alternatives=[{**FULL_ALT, "value": 20000000, "probability": 90}]),
        "huge_monthly_expense": dict(current_value=8000000, market_p50=None, market_p75=None,
                                     monthly_expense=30000000, alternatives=[]),
        "offer_only_no_current": dict(current_value=None, offer_value=10000000, market_p50=None, market_p75=None,
                                      alternatives=[{**FULL_ALT, "value": 45000000, "probability": 100}]),
        "job_offer_ctx_batna_dominant": dict(context="job_offer", current_value=12000000, market_p50=None,
                                             market_p75=None,
                                             alternatives=[{**FULL_ALT, "value": 50000000, "probability": 100}]),
        "vendor_ctx_batna_dominant": dict(context="vendor", current_value=100000000, market_p50=None, market_p75=None,
                                          alternatives=[{**FULL_ALT, "value": 400000000, "probability": 100}]),
    }

    @pytest.mark.parametrize("name", list(CASES))
    def test_ladder_always_descending(self, api, name):
        r = api.post(f"{BASE_URL}/api/analyze", json=base_payload(**self.CASES[name]))
        assert r.status_code == 200, r.text
        n = r.json()["numbers"]
        assert n["available"] is True, n
        vals = [s["value"] for s in n["ladder"]]
        assert vals == sorted(vals, reverse=True), f"{name}: ladder not descending {vals}"
        assert n["anchor"] > n["target"] >= n["compromise"] >= n["reservation"], f"{name}: {n}"

    def test_batna_superior_flag_and_note(self, api):
        d = api.post(f"{BASE_URL}/api/analyze",
                     json=base_payload(**self.CASES["batna_far_above_cap"])).json()
        n = d["numbers"]
        assert n["batna_superior"] is True, n
        assert n["batna_note"] and isinstance(n["batna_note"], str) and len(n["batna_note"]) > 30
        assert n["capped"] is False
        assert n["reservation"] >= 60000000
        assert n["increase_pct"] > 0

    def test_normal_case_not_batna_superior(self, api):
        d = api.post(f"{BASE_URL}/api/analyze", json=base_payload(
            metrics=[FULL_METRIC], achievements=[FULL_ACH], alternatives=[FULL_ALT])).json()
        n = d["numbers"]
        assert n["batna_superior"] is False
        assert n["batna_note"] is None


# ---------- Module: sessions ----------
class TestSessions:
    def test_save_and_fetch(self, api):
        payload = base_payload(metrics=[FULL_METRIC], alternatives=[FULL_ALT])
        analysis = api.post(f"{BASE_URL}/api/analyze", json=payload).json()
        r = api.post(f"{BASE_URL}/api/sessions", json={"input": payload, "analysis": analysis})
        assert r.status_code == 200, r.text
        sid = r.json()["id"]
        assert isinstance(sid, str) and len(sid) > 0
        g = api.get(f"{BASE_URL}/api/sessions/{sid}")
        assert g.status_code == 200
        doc = g.json()
        assert "_id" not in doc
        assert doc["id"] == sid
        assert doc["input"]["current_value"] == 14000000
        assert doc["analysis"]["leverage_score"] == analysis["leverage_score"]

    def test_unknown_session_404(self, api):
        r = api.get(f"{BASE_URL}/api/sessions/nope1234")
        assert r.status_code == 404


# ---------- Module: AI streaming ----------
class TestAiStream:
    @pytest.mark.parametrize("mode", ["script", "objections"])
    def test_stream(self, api, mode):
        payload = base_payload(metrics=[FULL_METRIC], achievements=[FULL_ACH],
                               alternatives=[FULL_ALT], timing_factors=["review_cycle_near"])
        analysis = api.post(f"{BASE_URL}/api/analyze", json=payload).json()
        import time
        t0 = time.time()
        r = requests.post(f"{BASE_URL}/api/ai/generate",
                          json={"input": payload, "analysis": analysis, "mode": mode},
                          headers={"User-Agent": "pytest-qa/1.0"},
                          stream=True, timeout=180)
        assert r.status_code == 200, r.text
        text, done, err = "", False, None
        for line in r.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data: "):
                continue
            ev = json.loads(line[6:])
            if "delta" in ev:
                text += ev["delta"]
            if ev.get("done"):
                done = True
                break
            if "error" in ev:
                err = ev["error"]
                break
        elapsed = time.time() - t0
        assert err is None, f"AI stream error: {err}"
        assert done is True, f"stream did not finish with done:true (elapsed={elapsed:.1f}s, chars={len(text)})"
        assert elapsed < 55, f"stream took {elapsed:.1f}s (>55s risks ingress cut)"
        low = text.lower()
        if mode == "script":
            # P.A.C.T labels must be correct (Performance/Achievement/Comparison/Timing, not 'Problem')
            for lbl in ["performance", "achievement", "comparison", "timing"]:
                assert lbl in low, f"missing P.A.C.T label '{lbl}' in script output"
        assert len(text) > 300, f"output too short: {text[:200]}"
        if mode == "script":
            anchor = analysis["numbers"]["anchor"]
            fmt = f"{int(anchor):,}".replace(",", ".")
            assert fmt in text or str(int(anchor)) in text, \
                f"anchor {fmt} not present in AI output"
