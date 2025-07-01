import { playTemplate } from "./templates/playTemplate.js";
import { BotAI, KeyState } from "./botAI.js";

const botAI = new BotAI();

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
    let hasGameStartedOnce = false;
    let showPressSpace = true;
    let paused = false;
    let opponentDisplayName = "Bot";

    const playMode = sessionStorage.getItem("playMode") || "ai";
    const isPvP = playMode === "pvp";

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
        window.dispatchEvent(new Event("loadMenuPage"));
    });

    function startGame() {
        if (winner) {
            hideWinnerModal();
            clearBannerGlow();
            winner = null;
            hasGameStartedOnce = false;
            resetGame();
        }
        if (!gameStarted && !winner && !hasGameStartedOnce) {
            gameStarted = true;
            hasGameStartedOnce = true;
            showPressSpace = false;
            ballVX = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
            ballVY = ballSpeed * (Math.random() * 2 - 1);
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

    let lastBotUpdate = 0;

    function update() {
        if (keys.w) leftY -= paddleSpeed;
        if (keys.s) leftY += paddleSpeed;
        leftY = Math.max(0, Math.min(fieldHeight - paddleHeight, leftY));

        if (!isPvP) {
            const now = Date.now();
            // AI can only update its view once per second (constraint requirement)
            if (now - lastBotUpdate >= 1000) {
                botAI.update({
                    ballX, ballY, ballVX, ballVY, ballWidth, ballHeight,
                    rightY, paddleHeight, fieldWidth, fieldHeight
                }, keys);
                lastBotUpdate = now;
            } else {
                // Between AI updates, maintain the last movement decision
                const currentKeys = botAI.getCurrentKeys();
                keys.ArrowUp = currentKeys.ArrowUp;
                keys.ArrowDown = currentKeys.ArrowDown;
            }
            
            // Bot movement continues based on AI decision
            if (keys.ArrowUp) rightY -= paddleSpeed;
            if (keys.ArrowDown) rightY += paddleSpeed;
            rightY = Math.max(0, Math.min(fieldHeight - paddleHeight, rightY));
        } else {
            // Human controls
            if (keys.ArrowUp) rightY -= paddleSpeed;
            if (keys.ArrowDown) rightY += paddleSpeed;
            rightY = Math.max(0, Math.min(fieldHeight - paddleHeight, rightY));
        }

        if (!gameStarted) return;

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
            ballX + ballWidth >= fieldWidth - paddleWidth && 
            ballY + ballHeight >= rightY && ballY <= rightY + paddleHeight
        ) {
            ballVX = -Math.abs(ballVX);
            ballVY += (ballY + ballHeight / 2 - (rightY + paddleHeight / 2)) * 0.15;
            if (!isPvP) {
                botAI.recordHit(); // Track successful hit
            }
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

        // When ball goes past right paddle (bot misses):
        if (ballX >= fieldWidth) {
            if (!isPvP) {
                botAI.recordMiss(); // Track miss
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
    const opponentUsername = sessionStorage.getItem("pvpOpponent");
    if (opponentUsername) {
        opponentDisplayName = opponentUsername;
        // Set the right panel username to the input by default
        const botUsernameElem = document.getElementById("bot-username") as HTMLElement | null;
        if (botUsernameElem) botUsernameElem.textContent = opponentUsername;

        // Try to fetch opponent profile from backend
        try {
            const res = await fetch(`/api/users/username/${encodeURIComponent(opponentUsername)}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
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
        sessionStorage.removeItem("pvpOpponent");
    }

    loop();
};
