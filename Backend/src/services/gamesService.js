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

export function joinTournament(tournamentName, tournamentId, userId, lang = "en") {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT * FROM tournaments WHERE tournament_id = ? AND name = ?`,
            [tournamentId, tournamentName],
            (err, row) => {
                if (err) return reject({ success: false, error: err });

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
                        if (err) return reject({ success: false, error: err });

                        if (existingPlayer) {
                            return resolve({
                                success: false,
                                message: messages[lang].alreadyJoined || "You already joined this tournament.",
                            });
                        }

                        db.run(
                            `INSERT INTO tournament_players (tournament_id, tournament_name, player_id, current_position, wins, losses)
                             VALUES (?, ?, ?, 0, 0, 0)`,
                            [tournamentId, tournamentName, userId],
                            function (err) {
                                if (err) return reject({ success: false, error: err });

                                db.run(
                                    `UPDATE tournaments SET PLAYER_COUNT = PLAYER_COUNT + 1 WHERE tournament_id = ?`,
                                    [tournamentId],
                                    (err) => {
                                        if (err) return reject({ success: false, error: err });

                                        // Check if tournament is full
                                        db.get(
                                            `SELECT PLAYER_COUNT, max_players FROM tournaments WHERE tournament_id = ?`,
                                            [tournamentId],
                                            (err, tournament) => {
                                                if (err) return reject({ success: false, error: err });

                                                if (tournament.PLAYER_COUNT === tournament.max_players) {
                                                    // Generate matches
                                                    generateTournamentMatches(tournamentId, tournament.max_players)
                                                        .then(() => {
                                                            resolve({
                                                                success: true,
                                                                message: messages[lang].tournamentJoined,
                                                            });
                                                        })
                                                        .catch((err) => {
                                                            reject({ success: false, error: err });
                                                        });
                                                } else {
                                                    resolve({
                                                        success: true,
                                                        message: messages[lang].tournamentJoined,
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

                // Gerar apenas a primeira rodada
                const roundNumber = 1;
                const roundMatches = [];

                for (let i = 0; i < players.length; i += 2) {
                    const player1 = players[i];
                    const player2 = players[i + 1];

                    // Adicionar partida à lista de partidas da primeira rodada
                    roundMatches.push({
                        tournament_id: tournamentId,
                        player1: player1.player_id,
                        player2: player2.player_id,
                        round_number: roundNumber,
                        scheduled_date: new Date(Date.now() + roundNumber * 24 * 60 * 60 * 1000), // Exemplo: agendar para amanhã
                    });
                }

                const insertPromises = roundMatches.map((match) =>
                    new Promise((resolve, reject) => {
                        db.run(
                            `INSERT INTO tournament_matches (tournament_id, player1, player2, round, scheduled_date)
                             VALUES (?, ?, ?, ?, ?)`,
                            [
                                match.tournament_id,
                                match.player1,
                                match.player2,
                                match.round_number,
                                match.scheduled_date,
                            ],
                            (err) => {
                                if (err) return reject(err);

                                db.run(
                                    `INSERT INTO upcoming_tournament_matches (tournament_id, player1, player2, round_number, scheduled_date)
                                     VALUES (?, ?, ?, ?, ?)`,
                                    [
                                        match.tournament_id,
                                        match.player1,
                                        match.player2,
                                        match.round_number,
                                        match.scheduled_date,
                                    ],
                                    (upcomingErr) => {
                                        if (upcomingErr) return reject(upcomingErr);
                                        resolve();
                                    }
                                );
                            }
                        );
                    })
                );

                Promise.all(insertPromises)
                    .then(() => resolve())
                    .catch((err) => reject(err));
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
			"SELECT * FROM upcoming_tournament_matches WHERE tournament_id = ?",
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
							`INSERT INTO game_invitations (inviter_id, invitee_id, game_id) 
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
												game_id: gameId,
												status: "pending",
												inviter_username:
													inviter.username,
											}
										);

										resolve({
											success: true,
											invitation: {
												id: this.lastID,
												game_id: gameId,
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
							gameId: accept ? invitation.game_id : null,
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
												gameId: invitation.game_id,
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

				// Update or insert the stats
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

