import fastify from "fastify";
import { UserNotFoundError } from "../errors/userNotFoundError.js";
import * as userService from "../services/usersServices.js";

/**
 * @description Controller to get all users
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 * @throws {UserNotFoundError} - If no users are found
 */
const getAllUsers = async (request, reply, lang) => {
	try {
		const result = await userService.getAllUsers(request.lang);
		if (!result.success) {
			throw new UserNotFoundError();
		}

		reply.send({
			success: true,
			message: "Users retrieved successfully",
			users: result.users,
		});
	} catch (err) {
		reply
			.code(500)
			.send({ success: false, message: "Internal error", error: err });
	}
};

/**
 * @description Controller to get a user by ID
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 * @throws {UserNotFoundError} - If the user is not found
 */
const getUserById = async (request, reply, lang) => {
	try {
		const id = request.params.id;
		const result = await userService.getUserById(id, request.lang);

		if (!result.success) {
			return reply.code(404).send(result);
		}

		reply.send({
			success: true,
			user: result.user,
		});
	} catch (err) {
		reply.code(500).send({ success: false, error: err.message });
	}
};

/**
 * @description Controller to get a user by username
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 * @throws {UserNotFoundError} - If the user is not found
 */
const getUserByUsername = async (request, reply, lang) => {
	try {
		const username = request.params.username;
		const result = await userService.getUserByUsername(username, request.lang);

		if (!result.success) {
			return reply.code(404).send({ success: false, message: result.message });
		}

		reply.send({
			success: true,
			user: result.user,
		});
	} catch (err) {
		console.error("Handler error:", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to create a new user
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 * @throws {UserNotFoundError} - If the user is not found
 */
const createUser = async (request, reply, lang) => {
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
		reply
			.code(201)
			.send({ success: true, message: "User created", userId: result.userId });
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const updateUser = async (request, reply, lang) => {
	try {
		const id = request.params.id;
		const result = await userService.updateUserById(
			id,
			request.body,
			request.lang
		);
		if (!result.success) {
			throw new UserNotFoundError(result.message);
		}
		reply
			.code(200)
			.send({ success: true, message: "User updated successfully" });
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const deleteUser = async (request, reply, lang) => {
	try {
		const id = request.params.id;
		const result = await userService.deleteUserById(id, request.lang);
		if (!result.success) {
			throw new UserNotFoundError(result.message);
		}
		reply
			.code(200)
			.send({ sucess: true, message: "User deleted successfully" });
	} catch (err) {
		console.error("Handler error:", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to get the current user
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 * @throws {UserNotFoundError} - If the user is not found
 */
const getCurrentUser = async (request, reply, lang) => {
	try {
		const userId = request.user?.id;
		if (!userId) {
			throw new UserNotFoundError("User not found");
		}
		const result = await userService.getUserById(userId, request.lang);
		if (!result.success) {
			return reply.code(404).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			userId: result.user,
			message: "User retrieved successfully",
		});
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const uploadAvatar = async (request, reply, lang) => {
	try {
		const user = request.user;
		if (!user) {
			throw new UserNotFoundError("User not found");
		}
		const { avatar } = request.body;
		if (!avatar) {
			return reply
				.code(400)
				.send({ success: false, message: "No avatar provided" });
		}
		const result = await userService.uploadAvatar(
			user.id,
			avatar,
			request.lang
		);
		if (!result.success) {
			return reply
				.code(result.message === "User not found" ? 404 : 400)
				.send({ success: false, message: result.message });
		}
		reply
			.code(200)
			.send({ success: true, message: "Avatar uploaded successfully" });
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const login = async (request, reply, lang) => {
	try {
		const { username, password } = request.body;
		if (!username || !password) {
			return reply
				.code(400)
				.send({ success: false, message: "Username and password required" });
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
			message: "User logged in successfully",
			token: result.token,
		});
	} catch (err) {
		console.error("Handler error:", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

const register = async (request, reply, lang) => {
	try {
		const { username, password, country } = request.body;
		if (!username || !password || !country) {
			return reply.code(400).send({
				success: false,
				message: "Username, password, and country required",
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
			message: "User registered successfully",
			userId: result.userId,
			token: result.token,
		});
	} catch (err) {
		console.error("Handler error:", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

const registerUsername = async (request, reply, lang) => {
	try {
		const { token, username, lang } = request.body;
		if (!username || !token) {
			return reply
				.code(400)
				.send({ success: false, message: "Username required" });
		}
		let decoded;
		try {
			decoded = request.server.jwt.verify(token);
		} catch (err) {
			return reply.code(401).send({ success: false, message: "Invalid token" });
		}
		const userId = decoded.id;
		if (!username || !userId) {
			return reply.code(400).send({
				success: false,
				message: "Username and valid token required",
			});
		}
		const result = await userService.registerUsername(
			userId,
			username,
			request.server,
			lang || "en"
		);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			message: "Username registered successfully",
			userId: result.userId,
		});
	} catch (err) {
		console.error("Handler error:", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

//TODO: CHECK LATER IF USING SESSION
/**
 * @description Controller to log out a user
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 * @throws {UserNotFoundError} - If the user is not found
 */
const logout = async (request, reply, lang) => {
	try {
		const user = request.user;
		if (!user) {
			throw new UserNotFoundError("User not found");
		}
		const result = await userService.logout(user.id, request.lang);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply
			.code(200)
			.send({ success: true, message: "User logged out successfully" });
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const getUserFriends = async (request, reply, lang) => {
	try {
		request.user = { id: 1 };
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError("User not found");
		}
		const result = await userService.getUserFriends(user.id, request.lang);
		if (!result.success) {
			return reply.code(404).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			friends: result.friends,
			message: "Friends retrieved successfully",
		});
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const addFriend = async (request, reply, lang) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError("User not found");
		}
		const friendId = request.params.id;
		if (!friendId) {
			return reply
				.code(400)
				.send({ success: false, message: "No friend ID provided" });
		}
		const result = await userService.addFriend(user.id, friendId, request.lang);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply
			.code(200)
			.send({ success: true, message: "Friend added successfully" });
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const deleteFriend = async (request, reply, lang) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError("User not found");
		}
		const friendId = request.params.friendId;
		if (!friendId) {
			return reply
				.code(400)
				.send({ success: false, message: "No friend ID provided" });
		}
		const result = await userService.deleteFriend(
			user.id,
			friendId,
			request.lang
		);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply
			.code(200)
			.send({ success: true, message: "Friend deleted successfully" });
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const blockUser = async (request, reply, lang) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError("User not found");
		}
		const blockId = request.params.id;
		if (!blockId) {
			return reply.code(400).send({ message: "No block ID provided" });
		}
		const result = await userService.blockUser(user.id, blockId, request.lang);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply
			.code(200)
			.send({ success: true, message: "User blocked successfully" });
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const unblockUser = async (request, reply, lang) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError("User not found");
		}
		const blockId = request.params.id;
		if (!blockId) {
			return reply
				.code(400)
				.send({ success: false, message: "No block ID provided" });
		}
		const result = await userService.unblockUser(
			user.id,
			blockId,
			request.lang
		);

		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply
			.code(200)
			.send({ success: true, message: "User unblocked successfully" });
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const getBlockedUsers = async (request, reply, lang) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError("User not found");
		}
		const result = await userService.getBlockedUsers(user.id, request.lang);
		if (!result.success) {
			return reply.code(404).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			blockedUsers: result.blockedUsers,
			message: "Blocked users retrieved successfully",
		});
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const getUserMatches = async (request, reply, lang) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError("User not found");
		}
		const result = await userService.getUserMatches(user.id, request.lang);
		if (!result.success) {
			return reply.code(404).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			matches: result.matches,
			message: "Matches retrieved successfully",
		});
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const getUserStats = async (request, reply, lang) => {
	try {
		const id = request.params.id;
		const result = await userService.getUserStats(id, request.lang);
		if (!result.success) {
			return reply.code(404).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			stats: result.stats,
			message: "Stats retrieved successfully",
		});
	} catch (err) {
		console.error("Handler error:", err);
		reply.code(500).send({
			success: false,
			error: err.message,
		});
	}
};

/**
 * @description Controller to get user status
 * @param {Object} request - The request object
 * @param {Object} reply - The reply object
 * @returns {Promise<void>}
 * @throws {UserNotFoundError} - If the user is not found
 */
const getUserStatus = async (request, reply, lang) => {
	try {
		const id = request.params.id;
		const result = await userService.getUserStatus(id, request.lang);

		if (!result.success) {
			return reply.code(404).send({ success: false, message: result.message });
		}
		reply.code(200).send({
			success: true,
			status: result.status,
			message: "Status retrieved successfully",
		});
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const getOnlineUsers = async (request, reply, lang) => {
	try {
		const result = await userService.getOnlineUsers(request.lang);
		if (!result.success) {
			return reply.code(404).send({ success: true, message: result.message });
		}
		reply.code(200).send({
			success: true,
			onlineUsers: result.onlineUsers,
			messages: "Online users retrieved successfully",
		});
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const joinMatchmaking = async (request, reply, lang) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError("User not found");
		}
		const result = await userService.joinMatchmaking(user.id, request.lang);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply
			.code(200)
			.send({ success: true, message: "Joined matchmaking successfully" });
	} catch (err) {
		console.error("Handler error:", err);
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
 * @throws {UserNotFoundError} - If the user is not found
 */
const leaveMatchmaking = async (request, reply, lang) => {
	try {
		const user = request.user;
		if (!user?.id) {
			throw new UserNotFoundError("User not found");
		}
		const result = await userService.leaveMatchmaking(user.id, request.lang);
		if (!result.success) {
			return reply.code(400).send({ success: false, message: result.message });
		}
		reply
			.code(200)
			.send({ success: true, message: "Left matchmaking successfully" });
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
	getCurrentUser,
	uploadAvatar,
	login,
	register,
	registerUsername,
	logout,
	getUserFriends,
	addFriend,
	deleteFriend,
	blockUser,
	unblockUser,
	getBlockedUsers,
	getUserMatches,
	getUserStats,
	getUserStatus,
	getOnlineUsers,
	joinMatchmaking,
	leaveMatchmaking,
};
