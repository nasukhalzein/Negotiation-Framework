import React, { useState } from "react";

const PILLARS = [
  {
    code: "P",
    name: "Performance",
    tagline: "Hasil yang bisa diukur",
    why: "Perusahaan dan klien tidak membayar usaha. Mereka membayar hasil yang bisa dibuktikan. Pilar ini mengubah 'saya kerja keras' menjadi 'angka ini bergerak karena saya'.",
    how: [
      "Pilih 2–3 metrik yang benar-benar lo pengaruhi (bukan metrik tim yang lo cuma ikut).",
      "Tulis dalam format: baseline → hasil → periode. Contoh: churn 8,2% → 4,7% dalam 6 bulan.",
      "Terjemahkan ke uang kalau bisa: 'penurunan churn ini setara Rp 340 juta pendapatan tertahan/tahun'.",
    ],
    wrong: "\"Saya handle banyak project dan sering lembur.\"",
    right: "\"Waktu proses invoice turun dari 6 hari ke 2 hari. Itu memotong biaya operasional sekitar Rp 18 juta/bulan.\"",
  },
  {
    code: "A",
    name: "Achievement",
    tagline: "Bukti di luar job description",
    why: "Performance menunjukkan lo kompeten. Achievement menunjukkan lo mahal untuk digantikan. Yang dihitung: inisiatif, hal yang tidak diminta tapi lo kerjakan, dan masalah yang lo selesaikan sebelum jadi krisis.",
    how: [
      "Ambil 2–3 pencapaian terbesar, bukan semua daftar kerjaan.",
      "Tiap pencapaian jawab: menghasilkan berapa, menghemat berapa, atau risiko apa yang dihindari.",
      "Pastikan ada yang bisa diverifikasi orang lain (dashboard, email approval, testimoni klien).",
    ],
    wrong: "\"Saya bantu banyak tim lain.\"",
    right: "\"Saya bikin SOP onboarding klien yang sekarang dipakai 3 tim — waktu onboarding turun dari 3 minggu ke 8 hari.\"",
  },
  {
    code: "C",
    name: "Comparison",
    tagline: "Bandingkan dengan pasar, bukan rekan kerja",
    why: "Membandingkan diri dengan rekan kerja membuat lo terlihat iri. Membandingkan dengan harga pasar untuk scope yang sama membuat lo terlihat objektif. Ini yang mengubah negosiasi dari 'permintaan' jadi 'koreksi harga'.",
    how: [
      "Kumpulkan minimal 3 sumber: LinkedIn Salary/Glassdoor, 2 lowongan dengan scope sama, 1–2 percakapan orang industri.",
      "Pakai rentang (P50–P75), bukan satu angka ajaib.",
      "Tunjukkan scope lo hari ini vs scope saat lo pertama masuk / kontrak pertama dibuat.",
    ],
    wrong: "\"Teman saya di kantor lain digaji lebih besar.\"",
    right: "\"Untuk scope seperti ini, rentang pasar Rp 18–24 juta. Posisi saya sekarang Rp 14 juta, sementara scope-nya sudah naik 2 tim.\"",
  },
  {
    code: "T",
    name: "Timing",
    tagline: "Momen menentukan hasil",
    why: "Argumen yang sama bisa dapat 'ya' atau 'tidak' hanya karena beda waktu. Yang lo cari: momen ketika nilai lo paling terlihat dan uang paling tersedia.",
    how: [
      "Terbaik: 6–8 minggu sebelum siklus review / budget planning.",
      "Terbaik: 2–8 minggu setelah lo deliver hasil besar yang terlihat.",
      "Hindari: minggu hiring freeze, setelah target gagal, atau saat atasan sedang krisis.",
    ],
    wrong: "Menyelipkan permintaan di 1-on-1 rutin sambil buru-buru.",
    right: "Minta meeting terpisah 30 menit dengan agenda jelas: \"diskusi kompensasi & scope\".",
  },
];

