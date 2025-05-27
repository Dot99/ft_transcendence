const paramsJsonSchema = {
	type: "object",
	properties: {
		id: {
			type: "integer",
			minimum: 1,
			maximum: 2147483647,
		},
		gameId: {
			type: "integer",
			minimum: 1,
			maximum: 2147483647,
		},
	},
};

export { paramsJsonSchema };
