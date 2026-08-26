"""CONCEPTOR backend regression tests (bilingual engine, 3 contexts, per-context timing)."""
import json
import os
import re
import time

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
UA = {"User-Agent": "conceptor-pytest/1.0", "Content-Type": "application/json"}

CONTEXTS = ["salary_raise", "job_offer", "business_deal"]

# Indonesian markers that must never appear in EN output
ID_WORDS = [" Anda", " yang ", " dengan ", " saya ", " adalah ", " untuk ", " tidak ",
            " pekan", " bulan", "Rencana", " angka ", " harga "]
# English markers that must never appear in ID output
EN_WORDS = [" your ", " the ", " with ", " and ", " weeks", " months", " number ", " price "]


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update(UA)
    return s


def full_payload(context="business_deal", lang="id", timing=None):
    return {
        "lang": lang,
        "context": context,
        "role": "Senior Data Analyst",
        "tenure_months": 24,
        "currency": "IDR",
        "current_value": 40_000_000,
        "offer_value": 30_000_000 if context != "salary_raise" else None,
        "market_p50": 35_000_000,
        "market_p75": 60_000_000,
        "metrics": [{"label": "Retensi klien", "baseline": 70, "result": 88,
                     "unit": "%", "period": "Q1 2026", "impact_value": 500_000_000}],
        "achievements": [{"title": "Membangun dashboard revenue", "impact_value": 200_000_000,
                          "beyond_scope": True, "verifiable": True}],
        "internal_band_known": True,
        "scope_growth_note": "Menambah dua tim baru",
        "timing_factors": timing if timing is not None else ["client_deadline", "inbound_lead"],
        "alternatives": [{"label": "Klien lain", "kind": "other", "value": 45_000_000,
                          "probability": 60, "weeks_to_activate": 3, "is_active": True}],
        "monthly_expense": 15_000_000,
        "relationship_importance": 3,
    }


def collect_strings(obj, out=None):
    if out is None:
        out = []
    if isinstance(obj, str):
        out.append(obj)
    elif isinstance(obj, dict):
        for v in obj.values():
            collect_strings(v, out)
    elif isinstance(obj, list):
        for v in obj:
            collect_strings(v, out)
    return out


# ---------------- health / meta ----------------
class TestHealthMeta:
    def test_root(self, client):
        r = client.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert "message" in r.json()

    @pytest.mark.parametrize("lang", ["id", "en"])
    def test_meta_shape(self, client, lang):
        r = client.get(f"{BASE_URL}/api/meta", params={"lang": lang})
        assert r.status_code == 200
        d = r.json()
        assert [c["key"] for c in d["contexts"]] == CONTEXTS
        tf = d["timing_factors"]
        assert isinstance(tf, dict)
        assert set(tf.keys()) == set(CONTEXTS)
        for ctx in CONTEXTS:
            assert len(tf[ctx]) == 8, f"{ctx} has {len(tf[ctx])} timing factors"
            for f in tf[ctx]:
                assert f["label"] and isinstance(f["weight"], int)

    def test_meta_labels_localised(self, client):
        idl = client.get(f"{BASE_URL}/api/meta", params={"lang": "id"}).json()
        enl = client.get(f"{BASE_URL}/api/meta", params={"lang": "en"}).json()
        assert idl["contexts"][0]["label"] != enl["contexts"][0]["label"]
        assert enl["contexts"][2]["label"] == "Business / Client Deal"
        assert enl["timing_factors"]["business_deal"][0]["label"].startswith("The client")


