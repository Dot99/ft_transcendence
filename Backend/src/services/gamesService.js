import db from "../../db/dataBase.js";
import { messages } from "../locales/messages.js";
import { v4 as uuidv4 } from "uuid";
import { sendGameInvitationNotification } from "../routes/wsRoutes.js";

export function getAllGames() {
	return new Promise((resolve, reject) => {
		db.all("SELECT * FROM match_history", (err, rows) => {
			if (err) {
				reject({ success: false, error: err });
			} else {
				resolve({ success: true, games: rows });
			}
		});
	});
}

export function getGameById(id, lang = "en") {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT * FROM match_history WHERE match_id = ?",
			[id],
			(err, row) => {
				if (err) {
					reject({ success: false, error: err });
				}
				if (!row) {
					return resolve({
						success: false,
						message: messages[lang].noGame,
					});
				}
				resolve({ success: true, game: row });
			}
		);
	});
}

export function getGamesByUserId(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.all(
			"SELECT * FROM match_history WHERE player1 = ? OR player2 = ?",
			[userId],
			(err, rows) => {
				if (err) {
					reject({ success: false, error: err });
				}
				if (!rows) {
					return resolve({
						success: false,
						message: messages[lang].noMatches,
					});
				}
				resolve({ success: true, games: rows });
			}
		);
	});
}

export function getRecentGamesByUserId(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.all(
			`SELECT * FROM match_history 
			 WHERE player1 = ? OR player2 = ? 
			 ORDER BY match_date DESC`,
			[userId, userId],
			(err, rows) => {
				if (err) {
					return reject({ success: false, error: err });
				}
				if (!rows || rows.length === 0) {
					return resolve({
						success: false,
						message: messages[lang].noMatches,
					});
				}
				resolve({ success: true, games: rows });
			}
		);
	});
}

export function getFinishedMatches(tournamentId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.all(
			`SELECT * FROM tournament_matches
			 WHERE tournament_id = ? AND match_state = 'completed'`,
			[tournamentId],
			(err, rows) => {
				if (err) {
					return reject({ success: false, error: err });
				}
				if (!rows || rows.length === 0) {
					return resolve({
						success: false,
						message: messages[lang].noMatches,
					});
				}
				resolve({ success: true, matches: rows });
			}
		);
	});
}

export function getTournaments(lang = "en") {
	return new Promise((resolve, reject) => {
		db.all("SELECT * FROM tournaments", (err, rows) => {
			if (err) {
				return reject({ success: false, error: err });
			}
			if (!rows || rows.length === 0) {
				return resolve({
					success: false,
					message: messages[lang].noTournament,
				});
			}
			resolve({ success: true, tournaments: rows });
		});
	});
}

export function createTournament(tournamentData, lang = "en") {
	return new Promise((resolve, reject) => {
		const { name, maxPlayers, startDate } = tournamentData;
		db.run(
			`INSERT INTO tournaments (name, start_date, max_players)
       VALUES (?, ?, ?)`,
			[name, startDate, maxPlayers],
			function (err) {
				if (err) {
					return reject({ success: false, error: err });
				}
				resolve({
					success: true,
					tournamentId: this.lastID,
					message: messages[lang].tournamentCreated,
				});
			}
		);
	});
}

