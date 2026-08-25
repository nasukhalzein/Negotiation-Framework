import React from "react";
import { ArrowRight, Target } from "lucide-react";

export const Hero = () => {
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative grain overflow-hidden border-b border-brand-line">
      <div className="absolute inset-0 grid-lines opacity-70" />
      <div className="absolute -right-24 top-10 select-none pointer-events-none hidden md:block">
        <span className="font-display text-[16rem] leading-none text-white/[0.025] tracking-tighter">PACT</span>
      </div>

      <div className="relative max-w-[1400px] mx-auto px-5 md:px-10 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="eyebrow animate-rise">P.A.C.T FRAMEWORK — CONCEPTOR</div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tighter mt-6 max-w-4xl animate-rise" style={{ animationDelay: "60ms" }}>
          Negosiasi yang <span className="text-brand-red">Tidak Bisa Ditolak</span> — karena dibangun dari angka, bukan perasaan.
        </h1>

        <p className="text-base md:text-lg text-neutral-400 mt-8 max-w-2xl leading-relaxed animate-rise" style={{ animationDelay: "120ms" }}>
          Isi kondisi lo yang sebenarnya. Engine ini menghitung leverage, menentukan angka anchor,
          target, dan titik walk-away lo — lalu menyusun skrip yang bisa lo pakai besok. Gaji, offer kerja,
          deal bisnis, rate freelance, sampai vendor.
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-10 animate-rise" style={{ animationDelay: "180ms" }}>
          <button data-testid="hero-start-btn" onClick={() => go("builder")} className="btn-red inline-flex items-center gap-2">
            Mulai Hitung Posisi Lo <ArrowRight size={14} strokeWidth={2} />
          </button>
          <button data-testid="hero-learn-btn" onClick={() => go("belajar")} className="btn-ghost inline-flex items-center gap-2">
            <Target size={14} strokeWidth={1.5} /> Pahami Frameworknya
          </button>
        </div>

        <div className="hairline mt-16" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-brand-line mt-px">
          {[
            { n: "85%", t: "karyawan yang negosiasi gaji dapat kenaikan — tapi hanya 37% yang pernah mencoba.", s: "Linda Babcock, Carnegie Mellon" },
            { n: "BATNA", t: "Best Alternative to a Negotiated Agreement. Semakin kuat alternatif lo, semakin kuat posisi lo.", s: "Fisher & Ury, Getting to Yes (1981)" },
            { n: "ZOPA", t: "Zone of Possible Agreement — rentang di mana kesepakatan mungkin terjadi. Engine ini menghitungnya untuk lo.", s: "Harvard Program on Negotiation" },
          ].map((c, i) => (
            <div key={i} className="bg-[#0f0f0f] p-7 animate-rise" style={{ animationDelay: `${240 + i * 80}ms` }}>
              <div className="font-display text-3xl text-brand-red tracking-tight">{c.n}</div>
              <p className="text-sm text-neutral-300 mt-4 leading-relaxed">{c.t}</p>
              <div className="font-mono text-[0.65rem] text-neutral-600 mt-4">{c.s}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
