import React from "react";
import { Plus, BookOpen } from "lucide-react";
import { Label, TextField, MoneyField, NumField, Chip, Toggle, SectionHead, RowCard } from "./Field";
import { emptyMetric, emptyAchievement, emptyAlternative, ALT_KINDS, CONTEXT_KEYS } from "../lib/schema";

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

export const Guide = ({ t, ctx, step }) => {
  const g = t.guides[ctx]?.[step];
  if (!g) return null;
  return (
    <div className="border border-brand-line bg-[#0d0d0d] p-6 mb-8" data-testid={`guide-${step}`}>
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={13} strokeWidth={1.5} className="text-brand-red" />
        <span className="eyebrow text-brand-red">{t.builder.guideTitle}</span>
      </div>
      <p className="text-sm text-neutral-300 leading-relaxed">{g.why}</p>
      <ul className="mt-4 space-y-2">
        {g.tips.map((tip) => (
          <li key={tip} className="text-sm text-neutral-400 leading-relaxed flex gap-3">
            <span className="text-brand-red font-mono text-xs mt-1">▸</span>{tip}
          </li>
        ))}
      </ul>
      <div className="hairline my-5" />
      <p className="font-mono text-[0.7rem] text-neutral-500 leading-relaxed">
        <span className="text-neutral-400">{t.builder.exampleLabel}: </span>{g.example.replace(/^(Contoh|Example): /, "")}
      </p>
    </div>
  );
};

export const ContextStep = ({ input, t, set }) => {
  const b = t.builder;
  const f = t.fields[input.context];
  return (
    <div>
      <SectionHead code="00" title={b.contextTitle} desc={b.contextDesc} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CONTEXT_KEYS.map((k) => (
          <Chip key={k} testId={`context-${k}`} active={input.context === k} onClick={() => set("context", k)}>
            <span className="block text-[0.78rem] text-inherit">{b.contexts[k].label}</span>
            <span className="block text-[0.65rem] text-neutral-500 mt-1 normal-case">{b.contexts[k].desc}</span>
          </Chip>
        ))}
      </div>

      <div className="mt-10">
        <Guide t={t} ctx={input.context} step="context" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextField testId="input-role" label={f.role.label} placeholder={f.role.placeholder} value={input.role} onChange={(v) => set("role", v)} />
        <NumField testId="input-tenure" label={f.tenure.label} suffix={f.tenure.suffix} value={input.tenure_months} onChange={(v) => set("tenure_months", v || 0)} />
        <div>
          <Label>{b.currency}</Label>
          <div className="flex gap-2">
            {["IDR", "USD", "SGD"].map((c) => (
              <Chip key={c} testId={`currency-${c}`} active={input.currency === c} onClick={() => set("currency", c)}>{c}</Chip>
            ))}
          </div>
        </div>
        <MoneyField testId="input-current-value" currency={input.currency} label={f.current.label} hint={f.current.hint} value={input.current_value} onChange={(v) => set("current_value", v)} />
        {f.offer && (
          <MoneyField testId="input-offer-value" currency={input.currency} label={f.offer.label} hint={f.offer.hint} value={input.offer_value} onChange={(v) => set("offer_value", v)} />
        )}
        <MoneyField testId="input-target-value" currency={input.currency} label={f.target.label} hint={f.target.hint} value={input.target_value} onChange={(v) => set("target_value", v)} />
      </div>
    </div>
  );
};

