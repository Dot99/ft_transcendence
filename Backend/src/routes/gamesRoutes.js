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
}
