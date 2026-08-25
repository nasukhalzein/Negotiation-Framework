import json, os, time, urllib.request

API = None
for line in open("/app/frontend/.env"):
    if line.startswith("REACT_APP_BACKEND_URL"):
        API = line.strip().split("=", 1)[1] + "/api"

inp = {
    "context": "salary_raise", "role": "Product Designer", "currency": "IDR",
    "current_value": 14000000, "market_p50": 18000000, "market_p75": 24000000,
    "metrics": [{"label": "Churn", "baseline": 8.2, "result": 4.7, "unit": "%", "period": "6 bulan", "impact_value": 340000000}],
    "achievements": [{"title": "SOP onboarding", "impact_value": 120000000, "beyond_scope": True, "verifiable": True}],
    "timing_factors": ["review_cycle_near"],
    "alternatives": [{"label": "Offer PT X", "value": 22000000, "probability": 70, "weeks_to_activate": 4, "is_active": True}],
}

req = urllib.request.Request(f"{API}/analyze", data=json.dumps(inp).encode(),
                             headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"})
analysis = json.load(urllib.request.urlopen(req))

payload = json.dumps({"input": inp, "analysis": analysis, "mode": "script"}).encode()
req2 = urllib.request.Request(f"{API}/ai/generate", data=payload, headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"})
t0 = time.time()
text, done = "", False
with urllib.request.urlopen(req2) as r:
    for raw in r:
        line = raw.decode().strip()
        if not line.startswith("data:"):
            continue
        ev = json.loads(line[5:])
        if "delta" in ev:
            text += ev["delta"]
        if ev.get("done"):
            done = True
        if ev.get("error"):
            print("ERROR", ev["error"])
print(f"elapsed={time.time()-t0:.1f}s chars={len(text)} done={done}")
print(text[:400])
print("...TAIL...", text[-300:])