# ---------------- analyze: languages ----------------
class TestLanguage:
    def test_en_has_no_indonesian(self, client):
        r = client.post(f"{BASE_URL}/api/analyze", json=full_payload(lang="en"))
        assert r.status_code == 200
        d = r.json()
        assert d["lang"] == "en"
        blob = " ".join(collect_strings({k: v for k, v in d.items()
                                        if k not in ("script",)})) + " "
        # script contains user-entered Indonesian data, check only engine copy
        s = d["script"]
        blob += " ".join([s["ask"], s["silence_rule"], s["closing"], s["counterpart"]] +
                         [o["objection"] for o in s["objections"]]) + " "
        leaks = [w for w in ID_WORDS if w in blob]
        assert not leaks, f"Indonesian leaked into EN output: {leaks}"
        assert d["tier"]["label"] in ("Dominant Position", "Strong Position",
                                      "Still Building", "Not Ready Yet")
        assert d["context"] == "Business / Client Deal"
        assert d["numbers"]["ladder"][0]["label"] == "Anchor — your opening number"

    def test_id_has_no_english(self, client):
        r = client.post(f"{BASE_URL}/api/analyze", json=full_payload(lang="id"))
        assert r.status_code == 200
        d = r.json()
        s = d["script"]
        blob = " ".join([d["tier"]["verdict"], d["impact"]["statement"], s["ask"],
                         s["silence_rule"], s["closing"], s["counterpart"]] +
                        [g["action"] for g in d["gaps"]] +
                        [x["note"] for x in d["numbers"]["ladder"]]) + " "
        leaks = [w for w in EN_WORDS if w in blob]
        assert not leaks, f"English leaked into ID output: {leaks}"
        assert d["context"] == "Deal Bisnis / Klien"

    def test_en_batna_note_and_staged_plan_language(self, client):
        p = full_payload(lang="en", context="business_deal")
        p["alternatives"][0]["value"] = 200_000_000
        p["alternatives"][0]["probability"] = 100
        d = client.post(f"{BASE_URL}/api/analyze", json=p).json()
        n = d["numbers"]
        assert n["batna_superior"] is True
        assert n["batna_note"] and "Your best alternative" in n["batna_note"]
        assert d["batna"]["tier"].startswith(("Dominant", "Strong", "Moderate", "Weak"))

    def test_en_no_base_reason(self, client):
        p = full_payload(lang="en")
        p["current_value"] = None
        p["offer_value"] = None
        d = client.post(f"{BASE_URL}/api/analyze", json=p).json()
        assert d["numbers"]["available"] is False
        assert "No base number" in d["numbers"]["reason"]

    def test_id_no_base_reason(self, client):
        p = full_payload(lang="id")
        p["current_value"] = None
        p["offer_value"] = None
        d = client.post(f"{BASE_URL}/api/analyze", json=p).json()
        assert d["numbers"]["available"] is False
        assert "Angka dasar belum diisi" in d["numbers"]["reason"]


# ---------------- analyze: contexts ----------------
class TestContexts:
    def test_contexts_differ(self, client):
        out = {}
        for ctx in CONTEXTS:
            timing = {"salary_raise": ["review_cycle_near"], "job_offer": ["competing_offer"],
                      "business_deal": ["client_deadline"]}[ctx]
            d = client.post(f"{BASE_URL}/api/analyze", json=full_payload(ctx, "id", timing)).json()
            out[ctx] = d
            assert d["context_key"] == ctx
            assert len(d["script"]["objections"]) >= 4
        openings = {c: out[c]["script"]["opening"] for c in CONTEXTS}
        assert len(set(openings.values())) == 3, openings
        objs = {c: json.dumps(out[c]["script"]["objections"][:4]) for c in CONTEXTS}
        assert len(set(objs.values())) == 3
        nonmon = {c: json.dumps(out[c]["numbers"]["non_monetary"]) for c in CONTEXTS}
        assert len(set(nonmon.values())) == 3
        cps = {c: out[c]["script"]["counterpart"] for c in CONTEXTS}
        assert len(set(cps.values())) == 3

    def test_unknown_context_fallback(self, client):
        r = client.post(f"{BASE_URL}/api/analyze", json=full_payload("freelance_rate", "id"))
        assert r.status_code == 200
        assert r.json()["context_key"] == "salary_raise"

    def test_cross_context_timing_key_ignored(self, client):
        base = full_payload("salary_raise", "id", [])
        t0 = client.post(f"{BASE_URL}/api/analyze", json=base).json()["pact"]["T"]
        cross = full_payload("salary_raise", "id", ["client_deadline"])
        t1 = client.post(f"{BASE_URL}/api/analyze", json=cross).json()["pact"]["T"]
        assert t0 == t1, "timing key from another context changed T score"
        own = full_payload("salary_raise", "id", ["review_cycle_near"])
        t2 = client.post(f"{BASE_URL}/api/analyze", json=own).json()["pact"]["T"]
        assert t2 > t0


