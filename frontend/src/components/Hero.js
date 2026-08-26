import React from "react";
import { ArrowRight, Target } from "lucide-react";
import { useLang } from "../i18n";

export const Hero = () => {
  const { t } = useLang();
  const h = t.hero;
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative grain overflow-hidden border-b border-brand-line">
      <div className="absolute inset-0 grid-lines opacity-70" />
      <div className="absolute right-0 top-10 select-none pointer-events-none hidden md:block overflow-hidden">
        <span className="font-display text-[16rem] leading-none text-white/[0.025] tracking-tighter">PACT</span>
      </div>

      <div className="relative max-w-[1400px] mx-auto px-5 md:px-10 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="eyebrow animate-rise">{h.eyebrow}</div>

        <h1
          data-testid="hero-headline"
          className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-tighter mt-6 max-w-4xl animate-rise"
          style={{ animationDelay: "60ms" }}
        >
          {h.h1a}
          <span className="text-brand-red">{h.h1red}</span>
          {h.h1b}
        </h1>

        <p className="text-base md:text-lg text-neutral-400 mt-8 max-w-2xl leading-relaxed animate-rise" style={{ animationDelay: "120ms" }}>
          {h.sub}
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-10 animate-rise" style={{ animationDelay: "180ms" }}>
          <button data-testid="hero-start-btn" onClick={() => go("builder")} className="btn-red inline-flex items-center gap-2">
            {h.cta1} <ArrowRight size={14} strokeWidth={2} />
          </button>
          <button data-testid="hero-learn-btn" onClick={() => go("belajar")} className="btn-ghost inline-flex items-center gap-2">
            <Target size={14} strokeWidth={1.5} /> {h.cta2}
          </button>
        </div>

        <div className="hairline mt-16" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-brand-line mt-px">
          {h.stats.map((c, i) => (
            <div key={c.n} className="bg-[#0f0f0f] p-7 animate-rise" style={{ animationDelay: `${240 + i * 80}ms` }}>
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
