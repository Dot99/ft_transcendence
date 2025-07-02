import { playTemplate } from "./templates/playTemplate.js";
import { getCookie, getUserIdFromToken } from "./utils/auth.js";
import { WS_BASE_URL } from "./config.js";

// Utility to get element by id
const getElement = <T extends HTMLElement>(id: string): T => {
	const element = document.getElementById(id) as T;
	if (!element) throw new Error(`Element with id ${id} not found`);
	return element;
};

export const loadPlayPage = async (): Promise<void> => {
	const app = getElement<HTMLElement>("app");
	app.innerHTML = playTemplate;

	// Fetch user info and update the player panel
	let playerUsername = "Player";
	try {
		const jwt = getCookie("jwt");
		if (jwt) {
			const userId = getUserIdFromToken();
			const res = await fetch(`/api/users/${userId}`, {
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			});
			if (res.ok) {
				const data = await res.json();
				const user = data.user;
				playerUsername = user.username || "Player";
				getElement<HTMLElement>("player-username").textContent = playerUsername;
				const avatar = getElement<HTMLImageElement>("player-avatar");
				if (user.pfp) {
					// Check if it's an external URL or local file
					if (user.pfp.startsWith('http://') || user.pfp.startsWith('https://')) {
						avatar.src = user.pfp; // External URL
					} else {
						avatar.src = `/images/${user.pfp}`; // Local file
					}
				} else {
					avatar.src = "/images/default_pfp.png";
				}
				avatar.style.display = "";
				// Handle broken images
				avatar.onerror = () => {
					avatar.src = "/images/default_pfp.png";
				};
			} else {
				// If user fetch fails, show default avatar
				const avatar = getElement<HTMLImageElement>("player-avatar");
				avatar.src = "/images/default_pfp.png";
				avatar.style.display = "";
			}
		} else {
			// If no JWT, show default avatar
			const avatar = getElement<HTMLImageElement>("player-avatar");
			avatar.src = "/images/default_pfp.png";
			avatar.style.display = "";
		}
	} catch {
		// If any error, show default avatar
		const avatar = getElement<HTMLImageElement>("player-avatar");
		avatar.src = "/images/default_pfp.png";
		avatar.style.display = "";
	}

	// Winner Modal elements
	const winnerModal = getElement<HTMLDivElement>("winnerModal");
	const winnerUsernameSpan = getElement<HTMLElement>("winnerUsername");
	const playAgainBtn = getElement<HTMLButtonElement>("playAgainBtn");
	const menuBtn = getElement<HTMLButtonElement>("menuBtn");

	function showWinnerModal(winnerSide: "left" | "right") {
		winnerUsernameSpan.textContent = winnerSide === "left"
			? leftPlayerName
			: rightPlayerName;
		winnerModal.classList.remove("hidden");
	}

	function hideWinnerModal() {
		winnerModal.classList.add("hidden");
	}

	playAgainBtn.addEventListener("click", () => {
		hideWinnerModal();
		clearBannerGlow();
		winner = null;
		hasGameStartedOnce = false;
		resetGame();
	});
	menuBtn.addEventListener("click", () => {
		hideWinnerModal();
		if (ws) {
			ws.close();
		}
		window.dispatchEvent(new Event("loadMenuPage"));
	});

	const canvas = getElement<HTMLCanvasElement>("pong-canvas");
	const ctx = canvas.getContext("2d")!;

	const paddleWidth = 16, paddleHeight = 64, paddleSpeed = 6;
	const ballWidth = 20, ballHeight = 20, ballSpeed = 4;
	const fieldWidth = canvas.width, fieldHeight = canvas.height;

	let leftY = fieldHeight / 2 - paddleHeight / 2;
	let rightY = fieldHeight / 2 - paddleHeight / 2;
	let leftYOld = leftY; // Track previous paddle positions for multiplayer
	let rightYOld = rightY;
	let ballX = fieldWidth / 2 - ballWidth / 2, ballY = fieldHeight / 2 - ballHeight / 2;
	let ballVX = 0, ballVY = 0;
	let leftScore = 0, rightScore = 0;
	let gameStarted = false;
	const keys: Record<string, boolean> = { w: false, s: false, ArrowUp: false, ArrowDown: false };

	let winner: "left" | "right" | null = null;
	let hasGameStartedOnce = false;
	let showPressSpace = true;
	let paused = false;
	let opponentDisplayName = "Bot";
	let leftPlayerName = "Player 1";
	let rightPlayerName = "Player 2";
	let leftPlayerCustomization = {
		paddle_color: "#4CF190",
		ball_color: "#4CF190", 
		board_color: "#07303c",
		border_color: "#4CF190"
	};
	let rightPlayerCustomization = {
		paddle_color: "#4CF190",
		ball_color: "#4CF190",
		board_color: "#07303c", 
		border_color: "#4CF190"
	};
	let isMultiplayer = false;
	let playerSide: "left" | "right" = "left";
	let ws: WebSocket | null = null;
	let gameId: string | null = null;

	// Check PvP
	const opponentUsername = sessionStorage.getItem("pvpOpponent");
	const gameIdFromSession = sessionStorage.getItem("gameId");
	
	if (opponentUsername && gameIdFromSession) {
		isMultiplayer = true;
		gameId = gameIdFromSession;
		opponentDisplayName = opponentUsername;

		// Clean up session storage
		sessionStorage.removeItem("pvpOpponent");
		sessionStorage.removeItem("gameId");
		// Connect to WebSocket for multiplayer game
		connectToGame();
	}

	function updateScoreDisplay() {
		getElement("player-score").textContent = leftScore.toString().padStart(2, "0");
		getElement("bot-score").textContent = rightScore.toString().padStart(2, "0");
	}

	async function fetchUserCustomization(userId: number) {
		try {
			const res = await fetch(`/api/games/costumization/${userId}`, {
				headers: {
					Authorization: `Bearer ${getCookie("jwt")}`,
				},
			});
			if (res.ok) {
				return await res.json();
			}
		} catch (error) {
			console.log("Error fetching user customization:", error);
		}
		// Return default customization if fetch fails
		return {
			paddle_color: "#4CF190",
			ball_color: "#4CF190",
			board_color: "#07303c",
			border_color: "#4CF190"
		};
	}

	async function fetchUserProfile(userId: number) {
		try {
			const res = await fetch(`/api/users/${userId}`, {
				headers: {
					Authorization: `Bearer ${getCookie("jwt")}`,
				},
			});
			if (res.ok) {
				const data = await res.json();
				return data.user;
			}
		} catch (error) {
			console.log("Error fetching user profile:", error);
		}
		return null;
	}

	function updateGameAreaStyling() {
		// Get current player's customization for border and background
		const currentPlayerCustomization = isMultiplayer 
			? (playerSide === "left" ? leftPlayerCustomization : rightPlayerCustomization)
			: leftPlayerCustomization;

		// Update game area border and background
		const gameArea = document.querySelector('.relative.w-\\[850px\\].h-\\[500px\\]') as HTMLElement;
		if (gameArea) {
			gameArea.style.borderColor = currentPlayerCustomization.border_color;
			gameArea.style.backgroundColor = currentPlayerCustomization.board_color;
		}

		// Update center line color
		const centerLineDivs = document.querySelectorAll('.w-1.h-8.bg-\\[\\#4CF190\\]');
		centerLineDivs.forEach(div => {
			(div as HTMLElement).style.backgroundColor = currentPlayerCustomization.border_color;
		});
	}

	function connectToGame() {
		if (!gameId) return;
		const wsUrl = `${WS_BASE_URL}/api/ws?token=${getCookie("jwt")}&gameId=${gameId}`;		
		ws = new WebSocket(wsUrl);
		
		ws.onopen = () => {
			console.log("Connected to game WebSocket");
		};
		
		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				
				if (data.type === "gameReady") {
					playerSide = data.yourSide;
					// Set player names consistently - left panel = left player, right panel = right player
					if (data.leftPlayerName && data.rightPlayerName) {
						leftPlayerName = data.leftPlayerName;
						rightPlayerName = data.rightPlayerName;
						getElement<HTMLElement>("player-username").textContent = leftPlayerName;
						getElement<HTMLElement>("bot-username").textContent = rightPlayerName;
						
						// Fetch customization and profile data for both players
						if (data.leftPlayerId && data.rightPlayerId) {		
							// Always reset customizations to avoid stale data
							leftPlayerCustomization = {
								paddle_color: "#4CF190",
								ball_color: "#4CF190",
								board_color: "#07303c",
								border_color: "#4CF190"
							};
							rightPlayerCustomization = {
								paddle_color: "#4CF190",
								ball_color: "#4CF190",
								board_color: "#07303c",
								border_color: "#4CF190"
							};
							
							// Fetch both players' data simultaneously and wait for both to complete
							const leftPlayerPromise = Promise.all([
								fetchUserCustomization(data.leftPlayerId),
								fetchUserProfile(data.leftPlayerId)
							]);
							
							const rightPlayerPromise = Promise.all([
								fetchUserCustomization(data.rightPlayerId),
								fetchUserProfile(data.rightPlayerId)
							]);
							
							// Wait for both players' data to load
							Promise.all([leftPlayerPromise, rightPlayerPromise]).then(([[leftCustom, leftProfile], [rightCustom, rightProfile]]) => {
								// Update customizations
								leftPlayerCustomization = leftCustom;
								rightPlayerCustomization = rightCustom;
								
								// Preload and validate both avatar images before assigning
								const preloadPromises = [];
								
								// Preload left avatar
								if (leftProfile && leftProfile.pfp) {
									const leftAvatarSrc = leftProfile.pfp.startsWith('http://') || leftProfile.pfp.startsWith('https://') 
										? leftProfile.pfp 
										: `/images/${leftProfile.pfp}`;
									
									preloadPromises.push(new Promise((resolve) => {
										const img = new Image();
										img.onload = () => {
											resolve({ side: 'left', src: leftAvatarSrc, success: true });
										};
										img.onerror = () => {
											resolve({ side: 'left', src: '/images/default_pfp.png', success: false });
										};
										img.src = leftAvatarSrc;
									}));
								} else {
									preloadPromises.push(Promise.resolve({ side: 'left', src: '/images/default_pfp.png', success: true }));
								}
								
								// Preload right avatar
								if (rightProfile && rightProfile.pfp) {
									const rightAvatarSrc = rightProfile.pfp.startsWith('http://') || rightProfile.pfp.startsWith('https://') 
										? rightProfile.pfp 
										: `/images/${rightProfile.pfp}`;
									
									preloadPromises.push(new Promise((resolve) => {
										const img = new Image();
										img.onload = () => {
											resolve({ side: 'right', src: rightAvatarSrc, success: true });
										};
										img.onerror = () => {
											resolve({ side: 'right', src: '/images/default_pfp.png', success: false });
										};
										img.src = rightAvatarSrc;
									}));
								} else {
									preloadPromises.push(Promise.resolve({ side: 'right', src: '/images/default_pfp.png', success: true }));
								}
								
								// Wait for both preloads to complete, then assign the validated images
								type AvatarPreloadResult = { side: 'left' | 'right', src: string, success: boolean };
								Promise.all(preloadPromises).then((results) => {
									const typedResults = results as AvatarPreloadResult[];									
									const leftResult = typedResults.find((r) => r.side === 'left');
									const rightResult = typedResults.find((r) => r.side === 'right');			
									// Set left player avatar with preloaded/validated URL
									const leftPanelAvatar = getElement<HTMLImageElement>("player-avatar");
									if (leftResult) {
										leftPanelAvatar.src = leftResult.src;
									}
									leftPanelAvatar.style.display = "";
									// Set right player avatar with preloaded/validated URL
									const rightAvatar = document.querySelector("#bot-banner img") as HTMLImageElement;
									if (rightAvatar && rightResult) {
										rightAvatar.src = rightResult.src;
										rightAvatar.alt = rightProfile ? rightProfile.username : "Player";
									} else if (rightResult) {
										const botBanner = getElement("bot-banner");
										const username = rightProfile ? rightProfile.username : "Player";
										const avatarImg = `<img src="${rightResult.src}" alt="${username}" class="w-24 h-24 rounded" />`;
										botBanner.innerHTML = avatarImg;
									}
									
									// Update styling after all data is loaded
									updateGameAreaStyling();
									
									// Final verification
									setTimeout(() => {
										const leftAvatar = getElement<HTMLImageElement>("player-avatar");
										const rightAvatar = document.querySelector("#bot-banner img") as HTMLImageElement;
									}, 100);
								});
							}).catch(error => {
								console.error('Error loading player data:', error);
							});
						}
					}
					
					// Update game state
					leftY = data.gameState.leftY;
					rightY = data.gameState.rightY;
					ballX = data.gameState.ballX;
					ballY = data.gameState.ballY;
					ballVX = data.gameState.ballVX;
					ballVY = data.gameState.ballVY;
					leftScore = data.gameState.leftScore;
					rightScore = data.gameState.rightScore;
					gameStarted = data.gameState.gameStarted;
					winner = data.gameState.winner;
					
					updateScoreDisplay();
				} else if (data.type === "paddleUpdate") {
					if (data.side === "left") {
						leftY = data.y;
					} else if (data.side === "right") {
						rightY = data.y;
					}
				} else if (data.type === "ballUpdate") {
					ballX = data.ballX;
					ballY = data.ballY;
					ballVX = data.ballVX;
					ballVY = data.ballVY;
					gameStarted = data.gameStarted;
				} else if (data.type === "scoreUpdate") {
					leftScore = data.leftScore;
					rightScore = data.rightScore;
					winner = data.winner;
					updateScoreDisplay();
					
					if (winner) {
						setBannerGlow(winner);
						showWinnerModal(winner);
						gameStarted = false;
					}
				} else if (data.type === "opponentLeft") {
					// Opponent left the game - you win!
					winner = data.winner;
					gameStarted = false;
					if (winner) {
						setBannerGlow(winner);
						showWinnerModal(winner);
					}
				}
			} catch (e) {
				console.error("WebSocket message parse error:", e);
			}
		};
		
		ws.onclose = () => {
			console.log("WebSocket connection closed");
		};
		
		ws.onerror = (error) => {
			console.error("WebSocket error:", error);
		};
	}

	function setBannerGlow(winnerSide: "left" | "right" | null) {
		getElement("player-banner").classList.remove("winner-banner");
		getElement("bot-banner").classList.remove("winner-banner");
		getElement("player-score").classList.remove("score-glow-winner");
		getElement("bot-score").classList.remove("score-glow-winner");
		if (winnerSide === "left") {
			getElement("player-banner").classList.add("winner-banner");
			getElement("player-score").classList.add("score-glow-winner");
		} else if (winnerSide === "right") {
			getElement("bot-banner").classList.add("winner-banner");
			getElement("bot-score").classList.add("score-glow-winner");
		}
	}

	function clearBannerGlow() {
		getElement("player-banner").classList.remove("winner-banner");
		getElement("bot-banner").classList.remove("winner-banner");
		getElement("player-score").classList.remove("score-glow-winner");
		getElement("bot-score").classList.remove("score-glow-winner");
	}

	// Button actions
	winnerModal.querySelector("#playAgainBtn")?.addEventListener("click", () => {
		hideWinnerModal();
		clearBannerGlow();
		winner = null;
		hasGameStartedOnce = false;
		resetGame();
	});
	winnerModal.querySelector("#menuBtn")?.addEventListener("click", () => {
		hideWinnerModal();
		window.dispatchEvent(new Event("loadMenuPage"));
	});

	const giveUpBtn = getElement<HTMLButtonElement>("giveUpBtn");
	const giveUpModal = getElement<HTMLDivElement>("giveUpModal");
	const continueGameBtn = getElement<HTMLButtonElement>("continueGameBtn");
	const giveUpMenuBtn = getElement<HTMLButtonElement>("giveUpMenuBtn");

	giveUpBtn.addEventListener("click", () => {
		giveUpModal.classList.remove("hidden");
		paused = true;
	});
	continueGameBtn.addEventListener("click", () => {
		giveUpModal.classList.add("hidden");
		paused = false;
	});
	giveUpMenuBtn.addEventListener("click", async () => {
		giveUpModal.classList.add("hidden");
		paused = false;
		
		// In multiplayer, notify the opponent that you're giving up
		if (isMultiplayer && ws) {
			ws.send(JSON.stringify({
				type: "giveUp"
			}));
		}
		
		// Clean up matchmaking status on the backend
		try {
			await fetch('/api/matchmaking/leave', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${getCookie("jwt")}`,
					'Content-Type': 'application/json'
				}
			});
		} catch (e) {
			console.log("Failed to leave matchmaking:", e);
		}
		
		// Close WebSocket connection
		if (ws) {
			ws.close();
			ws = null;
		}
		
		// Clean up game state
		isMultiplayer = false;
		gameId = null;
		playerSide = "left";
		gameStarted = false;
		winner = null;
		hasGameStartedOnce = false;
		
		// Clean up any remaining session storage
		sessionStorage.removeItem("pvpOpponent");
		sessionStorage.removeItem("gameId");
		
		window.dispatchEvent(new Event("loadMenuPage"));
	});

	function startGame() {
		if (winner) {
			hideWinnerModal();
			clearBannerGlow();
			winner = null;
			resetGame();
		}
		if (!gameStarted && !winner && !hasGameStartedOnce) {
			// In multiplayer, only left player can start the game
			if (isMultiplayer && playerSide !== "left") return;
			gameStarted = true;
			hasGameStartedOnce = true;
			showPressSpace = false;
			ballVX = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
			ballVY = ballSpeed * (Math.random() * 2 - 1);
			// Send ball update to sync game start
			if (isMultiplayer && ws && playerSide === "left") {
				ws.send(JSON.stringify({
					type: "ballUpdate",
					ballX: ballX,
					ballY: ballY,
					ballVX: ballVX,
					ballVY: ballVY,
					gameStarted: gameStarted
				}));
			}
		}
	}

	function resetBall(auto = true) {
		ballX = fieldWidth / 2 - ballWidth / 2 - 4;
		ballY = fieldHeight / 2 - ballHeight / 2;
		ballVX = 0;
		ballVY = 0;
		gameStarted = false;
		if (auto && hasGameStartedOnce && !winner) {
			setTimeout(() => {
				gameStarted = true;
				ballVX = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
				ballVY = ballSpeed * (Math.random() * 2 - 1);
			}, 700);
		}
	}

	function resetGame() {
		leftScore = 0;
		rightScore = 0;
		updateScoreDisplay();
		leftY = fieldHeight / 2 - paddleHeight / 2;
		rightY = fieldHeight / 2 - paddleHeight / 2;
		showPressSpace = true;
		resetBall(false);
	}

	function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
		ctx.beginPath();
		ctx.rect(x, y, w, h);
		ctx.closePath();
		ctx.fill();
	}

	function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + w - r, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + r);
		ctx.lineTo(x + w, y + h - r);
		ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
		ctx.lineTo(x + r, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - r);
		ctx.lineTo(x, y + r);
		ctx.quadraticCurveTo(x, y, x + r, y);
		ctx.closePath();
		ctx.fill();
	}

	function update() {
		// In multiplayer, each player only controls their own paddle
		if (isMultiplayer) {
			if (playerSide === "left") {
				if (keys.w) {
					leftY -= paddleSpeed;
				}
				if (keys.s) {
					leftY += paddleSpeed;
				}
				leftY = Math.max(0, Math.min(fieldHeight - paddleHeight, leftY));
			} else if (playerSide === "right") {
				// Right player can use both WASD and arrow keys for convenience
				if (keys.w) {
					rightY -= paddleSpeed;
				}
				if (keys.s) {
					rightY += paddleSpeed;
				}
				rightY = Math.max(0, Math.min(fieldHeight - paddleHeight, rightY));
			}
		} else {
			// Single player mode
			if (keys.w) leftY -= paddleSpeed;
			if (keys.s) leftY += paddleSpeed;
			leftY = Math.max(0, Math.min(fieldHeight - paddleHeight, leftY));
		}

		// Send paddle updates for multiplayer
		if (isMultiplayer && ws) {
			if (playerSide === "left" && leftY !== leftYOld) {
				ws.send(JSON.stringify({
					type: "paddleMove",
					y: leftY
				}));
				leftYOld = leftY; // Update old position immediately after sending
			} else if (playerSide === "right" && rightY !== rightYOld) {
				ws.send(JSON.stringify({
					type: "paddleMove", 
					y: rightY
				}));
				rightYOld = rightY; // Update old position immediately after sending
			}
		} else {
			// For single player, update old positions normally
			leftYOld = leftY;
			rightYOld = rightY;
		}

		if (!gameStarted) return;
		// In multiplayer, only the left player controls the ball physics
		if (isMultiplayer && playerSide !== "left") return;
		let ballXOld = ballX, ballYOld = ballY;
		let ballVXOld = ballVX, ballVYOld = ballVY;
		let gameStartedOld = gameStarted;

		ballX += ballVX;
		ballY += ballVY;

		if (ballY <= 0) {
			ballY = 0;
			ballVY *= -1;
		}
		if (ballY + ballHeight >= fieldHeight) {
			ballY = fieldHeight - ballHeight;
			ballVY *= -1;
		}
		// Left paddle collision
		if (
			ballX <= 32 &&
			ballY + ballHeight > leftY &&
			ballY < leftY + paddleHeight
		) {
			ballVX = Math.abs(ballVX);
			ballVY += (ballY + ballHeight / 2 - (leftY + paddleHeight / 2)) * 0.15;
		}
		// Right paddle  collision
		if (
			ballX + ballWidth >= fieldWidth - 32 &&
			ballY + ballHeight > rightY &&
			ballY < rightY + paddleHeight
		) {
			ballVX = -Math.abs(ballVX);
			ballVY += (ballY + ballHeight / 2 - (rightY + paddleHeight / 2)) * 0.15;
		}

		// Score
		if (ballX < 0 && !winner) {
			rightScore++;
			updateScoreDisplay();

			if (rightScore >= 3) {
				winner = "right";
				setBannerGlow("right");
				showWinnerModal("right");
				gameStarted = false;
			} else {
				resetBall();
			}
			
			// Send score update for multiplayer (only left player)
			if (isMultiplayer && ws && playerSide === "left") {
				ws.send(JSON.stringify({
					type: "scoreUpdate",
					leftScore: leftScore,
					rightScore: rightScore,
					winner: winner
				}));
			}
			return;
		}
		if (ballX + ballWidth > fieldWidth && !winner) {
			leftScore++;
			updateScoreDisplay();
			if (leftScore >= 3) {
				winner = "left";
				setBannerGlow("left");
				showWinnerModal("left");
				gameStarted = false;
			} else {
				resetBall();
			}
			
			// Send score update for multiplayer (only left player)
			if (isMultiplayer && ws && playerSide === "left") {
				ws.send(JSON.stringify({
					type: "scoreUpdate",
					leftScore: leftScore,
					rightScore: rightScore,
					winner: winner
				}));
			}
			return;
		}

		// Send ball updates for multiplayer (only left player controls ball)
		if (isMultiplayer && ws && playerSide === "left") {
			if (ballX !== ballXOld || ballY !== ballYOld || ballVX !== ballVXOld || ballVY !== ballVYOld || gameStarted !== gameStartedOld) {
				ws.send(JSON.stringify({
					type: "ballUpdate",
					ballX: ballX,
					ballY: ballY,
					ballVX: ballVX,
					ballVY: ballVY,
					gameStarted: gameStarted
				}));
			}
		}
	}

	function draw() {
		ctx.clearRect(0, 0, fieldWidth, fieldHeight);

		// In multiplayer, each player sees only their own customization
		// In single player, use current player's customization
		const currentPlayerCustomization = isMultiplayer 
			? (playerSide === "left" ? leftPlayerCustomization : rightPlayerCustomization)
			: leftPlayerCustomization;

		// Ensure we have valid customization data (fallback to defaults if not loaded)
		const safeCustomization = {
			paddle_color: currentPlayerCustomization?.paddle_color || "#4CF190",
			ball_color: currentPlayerCustomization?.ball_color || "#4CF190",
			board_color: currentPlayerCustomization?.board_color || "#07303c",
			border_color: currentPlayerCustomization?.border_color || "#4CF190"
		};

		// Set background color based on current player's preference
		canvas.style.backgroundColor = safeCustomization.board_color;

		// All elements use current player's customization colors
		// Left paddle - use current player's paddle color
		ctx.fillStyle = safeCustomization.paddle_color;
		rect(ctx, 16, leftY, paddleWidth, paddleHeight);

		// Right paddle - use current player's paddle color  
		ctx.fillStyle = safeCustomization.paddle_color;
		rect(ctx, fieldWidth - 16 - paddleWidth, rightY, paddleWidth, paddleHeight);

		// Ball - use current player's ball color preference
		ctx.fillStyle = safeCustomization.ball_color;
		ctx.beginPath();
		ctx.arc(
			ballX + ballWidth / 2,
			ballY + ballHeight / 2,
			ballWidth / 2,
			0,
			Math.PI * 2
		);
		ctx.fill();

		if (showPressSpace && !gameStarted && !winner) {
			ctx.save();
			ctx.globalAlpha = 0.25;
			ctx.fillStyle = "#fff";
			ctx.font = "bold 28px Arial";
			ctx.textAlign = "left";
			ctx.fillText(
				"Press SPACE to start",
				20,
				fieldHeight - 30
			);
			ctx.fillText(
				"Controls: w s",
				20,
				50
			);
			ctx.textAlign = "right";
			ctx.fillText(
				"Controls: ↑ ↓",
				fieldWidth - 20,
				50
			);
			ctx.restore();
		}
	}

	function loop() {
		if (!paused) {
			update();
		}
		draw();
		requestAnimationFrame(loop);
	}

	// Keyboard controls and start game on spacebar
	window.addEventListener("keydown", (e) => {
		if (e.code === "Space") startGame();
		if (e.key === "w" || e.key === "s" || e.key === "ArrowUp" || e.key === "ArrowDown") {
			keys[e.key] = true;
		}
	});
	window.addEventListener("keyup", (e) => {
		if (e.key === "w" || e.key === "s" || e.key === "ArrowUp" || e.key === "ArrowDown") {
			keys[e.key] = false;
		}
	});

	// Initialize scores and ball
	leftScore = 0;
	rightScore = 0;
	updateScoreDisplay();
	resetBall();

	// Check PvP
	if (opponentUsername) {
		opponentDisplayName = opponentUsername;
		sessionStorage.removeItem("pvpOpponent");
	}

	loop();
};