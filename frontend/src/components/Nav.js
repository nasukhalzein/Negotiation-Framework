import React from "react";
import { useLang } from "../i18n";

const LINKS = ["learn", "pillars", "batna", "builder", "results", "ai"];
const IDS = { learn: "belajar", pillars: "pilar", batna: "batna", builder: "builder", results: "hasil", ai: "ai" };

export const Nav = ({ score }) => {
  const { t, lang, setLang } = useLang();
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-brand-line">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <img src="/logo.png" alt="CONCEPTOR" className="h-6 md:h-7 w-auto" data-testid="brand-logo" />
            <span className="hidden md:inline eyebrow text-[0.6rem] shrink-0">{t.nav.tagline}</span>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {LINKS.map((k) => (
              <button
                key={k}
                data-testid={`nav-${IDS[k]}`}
                onClick={() => go(IDS[k])}
                className="font-mono text-[0.7rem] tracking-widest uppercase px-3 py-2 text-neutral-400 hover:text-white border-b-2 border-transparent hover:border-brand-red transition-colors duration-200"
              >
                {t.nav[k]}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex border border-brand-line" data-testid="lang-switch">
              {["id", "en"].map((l) => (
                <button
                  key={l}
                  data-testid={`lang-${l}`}
                  onClick={() => setLang(l)}
                  className={`font-mono text-[0.65rem] tracking-widest uppercase px-2.5 py-1.5 transition-colors duration-200 ${
                    lang === l ? "bg-brand-red text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <span className="hidden sm:inline eyebrow text-[0.6rem]">{t.nav.leverage}</span>
            <span
              data-testid="nav-leverage-score"
              className="font-mono text-sm font-bold text-brand-red border border-brand-line px-2.5 py-1"
            >
              {score ?? 0}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
