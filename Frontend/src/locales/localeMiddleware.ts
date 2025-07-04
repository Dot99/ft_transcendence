import { messages } from "./messages.js";

const LANG_KEY = "pong_lang";

export function getLang(): keyof typeof messages {
    return (localStorage.getItem(LANG_KEY) as keyof typeof messages) || "en";
}

export function setLang(lang: keyof typeof messages) {
    localStorage.setItem(LANG_KEY, lang);
}

export function t(key: string): string {
    const lang = getLang();
    return (
        (messages[lang] as Record<string, string>)[key] ||
        (messages["en"] as Record<string, string>)[key] ||
        key
    );
}
