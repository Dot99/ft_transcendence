import { menuTemplate } from "./templates/menuTemplate.js";
import { loadProfilePage } from "./profile.js";
import { deleteCookie } from "./utils/auth.js";
import { loadHomePage } from "./index.js";
import { getCookie, getUserIdFromToken } from "./utils/auth.js";
import { API_BASE_URL } from "./config.js";
import { loadPlayPage } from "./play.js";
import { stopOnlineWebSocket } from "./utils/ws.js";
import { getLang, t } from "./locales/localeMiddleware.js";
import { loadTournamentPage } from "./tournament.js";

// Extend window type for game customization refresh
declare global {
	interface Window {
		refreshGameCustomization?: () => void;
	}
}

// Utility to get element by id
const getElement = <T extends HTMLElement>(id: string): T => {
	const element = document.getElementById(id) as T;
	if (!element) throw new Error(`Element with id ${id} not found`);
	return element;
};

function translateMenuStaticTexts() {
	// Navigation dropdown
	const gotoProfileBtn = document.getElementById("gotoProfile");
	if (gotoProfileBtn) gotoProfileBtn.textContent = t("menu_profile");
	const logoutBtn = document.getElementById("logoutBtn");
	if (logoutBtn) logoutBtn.textContent = t("menu_logout");

	// Main left buttons
	const btnPvAI = document.getElementById("btnPvAI");
	if (btnPvAI) btnPvAI.textContent = t("menu_player_vs_ai");
	const btnPvP = document.getElementById("btnPvP");
	if (btnPvP) btnPvP.textContent = t("menu_player_vs_player");
	const btnTournament = document.getElementById("btnTournament");
	if (btnTournament) btnTournament.textContent = t("menu_tournaments");

	// Customization section
	const customizationTitle = document.querySelector(
		"#customizationSection h2"
	);
	if (customizationTitle)
		customizationTitle.textContent = t("menu_customize");

	// Color labels (fixed selectors)
	const paddleLabel = document.querySelector("label[for='colorPaddle'] span");
	if (paddleLabel) paddleLabel.textContent = t("menu_paddle");
	const ballLabel = document.querySelector("label[for='colorBall'] span");
	if (ballLabel) ballLabel.textContent = t("menu_ball");
	const boardLabel = document.querySelector("label[for='colorBoard'] span");
	if (boardLabel) boardLabel.textContent = t("menu_board");
	const boardBorderLabel = document.querySelector(
		"label[for='colorBoardBorder'] span"
	);
	if (boardBorderLabel) boardBorderLabel.textContent = t("menu_board_border");

	// Tournament Modal
	const tournamentModalTitle = document.querySelector("#tournamentModal h2");
	if (tournamentModalTitle)
		tournamentModalTitle.textContent = t("menu_tournaments");
	const createTournamentBtn = document.getElementById("createTournament");
	if (createTournamentBtn)
		createTournamentBtn.textContent = t("menu_create_tournament");
	const joinTournamentBtn = document.getElementById("joinTournament");
	if (joinTournamentBtn)
		joinTournamentBtn.textContent = t("menu_join_tournament");

	// Create Tournament Modal
	const createTournamentModalTitle = document.querySelector(
		"#createTournamentModal h2"
	);
	if (createTournamentModalTitle)
		createTournamentModalTitle.textContent = t(
			"menu_create_tournament_title"
		);
	const tournamentNameLabel = document.querySelector(
		"#createTournamentForm label span.text-white.font-semibold"
	);
	if (tournamentNameLabel)
		tournamentNameLabel.textContent = t("menu_tournament_name");
	const numberOfPlayersLabel = document
		.querySelector("#playerCountBtns")
		?.parentElement?.querySelector("span.text-white.font-semibold.mb-1");
	if (numberOfPlayersLabel)
		numberOfPlayersLabel.textContent = t("menu_number_of_players");
	const startDateLabel = document
		.querySelector("input#tournamentDate")
		?.parentElement?.querySelector("span.text-white.font-semibold");
	if (startDateLabel) startDateLabel.textContent = t("menu_start_date");
	const createBtn = document.querySelector(
		"#createTournamentForm button[type='submit']"
	);
	if (createBtn) createBtn.textContent = t("menu_create");

	// Join Tournament Modal
	const joinTournamentModalTitle = document.querySelector(
		"#joinTournamentModal h2"
	);
	if (joinTournamentModalTitle)
		joinTournamentModalTitle.textContent = t("menu_join_tournament_title");
}

