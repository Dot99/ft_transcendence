import db from "../../db/dataBase.js";
import { messages } from "../locales/messages.js";
import bcrypt from "bcrypt";
import { addToBlacklist } from "../middleware/jwtBlacklist.js";

export function getAllUsers(lang = "en") {
	return new Promise((resolve, reject) => {
		db.all("SELECT * FROM users", [], (err, rows) => {
			if (err) {
				console.error("DB error:", err);
				return reject({ success: false, error: err });
			}
			resolve({ success: true, users: rows });
		});
	});
}

export function getUserById(id, lang = "en") {
	return new Promise((resolve, reject) => {
		db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
			if (err) {
				console.error("DB error:", err);
				return reject(err);
			}

			if (!row) {
				return resolve({
					success: false,
					message: messages[lang].userNotFound,
				});
			}

			resolve({ success: true, user: row });
		});
	});
}

export function getUserByUsername(username, lang = "en") {
	return new Promise((resolve, reject) => {
		db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
			if (err) {
				console.error("DB error:", err);
				return reject(err);
			}

			if (!row) {
				return resolve({
					success: false,
					message: messages[lang].userNotFound,
				});
			}

			resolve({ success: true, user: row });
		});
	});
}

export function createUser(username, password, country, lang = "en") {
	return new Promise((resolve) => {
		if (!username || !password || !country) {
			return resolve({ success: false, message: messages[lang].missingFields });
		}

		const dateJoined = new Date().toISOString();

		const sql = `INSERT INTO users (username, password, country, date_joined) VALUES (?, ?, ?, ?)`;

		db.run(sql, [username, password, country, dateJoined], function (err) {
			if (err) {
				console.error("Error creating user:", err);
				return resolve({
					success: false,
					message: messages[lang].failCreateUser,
				});
			}

			console.log("User created with ID:", this.lastID);
			resolve({ success: true, userId: this.lastID });
		});
	});
}

export function updateUserById(id, data, lang = "en") {
	return new Promise((resolve, reject) => {
		if (!data || Object.keys(data).length === 0) {
			return resolve({
				success: false,
				message: messages[lang].noFieldsToUpdate,
			});
		}

		const fields = Object.keys(data).map((key) => `${key} = ?`);
		const values = Object.values(data);
		const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

		db.run(sql, [...values, id], function (err) {
			if (err) {
				console.error("DB error:", err);
				return reject({ success: false, error: err });
			}

			if (this.changes === 0) {
				return resolve({
					success: false,
					message: messages[lang].userNotFound,
				});
			}

			resolve({ success: true });
		});
	});
}

export function deleteUserById(id, lang = "en") {
	return new Promise((resolve, reject) => {
		db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
			if (err) {
				console.error("DB error:", err);
				return reject(err);
			}
			if (this.changes === 0) {
				return resolve({
					success: false,
					message: messages[lang].userNotFound,
				});
			}
			resolve({ success: true });
		});
	});
}

export function getCurrentUser(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.get("SELECT * FROM users WHERE id = ?", [userId], (err, row) => {
			if (err) {
				console.error("DB error:", err);
				return reject(err);
			}

			if (!row) {
				return resolve({
					success: false,
					message: messages[lang].userNotFound,
				});
			}

			resolve({ success: true, user: row });
		});
	});
}

export function uploadAvatar(userId, avatar, lang = "en") {
	return new Promise((resolve, reject) => {
		if (!avatar) {
			return resolve({ success: false, message: messages[lang].noAvatar });
		}
		db.run(
			"UPDATE users SET avatar = ? WHERE id = ?",
			[avatar, userId],
			function (err) {
				if (err) {
					console.error("DB error:", err);
					return reject(err);
				}
				if (this.changes === 0) {
					return resolve({
						success: false,
						message: messages[lang].userNotFound,
					});
				}
				resolve({ success: true });
			}
		);
	});
}

export async function login(username, password, fastify, lang = "en") {
	return new Promise(async (resolve) => {
		if (!username || !password) {
			return resolve({ success: false, message: messages[lang].missingFields });
		}
		const user = await getUserByUsername(username, lang);
		if (!user || user.user.is_oauth_only) {
			return resolve({ success: false, message: messages[lang].invalidLogin });
		}

		// Verify password with bcrypt

		const validPassword = await bcrypt.compare(password, user.user.password);
		if (!validPassword) {
			return resolve({ success: false, message: messages[lang].invalidLogin });
		}

		// If user has 2FA enabled, require second step
		if (user.user.twofa_enabled) {
			return resolve({
				success: true,
				twofa: true,
				userId: user.user.id,
				message: messages[lang].twofaRequired,
			});
		}

		// Create JWT
		const token = fastify.jwt.sign({
			id: user.user.id,
			username: user.user.username,
			email: user.user.email,
		});

		resolve({ success: true, user, token });
	});
}