const MISTAKES = [
  { t: "Menyebut angka lebih dulu tanpa data", d: "Anchor tanpa bukti terbaca sebagai tidak realistis. Bawa rentang pasar dulu, baru angka." },
  { t: "Memakai kebutuhan pribadi sebagai alasan", d: "Cicilan naik bukan masalah mereka. Nilai yang lo hasilkan, itu masalah mereka." },
  { t: "Tidak punya titik walk-away", d: "Tanpa batas bawah, lo akan menerima apa pun yang ditawarkan sambil merasa kalah." },
  { t: "Mengancam dengan resign padahal bluff", d: "Kalau di-call, lo kehilangan semua leverage sekaligus. Pakai BATNA sebagai fakta, bukan ancaman." },
  { t: "Menerima jawaban 'nanti' tanpa tanggal", d: "Selalu tutup dengan komitmen: siapa yang approve, dan kapan jawabannya keluar." },
];

export const Learn = () => {
  const [open, setOpen] = useState(0);

  return (
    <>
      <section id="belajar" className="border-b border-brand-line">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-28">
          <div className="eyebrow">01 · Fundamental</div>
          <h2 className="font-display text-3xl md:text-4xl tracking-tighter mt-5 max-w-3xl">
            Kenapa mayoritas negosiasi gagal sebelum dimulai
          </h2>
          <p className="text-base text-neutral-400 mt-6 max-w-2xl leading-relaxed">
            Bukan karena kurang berani. Tapi karena datang dengan <span className="text-white">permintaan</span>,
            bukan dengan <span className="text-white">argumen</span>. Permintaan bisa ditolak dengan satu kata.
            Argumen yang dibangun dari angka, pembanding pasar, dan alternatif nyata harus dijawab dengan alasan —
            dan di situlah negosiasi lo mulai bergerak.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-brand-line mt-14">
            <div className="bg-[#0f0f0f] p-8">
              <div className="eyebrow text-brand-red">Pendekatan permintaan</div>
              <ul className="mt-5 space-y-3">
                {["\"Saya sudah lama di sini.\"", "\"Saya rasa saya pantas naik.\"", "\"Teman saya digaji lebih tinggi.\"", "\"Biaya hidup naik.\""].map((x) => (
                  <li key={x} className="font-mono text-xs text-neutral-500 leading-relaxed">— {x}</li>
                ))}
              </ul>
              <div className="hairline my-6" />
              <p className="text-sm text-neutral-500">Hasil: mudah ditolak, tidak ada yang bisa didiskusikan lebih lanjut.</p>
            </div>
            <div className="bg-[#0f0f0f] p-8 border-l-2 border-brand-red">
              <div className="eyebrow text-white">Pendekatan argumen (P.A.C.T)</div>
              <ul className="mt-5 space-y-3">
                {[
                  "Angka yang bergerak karena saya (P)",
                  "Dampak dalam rupiah / risiko yang dihindari (A)",
                  "Rentang pasar untuk scope yang sama (C)",
                  "Momen ketika nilai saya paling terlihat (T)",
                ].map((x) => (
                  <li key={x} className="font-mono text-xs text-neutral-300 leading-relaxed">— {x}</li>
                ))}
              </ul>
              <div className="hairline my-6" />
              <p className="text-sm text-neutral-400">Hasil: harus dijawab dengan alasan, bukan penolakan satu kata.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pilar" className="border-b border-brand-line bg-[#0c0c0c]">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-28">
          <div className="eyebrow">02 · Empat Pilar</div>
          <h2 className="font-display text-3xl md:text-4xl tracking-tighter mt-5">P.A.C.T dibongkar satu-satu</h2>
          <p className="text-sm text-neutral-500 mt-4">Klik tiap pilar untuk melihat cara memakainya, plus contoh salah dan benar.</p>

          <div className="mt-12 border border-brand-line divide-y divide-[#262626]">
            {PILLARS.map((p, i) => (
              <div key={p.code}>
                <button
                  data-testid={`pillar-toggle-${p.code}`}
                  onClick={() => setOpen(open === i ? -1 : i)}
                  className="w-full flex items-center gap-5 md:gap-8 px-5 md:px-8 py-6 text-left hover:bg-[#131313] transition-colors duration-200"
                >
                  <span className={`font-display text-3xl w-8 ${open === i ? "text-brand-red" : "text-neutral-600"}`}>{p.code}</span>
                  <span className="flex-1">
                    <span className="block font-display text-xl tracking-tight">{p.name}</span>
                    <span className="block font-mono text-[0.7rem] text-neutral-500 mt-1">{p.tagline}</span>
                  </span>
                  <span className="font-mono text-neutral-500 text-lg">{open === i ? "−" : "+"}</span>
                </button>

                {open === i && (
                  <div className="px-5 md:px-8 pb-9 animate-rise">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
                      <div>
                        <div className="eyebrow text-brand-red mb-3">Kenapa penting</div>
                        <p className="text-sm text-neutral-300 leading-relaxed">{p.why}</p>
                      </div>
                      <div>
                        <div className="eyebrow text-brand-red mb-3">Cara memakai</div>
                        <ul className="space-y-3">
                          {p.how.map((h) => (
                            <li key={h} className="text-sm text-neutral-300 leading-relaxed flex gap-3">
                              <span className="text-brand-red font-mono text-xs mt-1">▸</span>{h}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <div className="border border-brand-line bg-[#101010] p-5">
                          <div className="eyebrow text-neutral-500 mb-2">Lemah</div>
                          <p className="text-sm text-neutral-500 italic">{p.wrong}</p>
                        </div>
                        <div className="border border-brand-red/40 bg-[#141010] p-5">
                          <div className="eyebrow text-brand-red mb-2">Kuat</div>
                          <p className="text-sm text-neutral-200">{p.right}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="batna" className="border-b border-brand-line">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <div className="eyebrow">03 · Harvard Negotiation Project</div>
              <h2 className="font-display text-3xl md:text-4xl tracking-tighter mt-5">
                BATNA: sumber kekuatan lo yang sebenarnya
              </h2>
              <p className="text-sm text-neutral-400 mt-6 leading-relaxed">
                <span className="text-white">Best Alternative to a Negotiated Agreement</span> — apa yang terjadi
                kalau negosiasi ini gagal. Itu saja. Tapi justru itu yang menentukan seberapa tenang lo duduk di kursi.
              </p>
              <p className="text-sm text-neutral-400 mt-4 leading-relaxed">
                Orang tanpa BATNA menerima apa pun yang ditawarkan. Orang dengan BATNA kuat bisa berkata
                "saya perlu memikirkannya" tanpa panik — dan itu terbaca di intonasi lo, bahkan tanpa lo sebut.
              </p>
              <div className="border-l-2 border-brand-red pl-5 mt-8">
                <p className="font-mono text-xs text-neutral-300 leading-relaxed">
                  "Jangan pernah menegosiasikan sesuatu yang lo tidak bisa tinggalkan."
                </p>
                <p className="font-mono text-[0.65rem] text-neutral-600 mt-2">Roger Fisher & William Ury</p>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-px bg-brand-line self-start">
              {[
                { t: "1. Daftar semua alternatif", d: "Offer lain, klien baru, pindah divisi, penghasilan sampingan, atau tabungan yang memberi lo waktu." },
                { t: "2. Nilai tiap alternatif", d: "Berapa nilainya, seberapa besar peluangnya nyata, berapa lama untuk aktif. Engine menghitung expected value-nya." },
                { t: "3. Pilih yang terbaik", d: "BATNA lo bukan gabungan semua opsi — hanya SATU yang terbaik. Itu yang jadi patokan." },
                { t: "4. Kunci sebagai walk-away", d: "Nilai BATNA terbaik = batas bawah lo. Di bawah itu, menolak lebih untung daripada setuju." },
                { t: "5. Perkuat sebelum bicara", d: "2 minggu memperkuat BATNA sering lebih berpengaruh daripada 10 jam melatih kalimat." },
                { t: "6. Jangan dipakai sebagai ancaman", d: "BATNA bekerja dari ketenangan, bukan gertakan. Sebut sebagai konteks, bukan ultimatum." },
              ].map((s) => (
                <div key={s.t} className="bg-[#0f0f0f] p-6 hover:bg-[#131313] transition-colors duration-200">
                  <div className="font-mono text-xs text-brand-red">{s.t}</div>
                  <p className="text-sm text-neutral-400 mt-3 leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hairline my-16" />

          <div className="eyebrow">Kesalahan paling mahal</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-px bg-brand-line mt-6">
            {MISTAKES.map((m, i) => (
              <div key={m.t} className="bg-[#0f0f0f] p-6">
                <div className="font-mono text-[0.65rem] text-neutral-600">0{i + 1}</div>
                <div className="text-sm text-white mt-3 leading-snug">{m.t}</div>
                <p className="text-xs text-neutral-500 mt-3 leading-relaxed">{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
