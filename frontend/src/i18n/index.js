import React, { createContext, useContext, useEffect, useState } from "react";
import id from "./id";
import en from "./en";

const DICTS = { id, en };
const STORAGE_KEY = "conceptor_lang";

const LangContext = createContext({ lang: "id", t: id, setLang: () => {} });

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem(STORAGE_KEY) || "id");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t: DICTS[lang] || id }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);

export const fill = (template, vars) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), template);
