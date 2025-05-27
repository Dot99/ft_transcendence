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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getAllUsers(request, reply, request.lang),
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getUserById(request, reply, request.lang),
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getUserByUsername(request, reply, request.lang),
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.createUser(request, reply, request.lang),
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
	fastify.put("/users", {
		schema: {
			params: paramsJsonSchema,
		},
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.updateUser(request, reply, request.lang),
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
	fastify.delete("/users", {
		schema: {
			params: paramsJsonSchema,
		},
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.deleteUser(request, reply, request.lang),
	});
	/**
	 * @name getCurrentUser
	 * @description Get current user
	 * @route GET /users/me
	 * @group Users - Operations about users
	 * @returns {User} 200 - User object
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/users/me", {
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getCurrentUser(request, reply, request.lang),
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.uploadAvatar(request, reply, request.lang),
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
			await usersController.login(request, reply, request.lang),
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
			await usersController.register(request, reply, request.lang),
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.logout(request, reply, request.lang),
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
	fastify.get("/users/friends", {
		schema: {
			params: paramsJsonSchema,
		},
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getUserFriends(request, reply, request.lang),
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.addFriend(request, reply, request.lang),
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.deleteFriend(request, reply, request.lang),
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.blockUser(request, reply, request.lang),
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.unblockUser(request, reply, request.lang),
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
		schema: {
			params: paramsJsonSchema,
		},
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getBlockedUsers(request, reply, request.lang),
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getUserMatches(request, reply, request.lang),
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getUserStats(request, reply, request.lang),
	});

	//Presence/matchmaking routes
	/**
	 * @name getUserStatus
	 * @description Get user status
	 * @route GET /users/{id}/status
	 * @group Presence - Presence operations about users
	 * @param {string} id - user id
	 * @returns {User} 200 - User object
	 * @returns {Error} 401 - Unauthorized
	 * @returns {Error} 404 - User not found
	 * @returns {Error} 500 - Internal server error
	 * @security JWT
	 */
	fastify.get("/users/:id/status", {
		schema: {
			params: paramsJsonSchema,
		},
		// prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getUserStatus(request, reply, request.lang),
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.getOnlineUsers(request, reply, request.lang),
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.joinMatchmaking(request, reply, request.lang),
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
		prehandler: [fastify.authenticate],
		handler: async (request, reply) =>
			await usersController.leaveMatchmaking(request, reply, request.lang),
	});
}
