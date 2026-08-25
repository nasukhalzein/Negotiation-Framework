import React from "react";

const LINKS = [
  { id: "belajar", label: "Belajar" },
  { id: "pilar", label: "4 Pilar" },
  { id: "batna", label: "BATNA" },
  { id: "builder", label: "Builder" },
  { id: "hasil", label: "Hasil" },
  { id: "ai", label: "AI Coach" },
];

export const Nav = ({ score }) => {
  const go = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-brand-line">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-brand-red flex items-center justify-center">
              <span className="font-display text-sm text-brand-red">C</span>
            </div>
            <span className="font-display text-lg tracking-tight">CONCEPTOR</span>
            <span className="hidden md:inline eyebrow ml-3 text-[0.6rem]">P.A.C.T × BATNA ENGINE</span>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {LINKS.map((l) => (
              <button
                key={l.id}
                data-testid={`nav-${l.id}`}
                onClick={() => go(l.id)}
                className="font-mono text-[0.7rem] tracking-widest uppercase px-3 py-2 text-neutral-400 hover:text-white border-b-2 border-transparent hover:border-brand-red transition-colors duration-200"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline eyebrow text-[0.6rem]">Leverage</span>
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
