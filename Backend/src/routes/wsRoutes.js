import { getUserById } from "../../src/services/usersServices.js";
import db from "../../db/dataBase.js";
import { onlineUsers, userConnections } from "../utils/userStatus.js";

const connections = new Set();
const gameRooms = new Map(); // gameId -> { player1: conn, player2: conn, gameState: {...} }

// Add this function to expose session status
export function getUserSessionInfo(userId) {
	return {
		isActive: onlineUsers.has(userId),
		hasConnection: userConnections.has(userId),
	};
}

function broadcastOnlineUsers() {
	const userIds = Array.from(onlineUsers);
	const message = JSON.stringify({ type: "onlineFriends", userIds });
	for (const conn of connections) {
		try {
			conn.send(message);
		} catch (e) {}
	}
}

export function sendGameInvitationNotification(userId, invitation) {
	const connection = userConnections.get(userId);
	if (connection && connection.readyState === 1) {
		// WebSocket.OPEN
		try {
			// Check if this is an invitation acceptance notification
			if (invitation.type === "invitationAccepted") {
				connection.send(JSON.stringify(invitation));
			} else {
				// Regular game invitation
				connection.send(
					JSON.stringify({
						type: "gameInvitation",
						invitation: invitation,
					})
				);
			}
		} catch (e) {
			console.error("Failed to send game invitation notification:", e);
		}
	}
}

/**
 * Check if a game ID is valid for multiplayer (exists in matchmaking)
 */
async function isValidGameId(gameId) {
	if (!gameId) return false;

	// Check if this gameId exists in matchmaking table
	return new Promise((resolve) => {
		db.get(
			"SELECT COUNT(*) as count FROM matchmaking WHERE game_id = ? AND status = 'matched'",
			[gameId],
			(err, result) => {
				if (err) {
					console.error("Error checking game validity:", err);
					resolve(false);
				} else {
					resolve(result.count >= 2); // Should have exactly 2 players
				}
			}
		);
	});
}

