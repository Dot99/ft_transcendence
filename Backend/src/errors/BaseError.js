export class BaseError extends Error {
	constructor(message, statusCode = 500, code = "INTERNAL_SERVER_ERROR") {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.code = code;

		// Ensures the stack trace is correctly shown
		Error.captureStackTrace(this, this.constructor);
	}
}
