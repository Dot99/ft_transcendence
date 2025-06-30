import { playTemplate } from "./templates/playTemplate.js";
import { getCookie } from "./utils/auth.js";

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
            const userId = JSON.parse(atob(jwt.split('.')[1])).id;
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
                    avatar.src = `images/${user.pfp}`;
                    avatar.style.display = "";
                }
            }
        }
    } catch {}

    // Winner Modal elements
    const winnerModal = getElement<HTMLDivElement>("winnerModal");
    const winnerUsernameSpan = getElement<HTMLElement>("winnerUsername");
    const playAgainBtn = getElement<HTMLButtonElement>("playAgainBtn");
    const menuBtn = getElement<HTMLButtonElement>("menuBtn");

    function showWinnerModal(winnerSide: "left" | "right") {
        winnerUsernameSpan.textContent = winnerSide === "left"
            ? playerUsername
            : opponentDisplayName;
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
        
        // Set the right panel username to the opponent
        const botUsernameElem = document.getElementById("bot-username") as HTMLElement | null;
        if (botUsernameElem) botUsernameElem.textContent = opponentUsername;

        // Try to fetch opponent profile from backend
        try {
            const res = await fetch(`/api/users/username/${encodeURIComponent(opponentUsername)}`, {
                headers: {
                    Authorization: `Bearer ${getCookie("jwt")}`,
                },
            });
            if (res.ok) {
                const user = await res.json();
                if (botUsernameElem) botUsernameElem.textContent = user.username || opponentUsername;
                const botBanner = document.getElementById("bot-banner");
                if (botBanner) {
                    if (user.pfp) {
                        botBanner.innerHTML = `<img src="images/${user.pfp}" alt="${user.username}" class="w-24 h-24 rounded" />`;
                    } else {
                        botBanner.innerHTML = "";
                    }
                }
            } else {
                const botBanner = document.getElementById("bot-banner");
                if (botBanner) botBanner.innerHTML = "";
            }
        } catch {
            const botBanner = document.getElementById("bot-banner");
            if (botBanner) botBanner.innerHTML = "";
        }
        
        // Clean up session storage
        sessionStorage.removeItem("pvpOpponent");
        sessionStorage.removeItem("gameId");
        
        // Connect to WebSocket for multiplayer game
        connectToGame();
    }

    function connectToGame() {
        if (!gameId) return;
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws?token=${getCookie("jwt")}&gameId=${gameId}`;
        
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log("Connected to game WebSocket");
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === "gameReady") {
                    playerSide = data.yourSide;
                    console.log(`You are playing on the ${playerSide} side`);
                    
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
                    console.log(`[DEBUG] Received paddle update: ${data.side} paddle to Y=${data.y}`);
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
                    console.log("Opponent left the game - you win!");
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
    giveUpMenuBtn.addEventListener("click", () => {
        giveUpModal.classList.add("hidden");
        paused = false;
        
        // In multiplayer, notify the opponent that you're giving up
        if (isMultiplayer && ws) {
            ws.send(JSON.stringify({
                type: "giveUp"
            }));
        }
        
        // Close WebSocket connection
        if (ws) {
            ws.close();
        }
        
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
                    console.log(`[DEBUG] Left player pressing W, leftY: ${leftY} -> ${leftY - paddleSpeed}`);
                    leftY -= paddleSpeed;
                }
                if (keys.s) {
                    console.log(`[DEBUG] Left player pressing S, leftY: ${leftY} -> ${leftY + paddleSpeed}`);
                    leftY += paddleSpeed;
                }
                leftY = Math.max(0, Math.min(fieldHeight - paddleHeight, leftY));
            } else if (playerSide === "right") {
                // Right player can use both WASD and arrow keys for convenience
                if (keys.ArrowUp || keys.w) {
                    console.log(`[DEBUG] Right player pressing Up/W, rightY: ${rightY} -> ${rightY - paddleSpeed}`);
                    rightY -= paddleSpeed;
                }
                if (keys.ArrowDown || keys.s) {
                    console.log(`[DEBUG] Right player pressing Down/S, rightY: ${rightY} -> ${rightY + paddleSpeed}`);
                    rightY += paddleSpeed;
                }
                rightY = Math.max(0, Math.min(fieldHeight - paddleHeight, rightY));
            }
        } else {
            // Single player mode - control both paddles
            if (keys.w) leftY -= paddleSpeed;
            if (keys.s) leftY += paddleSpeed;
            leftY = Math.max(0, Math.min(fieldHeight - paddleHeight, leftY));

            if (keys.ArrowUp) rightY -= paddleSpeed;
            if (keys.ArrowDown) rightY += paddleSpeed;
            rightY = Math.max(0, Math.min(fieldHeight - paddleHeight, rightY));
        }

        // Send paddle updates for multiplayer
        if (isMultiplayer && ws) {
            if (playerSide === "left" && leftY !== leftYOld) {
                console.log(`[DEBUG] Left player sending paddle move: Y=${leftY} (was ${leftYOld})`);
                ws.send(JSON.stringify({
                    type: "paddleMove",
                    y: leftY
                }));
                leftYOld = leftY; // Update old position immediately after sending
            } else if (playerSide === "right" && rightY !== rightYOld) {
                console.log(`[DEBUG] Right player sending paddle move: Y=${rightY} (was ${rightYOld})`);
                ws.send(JSON.stringify({
                    type: "paddleMove", 
                    y: rightY
                }));
                rightYOld = rightY; // Update old position immediately after sending
            } else {
                // Debug why no paddle update is being sent
                if (playerSide === "right") {
                    console.log(`[DEBUG] Right player not sending update: rightY=${rightY}, rightYOld=${rightYOld}, equal=${rightY === rightYOld}`);
                }
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

        // Left paddle
        ctx.fillStyle = "#4CF190";
        rect(ctx, 16, leftY, paddleWidth, paddleHeight);

        // Right paddle
        ctx.fillStyle = "#4CF190";
        rect(ctx, fieldWidth - 16 - paddleWidth, rightY, paddleWidth, paddleHeight);

        // Ball
        ctx.fillStyle = "#4CF190";
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

    function updateScoreDisplay() {
        getElement("player-score").textContent = leftScore.toString().padStart(2, "0");
        getElement("bot-score").textContent = rightScore.toString().padStart(2, "0");
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
        console.log(`[DEBUG] Keydown: ${e.key}, playerSide: ${playerSide}, isMultiplayer: ${isMultiplayer}`);
        if (e.code === "Space") startGame();
        if (e.key === "w" || e.key === "s" || e.key === "ArrowUp" || e.key === "ArrowDown") {
            keys[e.key] = true;
            console.log(`[DEBUG] Key ${e.key} set to true`);
        }
    });
    window.addEventListener("keyup", (e) => {
        if (e.key === "w" || e.key === "s" || e.key === "ArrowUp" || e.key === "ArrowDown") {
            keys[e.key] = false;
            console.log(`[DEBUG] Key ${e.key} set to false`);
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
        // Set the right panel username to the opponent username
        const botUsernameElem = document.getElementById("bot-username") as HTMLElement | null;
        if (botUsernameElem) botUsernameElem.textContent = opponentUsername;

        // Try to fetch opponent profile from backend
        try {
            const res = await fetch(`/api/users/username/${encodeURIComponent(opponentUsername)}`, {
                headers: {
                    Authorization: `Bearer ${getCookie("jwt")}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                const user = data.user;
                if (botUsernameElem) botUsernameElem.textContent = user.username || opponentUsername;
                const botBanner = document.getElementById("bot-banner");
                if (botBanner) {
                    if (user.pfp) {
                        botBanner.innerHTML = `<img src="images/${user.pfp}" alt="${user.username}" class="w-24 h-24 rounded" />`;
                    } else {
                        botBanner.innerHTML = "";
                    }
                }
            } else {
                // If user lookup fails, just use the username we have
                console.log("Could not fetch opponent profile, using username:", opponentUsername);
                const botBanner = document.getElementById("bot-banner");
                if (botBanner) botBanner.innerHTML = "";
            }
        } catch (error) {
            console.log("Error fetching opponent profile:", error);
            const botBanner = document.getElementById("bot-banner");
            if (botBanner) botBanner.innerHTML = "";
        }
        sessionStorage.removeItem("pvpOpponent");
    }

    loop();
};