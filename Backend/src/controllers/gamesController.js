import * as gameService from "../services/gamesService.js";

/**
 * @description Get all games
 * @param {Object} request - The request object
 * @param {Object} response - The response object
 * @returns {Promise<void>}
 */
const getAllGames = async (request, response) => {
	try {
		const result = gameService.getAllGames();
		if (!result.success) {
			return response.code(404).send({ message: result.error });
		}
		reply.send(result.games);
	} catch (error) {
		console.error("Internal Server Error:", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Get a game by ID
 * @param {Object} request - The request object
 * @param {Object} response - The response object
 * @returns {Promise<void>}
 */
const getGameById = async (request, response) => {
	try {
		const id = request.params.id;
		const result = gameService.getGameById(id);
		if (!result.success) {
			return response.code(404).send({ message: result.message });
		}
		reply.send(result.game);
	} catch (error) {
		console.error("Internal Server Error:", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Get games by user ID
 * @param {Object} request - The request object
 * @param {Object} response - The response object
 * @returns {Promise<void>}
 */
const getGamesByUserId = async (request, reply, lang) => {
	try {
		const userId = request.params.id;
		const result = await gameService.getGamesByUserId(userId, request.lang);
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({ success: true, games: result.games });
	} catch (error) {
		console.error("Internal Server Error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
};

/** @description Get recent games by user ID
 * @param {Object} request - The request object
 * @param {Object} response - The response object
 * @returns {Promise<void>}
 */
const getRecentGamesByUserId = async (request, reply) => {
	try {
		const userId = request.params.id;
		const result = await gameService.getRecentGamesByUserId(userId);
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({ success: true, games: result.games });
	} catch (error) {
		console.error("Internal Server Error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
};
/**
 * @description Get all tournaments
 * @param {Object} request - The request object
 * @param {Object} reply - The response object
 * @returns {Promise<void>}
 */
const getTournaments = async (request, reply) => {
	try {
		const result = await gameService.getTournaments();
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({ success: true, tournaments: result.tournaments });
	} catch (error) {
		console.error("Internal Server Error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
};
/**
 * @description Get past tournaments by user ID
 * @param {Object} request - The request object
 * @param {Object} response - The response object
 * @returns {Promise<void>}
 */
const getPastTournamentsByUserId = async (request, reply) => {
	try {
		const userId = request.params.id;
		const result = await gameService.getPastTournamentsByUserId(userId);
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({ success: true, tournaments: result.tournaments });
	} catch (error) {
		console.error("Internal Server Error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
};

/**
 * @description Get upcoming tournaments by user ID
 * @param {Object} request - The request object
 * @param {Object} response - The response object
 * @returns {Promise<void>}
 */
const getUpcomingTournamentsByUserId = async (request, reply) => {
	try {
		const userId = request.params.id;
		const result = await gameService.getUpcomingTournamentsByUserId(userId);
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({ success: true, tournaments: result.tournaments });
	} catch (error) {
		console.error("Internal Server Error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
};

/**
 * @description Get tournament by ID
 * @param {Object} request - The request object
 * @param {Object} response - The response object
 * @returns {Promise<void>}
 */
const getTournamentById = async (request, reply) => {
	try {
		const tournamentId = request.params.id;
		const result = await gameService.getTournamentById(tournamentId);
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({ success: true, tournament: result.tournament });
	} catch (error) {
		console.error("Internal Server Error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
};

/**
 * @description Get upcoming tournament matches by user ID
 * @param {Object} request - The request object
 * @param {Object} response - The response object
 * @returns {Promise<void>}
 */
const getUpcomingTournamentMatchesById = async (request, reply) => {
	try {
		const tournamentId = request.params.id;
		const result = await gameService.getUpcomingTournamentMatchesById(
			tournamentId
		);
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({ success: true, matches: result.matches });
	} catch (error) {
		console.error("Internal Server Error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
};

/**
 * @description Get tournament players by ID
 * @param {Object} request - The request object
 * @param {Object} reply - The response object
 * @returns {Promise<void>}
 */
const getTournamentPlayersById = async (request, reply) => {
	try {
		const tournamentId = request.params.tournamentid;
		const userId = request.params.userid;
		const result = await gameService.getTournamentPlayersById(
			tournamentId,
			userId
		);
		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({ success: true, players: result.players });
	} catch (error) {
		console.error("Internal Server Error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
};

export default {
	getAllGames,
	getGameById,
	getGamesByUserId,
	getRecentGamesByUserId,
	getTournaments,
	getPastTournamentsByUserId,
	getUpcomingTournamentsByUserId,
	getTournamentById,
	getUpcomingTournamentMatchesById,
	getTournamentPlayersById,
};
