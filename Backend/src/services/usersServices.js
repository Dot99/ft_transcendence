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
				return resolve({
					success: false,
					message: messages[lang].failCreateUser,
				});
			}
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
				});
			}
			resolve({ success: true });
		});
	});
}

export function uploadAvatar(userId, avatar, lang = "en") {
	return new Promise((resolve, reject) => {
		db.run(
			"UPDATE users SET avatar = ? WHERE id = ?",
			[avatar, userId],
			function (err) {
				if (err) {
					return reject(err);
				}
				if (this.changes === 0) {
					return resolve({
						success: false,
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
		if (!user.success) {
			return resolve({ success: false, message: messages[lang].invalidLogin });
		}
		// Verify password with bcrypt
		const validPassword = await bcrypt.compare(password, user.user.password);
		if (!validPassword) {
			return resolve({ success: false, message: messages[lang].invalidLogin });
		}
		// Create JWT
		const token = fastify.jwt.sign({
			id: user.user.id,
			username: user.user.username,
			twofa_enabled: !!user.user.twofa_enabled,
			twofa_verified: user.user.twofa_enabled ? false : true,
			google_flag: false,
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
		const jwt = fastify.jwt;
		const sql = `INSERT INTO users (username, password, country, date_joined) VALUES (?, ?, ?, ?)`;
		db.run(
			sql,
			[username, hashedPassword, country, dateJoined],
			function (err) {
				if (err) {
					return resolve({
						success: false,
						message: messages[lang].failCreateUser,
					});
				}

				const userId = this.lastID;
				const token = fastify.jwt.sign({
					id: userId,
					username: username,
					twofa_enabled: false,
					twofa_verified: false,
					google_flag: false,
				});

				resolve({ success: true, userId: userId, token: token });
			}
		);
	});
}

export function registerUsername(userId, username, fastify, lang = "en") {
	return new Promise(async (resolve) => {
		if (!userId || !username) {
			return resolve({ success: false, message: messages[lang].missingFields });
		}
		const existingUser = await getUserByUsername(username, lang);
		if (!existingUser) {
			return resolve({ success: false, message: messages[lang].userExists });
		}
		const sql = `UPDATE users SET username = ? WHERE id = ?`;
		db.run(sql, [username, userId], function (err) {
			if (err) {
				return resolve({
					success: false,
					message: messages[lang].failUpdateUsername,
				});
			}
			if (this.changes === 0) {
				return resolve({
					success: false,
					message: messages[lang].userNotFound,
				});
			}
			const token = fastify.jwt.sign({
				id: userId,
				username: username,
				twofa_verified: false,
				google_flag: true,
			});
			resolve({ success: true, userId: userId, token: token });
		});
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
		db.all(
			`SELECT id, username FROM users WHERE id IN (
				SELECT friend_id FROM friends WHERE user_id = ? AND status = 'accepted'
				UNION
				SELECT user_id FROM friends WHERE friend_id = ? AND status = 'accepted'
			)`,
			[userId, userId],
			(err, rows) => {
				if (err) {
					return reject({ success: false, error: err });
				}
				if (!rows || rows.length === 0) {
					return resolve({ success: false, message: messages[lang].noFriends });
				}
				resolve({ success: true, friends: rows });
			}
		);
	});
}

export function getUserFriendRequests(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		if (!userId) {
			return resolve({ success: false, message: messages[lang].noUserId });
		}
		db.all(
			`SELECT users.id, users.username, friends.status
			FROM users
			JOIN friends ON users.id = friends.user_id
			WHERE friends.friend_id = ? AND friends.status = 'pending'
			AND users.id NOT IN (
				SELECT blocked_user_id FROM blocked_users WHERE user_id = ?
			)
			AND users.id NOT IN (
				SELECT user_id FROM blocked_users WHERE blocked_user_id = ?
			)`,
			[userId, userId, userId],
			(err, rows) => {
				if (err) {
					return reject({ success: false, error: err });
				}
				resolve({ success: true, friendsRequests: rows || [] });
			}
		);
	});
}

export function addFriend(userId, friendId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.run(
			"INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)",
			[userId, friendId, "pending"],
			function (err) {
				if (err) {
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

export function acceptFriendRequest(userId, friendId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.serialize(() => {
			db.run(
				"UPDATE friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ? AND status = 'pending'",
				[friendId, userId],
				function (err) {
					if (err) return reject(err);
					db.run(
						"UPDATE friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ? AND status = 'pending'",
						[userId, friendId],
						function (err2) {
							if (err2) return reject(err2);
							resolve({ success: true });
						}
					);
				}
			);
		});
	});
}

export function deleteFriend(userId, friendId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.run(
			"DELETE FROM friends WHERE user_id = ? AND friend_id = ?",
			[userId, friendId],
			function (err) {
				if (err) {
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
		db.all(
			"SELECT * FROM match_history WHERE player1 = ? OR player2 = ?",
			[userId],
			(err, rows) => {
				if (err) {
					return reject(err);
				}
				if (!rows || rows.length === 0) {
					return resolve({ success: false, message: messages[lang].noMatches });
				}
				resolve({ success: true, matches: rows });
			}
		);
	});
}

export function getUserStats(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.get("SELECT * FROM stats WHERE player_id = ?", [userId], (err, row) => {
			if (err) {
				return reject(err);
			}
			if (!row) {
				return resolve({ success: false, message: messages[lang].noStats });
			}
			resolve({ success: true, stats: row });
		});
	});
}

export function startSession(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.get(
			`SELECT id FROM sessions WHERE user_id = ? AND end_time IS NULL`,
			[userId],
			(err, row) => {
				if (err) return reject(err);
				if (row) {
					// Session already open, do not insert a new one
					return resolve({ success: true, sessionId: row.id });
				}
				// No open session, insert new
				db.run(
					`INSERT INTO sessions (user_id, start_time) VALUES (?, CURRENT_TIMESTAMP)`,
					[userId],
					function (err) {
						if (err) return reject(err);
						resolve({ success: true, sessionId: this.lastID });
					}
				);
			}
		);
	});
}

export function endSession(userId) {
	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE sessions SET end_time = CURRENT_TIMESTAMP
	   WHERE user_id = ? AND end_time IS NULL`,
			[userId],
			function (err) {
				if (err) return reject(err);
				resolve({ success: true });
			}
		);
	});
}

export function getTotalHours(userId) {
	return new Promise((resolve, reject) => {
		db.get(
			`SELECT SUM(
		 (JULIANDAY(COALESCE(end_time, CURRENT_TIMESTAMP)) - JULIANDAY(start_time)) * 24
	   ) as hours
	   FROM sessions WHERE user_id = ?`,
			[userId],
			(err, row) => {
				if (err) return reject(err);
				resolve({ success: true, hours: row.hours || 0 });
			}
		);
	});
}

export function updateUserStats(db, userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.get(
			`SELECT COUNT(*) as count FROM match_history WHERE player1 = ? OR player2 = ?`,
			[userId, userId],
			(err, totalMatchesRes) => {
				if (err) return reject(err);
				const totalMatches = totalMatchesRes.count;

				db.get(
					`SELECT COUNT(*) as count FROM match_history WHERE winner = ?`,
					[userId],
					(err, matchesWonRes) => {
						if (err) return reject(err);
						const matchesWon = matchesWonRes.count;
						const matchesLost = totalMatches - matchesWon;

						db.get(
							`SELECT 
								SUM(CASE WHEN player1 = ? THEN player1_score ELSE 0 END) +
								SUM(CASE WHEN player2 = ? THEN player2_score ELSE 0 END) as total_score,
								COUNT(*) as total
							 FROM match_history
							 WHERE player1 = ? OR player2 = ?`,
							[userId, userId, userId, userId],
							(err, scoresRes) => {
								if (err) return reject(err);

								const totalScore = scoresRes.total_score || 0;
								const total = scoresRes.total || 0;
								const avgScore = total > 0 ? totalScore / total : 0;

								const winStreakMax = 0;
								const tournamentsWon = 0;

								db.run(
									`INSERT INTO stats (
										player_id, total_matches, matches_won, matches_lost,
										average_score, win_streak_max, tournaments_won
									) VALUES (?, ?, ?, ?, ?, ?, ?)
									ON CONFLICT(player_id) DO UPDATE SET
										total_matches = excluded.total_matches,
										matches_won = excluded.matches_won,
										matches_lost = excluded.matches_lost,
										average_score = excluded.average_score,
										win_streak_max = excluded.win_streak_max,
										tournaments_won = excluded.tournaments_won
									`,
									[
										userId,
										totalMatches,
										matchesWon,
										matchesLost,
										avgScore,
										winStreakMax,
										tournamentsWon,
									],
									function (err) {
										if (err) {
											return reject(err);
										}
										return resolve({ success: true });
									}
								);
							}
						);
					}
				);
			}
		);
	});
}

export function getOnlineUsers(lang = "en") {
	return new Promise((resolve, reject) => {
		db.all("SELECT * FROM status", [], (err, rows) => {
			if (err) {
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
		
		// Use a database transaction to prevent race conditions
		db.serialize(() => {
			db.run("BEGIN TRANSACTION");
			// First, clean up any existing entries for this user (in case they're re-joining)
			db.run(
				"DELETE FROM matchmaking WHERE user_id = ?",
				[userId],
				(err) => {
					if (err) {
						console.error("DB error cleaning up user matchmaking:", err);
						db.run("ROLLBACK");
						return reject(err);
					}
					// Look for any waiting opponent with atomic update
					db.get(
						"SELECT m.*, u.username FROM matchmaking m JOIN users u ON m.user_id = u.id WHERE m.status = 'waiting' AND m.user_id != ? ORDER BY m.created_at ASC LIMIT 1",
						[userId],
						(err, waitingOpponent) => {
							if (err) {
								console.error("DB error:", err);
								db.run("ROLLBACK");
								return reject(err);
							}
							if (waitingOpponent) {
								// Match found! Update both players atomically
								const gameId = `game_${Date.now()}_${userId}_${waitingOpponent.user_id}`;
								
								// Update waiting opponent to matched
								db.run(
									"UPDATE matchmaking SET status = 'matched', game_id = ? WHERE user_id = ? AND status = 'waiting'",
									[gameId, waitingOpponent.user_id],
									function (err) {
										if (err) {
											console.error("DB error updating opponent:", err);
											db.run("ROLLBACK");
											return reject(err);
										}
										
										if (this.changes === 0) {
											// Opponent was already matched by someone else, try again
											db.run("ROLLBACK");
											return setTimeout(() => joinMatchmaking(userId, lang).then(resolve).catch(reject), 10);
										}
										// Add current user as matched
										db.run(
											"INSERT INTO matchmaking (user_id, status, game_id) VALUES (?, 'matched', ?)",
											[userId, gameId],
											function (err) {
												if (err) {
													console.error("DB error inserting user:", err);
													db.run("ROLLBACK");
													return reject(err);
												}
												
												db.run("COMMIT", (err) => {
													if (err) {
														console.error("DB error committing:", err);
														return reject(err);
													}
													resolve({ 
														success: true, 
														matched: true, 
														gameId: gameId,
														opponentId: waitingOpponent.user_id,
														opponentUsername: waitingOpponent.username
													});
												});
											}
										);
									}
								);
							} else {
								// No opponent found, add to waiting queue
								db.run(
									"INSERT INTO matchmaking (user_id, status) VALUES (?, 'waiting')",
									[userId],
									function (err) {
										if (err) {
											console.error("DB error:", err);
											db.run("ROLLBACK");
											return reject(err);
										}
										if (this.changes === 0) {
											db.run("ROLLBACK");
											return resolve({
												success: false,
												message: messages[lang].failJoinMM,
											});
										}
										
										db.run("COMMIT", (err) => {
											if (err) {
												console.error("DB error committing:", err);
												return reject(err);
											}
											resolve({ success: true, waiting: true });
										});
									}
								);
							}
						}
					);
				}
			);
		});
	});
}

export function leaveMatchmaking(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		// First get the user's current matchmaking status to check if they were in a matched game
		db.get(
			"SELECT * FROM matchmaking WHERE user_id = ?",
			[userId],
			(err, userStatus) => {
				if (err) {
					console.error("DB error getting user status:", err);
					return reject(err);
				}
				// If user was matched, also clean up their opponent's entry
				if (userStatus && userStatus.status === 'matched' && userStatus.game_id) {
					db.run(
						"DELETE FROM matchmaking WHERE game_id = ?",
						[userStatus.game_id],
						function (err) {
							if (err) {
								return reject(err);
							}
							resolve({ success: true });
						}
					);
				} else {
					// Just remove the user's entry
					db.run(
						"DELETE FROM matchmaking WHERE user_id = ?",
						[userId],
						function (err) {
							if (err) {
								console.error("DB error:", err);
								return reject(err);
							}
							resolve({ success: true });
						}
					);
				}
			}
		);
	});
}

export function getMatchmakingStatus(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT * FROM matchmaking WHERE user_id = ?",
			[userId],
			(err, row) => {
				if (err) {
					console.error("DB error:", err);
					return reject(err);
				}
				if (!row) {
					return resolve({
						success: true,
						matchmakingStatus: null
					});
				}
				
				const status = {
					status: row.status,
					matched: row.status === 'matched',
					gameId: row.game_id,
					opponentUsername: null
				};
				
				// If matched, get opponent username
				if (row.status === 'matched' && row.game_id) {
					db.get(
						"SELECT u.username FROM matchmaking m JOIN users u ON m.user_id = u.id WHERE m.game_id = ? AND m.user_id != ?",
						[row.game_id, userId],
						(err, opponent) => {
							if (err) {
								console.error("DB error getting opponent:", err);
								// Continue without opponent name
							} else if (opponent) {
								status.opponentUsername = opponent.username;
							}
							resolve({ success: true, matchmakingStatus: status });
						}
					);
				} else {
					resolve({ success: true, matchmakingStatus: status });
				}
			}
		);
	});
}