export function joinTournament(
	tournamentName,
	tournamentId,
	userId,
	lang = "en"
) {
	return new Promise((resolve, reject) => {
		db.get(
			`SELECT * FROM tournaments WHERE tournament_id = ? AND name = ?`,
			[tournamentId, tournamentName],
			(err, row) => {
				if (err) {
					console.error("Error fetching tournament:", err);
					return reject({ success: false, error: err });
				}

				if (!row) {
					return resolve({
						success: false,
						message: messages[lang].tournamentNotFound,
					});
				} else if (row.max_players <= row.PLAYER_COUNT) {
					return resolve({
						success: false,
						message: messages[lang].tournamentFull,
					});
				}

				db.get(
					`SELECT * FROM tournament_players WHERE tournament_id = ? AND player_id = ?`,
					[tournamentId, userId],
					(err, existingPlayer) => {
						if (err) {
							console.error(
								"Error checking existing player:",
								err
							);
							return reject({ success: false, error: err });
						}

						if (existingPlayer) {
							return resolve({
								success: false,
								message:
									messages[lang].alreadyJoined ||
									"You already joined this tournament.",
							});
						}

						db.run(
							`INSERT INTO tournament_players (tournament_id, tournament_name, player_id, current_position, wins, losses)
                             VALUES (?, ?, ?, 0, 0, 0)`,
							[tournamentId, tournamentName, userId],
							function (err) {
								if (err) {
									console.error(
										"Error inserting player:",
										err
									);
									return reject({
										success: false,
										error: err,
									});
								}
								db.run(
									`UPDATE tournaments SET PLAYER_COUNT = PLAYER_COUNT + 1 WHERE tournament_id = ?`,
									[tournamentId],
									(err) => {
										if (err) {
											console.error(
												"Error updating player count:",
												err
											);
											return reject({
												success: false,
												error: err,
											});
										}

										// Check if tournament is full
										db.get(
											`SELECT PLAYER_COUNT, max_players FROM tournaments WHERE tournament_id = ?`,
											[tournamentId],
											(err, tournament) => {
												if (err) {
													console.error(
														"Error fetching tournament details:",
														err
													);
													return reject({
														success: false,
														error: err,
													});
												}

												if (
													tournament.PLAYER_COUNT ===
													tournament.max_players
												) {
													// Generate matches
													generateTournamentMatches(
														tournamentId,
														tournament.max_players
													)
														.then(() => {
															console.log(
																"Matches generated successfully"
															);
															resolve({
																success: true,
																message:
																	messages[
																		lang
																	]
																		.tournamentJoined,
															});
														})
														.catch((err) => {
															console.error(
																"Error generating matches:",
																err
															);
															reject({
																success: false,
																error: err,
															});
														});
												} else {
													resolve({
														success: true,
														message:
															messages[lang]
																.tournamentJoined,
													});
												}
											}
										);
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

// Generate matches based on tournament size
function generateTournamentMatches(tournamentId, maxPlayers) {
	return new Promise((resolve, reject) => {
		db.all(
			`SELECT player_id FROM tournament_players WHERE tournament_id = ? ORDER BY RANDOM()`,
			[tournamentId],
			(err, players) => {
				if (err) return reject(err);

				const roundNumber = 1;
				const roundMatches = [];

				for (let i = 0; i < players.length; i += 2) {
					const player1 = players[i];
					const player2 = players[i + 1];

					roundMatches.push({
						tournament_id: tournamentId,
						player1: player1.player_id,
						player2: player2.player_id,
						round_number: roundNumber,
					});
				}

				const insertPromises = roundMatches.map(
					(match) =>
						new Promise((resolve, reject) => {
							db.run(
								`INSERT INTO tournament_matches (tournament_id, player1, player2, round_number, match_state)
                             VALUES (?, ?, ?, ?, 'upcoming')`,
								[
									match.tournament_id,
									match.player1,
									match.player2,
									match.round_number,
								],
								(err) => {
									if (err) return reject(err);
									resolve();
								}
							);
						})
				);

				Promise.all(insertPromises)
					.then(() => {
						console.log("Tournament matches created successfully");
						resolve({
							success: true,
							message:
								"Tournament matches generated successfully",
						});
					})
					.catch((err) => {
						console.error(
							"Error creating tournament matches:",
							err
						);
						reject(err);
					});
			}
		);
	});
}

export function getPastTournamentsByUserId(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.all(
			`SELECT tp.*, t.name AS tournament_name, t.start_date AS tournament_date
				FROM tournament_players tp
				JOIN tournaments t ON tp.tournament_id = t.tournament_id
				WHERE tp.player_id = ?
				ORDER BY t.start_date DESC;`,
			[userId],
			(err, rows) => {
				if (err) {
					return reject({ success: false, error: err });
				}
				if (!rows || rows.length === 0) {
					return resolve({
						success: false,
						message: messages[lang].noTournament,
					});
				}
				resolve({
					success: true,
					tournaments: rows,
				});
			}
		);
	});
}
export function getUpcomingTournamentsByUserId(userId) {
	return new Promise((resolve, reject) => {
		db.all(
			`SELECT * FROM tournaments 
			 WHERE start_date > CURRENT_TIMESTAMP 
			 AND (player1 = ? OR player2 = ?) 
			 ORDER BY start_date ASC`,
			[userId, userId],
			(err, rows) => {
				if (err) {
					return reject({ success: false, error: err });
				}
				if (!rows || rows.length === 0) {
					return resolve({
						success: false,
					});
				}
				resolve({
					success: true,
					tournaments: rows,
					message: "Upcoming tournaments found",
				});
			}
		);
	});
}
export function getTournamentById(tournamentId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT * FROM tournaments WHERE tournament_id = ?",
			[tournamentId],
			(err, row) => {
				if (err) {
					reject({ success: false, error: err });
				}
				if (!row) {
					return resolve({
						success: false,
						message: messages[lang].noTournament,
					});
				}
				resolve({
					success: true,
					tournament: row,
					message: "Tournament found",
				});
			}
		);
	});
}
export function getTournamentMatchesById(tournamentId) {
	return new Promise((resolve, reject) => {
		db.all(
			"SELECT * FROM tournament_matches WHERE tournament_id = ?",
			[tournamentId],
			(err, rows) => {
				if (err) {
					reject({ success: false, error: err });
				}
				if (!rows || rows.length === 0) {
					return resolve({
						success: false,
						message: messages[lang].noMatches,
					});
				}
				resolve({ success: true, matches: rows });
			}
		);
	});
}
export function getUpcomingTournamentMatchesById(tournamentId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.all(
			"SELECT * FROM tournament_matches WHERE tournament_id = ? AND match_state = 'upcoming'",
			[tournamentId],
			(err, rows) => {
				if (err) {
					reject({ success: false, error: err });
				}
				if (!rows || rows.length === 0) {
					return resolve({
						success: false,
						message: messages[lang].noMatches,
					});
				}
				resolve({
					success: true,
					matches: rows,
				});
			}
		);
	});
}

export function getTournamentPlayersById(tournamentId, userId) {
	return new Promise((resolve, reject) => {
		db.all(
			"SELECT * FROM tournament_players WHERE tournament_id = ? AND player_id = ?",
			[tournamentId, userId],
			(err, rows) => {
				if (err) {
					reject({ success: false, error: err });
				}
				if (!rows || rows.length === 0) {
					return resolve({
						success: false,
						message: messages[lang].noUsers,
					});
				}
				resolve({ success: true, players: rows });
			}
		);
	});
}

export function getAllTournamentPlayers(tournamentId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.all(
			"SELECT * FROM tournament_players WHERE tournament_id = ?",
			[tournamentId],
			(err, rows) => {
				if (err) {
					reject({ success: false, error: err });
				}
				if (!rows || rows.length === 0) {
					return resolve({
						success: false,
						message: messages[lang].noUsers,
					});
				}
				resolve({ success: true, players: rows });
			}
		);
	});
}

export function updateCustomization(userId, customization, lang = "en") {
	const { paddle_color, ball_color, board_color, border_color } =
		customization;

	return new Promise((resolve, reject) => {
		db.run(
			`
      INSERT INTO game_costumization (user_id, paddle_color, ball_color, board_color, border_color)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET 
        paddle_color = excluded.paddle_color,
        ball_color = excluded.ball_color,
        board_color = excluded.board_color,
        border_color = excluded.border_color
      `,
			[userId, paddle_color, ball_color, board_color, border_color],
			function (err) {
				if (err) {
					reject({ success: false, error: err });
				} else {
					resolve({ success: true, message: "Customization saved." });
				}
			}
		);
	});
}

export function getCustomization(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT * FROM game_costumization WHERE user_id = ?",
			[userId],
			(err, row) => {
				if (err) {
					reject({ success: false, error: err });
				}
				if (!row) {
					return resolve({
						success: false,
						message: messages[lang].noCustomization,
					});
				}
				resolve({ success: true, customization: row });
			}
		);
	});
}

/**
 * Create a game invitation to a friend
 * @param {number} inviterId - The user ID of the person sending the invitation
 * @param {number} inviteeId - The user ID of the person receiving the invitation
 * @param {string} lang - The language for error messages
 * @returns {Promise<Object>} - The result of the operation
 */
