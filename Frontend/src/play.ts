import { playTemplate } from "./templates/playTemplate.js";

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
        const res = await fetch("/api/user/profile", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
        });
        if (res.ok) {
            const user = await res.json();
            playerUsername = user.username || "Player";
            getElement<HTMLElement>("player-username").textContent = playerUsername;
            const avatar = getElement<HTMLImageElement>("player-avatar");
            if (user.pfp) {
                avatar.src = `images/${user.pfp}`;
                avatar.style.display = "";
            } else {
                avatar.style.display = "none";
            }
        }
    } catch {
        // fallback: do nothing
    }

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
        hasGameStartedOnce = false; // Require space bar for next serve
        resetGame();
    });
    menuBtn.addEventListener("click", () => {
        hideWinnerModal();
        window.dispatchEvent(new Event("loadMenuPage"));
    });

    const canvas = getElement<HTMLCanvasElement>("pong-canvas");
    const ctx = canvas.getContext("2d")!;

    const paddleWidth = 16, paddleHeight = 64, paddleSpeed = 6;
    const ballWidth = 20, ballHeight = 20, ballSpeed = 4;
    const fieldWidth = canvas.width, fieldHeight = canvas.height;

    let leftY = fieldHeight / 2 - paddleHeight / 2;
    let rightY = fieldHeight / 2 - paddleHeight / 2;
    let ballX = fieldWidth / 2 - ballWidth / 2, ballY = fieldHeight / 2 - ballHeight / 2;
    let ballVX = 0, ballVY = 0;
    let leftScore = 0, rightScore = 0;
    let gameStarted = false;
    const keys: Record<string, boolean> = { w: false, s: false, ArrowUp: false, ArrowDown: false };

    let winner: "left" | "right" | null = null;
    let hasGameStartedOnce = false; // Add this at the top with your other let variables
    let showPressSpace = true; // Add this after your canvas/ctx setup
    let paused = false; // Add paused variable
    let opponentDisplayName = "Bot";

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
        hasGameStartedOnce = false; // Require space bar for next serve
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
        paused = true; // Pause the game
    });
    continueGameBtn.addEventListener("click", () => {
        giveUpModal.classList.add("hidden");
        paused = false; // Unpause the game
    });
    giveUpMenuBtn.addEventListener("click", () => {
        giveUpModal.classList.add("hidden");
        paused = false; // Unpause if going to menu
        window.dispatchEvent(new Event("loadMenuPage"));
    });

    function startGame() {
        if (winner) {
            hideWinnerModal();
            clearBannerGlow();
            winner = null;
            resetGame();
        }
        // Only allow space bar to start the game if it hasn't started once yet
        if (!gameStarted && !winner && !hasGameStartedOnce) {
            gameStarted = true;
            hasGameStartedOnce = true;
            showPressSpace = false; // Hide the text after first serve
            ballVX = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
            ballVY = ballSpeed * (Math.random() * 2 - 1);
        }
    }

    // When centering the ball, subtract a few pixels from the X position
    function resetBall(auto = true) {
        // Move the ball 20 pixels to the left of center
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
        showPressSpace = true; // Show the text again after Play Again
        resetBall(false); // Do NOT auto-start after Play Again
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
        // Player paddle (left, controlled by WS)
        if (keys.w) leftY -= paddleSpeed;
        if (keys.s) leftY += paddleSpeed;
        leftY = Math.max(0, Math.min(fieldHeight - paddleHeight, leftY));

        // Player paddle (right, controlled by arrows)
        if (keys.ArrowUp) rightY -= paddleSpeed;
        if (keys.ArrowDown) rightY += paddleSpeed;
        rightY = Math.max(0, Math.min(fieldHeight - paddleHeight, rightY));

        if (!gameStarted) return;

        // Move ball
        ballX += ballVX;
        ballY += ballVY;

        // Ball collision with top/bottom
        if (ballY <= 0 || ballY + ballHeight >= fieldHeight) ballVY *= -1;

        // Ball collision with paddles
        // Left paddle
        if (
            ballX <= 32 &&
            ballY + ballHeight > leftY &&
            ballY < leftY + paddleHeight
        ) {
            ballVX = Math.abs(ballVX);
            ballVY += (ballY + ballHeight / 2 - (leftY + paddleHeight / 2)) * 0.15;
        }
        // Right paddle
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
            return;
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

        // Ball (draw as a circle)
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

        // Draw "Press SPACE to start" overlay and command hints
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
            // Left: Arrow keys
            ctx.fillText(
                "Controls: w s",
                20,
                50
            );
            // Right: WSAD
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
    updateScoreDisplay();
    resetBall();

    // Check if playing vs player
    const opponentUsername = sessionStorage.getItem("pvpOpponent");
    if (opponentUsername) {
        opponentDisplayName = opponentUsername;
        const botUsernameElem = document.getElementById("bot-score")?.previousElementSibling as HTMLElement | null;
        if (botUsernameElem) botUsernameElem.textContent = opponentUsername;

        // Try to fetch opponent profile (replace with your actual API if needed)
        try {
            const res = await fetch(`/api/user/profile?username=${encodeURIComponent(opponentUsername)}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (res.ok) {
                const user = await res.json();
                // Update avatar if available
                const botBanner = document.getElementById("bot-banner");
                if (botBanner) {
                    if (user.pfp) {
                        botBanner.innerHTML = `<img src="images/${user.pfp}" alt="${user.username}" class="w-24 h-24 rounded" />`;
                    } else {
                        // No profile image: show empty (no img)
                        botBanner.innerHTML = "";
                    }
                }
            } else {
                // If user not found, show empty image and keep input name
                const botBanner = document.getElementById("bot-banner");
                if (botBanner) {
                    botBanner.innerHTML = "";
                }
            }
        } catch {
            // On error, show empty image and keep input name
            const botBanner = document.getElementById("bot-banner");
            if (botBanner) {
                botBanner.innerHTML = "";
            }
        }
        // Remove opponent from sessionStorage so next game is vs bot by default
        sessionStorage.removeItem("pvpOpponent");
    }

    loop();
};