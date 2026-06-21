export type Language = "es" | "it" | "en";

const FALLBACK_LANGUAGE: Language = "es";
const SUPPORTED_LANGUAGES: Language[] = ["es", "it", "en"];

function normaliseLanguage(value?: string | null): Language | null {
  if (!value) return null;
  const code = value.toLowerCase().split("-")[0];
  if (SUPPORTED_LANGUAGES.includes(code as Language)) return code as Language;
  return null;
}

function readLanguageFromUrl(): Language | "auto" | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("lang");
  if (value === "auto") return "auto";
  return normaliseLanguage(value);
}

export function detectLanguage(): Language {
  if (typeof window === "undefined") return FALLBACK_LANGUAGE;

  const urlLanguage = readLanguageFromUrl();
  if (urlLanguage === "auto") {
    window.localStorage.removeItem("eivitech_language");
  } else if (urlLanguage) {
    window.localStorage.setItem("eivitech_language", urlLanguage);
    return urlLanguage;
  }

  const stored = normaliseLanguage(window.localStorage.getItem("eivitech_language"));
  if (stored) return stored;

  for (const candidate of window.navigator.languages || [window.navigator.language]) {
    const lang = normaliseLanguage(candidate);
    if (lang) return lang;
  }

  return FALLBACK_LANGUAGE;
}

export const CURRENT_LANGUAGE: Language = detectLanguage();

export function initLanguage() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = CURRENT_LANGUAGE === "es" ? "es-ES" : CURRENT_LANGUAGE === "it" ? "it-IT" : "en-GB";
}

export function tr(es: string, it: string, en: string) {
  if (CURRENT_LANGUAGE === "it") return it;
  if (CURRENT_LANGUAGE === "en") return en;
  return es;
}

export const languageLabels: Record<Language, string> = {
  es: "Español",
  it: "Italiano",
  en: "English",
};
