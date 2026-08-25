import React, { useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Learn } from "@/components/Learn";
import { Builder } from "@/components/Builder";
import { Results } from "@/components/Results";
import { AiPanel } from "@/components/AiPanel";
import { defaultInput } from "@/lib/schema";
import { analyzeInput } from "@/lib/api";
import { money } from "@/lib/format";
import { copyText } from "@/lib/clipboard";

const STORAGE_KEY = "conceptor_pact_input_v1";

function loadInput() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultInput(), ...JSON.parse(raw) };
  } catch (e) {
    /* ignore */
  }
  return defaultInput();
}

function scriptToText(analysis, currency) {
  const s = analysis.script;
  const n = analysis.numbers;
  return [
    `SKRIP NEGOSIASI — ${analysis.context}`,
    `Leverage Score: ${analysis.leverage_score}/100 (${analysis.tier.label})`,
    n.available
      ? `Anchor ${money(n.anchor, currency)} · Target ${money(n.target, currency)} · Walk-away ${money(n.reservation, currency)}`
      : "",
    "",
    "PEMBUKAAN",
    s.opening,
    "",
    "INTI ARGUMEN",
    ...s.body.map((b, i) => `${i + 1}. ${b}`),
    "",
    "THE ASK",
    s.ask,
    s.silence_rule,
    "",
    "KALAU DITOLAK",
    ...s.objections.map((o) => `${o.objection}\n→ ${o.response}\n`),
    "PENUTUP",
    s.closing,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function App() {
  const [input, setInput] = useState(loadInput);
  const [analysis, setAnalysis] = useState(null);
  const [step, setStep] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      analyzeInput(input)
        .then(setAnalysis)
        .catch(() => {});
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
    setInput(defaultInput());
    setStep(0);
    toast.success("Framework direset");
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
        handlers={{ set, setList, addRow, removeRow }}
        onReset={onReset}
      />

      <section className="border-b border-brand-line bg-[#0c0c0c]">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-24">
          <div className="eyebrow">05 · Hasil Dinamis</div>
          <h2 className="font-display text-3xl md:text-4xl tracking-tighter mt-5">
            Output konkret dari kondisi lo, bukan template
          </h2>
          <p className="text-sm text-neutral-400 mt-5 max-w-2xl leading-relaxed">
            Semua angka di bawah dihitung ulang setiap kali lo mengubah input — termasuk anchor,
            titik walk-away dari BATNA, dan zona kesepakatan.
          </p>
          <div className="mt-12">
            <Results
              analysis={analysis}
              currency={input.currency}
              onCopy={async () => {
                const ok = await copyText(scriptToText(analysis, input.currency));
                ok ? toast.success("Skrip tersalin ke clipboard") : toast.error("Browser menolak akses clipboard");
              }}
            />
          </div>
        </div>
      </section>

      <AiPanel input={input} analysis={analysis} ready={filled && Boolean(analysis)} />

      <footer className="border-t border-brand-line">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-12 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="font-display text-lg tracking-tight">CONCEPTOR</div>
            <p className="font-mono text-[0.65rem] text-neutral-600 mt-2">
              P.A.C.T × BATNA — berbasis prinsip Harvard Program on Negotiation
            </p>
          </div>
          <p className="font-mono text-[0.65rem] text-neutral-600 max-w-md leading-relaxed">
            Data lo disimpan di browser sendiri. Angka pasar adalah estimasi — selalu verifikasi
            dengan sumber terbaru sebelum negosiasi.
          </p>
        </div>
      </footer>
    </div>
  );
}