# ---------------- regression ----------------
class TestRegression:
    @pytest.mark.parametrize("ctx", CONTEXTS)
    @pytest.mark.parametrize("alt_value", [0, 45_000_000, 500_000_000])
    def test_ladder_monotonic(self, client, ctx, alt_value):
        p = full_payload(ctx, "id", [])
        p["alternatives"][0]["value"] = alt_value
        n = client.post(f"{BASE_URL}/api/analyze", json=p).json()["numbers"]
        vals = [x["value"] for x in n["ladder"]]
        assert vals[0] > vals[1], f"anchor<=target {vals}"
        assert vals[1] >= vals[2] >= vals[3], f"ladder not descending {vals}"
        assert n["anchor"] == vals[0] and n["target"] == vals[1]
        assert n["compromise"] == vals[2] and n["reservation"] == vals[3]

    def test_empty_labels_ignored_in_scores_and_script(self, client):
        p = full_payload("salary_raise", "id", [])
        p["metrics"] = [{"label": "  ", "baseline": 10, "result": 20, "unit": "", "period": "",
                         "impact_value": 100}]
        p["achievements"] = [{"title": "", "impact_value": 5_000_000,
                              "beyond_scope": True, "verifiable": True}]
        d = client.post(f"{BASE_URL}/api/analyze", json=p).json()
        assert d["pact"]["A"] == 0, "empty achievement title contributed to A"
        assert d["pact"]["quantified_metrics"] == 0
        body = " ".join(d["script"]["body"])
        assert "Achievement — ." not in body
        assert "Performance — ." not in body
        assert "Performance —  ." not in body

    def test_persistence_session_roundtrip(self, client):
        p = full_payload()
        analysis = client.post(f"{BASE_URL}/api/analyze", json=p).json()
        r = client.post(f"{BASE_URL}/api/sessions", json={"input": p, "analysis": analysis})
        assert r.status_code == 200
        sid = r.json()["id"]
        g = client.get(f"{BASE_URL}/api/sessions/{sid}")
        assert g.status_code == 200
        doc = g.json()
        assert "_id" not in doc
        assert doc["input"]["context"] == p["context"]
        assert doc["analysis"]["leverage_score"] == analysis["leverage_score"]

    def test_session_404(self, client):
        assert client.get(f"{BASE_URL}/api/sessions/doesnotexist").status_code == 404

    def test_score_increases_with_data(self, client):
        empty = {"lang": "id", "context": "business_deal"}
        lo = client.post(f"{BASE_URL}/api/analyze", json=empty).json()["leverage_score"]
        hi = client.post(f"{BASE_URL}/api/analyze", json=full_payload()).json()["leverage_score"]
        assert hi > lo


# ---------------- AI ----------------
class TestAi:
    @pytest.mark.parametrize("lang", ["id", "en"])
    def test_ai_script_stream(self, client, lang):
        p = full_payload("business_deal", lang)
        analysis = client.post(f"{BASE_URL}/api/analyze", json=p).json()
        start = time.time()
        text = ""
        done = False
        err = None
        with client.post(f"{BASE_URL}/api/ai/generate",
                         json={"input": p, "analysis": analysis, "mode": "script"},
                         stream=True, timeout=90) as resp:
            assert resp.status_code == 200
            for line in resp.iter_lines(decode_unicode=True):
                if not line or not line.startswith("data: "):
                    continue
                ev = json.loads(line[6:])
                if "delta" in ev:
                    text += ev["delta"]
                if ev.get("error"):
                    err = ev["error"]
                if ev.get("done"):
                    done = True
                    break
        elapsed = time.time() - start
        assert err is None, f"AI error: {err}"
        assert done, "stream did not emit done:true"
        assert elapsed < 55, f"took {elapsed:.1f}s"
        assert len(text) > 500, f"output too short: {len(text)}"
        low = text.lower()
        assert "performance" in low and "achievement" in low
        assert "comparison" in low and "timing" in low
        if lang == "en":
            hits = [w for w in (" yang ", " dengan ", " saya ", " adalah ", " tidak ") if w in low]
            assert not hits, f"Indonesian words in EN AI output: {hits}"
        else:
            hits = [w for w in (" the ", " your ", " we need ") if w in low]
            assert not hits, f"English words in ID AI output: {hits}"
