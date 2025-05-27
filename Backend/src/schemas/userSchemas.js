const paramsJsonSchema = {
	type: "object",
	properties: {
		id: {
			type: "integer",
			minimum: 1,
			maximum: 2147483647,
		},
		username: {
			type: "string",
			minLength: parseInt(process.env.USERNAME_MIN_LENGTH),
			maxLength: parseInt(process.env.USERNAME_MAX_LENGTH),
		},
		friendId: {
			type: "string",
			format: "uuid",
		},
	},
};

const bodyUserSchema = {
	type: "object",
	properties: {
		username: {
			type: "string",
			minLength: parseInt(process.env.USERNAME_MIN_LENGTH),
			maxLength: parseInt(process.env.USERNAME_MAX_LENGTH),
		},
		password: {
			type: "string",
			minLength: parseInt(process.env.PASSWORD_MIN_LENGTH),
			maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH),
		},
		country: {
			type: "string",
			minLength: parseInt(process.env.LANG_MIN_LENGTH),
			maxLength: parseInt(process.env.LANG_MAX_LENGTH),
		},
	},
	required: ["username", "password", "country"],
};

export { paramsJsonSchema, bodyUserSchema };
