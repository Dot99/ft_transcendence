import { getUserById } from "../services/usersServices.js";

const onlineUsers = new Set();
const connections = new Set();
const gameRooms = new Map(); // gameId -> { player1: conn, player2: conn, gameState: {...} }
const userConnections = new Map(); // userId -> connection

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
	if (connection && connection.readyState === 1) { // WebSocket.OPEN
		try {
			// Check if this is an invitation acceptance notification
			if (invitation.type === "invitationAccepted") {
				connection.send(JSON.stringify(invitation));
			} else {
				// Regular game invitation
				connection.send(JSON.stringify({
					type: "gameInvitation",
					invitation: invitation
				}));
			}
		} catch (e) {
			console.error("Failed to send game invitation notification:", e);
		}
	}
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
				if (!gameRooms.has(gameId)) {
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
							winner: null
						}
					});
				}
				
				const room = gameRooms.get(gameId);
				
				// Get user info from database
				const userResult = await getUserById(userId);
				const username = userResult.success ? userResult.user.username : `Player${userId}`;
				
				if (!room.player1) {
					room.player1 = { connection, userId, side: 'left', username };
				} else if (!room.player2) {
					room.player2 = { connection, userId, side: 'right', username };
				}
				
				// Notify both players when room is ready
				if (room.player1 && room.player2) {
					// Send individual messages to each player with their correct side and player names
					const readyMessageLeft = JSON.stringify({ 
						type: "gameReady", 
						yourSide: 'left',
						leftPlayerName: room.player1.username,
						rightPlayerName: room.player2.username,
						leftPlayerId: room.player1.userId,
						rightPlayerId: room.player2.userId,
						gameState: room.gameState
					});
					const readyMessageRight = JSON.stringify({ 
						type: "gameReady", 
						yourSide: 'right',
						leftPlayerName: room.player1.username,
						rightPlayerName: room.player2.username,
						leftPlayerId: room.player1.userId,
						rightPlayerId: room.player2.userId,
						gameState: room.gameState
					});
					
					room.player1.connection.send(readyMessageLeft);
					room.player2.connection.send(readyMessageRight);
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
					const player = room.player1?.userId === userId ? room.player1 : room.player2;
					const otherPlayer = room.player1?.userId === userId ? room.player2 : room.player1;
					
					if (data.type === "paddleMove") {
						// Update paddle position
						if (player?.side === 'left') {
							room.gameState.leftY = data.y;
						} else if (player?.side === 'right') {
							room.gameState.rightY = data.y;
						}
						
						// Broadcast to other player
						if (otherPlayer) {
							otherPlayer.connection.send(JSON.stringify({
								type: "paddleUpdate",
								side: player.side,
								y: data.y
							}));
						}
					} else if (data.type === "ballUpdate" && player?.side === 'left') {
						// Only left player (host) can update ball
						room.gameState.ballX = data.ballX;
						room.gameState.ballY = data.ballY;
						room.gameState.ballVX = data.ballVX;
						room.gameState.ballVY = data.ballVY;
						room.gameState.gameStarted = data.gameStarted;
						
						// Broadcast to other player
						if (otherPlayer) {
							otherPlayer.connection.send(JSON.stringify({
								type: "ballUpdate",
								ballX: data.ballX,
								ballY: data.ballY,
								ballVX: data.ballVX,
								ballVY: data.ballVY,
								gameStarted: data.gameStarted
							}));
						}
					} else if (data.type === "scoreUpdate" && player?.side === 'left') {
						// Only left player can update score
						room.gameState.leftScore = data.leftScore;
						room.gameState.rightScore = data.rightScore;
						room.gameState.winner = data.winner;
						
						// Broadcast to other player
						if (otherPlayer) {
							otherPlayer.connection.send(JSON.stringify({
								type: "scoreUpdate",
								leftScore: data.leftScore,
								rightScore: data.rightScore,
								winner: data.winner
							}));
						}
					} else if (data.type === "giveUp") {
						// Player is giving up - notify opponent they win
						if (otherPlayer && !room.gameState.winner) {
							otherPlayer.connection.send(JSON.stringify({
								type: "opponentLeft",
								winner: otherPlayer.side // The remaining player wins
							}));
						}
					} else if (data.type === "pauseGame") {
						// Player paused the game - notify opponent
						if (otherPlayer) {
							otherPlayer.connection.send(JSON.stringify({
								type: "gamePaused"
							}));
						}
					} else if (data.type === "resumeGame") {
						// Player resumed the game - notify opponent
						if (otherPlayer) {
							otherPlayer.connection.send(JSON.stringify({
								type: "gameResumed"
							}));
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
					otherPlayer.connection.send(JSON.stringify({
						type: "opponentLeft",
						winner: otherPlayer.side // The remaining player wins
					}));
				}
				
				// If room is empty, delete it
				if (!room.player1 && !room.player2) {
					gameRooms.delete(gameId);
				}
			}
		});
	});
}
