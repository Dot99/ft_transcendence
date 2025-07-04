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
const getGamesByUserId = async (request, reply) => {
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
const getAllTournaments = async (request, reply) => {
  try {
    const result = await gameService.getTournaments(request.lang);
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
 * @description Create a new tournament
 * @param {Object} request - The request object
 * @param {Object} reply - The response object
 * @returns {Promise<void>}
 */
const createTournament = async (request, reply) => {
  try {
    const tournamentData = request.body;
    const result = await gameService.createTournament(tournamentData);
    if (!result.success) {
      return reply.code(400).send(result);
    }
    reply.code(201).send({ success: true, tournament: result.tournament });
  } catch (error) {
    console.error("Internal Server Error:", error);
    reply.code(500).send({
      success: false,
      error: error.message,
    });
  }
};

/** * @description Join a tournament
 * @param {Object} request - The request object
 * @param {Object} reply - The response object
 * @returns {Promise<void>}
 */
const joinTournament = async (request, reply) => {
  try {
    const { tournamentName, tournamentId, userId } = request.body;
    const result = await gameService.joinTournament(
      tournamentName,
      tournamentId,
      userId
    );
    if (!result.success) {
      return reply.code(404).send(result);
    }
    reply.send({ success: true, message: result.message });
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

/**
 * @description Get all tournament players
 * @param {Object} request - The request object
 * @param {Object} reply - The response object
 * @returns {Promise<void>}
 */
const getAllTournamentPlayers = async (request, reply) => {
  try {
    const tournamentId = request.params.tournamentid;
    const result = await gameService.getAllTournamentPlayers(tournamentId);
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

/**
 * @description Update Game Costumization
 * @param {Object} request - The request object
 * @param {Object} reply - The response object
 * @returns {Promise<void>}
 */
async function updateCostumization(request, reply, customization) {
  try {
    const userId = request.params.userid;
    const { paddle_color, ball_color, board_color, border_color } =
      customization;

    const result = await gameService.updateCustomization(userId, customization);
    if (!result.success) {
      return reply.code(404).send(result);
    }

    return reply.code(200).send(result);
  } catch (err) {
    console.error(err);
    return reply
      .code(500)
      .send({ success: false, error: "Internal server error" });
  }
}

async function getCustomization(request, reply) {
  try {
    const userId = request.params.userid;
    const result = await gameService.getCustomization(userId);
    if (!result.success) {
      return reply.code(404).send(result);
    }
    return reply.code(200).send(result.customization);
  } catch (err) {
    console.error(err);
    return reply
      .code(500)
      .send({ success: false, error: "Internal server error" });
  }
}

/**
 * @description Create a game invitation to a friend
 * @param {Object} request - The request object
 * @param {Object} reply - The response object
 * @param {number} friendId - The friend's user ID
 * @param {string} lang - The language
 * @returns {Promise<void>}
 */
const createGameInvitation = async (request, reply, friendId, lang) => {
	try {
		const inviterId = request.user.id;
		const result = await gameService.createGameInvitation(inviterId, friendId, lang);
		
		if (!result.success) {
			return reply.code(400).send(result);
		}

		reply.send(result);
	} catch (error) {
		console.error("Internal Server Error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
};

/**
 * @description Respond to a game invitation (accept or decline)
 * @param {Object} request - The request object
 * @param {Object} reply - The response object
 * @param {number} invitationId - The invitation ID
 * @param {boolean} accept - Whether to accept the invitation
 * @param {string} lang - The language
 * @returns {Promise<void>}
 */
const respondToGameInvitation = async (request, reply, invitationId, accept, lang) => {
	try {
		const userId = request.user.id;
		const result = await gameService.respondToGameInvitation(invitationId, userId, accept, lang);
		
		if (!result.success) {
			return reply.code(400).send(result);
		}

		reply.send(result);
	} catch (error) {
		console.error("Internal Server Error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
};

/**
 * @description Get pending game invitations for current user
 * @param {Object} request - The request object
 * @param {Object} reply - The response object
 * @param {string} lang - The language
 * @returns {Promise<void>}
 */
const getPendingGameInvitations = async (request, reply, lang) => {
	try {
		const userId = request.user.id;
		const result = await gameService.getPendingGameInvitations(userId, lang);
		
		if (!result.success) {
			return reply.code(400).send(result);
		}

		reply.send(result);
	} catch (error) {
		console.error("Internal Server Error:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
};

/**
 * @description Save the result of a PvP game
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @param {string} lang - The language for messages
 * @returns {Promise<void>}
 */
const saveGameResult = async (request, reply, lang) => {
	try {
		const gameData = request.body;
		const result = await gameService.saveGameResult(gameData, lang);
		
		if (!result.success) {
			return reply.code(400).send({ 
				success: false, 
				message: result.message 
			});
		}
		
		reply.send({
			success: true,
			match_id: result.match_id,
			message: result.message,
			warning: result.warning
		});
	} catch (error) {
		console.error("Error saving game result:", error);
		reply.code(500).send({
			success: false,
			error: error.message,
		});
	}
};

/**
 * @description Recalculate stats for a user (debugging/admin function)
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @param {number} userId - The user ID
 * @param {string} lang - The language for messages
 * @returns {Promise<void>}
 */
const recalculateUserStats = async (request, reply, userId, lang) => {
	try {
		const result = await gameService.recalculateUserStats(userId, lang);
		
		if (!result.success) {
			return reply.code(400).send({ 
				success: false, 
				message: result.message 
			});
		}
		
		reply.send({
			success: true,
			stats: result.stats,
			message: "User stats recalculated successfully"
		});
	} catch (error) {
		console.error("Error recalculating user stats:", error);
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
	getPastTournamentsByUserId,
	getUpcomingTournamentsByUserId,
	getTournamentById,
	getUpcomingTournamentMatchesById,
	getTournamentPlayersById,
	updateCostumization,
	getCustomization,
	getAllTournaments,
	createTournament,
	joinTournament,
	createGameInvitation,
	getPendingGameInvitations,
	respondToGameInvitation,
	saveGameResult,
	recalculateUserStats,
};
