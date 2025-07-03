import { playTemplate } from "./templates/playTemplate.js";
import { getCookie, getUserIdFromToken } from "./utils/auth.js";
import { WS_BASE_URL, API_BASE_URL } from "./config.js";
import { BotAI } from "./botAI.js";

const botAI = new BotAI();
let resetTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

// Utility to get element by id
const getElement = <T extends HTMLElement>(id: string): T => {
    const element = document.getElementById(id) as T;
    if (!element) throw new Error(`Element with id ${id} not found`);
    return element;
};

export const loadPlayPage = async (): Promise<void> => {
    const app = getElement<HTMLElement>("app");
    app.innerHTML = playTemplate;
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
                getElement<HTMLElement>("player-username").textContent =
                    leftPlayerName;
                const avatar = getElement<HTMLImageElement>("player-avatar");
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
        // Force a direct DOM read of current displayed names
        const displayedLeftName =
            getElement<HTMLElement>("player-username").textContent ||
            leftPlayerName;
        const displayedRightName =
            getElement<HTMLElement>("bot-username").textContent ||
            rightPlayerName;

        if (winnerSide === "left") {
            winnerUsernameSpan.textContent = displayedLeftName;
        } else {
            winnerUsernameSpan.textContent = displayedRightName;
        }

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
        if (leftScore !== 0 || rightScore !== 0) {
            console.log("Forcing score reset after play again");
            leftScore = 0;
            rightScore = 0;
            updateScoreDisplay();
        }
    });
    menuBtn.addEventListener("click", () => {
        hideWinnerModal();
        ballVX = 0;
        ballVY = 0;
        leftScore = 0;
        rightScore = 0;
        gameStarted = false;
        hasGameStartedOnce = false;
        winner = null;

        // Clear any timers or pending callbacks
        clearTimeout(resetTimeout);
        if (ws) {
            ws.close();
        }
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

    // Get play mode from session storage (ai or pvp)
    const playMode = sessionStorage.getItem("playMode") || "ai";
    const isPvP = playMode === "pvp";

    if (!isMultiplayer) {
        rightPlayerName = isPvP ? "Player 2" : "Bot";
        // Update the display
        getElement<HTMLElement>("bot-username").textContent = rightPlayerName;
    }

    // Check PvP
    const opponentUsername = sessionStorage.getItem("pvpOpponent");
    const gameIdFromSession = sessionStorage.getItem("gameId");

    // Load current user's customization first
    await loadCurrentUserCustomization();

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

    function updateScoreDisplay() {
        getElement("player-score").textContent = leftScore
            .toString()
            .padStart(2, "0");
        getElement("bot-score").textContent = rightScore
            .toString()
            .padStart(2, "0");
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

    // Function to refresh customization (can be called when user changes settings)
    window.refreshGameCustomization = loadCurrentUserCustomization;

    function startGame() {
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
        if (!gameStarted && !winner && !hasGameStartedOnce) {
            // In multiplayer, only left player can start the game
            if (isMultiplayer && playerSide !== "left") return;
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
        // Only save results for multiplayer games
        if (!isMultiplayer || !leftPlayerId || !rightPlayerId) {
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
            // If winner is null, it's a tie (though pong typically doesn't have ties)

            const gameData = {
                player1: leftPlayerId,
                player2: rightPlayerId,
                player1_score: leftScore,
                player2_score: rightScore,
                winner: winnerId,
            };

            console.log("Saving game result:", gameData);

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
                console.log("Game result saved successfully:", result);
            } else {
                const error = await response.text();
                console.error("Failed to save game result:", error);
            }
        } catch (error) {
            console.error("Error saving game result:", error);
        }
        if (!isMultiplayer) {
            if (isPvP) {
                rightPlayerName = "Player 2";
            } else {
                rightPlayerName = "Bot";
            }
            getElement<HTMLElement>("bot-username").textContent =
                rightPlayerName;
        }
    }

    function connectToGame() {
        if (!gameId) return;
        const wsUrl = `${WS_BASE_URL}/api/ws?token=${getCookie(
            "jwt"
        )}&gameId=${gameId}`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("Connected to game WebSocket");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "gameReady") {
                    playerSide = data.yourSide;
                    // Store player IDs for saving game results
                    leftPlayerId = data.leftPlayerId;
                    rightPlayerId = data.rightPlayerId;

                    // Set multiplayer flag if we have both player IDs
                    if (leftPlayerId && rightPlayerId) {
                        isMultiplayer = true;
                        console.log(
                            "Multiplayer game detected - will save results"
                        );
                    }

                    // Set player names consistently - left panel = left player, right panel = right player
                    if (data.leftPlayerName && data.rightPlayerName) {
                        leftPlayerName = data.leftPlayerName;
                        rightPlayerName = data.rightPlayerName;
                        getElement<HTMLElement>("player-username").textContent =
                            leftPlayerName;
                        getElement<HTMLElement>("bot-username").textContent =
                            rightPlayerName;

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
                                                getElement<HTMLImageElement>(
                                                    "player-avatar"
                                                );
                                            if (leftResult) {
                                                leftPanelAvatar.src =
                                                    leftResult.src;
                                            }
                                            leftPanelAvatar.style.display = "";
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
                                                    getElement("bot-banner");
                                                const username = rightProfile
                                                    ? rightProfile.username
                                                    : "Player";
                                                const avatarImg = `<img src="${rightResult.src}" alt="${username}" class="w-24 h-24 rounded" />`;
                                                botBanner.innerHTML = avatarImg;
                                            }

                                            // Update styling after all data is loaded
                                            updateGameAreaStyling();

                                            // Final verification
                                            setTimeout(() => {
                                                const leftAvatar =
                                                    getElement<HTMLImageElement>(
                                                        "player-avatar"
                                                    );
                                                const rightAvatar =
                                                    document.querySelector(
                                                        "#bot-banner img"
                                                    ) as HTMLImageElement;
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
                        // Save game result to database
                        savePvPGameResult().catch((error) => {
                            console.error("Error saving game result:", error);
                        });
                    }
                } else if (data.type === "opponentLeft") {
                    // Opponent left the game - you win!
                    winner = data.winner;
                    gameStarted = false;
                    if (winner) {
                        setBannerGlow(winner);
                        showWinnerModal(winner);
                        // Save game result to database
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

        ws.onclose = () => {
            console.log("WebSocket connection closed");
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    }
    // Button actions
    winnerModal
        .querySelector("#playAgainBtn")
        ?.addEventListener("click", () => {
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
            await fetch("/api/matchmaking/leave", {
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

        // Clean up any remaining session storage
        sessionStorage.removeItem("pvpOpponent");
        sessionStorage.removeItem("gameId");

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

        // Reset AI state (important!)
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

    function roundRect(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
    ) {
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
        if (isMultiplayer && ws) {
            if (playerSide === "left" && leftY !== leftYOld) {
                ws.send(
                    JSON.stringify({
                        type: "paddleMove",
                        y: leftY,
                    })
                );
                leftYOld = leftY; // Update old position immediately after sending
            } else if (playerSide === "right" && rightY !== rightYOld) {
                ws.send(
                    JSON.stringify({
                        type: "paddleMove",
                        y: rightY,
                    })
                );
                rightYOld = rightY; // Update old position immediately after sending
            }
        } else {
            // Single player mode - AI or PvP local
            if (keys.w) leftY -= paddleSpeed;
            if (keys.s) leftY += paddleSpeed;
            leftY = Math.max(0, Math.min(fieldHeight - paddleHeight, leftY));

            if (!isPvP) {
                // AI opponent logic
                const now = Date.now();
                // AI can only update its view once per second (constraint requirement)
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
                } else {
                    // Between AI updates, maintain the last movement decision
                    const currentKeys = botAI.getCurrentKeys();
                    keys.ArrowUp = currentKeys.ArrowUp;
                    keys.ArrowDown = currentKeys.ArrowDown;
                }
                const aiKeys = botAI.getCurrentKeys();
                // Bot movement continues based on AI decision
                if (aiKeys.ArrowUp) rightY -= paddleSpeed;
                if (aiKeys.ArrowDown) rightY += paddleSpeed;
                rightY = Math.max(
                    0,
                    Math.min(fieldHeight - paddleHeight, rightY)
                );
            } else {
                // Human controls for right paddle in local PvP
                if (keys.ArrowUp) rightY -= paddleSpeed;
                if (keys.ArrowDown) rightY += paddleSpeed;
                rightY = Math.max(
                    0,
                    Math.min(fieldHeight - paddleHeight, rightY)
                );
            }
        }

        // Send paddle updates for multiplayer
        if (isMultiplayer && ws) {
            if (playerSide === "left" && leftY !== leftYOld) {
                ws.send(
                    JSON.stringify({
                        type: "paddleMove",
                        y: leftY,
                    })
                );
                leftYOld = leftY; // Update old position immediately after sending
            } else if (playerSide === "right" && rightY !== rightYOld) {
                ws.send(
                    JSON.stringify({
                        type: "paddleMove",
                        y: rightY,
                    })
                );
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

        let ballXOld = ballX,
            ballYOld = ballY;
        let ballVXOld = ballVX,
            ballVYOld = ballVY;
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
            if (!isMultiplayer && !isPvP) {
                botAI.recordHit(); // Track successful hit for AI
            }
        }

        // Score
        if (ballX < 0 && !winner) {
            rightScore++;
            updateScoreDisplay();

            if (rightScore >= 3) {
                winner = "right";
                setBannerGlow("right");
                if (!isMultiplayer) {
                    rightPlayerName = isPvP ? "Player 2" : "Bot";
                }
                showWinnerModal("right");
                gameStarted = false;
            } else {
                resetBall();
            }

            // Send score update for multiplayer (only left player)
            if (isMultiplayer && ws && playerSide === "left") {
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
            if (leftScore >= 3) {
                winner = "left";
                setBannerGlow("left");
                if (playerUsername && playerUsername !== "Player") {
                    leftPlayerName = playerUsername;
                }
                showWinnerModal("left");
                gameStarted = false;
            } else {
                resetBall();
            }

            // Send score update for multiplayer (only left player)
            if (isMultiplayer && ws && playerSide === "left") {
                ws.send(
                    JSON.stringify({
                        type: "scoreUpdate",
                        leftScore: leftScore,
                        rightScore: rightScore,
                        winner: winner,
                    })
                );
            }

            // When ball goes past right paddle (bot misses):
            if (!isMultiplayer && !isPvP) {
                botAI.recordMiss(); // Track miss for AI
            }

            return;
        }

        // Send ball updates for multiplayer (only left player controls ball)
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
            ctx.fillText("Press SPACE to start", 20, fieldHeight - 30);
            ctx.fillText("Controls: w s", 20, 50);
            ctx.textAlign = "right";
            ctx.fillText("Controls: ↑ ↓", fieldWidth - 20, 50);
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
        if (
            e.key === "w" ||
            e.key === "s" ||
            e.key === "ArrowUp" ||
            e.key === "ArrowDown"
        ) {
            keys[e.key] = true;
        }
    });
    window.addEventListener("keyup", (e) => {
        if (paused) return; // Don't process any keys when game is paused
        if (
            e.key === "w" ||
            e.key === "s" ||
            e.key === "ArrowUp" ||
            e.key === "ArrowDown"
        ) {
            keys[e.key] = false;
        }
    });

    // Initialize scores and ball
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
        sessionStorage.removeItem("pvpOpponent");
    }
    if (!isMultiplayer) {
        if (isPvP) {
            rightPlayerName = "Player 2";
        } else {
            rightPlayerName = "Bot";
        }
        getElement<HTMLElement>("bot-username").textContent = rightPlayerName;
    }
    loop();
};
