"""Rule-based negotiation engine: PACT scoring, BATNA analysis, number engine."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

CONTEXTS = {
    "salary_raise": {
        "label": "Kenaikan Gaji / Promosi",
        "counterpart": "atasan & HR",
        "unit": "gaji bulanan",
        "employer_stretch": 1.30,
        "non_monetary": [
            "Review ulang dalam 3 bulan dengan target tertulis",
            "Perubahan job title / level tanpa tunggu siklus",
            "Bonus performa satu kali (sign-on retensi)",
            "Budget training / sertifikasi",
            "Hari kerja fleksibel / remote 2 hari",
        ],
    },
    "job_offer": {
        "label": "Offer Kerja Baru",
        "counterpart": "recruiter / hiring manager",
        "unit": "gaji bulanan",
        "employer_stretch": 1.35,
        "non_monetary": [
            "Sign-on bonus untuk menutup gap",
            "Review gaji dipercepat di bulan ke-6",
            "Tambahan cuti / WFA",
            "Level & scope tim yang lebih tinggi",
            "Penggantian bonus yang hilang dari kantor lama",
        ],
    },
    "business_deal": {
        "label": "Deal Bisnis / Klien",
        "counterpart": "klien / partner",
        "unit": "nilai kontrak",
        "employer_stretch": 1.25,
        "non_monetary": [
            "Termin pembayaran 50% di depan",
            "Scope dikurangi dengan harga tetap",
            "Kontrak jangka panjang dengan harga bertingkat",
            "Klausul revisi terbatas (2x revisi)",
            "Studi kasus / testimoni sebagai kompensasi",
        ],
    },
    "freelance_rate": {
        "label": "Rate Freelance / Project",
        "counterpart": "klien",
        "unit": "rate project",
        "employer_stretch": 1.30,
        "non_monetary": [
            "Deposit 50% sebelum mulai",
            "Batas revisi jelas + biaya revisi tambahan",
            "Retainer bulanan alih-alih per project",
            "Kredit portofolio & referral",
            "Timeline lebih longgar untuk harga yang sama",
        ],
    },
    "vendor": {
        "label": "Negosiasi Vendor / Supplier",
        "counterpart": "vendor",
        "unit": "nilai kontrak",
        "employer_stretch": 1.20,
        "non_monetary": [
            "Termin pembayaran diperpanjang (net 60)",
            "SLA & penalti keterlambatan",
            "Harga terkunci 12 bulan",
            "Free onboarding / training",
            "Volume discount bertingkat",
        ],
    },
    "other": {
        "label": "Negosiasi Lainnya",
        "counterpart": "pihak lawan",
        "unit": "nilai kesepakatan",
        "employer_stretch": 1.25,
        "non_monetary": [
            "Perpanjangan tenggat / timeline",
            "Pembayaran bertahap",
            "Jaminan tertulis untuk review berikutnya",
            "Pengurangan scope dengan nilai tetap",
        ],
    },
}

TIMING_FACTORS = {
    "review_cycle_near": ("Siklus review / budget planning kurang dari 8 minggu", 6),
    "recent_win": ("Baru selesai deliver hasil besar (< 60 hari)", 6),
    "company_growing": ("Perusahaan / klien sedang tumbuh atau untung", 5),
    "scope_increased": ("Scope kerja naik tanpa kompensasi naik", 5),
    "hard_to_replace": ("Sulit / mahal menggantikan posisi saya", 5),
    "competing_offer": ("Ada offer atau peluang lain yang aktif", 6),
    "hiring_freeze": ("Sedang ada hiring freeze / efisiensi biaya", -8),
    "recent_miss": ("Baru saja ada kegagalan target yang terlihat", -7),
}


class Metric(BaseModel):
    label: str = ""
    baseline: Optional[float] = None
    result: Optional[float] = None
    unit: str = ""
    period: str = ""
    impact_value: Optional[float] = None  # nilai rupiah dampak per tahun


class Achievement(BaseModel):
    title: str = ""
    impact_value: Optional[float] = None
    beyond_scope: bool = False
    verifiable: bool = False


class Alternative(BaseModel):
    label: str = ""
    kind: str = "other"  # offer | client | side_income | internal_move | skill | other
    value: Optional[float] = None  # nilai per periode yang sama dengan current
    probability: int = 50  # 0-100
    weeks_to_activate: int = 8
    is_active: bool = False  # sudah nyata / tertulis


class NegotiationInput(BaseModel):
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
    relationship_importance: int = 3  # 1-5, seberapa penting jaga hubungan


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


def score_pact(inp: NegotiationInput, impact_ratio: float) -> Dict[str, Any]:
    # --- P: Performance (0-25)
    quantified = [m for m in inp.metrics if _delta_pct(m) is not None]
    p = min(len(quantified), 3) * 5.0
    if impact_ratio >= 5:
        p += 10
    elif impact_ratio >= 3:
        p += 8
    elif impact_ratio >= 1:
        p += 6
    elif impact_ratio > 0:
        p += 3
    p_score = _clamp(p, 0, 25)

    # --- A: Achievement (0-25)
    with_value = [a for a in inp.achievements if a.impact_value]
    a = min(len(with_value), 3) * 5.0
    if any(x.beyond_scope for x in inp.achievements):
        a += 5
    if any(x.verifiable for x in inp.achievements):
        a += 5
    if not inp.achievements:
        a = 0
    a_score = _clamp(a, 0, 25)

    # --- C: Comparison (0-25)
    c = 0.0
    if inp.market_p50:
        c += 9
    if inp.market_p75:
        c += 5
    if inp.internal_band_known:
        c += 5
    base = inp.current_value or inp.offer_value or 0
    if inp.market_p50 and base and base < inp.market_p50:
        c += 6  # posisi di bawah pasar = argumen objektif kuat
    elif inp.market_p50 and base and base < inp.market_p50 * 1.1:
        c += 3
    if inp.scope_growth_note.strip():
        c += 3
    c_score = _clamp(c, 0, 25)

    # --- T: Timing (0-25)
    t = 8.0  # netral
    for key in inp.timing_factors:
        if key in TIMING_FACTORS:
            t += TIMING_FACTORS[key][1]
    t_score = _clamp(t, 0, 25)

    return {
        "P": round(p_score),
        "A": round(a_score),
        "C": round(c_score),
        "T": round(t_score),
        "total": round(p_score + a_score + c_score + t_score),
        "quantified_metrics": len(quantified),
    }


def score_batna(inp: NegotiationInput) -> Dict[str, Any]:
    alts = [a for a in inp.alternatives if a.label.strip()]
    if not alts:
        return {
            "score": 8,
            "tier": "Tidak Ada BATNA",
            "best": None,
            "expected_value": 0.0,
            "runway_months": None,
            "alternatives": [],
        }

    scored = []
    for a in alts:
        prob = _clamp(a.probability, 0, 100) / 100
        speed = _clamp(1 - (a.weeks_to_activate / 26), 0.1, 1.0)
        ev = (a.value or 0) * prob
        strength = prob * 60 + speed * 25 + (15 if a.is_active else 0)
        scored.append({
            "label": a.label,
            "kind": a.kind,
            "value": a.value or 0,
            "probability": a.probability,
            "weeks_to_activate": a.weeks_to_activate,
            "is_active": a.is_active,
            "expected_value": round(ev),
            "strength": round(_clamp(strength, 0, 100)),
        })

    scored.sort(key=lambda x: (x["strength"], x["expected_value"]), reverse=True)
    best = scored[0]
    diversity = min(len(scored), 3) * 4
    score = _clamp(best["strength"] * 0.8 + diversity, 0, 100)

    runway = None
    tier = (
        "BATNA Dominan" if score >= 75 else
        "BATNA Kuat" if score >= 55 else
        "BATNA Sedang" if score >= 35 else
        "BATNA Lemah"
    )
    return {
        "score": round(score),
        "tier": tier,
        "best": best,
        "expected_value": best["expected_value"],
        "runway_months": runway,
        "alternatives": scored,
    }


def build_numbers(inp: NegotiationInput, leverage: int, batna: Dict[str, Any], impact_ratio: float) -> Dict[str, Any]:
    cfg = CONTEXTS.get(inp.context, CONTEXTS["other"])
    base = inp.current_value or inp.offer_value or 0
    if not base:
        return {"available": False, "reason": "Angka dasar (gaji/nilai saat ini atau offer) belum diisi."}

    p50 = inp.market_p50
    p75 = inp.market_p75 or (p50 * 1.18 if p50 else None)

    market_target = p75 or (p50 * 1.15 if p50 else base * 1.22)
    impact_uplift = 0.08 + min(0.30, impact_ratio * 0.03)
    impact_target = base * (1 + impact_uplift)
    raw_target = max(market_target, impact_target)

    # leverage menyesuaikan agresivitas target
    raw_target *= 0.92 + (leverage / 100) * 0.16

    # reality cap: satu kali negosiasi punya batas lompatan realistis per konteks
    cap_map = {"salary_raise": 1.40, "job_offer": 1.62, "business_deal": 1.50,
               "freelance_rate": 1.60, "vendor": 1.40, "other": 1.50}
    cap_mult = cap_map.get(inp.context, 1.5) * (0.92 + (leverage / 100) * 0.16)
    cap_value = base * cap_mult
    target = min(raw_target, cap_value)
    capped = raw_target > cap_value * 1.02

    if inp.target_value:
        # target user dihormati tapi tetap dibatasi plafon realistis
        target = min(max(target, inp.target_value * 0.98), cap_value * 1.1)

    anchor_mult = 1.06 + (leverage / 100) * 0.09
    anchor = target * anchor_mult

    reservation = max(base, batna["expected_value"] or 0)
    if inp.monthly_expense and inp.context in ("salary_raise", "job_offer"):
        reservation = max(reservation, inp.monthly_expense * 1.15)

    # BATNA lebih tinggi dari plafon realistis: ladder harus tetap menurun,
    # dan verdict-nya berubah jadi "eksekusi alternatif".
    batna_superior = reservation > target
    if batna_superior:
        target = reservation * 1.05
        anchor = target * anchor_mult
        capped = False

    counterpart_max = max((p75 or base * cfg["employer_stretch"]), base * cfg["employer_stretch"])
    zopa_low, zopa_high = _round_money(reservation), _round_money(counterpart_max)
    zopa_exists = zopa_high > zopa_low

    anchor_r = _round_money(anchor)
    target_r = _round_money(target)
    reservation_r = _round_money(reservation)
    mid = _round_money((target_r + reservation_r) / 2)

    ladder = [
        {"step": 1, "label": "Anchor (angka pembuka)", "value": anchor_r,
         "note": "Buka di sini. Jangan menyebut angka ini sebagai 'minimal'."},
        {"step": 2, "label": "Target realistis", "value": target_r,
         "note": "Titik di mana lo tanda tangan tanpa ragu."},
        {"step": 3, "label": "Zona kompromi", "value": mid,
         "note": "Turun ke sini HANYA jika ditukar sesuatu (timeline review, bonus, scope)."},
        {"step": 4, "label": "Walk-away / reservation", "value": reservation_r,
         "note": "Di bawah ini, BATNA lo lebih menguntungkan. Berhenti negosiasi angka."},
    ]

    return {
        "available": True,
        "base": _round_money(base),
        "anchor": anchor_r,
        "target": target_r,
        "compromise": mid,
        "reservation": reservation_r,
        "capped": capped,
        "batna_superior": batna_superior,
        "batna_note": (
            f"Alternatif terbaik lo ({fmt_money(reservation_r, inp.currency)}) sudah lebih tinggi dari yang "
            f"realistis didapat di sini. Posisi lo: minta {fmt_money(anchor_r, inp.currency)} tanpa beban — "
            f"kalau ditolak, eksekusi alternatif itu memang pilihan yang lebih menguntungkan."
            if batna_superior else None
        ),
        "staged_plan": (
            f"Gap ke harga pasar terlalu besar untuk ditutup sekali. Strategi 2 tahap: kunci "
            f"{fmt_money(target_r, inp.currency)} sekarang + kesepakatan tertulis review ke "
            f"{fmt_money(_round_money(min(raw_target, base * 1.75)), inp.currency)} dalam 6–9 bulan dengan kriteria yang jelas."
            if capped else None
        ),
        "increase_pct": round((target_r - base) / base * 100, 1) if base else 0,
        "anchor_increase_pct": round((anchor_r - base) / base * 100, 1) if base else 0,
        "market_p50": _round_money(p50) if p50 else None,
        "market_p75": _round_money(p75) if p75 else None,
        "market_position": (
            None if not p50 else
            "di bawah pasar" if base < p50 * 0.95 else
            "sesuai pasar" if base <= p50 * 1.1 else
            "di atas median pasar"
        ),
        "zopa": {"low": zopa_low, "high": zopa_high, "exists": zopa_exists},
        "ladder": ladder,
        "non_monetary": cfg["non_monetary"],
    }


def build_gaps(inp: NegotiationInput, pact: Dict[str, Any], batna: Dict[str, Any]) -> List[Dict[str, str]]:
    gaps = []
    if pact["P"] < 15:
        gaps.append({
            "pillar": "Performance",
            "problem": "Hasil kerja lo belum berbentuk angka sebelum-sesudah.",
            "action": "Ambil 2 metrik yang lo pengaruhi langsung. Tulis: baseline → hasil → periode. Tanpa ini, argumen lo jadi opini.",
            "impact": "+10 poin leverage",
        })
    if pact["A"] < 15:
        gaps.append({
            "pillar": "Achievement",
            "problem": "Pencapaian belum diterjemahkan ke nilai uang / risiko yang dihindari.",
            "action": "Untuk tiap pencapaian, jawab: 'ini menghasilkan / menghemat berapa?' Perkiraan dengan asumsi jelas tetap jauh lebih kuat daripada kosong.",
            "impact": "+8 poin leverage",
        })
    if pact["C"] < 14:
        gaps.append({
            "pillar": "Comparison",
            "problem": "Belum ada pembanding pasar yang objektif.",
            "action": "Kumpulkan 3 data: LinkedIn Salary / Glassdoor, 2 job posting dengan scope sama, dan tanya 1–2 orang di industri. Pakai rentang, bukan satu angka.",
            "impact": "+9 poin leverage",
        })
    if pact["T"] < 12:
        gaps.append({
            "pillar": "Timing",
            "problem": "Momen sekarang bukan momen terkuat lo.",
            "action": "Tunda 4–8 minggu: kunci satu hasil besar dulu, atau masuk 6–8 minggu sebelum siklus review/budget planning.",
            "impact": "+6 poin leverage",
        })
    if batna["score"] < 35:
        gaps.append({
            "pillar": "BATNA",
            "problem": "Lo belum punya alternatif nyata, jadi posisi lo bergantung pada goodwill pihak lawan.",
            "action": "Target 2 minggu: 5 aplikasi/pitch keluar, 2 percakapan eksploratif. BATNA tidak harus dipakai — cukup ada supaya lo tenang.",
            "impact": "+15 poin leverage",
        })
    return gaps


def build_risks(inp: NegotiationInput, numbers: Dict[str, Any], leverage: int, batna: Dict[str, Any]) -> List[Dict[str, str]]:
    risks = []
    if numbers.get("available") and not numbers["zopa"]["exists"]:
        risks.append({
            "level": "tinggi",
            "title": "Tidak ada zona kesepakatan (ZOPA)",
            "detail": "Titik walk-away lo lebih tinggi dari kemampuan realistis pihak lawan. Pilihannya: pindah ke komponen non-uang, atau eksekusi BATNA.",
        })
    if numbers.get("available") and numbers["anchor_increase_pct"] > 45 and leverage < 60:
        risks.append({
            "level": "sedang",
            "title": f"Anchor {numbers['anchor_increase_pct']}% dengan bukti yang belum kuat",
            "detail": "Angka besar tanpa dokumentasi dampak akan dibaca sebagai tidak realistis. Perkuat pilar P & A dulu, atau turunkan anchor.",
        })
    if leverage < 40:
        risks.append({
            "level": "tinggi",
            "title": "Leverage masih rendah untuk membuka negosiasi",
            "detail": "Peluang ditolak besar dan penolakan mengunci lo minimal 6 bulan. Kerjakan action plan dulu, baru minta meeting.",
        })
    if "hiring_freeze" in inp.timing_factors:
        risks.append({
            "level": "sedang",
            "title": "Kondisi efisiensi biaya",
            "detail": "Fokus ke non-uang yang bisa dikunci sekarang (title, scope, komitmen review tertulis di kuartal depan).",
        })
    if batna["score"] >= 60 and inp.relationship_importance >= 4:
        risks.append({
            "level": "rendah",
            "title": "BATNA kuat tapi hubungan penting",
            "detail": "Jangan pakai alternatif sebagai ancaman. Framing: 'Saya ingin tetap di sini, bantu saya membuat itu jadi keputusan yang mudah.'",
        })
    if not risks:
        risks.append({
            "level": "rendah",
            "title": "Posisi relatif aman",
            "detail": "Tidak ada red flag besar. Fokus ke eksekusi: latih pembukaan 3x dan siapkan jawaban 3 penolakan umum.",
        })
    return risks


def build_script(inp: NegotiationInput, pact: Dict[str, Any], numbers: Dict[str, Any], batna: Dict[str, Any]) -> Dict[str, Any]:
    cfg = CONTEXTS.get(inp.context, CONTEXTS["other"])
    role = inp.role or "peran saya"
    cur = inp.currency
    top_metric = next((m for m in inp.metrics if _delta_pct(m) is not None), None)
    top_ach = next((a for a in inp.achievements if a.impact_value and a.title.strip()), None) or \
        next((a for a in inp.achievements if a.title.strip()), None)

    perf_line = (
        f"{top_metric.label} bergerak dari {top_metric.baseline:g} ke {top_metric.result:g} {top_metric.unit} {top_metric.period}".strip()
        if top_metric else "hasil kerja yang saya pegang membaik dibanding periode sebelumnya"
    )
    ach_line = top_ach.title if top_ach else "beberapa inisiatif di luar job description saya"
    anchor_txt = numbers.get("anchor")

    opening = (
        f"Terima kasih waktunya. Saya mau bicara soal kompensasi untuk {role}, "
        f"dan saya sudah siapkan datanya supaya ini jadi diskusi yang objektif, bukan soal perasaan."
    )
    body = [
        f"Performance — {perf_line}.",
        f"Achievement — {ach_line}.",
        (f"Comparison — untuk scope seperti ini, rentang pasar berada di sekitar "
         f"{fmt_money(numbers.get('market_p50') or numbers.get('target'), cur)}–"
         f"{fmt_money(numbers.get('market_p75') or numbers.get('anchor'), cur)}, "
         f"sementara posisi saya sekarang di {fmt_money(numbers.get('base'), cur)}."),
        "Timing — " + (
            "kita ada di depan siklus review, jadi ini waktu paling tepat membicarakannya."
            if "review_cycle_near" in inp.timing_factors else
            "saya baru menyelesaikan siklus kerja penuh dengan hasil yang bisa dilihat."
        ),
    ]
    ask = (
        f"Berdasarkan itu, angka yang saya ajukan adalah {fmt_money(anchor_txt, cur)}. "
        f"Saya terbuka mendiskusikan struktur — yang penting kita sepakat soal nilai kontribusinya."
        if anchor_txt else
        "Berdasarkan itu, saya ingin kita sepakati angka yang mencerminkan kontribusi ini."
    )
    silence = "Setelah menyebut angka: berhenti bicara. Diam 5 detik. Biarkan mereka merespons pertama."

    objections = [
        {
            "objection": "\"Budget-nya nggak ada sekarang.\"",
            "response": ("\"Saya mengerti. Kalau angka ini bukan sekarang, boleh kita sepakati kapan bisa? "
                         "Misal: kita kunci review di bulan ke-3 dengan target yang tertulis, atau bagian dari gap "
                         "ditutup lewat bonus performa.\" — pindahkan negosiasi dari 'iya/tidak' ke 'kapan dan bagaimana'."),
        },
        {
            "objection": "\"Angkamu di atas struktur kami.\"",
            "response": ("\"Boleh saya tahu range untuk level ini? Kalau saya di batas atas, saya ingin tahu "
                         "apa yang membuat seseorang naik level — supaya kita bicara jalurnya, bukan cuma angkanya.\""),
        },
        {
            "objection": "\"Orang lain di posisi yang sama juga digaji segitu.\"",
            "response": ("\"Saya tidak membandingkan dengan rekan kerja. Saya membandingkan hasil saya dengan "
                         "target dan dengan harga pasar untuk scope yang sama.\""),
        },
        {
            "objection": "\"Kamu masih terlalu baru.\"",
            "response": (f"\"Saya {inp.tenure_months} bulan di sini, dan dalam periode itu {perf_line.lower()}. "
                         "Saya mengerti kalau lama kerja jadi pertimbangan — usulan saya: kita sepakati angka sekarang "
                         "dengan efektif di bulan depan, atau review terjadwal dengan kriteria yang jelas.\""),
        },
    ]
    if batna["score"] >= 55:
        objections.append({
            "objection": "Mereka menekan / menunda tanpa jawaban",
            "response": ("Sebut alternatif tanpa mengancam: \"Saya sedang mempertimbangkan beberapa opsi, "
                         "tapi preferensi pertama saya tetap di sini. Saya butuh kejelasan sebelum "
                         f"{max(2, (batna['best'] or {}).get('weeks_to_activate', 4))} minggu ke depan.\""),
        })

    closing = (
        "Tutup dengan komitmen konkret: \"Boleh kita sepakati langkah berikutnya hari ini — "
        "siapa yang perlu approve, dan kapan saya bisa dapat jawabannya?\" Lalu kirim ringkasan lewat email dalam 24 jam."
    )
    return {"opening": opening, "body": body, "ask": ask, "silence_rule": silence,
            "objections": objections, "closing": closing, "counterpart": cfg["counterpart"]}


def build_checklist(inp: NegotiationInput, pact: Dict[str, Any], batna: Dict[str, Any], numbers: Dict[str, Any]) -> List[Dict[str, Any]]:
    items = [
        {"phase": "Data", "task": "Tulis 2–3 metrik dengan format baseline → hasil → periode", "done": pact["quantified_metrics"] >= 2},
        {"phase": "Data", "task": "Kuantifikasi minimal 1 pencapaian dalam nilai uang", "done": any(a.impact_value for a in inp.achievements)},
        {"phase": "Data", "task": "Kumpulkan 3 sumber data pasar (rentang, bukan 1 angka)", "done": bool(inp.market_p50 and inp.market_p75)},
        {"phase": "Posisi", "task": "Tentukan anchor, target, dan walk-away secara tertulis", "done": numbers.get("available", False)},
        {"phase": "Posisi", "task": "Punya minimal 1 BATNA yang nyata / aktif", "done": batna["score"] >= 45},
        {"phase": "Eksekusi", "task": "Latih pembukaan 3x sampai bisa tanpa membaca", "done": False},
        {"phase": "Eksekusi", "task": "Siapkan jawaban untuk 3 penolakan paling mungkin", "done": False},
        {"phase": "Eksekusi", "task": "Jadwalkan meeting terpisah (jangan nyempil di 1-on-1 biasa)", "done": False},
        {"phase": "Setelah", "task": "Kirim ringkasan kesepakatan lewat email dalam 24 jam", "done": False},
    ]
    return items


def analyze(inp: NegotiationInput) -> Dict[str, Any]:
    base = inp.current_value or inp.offer_value or 0
    total_impact = sum(
        [m.impact_value or 0 for m in inp.metrics] + [a.impact_value or 0 for a in inp.achievements]
    )
    annual_base = base * 12 if inp.context in ("salary_raise", "job_offer") else base
    impact_ratio = (total_impact / annual_base) if annual_base else 0

    pact = score_pact(inp, impact_ratio)
    batna = score_batna(inp)
    leverage = round(_clamp(pact["total"] * 0.7 + batna["score"] * 0.3, 0, 100))

    tier = (
        {"label": "Posisi Dominan", "verdict": "Buka negosiasi sekarang. Lo punya bukti dan alternatif.", "color": "strong"} if leverage >= 75 else
        {"label": "Posisi Kuat", "verdict": "Siap negosiasi. Tutup 1–2 gap di bawah untuk memaksimalkan hasil.", "color": "good"} if leverage >= 58 else
        {"label": "Sedang Dibangun", "verdict": "Jangan minta meeting minggu ini. Eksekusi action plan 2–4 minggu dulu.", "color": "medium"} if leverage >= 40 else
        {"label": "Belum Siap", "verdict": "Negosiasi sekarang berisiko ditolak dan mengunci lo 6 bulan. Bangun bukti dulu.", "color": "weak"}
    )

    numbers = build_numbers(inp, leverage, batna, impact_ratio)
    return {
        "context": CONTEXTS.get(inp.context, CONTEXTS["other"])["label"],
        "leverage_score": leverage,
        "tier": tier,
        "pact": pact,
        "batna": batna,
        "impact": {
            "total_value": round(total_impact),
            "ratio": round(impact_ratio, 2),
            "statement": (
                f"Dampak terdokumentasi {round(impact_ratio, 1)}x dari biaya tahunan lo — ini argumen ROI, bukan permintaan."
                if impact_ratio >= 1 else
                "Dampak dalam angka belum cukup untuk membangun argumen ROI. Ini gap terbesar lo."
            ),
        },
        "numbers": numbers,
        "gaps": build_gaps(inp, pact, batna),
        "risks": build_risks(inp, numbers, leverage, batna),
        "script": build_script(inp, pact, numbers, batna),
        "checklist": build_checklist(inp, pact, batna, numbers),
        "readiness_pct": leverage,
    }
