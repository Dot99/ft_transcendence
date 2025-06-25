import { playTemplate } from "./templates/playTemplate.js";
import { getCookie, getUserIdFromToken } from "./utils/auth.js";
const API_BASE_URL = "http://localhost:3000/api";

// Utility to get element by id
const getElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id) as T;
  if (!element) throw new Error(`Element with id ${id} not found`);
  return element;
};

export const loadPlayPage = async (): Promise<void> => {
  const app = getElement<HTMLElement>("app");
  app.innerHTML = playTemplate;
  const userId = getUserIdFromToken();
  // Fetch user info and update the player panel
  let playerUsername = "Player";
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${getCookie("jwt")}`,
      },
    });
    if (res.ok) {
      const user = await res.json();
      console.log("User profile fetched:", user);
      playerUsername = user.user.username || "Player";
      getElement<HTMLElement>("player-username").textContent = playerUsername;
      const avatar = getElement<HTMLImageElement>("player-avatar");
      if (user.user.pfp) {
        avatar.src = user.user.pfp;
        avatar.style.display = "";
      } else {
        avatar.src = "images/default-avatar.png";
        avatar.style.display = "none";
      }
    }
  } catch {}

  // Winner Modal elements
  const winnerModal = getElement<HTMLDivElement>("winnerModal");
  const winnerUsernameSpan = getElement<HTMLElement>("winnerUsername");
  const playAgainBtn = getElement<HTMLButtonElement>("playAgainBtn");
  const menuBtn = getElement<HTMLButtonElement>("menuBtn");

  function showWinnerModal(winnerSide: "left" | "right") {
    winnerUsernameSpan.textContent =
      winnerSide === "left" ? playerUsername : opponentDisplayName;
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
  let ballX = fieldWidth / 2 - ballWidth / 2,
    ballY = fieldHeight / 2 - ballHeight / 2;
  let ballVX = 0,
    ballVY = 0;
  let leftScore = 0,
    rightScore = 0;
  let gameStarted = false;
  const keys: Record<string, boolean> = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false,
  };
  const response = await fetch(
    `${API_BASE_URL}/games/costumization/${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("jwt")}`,
      },
    }
  );
  const data = await response.json();
  const paddleColor = data.paddle_color ?? "#4CF190";
  const ballColor = data.ball_color ?? "#4CF190";
  const boardColor = data.board_color ?? "#07303c";
  const borderColor = data.border_color ?? "#4CF190";

  let winner: "left" | "right" | null = null;
  let hasGameStartedOnce = false;
  let showPressSpace = true;
  let paused = false;
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
    leftScore = 0;
    rightScore = 0;
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
    if (keys.w) leftY -= paddleSpeed;
    if (keys.s) leftY += paddleSpeed;
    leftY = Math.max(0, Math.min(fieldHeight - paddleHeight, leftY));

    if (keys.ArrowUp) rightY -= paddleSpeed;
    if (keys.ArrowDown) rightY += paddleSpeed;
    rightY = Math.max(0, Math.min(fieldHeight - paddleHeight, rightY));

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

  async function draw() {
    ctx.clearRect(0, 0, fieldWidth, fieldHeight);

    // Left paddle
    ctx.fillStyle = paddleColor;
    rect(ctx, 16, leftY, paddleWidth, paddleHeight);

    // Right paddle
    ctx.fillStyle = paddleColor;
    rect(ctx, fieldWidth - 16 - paddleWidth, rightY, paddleWidth, paddleHeight);

    // Ball
    ctx.fillStyle = ballColor;
    ctx.beginPath();
    ctx.arc(
      ballX + ballWidth / 2,
      ballY + ballHeight / 2,
      ballWidth / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    const pongContainer = document.getElementById("pong-container");
    if (pongContainer) {
      pongContainer.style.backgroundColor = boardColor;
      pongContainer.style.borderColor = borderColor;

      const centerLine = pongContainer.querySelectorAll("div > div > div");
      centerLine.forEach((segment) => {
        (segment as HTMLElement).style.backgroundColor = paddleColor;
      });
    }

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
  }

  function updateScoreDisplay() {
    getElement("player-score").textContent = leftScore
      .toString()
      .padStart(2, "0");
    getElement("bot-score").textContent = rightScore
      .toString()
      .padStart(2, "0");
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

  // Check PvP
  const opponentUsername = sessionStorage.getItem("pvpOpponent");
  if (opponentUsername) {
    opponentDisplayName = opponentUsername;
    // Set the right panel username to the input by default
    const botUsernameElem = document.getElementById(
      "bot-username"
    ) as HTMLElement | null;
    if (botUsernameElem) botUsernameElem.textContent = opponentUsername;

    // Try to fetch opponent profile from backend
    try {
      const res = await fetch(
        `${API_BASE_URL}/users/username/${opponentUsername}`,
        {
          headers: {
            Authorization: `Bearer ${getCookie("jwt")}`,
          },
        }
      );
      if (res.ok) {
        const user = await res.json();
        if (botUsernameElem)
          botUsernameElem.textContent = user.user.username || opponentUsername;
        const botBanner = getElement<HTMLImageElement>("bot-avatar");
        if (botBanner) {
          if (user.user.pfp) {
            botBanner.src = user.user.pfp;
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