export function register(username, password, country, fastify, lang = "en") {
	return new Promise(async (resolve) => {
		if (!username || !password || !country) {
			return resolve({ success: false, message: messages[lang].missingFields });
		}
		const existingUser = await getUserByUsername(username, lang);
		if (existingUser && existingUser.success) {
			return resolve({ success: false, message: messages[lang].userExists });
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		const dateJoined = new Date().toISOString();

		const sql = `INSERT INTO users (username, password, country, date_joined) VALUES (?, ?, ?, ?)`;
		db.run(
			sql,
			[username, hashedPassword, country, dateJoined],
			function (err) {
				if (err) {
					console.error("Error creating user:", err);
					return resolve({
						success: false,
						message: messages[lang].failCreateUser,
					});
				}

				const userId = this.lastID;
				const token = fastify.jwt.sign({ id: userId, username });

				resolve({ success: true, userId, token });
			}
		);
	});
}

export function logout(token, fastify, lang = "en") {
	return new Promise((resolve) => {
		if (!token) {
			return resolve({ success: false, message: messages[lang].noToken });
		}

		const decoded = fastify.jwt.verify(token);
		if (!decoded) {
			return resolve({ success: false, message: messages[lang].invalidToken });
		}
		addToBlacklist(token);
		resolve({ success: true, message: messages[lang].logoutSuccess });
	});
}

export function getUserFriends(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		if (!userId) {
			return resolve({ success: false, message: messages[lang].noUserId });
		}

		const sql = `
			SELECT * FROM users 
			WHERE id IN (
				SELECT friend_id FROM friends 
				WHERE user_id = ? AND status = 'accepted'
			)
		`;

		db.all(sql, [userId], (err, rows) => {
			if (err) {
				console.error("DB error:", err);
				return reject({ success: false, error: err });
			}

			if (!rows || rows.length === 0) {
				return resolve({ success: false, message: messages[lang].noFriends });
			}

			resolve({ success: true, friends: rows });
		});
	});
}

export function addFriend(userId, friendId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.run(
			"INSERT INTO friends (user_id, friend_id) VALUES (?, ?)",
			[userId, friendId],
			function (err) {
				if (err) {
					console.error("DB error:", err);
					return reject(err);
				}
				if (this.changes === 0) {
					return resolve({
						success: false,
						message: messages[lang].failAddFriend,
					});
				}
				resolve({ success: true });
			}
		);
	});
}

export function deleteFriend(userId, friendId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.run(
			"DELETE FROM friends WHERE user_id = ? AND friend_id = ?",
			[userId, friendId],
			function (err) {
				if (err) {
					console.error("DB error:", err);
					return reject(err);
				}
				if (this.changes === 0) {
					return resolve({
						success: false,
						message: messages[lang].failRemoveFriend,
					});
				}
				resolve({ success: true });
			}
		);
	});
}

export function blockUser(userId, blockId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.run(
			"INSERT INTO blocked_users (user_id, blocked_user_id) VALUES (?, ?)",
			[userId, blockId],
			function (err) {
				if (err) {
					console.error("DB error:", err);
					return reject(err);
				}
				if (this.changes === 0) {
					return resolve({
						success: false,
						message: messages[lang].failBlockUser,
					});
				}
				resolve({ success: true });
			}
		);
	});
}

export function unblockUser(userId, blockId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.run(
			"DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?",
			[userId, blockId],
			function (err) {
				if (err) {
					console.error("DB error:", err);
					return reject(err);
				}
				if (this.changes === 0) {
					return resolve({
						success: false,
						message: messages[lang].failUnblockUser,
					});
				}
				resolve({ success: true });
			}
		);
	});
}

export function getBlockedUsers(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.all(
			"SELECT * FROM users WHERE id IN (SELECT blocked_user_id FROM blocked_users WHERE user_id = ?)",
			[userId],
			(err, rows) => {
				if (err) {
					console.error("DB error:", err);
					return reject(err);
				}
				if (!rows || rows.length === 0) {
					return resolve({
						success: false,
						message: messages[lang].failFindBlockUser,
					});
				}
				resolve({ success: true, blockedUsers: rows });
			}
		);
	});
}

export function getUserMatches(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.all("SELECT * FROM matches WHERE user_id = ?", [userId], (err, rows) => {
			if (err) {
				console.error("DB error:", err);
				return reject(err);
			}
			if (!rows || rows.length === 0) {
				return resolve({ success: false, message: messages[lang].noMatches });
			}
			resolve({ success: true, matches: rows });
		});
	});
}

export function getUserStats(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.get("SELECT * FROM stats WHERE user_id = ?", [userId], (err, row) => {
			if (err) {
				console.error("DB error:", err);
				return reject(err);
			}
			if (!row) {
				return resolve({ success: false, message: messages[lang].noStats });
			}
			resolve({ success: true, stats: row });
		});
	});
}

export function getUserStatus(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.get("SELECT * FROM status WHERE user_id = ?", [userId], (err, row) => {
			if (err) {
				console.error("DB error:", err);
				return reject(err);
			}
			if (!row) {
				return resolve({
					success: false,
					message: messages[lang].noOnlineUsers,
				});
			}
			resolve({ success: true, status: row });
		});
	});
}

export function getOnlineUsers(lang = "en") {
	return new Promise((resolve, reject) => {
		db.all("SELECT * FROM status", [], (err, rows) => {
			if (err) {
				console.error("DB error:", err);
				return reject(err);
			}
			if (!rows || rows.length === 0) {
				return resolve({
					success: false,
					message: messages[lang].noOnlineUsers,
				});
			}
			resolve({ success: true, onlineUsers: rows });
		});
	});
}

export function joinMatchmaking(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.run(
			"INSERT INTO matchmaking (user_id) VALUES (?)",
			[userId],
			function (err) {
				if (err) {
					console.error("DB error:", err);
					return reject(err);
				}
				if (this.changes === 0) {
					return resolve({
						success: false,
						message: messages[lang].failJoinMM,
					});
				}
				resolve({ success: true });
			}
		);
	});
}

export function leaveMatchmaking(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.run(
			"DELETE FROM matchmaking WHERE user_id = ?",
			[userId],
			function (err) {
				if (err) {
					console.error("DB error:", err);
					return reject(err);
				}
				if (this.changes === 0) {
					return resolve({
						success: false,
						message: messages[lang].failLeaveMM,
					});
				}
				resolve({ success: true });
			}
		);
	});
}