export default async function (fastify) {
	fastify.get("/ws", { websocket: true }, async (connection, req) => {
		let userId;
		let gameId = null;

		try {
			const token = req.query.token;
			const gameIdParam = req.query.gameId;

			if (!token) throw new Error("No token provided");
			let decoded;
			try {
				decoded = fastify.jwt.verify(token);
			} catch (err) {
				fastify.log.error("WebSocket JWT verification failed:", err);
				if (connection) {
					connection.close();
				}
				return;
			}
			userId = decoded.id;
			gameId = gameIdParam;

			onlineUsers.add(userId);
			connections.add(connection);
			userConnections.set(userId, connection);
			broadcastOnlineUsers();

			// If gameId is provided, add to game room
			if (gameId) {
				console.log(
					"DEBUG: User",
					userId,
					"connecting to game",
					gameId
				);

				// For multiplayer games, validate the gameId
				if (gameId.startsWith("game_")) {
					const isValid = await isValidGameId(gameId);
					if (!isValid) {
						console.log(
							"DEBUG: Invalid game ID",
							gameId,
							"for user",
							userId
						);
						connection.close(4001, "Invalid game ID");
						return;
					}
				}

				if (!gameRooms.has(gameId)) {
					console.log("DEBUG: Creating new game room for", gameId);
					gameRooms.set(gameId, {
						player1: null,
						player2: null,
						gameState: {
							leftY: 218, // fieldHeight/2 - paddleHeight/2 (500/2 - 64/2)
							rightY: 218,
							ballX: 415, // fieldWidth/2 - ballWidth/2 (850/2 - 20/2)
							ballY: 240, // fieldHeight/2 - ballHeight/2 (500/2 - 20/2)
							ballVX: 0,
							ballVY: 0,
							leftScore: 0,
							rightScore: 0,
							gameStarted: false,
							winner: null,
						},
					});
				}

				const room = gameRooms.get(gameId);
				console.log("DEBUG: Current room state:", {
					player1: room.player1 ? room.player1.userId : null,
					player2: room.player2 ? room.player2.userId : null,
				});

				// Get user info from database
				const userResult = await getUserById(userId);
				const username = userResult.success
					? userResult.user.username
					: `Player${userId}`;

				// Check if user is already in the room (reconnection)
				let isReconnection = false;
				if (room.player1 && room.player1.userId === userId) {
					console.log(
						"DEBUG: User",
						userId,
						"reconnecting as player1"
					);
					room.player1.connection = connection;
					isReconnection = true;
				} else if (room.player2 && room.player2.userId === userId) {
					console.log(
						"DEBUG: User",
						userId,
						"reconnecting as player2"
					);
					room.player2.connection = connection;
					isReconnection = true;
				}

				// If not reconnection, add as new player
				if (!isReconnection) {
					if (!room.player1) {
						console.log(
							"DEBUG: Adding user",
							userId,
							"as player1 (left)"
						);
						room.player1 = {
							connection,
							userId,
							side: "left",
							username,
						};
					} else if (!room.player2) {
						console.log(
							"DEBUG: Adding user",
							userId,
							"as player2 (right)"
						);
						room.player2 = {
							connection,
							userId,
							side: "right",
							username,
						};
					} else {
						console.log(
							"DEBUG: Game room",
							gameId,
							"is full, rejecting connection"
						);
						connection.close(4000, "Game room is full");
						return;
					}
				}

				// Only notify players when both are connected
				if (room.player1 && room.player2) {
					console.log(
						"DEBUG: Both players connected, sending gameReady messages"
					);

					// Send individual messages to each player with their correct side and player names
					const readyMessageLeft = JSON.stringify({
						type: "gameReady",
						yourSide: "left",
						leftPlayerName: room.player1.username,
						rightPlayerName: room.player2.username,
						leftPlayerId: room.player1.userId,
						rightPlayerId: room.player2.userId,
						gameState: room.gameState,
					});
					const readyMessageRight = JSON.stringify({
						type: "gameReady",
						yourSide: "right",
						leftPlayerName: room.player1.username,
						rightPlayerName: room.player2.username,
						leftPlayerId: room.player1.userId,
						rightPlayerId: room.player2.userId,
						gameState: room.gameState,
					});

					try {
						if (
							room.player1.connection &&
							room.player1.connection.readyState === 1
						) {
							room.player1.connection.send(readyMessageLeft);
						}
						if (
							room.player2.connection &&
							room.player2.connection.readyState === 1
						) {
							room.player2.connection.send(readyMessageRight);
						}
					} catch (error) {
						console.error(
							"DEBUG: Error sending gameReady messages:",
							error
						);
					}
				} else {
					console.log(
						"DEBUG: Waiting for second player to connect..."
					);
					// Send a waiting message to the connected player
					const waitingMessage = JSON.stringify({
						type: "waitingForOpponent",
						message: "Waiting for opponent to connect...",
					});

					try {
						if (
							room.player1 &&
							room.player1.connection.readyState === 1
						) {
							room.player1.connection.send(waitingMessage);
						}
						if (
							room.player2 &&
							room.player2.connection.readyState === 1
						) {
							room.player2.connection.send(waitingMessage);
						}
					} catch (error) {
						console.error(
							"DEBUG: Error sending waiting message:",
							error
						);
					}
				}
			}
		} catch (e) {
			fastify.log.error("WebSocket authentication failed:", e);
			if (connection) {
				connection.close();
			}
			return;
		}

		connection.on("message", (message) => {
			try {
				const data = JSON.parse(message.toString());

				if (gameId && gameRooms.has(gameId)) {
					const room = gameRooms.get(gameId);
					const player =
						room.player1?.userId === userId
							? room.player1
							: room.player2;
					const otherPlayer =
						room.player1?.userId === userId
							? room.player2
							: room.player1;

					if (data.type === "paddleMove") {
						// Update paddle position
						if (player?.side === "left") {
							room.gameState.leftY = data.y;
						} else if (player?.side === "right") {
							room.gameState.rightY = data.y;
						}

						// Broadcast to other player
						if (otherPlayer) {
							otherPlayer.connection.send(
								JSON.stringify({
									type: "paddleUpdate",
									side: player.side,
									y: data.y,
								})
							);
						}
					} else if (
						data.type === "ballUpdate" &&
						player?.side === "left"
					) {
						// Only left player (host) can update ball
						room.gameState.ballX = data.ballX;
						room.gameState.ballY = data.ballY;
						room.gameState.ballVX = data.ballVX;
						room.gameState.ballVY = data.ballVY;
						room.gameState.gameStarted = data.gameStarted;

						// Broadcast to other player
						if (otherPlayer) {
							otherPlayer.connection.send(
								JSON.stringify({
									type: "ballUpdate",
									ballX: data.ballX,
									ballY: data.ballY,
									ballVX: data.ballVX,
									ballVY: data.ballVY,
									gameStarted: data.gameStarted,
								})
							);
						}
					} else if (
						data.type === "scoreUpdate" &&
						player?.side === "left"
					) {
						// Only left player can update score
						room.gameState.leftScore = data.leftScore;
						room.gameState.rightScore = data.rightScore;
						room.gameState.winner = data.winner;

						// Broadcast to other player
						if (otherPlayer) {
							otherPlayer.connection.send(
								JSON.stringify({
									type: "scoreUpdate",
									leftScore: data.leftScore,
									rightScore: data.rightScore,
									winner: data.winner,
								})
							);
						}
					} else if (data.type === "giveUp") {
						// Player is giving up - notify opponent they win
						if (otherPlayer && !room.gameState.winner) {
							otherPlayer.connection.send(
								JSON.stringify({
									type: "opponentLeft",
									winner: otherPlayer.side, // The remaining player wins
								})
							);
						}
					} else if (data.type === "pauseGame") {
						// Player paused the game - notify opponent
						if (otherPlayer) {
							otherPlayer.connection.send(
								JSON.stringify({
									type: "gamePaused",
								})
							);
						}
					} else if (data.type === "resumeGame") {
						// Player resumed the game - notify opponent
						if (otherPlayer) {
							otherPlayer.connection.send(
								JSON.stringify({
									type: "gameResumed",
								})
							);
						}
					}
				}
			} catch (e) {
				fastify.log.error("WebSocket message parse error:", e);
			}
		});

		connection.on("close", () => {
			onlineUsers.delete(userId);
			connections.delete(connection);
			userConnections.delete(userId);
			broadcastOnlineUsers();

			if (userId) {
				db.run(
					"DELETE FROM matchmaking WHERE user_id = ?",
					[userId],
					function (err) {
						if (err) {
							console.error(
								"Error cleaning up matchmaking on disconnect:",
								err
							);
						}
					}
				);
			}

			// Remove from game room and notify other player
			if (gameId && gameRooms.has(gameId)) {
				const room = gameRooms.get(gameId);
				let otherPlayer = null;

				if (room.player1?.userId === userId) {
					otherPlayer = room.player2;
					room.player1 = null;
				}
				if (room.player2?.userId === userId) {
					otherPlayer = room.player1;
					room.player2 = null;
				}

				// Notify other player that opponent left
				if (otherPlayer && !room.gameState.winner) {
					otherPlayer.connection.send(
						JSON.stringify({
							type: "opponentLeft",
							winner: otherPlayer.side, // The remaining player wins
						})
					);
				}

				// If room is empty, delete it
				if (!room.player1 && !room.player2) {
					gameRooms.delete(gameId);
				}
			}
		});
	});
}
