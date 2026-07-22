import en from "./en.json";
import id from "./id.json";

export type Lang = "en" | "id";
export type TranslationKey = keyof typeof en;

const translations: Record<Lang, Record<string, string>> = { en, id };

export function getTranslation(
  lang: Lang,
  key: string,
  fallback?: string,
): string {
  return translations[lang]?.[key] ?? fallback ?? key;
}

export function getAvailableLanguages(): { code: Lang; label: string }[] {
  return [
    { code: "en", label: "English" },
    { code: "id", label: "Indonesia" },
  ];
}

export function getStoredLanguage(): Lang {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem("lang") as Lang) || "en";
}

export function storeLanguage(lang: Lang): void {
  localStorage.setItem("lang", lang);
}