// Fetch username
const fetchUsername = async (): Promise<string> => {
	try {
		const userId = getUserIdFromToken();
		if (!userId) {
			return "Username";
		}
		const token = getCookie("jwt");
		if (!token) {
			return "Username";
		}
		const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				"Accept-Language": getLang(),
			},
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error("Failed to fetch username");
		}

		const data = await res.json();
		return data.user.username || "Username";
	} catch (error) {
		return "Username";
	}
};

// Load Menu Page
export const loadMenuPage = async (): Promise<void> => {
	const app = getElement<HTMLElement>("app");
	app.innerHTML = menuTemplate;
	applyGameCustomizations();
	translateMenuStaticTexts();

	// Set username
	const username = await fetchUsername();
	getElement<HTMLElement>("menuUsername").textContent = username;

	// Dropdown logic
	const userMenuBtn = getElement<HTMLButtonElement>("userMenuBtn");
	const userDropdown = getElement<HTMLDivElement>("userDropdown");
	let dropdownOpen = false;

	userMenuBtn.addEventListener("click", (e) => {
		e.stopPropagation();
		dropdownOpen = !dropdownOpen;
		userDropdown.classList.toggle("hidden", !dropdownOpen);
		if (dropdownOpen) {
			userDropdown.style.minWidth = `${userMenuBtn.offsetWidth}px`;
		}
	});

	// Hide dropdown when clicking outside
	document.addEventListener("click", () => {
		if (dropdownOpen) {
			userDropdown.classList.add("hidden");
			dropdownOpen = false;
		}
	});

	// Prevent dropdown from closing when clicking inside
	userDropdown.addEventListener("click", (e) => {
		e.stopPropagation();
	});

	// Profile and logout actions
	getElement<HTMLButtonElement>("gotoProfile").addEventListener(
		"click",
		() => {
			window.dispatchEvent(new Event("loadProfilePage"));
		}
	);
	getElement<HTMLButtonElement>("logoutBtn").addEventListener("click", () => {
		deleteCookie("jwt");
		stopOnlineWebSocket();
		loadHomePage();
	});

	const DEFAULTS = {
		paddle_color: "#4CF190",
		ball_color: "#4CF190",
		board_color: "#07303c",
		border_color: "#4CF190",
	};

	async function applyGameCustomizations() {
		try {
			const userId = getUserIdFromToken();
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

			const paddleColor = data.paddle_color ?? DEFAULTS.paddle_color;
			const ballColor = data.ball_color ?? DEFAULTS.ball_color;
			const boardColor = data.board_color ?? DEFAULTS.board_color;
			const borderColor = data.border_color ?? DEFAULTS.border_color;

			const paddle = getElement<HTMLDivElement>("previewPaddle");
			const ball = getElement<HTMLDivElement>("previewBall");
			const board = getElement<HTMLDivElement>("previewBoard");
			const dottedLine = getElement<HTMLDivElement>("previewDottedLine");
			const paddleChanger = getElement<HTMLInputElement>("colorPaddle");
			const ballChanger = getElement<HTMLInputElement>("colorBall");
			const boardChanger = getElement<HTMLInputElement>("colorBoard");
			const borderChanger =
				getElement<HTMLInputElement>("colorBoardBorder");

			if (paddle) paddle.style.backgroundColor = paddleColor;
			if (ball) ball.style.backgroundColor = ballColor;
			if (board) board.style.backgroundColor = boardColor;
			if (dottedLine) dottedLine.style.backgroundColor = borderColor;
			if (paddleChanger) paddleChanger.value = paddleColor;
			if (ballChanger) ballChanger.value = ballColor;
			if (boardChanger) boardChanger.value = boardColor;
			if (borderChanger) {
				borderChanger.value = borderColor;
				board.style.borderColor = borderColor;
				dottedLine.style.background = `repeating-linear-gradient(
          to bottom,
          ${borderColor} 0 8px,
          transparent 8px 20px
          )`;
			}
		} catch (err) {
			console.error("Erro ao buscar customizações:", err);
			const paddle = getElement<HTMLDivElement>("previewPaddle");

			const ball = getElement<HTMLDivElement>("previewBall");
			const board = getElement<HTMLDivElement>("previewBoard");
			const dottedLine = getElement<HTMLDivElement>("previewDottedLine");

			if (paddle) paddle.style.backgroundColor = DEFAULTS.paddle_color;
			if (ball) ball.style.backgroundColor = DEFAULTS.ball_color;
			if (board) board.style.backgroundColor = DEFAULTS.board_color;
			if (dottedLine)
				dottedLine.style.backgroundColor = DEFAULTS.border_color;
		}
	}

	const paddle = getElement<HTMLDivElement>("previewPaddle");
	const ball = getElement<HTMLDivElement>("previewBall");
	const board = getElement<HTMLDivElement>("previewBoard");
	const dottedLine = getElement<HTMLDivElement>("previewDottedLine");

	getElement<HTMLInputElement>("colorPaddle").addEventListener(
		"input",
		async (e) => {
			const userId = getUserIdFromToken();
			const color = (e.target as HTMLInputElement).value;
			paddle.style.backgroundColor = color;
			try {
				const response = await fetch(
					`${API_BASE_URL}/games/costumization/${userId}`,
					{
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${getCookie("jwt")}`,
						},
						body: JSON.stringify({
							paddle_color: color,
							ball_color:
								getElement<HTMLInputElement>("colorBall").value,
							board_color:
								getElement<HTMLInputElement>("colorBoard")
									.value,
							border_color:
								getElement<HTMLInputElement>("colorBoardBorder")
									.value,
						}),
					}
				);
				if (!response.ok) {
					console.warn("Something went wrong with the update");
				}
			} catch (error) {
				console.error("Fetch error:", error);
			}
		}
	);

	getElement<HTMLInputElement>("colorBall").addEventListener(
		"input",
		async (e) => {
			const userId = getUserIdFromToken();
			ball.style.backgroundColor = (e.target as HTMLInputElement).value;
			const color = (e.target as HTMLInputElement).value;

			await fetch(`${API_BASE_URL}/games/costumization/${userId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getCookie("jwt")}`,
				},
				body: JSON.stringify({
					paddle_color:
						getElement<HTMLInputElement>("colorPaddle").value,
					ball_color: color,
					board_color:
						getElement<HTMLInputElement>("colorBoard").value,
					border_color:
						getElement<HTMLInputElement>("colorBoardBorder").value,
				}),
			});
		}
	);
	getElement<HTMLInputElement>("colorBoard").addEventListener(
		"input",
		async (e) => {
			const userId = getUserIdFromToken();
			board.style.backgroundColor = (e.target as HTMLInputElement).value;
			const color = (e.target as HTMLInputElement).value;

			await fetch(`${API_BASE_URL}/games/costumization/${userId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getCookie("jwt")}`,
				},
				body: JSON.stringify({
					paddle_color:
						getElement<HTMLInputElement>("colorPaddle").value,
					ball_color: getElement<HTMLInputElement>("colorBall").value,
					board_color: color,
					border_color:
						getElement<HTMLInputElement>("colorBoardBorder").value,
				}),
			});
		}
	);
	getElement<HTMLInputElement>("colorBoardBorder").addEventListener(
		"input",
		async (e) => {
			const userId = getUserIdFromToken();
			const color = (e.target as HTMLInputElement).value;
			board.style.borderColor = color;
			dottedLine.style.background = `repeating-linear-gradient(
      to bottom,
      ${color} 0 8px,
      transparent 8px 20px
    )`;
			await fetch(`${API_BASE_URL}/games/costumization/${userId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getCookie("jwt")}`,
				},
				body: JSON.stringify({
					paddle_color:
						getElement<HTMLInputElement>("colorPaddle").value,
					ball_color: getElement<HTMLInputElement>("colorBall").value,
					board_color:
						getElement<HTMLInputElement>("colorBoard").value,
					border_color: color,
				}),
			});
		}
	);

	// Tournament modal logic
	const btnTournament = document.getElementById("btnTournament");
	const tournamentModal = document.getElementById("tournamentModal");
	const closeTournamentModal = document.getElementById(
		"closeTournamentModal"
	);

	if (btnTournament && tournamentModal && closeTournamentModal) {
		btnTournament.addEventListener("click", () => {
			tournamentModal.classList.remove("hidden");
		});
		closeTournamentModal.addEventListener("click", () => {
			tournamentModal.classList.add("hidden");
		});
	}

	const btnJoinTournament = document.getElementById("joinTournament");
	const joinTournamentModal = document.getElementById("joinTournamentModal");
	const closeJoinTournamentModal = document.getElementById(
		"closeJoinTournamentModal"
	);
	const tournamentList = document.getElementById("tournamentList");

	if (
		btnJoinTournament &&
		joinTournamentModal &&
		closeJoinTournamentModal &&
		tournamentList &&
		tournamentModal
	) {
		btnJoinTournament.addEventListener("click", async () => {
			let tournaments: {
				tournament_id: number;
				name: string;
				PLAYER_COUNT: number;
				max_players: number;
			}[] = [];
			try {
				const res = await fetch(`${API_BASE_URL}/tournaments`, {
					headers: {
						Authorization: `Bearer ${getCookie("jwt")}`,
					},
					credentials: "include",
				});
				if (res.ok) {
					const data = await res.json();
					tournaments = data.tournaments.filter(
						(t: {
							tournament_id: number;
							PLAYER_COUNT: number;
							max_players: number;
						}) => t.PLAYER_COUNT <= t.max_players
					);
				}
			} catch (e) {
				console.error("Failed to fetch tournaments:", e);
				tournaments = [];
			}
			const userId = getUserIdFromToken();
			// Populate tournament list
			tournamentList.innerHTML = tournaments.length
				? tournaments
						.map((t) => {
							const buttonHTML = `
                <button
                  class="join-tournament-btn bg-[#4CF190] text-[#001B26] px-4 py-2 rounded font-bold transition hover:bg-[#EFD671]"
                  data-id="${t.tournament_id}"
                  data-name="${t.name}"
                >
                  Join
                </button>
              `;
							return `
                <li class="flex justify-between items-center bg-[#01222c] px-6 py-3 rounded border-2 border-[#4CF190]">
                  <span class="font-semibold">${t.name}</span>
                  <span class="text-[#4CF190]">${t.PLAYER_COUNT}/${t.max_players} players</span>
                  ${buttonHTML}
                </li>
              `;
						})
						.join("")
				: `<li class="text-center text-white py-4">No tournaments available.</li>`;

			document
				.querySelectorAll(".join-tournament-btn")
				.forEach(async (btn) => {
					const tournamentId = btn.getAttribute("data-id");
					const tournamentName = btn.getAttribute("data-name");

					if (!tournamentId || !userId) return;

					try {
						const res = await fetch(
							`${API_BASE_URL}/tournaments/${tournamentId}/players`,
							{
								headers: {
									Authorization: `Bearer ${getCookie("jwt")}`,
								},
							}
						);

						//   if (!res.ok) throw new Error("Failed to fetch participants");

						const participants = await res.json();

						// Ensure participants and participants.players are valid
						const players = participants?.players || [];
						const alreadyIn = players.some(
							(p: any) => p.player_id === Number(userId)
						);

						if (alreadyIn) {
							// Change button to "Enter"
							btn.textContent = "Enter";
							btn.classList.remove("join-tournament-btn");
							btn.classList.remove("bg-[#4CF190]");
							btn.classList.add("bg-[#EFD671]");

							btn.addEventListener("click", () => {
								loadTournamentPage(tournamentId);
							});
						} else {
							// Add "Join" logic
							btn.addEventListener("click", async () => {
								try {
									const joinRes = await fetch(
										`${API_BASE_URL}/tournaments/join`,
										{
											method: "POST",
											headers: {
												"Content-Type":
													"application/json",
												Authorization: `Bearer ${getCookie(
													"jwt"
												)}`,
											},
											credentials: "include",
											body: JSON.stringify({
												tournamentName: tournamentName,
												tournamentId:
													Number(tournamentId),
												userId: Number(userId),
											}),
										}
									);

									if (!joinRes.ok)
										throw new Error(
											"Failed to join tournament"
										);

									loadTournamentPage(tournamentId);
								} catch (err) {
									console.error("Join failed:", err);
									alert("Failed to join tournament.");
								}
							});
						}
					} catch (err) {
						console.error(
							"Error checking tournament participants:",
							err
						);
					}
				});

			tournamentModal.classList.add("hidden");
			joinTournamentModal.classList.remove("hidden");
		});

		closeJoinTournamentModal.addEventListener("click", () => {
			joinTournamentModal.classList.add("hidden");
		});
	}

	const btnCreateTournament = document.getElementById("createTournament");
	const createTournamentModal = document.getElementById(
		"createTournamentModal"
	);
	const closeCreateTournamentModal = document.getElementById(
		"closeCreateTournamentModal"
	);

	if (
		btnCreateTournament &&
		createTournamentModal &&
		closeCreateTournamentModal &&
		tournamentModal
	) {
		btnCreateTournament.addEventListener("click", () => {
			tournamentModal.classList.add("hidden");
			createTournamentModal.classList.remove("hidden");
		});
		closeCreateTournamentModal.addEventListener("click", () => {
			createTournamentModal.classList.add("hidden");
			// Clean the create tournament form inputs
			const form = document.getElementById(
				"createTournamentForm"
			) as HTMLFormElement | null;
			if (form) {
				form.reset();
				// Reset player count buttons to default
				const playerCountBtns =
					form.querySelectorAll<HTMLButtonElement>(
						".player-count-btn"
					);
				playerCountBtns.forEach((b) => {
					b.classList.remove(
						"bg-[#4CF190]",
						"text-[#001B26]",
						"ring-2",
						"ring-[#4CF190]"
					);
					b.classList.add(
						"bg-gray-600",
						"text-white",
						"border-gray-700"
					);
					b.classList.remove("border-[#001B26]");
				});
				const btn4 = form.querySelector<HTMLButtonElement>(
					'.player-count-btn[data-value="4"]'
				);
				if (btn4) {
					btn4.classList.remove(
						"bg-gray-600",
						"text-white",
						"border-gray-700"
					);
					btn4.classList.add(
						"bg-[#4CF190]",
						"text-[#001B26]",
						"border-[#001B26]",
						"ring-2",
						"ring-[#4CF190]"
					);
				}
				const playerCountInput =
					form.querySelector<HTMLInputElement>("#tournamentPlayers");
				if (playerCountInput) playerCountInput.value = "4";
			}
		});
	}
	const createTournamentForm = document.getElementById(
		"createTournamentForm"
	) as HTMLFormElement | null;

	if (createTournamentForm) {
		createTournamentForm.addEventListener("submit", async (e) => {
			e.preventDefault();

			const nameInput = document.getElementById(
				"tournamentName"
			) as HTMLInputElement;
			const playersInput = document.getElementById(
				"tournamentPlayers"
			) as HTMLInputElement;
			const dateInput = document.getElementById(
				"tournamentDate"
			) as HTMLInputElement;

			const tournamentData = {
				name: nameInput.value.trim(),
				maxPlayers: parseInt(playersInput.value),
				startDate: dateInput.value,
			};

			try {
				const res = await fetch(`${API_BASE_URL}/tournaments`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${getCookie("jwt")}`,
					},
					credentials: "include",
					body: JSON.stringify(tournamentData),
				});

				if (!res.ok) {
					const errorData = await res.json();
					alert("Error creating tournament: " + errorData.message);
					return;
				}

				const created = await res.json();

				createTournamentModal?.classList.add("hidden");
				createTournamentForm.reset();
			} catch (err) {
				console.error("Error creating tournament", err);
			}
		});
	}

	const playerCountBtns =
		document.querySelectorAll<HTMLButtonElement>(".player-count-btn");
	const playerCountInput = document.getElementById(
		"tournamentPlayers"
	) as HTMLInputElement;

	if (playerCountBtns && playerCountInput) {
		playerCountBtns.forEach((btn) => {
			btn.addEventListener("click", () => {
				playerCountBtns.forEach((b) => {
					b.classList.remove(
						"bg-[#4CF190]",
						"text-[#001B26]",
						"ring-2",
						"ring-[#4CF190]"
					);
					b.classList.add(
						"bg-gray-600",
						"text-white",
						"border-gray-700"
					);
					b.classList.remove("border-[#001B26]");
				});
				btn.classList.remove(
					"bg-gray-600",
					"text-white",
					"border-gray-700"
				);
				btn.classList.add(
					"bg-[#4CF190]",
					"text-[#001B26]",
					"border-[#001B26]",
					"ring-2",
					"ring-[#4CF190]"
				);
				playerCountInput.value = btn.dataset.value || "4";
			});
		});
	}

	// Navigate to home page on title click
	const pongTitle = document.getElementById("pongTitle");
	if (pongTitle) {
		pongTitle.style.cursor = "pointer";
		pongTitle.addEventListener("click", () => {
			window.dispatchEvent(new Event("loadHomePage"));
		});
	}
	// Player vs AI button logic
	const btnPvAI = document.getElementById("btnPvAI");
	if (btnPvAI) {
		btnPvAI.addEventListener("click", () => {
			// Clear any previous game data and set AI mode
			delete (window as any).gameData;
			window.dispatchEvent(new Event("loadPlayPage"));
		});
	}

	// Player vs Player button logic
	const btnPvP = document.getElementById("btnPvP");
	let isJoiningMatchmaking = false;
	if (btnPvP) {
		btnPvP.addEventListener("click", async () => {
			if (isJoiningMatchmaking) {
				console.log("[FE] Already joining matchmaking, ignoring click");
				return;
			}
			isJoiningMatchmaking = true;
			try {
				await fetch(`${API_BASE_URL}/users/matchmaking/leave`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${getCookie("jwt")}`,
					},
				});
			} catch (e) {
				// Ignore errors, user might not be in matchmaking
			}
			// Show searching modal/spinner
			const searchingModal = document.createElement("div");
			searchingModal.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div class="bg-[#001B26] border-4 border-[#4CF190] rounded-xl p-8 flex flex-col items-center shadow-2xl">
                    <span class="text-2xl font-bold text-[#4CF190] mb-4">Searching for opponent...</span>
                    <div class="loader"></div>
                    <button id="cancelMatchmaking" class="mt-6 px-4 py-2 bg-red-500 text-white rounded">Cancel</button>
                </div>
            </div>
        `;
			document.body.appendChild(searchingModal);

			// Join matchmaking
			const res = await fetch(`${API_BASE_URL}/users/matchmaking/join`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${getCookie("jwt")}`,
				},
			});
			if (!res.ok) {
				alert("Failed to join matchmaking.");
				document.body.removeChild(searchingModal);
				isJoiningMatchmaking = false;
				return;
			}
			console.log("[FE] Join matchmaking response:", res.status);
			let polling = true;
			// Cancel matchmaking
			searchingModal
				.querySelector("#cancelMatchmaking")
				?.addEventListener("click", async () => {
					console.log("[FE] Cancel matchmaking clicked");
					polling = false;
					await fetch(`${API_BASE_URL}/users/matchmaking/leave`, {
						method: "POST",
						headers: {
							Authorization: `Bearer ${getCookie("jwt")}`,
						},
					});
					document.body.removeChild(searchingModal);
					isJoiningMatchmaking = false;
				});

			// Poll for match found
			while (polling) {
				await new Promise((r) => setTimeout(r, 2000));
				if (!polling) break; // Exit if cancelled
				const matchRes = await fetch(
					`${API_BASE_URL}/users/matchmaking/status`,
					{
						headers: {
							Authorization: `Bearer ${getCookie("jwt")}`,
						},
					}
				);
				console.log(
					"[FE] Matchmaking status response:",
					matchRes.status
				);
				if (matchRes.ok) {
					const data = await matchRes.json();
					console.log("[FE] Matchmaking status data:", data);
					const status = data.matchmakingStatus;
					if (status && status.matched) {
						console.log(
							"[FE] Match found! Opponent:",
							status.opponentUsername,
							"gameId:",
							status.gameId
						);
						polling = false;
						document.body.removeChild(searchingModal);
						// Store game data in window
						(window as any).gameData = {
							type: "matchmaking",
							opponentUsername: status.opponentUsername,
							gameId: status.gameId,
						};
						window.dispatchEvent(new Event("loadPlayPage"));
						isJoiningMatchmaking = false;
					}
				}
			}
			isJoiningMatchmaking = false;
		});
	}
};

// Auto-load if routed directly
document.addEventListener("DOMContentLoaded", () => {
	window.addEventListener("loadMenuPage", loadMenuPage);
	window.addEventListener("loadProfilePage", () => loadProfilePage());
	window.addEventListener("loadPlayPage", () => loadPlayPage());
});
