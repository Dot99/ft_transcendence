import { json } from "express";
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
		const id = req.params.id;
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
const getGamesByUserId = async (request, reply, lang) => {
	try {
		const userId  = request.params.id;
		const result = await gameService.getGamesByUserId(userId, request.lang);
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({success: true, games: result.games});
	} catch (error) {
		console.error("Handler error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
};

/* * @description Get recent games by user ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Promise<void>}
 * @throws {Error} - If there is an error retrieving the recent games
 */
const getRecentGamesByUserId = async (request, reply) => {
	try {
		const userId = request.params.id;
		const result = await gameService.getRecentGamesByUserId(userId);
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({success: true, games: result.games});
	} catch (error) {
		console.error("Handler error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
}

/**
 * @description Get past tournaments by user ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Promise<void>}
 * @throws {Error} - If there is an error retrieving the past tournaments
 */
const getPastTournamentsByUserId = async (request, reply) => {
	try {
		const userId = request.params.id;
		const result = await gameService.getPastTournamentsByUserId(userId);
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({success: true, tournaments: result.tournaments});
	} catch (error) {
		console.error("Handler error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
}

/**
 * @description Get upcoming tournaments by user ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Promise<void>}
 * @throws {Error} - If there is an error retrieving the upcoming tournaments
 */
const getUpcomingTournamentsByUserId = async (request, reply) => {
	try {
		const userId = request.params.id;
		const result = await gameService.getUpcomingTournamentsByUserId(userId);
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({success: true, tournaments: result.tournaments});
	} catch (error) {
		console.error("Handler error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
}

/**
 * @description Get all tournaments by user ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Promise<void>}
 * @throws {Error} - If there is an error retrieving the tournaments
 */
const getAllTournamentsByUserId = async (request, reply) => {
	try {
		const userId = request.params.id;
		const result = await gameService.getAllTournamentsByUserId(userId);
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({success: true, tournaments: result.tournaments});
	} catch (error) {
		console.error("Handler error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
}

/**
 * @description Get tournament by ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Promise<void>}
 * @throws {Error} - If there is an error retrieving the tournament
 */
const getTournamentById = async (request, reply) => {
	try {
		const tournamentId = request.params.id;
		const result = await gameService.getTournamentById(tournamentId);
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({success: true, tournament: result.tournament});
	} catch (error) {
		console.error("Handler error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
}

/**
 * @description Get upcoming tournament matches by user ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Promise<void>}
 * @throws {Error} - If there is an error retrieving the upcoming tournament matches
 */
const getUpcomingTournamentMatchesById = async (request, reply) => {
	try {
		const userId = request.params.id;
		const result = await gameService.getTournamentMatchesById(userId);
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({success: true, matches: result.matches});
	} catch (error) {
		console.error("Handler error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
}


export default {
	getAllGames,
	getGameById,
	getGamesByUserId,
	getRecentGamesByUserId,
	getPastTournamentsByUserId,
	getUpcomingTournamentsByUserId,
	getAllTournamentsByUserId,
	getTournamentById,
	getUpcomingTournamentMatchesById
};