export const PerformanceStep = ({ input, t, setList, addRow, removeRow }) => {
  const b = t.builder;
  const f = t.fields[input.context];
  return (
    <div>
      <SectionHead code="P" title={f.metrics.title} />
      <Guide t={t} ctx={input.context} step="performance" />
      <div className="space-y-4">
        {input.metrics.map((m, i) => (
          <RowCard key={i} index={i} testId={`metric-${i}`} removeLabel={b.remove} onRemove={input.metrics.length > 1 ? () => removeRow("metrics", i) : null}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <TextField testId={`metric-${i}-label`} label={b.metricLabel} placeholder={b.metricPlaceholder} value={m.label} onChange={(v) => setList("metrics", i, "label", v)} />
              </div>
              <div className="md:col-span-2">
                <NumField testId={`metric-${i}-baseline`} label={b.before} value={m.baseline} onChange={(v) => setList("metrics", i, "baseline", v)} />
              </div>
              <div className="md:col-span-2">
                <NumField testId={`metric-${i}-result`} label={b.after} value={m.result} onChange={(v) => setList("metrics", i, "result", v)} />
              </div>
              <div className="md:col-span-3">
                <TextField testId={`metric-${i}-unit`} label={b.unit} placeholder={b.unitPlaceholder} value={m.unit} onChange={(v) => setList("metrics", i, "unit", v)} />
              </div>
              <div className="md:col-span-5">
                <TextField testId={`metric-${i}-period`} label={b.period} placeholder={b.periodPlaceholder} value={m.period} onChange={(v) => setList("metrics", i, "period", v)} />
              </div>
              <div className="md:col-span-7">
                <MoneyField testId={`metric-${i}-impact`} currency={input.currency} label={b.metricImpact} hint={b.metricImpactHint} value={m.impact_value} onChange={(v) => setList("metrics", i, "impact_value", v)} />
              </div>
            </div>
          </RowCard>
        ))}
      </div>
      {input.metrics.length < 5 && (
        <div className="mt-5"><AddBtn testId="add-metric" onClick={() => addRow("metrics", emptyMetric)}>{b.addMetric}</AddBtn></div>
      )}
    </div>
  );
};

export const AchievementStep = ({ input, t, setList, addRow, removeRow }) => {
  const b = t.builder;
  return (
    <div>
      <SectionHead code="A" title={b.achTitle} />
      <Guide t={t} ctx={input.context} step="achievement" />
      <div className="space-y-4">
        {input.achievements.map((a, i) => (
          <RowCard key={i} index={i} testId={`ach-${i}`} removeLabel={b.remove} onRemove={input.achievements.length > 1 ? () => removeRow("achievements", i) : null}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7">
                <TextField testId={`ach-${i}-title`} label={b.achTitle} placeholder={b.achPlaceholder} value={a.title} onChange={(v) => setList("achievements", i, "title", v)} />
              </div>
              <div className="md:col-span-5">
                <MoneyField testId={`ach-${i}-impact`} currency={input.currency} label={b.achImpact} value={a.impact_value} onChange={(v) => setList("achievements", i, "impact_value", v)} />
              </div>
              <div className="md:col-span-6">
                <Toggle testId={`ach-${i}-beyond`} active={a.beyond_scope} onClick={() => setList("achievements", i, "beyond_scope", !a.beyond_scope)}>{b.achBeyond}</Toggle>
              </div>
              <div className="md:col-span-6">
                <Toggle testId={`ach-${i}-verifiable`} active={a.verifiable} onClick={() => setList("achievements", i, "verifiable", !a.verifiable)}>{b.achVerifiable}</Toggle>
              </div>
            </div>
          </RowCard>
        ))}
      </div>
      {input.achievements.length < 5 && (
        <div className="mt-5"><AddBtn testId="add-achievement" onClick={() => addRow("achievements", emptyAchievement)}>{b.addAch}</AddBtn></div>
      )}
    </div>
  );
};

export const ComparisonStep = ({ input, t, set }) => {
  const b = t.builder;
  const f = t.fields[input.context];
  return (
    <div>
      <SectionHead code="C" title={b.comparisonTitle} />
      <Guide t={t} ctx={input.context} step="comparison" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MoneyField testId="input-p50" currency={input.currency} label={f.p50.label} hint={f.p50.hint} value={input.market_p50} onChange={(v) => set("market_p50", v)} />
        <MoneyField testId="input-p75" currency={input.currency} label={f.p75.label} hint={f.p75.hint} value={input.market_p75} onChange={(v) => set("market_p75", v)} />
        <div className="md:col-span-2">
          <Toggle testId="input-band" active={input.internal_band_known} onClick={() => set("internal_band_known", !input.internal_band_known)}>{f.band}</Toggle>
        </div>
        <div className="md:col-span-2">
          <TextField area testId="input-scope" label={f.scope.label} hint={f.scope.hint} placeholder={f.scope.placeholder} value={input.scope_growth_note} onChange={(v) => set("scope_growth_note", v)} />
        </div>
      </div>
    </div>
  );
};

