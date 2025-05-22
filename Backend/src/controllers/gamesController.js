import * as gameService from "../services/gamesService.js";

/**
 * @description Get all games
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Promise<void>}
 * @throws {Error} - If there is an error retrieving the games
 */
const getAllGames = async (req, res) => {
	try {
		const result = gameService.getAllGames();
		if (!result.success) {
			return res.code(404).send({ message: result.message });
		}
		reply.send(result.games);
	} catch (error) {
		console.error("Handler error:", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Get a game by ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Promise<void>}
 * @throws {Error} - If there is an error retrieving the game
 */
const getGameById = async (req, res) => {
	try {
		const { id } = req.params;
		const result = gameService.getGameById(id);
		if (!result.success) {
			return res.code(404).send({ message: result.message });
		}
		reply.send(result.game);
	} catch (error) {
		console.error("Handler error:", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Get games by user ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Promise<void>}
 * @throws {Error} - If there is an error retrieving the games
 */
const getGamesByUserId = async (req, res) => {
	try {
		const { userId } = req.params;
		const result = gameService.getGamesByUserId(userId);
		if (!result.success) {
			return res.code(404).send({ message: result.message });
		}
		reply.send(result.games);
	} catch (error) {
		console.error("Handler error:", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

export default {
	getAllGames,
	getGameById,
	getGamesByUserId,
};
