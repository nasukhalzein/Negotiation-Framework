import React from "react";
import { Plus } from "lucide-react";
import { Label, TextField, MoneyField, NumField, Chip, Toggle, SectionHead, RowCard } from "./Field";
import { emptyMetric, emptyAchievement, emptyAlternative, ALT_KINDS } from "../lib/schema";

export const CONTEXT_LIST = [
  { key: "salary_raise", label: "Kenaikan Gaji / Promosi", desc: "Sudah bekerja, ingin naik" },
  { key: "job_offer", label: "Offer Kerja Baru", desc: "Nego offer sebelum tanda tangan" },
  { key: "business_deal", label: "Deal Bisnis / Klien", desc: "Kontrak, harga, scope" },
  { key: "freelance_rate", label: "Rate Freelance / Project", desc: "Per project atau retainer" },
  { key: "vendor", label: "Vendor / Supplier", desc: "Menekan biaya, memperbaiki termin" },
  { key: "other", label: "Negosiasi Lainnya", desc: "Sewa, kerja sama, dll" },
];

export const TIMING_LIST = [
  { key: "review_cycle_near", label: "Siklus review / budget planning kurang dari 8 minggu" },
  { key: "recent_win", label: "Baru selesai deliver hasil besar (< 60 hari)" },
  { key: "company_growing", label: "Perusahaan / klien sedang tumbuh atau untung" },
  { key: "scope_increased", label: "Scope kerja naik tanpa kompensasi naik" },
  { key: "hard_to_replace", label: "Sulit / mahal menggantikan posisi saya" },
  { key: "competing_offer", label: "Ada offer atau peluang lain yang aktif" },
  { key: "hiring_freeze", label: "Sedang ada hiring freeze / efisiensi biaya" },
  { key: "recent_miss", label: "Baru saja ada kegagalan target yang terlihat" },
];

const AddBtn = ({ onClick, children, testId }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testId}
    className="inline-flex items-center gap-2 font-mono text-[0.7rem] tracking-widest uppercase text-neutral-400 border border-dashed border-brand-line px-4 py-3 hover:border-brand-red hover:text-white transition-colors duration-200"
  >
    <Plus size={13} strokeWidth={1.5} /> {children}
  </button>
);

export const ContextStep = ({ input, set }) => (
  <div>
    <SectionHead code="00" title="Konteks negosiasi lo" desc="Engine memakai konteks ini untuk menentukan pembanding, batas realistis pihak lawan, dan opsi non-uang yang bisa ditukar." />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {CONTEXT_LIST.map((c) => (
        <Chip key={c.key} testId={`context-${c.key}`} active={input.context === c.key} onClick={() => set("context", c.key)}>
          <span className="block text-[0.78rem] text-inherit">{c.label}</span>
          <span className="block text-[0.65rem] text-neutral-500 mt-1 normal-case">{c.desc}</span>
        </Chip>
      ))}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
      <TextField testId="input-role" label="Peran / posisi / jenis pekerjaan" placeholder="mis. Product Designer, Agensi Branding" value={input.role} onChange={(v) => set("role", v)} />
      <NumField testId="input-tenure" label="Lama menjalani (bulan)" suffix="bulan" value={input.tenure_months} onChange={(v) => set("tenure_months", v || 0)} />
      <div>
        <Label>Mata uang</Label>
        <div className="flex gap-2">
          {["IDR", "USD", "SGD"].map((c) => (
            <Chip key={c} testId={`currency-${c}`} active={input.currency === c} onClick={() => set("currency", c)}>{c}</Chip>
          ))}
        </div>
      </div>
      <MoneyField
        testId="input-current-value"
        currency={input.currency}
        label={input.context === "job_offer" ? "Gaji sekarang (jika ada)" : "Nilai sekarang (gaji / rate / kontrak)"}
        hint="Ini jadi titik nol perhitungan. Wajib supaya angka anchor bisa dihitung."
        value={input.current_value}
        onChange={(v) => set("current_value", v)}
      />
      {(input.context === "job_offer" || input.context === "business_deal" || input.context === "vendor") && (
        <MoneyField testId="input-offer-value" currency={input.currency} label="Angka yang ditawarkan pihak lawan" value={input.offer_value} onChange={(v) => set("offer_value", v)} />
      )}
      <MoneyField testId="input-target-value" currency={input.currency} label="Angka yang lo inginkan (opsional)" hint="Kalau kosong, engine yang menentukan target objektifnya." value={input.target_value} onChange={(v) => set("target_value", v)} />
    </div>
  </div>
);

