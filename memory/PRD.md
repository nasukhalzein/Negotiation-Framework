# PRD — CONCEPTOR: P.A.C.T × BATNA Negotiation Engine

## Problem Statement (asli, dari user)
Membuat sistem aplikasi web untuk framework P.A.C.T (negosiasi yang sulit ditolak) dengan edukasi fundamental + teknik.
User mengisi form framework dan sistem memberi output konkret sesuai kondisi user. Masalah versi artifact sebelumnya:
output terlalu statis dan kurang objektif. Framework harus mudah dipahami semua orang, bisa dipakai untuk negosiasi gaji,
pekerjaan, bisnis, dan lainnya. Harus menambahkan Framework BATNA (Harvard Negotiation Project) yang terintegrasi
dengan halaman P.A.C.T.

## User Choices
- Output: kombinasi rule-based engine + AI (Claude Sonnet 4.6 via Emergent LLM key)
- Konteks: semua (gaji/kenaikan, offer kerja, bisnis/klien, rate freelance, vendor, lainnya)
- Tanpa login; hasil bisa dicopy/export
- Identitas visual CONCEPTOR dipertahankan (hitam, aksen merah, mono)

## Arsitektur
- Frontend: React (CRA) + Tailwind, single page bersection: Hero → Edukasi → 4 Pilar → BATNA → Builder → Hasil → AI Coach.
  State di `App.js`, disimpan di localStorage (`conceptor_pact_input_v1`), auto-analyze debounce 400ms.
- Backend: FastAPI. `engine.py` = rule engine deterministik. `server.py` = routes + SSE AI streaming.
- MongoDB: koleksi `pact_sessions` (simpan/ambil hasil, opsional).
- AI: `emergentintegrations` LlmChat → anthropic `claude-sonnet-4-6`, max_tokens 2600 (agar selesai < 60s ingress).

## Endpoint
- `GET /api/meta` — daftar konteks & faktor timing
- `POST /api/analyze` — leverage score, PACT breakdown, BATNA analysis, numbers (anchor/target/compromise/walk-away, ZOPA, ladder), gaps, risks, script, checklist
- `POST /api/sessions`, `GET /api/sessions/{id}`
- `POST /api/ai/generate` — SSE stream; mode: `script` | `objections` | `email` | `prompt`

## Rule Engine (inti "dinamis & objektif")
- PACT scoring 4×25: P (metrik terkuantifikasi + rasio dampak), A (nilai uang, di luar scope, verifiable), C (P50/P75, band internal, posisi vs pasar, scope growth), T (8 faktor timing, 2 di antaranya bernilai negatif).
- BATNA: expected value = value × probability, strength = probability + kecepatan aktivasi + status nyata; diurutkan, terbaik jadi patokan.
- Leverage = 0.7 × PACT + 0.3 × BATNA → 4 tier verdict.
- Numbers: target dari max(market target, impact target) × faktor leverage, dibatasi reality cap per konteks (salary_raise 1.40× dst) → `staged_plan` bila gap pasar terlalu besar; walk-away = max(base, BATNA EV, 1.15× pengeluaran); `batna_superior` bila BATNA > plafon realistis; ZOPA vs kemampuan realistis lawan; concession ladder 4 langkah selalu menurun.
- Gaps (action plan + potensi poin), risks (level tinggi/sedang/rendah), skrip dasar + 4–5 objection handling, checklist kesiapan.

## Implemented (Juni 2026)
- [x] Halaman edukasi: kenapa negosiasi gagal, 4 pilar accordion (kenapa/cara/contoh lemah vs kuat), BATNA 6 langkah, 5 kesalahan mahal
- [x] Builder 6 langkah dengan skor live per pilar
- [x] Panel hasil: leverage, breakdown, angka + ZOPA bar, ladder, BATNA analysis, gaps, risks, skrip, checklist
- [x] AI Coach 4 mode streaming + copy (dengan fallback clipboard)
- [x] Reality cap + strategi 2 tahap + penanganan kasus tanpa ZOPA / BATNA superior
- [x] Tested: 32 pytest backend pass + E2E frontend (iteration_1, iteration_2)

## Backlog
- P1: Simpan & share hasil via URL (`/s/{id}`) memakai endpoint sessions yang sudah ada
- P1: Export PDF one-pager untuk dibawa ke meeting
- P2: Roleplay chat interaktif (AI jadi atasan/klien yang menekan) dengan skor performa
- P2: Referensi rentang gaji per role Indonesia (data seed) agar user tidak perlu riset manual
- P2: Multi-skenario (bandingkan 2 tawaran side-by-side)
