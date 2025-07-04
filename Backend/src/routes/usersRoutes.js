import usersController from "../controllers/usersController.js";
import { paramsJsonSchema, bodyUserSchema } from "../schemas/userSchemas.js";

export default async function (fastify, opts) {
	//User routes
	/**
	 * @name getAllUsers
	 * @description Get all users
	 * @route GET /users
	 * @group Users - Operations about users
	 * @returns {Array.<User>} 200 - An array of users
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/users", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getAllUsers(request, reply),
	});
	/**
	 * @name getUserById
	 * @description Get user by id
	 * @route GET /users/{id}
	 * @group Users - Operations about users
	 * @param {string} id - user id
	 * @returns {User} 200 - User object
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/users/:id", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getUserById(request, reply),
	});
	/**
	 * @name getUserByUsername
	 * @description Get user by username
	 * @route GET /users/username/{username}
	 * @group Users - Operations about users
	 * @param {string} username - user username
	 * @returns {User} 200 - User object
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/users/username/:username", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getUserByUsername(request, reply),
	});
	/**
	 * @name createUser
	 * @description Create user
	 * @route POST /users
	 * @group Users - Operations about users
	 * @param {User} user.body - user object
	 * @returns {User} 201 - User object
	 * @returns {Error} 400 - Bad request
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/users", {
		schema: {
			body: bodyUserSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.createUser(request, reply),
	});
	/**
	 * @name updateUser
	 * @description Update user
	 * @route PUT /users/{id}
	 * @group Users - Operations about users
	 * @param {string} id- user id
	 * @param {User} user.body - user object
	 * @returns {User} 200 - User object
	 * @returns {Error} 400 - Bad request
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.put("/users/:id", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.updateUser(request, reply),
	});
	/**
	 * @name deleteUser
	 * @description Delete user
	 * @route DELETE /users/{id}
	 * @group Users - Operations about users
	 * @param {string} id - user id
	 * @returns {User} 200 - User object
	 * @returns {Error} 400 - Bad request
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.delete("/users/:id", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.deleteUser(request, reply),
	});
	/**
	 * @name uploadAvatar
	 * @description Upload avatar
	 * @route POST /users/{id}/avatar
	 * @group Users - Operations about users
	 * @param {string} id - user id
	 * @param {File} file - avatar file
	 * @returns {User} 200 - User object
	 * @returns {Error} 400 - Bad request
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/users/avatar", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.uploadAvatar(request, reply),
	});

	//Authentication routes
	/**
	 * @name login
	 * @description Login user
	 * @route POST /login
	 * @group Auth - Authentication operations about users
	 * @param {User} user.body - user object
	 * @returns {User} 200 - User object
	 * @returns {Error} 400 - Bad request
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/login", {
		handler: async (request, reply) =>
			await usersController.login(request, reply),
	});
	/**
	 * @name register
	 * @description Register user
	 * @route POST /register
	 * @group Auth - Authentication operations about users
	 * @param {User} user.body - user object
	 * @returns {User} 200 - User object
	 * @returns {Error} 400 - Bad request
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/register", {
		schema: {
			body: bodyUserSchema,
		},
		handler: async (request, reply) =>
			await usersController.register(request, reply),
	});
	/**
	 * @name registerUsername
	 * @description Register username
	 * @route POST /register/username
	 * @group Auth - Authentication operations about users
	 * @param {User} user.body - user object
	 * @returns {User} 200 - User object
	 * @returns {Error} 400 - Bad request
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/register/username", {
		handler: async (request, reply) =>
			await usersController.registerUsername(request, reply),
	});
	/**
	 * @name logout
	 * @description Logout user
	 * @route POST /logout
	 * @group Auth - Authentication operations about users
	 * @param {User} user.body - user object
	 * @returns {User} 200 - User object
	 * @returns {Error} 400 - Bad request
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/logout", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.logout(request, reply),
	});

	//Social routes
	/**
	 * @name getUserFriends
	 * @description Get user friends
	 * @route GET /users/{id}/friends
	 * @group Social - Social operations about users
	 * @param {string} id - user id
	 * @returns {Array.<User>} 200 - An array of users
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/users/:id/friends", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getUserFriends(request, reply),
	});
	/**
	 * @name getFriendsRequests
	 * @description Get friends requests
	 * @route GET /users/friends-requests
	 * @group Social - Social operations about users
	 * @returns {Array.<User>} 200 - An array of users
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/users/friends-requests", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getFriendsRequests(request, reply),
	});
	/**
	 * @name addFriend
	 * @description Add friend
	 * @route POST /users/{id}/friends
	 * @group Social - Social operations about users
	 * @param {string} id - user id
	 * @param {User} user.body - user object
	 * @returns {User} 200 - User object
	 * @returns {Error} 400 - Bad request
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/users/:id/friends", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.addFriend(request, reply),
	});

	/**
	 * @name acceptFriend
	 * @description Accept friend request
	 * @route POST /users/{id}/accept-friend
	 * @group Social - Social operations about users
	 * @param {string} id - user id
	 * @param {User} user.body - user object
	 * @returns {User} 200 - User object
	 * @returns {Error} 400 - Bad request
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/users/:id/accept-friend", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.acceptFriend(request, reply),
	});
	/**
	 * @name deleteFriend
	 * @description Delete friend
	 * @route DELETE /users/{id}/friends/{friendId}
	 * @group Social - Social operations about users
	 * @param {string} id - user id
	 * @param {string} friendId - friend id
	 * @param {User} user.body - user object
	 * @returns {User} 200 - User object
	 * @returns {Error} 400 - Bad request
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.delete("/users/friends/:friendId", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.deleteFriend(request, reply),
	});
	/**
	 * @name blockUser
	 * @description Block user
	 * @route POST /users/{id}/block
	 * @group Social - Social operations about users
	 * @param {string} id - user id
	 * @returns {User} 200 - User object
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/users/:id/block", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.blockUser(request, reply),
	});
	/**
	 * @name unblockUser
	 * @description Unblock user
	 * @route DELETE /users/{id}/block
	 * @group Social - Social operations about users
	 * @param {string} id - user id
	 * @returns {User} 200 - User object
	 * @returns {Error} 400 - Bad request
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.delete("/users/:id/block", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.unblockUser(request, reply),
	});
	/**
	 * @name getBlockedUsers
	 * @description Get blocked users
	 * @route GET /users/{id}/blocked
	 * @group Social - Social operations about users
	 * @param {string} id - user id
	 * @returns {Array.<User>} 200 - An array of users
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/users/blocked", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getBlockedUsers(request, reply),
	});

	// Stats routes
	/**
	 * @name getUserMatches
	 * @description Get user matches
	 * @route GET /users/{id}/matches
	 * @group Matches - matches operations about users
	 * @param {string} id - user id
	 * @returns {User} 200 - User object
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/users/:id/matches", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getUserMatches(request, reply),
	});
	/**
	 * @name getUserStats
	 * @description Get user stats
	 * @route GET /users/{id}/stats
	 * @group Stats - Stats operations about users
	 * @param {string} id - user id
	 * @returns {User} 200 - User object
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/users/:id/stats", {
		schema: {
			params: paramsJsonSchema,
		},
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getUserStats(request, reply),
	});

	//Presence/matchmaking routes
	/**
	 * @name startUserStatus
	 * @description Start user status
	 * @route POST /users/session/start
	 * @group Presence - Presence operations about users
	 * @returns {User} 200 - User object
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/users/session/start", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.startUserStatus(request, reply),
	});
	/**
	 *  @name stopUserStatus
	 * @description Stop user status
	 * @route POST /users/session/stop
	 * @group Presence - Presence operations about users
	 * @returns {User} 200 - User object
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/users/session/stop", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.stopUserStatus(request, reply),
	});
	/**
	 * @name getTotalHoursPlayed
	 * @description Get total hours played by user on request
	 * @route GET /users/status/totalhours
	 * @group Presence - Presence operations about users
	 * @returns {Object} 200 - An object containing total hours played
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/users/status/totalhours", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getTotalHoursPlayed(request, reply),
	});
	/**
	 * @name getOnlineUsers
	 * @description Get online users
	 * @route GET /users/online
	 * @group Presence - Presence operations about users
	 * @returns {Array.<User>} 200 - An array of users
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/users/online", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getOnlineUsers(request, reply),
	});
	/**
	 * @name joinMatchmaking
	 * @description Join matchmaking
	 * @route POST /users/matchmaking/join
	 * @group Presence - Presence operations about users
	 * @returns {User} 200 - User object
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/matchmaking/join", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.joinMatchmaking(request, reply),
	});
	/**
	 * @name leaveMatchmaking
	 * @description Leave matchmaking
	 * @route POST /users/matchmaking/leave
	 * @group Presence - Presence operations about users
	 * @returns {User} 200 - User object
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.post("/matchmaking/leave", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.leaveMatchmaking(request, reply),
	});
	/**
	 * @name getMatchmakingStatus
	 * @description Get matchmaking status
	 * @route GET /users/matchmaking/status
	 * @group Presence - Presence operations about users
	 * @returns {Object} 200 - Matchmaking status object
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/users/matchmaking/status", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getMatchmakingStatus(request, reply, request.lang),
	});
}
