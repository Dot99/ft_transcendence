import { BaseError } from "./BaseError.js";

export class UnauthorizedError extends BaseError {
	constructor(lang = "en") {
		const messages = {
			en: "Unauthorized access",
			pt: "Acesso não autorizado",
			zh: "未经授权的访问",
		};
		super(messages[lang] || messages["en"], 401, "UNAUTHORIZED");
	}
}