export function createGameInvitation(inviterId, inviteeId, lang = "en") {
	return new Promise((resolve, reject) => {
		// First check if they are friends
		db.get(
			`SELECT * FROM friends 
       WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) 
       AND status = 'accepted'`,
			[inviterId, inviteeId, inviteeId, inviterId],
			(err, friendship) => {
				if (err) {
					return reject({ success: false, error: err.message });
				}

				if (!friendship) {
					return resolve({
						success: false,
						error:
							messages[lang].notFriends ||
							"You are not friends with this user",
					});
				}

				// Check if there's already a pending invitation
				db.get(
					`SELECT * FROM game_invitations 
           WHERE inviter_id = ? AND invitee_id = ? AND status = 'pending'`,
					[inviterId, inviteeId],
					(err, existingInvitation) => {
						if (err) {
							return reject({
								success: false,
								error: err.message,
							});
						}

						if (existingInvitation) {
							return resolve({
								success: false,
								error:
									messages[lang].invitationAlreadySent ||
									"Invitation already sent",
							});
						}

						// Create the game invitation
						const gameId = uuidv4();
						db.run(
							`INSERT INTO game_invitations (inviter_id, invitee_id, match_id) 
               VALUES (?, ?, ?)`,
							[inviterId, inviteeId, gameId],
							function (err) {
								if (err) {
									return reject({
										success: false,
										error: err.message,
									});
								}

								// Get inviter username for the response
								db.get(
									"SELECT username FROM users WHERE id = ?",
									[inviterId],
									(err, inviter) => {
										if (err) {
											return reject({
												success: false,
												error: err.message,
											});
										}

										// Notify the invitee about the new game invitation
										// Send real-time notification to the invitee
										sendGameInvitationNotification(
											inviteeId,
											{
												id: this.lastID,
												inviter_id: inviterId,
												invitee_id: inviteeId,
												match_id: gameId,
												status: "pending",
												inviter_username:
													inviter.username,
											}
										);

										resolve({
											success: true,
											invitation: {
												id: this.lastID,
												match_id: gameId,
											},
											message:
												messages[lang].invitationSent ||
												"Game invitation sent!",
										});
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

/**
 * Respond to a game invitation (accept or decline)
 * @param {number} invitationId - The invitation ID
 * @param {number} userId - The user ID of the person responding
 * @param {boolean} accept - Whether to accept the invitation
 * @param {string} lang - The language for error messages
 * @returns {Promise<Object>} - The result of the operation
 */
export function respondToGameInvitation(
	invitationId,
	userId,
	accept,
	lang = "en"
) {
	return new Promise((resolve, reject) => {
		// Get the invitation
		db.get(
			`SELECT gi.*, u.username as inviter_username 
       FROM game_invitations gi
       JOIN users u ON gi.inviter_id = u.id
       WHERE gi.id = ? AND gi.invitee_id = ? AND gi.status = 'pending'`,
			[invitationId, userId],
			(err, invitation) => {
				if (err) {
					return reject({ success: false, error: err.message });
				}

				if (!invitation) {
					return resolve({
						success: false,
						error:
							messages[lang].invitationNotFound ||
							"Invitation not found or already responded to",
					});
				}

				const newStatus = accept ? "accepted" : "declined";

				// Update the invitation status
				db.run(
					`UPDATE game_invitations 
           SET status = ?, responded_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
					[newStatus, invitationId],
					function (err) {
						if (err) {
							return reject({
								success: false,
								error: err.message,
							});
						}

						const result = {
							success: true,
							accepted: accept,
							gameId: accept ? invitation.match_id : null,
							inviterUsername: invitation.inviter_username,
							message: accept
								? messages[lang].invitationAccepted ||
								  "Game invitation accepted!"
								: messages[lang].invitationDeclined ||
								  "Game invitation declined",
						};

						// If invitation was accepted, notify the inviter to join the game
						if (accept) {
							// Get the invitee's username to send in the notification
							db.get(
								"SELECT username FROM users WHERE id = ?",
								[userId],
								(err, invitee) => {
									if (!err && invitee) {
										sendGameInvitationNotification(
											invitation.inviter_id,
											{
												type: "invitationAccepted",
												gameId: invitation.match_id,
												inviteeUsername:
													invitee.username,
												message: `${invitee.username} accepted your game invitation!`,
											}
										);
									}
								}
							);
						}

						resolve(result);
					}
				);
			}
		);
	});
}

/**
 * Get pending game invitations for a user
 * @param {number} userId - The user ID
 * @param {string} lang - The language for error messages
 * @returns {Promise<Object>} - The result of the operation
 */
export function getPendingGameInvitations(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.all(
			`SELECT gi.*, u.username as inviter_username 
       FROM game_invitations gi
       JOIN users u ON gi.inviter_id = u.id
       WHERE gi.invitee_id = ? AND gi.status = 'pending'
       ORDER BY gi.created_at DESC`,
			[userId],
			(err, invitations) => {
				if (err) {
					return reject({ success: false, error: err.message });
				}

				resolve({
					success: true,
					invitations: invitations || [],
				});
			}
		);
	});
}

export function saveGameResult(gameData, lang = "en") {
	return new Promise((resolve, reject) => {
		const { player1, player2, player1_score, player2_score, winner } =
			gameData;
		// Validate required fields
		if (
			!player1 ||
			!player2 ||
			player1_score === undefined ||
			player2_score === undefined
		) {
			return resolve({
				success: false,
				message: messages[lang].missingFields || "Invalid game data",
			});
		}

		// Insert the match result into the database
		db.run(
			`INSERT INTO match_history (player1, player2, player1_score, player2_score, winner) 
       VALUES (?, ?, ?, ?, ?)`,
			[player1, player2, player1_score, player2_score, winner],
			function (err) {
				if (err) {
					console.error("Error saving game result:", err);
					reject({ success: false, error: err });
				} else {
					const matchId = this.lastID;

					// Update player stats
					updatePlayerStats(player1, player2, winner, matchId)
						.then(() => {
							resolve({
								success: true,
								match_id: matchId,
								message:
									messages[lang].gameSaved ||
									"Game result saved successfully",
							});
						})
						.catch((statsError) => {
							console.error(
								"Error updating player stats:",
								statsError
							);
							// Game is saved but stats update failed - still return success
							resolve({
								success: true,
								match_id: matchId,
								message:
									messages[lang].gameSaved ||
									"Game result saved successfully",
								warning: "Stats update failed",
							});
						});
				}
			}
		);
	});
}

function updatePlayerStats(player1Id, player2Id, winnerId, matchId) {
	return new Promise((resolve, reject) => {
		// Update stats for both players
		const updatePromises = [
			updateSinglePlayerStats(player1Id, winnerId === player1Id),
			updateSinglePlayerStats(player2Id, winnerId === player2Id),
		];

		Promise.all(updatePromises)
			.then(() => resolve())
			.catch(reject);
	});
}

function updateSinglePlayerStats(playerId, isWinner) {
	return new Promise((resolve, reject) => {
		// First, ensure the player has a stats record
		db.run(
			`INSERT OR IGNORE INTO stats (player_id) VALUES (?)`,
			[playerId],
			(err) => {
				if (err) {
					return reject(err);
				}

				// Get the player's current stats and recent match data for calculations
				db.get(
					`SELECT s.*, 
                  (SELECT AVG(CASE 
                    WHEN m.player1 = ? THEN m.player1_score 
                    ELSE m.player2_score 
                  END) FROM match_history m 
                  WHERE m.player1 = ? OR m.player2 = ?) as current_avg_score
           FROM stats s 
           WHERE s.player_id = ?`,
					[playerId, playerId, playerId, playerId],
					(err, currentStats) => {
						if (err) {
							return reject(err);
						}

						// Calculate win streak
						calculateWinStreak(playerId)
							.then((maxWinStreak) => {
								// Update the stats with all calculated values
								db.run(
									`UPDATE stats 
                   SET total_matches = total_matches + 1,
                       matches_won = matches_won + ?,
                       matches_lost = matches_lost + ?,
                       average_score = COALESCE(?, 0),
                       win_streak_max = ?
                   WHERE player_id = ?`,
									[
										isWinner ? 1 : 0,
										isWinner ? 0 : 1,
										currentStats?.current_avg_score || 0,
										Math.max(
											maxWinStreak,
											currentStats?.win_streak_max || 0
										),
										playerId,
									],
									(updateErr) => {
										if (updateErr) {
											reject(updateErr);
										} else {
											resolve();
										}
									}
								);
							})
							.catch(reject);
					}
				);
			}
		);
	});
}

function calculateWinStreak(playerId) {
	return new Promise((resolve, reject) => {
		// Get all matches for this player ordered by date (most recent first)
		db.all(
			`SELECT winner, match_date 
       FROM match_history 
       WHERE player1 = ? OR player2 = ? 
       ORDER BY match_date DESC`,
			[playerId, playerId],
			(err, matches) => {
				if (err) {
					return reject(err);
				}

				let currentStreak = 0;
				let maxStreak = 0;
				let lastResult = null;

				// Calculate win streaks
				for (const match of matches) {
					const isWin = match.winner === playerId;

					if (isWin) {
						if (lastResult === null || lastResult === true) {
							currentStreak++;
						} else {
							currentStreak = 1; // Reset streak
						}
						maxStreak = Math.max(maxStreak, currentStreak);
					} else {
						if (lastResult === true) {
							currentStreak = 0;
						}
					}

					lastResult = isWin;
				}

				resolve(maxStreak);
			}
		);
	});
}

// Function to recalculate and fix all stats for a user (useful for debugging)
export function recalculateUserStats(userId, lang = "en") {
	return new Promise((resolve, reject) => {
		// Get all matches for this user
		db.all(
			`SELECT player1, player2, player1_score, player2_score, winner, match_date
       FROM match_history 
       WHERE player1 = ? OR player2 = ?
       ORDER BY match_date ASC`,
			[userId, userId],
			(err, matches) => {
				if (err) {
					return reject(err);
				}
				let totalMatches = matches.length;
				let matchesWon = 0;
				let matchesLost = 0;
				let totalScore = 0;
				let maxWinStreak = 0;
				let currentWinStreak = 0;

				// Calculate stats from all matches
				for (const match of matches) {
					const isPlayer1 = match.player1 === userId;
					const userScore = isPlayer1
						? match.player1_score
						: match.player2_score;
					const isWinner = match.winner === userId;

					totalScore += userScore;

					if (isWinner) {
						matchesWon++;
						currentWinStreak++;
						maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
					} else {
						matchesLost++;
						currentWinStreak = 0;
					}
				}

				const averageScore =
					totalMatches > 0 ? totalScore / totalMatches : 0;

				db.run(
					`INSERT OR REPLACE INTO stats 
           (player_id, total_matches, matches_won, matches_lost, average_score, win_streak_max, tournaments_won, leaderboard_position, current_tournament)
           VALUES (?, ?, ?, ?, ?, ?, 0, NULL, NULL)`,
					[
						userId,
						totalMatches,
						matchesWon,
						matchesLost,
						averageScore,
						maxWinStreak,
					],
					function (err) {
						if (err) {
							reject(err);
						} else {
							resolve({
								success: true,
								stats: {
									total_matches: totalMatches,
									matches_won: matchesWon,
									matches_lost: matchesLost,
									average_score: averageScore,
									win_streak_max: maxWinStreak,
								},
							});
						}
					}
				);
			}
		);
	});
}

/**
 * Generate the next round based on the number of players (4 or 8).
 * @param {number} tournamentId - The ID of the tournament.
 * @param {number} currentRound - The current round number.
 * @param {number} numPlayers - The number of players (4 or 8).
 * @returns {Promise<Object>} - The result of the operation.
 */
export function generateNextRound(tournamentId, currentRound, numPlayers) {
	return new Promise((resolve, reject) => {
		console.log("DEBUG: Starting generateNextRound with params:", {
			tournamentId,
			currentRound,
			numPlayers,
		});

		if (![4, 8].includes(numPlayers)) {
			console.error("DEBUG: Invalid number of players:", numPlayers);
			return resolve({
				success: false,
				message:
					"Invalid number of players. Only 4 or 8 are supported.",
			});
		}

		// Get winners from the current round
		db.all(
			`SELECT Winner, match_id, player1, player2, player1_score, player2_score FROM tournament_matches 
			 WHERE tournament_id = ? AND round_number = ? AND match_state = 'completed'`,
			[tournamentId, currentRound],
			(err, completedMatches) => {
				if (err) {
					console.error(
						"DEBUG: Error getting completed matches:",
						err
					);
					return reject({ success: false, error: err });
				}

				console.log(
					"DEBUG: Completed matches from current round:",
					completedMatches
				);

				// Extract winners (filter out null/undefined winners)
				const winners = completedMatches
					.filter(
						(match) =>
							match.Winner !== null && match.Winner !== undefined
					)
					.map((match) => ({ Winner: match.Winner }));

				console.log("DEBUG: Winners extracted:", winners);

				// Calculate expected winners based on tournament structure
				const expectedWinners = Math.floor(
					numPlayers / Math.pow(2, currentRound)
				);
				console.log(
					"DEBUG: Expected winners for next round:",
					expectedWinners
				);

				// Ensure winners array is valid
				if (!winners || winners.length === 0) {
					console.error("DEBUG: No winners found");
					return resolve({
						success: false,
						message:
							"No winners found to advance to the next round.",
					});
				}

				if (winners.length < expectedWinners) {
					console.error("DEBUG: Not enough winners:", {
						winnersFound: winners.length,
						expectedWinners,
					});
					return resolve({
						success: false,
						message: `Not enough winners to advance to the next round. Found ${winners.length}, expected ${expectedWinners}.`,
					});
				}

				// Check if this is the final round (only 1 winner expected)
				if (winners.length === 1) {
					console.log("DEBUG: Tournament completed - only 1 winner");
					// Update tournament status to completed
					db.run(
						`UPDATE tournaments SET status = 'completed' WHERE tournament_id = ?`,
						[tournamentId],
						function (updateErr) {
							if (updateErr) {
								console.error(
									"DEBUG: Error updating tournament status:",
									updateErr
								);
							} else {
								console.log(
									"DEBUG: Tournament marked as completed"
								);
							}
						}
					);
					return resolve({
						success: true,
						message: "Tournament completed! Winner determined.",
						tournamentComplete: true,
						winner: winners[0].Winner,
					});
				}

				// Prepare matches for the next round
				const nextRound = currentRound + 1;
				const nextRoundMatches = [];

				console.log("DEBUG: Creating matches for round", nextRound);

				for (let i = 0; i < winners.length; i += 2) {
					const player1 = winners[i]?.Winner;
					const player2 = winners[i + 1]?.Winner;

					console.log("DEBUG: Pairing players:", {
						player1,
						player2,
					});

					if (player1 && player2) {
						nextRoundMatches.push({
							tournament_id: tournamentId,
							player1,
							player2,
							round_number: nextRound,
						});
					} else if (player1 && !player2) {
						// Odd number of winners - give bye to the last player
						console.log("DEBUG: Giving bye to player:", player1);
						nextRoundMatches.push({
							tournament_id: tournamentId,
							player1,
							player2: null, // Bye
							round_number: nextRound,
						});
					}
				}

				console.log(
					"DEBUG: Next round matches to create:",
					nextRoundMatches
				);

				if (nextRoundMatches.length === 0) {
					console.error("DEBUG: No matches created for next round");
					return resolve({
						success: false,
						message:
							"No matches could be created for the next round.",
					});
				}

				// Insert matches into the database
				const insertPromises = nextRoundMatches.map(
					(match) =>
						new Promise((resolve, reject) => {
							console.log("DEBUG: Inserting match:", match);
							db.run(
								`INSERT INTO tournament_matches 
								 (tournament_id, player1, player2, round_number, match_state)
								 VALUES (?, ?, ?, ?, 'upcoming')`,
								[
									match.tournament_id,
									match.player1,
									match.player2,
									match.round_number,
								],
								function (err) {
									if (err) {
										console.error(
											"DEBUG: Error inserting match:",
											err
										);
										return reject(err);
									}
									console.log(
										"DEBUG: Match inserted with ID:",
										this.lastID
									);
									resolve(this.lastID);
								}
							);
						})
				);

				Promise.all(insertPromises)
					.then((insertedIds) => {
						console.log(
							"DEBUG: All matches inserted successfully:",
							insertedIds
						);

						// Verify the matches were created
						db.all(
							`SELECT * FROM tournament_matches WHERE tournament_id = ? AND round_number = ?`,
							[tournamentId, nextRound],
							(err, verifyMatches) => {
								if (err) {
									console.error(
										"DEBUG: Error verifying created matches:",
										err
									);
								} else {
									console.log(
										"DEBUG: Verified created matches:",
										verifyMatches
									);
								}

								resolve({
									success: true,
									message: `Advanced to round ${nextRound} successfully.`,
									nextRound,
									matchesCreated: insertedIds.length,
									matches: verifyMatches || [],
								});
							}
						);
					})
					.catch((insertErr) => {
						console.error(
							"DEBUG: Error creating tournament matches:",
							insertErr
						);
						reject({ success: false, error: insertErr });
					});
			}
		);
	});
}

/**
 * Update the match result and the current round of a tournament if all matches in the current round are completed.
 * @param {number} matchId - The ID of the match to update.
 * @param {number} winnerId - The ID of the winning player.
 * @param {number} player1_score - Player 1 score.
 * @param {number} player2_score - Player 2 score.
 * @param {number} tournamentId - The ID of the tournament.
 * @param {number} currentRound - The current round number.
 * @returns {Promise<Object>} - The result of the operation.
 */
export function updateMatchAndRound(
	matchId,
	winnerId,
	player1_score,
	player2_score,
	tournamentId,
	currentRound
) {
	return new Promise((resolve, reject) => {
		console.log("DEBUG: Starting updateMatchAndRound with params:", {
			matchId,
			winnerId,
			player1_score,
			player2_score,
			tournamentId,
			currentRound,
		});

		// First, verify the match exists and get current state
		db.get(
			`SELECT * FROM tournament_matches WHERE match_id = ? AND tournament_id = ?`,
			[matchId, tournamentId],
			(err, existingMatch) => {
				if (err) {
					console.error("DEBUG: Error checking existing match:", err);
					return reject({ success: false, error: err });
				}

				if (!existingMatch) {
					console.error("DEBUG: Match not found:", {
						matchId,
						tournamentId,
					});
					return reject({
						success: false,
						error: "Match not found in tournament",
					});
				}

				console.log("DEBUG: Existing match found:", existingMatch);

				// Update the match result
				db.run(
					`UPDATE tournament_matches 
					 SET Winner = ?, player1_score = ?, player2_score = ?, match_state = 'completed' 
					 WHERE match_id = ?`,
					[winnerId, player1_score, player2_score, matchId],
					function (err) {
						if (err) {
							console.error("DEBUG: Error updating match:", err);
							return reject({ success: false, error: err });
						}

						console.log(
							"DEBUG: Match updated successfully, changes:",
							this.changes
						);

						if (this.changes === 0) {
							console.warn(
								"DEBUG: No rows were updated - match might already be completed"
							);
						}

						// Verify the update worked
						db.get(
							`SELECT * FROM tournament_matches WHERE match_id = ?`,
							[matchId],
							(err, updatedMatch) => {
								if (err) {
									console.error(
										"DEBUG: Error verifying match update:",
										err
									);
									return reject({
										success: false,
										error: err,
									});
								}

								console.log(
									"DEBUG: Match after update:",
									updatedMatch
								);

								// Check if all matches in the current round are completed
								db.all(
									`SELECT match_id, match_state, Winner, player1_score, player2_score FROM tournament_matches 
									 WHERE tournament_id = ? AND round_number = ?`,
									[tournamentId, currentRound],
									(err, matches) => {
										if (err) {
											console.error(
												"DEBUG: Error getting round matches:",
												err
											);
											return reject({
												success: false,
												error: err,
											});
										}

										console.log(
											"DEBUG: All matches in current round:",
											matches
										);

										// Verify if all matches are completed
										const completedMatches = matches.filter(
											(match) =>
												match.match_state ===
												"completed"
										);
										const allCompleted = matches.every(
											(match) =>
												match.match_state ===
												"completed"
										);

										console.log(
											"DEBUG: Round completion status:",
											{
												totalMatches: matches.length,
												completedMatches:
													completedMatches.length,
												allCompleted,
											}
										);

										if (!allCompleted) {
											console.log(
												"DEBUG: Not all matches completed yet"
											);
											return resolve({
												success: true,
												matchUpdated: true,
												roundAdvanced: false,
												message:
													"Match result updated successfully, but not all matches in the current round are completed.",
												debugInfo: {
													totalMatches:
														matches.length,
													completedMatches:
														completedMatches.length,
													pendingMatches:
														matches.filter(
															(m) =>
																m.match_state !==
																"completed"
														).length,
												},
											});
										}

										console.log(
											"DEBUG: All matches completed, advancing round"
										);

										// Clean up readiness records for completed matches
										cleanupTournamentMatchReadiness(matchId)
											.then(() => {
												console.log(
													"DEBUG: Cleaned up readiness records for match",
													matchId
												);
											})
											.catch((err) => {
												console.warn(
													"DEBUG: Failed to clean up readiness records:",
													err
												);
											});

										// Get max players to determine if we need to generate next round
										db.get(
											`SELECT max_players, current_round FROM tournaments WHERE tournament_id = ?`,
											[tournamentId],
											(err, tournament) => {
												if (err) {
													console.error(
														"DEBUG: Error getting tournament info:",
														err
													);
													return reject({
														success: false,
														error: err,
													});
												}

												console.log(
													"DEBUG: Tournament info:",
													tournament
												);

												// Update the tournament's current round
												db.run(
													`UPDATE tournaments 
													 SET current_round = current_round + 1 
													 WHERE tournament_id = ?`,
													[tournamentId],
													function (err) {
														if (err) {
															console.error(
																"DEBUG: Error updating tournament round:",
																err
															);
															return reject({
																success: false,
																error: err,
															});
														}

														console.log(
															"DEBUG: Tournament round updated, changes:",
															this.changes
														);

														const nextRound =
															currentRound + 1;

														// Check if we need to generate matches for the next round
														const expectedWinners =
															matches.length / 2;
														const actualWinners =
															completedMatches.filter(
																(m) => m.Winner
															).length;

														console.log(
															"DEBUG: Winners info:",
															{
																expectedWinners,
																actualWinners,
																nextRound,
															}
														);

														if (
															actualWinners >=
																expectedWinners &&
															nextRound <=
																Math.log2(
																	tournament.max_players
																)
														) {
															console.log(
																"DEBUG: Generating next round matches"
															);
															// Generate matches for next round
															generateNextRound(
																tournamentId,
																currentRound,
																tournament.max_players
															)
																.then(
																	(
																		nextRoundResult
																	) => {
																		console.log(
																			"DEBUG: Next round generated:",
																			nextRoundResult
																		);
																		resolve(
																			{
																				success: true,
																				matchUpdated: true,
																				roundAdvanced: true,
																				nextRoundGenerated: true,
																				message: `Match result updated successfully. Tournament round updated to ${nextRound} and next round matches generated.`,
																				debugInfo:
																					{
																						currentRound,
																						nextRound,
																						nextRoundResult,
																					},
																			}
																		);
																	}
																)
																.catch(
																	(
																		nextRoundError
																	) => {
																		console.error(
																			"DEBUG: Error generating next round:",
																			nextRoundError
																		);
																		resolve(
																			{
																				success: true,
																				matchUpdated: true,
																				roundAdvanced: true,
																				nextRoundGenerated: false,
																				message: `Match result updated successfully. Tournament round updated to ${nextRound} but failed to generate next round matches.`,
																				warning:
																					"Next round generation failed",
																				debugInfo:
																					{
																						currentRound,
																						nextRound,
																						nextRoundError,
																					},
																			}
																		);
																	}
																);
														} else {
															console.log(
																"DEBUG: Tournament completed or no next round needed"
															);
															resolve({
																success: true,
																matchUpdated: true,
																roundAdvanced: true,
																nextRoundGenerated: false,
																message: `Match result updated successfully. Tournament round updated to ${nextRound}.`,
																debugInfo: {
																	currentRound,
																	nextRound,
																	tournamentCompleted:
																		nextRound >
																		Math.log2(
																			tournament.max_players
																		),
																},
															});
														}
													}
												);
											}
										);
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

export function getCurrentRound(tournamentId, lang = "en") {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT current_round FROM tournaments WHERE tournament_id = ?",
			[tournamentId],
			(err, row) => {
				if (err) {
					reject({ success: false, error: err });
				}
				if (!row) {
					return resolve({
						success: false,
						message:
							messages[lang].noTournament ||
							"Tournament not found",
					});
				}
				resolve({
					success: true,
					current_round: row.current_round,
				});
			}
		);
	});
}

/**
 * Mark a player as ready for their tournament match
 * @param {number} tournamentId - Tournament ID
 * @param {number} matchId - Match ID
 * @param {number} userId - User ID of the player
 * @param {string} lang - Language for messages
 * @returns {Promise<Object>} - Result with success status and gameId if both ready
 */
export function markPlayerReady(tournamentId, matchId, userId, lang = "en") {
	return new Promise((resolve, reject) => {
		// First check if this match exists and the user is a participant
		db.get(
			`SELECT * FROM tournament_matches WHERE match_id = ? AND tournament_id = ? AND (player1 = ? OR player2 = ?)`,
			[matchId, tournamentId, userId, userId],
			(err, match) => {
				if (err) {
					return reject({ success: false, error: err });
				}
				if (!match) {
					return resolve({
						success: false,
						message: "Match not found or you are not a participant",
					});
				}
				if (match.match_state !== "upcoming") {
					return resolve({
						success: false,
						message: "Match is not in upcoming state",
					});
				}

				// Mark this player as ready (table already exists from migrations)
				db.run(
					`INSERT OR REPLACE INTO tournament_match_readiness (tournament_id, match_id, user_id) VALUES (?, ?, ?)`,
					[tournamentId, matchId, userId],
					function (err) {
						if (err) {
							return reject({
								success: false,
								error: err,
							});
						}

						// Check if both players are now ready
						db.all(
							`SELECT COUNT(*) as ready_count FROM tournament_match_readiness WHERE match_id = ?`,
							[matchId],
							(err, result) => {
								if (err) {
									return reject({
										success: false,
										error: err,
									});
								}

								const readyCount = result[0].ready_count;
								if (readyCount >= 2) {
									// Both players are ready, create game room
									const gameId = `tournament_${tournamentId}_match_${matchId}`;

									// Both players ready, return the game ID
									resolve({
										success: true,
										message:
											"Both players are ready! Game starting...",
										gameId: gameId,
										bothReady: true,
									});
								} else {
									resolve({
										success: true,
										message:
											"Waiting for opponent to be ready...",
										bothReady: false,
									});
								}
							}
						);
					}
				);
			}
		);
	});
}

/**
 * Get the status of a tournament match (readiness and game info)
 * @param {number} tournamentId - Tournament ID
 * @param {number} matchId - Match ID
 * @param {number} userId - User ID requesting status
 * @param {string} lang - Language for messages
 * @returns {Promise<Object>} - Match status with readiness info
 */
export function getMatchStatus(tournamentId, matchId, userId, lang = "en") {
	return new Promise((resolve, reject) => {
		// Get match details
		db.get(
			`SELECT * FROM tournament_matches WHERE match_id = ? AND tournament_id = ? AND (player1 = ? OR player2 = ?)`,
			[matchId, tournamentId, userId, userId],
			(err, match) => {
				if (err) {
					return reject({ success: false, error: err });
				}
				if (!match) {
					return resolve({
						success: false,
						message: "Match not found or you are not a participant",
					});
				}

				// Check readiness count
				db.all(
					`SELECT COUNT(*) as ready_count FROM tournament_match_readiness WHERE match_id = ?`,
					[matchId],
					(err, result) => {
						if (err) {
							return reject({ success: false, error: err });
						}

						const readyCount = result[0].ready_count;
						const bothReady = readyCount >= 2;

						if (bothReady) {
							// Generate consistent game ID for this match
							const gameId = `tournament_${tournamentId}_match_${matchId}`;

							// Get opponent username
							const opponentId =
								match.player1 === userId
									? match.player2
									: match.player1;
							db.get(
								`SELECT username FROM users WHERE id = ?`,
								[opponentId],
								(err, opponent) => {
									if (err) {
										return reject({
											success: false,
											error: err,
										});
									}

									resolve({
										success: true,
										bothReady: true,
										gameId: gameId,
										opponentUsername: opponent
											? opponent.username
											: "Unknown Player",
									});
								}
							);
						} else {
							resolve({
								success: true,
								bothReady: false,
								gameId: null,
								opponentUsername: null,
							});
						}
					}
				);
			}
		);
	});
}

/**
 * Process game result - handles tournament matches, friend games, and regular games
 * @param {Object} gameData - Game result data
 * @param {string} gameId - The game ID to determine the type of game
 * @param {string} lang - Language for messages
 * @returns {Promise<Object>} - Result of the operation
 */
export function processGameResult(gameData, gameId, lang = "en") {
	return new Promise(async (resolve, reject) => {
		try {
			console.log("DEBUG: ProcessGameResult called with:", {
				gameData,
				gameId,
				lang,
			});

			// Validate gameData
			if (!gameData || !gameData.player1 || !gameData.player2) {
				console.error("DEBUG: Invalid game data:", gameData);
				return reject({
					success: false,
					error: "Invalid game data - missing player information",
				});
			}

			// Check if this is a tournament game by analyzing the gameId format
			const isTournamentGame = gameId && gameId.startsWith("tournament_");
			console.log("DEBUG: Is tournament game:", isTournamentGame);

			if (isTournamentGame) {
				// Extract tournament and match info from gameId format: tournament_{tournamentId}_match_{matchId}
				const gameIdParts = gameId.split("_");
				console.log("DEBUG: Game ID parts:", gameIdParts);

				if (gameIdParts.length >= 4) {
					const tournamentId = parseInt(gameIdParts[1]);
					const matchId = parseInt(gameIdParts[3]);
					console.log(
						"DEBUG: Tournament ID:",
						tournamentId,
						"Match ID:",
						matchId
					);

					// Validate tournament and match IDs
					if (isNaN(tournamentId) || isNaN(matchId)) {
						console.error(
							"DEBUG: Invalid tournament or match ID:",
							{ tournamentId, matchId }
						);
						return reject({
							success: false,
							error: "Invalid tournament or match ID format",
						});
					}

					// Verify match exists and is in correct state
					db.get(
						`SELECT * FROM tournament_matches WHERE match_id = ? AND tournament_id = ?`,
						[matchId, tournamentId],
						async (err, match) => {
							if (err) {
								console.error(
									"DEBUG: Error checking match:",
									err
								);
								return reject({
									success: false,
									error:
										"Database error checking match: " +
										err.message,
								});
							}

							if (!match) {
								console.error("DEBUG: Match not found:", {
									matchId,
									tournamentId,
								});
								return reject({
									success: false,
									error: "Tournament match not found",
								});
							}

							console.log(
								"DEBUG: Found tournament match:",
								match
							);

							if (match.match_state === "completed") {
								console.warn(
									"DEBUG: Match already completed:",
									match
								);
								return resolve({
									success: false,
									error: "Match already completed",
								});
							}

							// Get current round for this tournament match
							try {
								const currentRoundResult =
									await getCurrentRound(tournamentId, lang);
								console.log(
									"DEBUG: Current round result:",
									currentRoundResult
								);

								if (!currentRoundResult.success) {
									console.error(
										"DEBUG: Could not get current round:",
										currentRoundResult
									);
									return reject({
										success: false,
										error: "Could not determine current tournament round",
									});
								}

								const currentRound =
									currentRoundResult.current_round;
								console.log(
									"DEBUG: Current round:",
									currentRound
								);

								// Verify this match belongs to the current round
								if (match.round_number !== currentRound) {
									console.warn(
										"DEBUG: Match round mismatch:",
										{
											matchRound: match.round_number,
											currentRound,
										}
									);
								}

								const {
									player1,
									player2,
									player1_score,
									player2_score,
									winner,
								} = gameData;

								// Verify players match the tournament match
								if (
									(match.player1 !== player1 ||
										match.player2 !== player2) &&
									(match.player1 !== player2 ||
										match.player2 !== player1)
								) {
									console.error("DEBUG: Player mismatch:", {
										gameData: { player1, player2 },
										matchData: {
											player1: match.player1,
											player2: match.player2,
										},
									});
									return reject({
										success: false,
										error: "Player mismatch in tournament match",
									});
								}

								console.log(
									"DEBUG: Updating tournament match with:",
									{
										matchId,
										winner,
										player1_score,
										player2_score,
										tournamentId,
										currentRound,
									}
								);

								// Update tournament match
								const tournamentResult =
									await updateMatchAndRound(
										matchId,
										winner,
										player1_score,
										player2_score,
										tournamentId,
										currentRound
									);

								console.log(
									"DEBUG: Tournament update result:",
									tournamentResult
								);

								if (tournamentResult.success) {
									// Also save to match history for stats tracking
									try {
										const historyResult =
											await saveGameResult(
												gameData,
												lang
											);
										console.log(
											"DEBUG: History save result:",
											historyResult
										);

										resolve({
											success: true,
											type: "tournament",
											tournamentResult,
											historyResult,
											message:
												"Tournament match result updated successfully",
											debugInfo: {
												matchId,
												tournamentId,
												currentRound,
												winner,
												scores: {
													player1_score,
													player2_score,
												},
											},
										});
									} catch (historyError) {
										console.error(
											"DEBUG: Error saving to history:",
											historyError
										);
										// Tournament update succeeded but history failed
										resolve({
											success: true,
											type: "tournament",
											tournamentResult,
											historyResult: {
												success: false,
												error: historyError,
											},
											message:
												"Tournament match updated but history save failed",
											warning: "History not saved",
										});
									}
								} else {
									console.error(
										"DEBUG: Tournament update failed:",
										tournamentResult
									);
									reject(tournamentResult);
								}
							} catch (error) {
								console.error(
									"DEBUG: Error in tournament processing:",
									error
								);
								reject({
									success: false,
									error:
										"Error processing tournament match: " +
										error.message,
								});
							}
						}
					);
				} else {
					console.error(
						"DEBUG: Invalid tournament game ID format:",
						gameId
					);
					return reject({
						success: false,
						error: "Invalid tournament game ID format",
					});
				}
			} else if (gameId && gameId.length > 0) {
				// Check if this is a friend game invitation by looking for the gameId in game_invitations
				console.log("DEBUG: Checking if friend game:", gameId);
				db.get(
					`SELECT * FROM game_invitations WHERE match_id = ? AND status = 'accepted'`,
					[gameId],
					async (err, invitation) => {
						if (err) {
							console.error(
								"DEBUG: Error checking game invitation:",
								err
							);
							return reject({
								success: false,
								error:
									"Error checking game invitation: " +
									err.message,
							});
						}

						console.log(
							"DEBUG: Game invitation found:",
							invitation
						);

						if (invitation) {
							// This is a friend game
							try {
								console.log("DEBUG: Processing friend game");
								const result = await completeFriendGame(
									gameId,
									gameData,
									lang
								);
								console.log(
									"DEBUG: Friend game result:",
									result
								);
								resolve(result);
							} catch (error) {
								console.error(
									"DEBUG: Error processing friend game:",
									error
								);
								reject(error);
							}
						} else {
							// Regular game - just save to match history
							try {
								console.log("DEBUG: Processing regular game");
								const result = await saveGameResult(
									gameData,
									lang
								);
								console.log(
									"DEBUG: Regular game result:",
									result
								);
								resolve({
									success: true,
									type: "regular",
									result,
									message: "Game result saved successfully",
								});
							} catch (error) {
								console.error(
									"DEBUG: Error saving regular game:",
									error
								);
								reject(error);
							}
						}
					}
				);
			} else {
				// No gameId provided - treat as regular game
				try {
					console.log("DEBUG: Processing regular game (no gameId)");
					const result = await saveGameResult(gameData, lang);
					console.log("DEBUG: Regular game result:", result);
					resolve({
						success: true,
						type: "regular",
						result,
						message: "Game result saved successfully",
					});
				} catch (error) {
					console.error("DEBUG: Error saving regular game:", error);
					reject(error);
				}
			}
		} catch (error) {
			console.error(
				"DEBUG: Unexpected error in processGameResult:",
				error
			);
			reject({
				success: false,
				error:
					error.message || "Unexpected error processing game result",
			});
		}
	});
}

/**
 * Complete a friend game invitation by saving the result and updating the invitation status
 * @param {string} gameId - The game ID from the invitation (match_id)
 * @param {Object} gameData - Game result data
 * @param {string} lang - Language for messages
 * @returns {Promise<Object>} - Result of the operation
 */
export function completeFriendGame(gameId, gameData, lang = "en") {
	return new Promise((resolve, reject) => {
		// First save the game result
		saveGameResult(gameData, lang)
			.then((saveResult) => {
				if (saveResult.success) {
					// Update the game invitation status to completed (if it exists)
					db.run(
						`UPDATE game_invitations 
						 SET status = 'completed' 
						 WHERE match_id = ? AND status = 'accepted'`,
						[gameId],
						function (err) {
							if (err) {
								console.error(
									"Error updating invitation status:",
									err
								);
								// Still return success since game was saved
								resolve({
									success: true,
									type: "friend",
									result: saveResult,
									message:
										"Game saved but could not update invitation status",
									warning: "Invitation status update failed",
								});
							} else {
								resolve({
									success: true,
									type: "friend",
									result: saveResult,
									invitationUpdated: this.changes > 0,
									message:
										"Friend game completed successfully",
								});
							}
						}
					);
				} else {
					reject(saveResult);
				}
			})
			.catch(reject);
	});
}

/**
 * Clean up tournament match readiness records for completed matches
 * @param {number} matchId - Match ID to clean up
 * @returns {Promise<Object>} - Result of the operation
 */
export function cleanupTournamentMatchReadiness(matchId) {
	return new Promise((resolve, reject) => {
		db.run(
			`DELETE FROM tournament_match_readiness WHERE match_id = ?`,
			[matchId],
			function (err) {
				if (err) {
					reject({
						success: false,
						error: err.message,
					});
				} else {
					resolve({
						success: true,
						deletedRecords: this.changes,
						message: "Tournament match readiness cleaned up",
					});
				}
			}
		);
	});
}

/**
 * Get active games that need to be updated when they finish
 * @param {string} lang - Language for messages
 * @returns {Promise<Object>} - List of active games
 */
export function getActiveGames(lang = "en") {
	return new Promise((resolve, reject) => {
		// Get tournament matches that are ready but not completed
		db.all(
			`SELECT tm.*, 
					COUNT(tmr.user_id) as ready_players,
					t.name as tournament_name
			 FROM tournament_matches tm
			 LEFT JOIN tournament_match_readiness tmr ON tm.match_id = tmr.match_id
			 LEFT JOIN tournaments t ON tm.tournament_id = t.tournament_id
			 WHERE tm.match_state IN ('upcoming', 'in_progress')
			 GROUP BY tm.match_id
			 HAVING ready_players >= 2`,
			[],
			(err, tournamentMatches) => {
				if (err) {
					return reject({ success: false, error: err });
				}

				// Get active friend game invitations
				db.all(
					`SELECT gi.*, 
							u1.username as inviter_username,
							u2.username as invitee_username
					 FROM game_invitations gi
					 LEFT JOIN users u1 ON gi.inviter_id = u1.id
					 LEFT JOIN users u2 ON gi.invitee_id = u2.id
					 WHERE gi.status = 'accepted'`,
					[],
					(err, friendGames) => {
						if (err) {
							return reject({ success: false, error: err });
						}

						resolve({
							success: true,
							activeGames: {
								tournamentMatches: tournamentMatches || [],
								friendGames: friendGames || [],
							},
							message: "Active games retrieved successfully",
						});
					}
				);
			}
		);
	});
}

/**
 * Debug function to manually update a tournament match result
 * @param {number} tournamentId - Tournament ID
 * @param {number} matchId - Match ID
 * @param {number} winnerId - Winner user ID
 * @param {number} player1Score - Player 1 score
 * @param {number} player2Score - Player 2 score
 * @returns {Promise<Object>} - Result of the operation
 */
export function debugUpdateTournamentMatch(
	tournamentId,
	matchId,
	winnerId,
	player1Score,
	player2Score
) {
	return new Promise(async (resolve, reject) => {
		try {
			console.log("Debug: Updating tournament match manually");
			console.log("Params:", {
				tournamentId,
				matchId,
				winnerId,
				player1Score,
				player2Score,
			});

			// Get current round
			const currentRoundResult = await getCurrentRound(tournamentId);
			if (!currentRoundResult.success) {
				return reject({
					success: false,
					error: "Could not get current round",
				});
			}

			const currentRound = currentRoundResult.current_round;
			console.log("Current round:", currentRound);

			// Check if match exists
			db.get(
				`SELECT * FROM tournament_matches WHERE match_id = ? AND tournament_id = ?`,
				[matchId, tournamentId],
				async (err, match) => {
					if (err) {
						return reject({ success: false, error: err.message });
					}

					console.log("Match found:", match);

					if (!match) {
						return reject({
							success: false,
							error: "Match not found",
						});
					}

					// Update the match
					const updateResult = await updateMatchAndRound(
						matchId,
						winnerId,
						player1Score,
						player2Score,
						tournamentId,
						currentRound
					);

					console.log("Update result:", updateResult);
					resolve(updateResult);
				}
			);
		} catch (error) {
			console.error("Debug error:", error);
			reject({
				success: false,
				error: error.message,
			});
		}
	});
}

/**
 * Debug function to simulate a tournament match result for testing
 * @param {number} tournamentId - Tournament ID
 * @param {number} matchId - Match ID
 * @param {number} winnerId - Winner user ID
 * @param {number} player1Score - Player 1 score
 * @param {number} player2Score - Player 2 score
 * @returns {Promise<Object>} - Result of the operation
 */
export function debugSimulateTournamentResult(
	tournamentId,
	matchId,
	winnerId,
	player1Score,
	player2Score
) {
	return new Promise(async (resolve, reject) => {
		try {
			console.log("DEBUG: Simulating tournament result");
			console.log("DEBUG: Params:", {
				tournamentId,
				matchId,
				winnerId,
				player1Score,
				player2Score,
			});

			// Get match details first
			db.get(
				`SELECT * FROM tournament_matches WHERE match_id = ? AND tournament_id = ?`,
				[matchId, tournamentId],
				async (err, match) => {
					if (err) {
						console.error("DEBUG: Error getting match:", err);
						return reject({ success: false, error: err.message });
					}

					if (!match) {
						console.error("DEBUG: Match not found");
						return reject({
							success: false,
							error: "Match not found",
						});
					}

					console.log("DEBUG: Match found:", match);

					// Create game data object
					const gameData = {
						player1: match.player1,
						player2: match.player2,
						player1_score: player1Score,
						player2_score: player2Score,
						winner: winnerId,
					};

					console.log("DEBUG: Game data:", gameData);

					// Create game ID
					const gameId = `tournament_${tournamentId}_match_${matchId}`;
					console.log("DEBUG: Game ID:", gameId);

					// Process the result
					const result = await processGameResult(
						gameData,
						gameId,
						"en"
					);
					console.log("DEBUG: Process result:", result);

					resolve(result);
				}
			);
		} catch (error) {
			console.error("DEBUG: Simulation error:", error);
			reject({
				success: false,
				error: error.message || "Simulation failed",
			});
		}
	});
}

/**
 * Debug function to reset tournament match readiness for testing
 * @param {number} tournamentId - Tournament ID
 * @returns {Promise<Object>} - Result of the operation
 */
export function debugResetTournamentReadiness(tournamentId) {
	return new Promise((resolve, reject) => {
		console.log("DEBUG: Resetting tournament readiness for:", tournamentId);

		db.run(
			`DELETE FROM tournament_match_readiness WHERE tournament_id = ?`,
			[tournamentId],
			function (err) {
				if (err) {
					console.error("DEBUG: Error resetting readiness:", err);
					reject({ success: false, error: err.message });
				} else {
					console.log(
						"DEBUG: Readiness reset, deleted rows:",
						this.changes
					);
					resolve({
						success: true,
						deletedRows: this.changes,
						message: "Tournament readiness reset successfully",
					});
				}
			}
		);
	});
}
