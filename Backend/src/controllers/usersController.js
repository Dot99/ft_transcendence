import fastify from "fastify";
import { UserNotFoundError } from "../errors/userNotFoundError.js";
import * as userService from "../services/usersServices.js";
import { messages } from "../locales/messages.js";

/**
 * @description Controller to get all users
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const getAllUsers = async (request, reply) => {
	try {
		const result = await userService.getAllUsers(request.lang);
		if (!result.success) {
			throw new UserNotFoundError();
		}
		reply.send({
			success: true,
			users: result.users,
		});
	} catch (err) {
		reply
			.code(500)
			.send({ success: false, message: "Internal Server error", error: err });
	}
};

/**
 * @description Controller to get a user by ID
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const getUserById = async (request, reply) => {
	try {
		const id = request.params.id;
		const result = await userService.getUserById(id, request.lang);
		if (!result.success) {
			throw new UserNotFoundError();
		}
		reply.send({
			success: true,
			user: result.user,
		});
	} catch (err) {
		reply.code(500).send({
			success: false,
			message: "Internal Server Error",
			error: err.message,
		});
	}
};

/**
 * @description Controller to get a user by username
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const getUserByUsername = async (request, reply) => {
	try {
		const username = request.params.username;
		const result = await userService.getUserByUsername(username, request.lang);
		if (!result.success) {
			return reply.code(404).send({
				success: false,
				error: "User not found",
			});
		}
		reply.send({
			success: true,
			user: result.user,
		});
	} catch (err) {
		console.error("Internal Server Error", err);
		if (err.statusCode === 404 || err.code === 'USER_NOT_FOUND') {
			reply.code(404).send({
				success: false,
				error: "User not found",
			});
		} else {
			reply.code(500).send({
				success: false,
				error: err.message,
			});
		}
	}
};

/**
 * @description Controller to create a new user
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const createUser = async (request, reply) => {
	try {
		const { username, password, country } = request.body;
		const result = await userService.createUser(
			username,
			password,
			country,
			request.lang
		);

		if (!result.success) {
			return reply.code(400).send({ message: result.message });
		}
		reply.code(201).send({ success: true, userId: result.userId });
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to update a user by ID
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const updateUser = async (request, reply) => {
	try {
		const id = request.params.id;
		const usernameChecker = await userService.getUserByUsername(
			request.body.username,
			request.lang
		);
		if (usernameChecker.success && usernameChecker.user.id !== id) {
			return reply.code(400).send({
				success: false,
				message: messages.userExists[request.lang],
			});
		}
		const result = await userService.updateUserById(
			id,
			request.body,
			request.lang
		);
		if (!result.success) {
			throw new UserNotFoundError();
		}
		reply.code(200).send({ success: true });
	} catch (err) {
		console.error("Internal Server Error:", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to delete a user by ID
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const deleteUser = async (request, reply) => {
	try {
		const id = request.params.id;
		const result = await userService.deleteUserById(id, request.lang);
		if (!result.success) {
			throw new UserNotFoundError();
		}
		reply.code(200).send({ sucess: true });
	} catch (err) {
		console.error("Internal Server Error:", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to upload an avatar for the current user
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const uploadAvatar = async (request, reply) => {
	try {
		const user = request.user;
		if (!user) {
			throw new UserNotFoundError();
		}
		const { avatar } = request.body;
		if (!avatar) {
			return reply
				.code(400)
				.send({ success: false, message: messages.noAvatar[request.lang] });
		}
		const result = await userService.uploadAvatar(
			user.id,
			avatar,
			request.lang
		);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply.code(200).send({ success: true });
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to log in a user
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const login = async (request, reply) => {
	try {
		const { username, password } = request.body;
		if (!username || !password) {
			return reply.code(400).send({
				success: false,
				message: messages.missingFields[request.lang],
			});
		}
		const result = await userService.login(
			username,
			password,
			request.server,
			request.lang
		);
		if (!result.success) {
			return reply.code(401).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			token: result.token,
		});
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to register a new user
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const register = async (request, reply) => {
	try {
		const { username, password, country } = request.body;
		if (!username || !password || !country) {
			return reply.code(400).send({
				success: false,
				message: messages.missingFields[request.lang],
			});
		}
		const result = await userService.register(
			username,
			password,
			country,
			request.server,
			request.lang
		);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply.code(201).send({
			success: true,
			userId: result.userId,
			token: result.token,
		});
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to register a username for a user
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const registerUsername = async (request, reply) => {
	try {
		const { token, username } = request.body;
		if (!username || !token) {
			return reply.code(400).send({
				success: false,
				message: messages.missingFields[request.lang],
			});
		}
		let decoded;
		try {
			decoded = request.server.jwt.verify(token);
		} catch (err) {
			return reply
				.code(401)
				.send({ success: false, message: messages.invalidToken[request.lang] });
		}
		const userId = decoded.id;
		if (!username || !userId) {
			return reply.code(400).send({
				success: false,
				message: messages.missingFields[request.lang],
			});
		}
		const result = await userService.registerUsername(
			userId,
			username,
			request.server,
			request.lang
		);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			userId: result.userId,
		});
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to log out a user
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const logout = async (request, reply) => {
	try {
		const user = request.user;
		if (!user) {
			throw new UserNotFoundError();
		}
		const result = await userService.logout(user.id, request.lang);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply.code(200).send({ success: true });
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to get the current user's friends
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const getUserFriends = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const result = await userService.getUserFriends(user.id, request.lang);
		if (!result.success) {
			return reply.code(404).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			friends: result.friends,
		});
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to get friend requests for the current user
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const getFriendsRequests = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const result = await userService.getUserFriendRequests(
			user.id,
			request.lang
		);
		reply.code(200).send({
			success: true,
			friendsRequests: result.friendsRequests || [],
		});
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to add a friend
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const addFriend = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const friendId = request.params.id;
		if (!friendId) {
			return reply.code(400).send({
				success: false,
				message: messages.missingFields[request.lang],
			});
		}
		const result = await userService.addFriend(user.id, friendId, request.lang);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply.code(200).send({ success: true });
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to accept a friend request
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const acceptFriend = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const friendId = request.params.id;
		if (!friendId) {
			return reply.code(400).send({
				success: false,
				message: messages.missingFields[request.lang],
			});
		}
		const result = await userService.acceptFriendRequest(
			user.id,
			friendId,
			request.lang
		);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply.code(200).send({ success: true });
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to delete a friend
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const deleteFriend = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const friendId = request.params.friendId;
		if (!friendId) {
			return reply.code(400).send({
				success: false,
				message: messages.missingFields[request.lang],
			});
		}
		const result = await userService.deleteFriend(
			user.id,
			friendId,
			request.lang
		);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply.code(200).send({ success: true });
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to block a user
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const blockUser = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const blockId = request.params.id;
		if (!blockId) {
			return reply
				.code(400)
				.send({ message: messages.missingFields[request.lang] });
		}
		const result = await userService.blockUser(user.id, blockId, request.lang);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply.code(200).send({ success: true });
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to unblock a user
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const unblockUser = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const blockId = request.params.id;
		if (!blockId) {
			return reply.code(400).send({
				success: false,
				message: messages.missingFields[request.lang],
			});
		}
		const result = await userService.unblockUser(
			user.id,
			blockId,
			request.lang
		);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply.code(200).send({ success: true });
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to get blocked users
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const getBlockedUsers = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const result = await userService.getBlockedUsers(user.id, request.lang);
		if (!result.success) {
			return reply.code(404).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			blockedUsers: result.blockedUsers,
		});
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to get user matches
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const getUserMatches = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const result = await userService.getUserMatches(user.id, request.lang);
		if (!result.success) {
			return reply.code(404).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			matches: result.matches,
		});
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to get user stats
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const getUserStats = async (request, reply) => {
	try {
		const id = request.params.id;
		const result = await userService.getUserStats(id, request.lang);
		if (!result.success) {
			return reply.code(404).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			stats: result.stats,
		});
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/** * @description Controller to update user status
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const updateUserStatus = async (request, reply) => {
	try {
		const user = request.user;
		const { status } = request.body;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const result = await userService.updateUserStatus(
			user.id,
			status,
			request.lang
		);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply.code(200).send({ success: true });
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/** * @description Controller to update user status
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const startUserStatus = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const result = await userService.startSession(user.id, request.lang);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply.code(200).send({ success: true });
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/** * @description Controller to stop user status
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 *  @returns {Promise<void>}
 */
