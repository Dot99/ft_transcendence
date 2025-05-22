const paramsJsonSchema = {
	type: "object",
	properties: {
		id: {
			type: "string",
			format: "uuid",
		},
		gameId: {
			type: "string",
			format: "uuid",
		},
	},
};

export { paramsJsonSchema };
