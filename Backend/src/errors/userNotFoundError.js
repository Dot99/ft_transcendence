import { BaseError } from "./BaseError.js";

export class UserNotFoundError extends BaseError {
	constructor(lang = "en") {
		const messages = {
			en: "User not found",
			pt: "Utilizador não encontrado",
			zh: "用户未找到",
		};
		super(messages[lang] || messages["en"], 404, "USER_NOT_FOUND");
	}
}
