import gamesController from "../controllers/gamesController.js";
import {
	paramsJsonSchema,
	gameResultJsonSchema,
} from "../schemas/gameSchemas.js";

export default async function (fastify, opts) {
	/**
	 * @name getAllGames
	 * @description Get all games
	 * @route GET /games
	 * @group Games
	 * @returns {Array} 200 - An array of games
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/games", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getAllGames(request, reply, request.lang),
	});
	/**
	 * @name getGameById
	 * @description Get a game by id
	 * @route GET /games/{id}
	 * @group Games
	 * @param {string} id - Game id
	 * @returns {Object} 200 - A game object
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - Game not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/games/:id", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getGameById(
				request,
				reply,
				request.params.id,
				request.lang
			),
	});
	/**
	 * @name getGameByUserid
	 * @description Get a game by user id
	 * @route GET /games/users/{id}
	 * @group Games
	 * @param {string} id - User id
	 * @returns {Array} 200 - An array of games
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/games/users/:id", {
		schema: {
			params: paramsJsonSchema,
		},
		// preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getGamesByUserId(
				request,
				reply,
				request.params.id,
				request.lang
			),
	});
	/**
	 * @name getRecentGamesByUserId
	 * @description Get recent games by user id
	 * @route GET /games/users/{id}/recent
	 * @group Games
	 * @param {string} id - User id
	 * @returns {Array} 200 - An array of recent games
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/games/users/:id/recent", {
		schema: {
			params: paramsJsonSchema,
		},
		// preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getRecentGamesByUserId(
				request,
				reply,
				request.params.id,
				request.lang
			),
	});
	/**
	 * @name getPastTournamentsByUserId
	 * @description Get past tournaments by user id
	 * @route GET /games/users/{id}/tournaments/past
	 * @group Games
	 * @param {string} id - User id
	 * @returns {Array} 200 - An array of past tournaments
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/tournaments/users/:id/past", {
		schema: {
			params: paramsJsonSchema,
		},
		// preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getPastTournamentsByUserId(
				request,
				reply,
				request.params.id,
				request.lang
			),
	});
	/**
	 * @name getUpcomingTournamentsByUserId
	 * @description Get upcoming tournaments by user id
	 * @route GET /games/users/{id}/tournaments/upcoming
	 * @group Games
	 * @param {string} id - User id
	 * @returns {Array} 200 - An array of upcoming tournaments
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/tournaments/users/:id/upcoming", {
		schema: {
			params: paramsJsonSchema,
		},
		// preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getUpcomingTournamentsByUserId(
				request,
				reply,
				request.params.id,
				request.lang
			),
	});
	/**
	 * @name getActiveTournamentsByUserId
	 * @description Get active tournaments by user id
	 * @route GET /tournaments/users/{id}/active
	 * @group Games
	 * @param {string} id - User id
	 * @returns {Array} 200 - An array of active tournaments
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/tournaments/users/:id/active", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getActiveTournamentsForUser(request, reply),
	});
	/**
	 * @name getTournamentById
	 * @description Get a tournament by id
	 * @route GET /games/tournaments/{id}
	 * @group Games
	 * @param {string} id - Tournament id
	 * @returns {Object} 200 - A tournament object
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - Tournament not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/tournaments/:id", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getTournamentById(
				request,
				reply,
				request.params.id,
				request.lang
			),
	});
	/**
	 * @name getTournamentMatchesById
	 * @description Get tournament matches by id
	 * @route GET /games/tournaments/{id}/matches
	 * @group Games
	 * @param {string} id - Tournament id
	 * @returns {Array} 200 - An array of tournament matches
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - Tournament not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/tournaments/:id/matches", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getUpcomingTournamentMatchesById(
				request,
				reply,
				request.params.id,
				request.lang
			),
	});

	/** @name getTournamentFinishedMatchesById
	 * @description Get finished tournament matches by id
	 * @route GET /games/tournaments/{id}/matches/finished
	 * @group Games
	 * @param {string} id - Tournament id
	 * @returns {Array} 200 - An array of finished tournament matches
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - Tournament not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/tournaments/:id/matches/finished", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getFinishedMatches(
				request,
				reply,
				request.params.id,
				request.lang
			),
	});
	/**
	 * @name getTournamentPlayersById
	 * @description Get tournament players by id
	 * @route GET /games/tournaments/{id}/players
	 * @group Games
	 * @param {string} id - Tournament id
	 * @returns {Array} 200 - An array of tournament players
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - Tournament not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/tournaments/:tournamentid/players/:userid", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getTournamentPlayersById(
				request,
				reply,
				request.params.tournamentid,
				request.params.userid,
				request.lang
			),
	});
	/**
	 * @name getTournamentPlayersById
	 * @description Get tournament players by id
	 * @route GET /games/tournaments/{id}/players
	 * @group Games
	 * @param {string} id - Tournament id
	 * @returns {Array} 200 - An array of tournament players
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - Tournament not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/tournaments/:tournamentid/players", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getAllTournamentPlayers(
				request,
				reply,
				request.params.tournamentid,
				request.params.userid,
				request.lang
			),
	});
	/**
	 * @name getAllTournaments
	 * @description Get all tournaments
	 * @route GET /games/tournaments
	 * @group Games
	 * @returns {Array} 200 - An array of tournaments
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/tournaments", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getAllTournaments(
				request,
				reply,
				request.lang
			),
	});
	/**
	 * @name createTournament
	 * @description Create a new tournament
	 * @route POST /games/tournaments
	 * @group Games
	 * @param {Object} request.body - Tournament data
	 * @returns {Object} 201 - Created tournament data
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/tournaments", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.createTournament(
				request,
				reply,
				request.body
			),
	});
	/**
	 * @name joinTournament
	 * @description Join a tournament
	 * @route POST /games/tournaments/join
	 * @group Games
	 * @param {Object} request.body - Tournament join data
	 * @returns {Object} 200 - Success message
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - Tournament not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/tournaments/join", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.joinTournament(
				request,
				reply,
				request.body.tournamentName,
				request.body.tournamentId,
				request.body.userId
			),
	});
	/**
	 * @name updateCostumization
	 * @description Update game customization for a user
	 * @route PUT /games/costumization
	 * @group Games
	 * @param {Object} request.body - Customization data
	 * @returns {Object} 200 - Updated customization data
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.put("/games/costumization/:userid", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) => {
			return await gamesController.updateCostumization(
				request,
				reply,
				request.body,
				request.params.userid
			);
		},
	});
	/**
	 * @name getCustomization
	 * @description Get game customization for a user
	 * @route GET /games/costumization/:userid
	 * @group Games
	 * @param {string} userid - User ID
	 * @returns {Object} 200 - Customization data
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - Customization not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/games/costumization/:userid", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getCustomization(
				request,
				reply,
				request.params.userid,
				request.lang
			),
	});
	/**
	 * @name createGameInvitation
	 * @description Create a game invitation to a friend
	 * @route POST /games/invite/{friendId}
	 * @group Games
	 * @param {string} friendId - Friend's user id
	 * @returns {Object} 200 - Invitation created successfully
	 * @returns {Error} 400 - Bad request
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - Friend not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/games/invite/:friendId", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.createGameInvitation(
				request,
				reply,
				request.params.friendId,
				request.lang
			),
	});

	/**
	 * @name getPendingGameInvitations
	 * @description Get pending game invitations for current user
	 * @route GET /games/invitations/pending
	 * @group Games
	 * @returns {Object} 200 - Array of pending invitations
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/games/invitations/pending", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getPendingGameInvitations(
				request,
				reply,
				request.lang
			),
	});

	/**
	 * @name respondToGameInvitation
	 * @description Accept or decline a game invitation
	 * @route POST /games/invitation/{invitationId}/respond
	 * @group Games
	 * @param {string} invitationId - Invitation id
	 * @returns {Object} 200 - Response processed successfully
	 * @returns {Error} 400 - Bad request
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - Invitation not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/games/invitation/:invitationId/respond", {
		schema: {
			params: paramsJsonSchema,
			body: {
				type: "object",
				required: ["accept"],
				properties: {
					accept: { type: "boolean" },
				},
			},
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.respondToGameInvitation(
				request,
				reply,
				request.params.invitationId,
				request.body.accept,
				request.lang
			),
	});
	/**
	 * @name saveGameResult
	 * @description Save the result of a completed PvP game
	 * @route POST /games/save-result
	 * @group Games
	 * @param {Object} body - Game result data
	 * @param {number} body.player1 - Player 1 user ID
	 * @param {number} body.player2 - Player 2 user ID
	 * @param {number} body.player1_score - Player 1 final score
	 * @param {number} body.player2_score - Player 2 final score
	 * @param {number} body.winner - Winner user ID (or null for tie)
	 * @returns {Object} 200 - Success response with match ID
	 * @returns {Error} 400 - Invalid game data
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/games/save-result", {
		schema: {
			body: gameResultJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.saveGameResult(request, reply, request.lang),
	});
	/**
	 * @name recalculateUserStats
	 * @description Recalculate and fix stats for a specific user (debugging/admin)
	 * @route POST /games/recalculate-stats/{userId}
	 * @group Games
	 * @param {number} userId - User ID to recalculate stats for
	 * @returns {Object} 200 - Success response with recalculated stats
	 * @returns {Error} 400 - Invalid user data
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/games/recalculate-stats/:userId", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.recalculateUserStats(
				request,
				reply,
				request.params.id,
				request.lang
			),
	});
	/**
	 * @name markPlayerReady
	 * @description Mark a player as ready for their tournament match
	 * @route POST /tournaments/{tournamentId}/matches/{matchId}/ready
	 * @group Tournaments
	 * @param {string} tournamentId - Tournament id
	 * @param {string} matchId - Match id
	 * @returns {Object} 200 - Player marked as ready
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - Match not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/tournaments/:tournamentId/matches/:matchId/ready", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.markPlayerReady(
				request,
				reply,
				request.params.tournamentId,
				request.params.matchId,
				request.user.id,
				request.lang
			),
	});

	/**
	 * @name getMatchStatus
	 * @description Get the status of a tournament match (both players ready, gameId if available)
	 * @route GET /tournaments/{tournamentId}/matches/{matchId}/status
	 * @group Tournaments
	 * @param {string} tournamentId - Tournament id
	 * @param {string} matchId - Match id
	 * @returns {Object} 200 - Match status with readiness and gameId
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - Match not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/tournaments/:tournamentId/matches/:matchId/status", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getMatchStatus(
				request,
				reply,
				request.params.tournamentId,
				request.params.matchId,
				request.user.id,
				request.lang
			),
	});
	/**
	 * @name getTournamentStatus
	 * @description Get detailed tournament status for debugging
	 * @route GET /tournaments/{tournamentId}/debug-status
	 * @group Tournaments
	 * @param {number} tournamentId - Tournament ID
	 * @returns {Object} 200 - Success response with tournament details
	 * @returns {Error} 404 - Tournament not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/tournaments/:tournamentId/debug-status", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getTournamentStatus(request, reply),
	});

	/**
	 * @name debugSimulateTournamentResult
	 * @description Simulate a tournament match result for testing
	 * @route POST /tournaments/{tournamentId}/matches/{matchId}/debug-result
	 * @group Tournaments
	 * @param {number} tournamentId - Tournament ID
	 * @param {number} matchId - Match ID
	 * @param {Object} body - Simulation data
	 * @param {number} body.winnerId - Winner user ID
	 * @param {number} body.player1Score - Player 1 score
	 * @param {number} body.player2Score - Player 2 score
	 * @returns {Object} 200 - Success response with result
	 * @returns {Error} 404 - Match not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/tournaments/:tournamentId/matches/:matchId/debug-result", {
		schema: {
			params: paramsJsonSchema,
			body: {
				type: "object",
				properties: {
					winnerId: { type: "number" },
					player1Score: { type: "number" },
					player2Score: { type: "number" },
				},
				required: ["winnerId", "player1Score", "player2Score"],
			},
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.debugSimulateTournamentResult(request, reply),
	});

	/**
	 * @name debugResetTournamentReadiness
	 * @description Reset tournament readiness for debugging
	 * @route POST /tournaments/{tournamentId}/debug-reset-readiness
	 * @group Tournaments
	 * @param {number} tournamentId - Tournament ID
	 * @returns {Object} 200 - Success response
	 * @returns {Error} 404 - Tournament not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/tournaments/:tournamentId/debug-reset-readiness", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.debugResetTournamentReadiness(request, reply),
	});
}
