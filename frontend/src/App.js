import React, { useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Learn } from "@/components/Learn";
import { Builder } from "@/components/Builder";
import { Results } from "@/components/Results";
import { AiPanel } from "@/components/AiPanel";
import { defaultInput } from "@/lib/schema";
import { analyzeInput, getMeta } from "@/lib/api";
import { money } from "@/lib/format";
import { copyText } from "@/lib/clipboard";
import { LangProvider, useLang } from "@/i18n";

const STORAGE_KEY = "conceptor_pact_input_v2";

function loadInput() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultInput(), ...JSON.parse(raw) };
  } catch (e) {
    /* ignore */
  }
  return defaultInput();
}

function scriptToText(analysis, currency, r) {
  const s = analysis.script;
  const n = analysis.numbers;
  return [
    `${analysis.context} — ${analysis.tier.label} (${analysis.leverage_score}/100)`,
    n.available
      ? `${r.anchor}: ${money(n.anchor, currency)} · ${r.target}: ${money(n.target, currency)} · ${r.walkaway}: ${money(n.reservation, currency)}`
      : "",
    "",
    r.opening.toUpperCase(),
    s.opening,
    "",
    r.core.toUpperCase(),
    ...s.body.map((b, i) => `${i + 1}. ${b}`),
    "",
    r.ask.toUpperCase(),
    s.ask,
    s.silence_rule,
    "",
    r.objections.toUpperCase(),
    ...s.objections.map((o) => `${o.objection}\n→ ${o.response}\n`),
    r.closing.toUpperCase(),
    s.closing,
  ]
    .filter(Boolean)
    .join("\n");
}

function Page() {
  const { lang, t } = useLang();
  const [input, setInput] = useState(loadInput);
  const [analysis, setAnalysis] = useState(null);
  const [step, setStep] = useState(0);
  const [timing, setTiming] = useState({});
  const timer = useRef(null);

  useEffect(() => {
    setInput((p) => ({ ...p, lang }));
    getMeta(lang).then((m) => setTiming(m.timing_factors)).catch(() => {});
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      analyzeInput(input).then(setAnalysis).catch(() => {});
    }, 400);
    return () => timer.current && clearTimeout(timer.current);
  }, [input]);

  const set = useCallback((field, value) => setInput((p) => ({ ...p, [field]: value })), []);
  const setList = useCallback((field, index, key, value) => {
    setInput((p) => {
      const list = [...p[field]];
      list[index] = { ...list[index], [key]: value };
      return { ...p, [field]: list };
    });
  }, []);
  const addRow = useCallback((field, factory) => setInput((p) => ({ ...p, [field]: [...p[field], factory()] })), []);
  const removeRow = useCallback(
    (field, index) => setInput((p) => ({ ...p, [field]: p[field].filter((_, i) => i !== index) })),
    []
  );

  const onReset = () => {
    setInput({ ...defaultInput(), lang });
    setStep(0);
    toast.success(t.builder.reset);
  };

  const filled = Boolean(input.current_value || input.offer_value);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Toaster theme="dark" position="bottom-right" />
      <Nav score={analysis?.leverage_score} />
      <Hero />
      <Learn />
      <Builder
        input={input}
        analysis={analysis}
        step={step}
        setStep={setStep}
        filled={filled}
        timing={timing[input.context] || []}
        handlers={{ set, setList, addRow, removeRow }}
        onReset={onReset}
      />

      <section className="border-b border-brand-line bg-[#0c0c0c]">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-24">
          <div className="eyebrow">{t.results.eyebrow}</div>
          <h2 className="font-display text-3xl md:text-4xl tracking-tighter mt-5">{t.results.title}</h2>
          <p className="text-sm text-neutral-400 mt-5 max-w-2xl leading-relaxed">{t.results.sub}</p>
          <div className="mt-12">
            <Results
              analysis={analysis}
              currency={input.currency}
              onCopy={async () => {
                const ok = await copyText(scriptToText(analysis, input.currency, t.results));
                ok ? toast.success(t.results.copied) : toast.error(t.results.copyFail);
              }}
            />
          </div>
        </div>
      </section>

      <AiPanel input={input} analysis={analysis} ready={filled && Boolean(analysis)} />

      <footer className="border-t border-brand-line">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-12 flex flex-wrap items-center justify-between gap-6">
          <div>
            <img src="/logo.png" alt="CONCEPTOR" className="h-5 w-auto" />
            <p className="font-mono text-[0.65rem] text-neutral-600 mt-3">{t.footer.tagline}</p>
          </div>
          <p className="font-mono text-[0.65rem] text-neutral-600 max-w-md leading-relaxed">{t.footer.note}</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <Page />
    </LangProvider>
  );
}