export const PerformanceStep = ({ input, set, setList, addRow, removeRow }) => (
  <div>
    <SectionHead code="P" title="Performance — angka yang bergerak karena lo" desc="Format wajib: baseline → hasil → periode. Kalau lo tidak punya angka pasti, pakai estimasi dengan asumsi yang jelas. Estimasi masih jauh lebih kuat daripada kosong." />
    <div className="space-y-4">
      {input.metrics.map((m, i) => (
        <RowCard key={i} index={i} testId={`metric-${i}`} onRemove={input.metrics.length > 1 ? () => removeRow("metrics", i) : null}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <TextField testId={`metric-${i}-label`} label="Metrik" placeholder="mis. Waktu proses invoice" value={m.label} onChange={(v) => setList("metrics", i, "label", v)} />
            </div>
            <div className="md:col-span-2">
              <NumField testId={`metric-${i}-baseline`} label="Sebelum" value={m.baseline} onChange={(v) => setList("metrics", i, "baseline", v)} />
            </div>
            <div className="md:col-span-2">
              <NumField testId={`metric-${i}-result`} label="Sesudah" value={m.result} onChange={(v) => setList("metrics", i, "result", v)} />
            </div>
            <div className="md:col-span-3">
              <TextField testId={`metric-${i}-unit`} label="Satuan" placeholder="hari / % / unit" value={m.unit} onChange={(v) => setList("metrics", i, "unit", v)} />
            </div>
            <div className="md:col-span-5">
              <TextField testId={`metric-${i}-period`} label="Periode" placeholder="dalam 6 bulan terakhir" value={m.period} onChange={(v) => setList("metrics", i, "period", v)} />
            </div>
            <div className="md:col-span-7">
              <MoneyField testId={`metric-${i}-impact`} currency={input.currency} label="Nilai dampak per tahun (estimasi)" hint="Pendapatan yang dihasilkan / biaya yang dihemat karena perubahan ini." value={m.impact_value} onChange={(v) => setList("metrics", i, "impact_value", v)} />
            </div>
          </div>
        </RowCard>
      ))}
    </div>
    {input.metrics.length < 5 && (
      <div className="mt-5"><AddBtn testId="add-metric" onClick={() => addRow("metrics", emptyMetric)}>Tambah metrik</AddBtn></div>
    )}
  </div>
);

export const AchievementStep = ({ input, setList, addRow, removeRow }) => (
  <div>
    <SectionHead code="A" title="Achievement — bukti lo mahal untuk digantikan" desc="Fokus ke 2–3 pencapaian terbesar. Yang dihitung engine: apakah ada nilai uangnya, apakah di luar job description, dan apakah bisa diverifikasi orang lain." />
    <div className="space-y-4">
      {input.achievements.map((a, i) => (
        <RowCard key={i} index={i} testId={`ach-${i}`} onRemove={input.achievements.length > 1 ? () => removeRow("achievements", i) : null}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7">
              <TextField testId={`ach-${i}-title`} label="Pencapaian" placeholder="mis. Membangun SOP onboarding yang dipakai 3 tim" value={a.title} onChange={(v) => setList("achievements", i, "title", v)} />
            </div>
            <div className="md:col-span-5">
              <MoneyField testId={`ach-${i}-impact`} currency={input.currency} label="Nilai / penghematan (estimasi tahunan)" value={a.impact_value} onChange={(v) => setList("achievements", i, "impact_value", v)} />
            </div>
            <div className="md:col-span-6">
              <Toggle testId={`ach-${i}-beyond`} active={a.beyond_scope} onClick={() => setList("achievements", i, "beyond_scope", !a.beyond_scope)}>Di luar job description / tidak diminta</Toggle>
            </div>
            <div className="md:col-span-6">
              <Toggle testId={`ach-${i}-verifiable`} active={a.verifiable} onClick={() => setList("achievements", i, "verifiable", !a.verifiable)}>Bisa diverifikasi (data, email, testimoni)</Toggle>
            </div>
          </div>
        </RowCard>
      ))}
    </div>
    {input.achievements.length < 5 && (
      <div className="mt-5"><AddBtn testId="add-achievement" onClick={() => addRow("achievements", emptyAchievement)}>Tambah pencapaian</AddBtn></div>
    )}
  </div>
);

export const ComparisonStep = ({ input, set }) => (
  <div>
    <SectionHead code="C" title="Comparison — harga pasar untuk scope yang sama" desc="Cari di LinkedIn Salary, Glassdoor, atau 2–3 lowongan/penawaran dengan scope mirip. Pakai rentang, bukan satu angka. Ini yang mengubah permintaan lo jadi koreksi harga." />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MoneyField testId="input-p50" currency={input.currency} label="Median pasar (P50)" hint="Angka tengah untuk peran & level yang sama." value={input.market_p50} onChange={(v) => set("market_p50", v)} />
      <MoneyField testId="input-p75" currency={input.currency} label="Batas atas pasar (P75)" hint="Yang dibayar untuk kandidat/vendor kuat di level yang sama." value={input.market_p75} onChange={(v) => set("market_p75", v)} />
      <div className="md:col-span-2">
        <Toggle testId="input-band" active={input.internal_band_known} onClick={() => set("internal_band_known", !input.internal_band_known)}>
          Saya tahu struktur/range internal untuk level ini
        </Toggle>
      </div>
      <div className="md:col-span-2">
        <TextField area testId="input-scope" label="Perubahan scope sejak awal" hint="Apa yang lo pegang sekarang tapi belum lo pegang saat angka lo terakhir ditentukan?" placeholder="mis. dulu handle 1 produk, sekarang 3 produk + 2 junior + laporan langsung ke direksi" value={input.scope_growth_note} onChange={(v) => set("scope_growth_note", v)} />
      </div>
    </div>
  </div>
);

