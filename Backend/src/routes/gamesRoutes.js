import gamesController from "../controllers/gamesController.js";
import { paramsJsonSchema } from "../schemas/gameSchemas.js";

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
		prehandler: [fastify.authenticate],
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
		prehandler: [fastify.authenticate],
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
		// prehandler: [fastify.authenticate],
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
		// prehandler: [fastify.authenticate],
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
		// prehandler: [fastify.authenticate],
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
		// prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getUpcomingTournamentsByUserId(
				request,
				reply,
				request.params.id,
				request.lang
			),
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
		prehandler: [fastify.authenticate],
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getUpcomingTournamentMatchesById(
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
	fastify.get("/tournaments/:id/players", {
		schema: {
			params: paramsJsonSchema,
		},
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await gamesController.getTournamentPlayersById(
				request,
				reply,
				request.params.id,
				request.lang
			),
	});
	
}
