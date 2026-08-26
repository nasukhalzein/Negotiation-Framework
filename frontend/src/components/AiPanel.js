import React, { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Copy, Loader2 } from "lucide-react";
import { streamAi } from "../lib/api";
import { copyText } from "../lib/clipboard";
import { useLang } from "../i18n";

function renderMarkdown(text) {
  const lines = text.split("\n");
  const out = [];
  let code = null;
  lines.forEach((line, i) => {
    if (line.trim().startsWith("```")) {
      if (code === null) code = [];
      else {
        out.push(<pre key={`c${i}`}>{code.join("\n")}</pre>);
        code = null;
      }
      return;
    }
    if (code !== null) return code.push(line);
    const bold = (s) =>
      s.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith("**") ? <strong key={j}>{part.slice(2, -2)}</strong> : <span key={j}>{part}</span>
      );
    if (line.startsWith("### ")) out.push(<h3 key={i}>{line.slice(4)}</h3>);
    else if (line.startsWith("## ")) out.push(<h2 key={i}>{line.slice(3)}</h2>);
    else if (line.startsWith("# ")) out.push(<h2 key={i}>{line.slice(2)}</h2>);
    else if (/^(---|\*\*\*|___)\s*$/.test(line.trim())) out.push(<div key={i} className="hairline my-5" />);
    else if (line.trim().startsWith(">"))
      out.push(
        <blockquote key={i} className="border-l-2 border-brand-red pl-4 my-2 text-neutral-300 italic">
          {bold(line.trim().replace(/^>\s?/, ""))}
        </blockquote>
      );
    else if (/^[-*] /.test(line.trim())) out.push(<li key={i}>{bold(line.trim().slice(2))}</li>);
    else if (line.trim() === "") out.push(<div key={i} className="h-2" />);
    else out.push(<p key={i}>{bold(line)}</p>);
  });
  if (code) out.push(<pre key="ctail">{code.join("\n")}</pre>);
  return out;
}

export const AiPanel = ({ input, analysis, ready }) => {
  const { t } = useLang();
  const a = t.ai;
  const [mode, setMode] = useState("script");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [truncated, setTruncated] = useState(false);

  const run = (m) => {
    if (!ready) {
      toast.error(a.notReady);
      return;
    }
    setMode(m);
    setText("");
    setTruncated(false);
    setLoading(true);
    streamAi(
      { input, analysis, mode: m },
      (d) => setText((prev) => prev + d),
      (complete) => {
        setLoading(false);
        if (complete === false) setTruncated(true);
      },
      (err) => {
        setLoading(false);
        toast.error(`${a.failed}: ${err}`);
      }
    );
  };

  return (
    <section id="ai" className="border-t border-brand-line bg-[#0c0c0c] scroll-mt-20">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-24">
        <div className="eyebrow">{a.eyebrow}</div>
        <h2 className="font-display text-3xl md:text-4xl tracking-tighter mt-5 max-w-3xl">{a.title}</h2>
        <p className="text-sm text-neutral-400 mt-5 max-w-2xl leading-relaxed">{a.sub}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-10">
          {a.modes.map((m) => (
            <button
              key={m.key}
              data-testid={`ai-mode-${m.key}`}
              onClick={() => run(m.key)}
              disabled={loading}
              className={`text-left p-5 border transition-colors duration-200 disabled:opacity-50 ${
                mode === m.key ? "border-brand-red bg-[#1c1010]" : "border-brand-line bg-[#101010] hover:border-neutral-600"
              }`}
            >
              <div className="flex items-center gap-2">
                {loading && mode === m.key ? (
                  <Loader2 size={14} className="animate-spin text-brand-red" />
                ) : (
                  <Sparkles size={14} strokeWidth={1.5} className="text-brand-red" />
                )}
                <span className="font-mono text-xs tracking-widest uppercase text-white">{m.label}</span>
              </div>
              <p className="text-xs text-neutral-500 mt-3">{m.desc}</p>
            </button>
          ))}
        </div>

        {(text || loading) && (
          <div className="border border-brand-line bg-[#0f0f0f] mt-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-line">
              <span className="font-mono text-[0.68rem] tracking-widest uppercase text-neutral-400">
                {loading ? a.working : truncated ? a.truncated : a.done} · CLAUDE SONNET 4.6
              </span>
              <button
                data-testid="ai-copy-btn"
                onClick={async () => {
                  const ok = await copyText(text);
                  ok ? toast.success(a.copied) : toast.error(t.results.copyFail);
                }}
                className="inline-flex items-center gap-2 font-mono text-[0.68rem] tracking-widest uppercase text-neutral-400 hover:text-white transition-colors"
              >
                <Copy size={12} /> {t.results.copy}
              </button>
            </div>
            <div data-testid="ai-output" className="markdown p-6 md:p-8 max-h-[640px] overflow-y-auto">
              {renderMarkdown(text)}
              {loading && <span className="inline-block w-2 h-4 bg-brand-red align-middle animate-pulse" />}
              {truncated && (
                <div data-testid="ai-truncated-note" className="border border-amber-500/40 bg-[#181510] p-4 mt-6">
                  <div className="font-mono text-xs text-amber-500">{a.truncTitle}</div>
                  <p className="text-sm text-neutral-300 mt-2">{a.truncBody}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