export const TimingStep = ({ input, set }) => {
  const toggle = (key) => {
    const has = input.timing_factors.includes(key);
    set("timing_factors", has ? input.timing_factors.filter((k) => k !== key) : [...input.timing_factors, key]);
  };
  return (
    <div>
      <SectionHead code="T" title="Timing — jujur soal momen sekarang" desc="Centang yang benar-benar berlaku. Dua item terakhir menurunkan skor lo — dan itu justru berguna, karena engine akan menyarankan menunda daripada lo ditolak." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TIMING_LIST.map((t) => (
          <Toggle key={t.key} testId={`timing-${t.key}`} active={input.timing_factors.includes(t.key)} onClick={() => toggle(t.key)}>{t.label}</Toggle>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <div>
          <Label hint="1 = hubungan tidak penting, 5 = harus tetap harmonis apa pun hasilnya">Seberapa penting menjaga hubungan?</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip key={n} testId={`relationship-${n}`} active={input.relationship_importance === n} onClick={() => set("relationship_importance", n)}>{n}</Chip>
            ))}
          </div>
        </div>
        <MoneyField testId="input-expense" currency={input.currency} label="Pengeluaran wajib per bulan (opsional)" hint="Dipakai untuk menghitung batas bawah yang realistis, bukan untuk dipakai sebagai argumen." value={input.monthly_expense} onChange={(v) => set("monthly_expense", v)} />
      </div>
    </div>
  );
};

export const BatnaStep = ({ input, setList, addRow, removeRow }) => (
  <div>
    <SectionHead code="B" title="BATNA Builder — alternatif terbaik lo" desc="Tulis semua alternatif kalau negosiasi ini gagal. Engine menghitung expected value (nilai × peluang) dan menentukan mana BATNA terbaik lo — yang jadi titik walk-away." />
    <div className="space-y-4">
      {input.alternatives.map((a, i) => (
        <RowCard key={i} index={i} testId={`alt-${i}`} onRemove={input.alternatives.length > 1 ? () => removeRow("alternatives", i) : null}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7">
              <TextField testId={`alt-${i}-label`} label="Alternatif" placeholder="mis. Offer dari perusahaan X, klien retainer baru" value={a.label} onChange={(v) => setList("alternatives", i, "label", v)} />
            </div>
            <div className="md:col-span-5">
              <MoneyField testId={`alt-${i}-value`} currency={input.currency} label="Nilainya (periode sama dgn nilai sekarang)" value={a.value} onChange={(v) => setList("alternatives", i, "value", v)} />
            </div>
            <div className="md:col-span-12">
              <Label>Jenis alternatif</Label>
              <div className="flex flex-wrap gap-2">
                {ALT_KINDS.map((k) => (
                  <Chip key={k.key} testId={`alt-${i}-kind-${k.key}`} active={a.kind === k.key} onClick={() => setList("alternatives", i, "kind", k.key)}>{k.label}</Chip>
                ))}
              </div>
            </div>
            <div className="md:col-span-4">
              <NumField testId={`alt-${i}-prob`} label="Peluang jadi nyata" suffix="%" value={a.probability} onChange={(v) => setList("alternatives", i, "probability", Math.max(0, Math.min(100, v || 0)))} />
            </div>
            <div className="md:col-span-4">
              <NumField testId={`alt-${i}-weeks`} label="Berapa lama sampai aktif" suffix="minggu" value={a.weeks_to_activate} onChange={(v) => setList("alternatives", i, "weeks_to_activate", v || 0)} />
            </div>
            <div className="md:col-span-4 flex items-end">
              <Toggle testId={`alt-${i}-active`} active={a.is_active} onClick={() => setList("alternatives", i, "is_active", !a.is_active)}>Sudah nyata / tertulis</Toggle>
            </div>
          </div>
        </RowCard>
      ))}
    </div>
    {input.alternatives.length < 5 && (
      <div className="mt-5"><AddBtn testId="add-alternative" onClick={() => addRow("alternatives", emptyAlternative)}>Tambah alternatif</AddBtn></div>
    )}
  </div>
);
