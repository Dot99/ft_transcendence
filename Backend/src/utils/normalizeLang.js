const supportedLanguages = ["en", "pt"];

export function normalizeLang(inputLang = "en") {
	const langCode = inputLang.toLowerCase().split(",")[0].split("-")[0]; // "pt-pt" → "pt"

	return supportedLanguages.includes(langCode) ? langCode : "en";
}