export const TimingStep = ({ input, t, timing, set }) => {
  const b = t.builder;
  const f = t.fields[input.context];
  const toggle = (key) => {
    const has = input.timing_factors.includes(key);
    set("timing_factors", has ? input.timing_factors.filter((k) => k !== key) : [...input.timing_factors, key]);
  };
  return (
    <div>
      <SectionHead code="T" title={b.timingTitle} desc={b.timingDesc} />
      <Guide t={t} ctx={input.context} step="timing" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {timing.map((f2) => (
          <Toggle key={f2.key} testId={`timing-${f2.key}`} active={input.timing_factors.includes(f2.key)} onClick={() => toggle(f2.key)}>
            <span className="flex-1">{f2.label}</span>
            {f2.weight < 0 && <span className="ml-2 font-mono text-[0.6rem] text-brand-red">−</span>}
          </Toggle>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <div>
          <Label hint={b.relationshipHint}>{b.relationship}</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip key={n} testId={`relationship-${n}`} active={input.relationship_importance === n} onClick={() => set("relationship_importance", n)}>{n}</Chip>
            ))}
          </div>
        </div>
        <MoneyField testId="input-expense" currency={input.currency} label={f.expense.label} hint={f.expense.hint} value={input.monthly_expense} onChange={(v) => set("monthly_expense", v)} />
      </div>
    </div>
  );
};

export const BatnaStep = ({ input, t, setList, addRow, removeRow }) => {
  const b = t.builder;
  return (
    <div>
      <SectionHead code="B" title={b.batnaTitle} />
      <Guide t={t} ctx={input.context} step="batna" />
      <div className="space-y-4">
        {input.alternatives.map((a, i) => (
          <RowCard key={i} index={i} testId={`alt-${i}`} removeLabel={b.remove} onRemove={input.alternatives.length > 1 ? () => removeRow("alternatives", i) : null}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7">
                <TextField testId={`alt-${i}-label`} label={b.altLabel} placeholder={b.altPlaceholder} value={a.label} onChange={(v) => setList("alternatives", i, "label", v)} />
              </div>
              <div className="md:col-span-5">
                <MoneyField testId={`alt-${i}-value`} currency={input.currency} label={b.altValue} value={a.value} onChange={(v) => setList("alternatives", i, "value", v)} />
              </div>
              <div className="md:col-span-12">
                <Label>{b.altKind}</Label>
                <div className="flex flex-wrap gap-2">
                  {ALT_KINDS.map((k) => (
                    <Chip key={k} testId={`alt-${i}-kind-${k}`} active={a.kind === k} onClick={() => setList("alternatives", i, "kind", k)}>{b.kinds[k]}</Chip>
                  ))}
                </div>
              </div>
              <div className="md:col-span-4">
                <NumField testId={`alt-${i}-prob`} label={b.altProb} suffix="%" value={a.probability} onChange={(v) => setList("alternatives", i, "probability", Math.max(0, Math.min(100, v || 0)))} />
              </div>
              <div className="md:col-span-4">
                <NumField testId={`alt-${i}-weeks`} label={b.altWeeks} suffix={b.weeks} value={a.weeks_to_activate} onChange={(v) => setList("alternatives", i, "weeks_to_activate", v || 0)} />
              </div>
              <div className="md:col-span-4 flex items-end">
                <Toggle testId={`alt-${i}-active`} active={a.is_active} onClick={() => setList("alternatives", i, "is_active", !a.is_active)}>{b.altActive}</Toggle>
              </div>
            </div>
          </RowCard>
        ))}
      </div>
      {input.alternatives.length < 5 && (
        <div className="mt-5"><AddBtn testId="add-alternative" onClick={() => addRow("alternatives", emptyAlternative)}>{b.addAlt}</AddBtn></div>
      )}
    </div>
  );
};
