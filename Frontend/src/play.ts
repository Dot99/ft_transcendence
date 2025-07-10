import { playTemplate } from "./templates/playTemplate.js";
import { getCookie, getUserIdFromToken } from "./utils/auth.js";
import { WS_BASE_URL, API_BASE_URL } from "./config.js";
import { BotAI } from "./botAI.js";
import { cleanupTournamentPage } from "./tournament.js";

const botAI = new BotAI();
let resetTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

// Utility to get element by id
const getElement = <T extends HTMLElement>(id: string): T => {
	const element = document.getElementById(id) as T;
	if (!element) {
		console.error(
			`Element with id ${id} not found. Available elements:`,
			Array.from(document.querySelectorAll("[id]")).map((el) => el.id)
		);
		throw new Error(`Element with id ${id} not found`);
	}
	return element;
};

// Safe version that returns null if element not found
const getElementSafe = <T extends HTMLElement>(id: string): T | null => {
	const element = document.getElementById(id) as T;
	if (!element) {
		console.warn(`Element with id ${id} not found`);
		return null;
	}
	return element;
};

export const loadPlayPage = async (): Promise<void> => {
	// Cleanup any previous tournament auto-refresh
	cleanupTournamentPage();

	const app = getElement<HTMLElement>("app");
	app.innerHTML = playTemplate;

	// Wait for DOM to be ready
	await new Promise((resolve) => setTimeout(resolve, 100));

	let playerUsername = "Player";
	let leftPlayerName = "Player 1";
	let rightPlayerName = "Player 2";
	let ballVX = 0;
	let ballVY = 0;
	let leftScore = 0;
	let rightScore = 0;
	let gameStarted = false;
	let hasGameStartedOnce = false;
	let winner: "left" | "right" | null = null;

	try {
		const jwt = getCookie("jwt");
		if (jwt) {
			const userId = getUserIdFromToken();
			const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			});
			if (res.ok) {
				const data = await res.json();
				const user = data.user;
				playerUsername = user.username || "Player";
				leftPlayerName = playerUsername;
				const playerUsernameElement =
					getElementSafe<HTMLElement>("player-username");
				if (playerUsernameElement) {
					playerUsernameElement.textContent = leftPlayerName;
				}
				const avatar =
					getElementSafe<HTMLImageElement>("player-avatar");
				if (avatar) {
					if (user.pfp) {
						// Check if it's an external URL or local file
						if (
							user.pfp.startsWith("http://") ||
							user.pfp.startsWith("https://")
						) {
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
				}
			} else {
				// If user fetch fails, show default avatar
				const avatar =
					getElementSafe<HTMLImageElement>("player-avatar");
				if (avatar) {
					avatar.src = "/images/default_pfp.png";
					avatar.style.display = "";
				}
			}
		} else {
			// If no JWT, show default avatar
			const avatar = getElementSafe<HTMLImageElement>("player-avatar");
			if (avatar) {
				avatar.src = "/images/default_pfp.png";
				avatar.style.display = "";
			}
		}
	} catch {
		// If any error, show default avatar
		const avatar = getElementSafe<HTMLImageElement>("player-avatar");
		if (avatar) {
			avatar.src = "/images/default_pfp.png";
			avatar.style.display = "";
		}
	}

	// Winner Modal elements
	const winnerModal = getElementSafe<HTMLDivElement>("winnerModal");
	const winnerUsernameSpan = getElementSafe<HTMLElement>("winnerUsername");
	const menuBtn = getElementSafe<HTMLButtonElement>("menuBtn");

	if (!winnerModal || !winnerUsernameSpan || !menuBtn) {
		console.error("Winner modal elements not found");
		return;
	}

	function showWinnerModal(winnerSide: "left" | "right") {
		// Force a direct DOM read of current displayed names
		const playerUsernameElement =
			getElementSafe<HTMLElement>("player-username");
		const botUsernameElement = getElementSafe<HTMLElement>("bot-username");
		const winnerUsernameSpan =
			getElementSafe<HTMLElement>("winnerUsername");
		const winnerModal = getElementSafe<HTMLDivElement>("winnerModal");

		if (
			!playerUsernameElement ||
			!botUsernameElement ||
			!winnerUsernameSpan ||
			!winnerModal
		) {
			console.warn(
				"Winner modal elements not found, skipping modal display"
			);
			return;
		}

		const displayedLeftName =
			playerUsernameElement.textContent || leftPlayerName;
		const displayedRightName =
			botUsernameElement.textContent || rightPlayerName;

		if (winnerSide === "left") {
			winnerUsernameSpan.textContent = displayedLeftName;
		} else {
			winnerUsernameSpan.textContent = displayedRightName;
		}

		winnerModal.classList.remove("hidden");
	}

	function hideWinnerModal() {
		const winnerModal = getElementSafe<HTMLDivElement>("winnerModal");
		if (winnerModal) {
			winnerModal.classList.add("hidden");
		}
	}
	menuBtn.addEventListener("click", async () => {
		hideWinnerModal();
		ballVX = 0;
		ballVY = 0;
		leftScore = 0;
		rightScore = 0;
		gameStarted = false;
		hasGameStartedOnce = false;
		winner = null;

		clearTimeout(resetTimeout);
		try {
			await fetch(`${API_BASE_URL}/users/matchmaking/leave`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${getCookie("jwt")}`,
					"Content-Type": "application/json",
				},
			});
		} catch (e) {
			console.log("Failed to leave matchmaking:", e);
		}
		if (ws) {
			ws.close();
		}
		isMultiplayer = false;
		gameId = null;
		playerSide = "left";

		// Clean up any remaining window data
		delete (window as any).gameData;
		window.dispatchEvent(new Event("loadMenuPage"));
	});

	const canvas = getElement<HTMLCanvasElement>("pong-canvas");
	const ctx = canvas.getContext("2d")!;

	const paddleWidth = 16,
		paddleHeight = 64,
		paddleSpeed = 6;
	const ballWidth = 20,
		ballHeight = 20,
		ballSpeed = 4;
	const fieldWidth = canvas.width,
		fieldHeight = canvas.height;

	let leftY = fieldHeight / 2 - paddleHeight / 2;
	let rightY = fieldHeight / 2 - paddleHeight / 2;
	let leftYOld = leftY; // Track previous paddle positions for multiplayer
	let rightYOld = rightY;
	let ballX = fieldWidth / 2 - ballWidth / 2,
		ballY = fieldHeight / 2 - ballHeight / 2;
	const keys: Record<string, boolean> = {
		w: false,
		s: false,
		ArrowUp: false,
		ArrowDown: false,
	};

	let showPressSpace = true;
	let paused = false;
	let opponentDisplayName = "Bot";
	let currentUserCustomization = {
		paddle_color: "#4CF190",
		ball_color: "#4CF190",
		board_color: "#07303c",
		border_color: "#4CF190",
	};
	let isMultiplayer = false;
	let playerSide: "left" | "right" = "left";
	let ws: WebSocket | null = null;
	let gameId: string | null = null;
	let leftPlayerId: number | null = null;
	let rightPlayerId: number | null = null;
	let lastBotUpdate = 0;

	// Game mode handling - only AI, multiplayer, or tournament
	let gameMode: "ai" | "multiplayer" | "tournament" = "ai";

	// Check if this is a multiplayer game (from matchmaking or friend invite)
	const gameData = (window as any).gameData;
	let opponentUsername: string | null = null;
	let gameIdFromData: string | null = null;

	console.log("DEBUG: Play page initialization", {
		gameData,
		currentGameMode: gameMode,
		currentIsMultiplayer: isMultiplayer,
	});

	if (gameData) {
		console.log("DEBUG: gameData found", gameData);
		if (
			gameData.type === "matchmaking" ||
			gameData.type === "friend_invite"
		) {
			gameMode = "multiplayer";
			isMultiplayer = true;
			opponentUsername = gameData.opponentUsername;
			gameIdFromData = gameData.gameId;
			console.log("DEBUG: Set to multiplayer mode", {
				gameMode,
				isMultiplayer,
				opponentUsername,
				gameIdFromData,
			});
			// Clear the data after use
			delete (window as any).gameData;
		} else if (gameData.type === "tournament") {
			gameMode = "tournament";
			opponentUsername = gameData.opponentUsername;
			gameIdFromData = gameData.gameId;
			console.log("DEBUG: Set to tournament mode", {
				gameMode,
				opponentUsername,
				gameIdFromData,
			});
			// Clear the data after use
			delete (window as any).gameData;
		}
	}

	if (!gameData && window.location.search.includes("gameId=")) {
		const params = new URLSearchParams(window.location.search);
		const gameIdParam = params.get("gameId");
		if (gameIdParam) {
			gameMode = "multiplayer";
			isMultiplayer = true;
			gameIdFromData = gameIdParam;
		}
	}

	// Set initial display names
	if (gameMode === "ai") {
		rightPlayerName = "Bot";
		const botUsername = getElementSafe<HTMLElement>("bot-username");
		if (botUsername) {
			botUsername.textContent = rightPlayerName;
		}
		console.log("DEBUG: Set right player name to Bot (AI mode)");
	} else if (gameMode === "multiplayer") {
		// In multiplayer mode, set placeholder names that will be updated by WebSocket
		if (opponentUsername) {
			rightPlayerName = opponentUsername;
			const botUsername = getElementSafe<HTMLElement>("bot-username");
			if (botUsername) {
				botUsername.textContent = rightPlayerName;
			}
			console.log("DEBUG: Set right player name to opponent", {
				rightPlayerName,
				opponentUsername,
			});
		} else {
			// Set placeholder name for multiplayer
			rightPlayerName = "Opponent";
			const botUsername = getElementSafe<HTMLElement>("bot-username");
			if (botUsername) {
				botUsername.textContent = rightPlayerName;
			}
			console.log(
				"DEBUG: Set right player name to placeholder (multiplayer mode)"
			);
		}
	}

	// Load current user's customization first
	await loadCurrentUserCustomization();

	if (opponentUsername && gameIdFromData) {
		console.log("DEBUG: Connecting to game with opponent", {
			opponentUsername,
			gameIdFromData,
			gameMode,
			isMultiplayer,
		});
		gameId = gameIdFromData;
		opponentDisplayName = opponentUsername;
		// For tournaments, we need to set isMultiplayer to true
		if (gameMode === "tournament") {
			isMultiplayer = true;
		}
		connectToGame();
	} else if (gameIdFromData) {
		console.log("DEBUG: Connecting to game without opponent username", {
			gameIdFromData,
			gameMode,
			isMultiplayer,
		});
		gameId = gameIdFromData;
		isMultiplayer = true;
		connectToGame();
	} else if (gameMode === "multiplayer" && opponentUsername) {
		// Multiplayer mode but no gameId - this shouldn't happen, log error and fall back to AI
		console.error("DEBUG: Multiplayer mode detected but no gameId found!", {
			gameMode,
			isMultiplayer,
			opponentUsername,
			gameIdFromData,
		});
		// Fall back to AI mode
		gameMode = "ai";
		isMultiplayer = false;
		rightPlayerName = "Bot";
		const botUsername = getElementSafe<HTMLElement>("bot-username");
		if (botUsername) {
			botUsername.textContent = rightPlayerName;
		}
		console.log("DEBUG: Fell back to AI mode due to missing gameId");
	} else {
		console.log(
			"DEBUG: No game data found, staying in single player mode",
			{
				gameMode,
				isMultiplayer,
			}
		);
	}

	function setBannerGlow(winnerSide: "left" | "right" | null) {
		const playerBanner = getElementSafe("player-banner");
		const botBanner = getElementSafe("bot-banner");
		const playerScore = getElementSafe("player-score");
		const botScore = getElementSafe("bot-score");

		if (!playerBanner || !botBanner || !playerScore || !botScore) {
			console.warn("Banner elements not found, skipping banner glow");
			return;
		}

		playerBanner.classList.remove("winner-banner");
		botBanner.classList.remove("winner-banner");
		playerScore.classList.remove("score-glow-winner");
		botScore.classList.remove("score-glow-winner");

		if (winnerSide === "left") {
			playerBanner.classList.add("winner-banner");
			playerScore.classList.add("score-glow-winner");
		} else if (winnerSide === "right") {
			botBanner.classList.add("winner-banner");
			botScore.classList.add("score-glow-winner");
		}
	}

	function clearBannerGlow() {
		const playerBanner = getElementSafe("player-banner");
		const botBanner = getElementSafe("bot-banner");
		const playerScore = getElementSafe("player-score");
		const botScore = getElementSafe("bot-score");

		if (!playerBanner || !botBanner || !playerScore || !botScore) {
			console.warn(
				"Banner elements not found, skipping clear banner glow"
			);
			return;
		}

		playerBanner.classList.remove("winner-banner");
		botBanner.classList.remove("winner-banner");
		playerScore.classList.remove("score-glow-winner");
		botScore.classList.remove("score-glow-winner");
	}

	function updateScoreDisplay() {
		const playerScoreElement = getElementSafe<HTMLElement>("player-score");
		const botScoreElement = getElementSafe<HTMLElement>("bot-score");

		if (!playerScoreElement || !botScoreElement) {
			console.warn("Score elements not found, retrying in 100ms...");
			setTimeout(() => {
				const retryPlayerScore =
					getElementSafe<HTMLElement>("player-score");
				const retryBotScore = getElementSafe<HTMLElement>("bot-score");

				if (retryPlayerScore && retryBotScore) {
					retryPlayerScore.textContent = leftScore
						.toString()
						.padStart(2, "0");
					retryBotScore.textContent = rightScore
						.toString()
						.padStart(2, "0");
				} else {
					console.error("Score elements still not found after retry");
				}
			}, 100);
			return;
		}

		playerScoreElement.textContent = leftScore.toString().padStart(2, "0");
		botScoreElement.textContent = rightScore.toString().padStart(2, "0");
	}

	async function fetchUserCustomization(userId: number) {
		try {
			const res = await fetch(
				`${API_BASE_URL}/games/costumization/${userId}`,
				{
					headers: {
						Authorization: `Bearer ${getCookie("jwt")}`,
					},
				}
			);
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
			border_color: "#4CF190",
		};
	}

	async function loadCurrentUserCustomization() {
		try {
			const userId = getUserIdFromToken();
			if (userId) {
				currentUserCustomization = await fetchUserCustomization(userId);
				// Update the game area styling after loading new customization
				setTimeout(() => {
					updateGameAreaStyling();
				}, 50); // Small delay to ensure DOM is ready
			}
		} catch (error) {
			console.log("Error loading current user customization:", error);
		}
	}

	// Function to refresh customization
	window.refreshGameCustomization = loadCurrentUserCustomization;

	function startGame() {
		console.log("DEBUG: startGame called", {
			gameStarted,
			winner,
			hasGameStartedOnce,
			isMultiplayer,
			playerSide,
			leftPlayerId,
			rightPlayerId,
		});

		if (winner) {
			hideWinnerModal();
			clearBannerGlow();
			winner = null;
			hasGameStartedOnce = false;
			resetGame();
			setTimeout(() => {
				gameStarted = true;
				hasGameStartedOnce = true;
				showPressSpace = false;
				ballVX = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
				ballVY = ballSpeed * (Math.random() * 2 - 1);
			}, 100);
			return;
		}

		// In multiplayer, only left player can start the game and only when both players are connected
		if (isMultiplayer) {
			if (playerSide !== "left") {
				console.log("DEBUG: Only left player can start the game");
				return;
			}
			if (!leftPlayerId || !rightPlayerId) {
				console.log("DEBUG: Both players must be connected to start");
				return;
			}
		}

		if (!gameStarted && !winner && !hasGameStartedOnce) {
			if (leftScore !== 0 || rightScore !== 0) {
				leftScore = 0;
				rightScore = 0;
				updateScoreDisplay();
			}
			gameStarted = true;
			hasGameStartedOnce = true;
			showPressSpace = false;
			ballVX = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
			ballVY = ballSpeed * (Math.random() * 2 - 1);

			console.log("DEBUG: Game started", { ballVX, ballVY });

			// Send ball update to sync game start
			if (isMultiplayer && ws && playerSide === "left") {
				ws.send(
					JSON.stringify({
						type: "ballUpdate",
						ballX: ballX,
						ballY: ballY,
						ballVX: ballVX,
						ballVY: ballVY,
						gameStarted: gameStarted,
					})
				);
			}
		}
	}

	async function fetchUserProfile(userId: number) {
		try {
			const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
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
		// Always use current user's customization for the game area styling
		const safeCustomization = {
			paddle_color: currentUserCustomization?.paddle_color || "#4CF190",
			ball_color: currentUserCustomization?.ball_color || "#4CF190",
			board_color: currentUserCustomization?.board_color || "#07303c",
			border_color: currentUserCustomization?.border_color || "#4CF190",
		};

		// Update the game area container - use the canvas parent which should be the game area
		const canvas = document.getElementById("pong-canvas");
		if (canvas && canvas.parentElement) {
			const gameArea = canvas.parentElement;
			gameArea.style.borderColor = safeCustomization.border_color;
			gameArea.style.backgroundColor = safeCustomization.board_color;
		}

		// Update center line elements - find them more specifically
		const centerLines = document.querySelectorAll(
			'div[class*="w-1"][class*="h-8"][class*="bg-"]'
		);
		centerLines.forEach((line) => {
			(line as HTMLElement).style.backgroundColor =
				safeCustomization.border_color;
		});

		// Update canvas background to match board color
		if (canvas) {
			canvas.style.backgroundColor = safeCustomization.board_color;
		}
	}

	// Function to save PvP game results to the database
	async function savePvPGameResult() {
		console.log("DEBUG: savePvPGameResult called with state:", {
			isMultiplayer,
			gameMode,
			leftPlayerId,
			rightPlayerId,
			playerSide,
			winner,
			leftScore,
			rightScore,
			gameId,
		});

		// Only save results for multiplayer games and tournaments and only if we're the left player (host)
		if (
			(!isMultiplayer && gameMode !== "tournament") ||
			!leftPlayerId ||
			!rightPlayerId ||
			playerSide !== "left"
		) {
			console.log(
				"DEBUG: savePvPGameResult returning early due to conditions:",
				{
					isMultiplayer,
					gameMode,
					leftPlayerId,
					rightPlayerId,
					playerSide,
					condition1: !isMultiplayer && gameMode !== "tournament",
					condition2: !leftPlayerId,
					condition3: !rightPlayerId,
					condition4: playerSide !== "left",
				}
			);
			return;
		}

		try {
			const jwt = getCookie("jwt");
			if (!jwt) {
				console.error("No JWT token available for saving game result");
				return;
			}

			// Determine winner ID based on winner side
			let winnerId = null;
			if (winner === "left") {
				winnerId = leftPlayerId;
			} else if (winner === "right") {
				winnerId = rightPlayerId;
			}
			const gameData = {
				player1: leftPlayerId,
				player2: rightPlayerId,
				player1_score: leftScore,
				player2_score: rightScore,
				winner: winnerId,
				gameId: gameId,
			};

			console.log("DEBUG: Saving game result", {
				gameData,
			});
			const response = await fetch(`${API_BASE_URL}/games/save-result`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${jwt}`,
				},
				body: JSON.stringify(gameData),
			});

			if (response.ok) {
				const result = await response.json();
			} else {
				const error = await response.text();
			}
		} catch (error) {
			console.error("Error saving game result:", error);
		}

		// Update right player name for single player modes
		if (!isMultiplayer) {
			rightPlayerName = "Bot";
			const botUsernameElement =
				getElementSafe<HTMLElement>("bot-username");
			if (botUsernameElement) {
				botUsernameElement.textContent = rightPlayerName;
			}
		}
	}

	function connectToGame() {
		if (!gameId) return;
		console.log("DEBUG: connectToGame called", {
			gameId,
			isMultiplayer,
			gameMode,
		});
		const wsUrl = `${WS_BASE_URL}/api/ws?token=${getCookie(
			"jwt"
		)}&gameId=${gameId}`;
		ws = new WebSocket(wsUrl);

		ws.onopen = () => {
			console.log("DEBUG: Connected to game WebSocket", {
				gameId,
				isMultiplayer,
				gameMode,
			});
			// Don't allow game to start until both players are ready
			gameStarted = false;
			showPressSpace = false; // Hide press space until both players are ready
		};

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				console.log("DEBUG: Received WebSocket message:", data);

				if (data.type === "waitingForOpponent") {
					console.log("DEBUG: Waiting for opponent to connect...");
					// Show waiting message to player
					const waitingOverlay = document.createElement("div");
					waitingOverlay.id = "waitingOverlay";
					waitingOverlay.innerHTML = `
						<div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
							<div class="bg-[#001B26] border-4 border-[#4CF190] rounded-xl p-8 flex flex-col items-center shadow-2xl">
								<span class="text-2xl font-bold text-[#4CF190] mb-4">Waiting for opponent...</span>
								<div class="loader"></div>
							</div>
						</div>
					`;
					document.body.appendChild(waitingOverlay);
					return;
				}

				if (data.type === "gameReady") {
					console.log("DEBUG: Game ready, both players connected");
					console.log("DEBUG: Game ready data:", data);

					// Remove waiting overlay if it exists
					const waitingOverlay =
						document.getElementById("waitingOverlay");
					if (waitingOverlay) {
						document.body.removeChild(waitingOverlay);
					}

					playerSide = data.yourSide;
					// Store player IDs for saving game results
					leftPlayerId = data.leftPlayerId;
					rightPlayerId = data.rightPlayerId;

					console.log("DEBUG: gameReady set variables:", {
						playerSide,
						leftPlayerId,
						rightPlayerId,
						isMultiplayer,
						gameMode,
					});

					// Set multiplayer flag if we have both player IDs
					if (leftPlayerId && rightPlayerId) {
						isMultiplayer = true;
						gameMode = "multiplayer"; // Ensure gameMode is set to multiplayer
						console.log("DEBUG: Confirmed multiplayer mode", {
							isMultiplayer,
							gameMode,
						});
					}

					// Set player names consistently - left panel = left player, right panel = right player
					if (data.leftPlayerName && data.rightPlayerName) {
						leftPlayerName = data.leftPlayerName;
						rightPlayerName = data.rightPlayerName;
						const playerUsernameElement =
							getElementSafe<HTMLElement>("player-username");
						const botUsernameElement =
							getElementSafe<HTMLElement>("bot-username");

						if (playerUsernameElement) {
							playerUsernameElement.textContent = leftPlayerName;
						}
						if (botUsernameElement) {
							botUsernameElement.textContent = rightPlayerName;
						}

						// Fetch profile data for both players (only for avatars)
						if (data.leftPlayerId && data.rightPlayerId) {
							// Fetch both players' profile data for avatars
							const leftPlayerPromise = fetchUserProfile(
								data.leftPlayerId
							);
							const rightPlayerPromise = fetchUserProfile(
								data.rightPlayerId
							);

							// Wait for both players' data to load
							Promise.all([leftPlayerPromise, rightPlayerPromise])
								.then(([leftProfile, rightProfile]) => {
									// Preload and validate both avatar images before assigning
									const preloadPromises = [];

									// Preload left avatar
									if (leftProfile && leftProfile.pfp) {
										const leftAvatarSrc =
											leftProfile.pfp.startsWith(
												"http://"
											) ||
											leftProfile.pfp.startsWith(
												"https://"
											)
												? leftProfile.pfp
												: `/images/${leftProfile.pfp}`;

										preloadPromises.push(
											new Promise((resolve) => {
												const img = new Image();
												img.onload = () => {
													resolve({
														side: "left",
														src: leftAvatarSrc,
														success: true,
													});
												};
												img.onerror = () => {
													resolve({
														side: "left",
														src: "/images/default_pfp.png",
														success: false,
													});
												};
												img.src = leftAvatarSrc;
											})
										);
									} else {
										preloadPromises.push(
											Promise.resolve({
												side: "left",
												src: "/images/default_pfp.png",
												success: true,
											})
										);
									}

									// Preload right avatar
									if (rightProfile && rightProfile.pfp) {
										const rightAvatarSrc =
											rightProfile.pfp.startsWith(
												"http://"
											) ||
											rightProfile.pfp.startsWith(
												"https://"
											)
												? rightProfile.pfp
												: `/images/${rightProfile.pfp}`;

										preloadPromises.push(
											new Promise((resolve) => {
												const img = new Image();
												img.onload = () => {
													resolve({
														side: "right",
														src: rightAvatarSrc,
														success: true,
													});
												};
												img.onerror = () => {
													resolve({
														side: "right",
														src: "/images/default_pfp.png",
														success: false,
													});
												};
												img.src = rightAvatarSrc;
											})
										);
									} else {
										preloadPromises.push(
											Promise.resolve({
												side: "right",
												src: "/images/default_pfp.png",
												success: true,
											})
										);
									}

									// Wait for both preloads to complete, then assign the validated images
									type AvatarPreloadResult = {
										side: "left" | "right";
										src: string;
										success: boolean;
									};
									Promise.all(preloadPromises).then(
										(results) => {
											const typedResults =
												results as AvatarPreloadResult[];
											const leftResult =
												typedResults.find(
													(r) => r.side === "left"
												);
											const rightResult =
												typedResults.find(
													(r) => r.side === "right"
												);
											// Set left player avatar with preloaded/validated URL
											const leftPanelAvatar =
												getElementSafe<HTMLImageElement>(
													"player-avatar"
												);
											if (leftPanelAvatar && leftResult) {
												leftPanelAvatar.src =
													leftResult.src;
												leftPanelAvatar.style.display =
													"";
											}
											// Set right player avatar with preloaded/validated URL
											const rightAvatar =
												document.querySelector(
													"#bot-banner img"
												) as HTMLImageElement;
											if (rightAvatar && rightResult) {
												rightAvatar.src =
													rightResult.src;
												rightAvatar.alt = rightProfile
													? rightProfile.username
													: "Player";
											} else if (rightResult) {
												const botBanner =
													getElementSafe(
														"bot-banner"
													);
												if (botBanner) {
													const username =
														rightProfile
															? rightProfile.username
															: "Player";
													const avatarImg = `<img src="${rightResult.src}" alt="${username}" class="w-24 h-24 rounded" />`;
													botBanner.innerHTML =
														avatarImg;
												}
											}

											// Update styling after all data is loaded
											updateGameAreaStyling();

											// Final verification
											setTimeout(() => {
												const leftAvatar =
													getElementSafe<HTMLImageElement>(
														"player-avatar"
													);
												const rightAvatar =
													document.querySelector(
														"#bot-banner img"
													) as HTMLImageElement;
												// Verification completed
											}, 100);
										}
									);
								})
								.catch((error) => {
									console.error(
										"Error loading player data:",
										error
									);
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

					// Now that both players are connected, allow game to start
					if (!gameStarted && !winner && !hasGameStartedOnce) {
						showPressSpace = true;
					}

					updateScoreDisplay();
					console.log(
						"DEBUG: Game ready complete, playerSide:",
						playerSide
					);
					console.log("DEBUG: Final game state after gameReady:", {
						gameMode,
						isMultiplayer,
						leftPlayerName,
						rightPlayerName,
						leftPlayerId,
						rightPlayerId,
					});
				} else if (data.type === "paddleUpdate") {
					if (data.side === "left") {
						leftY = data.y;
						leftYOld = data.y;
					} else if (data.side === "right") {
						rightY = data.y;
						rightYOld = data.y;
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

					console.log("DEBUG: scoreUpdate received:", {
						leftScore,
						rightScore,
						winner,
						isMultiplayer,
						gameMode,
						leftPlayerId,
						rightPlayerId,
						playerSide,
					});

					if (winner) {
						setBannerGlow(winner);
						showWinnerModal(winner);
						gameStarted = false;
						// Save game result to database
						console.log(
							"DEBUG: Calling savePvPGameResult from scoreUpdate with winner:",
							winner
						);
						savePvPGameResult().catch((error) => {
							console.error("Error saving game result:", error);
						});
					}
				} else if (data.type === "opponentLeft") {
					// Opponent left the game
					winner = data.winner;
					gameStarted = false;

					console.log("DEBUG: opponentLeft received:", {
						winner,
						isMultiplayer,
						gameMode,
						leftPlayerId,
						rightPlayerId,
						playerSide,
					});

					if (winner) {
						setBannerGlow(winner);
						showWinnerModal(winner);
						// Save game result to database
						console.log(
							"DEBUG: Calling savePvPGameResult from opponentLeft with winner:",
							winner
						);
						savePvPGameResult().catch((error) => {
							console.error("Error saving game result:", error);
						});
					}
				} else if (data.type === "gamePaused") {
					// Opponent paused the game
					paused = true;
				} else if (data.type === "gameResumed") {
					// Opponent resumed the game
					paused = false;
				}
			} catch (e) {
				console.error("WebSocket message parse error:", e);
			}
		};

		ws.onclose = (event) => {
			console.log("DEBUG: WebSocket connection closed", event);

			// Remove waiting overlay if it exists
			const waitingOverlay = document.getElementById("waitingOverlay");
			if (waitingOverlay) {
				document.body.removeChild(waitingOverlay);
			}

			// Check if this was an error closure
			if (event.code === 4000) {
				alert("Game room is full. Please try again.");
				window.dispatchEvent(new Event("loadMenuPage"));
			} else if (event.code === 4001) {
				alert("Invalid game session. Please try again.");
				window.dispatchEvent(new Event("loadMenuPage"));
			}
		};

		ws.onerror = (error) => {
			console.error("WebSocket error:", error);
		};
	}
	// Button actions
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

		// In multiplayer, notify the opponent that the game is paused
		if (isMultiplayer && ws) {
			ws.send(
				JSON.stringify({
					type: "pauseGame",
				})
			);
		}
	});
	continueGameBtn.addEventListener("click", () => {
		giveUpModal.classList.add("hidden");
		paused = false;

		// In multiplayer, notify the opponent that the game is resumed
		if (isMultiplayer && ws) {
			ws.send(
				JSON.stringify({
					type: "resumeGame",
				})
			);
		}
	});
	giveUpMenuBtn.addEventListener("click", async () => {
		giveUpModal.classList.add("hidden");
		paused = false;

		// In multiplayer, notify the opponent that you're giving up
		if (isMultiplayer && ws) {
			ws.send(
				JSON.stringify({
					type: "giveUp",
				})
			);
		}
		// Clean up matchmaking status on the backend
		try {
			await fetch(`${API_BASE_URL}/users/matchmaking/leave`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${getCookie("jwt")}`,
					"Content-Type": "application/json",
				},
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

		// Clean up any remaining window data
		delete (window as any).gameData;
		window.dispatchEvent(new Event("loadMenuPage"));
	});

	function resetBall(auto = true) {
		if (resetTimeout) {
			clearTimeout(resetTimeout);
			resetTimeout = undefined;
		}
		ballX = fieldWidth / 2 - ballWidth / 2 - 4;
		ballY = fieldHeight / 2 - ballHeight / 2;
		ballVX = 0;
		ballVY = 0;
		gameStarted = false;
		if (auto && hasGameStartedOnce && !winner) {
			resetTimeout = setTimeout(() => {
				if (!winner) {
					gameStarted = true;
					ballVX = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
					ballVY = ballSpeed * (Math.random() * 2 - 1);
				}
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
		gameStarted = false;
		winner = null;
		showPressSpace = true;
		lastBotUpdate = 0;
	}

	function rect(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		w: number,
		h: number
	) {
		ctx.beginPath();
		ctx.rect(x, y, w, h);
		ctx.closePath();
		ctx.fill();
	}

	function update() {
		if (isMultiplayer) {
			// In multiplayer, each player only controls their assigned paddle
			if (playerSide === "left") {
				// Left player controls left paddle with w/s keys
				if (keys.w) leftY -= paddleSpeed;
				if (keys.s) leftY += paddleSpeed;
				leftY = Math.max(
					0,
					Math.min(fieldHeight - paddleHeight, leftY)
				);

				if (leftY !== leftYOld) {
					ws?.send(
						JSON.stringify({
							type: "paddleMove",
							y: leftY,
						})
					);
					leftYOld = leftY;
				}
			} else if (playerSide === "right") {
				// Right player controls right paddle with w/s keys (same as left player)
				if (keys.w) rightY -= paddleSpeed;
				if (keys.s) rightY += paddleSpeed;
				rightY = Math.max(
					0,
					Math.min(fieldHeight - paddleHeight, rightY)
				);

				if (rightY !== rightYOld) {
					ws?.send(
						JSON.stringify({
							type: "paddleMove",
							y: rightY,
						})
					);
					rightYOld = rightY;
				}
			}
		} else {
			if (keys.w) leftY -= paddleSpeed;
			if (keys.s) leftY += paddleSpeed;
			leftY = Math.max(0, Math.min(fieldHeight - paddleHeight, leftY));

			if (gameMode === "ai") {
				console.log("DEBUG: AI mode activated", {
					gameMode,
					isMultiplayer,
					leftPlayerId,
					rightPlayerId,
				});
				// AI opponent logic
				const now = Date.now();
				if (now - lastBotUpdate >= 1000) {
					botAI.update({
						ballX,
						ballY,
						ballVX,
						ballVY,
						ballWidth,
						ballHeight,
						rightY,
						paddleHeight,
						fieldWidth,
						fieldHeight,
					});
					lastBotUpdate = now;
				}

				const aiKeys = botAI.getCurrentKeys();
				if (aiKeys.ArrowUp) rightY -= paddleSpeed;
				if (aiKeys.ArrowDown) rightY += paddleSpeed;
				rightY = Math.max(
					0,
					Math.min(fieldHeight - paddleHeight, rightY)
				);
			}
			leftYOld = leftY;
			rightYOld = rightY;
		}

		if (!gameStarted) return;

		// Ball physics - only controlled by left player in multiplayer
		if (isMultiplayer && playerSide !== "left") return;

		let ballXOld = ballX,
			ballYOld = ballY;
		let ballVXOld = ballVX,
			ballVYOld = ballVY;
		let gameStartedOld = gameStarted;

		ballX += ballVX;
		ballY += ballVY;

		// Ball collision with top/bottom walls
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
			ballVY +=
				(ballY + ballHeight / 2 - (leftY + paddleHeight / 2)) * 0.15;
		}

		// Right paddle collision
		if (
			ballX + ballWidth >= fieldWidth - 32 &&
			ballY + ballHeight > rightY &&
			ballY < rightY + paddleHeight
		) {
			ballVX = -Math.abs(ballVX);
			ballVY +=
				(ballY + ballHeight / 2 - (rightY + paddleHeight / 2)) * 0.15;
			if (!isMultiplayer && gameMode === "ai") {
				botAI.recordHit();
			}
		}

		// Scoring logic
		if (ballX < 0 && !winner) {
			rightScore++;
			updateScoreDisplay();

			console.log("DEBUG: Right player scored, new score:", {
				leftScore,
				rightScore,
			});

			if (rightScore >= 5) {
				winner = "right";
				setBannerGlow("right");
				if (!isMultiplayer) {
					rightPlayerName = "Bot";
				}
				showWinnerModal("right");
				gameStarted = false;
				console.log(
					"DEBUG: Right player won locally, calling savePvPGameResult"
				);

				// Call save function for local wins too
				if (isMultiplayer || gameMode === "tournament") {
					savePvPGameResult().catch((error) => {
						console.error("Error saving game result:", error);
					});
				}
			} else {
				resetBall();
			}

			if (isMultiplayer && ws && playerSide === "left") {
				console.log("DEBUG: Sending scoreUpdate to WebSocket");
				ws.send(
					JSON.stringify({
						type: "scoreUpdate",
						leftScore: leftScore,
						rightScore: rightScore,
						winner: winner,
					})
				);
			}
			return;
		}

		if (ballX + ballWidth > fieldWidth && !winner) {
			leftScore++;
			updateScoreDisplay();

			console.log("DEBUG: Left player scored, new score:", {
				leftScore,
				rightScore,
			});

			if (leftScore >= 5) {
				winner = "left";
				setBannerGlow("left");
				if (playerUsername && playerUsername !== "Player") {
					leftPlayerName = playerUsername;
				}
				showWinnerModal("left");
				gameStarted = false;
				console.log(
					"DEBUG: Left player won locally, calling savePvPGameResult"
				);

				// Call save function for local wins too
				if (isMultiplayer || gameMode === "tournament") {
					savePvPGameResult().catch((error) => {
						console.error("Error saving game result:", error);
					});
				}
			} else {
				resetBall();
			}

			if (isMultiplayer && ws && playerSide === "left") {
				console.log("DEBUG: Sending scoreUpdate to WebSocket");
				ws.send(
					JSON.stringify({
						type: "scoreUpdate",
						leftScore: leftScore,
						rightScore: rightScore,
						winner: winner,
					})
				);
			}

			if (!isMultiplayer && gameMode === "ai") {
				botAI.recordMiss();
			}
			return;
		}

		// Send ball updates for multiplayer
		if (isMultiplayer && ws && playerSide === "left") {
			if (
				ballX !== ballXOld ||
				ballY !== ballYOld ||
				ballVX !== ballVXOld ||
				ballVY !== ballVYOld ||
				gameStarted !== gameStartedOld
			) {
				ws.send(
					JSON.stringify({
						type: "ballUpdate",
						ballX: ballX,
						ballY: ballY,
						ballVX: ballVX,
						ballVY: ballVY,
						gameStarted: gameStarted,
					})
				);
			}
		}
	}

	function draw() {
		ctx.clearRect(0, 0, fieldWidth, fieldHeight);

		// Always use current user's customization for their view
		// Each player sees the game with their own color preferences
		const safeCustomization = {
			paddle_color: currentUserCustomization?.paddle_color || "#4CF190",
			ball_color: currentUserCustomization?.ball_color || "#4CF190",
			board_color: currentUserCustomization?.board_color || "#07303c",
			border_color: currentUserCustomization?.border_color || "#4CF190",
		};

		// Set background color based on current player's preference
		canvas.style.backgroundColor = safeCustomization.board_color;

		// All elements use current player's customization colors
		// Left paddle - use current player's paddle color
		ctx.fillStyle = safeCustomization.paddle_color;
		rect(ctx, 16, leftY, paddleWidth, paddleHeight);

		// Right paddle - use current player's paddle color
		ctx.fillStyle = safeCustomization.paddle_color;
		rect(
			ctx,
			fieldWidth - 16 - paddleWidth,
			rightY,
			paddleWidth,
			paddleHeight
		);

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

			// Show different messages based on game state
			if (isMultiplayer && (!leftPlayerId || !rightPlayerId)) {
				ctx.fillText("Waiting for opponent...", 20, fieldHeight - 30);
			} else if (isMultiplayer && playerSide !== "left") {
				ctx.fillText(
					"Waiting for host to start...",
					20,
					fieldHeight - 30
				);
			} else {
				ctx.fillText("Press SPACE to start", 20, fieldHeight - 30);
			}

			ctx.fillText("Controls: w s", 20, 50);
			ctx.restore();
		}

		// Show PAUSED overlay when game is paused
		if (paused) {
			ctx.save();
			ctx.globalAlpha = 0.8;
			ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
			ctx.fillRect(0, 0, fieldWidth, fieldHeight);

			ctx.globalAlpha = 1;
			ctx.fillStyle = "#fff";
			ctx.font = "bold 48px Arial";
			ctx.textAlign = "center";
			ctx.fillText("PAUSED", fieldWidth / 2, fieldHeight / 2);
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
		if (paused) return; // Don't process any keys when game is paused
		if (e.code === "Space") startGame();
		if (e.key === "w" || e.key === "s") {
			keys[e.key] = true;
		}
	});
	window.addEventListener("keyup", (e) => {
		if (paused) return; // Don't process any keys when game is paused
		if (e.key === "w" || e.key === "s") {
			keys[e.key] = false;
		}
	});

	// Initialize scores and ball - wait for DOM to be ready
	await new Promise((resolve) => setTimeout(resolve, 50));
	leftScore = 0;
	rightScore = 0;
	updateScoreDisplay();
	resetBall();

	// Apply customization styling with multiple attempts to ensure DOM is ready
	const applyCustomizationWithRetry = () => {
		updateGameAreaStyling();
		// Try again after a short delay in case DOM wasn't ready
		setTimeout(() => updateGameAreaStyling(), 200);
		setTimeout(() => updateGameAreaStyling(), 500);
	};

	applyCustomizationWithRetry();
	// Check PvP
	if (opponentUsername) {
		opponentDisplayName = opponentUsername;
	}
	loop();
};
