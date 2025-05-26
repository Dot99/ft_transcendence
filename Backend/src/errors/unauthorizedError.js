import { BaseError } from "./BaseError.js";

export class UnauthorizedError extends BaseError {
	constructor(lang = "en") {
		const messages = {
			en: "Unauthorized access",
			pt: "Acesso não autorizado",
		};
		super(messages[lang] || messages["en"], 401, "UNAUTHORIZED");
	}
}
