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

const gameResultJsonSchema = {
	type: "object",
	required: ["player1", "player2", "player1_score", "player2_score"],
	properties: {
		player1: {
			type: "integer",
			minimum: 1,
			maximum: 2147483647,
		},
		player2: {
			type: "integer",
			minimum: 1,
			maximum: 2147483647,
		},
		player1_score: {
			type: "integer",
			minimum: 0,
			maximum: 100,
		},
		player2_score: {
			type: "integer",
			minimum: 0,
			maximum: 100,
		},
		winner: {
			type: ["integer", "null"],
			minimum: 1,
			maximum: 2147483647,
		},
	},
};

export { paramsJsonSchema, gameResultJsonSchema };
