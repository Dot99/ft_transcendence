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
      await gamesController.getAllTournaments(request, reply, request.lang),
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
      await gamesController.createTournament(request, reply, request.body),
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
}
