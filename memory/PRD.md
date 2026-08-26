# PRD — CONCEPTOR: P.A.C.T × BATNA Negotiation Engine

## Problem Statement (asli, dari user)
Aplikasi web untuk framework P.A.C.T (negosiasi yang sulit ditolak) dengan edukasi fundamental + teknik.
User mengisi form dan sistem memberi output konkret sesuai kondisinya (bukan template statis), terintegrasi dengan
Framework BATNA (Harvard Negotiation Project).

Iterasi kedua (permintaan lanjutan user):
- Bahasa dan kalimat harus mudah dipahami orang awam, dengan gaya buku profesional dan disertai penjelasan.
- Fokus pada tiga kategori: kenaikan gaji, offer kerja baru, deal bisnis/klien.
- Form input dinamis mengikuti kategori; hasil juga dinamis sesuai P.A.C.T dan BATNA.
- Panduan pengisian form per kategori pada setiap langkah.
- Fitur dua bahasa: Indonesia dan Inggris.
- Headline: "Ubah Negosiasi jadi lebih sulit ditolak! karena dibangun dengan data, bukan perasaan."
- Logo mengikuti referensi (lockup horizontal CONCEPTOR dengan bola titik merah).

## User Choices
- Rule-based engine + AI (Claude Sonnet 4.6 via Emergent LLM key)
- Tanpa login; hasil dapat disalin
- Identitas visual CONCEPTOR: hitam, aksen merah, tipografi mono

## Arsitektur
- Frontend: React + Tailwind. Satu halaman: Hero → Dasar → 4 Pilar → BATNA → Plan Builder → Hasil → AI Coach.
  State di `App.js` (localStorage `conceptor_pact_input_v2`), auto-analyze debounce 400 ms.
  i18n: `src/i18n/{index,id,en}.js` — LangProvider + `useLang()`, bahasa disimpan di `conceptor_lang`.
- Backend: FastAPI. `engine.py` (rule engine, bilingual via `texts.py`), `server.py` (routes + SSE AI).
- MongoDB: koleksi `pact_sessions`.
- Logo: `/app/frontend/public/logo.png` (hasil crop + transparansi dari aset referensi user).

## Endpoint
- `GET /api/meta?lang=` — 3 konteks + faktor timing per konteks (label sesuai bahasa)
- `POST /api/analyze` — menerima `lang`; mengembalikan leverage score, PACT breakdown, BATNA, numbers (anchor/target/compromise/walk-away, ZOPA, ladder), gaps, risks, script, checklist
- `POST /api/sessions`, `GET /api/sessions/{id}`
- `POST /api/ai/generate` — SSE stream; mode `script` | `objections` | `email` | `prompt`, mengikuti bahasa input

## Rule Engine
- PACT 4×25: P (metrik terkuantifikasi + rasio dampak), A (nilai uang, di luar remit, verifiable), C (P50/P75, band internal, posisi pasar, scope), T (8 faktor timing **per kategori**, sebagian bernilai negatif).
- BATNA: expected value = nilai × peluang; strength = peluang + kecepatan aktivasi + status nyata.
- Leverage = 0.7 × PACT + 0.3 × BATNA → 4 tier verdict.
- Numbers: reality cap per kategori (salary_raise 1.40×, job_offer 1.62×, business_deal 1.50×), staged_plan bila gap pasar terlalu lebar, walk-away dari BATNA/pengeluaran, penanganan `batna_superior`, ZOPA, concession ladder selalu menurun.
- Skrip: opening & 4 objection khas per kategori, objection tambahan bila BATNA kuat.

## Implemented
- 2026-06 (v1): edukasi P.A.C.T + BATNA, builder 6 langkah, panel hasil lengkap, AI Coach 4 mode streaming, reality cap, kasus tanpa ZOPA.
- 2026-06 (v2): bilingual ID/EN penuh (UI + keluaran engine + AI), 3 kategori, form & label dinamis per kategori, panduan pengisian per kategori pada 6 langkah, faktor timing per kategori, headline baru, logo baru, gaya bahasa buku profesional.
- Tested: 27/27 pytest backend + 4 suite Playwright (iteration_3.json) tanpa cacat fungsional.

## Backlog
- P1: Simpan & bagikan hasil melalui URL (`/s/{id}`) memakai endpoint sessions
- P1: Export PDF satu halaman untuk dibawa ke pertemuan
- P2: Roleplay chat interaktif (AI sebagai atasan/klien) dengan penilaian
- P2: Data rentang gaji/harga per peran (Indonesia) sebagai referensi bawaan
- P2: Bandingkan dua tawaran secara berdampingan
- P3: Guard timeout pada stream AI (asyncio.wait_for)
