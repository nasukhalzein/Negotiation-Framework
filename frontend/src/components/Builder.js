import React from "react";
import { RotateCcw, ArrowRight, ArrowLeft } from "lucide-react";
import { useLang, fill } from "../i18n";
import { ContextStep, PerformanceStep, AchievementStep, ComparisonStep, TimingStep, BatnaStep } from "./Steps";

export const Builder = ({ input, analysis, step, setStep, handlers, onReset, filled, timing }) => {
  const { t } = useLang();
  const b = t.builder;
  const props = { input, t, ...handlers };
  const view = [
    <ContextStep {...props} />,
    <PerformanceStep {...props} />,
    <AchievementStep {...props} />,
    <ComparisonStep {...props} />,
    <TimingStep {...props} timing={timing} />,
    <BatnaStep {...props} />,
  ][step];

  const pillarScore = (key) => {
    if (!analysis) return null;
    const map = { performance: "P", achievement: "A", comparison: "C", timing: "T" };
    if (map[key]) return `${analysis.pact[map[key]]}/25`;
    if (key === "batna") return `${analysis.batna.score}/100`;
    return null;
  };

  return (
    <section id="builder" className="border-b border-brand-line scroll-mt-16">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow">{b.eyebrow}</div>
            <h2 className="font-display text-3xl md:text-4xl tracking-tighter mt-5">{b.title}</h2>
            <p className="text-sm text-neutral-400 mt-4 max-w-2xl leading-relaxed">{b.sub}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="eyebrow">{b.leverage}</div>
              <div className="font-mono text-2xl text-brand-red mt-1" data-testid="builder-score">{analysis?.leverage_score ?? 0}</div>
            </div>
            <button data-testid="reset-btn" onClick={onReset} className="btn-ghost inline-flex items-center gap-2">
              <RotateCcw size={13} strokeWidth={1.5} /> {b.reset}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-px bg-brand-line mt-12">
          {b.steps.map((s, i) => (
            <button
              key={s.key}
              data-testid={`step-${s.key}`}
              onClick={() => setStep(i)}
              className={`flex-1 min-w-[140px] px-4 py-4 text-left transition-colors duration-200 ${
                step === i ? "bg-[#1c1010] border-b-2 border-brand-red" : "bg-[#101010] hover:bg-[#151515] border-b-2 border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono text-xs ${step === i ? "text-brand-red" : "text-neutral-600"}`}>{s.code}</span>
                <span className="font-mono text-[0.6rem] text-neutral-500">{pillarScore(s.key)}</span>
              </div>
              <div className={`font-mono text-[0.7rem] tracking-widest uppercase mt-2 ${step === i ? "text-white" : "text-neutral-500"}`}>
                {s.label}
              </div>
            </button>
          ))}
        </div>

        <div className="border border-brand-line border-t-0 bg-[#0f0f0f] p-6 md:p-10">
          <div key={`${step}-${input.context}`} className="animate-rise">{view}</div>

          <div className="hairline my-10" />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              data-testid="prev-step-btn"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="btn-ghost inline-flex items-center gap-2 disabled:opacity-30"
            >
              <ArrowLeft size={13} strokeWidth={1.5} /> {b.prev}
            </button>

            <div className="font-mono text-[0.68rem] text-neutral-500 tracking-widest">
              {fill(b.stepOf, { n: step + 1, total: b.steps.length })}
            </div>

            {step < b.steps.length - 1 ? (
              <button data-testid="next-step-btn" onClick={() => setStep(step + 1)} className="btn-red inline-flex items-center gap-2">
                {b.next} <ArrowRight size={13} strokeWidth={2} />
              </button>
            ) : (
              <button
                data-testid="see-result-btn"
                onClick={() => document.getElementById("hasil")?.scrollIntoView({ behavior: "smooth" })}
                className="btn-red inline-flex items-center gap-2"
              >
                {b.seeResult} <ArrowRight size={13} strokeWidth={2} />
              </button>
            )}
          </div>

          {!filled && <p className="font-mono text-[0.68rem] text-neutral-500 mt-6">{b.minHint}</p>}
        </div>
      </div>
    </section>
  );
};
