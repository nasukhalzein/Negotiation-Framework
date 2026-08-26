import React from "react";
import { money, shortMoney } from "../lib/format";
import { useLang, fill } from "../i18n";

const PillarBar = ({ code, name, score, delay }) => {
  const color = score >= 19 ? "#10b981" : score >= 13 ? "#f59e0b" : "#e33333";
  return (
    <div className="animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-neutral-300">
          <span className="text-brand-red mr-2">{code}</span>{name}
        </span>
        <span className="font-mono text-xs text-white">{score}<span className="text-neutral-600">/25</span></span>
      </div>
      <div className="h-1.5 bg-[#1c1c1c]">
        <div className="h-full origin-left animate-sweep" style={{ width: `${(score / 25) * 100}%`, backgroundColor: color, animationDelay: `${delay + 100}ms` }} />
      </div>
    </div>
  );
};

const ZopaBar = ({ numbers, currency, r }) => {
  const { reservation, target, anchor, zopa } = numbers;
  const lo = Math.min(reservation, target, anchor, zopa.low, zopa.high) * 0.94;
  const hi = Math.max(reservation, target, anchor, zopa.low, zopa.high) * 1.04;
  const pos = (v) => `${Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100))}%`;

  return (
    <div className="pt-16 sm:pt-10 pb-20 relative">
      <div className="h-[3px] bg-[#1c1c1c] relative">
        {zopa.exists && (
          <div className="absolute h-full bg-brand-red/25 origin-left animate-sweep"
            style={{ left: pos(zopa.low), width: `calc(${pos(zopa.high)} - ${pos(zopa.low)})` }} />
        )}
        {[
          { v: reservation, label: r.walkaway, color: "#a3a3a3", offset: "-top-9" },
          { v: target, label: r.target, color: "#10b981", offset: "top-6" },
          { v: anchor, label: r.anchor, color: "#e33333", offset: "-top-[4.6rem] sm:-top-9" },
        ].map((m) => (
          <div key={m.label} className="absolute top-0 -translate-x-1/2" style={{ left: pos(m.v) }}>
            <div className="w-[2px] h-4 -mt-[7px]" style={{ backgroundColor: m.color }} />
            <div className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap ${m.offset}`}>
              <div className="font-mono text-[0.6rem] tracking-widest uppercase" style={{ color: m.color }}>{m.label}</div>
              <div className="font-mono text-[0.7rem] text-white">{shortMoney(m.v, currency)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-16 font-mono text-[0.6rem] text-neutral-600">
        <span>{shortMoney(Math.min(zopa.low, zopa.high), currency)}</span>
        <span className="text-neutral-500 text-center px-2">{zopa.exists ? r.zopaCaption : r.zopaNone}</span>
        <span>{shortMoney(Math.max(zopa.low, zopa.high), currency)}</span>
      </div>
    </div>
  );
};

export const Results = ({ analysis, currency, onCopy }) => {
  const { t } = useLang();
  const r = t.results;
  if (!analysis) return null;
  const { leverage_score, tier, pact, batna, numbers, gaps, risks, script, checklist, impact } = analysis;
  const tierColor = { strong: "#10b981", good: "#8ac926", medium: "#f59e0b", weak: "#e33333" }[tier.color];

  return (
    <div id="hasil" className="scroll-mt-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-brand-line">
        <div className="lg:col-span-4 bg-[#0f0f0f] p-8" data-testid="leverage-panel">
          <div className="eyebrow">{r.leverageTitle}</div>
          <div className="flex items-end gap-3 mt-4">
            <span data-testid="leverage-score-value" className="font-display text-[5rem] leading-none tracking-tighter" style={{ color: tierColor }}>
              {leverage_score}
            </span>
            <span className="font-mono text-sm text-neutral-600 mb-3">/100</span>
          </div>
          <div className="font-mono text-xs tracking-widest uppercase mt-3" style={{ color: tierColor }}>{tier.label}</div>
          <p className="text-sm text-neutral-300 mt-5 leading-relaxed" data-testid="leverage-verdict">{tier.verdict}</p>
          <div className="hairline my-6" />
          <div className="eyebrow mb-4">{r.breakdown}</div>
          <div className="space-y-4">
            <PillarBar code="P" name="Performance" score={pact.P} delay={80} />
            <PillarBar code="A" name="Achievement" score={pact.A} delay={140} />
            <PillarBar code="C" name="Comparison" score={pact.C} delay={200} />
            <PillarBar code="T" name="Timing" score={pact.T} delay={260} />
          </div>
          <div className="hairline my-6" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-neutral-400">BATNA</span>
            <span className="font-mono text-xs text-white">{batna.score}<span className="text-neutral-600">/100</span> · {batna.tier}</span>
          </div>
        </div>

        <div className="lg:col-span-8 bg-[#0f0f0f] p-8" data-testid="numbers-panel">
          <div className="eyebrow">{r.numbersTitle}</div>
          {numbers.available ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-brand-line mt-6">
                {[
                  { l: r.anchor, v: numbers.anchor, sub: `+${numbers.anchor_increase_pct}%`, hi: true },
                  { l: r.target, v: numbers.target, sub: `+${numbers.increase_pct}%` },
                  { l: r.compromise, v: numbers.compromise, sub: r.tradeHint },
                  { l: r.walkaway, v: numbers.reservation, sub: r.floorHint },
                ].map((c, i) => (
                  <div key={c.l} className="bg-[#121212] p-5 animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
                    <div className="font-mono text-[0.6rem] tracking-widest text-neutral-500 uppercase">{c.l}</div>
                    <div className={`font-mono text-lg mt-3 ${c.hi ? "text-brand-red" : "text-white"}`} data-testid={`number-${i}`}>
                      {money(c.v, currency)}
                    </div>
                    <div className="font-mono text-[0.6rem] text-neutral-600 mt-1">{c.sub}</div>
                  </div>
                ))}
              </div>

              <ZopaBar numbers={numbers} currency={currency} r={r} />

              {numbers.batna_note && (
                <div className="border border-emerald-500/40 bg-[#101614] p-5 -mt-4 mb-6" data-testid="batna-superior-note">
                  <div className="font-mono text-xs text-emerald-400">{r.batnaHigherTitle}</div>
                  <p className="text-sm text-neutral-300 mt-2 leading-relaxed">{numbers.batna_note}</p>
                </div>
              )}

              {numbers.staged_plan && (
                <div className="border border-amber-500/40 bg-[#181510] p-5 -mt-4 mb-6" data-testid="staged-plan-note">
                  <div className="font-mono text-xs text-amber-500">{r.stagedTitle}</div>
                  <p className="text-sm text-neutral-300 mt-2 leading-relaxed">{numbers.staged_plan}</p>
                </div>
              )}

              {!numbers.zopa.exists && (
                <div className="border border-brand-red/50 bg-[#181010] p-5 -mt-4 mb-6">
                  <div className="font-mono text-xs text-brand-red">{r.noZopaTitle}</div>
                  <p className="text-sm text-neutral-300 mt-2 leading-relaxed">{r.noZopaBody}</p>
                </div>
              )}

              <div className="eyebrow mt-6 mb-4">{r.ladderTitle}</div>
              <div className="space-y-px bg-brand-line">
                {numbers.ladder.map((s) => (
                  <div key={s.step} className="bg-[#121212] flex flex-col md:flex-row md:items-center gap-2 md:gap-6 p-4">
                    <span className="font-mono text-xs text-brand-red w-6">0{s.step}</span>
                    <span className="font-mono text-sm text-white w-40">{money(s.value, currency)}</span>
                    <span className="font-mono text-[0.68rem] text-neutral-400 w-52">{s.label}</span>
                    <span className="text-xs text-neutral-500 flex-1 leading-relaxed">{s.note}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div>
                  <div className="eyebrow mb-3">{r.marketTitle}</div>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    {numbers.market_position
                      ? fill(r.marketFilled, {
                          pos: numbers.market_position,
                          p50: money(numbers.market_p50, currency),
                          p75: money(numbers.market_p75, currency),
                        })
                      : r.marketEmpty}
                  </p>
                  <p className="text-sm text-neutral-400 mt-4 leading-relaxed" data-testid="impact-statement">{impact.statement}</p>
                </div>
                <div>
                  <div className="eyebrow mb-3">{r.nonMonTitle}</div>
                  <ul className="space-y-2">
                    {numbers.non_monetary.map((n) => (
                      <li key={n} className="text-xs text-neutral-400 flex gap-2 leading-relaxed">
                        <span className="text-brand-red font-mono">▸</span>{n}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-400 mt-6">{numbers.reason}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-brand-line mt-px">
        <div className="bg-[#0f0f0f] p-8" data-testid="batna-panel">
          <div className="eyebrow">{r.batnaTitle}</div>
          <h3 className="font-display text-2xl tracking-tight mt-3">{batna.tier}</h3>
          {batna.best ? (
            <>
              <div className="border border-brand-red/40 bg-[#141010] p-5 mt-6">
                <div className="eyebrow text-brand-red">{r.bestBatna}</div>
                <div className="text-white text-sm mt-2">{batna.best.label}</div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <div className="font-mono text-[0.6rem] text-neutral-500">{r.expectedValue}</div>
                    <div className="font-mono text-sm text-white mt-1">{money(batna.best.expected_value, currency)}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[0.6rem] text-neutral-500">{r.probability}</div>
                    <div className="font-mono text-sm text-white mt-1">{batna.best.probability}%</div>
                  </div>
                  <div>
                    <div className="font-mono text-[0.6rem] text-neutral-500">{r.activeIn}</div>
                    <div className="font-mono text-sm text-white mt-1">{batna.best.weeks_to_activate}</div>
                  </div>
                </div>
              </div>
              <div className="eyebrow mt-8 mb-3">{r.allAlts}</div>
              <div className="space-y-px bg-brand-line">
                {batna.alternatives.map((a, i) => (
                  <div key={i} className="bg-[#121212] p-4 flex items-center gap-4">
                    <span className="font-mono text-xs text-neutral-600 w-6">0{i + 1}</span>
                    <span className="text-sm text-neutral-200 flex-1">{a.label}</span>
                    <span className="font-mono text-[0.68rem] text-neutral-500">{money(a.expected_value, currency)}</span>
                    <span className="font-mono text-xs text-brand-red w-10 text-right">{a.strength}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-400 mt-5 leading-relaxed">{r.noBatna}</p>
          )}
        </div>

        <div className="bg-[#0f0f0f] p-8" data-testid="gaps-panel">
          <div className="eyebrow">{r.gapsTitle}</div>
          <h3 className="font-display text-2xl tracking-tight mt-3">
            {gaps.length ? fill(r.gapsCount, { n: gaps.length }) : r.gapsNone}
          </h3>
          <div className="space-y-px bg-brand-line mt-6">
            {gaps.length === 0 && <div className="bg-[#121212] p-5 text-sm text-neutral-400">{r.gapsNoneBody}</div>}
            {gaps.map((g) => (
              <div key={g.pillar} className="bg-[#121212] p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-brand-red tracking-widest uppercase">{g.pillar}</span>
                  <span className="font-mono text-[0.6rem] text-neutral-500">{g.impact}</span>
                </div>
                <div className="text-sm text-white mt-3">{g.problem}</div>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{g.action}</p>
              </div>
            ))}
          </div>

          <div className="eyebrow mt-8 mb-3">{r.risksTitle}</div>
          <div className="space-y-px bg-brand-line">
            {risks.map((rk, i) => {
              const high = i === 0 && rk.level !== "low" && rk.level !== "rendah";
              const color = ["tinggi", "high"].includes(rk.level) ? "#e33333" : ["sedang", "medium"].includes(rk.level) ? "#f59e0b" : "#a3a3a3";
              return (
                <div key={i} className="bg-[#121212] p-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-[0.6rem] tracking-widest uppercase px-2 py-0.5 border"
                      style={{ color, borderColor: high ? `${color}66` : "#262626" }}>
                      {rk.level}
                    </span>
                    <span className="text-sm text-white">{rk.title}</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{rk.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-brand-line mt-px">
        <div className="lg:col-span-7 bg-[#0f0f0f] p-8" data-testid="script-panel">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">{r.scriptEyebrow}</div>
              <h3 className="font-display text-2xl tracking-tight mt-3">{fill(r.scriptTitle, { counterpart: script.counterpart })}</h3>
            </div>
            <button data-testid="copy-script-btn" onClick={onCopy} className="btn-ghost shrink-0">{r.copy}</button>
          </div>

          <div className="mt-7 space-y-6">
            <div>
              <div className="eyebrow text-brand-red mb-2">{r.opening}</div>
              <p className="text-sm text-neutral-200 leading-relaxed">"{script.opening}"</p>
            </div>
            <div>
              <div className="eyebrow text-brand-red mb-2">{r.core}</div>
              <ul className="space-y-3">
                {script.body.map((bd, i) => (
                  <li key={i} className="text-sm text-neutral-300 leading-relaxed flex gap-3">
                    <span className="font-mono text-brand-red text-xs mt-1">0{i + 1}</span>{bd}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-l-2 border-brand-red pl-5">
              <div className="eyebrow text-brand-red mb-2">{r.ask}</div>
              <p className="text-sm text-white leading-relaxed">"{script.ask}"</p>
              <p className="font-mono text-[0.68rem] text-neutral-500 mt-3">{script.silence_rule}</p>
            </div>
            <div>
              <div className="eyebrow text-brand-red mb-3">{r.objections}</div>
              <div className="space-y-px bg-brand-line">
                {script.objections.map((o, i) => (
                  <div key={i} className="bg-[#121212] p-5">
                    <div className="font-mono text-xs text-neutral-400">{o.objection}</div>
                    <p className="text-sm text-neutral-200 mt-3 leading-relaxed">{o.response}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="eyebrow text-brand-red mb-2">{r.closing}</div>
              <p className="text-sm text-neutral-300 leading-relaxed">{script.closing}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#0f0f0f] p-8" data-testid="checklist-panel">
          <div className="eyebrow">{r.checklistTitle}</div>
          <h3 className="font-display text-2xl tracking-tight mt-3">{fill(r.readiness, { n: analysis.readiness_pct })}</h3>
          <div className="h-1.5 bg-[#1c1c1c] mt-5">
            <div className="h-full bg-brand-red origin-left animate-sweep" style={{ width: `${analysis.readiness_pct}%` }} />
          </div>
          <div className="mt-8 space-y-px bg-brand-line">
            {checklist.map((c, i) => (
              <div key={i} className="bg-[#121212] p-4 flex items-start gap-4">
                <span className={`mt-1 w-3.5 h-3.5 shrink-0 border ${c.done ? "bg-brand-red border-brand-red" : "border-neutral-700"}`} />
                <span className="flex-1">
                  <span className={`block text-sm ${c.done ? "text-neutral-500 line-through" : "text-neutral-200"}`}>{c.task}</span>
                  <span className="block font-mono text-[0.6rem] text-neutral-600 mt-1 tracking-widest uppercase">{c.phase}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
