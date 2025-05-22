import { BaseError } from "./BaseError.js";

export class UserNotFoundError extends BaseError {
	constructor(lang = "en") {
		const messages = {
			en: "User not found",
			pt: "Utilizador não encontrado",
		};
		super(messages[lang] || messages["en"], 404, "USER_NOT_FOUND");
	}
}
