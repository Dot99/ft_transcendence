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
}