const stopUserStatus = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const result = await userService.stopSession(user.id, request.lang);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply.code(200).send({ success: true });
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to get total hours played by the user
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const getTotalHoursPlayed = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const result = await userService.getTotalHours(user.id, request.lang);
		if (!result.success) {
			return reply.code(404).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			totalHoursPlayed: result.hours,
		});
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to get online users
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const getOnlineUsers = async (request, reply) => {
	try {
		const result = await userService.getOnlineUsers(request.lang);
		if (!result.success) {
			return reply.code(404).send({ success: true, message: result.message });
		}
		reply.code(200).send({
			success: true,
			onlineUsers: result.onlineUsers,
		});
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to join matchmaking
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const joinMatchmaking = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const result = await userService.joinMatchmaking(user.id, request.lang);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply
			.code(200)
			.send({ success: true, message: "Joined matchmaking successfully" });
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to leave matchmaking
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 */
const leaveMatchmaking = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError();
		}
		const result = await userService.leaveMatchmaking(user.id, request.lang);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply.code(200).send({ success: true });
	} catch (err) {
		console.error("Internal Server Error", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to get matchmaking status
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 * @throws {UserNotFoundError} - If the user is not found
 */
const getMatchmakingStatus = async (request, reply) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError("User not found");
		}
		const result = await userService.getMatchmakingStatus(user.id, request.lang);
		if (!result.success) {
			return reply.code(404).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			matchmakingStatus: result.matchmakingStatus,
			message: "Matchmaking status retrieved successfully",
		});
	} catch (err) {
		console.error("Handler error:", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

export default {
	getAllUsers,
	getUserById,
	getUserByUsername,
	createUser,
	updateUser,
	deleteUser,
	uploadAvatar,
	login,
	register,
	registerUsername,
	logout,
	getUserFriends,
	getFriendsRequests,
	acceptFriend,
	addFriend,
	deleteFriend,
	blockUser,
	unblockUser,
	getBlockedUsers,
	getUserMatches,
	getUserStats,
	updateUserStatus,
	startUserStatus,
	stopUserStatus,
	getTotalHoursPlayed,
	getOnlineUsers,
	joinMatchmaking,
	leaveMatchmaking,
	getMatchmakingStatus,
};
