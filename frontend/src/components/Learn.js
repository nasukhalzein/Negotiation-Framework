import React, { useState } from "react";
import { useLang } from "../i18n";

export const Learn = () => {
  const { t } = useLang();
  const l = t.learn;
  const [open, setOpen] = useState(0);

  return (
    <>
      <section id="belajar" className="border-b border-brand-line scroll-mt-16">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-28">
          <div className="eyebrow">{l.eyebrow1}</div>
          <h2 className="font-display text-3xl md:text-4xl tracking-tighter mt-5 max-w-3xl">{l.title1}</h2>
          <p className="text-base text-neutral-400 mt-6 max-w-3xl leading-relaxed">{l.body1}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-brand-line mt-14">
            <div className="bg-[#0f0f0f] p-8">
              <div className="eyebrow text-brand-red">{l.badTitle}</div>
              <ul className="mt-5 space-y-3">
                {l.bad.map((x) => (
                  <li key={x} className="font-mono text-xs text-neutral-500 leading-relaxed">— {x}</li>
                ))}
              </ul>
              <div className="hairline my-6" />
              <p className="text-sm text-neutral-500">{l.badResult}</p>
            </div>
            <div className="bg-[#0f0f0f] p-8 border-l-2 border-brand-red">
              <div className="eyebrow text-white">{l.goodTitle}</div>
              <ul className="mt-5 space-y-3">
                {l.good.map((x) => (
                  <li key={x} className="font-mono text-xs text-neutral-300 leading-relaxed">— {x}</li>
                ))}
              </ul>
              <div className="hairline my-6" />
              <p className="text-sm text-neutral-400">{l.goodResult}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pilar" className="border-b border-brand-line bg-[#0c0c0c] scroll-mt-16">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-28">
          <div className="eyebrow">{l.eyebrow2}</div>
          <h2 className="font-display text-3xl md:text-4xl tracking-tighter mt-5">{l.title2}</h2>
          <p className="text-sm text-neutral-500 mt-4 max-w-2xl">{l.hint2}</p>

          <div className="mt-12 border border-brand-line divide-y divide-[#262626]">
            {l.pillars.map((p, i) => (
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
                        <div className="eyebrow text-brand-red mb-3">{l.whyLabel}</div>
                        <p className="text-sm text-neutral-300 leading-relaxed">{p.why}</p>
                      </div>
                      <div>
                        <div className="eyebrow text-brand-red mb-3">{l.howLabel}</div>
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
                          <div className="eyebrow text-neutral-500 mb-2">{l.weakLabel}</div>
                          <p className="text-sm text-neutral-500 italic">{p.wrong}</p>
                        </div>
                        <div className="border border-brand-red/40 bg-[#141010] p-5">
                          <div className="eyebrow text-brand-red mb-2">{l.strongLabel}</div>
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

      <section id="batna" className="border-b border-brand-line scroll-mt-16">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <div className="eyebrow">{l.eyebrow3}</div>
              <h2 className="font-display text-3xl md:text-4xl tracking-tighter mt-5">{l.title3}</h2>
              <p className="text-sm text-neutral-400 mt-6 leading-relaxed">{l.batna1}</p>
              <p className="text-sm text-neutral-400 mt-4 leading-relaxed">{l.batna2}</p>
              <div className="border-l-2 border-brand-red pl-5 mt-8">
                <p className="font-mono text-xs text-neutral-300 leading-relaxed">{l.quote}</p>
                <p className="font-mono text-[0.65rem] text-neutral-600 mt-2">{l.quoteBy}</p>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-px bg-brand-line self-start">
              {l.batnaSteps.map((s) => (
                <div key={s.t} className="bg-[#0f0f0f] p-6 hover:bg-[#131313] transition-colors duration-200">
                  <div className="font-mono text-xs text-brand-red">{s.t}</div>
                  <p className="text-sm text-neutral-400 mt-3 leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hairline my-16" />

          <div className="eyebrow">{l.mistakesTitle}</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-px bg-brand-line mt-6">
            {l.mistakes.map((m, i) => (
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
