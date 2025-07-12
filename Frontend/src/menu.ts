import { menuTemplate } from "./templates/menuTemplate.js";
import { loadProfilePage } from "./profile.js";
import { deleteCookie } from "./utils/auth.js";
import { loadHomePage } from "./index.js";
import { getCookie, getUserIdFromToken } from "./utils/auth.js";
import { API_BASE_URL } from "./config.js";
import { loadPlayPage } from "./play.js";
import { stopOnlineWebSocket } from "./utils/ws.js";
import { getLang, t } from "./locales/localeMiddleware.js";
import { loadTournamentPage, cleanupTournamentPage } from "./tournament.js";
import { navigateTo } from "./utils/router.js";

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

	// Tournament form elements (now inside tabs)
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
	const createBtn = document.querySelector(
		"#createTournamentForm button[type='submit']"
	);
	if (createBtn) createBtn.textContent = t("menu_create");

	// Tab labels
	const joinTournamentTabElement =
		document.getElementById("joinTournamentTab");
	if (joinTournamentTabElement)
		joinTournamentTabElement.textContent = t("menu_join_tournament");
	const createTournamentTabElement = document.getElementById(
		"createTournamentTab"
	);
	if (createTournamentTabElement)
		createTournamentTabElement.textContent = t("menu_create_tournament");
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
	// Cleanup any previous tournament auto-refresh
	cleanupTournamentPage();

	const app = getElement<HTMLElement>("app");
	app.innerHTML = menuTemplate;

	// Update the current URL without triggering navigation if needed
	if (window.location.pathname !== "/menu") {
		history.replaceState(null, "", "/menu");
	}

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
			navigateTo("/profile");
		}
	);
	getElement<HTMLButtonElement>("logoutBtn").addEventListener("click", () => {
		deleteCookie("jwt");
		stopOnlineWebSocket();
		navigateTo("/");
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

	// Tournament tabs
	const joinTournamentTab = document.getElementById("joinTournamentTab");
	const createTournamentTab = document.getElementById("createTournamentTab");
	const joinTournamentContent = document.getElementById(
		"joinTournamentContent"
	);
	const createTournamentContent = document.getElementById(
		"createTournamentContent"
	);

	if (btnTournament && tournamentModal && closeTournamentModal) {
		btnTournament.addEventListener("click", async () => {
			// Load tournaments list by default when opening modal
			await loadTournamentsList();
			tournamentModal.classList.remove("hidden");
		});
		closeTournamentModal.addEventListener("click", () => {
			tournamentModal.classList.add("hidden");
		});
	}

	// Tab switching logic
	if (
		joinTournamentTab &&
		createTournamentTab &&
		joinTournamentContent &&
		createTournamentContent
	) {
		joinTournamentTab.addEventListener("click", async () => {
			// Switch to join tab
			joinTournamentTab.classList.remove("text-gray-400", "bg-[#001B26]");
			joinTournamentTab.classList.add("text-[#4CF190]", "bg-[#002B36]");
			createTournamentTab.classList.remove(
				"text-[#4CF190]",
				"bg-[#002B36]"
			);
			createTournamentTab.classList.add("text-gray-400", "bg-[#001B26]");

			joinTournamentContent.classList.remove("hidden");
			createTournamentContent.classList.add("hidden");

			// Load tournaments list
			await loadTournamentsList();
		});

		createTournamentTab.addEventListener("click", () => {
			// Switch to create tab
			createTournamentTab.classList.remove(
				"text-gray-400",
				"bg-[#001B26]"
			);
			createTournamentTab.classList.add("text-[#4CF190]", "bg-[#002B36]");
			joinTournamentTab.classList.remove(
				"text-[#4CF190]",
				"bg-[#002B36]"
			);
			joinTournamentTab.classList.add("text-gray-400", "bg-[#001B26]");

			createTournamentContent.classList.remove("hidden");
			joinTournamentContent.classList.add("hidden");
		});
	}

	// Helper function to check if user has active tournament
	async function checkUserHasActiveTournament(
		userId: number
	): Promise<boolean> {
		try {
			const statsRes = await fetch(
				`${API_BASE_URL}/users/${userId}/stats`,
				{
					headers: {
						Authorization: `Bearer ${getCookie("jwt")}`,
					},
				}
			);

			if (statsRes.ok) {
				const statsData = await statsRes.json();
				return !!(
					statsData.stats && statsData.stats.current_tournament
				);
			}
			return false;
		} catch (error) {
			console.error("Error checking user tournament status:", error);
			return false;
		}
	}

	// Function to load tournaments list
	async function loadTournamentsList() {
		const tournamentList = document.getElementById("tournamentList");
		if (!tournamentList) return;

		// First check if user is already in an active tournament
		const userId = getUserIdFromToken();
		if (!userId) {
			tournamentList.innerHTML =
				'<li class="text-center text-white py-4">Please log in to view tournaments.</li>';
			return;
		}

		try {
			const statsRes = await fetch(
				`${API_BASE_URL}/users/${userId}/stats`,
				{
					headers: {
						Authorization: `Bearer ${getCookie("jwt")}`,
					},
				}
			);

			let userHasActiveTournament = false;
			if (statsRes.ok) {
				const statsData = await statsRes.json();
				if (statsData.stats && statsData.stats.current_tournament) {
					userHasActiveTournament = true;
					// Remove any existing warning
					const prevWarning =
						tournamentList.parentElement?.querySelector(
							".already-in-tournament-warning"
						);
					if (prevWarning) prevWarning.remove();

					// Show a warning message but continue to show tournament list
					const warningElement = document.createElement("div");
					warningElement.className =
						"already-in-tournament-warning mb-4 p-3 bg-[#002B36] border border-[#FFD700] rounded text-center";
					warningElement.innerHTML = `
        <div class="text-yellow-400 font-semibold mb-1">⚠️ Already in Tournament</div>
        <div class="text-sm text-gray-300">You are participating in an active tournament. You can view other tournaments but cannot join new ones.</div>
    `;

					const tournamentListContainer =
						tournamentList.parentElement;
					if (tournamentListContainer) {
						tournamentListContainer.insertBefore(
							warningElement,
							tournamentList
						);
					}
				}
			}
		} catch (error) {
			console.error("Error checking user tournament status:", error);
		}

		let tournaments: {
			tournament_id: number;
			name: string;
			PLAYER_COUNT: number;
			max_players: number;
			status?: string;
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
						status?: string;
					}) => t.PLAYER_COUNT <= t.max_players
				);
			}
		} catch (e) {
			console.error("Failed to fetch tournaments:", e);
			tournaments = [];
		}

		// Populate tournament list
		tournamentList.innerHTML = tournaments.length
			? tournaments
					.map((t) => {
						return `
                <li class="flex justify-between items-center bg-[#01222c] px-6 py-3 rounded border-2 border-[#4CF190]" data-tournament-id="${t.tournament_id}" data-tournament-name="${t.name}">
                  <div>
                    <span class="font-semibold">${t.name}</span>
                    <div class="text-sm tournament-status"></div>
                  </div>
                  <div class="text-right">
                    <span class="text-[#4CF190]">${t.PLAYER_COUNT}/${t.max_players} players</span>
                    <div class="tournament-button-container"></div>
                  </div>
                </li>
              `;
					})
					.join("")
			: `<li class="text-center text-white py-4">No tournaments available.</li>`;

		// Now check each tournament to see if user is already in it and set appropriate button/status
		tournaments.forEach(async (t) => {
			const listItem = document.querySelector(
				`[data-tournament-id="${t.tournament_id}"]`
			);
			if (!listItem) return;

			const statusElement = listItem.querySelector(".tournament-status");
			const buttonContainer = listItem.querySelector(
				".tournament-button-container"
			);

			try {
				// Check if user is already in this tournament
				const res = await fetch(
					`${API_BASE_URL}/tournaments/${t.tournament_id}/players`,
					{
						headers: {
							Authorization: `Bearer ${getCookie("jwt")}`,
						},
					}
				);

				let alreadyIn = false;
				if (res.ok) {
					const participants = await res.json();
					const players = participants?.players || [];
					alreadyIn = players.some(
						(p: any) => p.player_id === Number(userId)
					);
				}

				let buttonHTML = "";
				let statusText = "";

				if (alreadyIn) {
					// User is already in the tournament - show "Enter" button regardless of status
					if (t.status === "completed") {
						statusText = `<span class="text-yellow-400 font-bold">COMPLETED</span>`;
						buttonHTML = `
							<button
								class="enter-tournament-btn bg-blue-500 text-white px-4 py-2 rounded font-bold transition hover:bg-blue-600"
								data-id="${t.tournament_id}"
								data-name="${t.name}"
							>
								View Results
							</button>
						`;
					} else {
						statusText = `<span class="text-green-400 font-bold">JOINED</span>`;
						buttonHTML = `
							<button
								class="enter-tournament-btn bg-[#EFD671] text-[#001B26] px-4 py-2 rounded font-bold transition hover:bg-[#4CF190]"
								data-id="${t.tournament_id}"
								data-name="${t.name}"
							>
								Enter
							</button>
						`;
					}
				} else {
					// User is not in the tournament - check other conditions
					if (t.status === "completed") {
						statusText = `<span class="text-yellow-400 font-bold">COMPLETED</span>`;
						buttonHTML = `
							<button
								class="view-tournament-btn bg-blue-500 text-white px-4 py-2 rounded font-bold transition hover:bg-blue-600"
								data-id="${t.tournament_id}"
								data-name="${t.name}"
							>
								View Results
							</button>
						`;
					} else if (t.PLAYER_COUNT >= t.max_players) {
						statusText = `<span class="text-red-400 font-bold">FULL</span>`;
						buttonHTML = `
							<button
								class="view-tournament-btn bg-blue-500 text-white px-4 py-2 rounded font-bold transition hover:bg-blue-600"
								data-id="${t.tournament_id}"
								data-name="${t.name}"
							>
								View
							</button>
						`;
					} else {
						// Check if user has active tournament to decide button behavior
						const hasActiveTournament =
							await checkUserHasActiveTournament(userId);

						if (hasActiveTournament) {
							statusText = `<span class="text-green-400 font-bold">OPEN</span>`;
							buttonHTML = `
								<button
									class="view-tournament-btn bg-blue-500 text-white px-4 py-2 rounded font-bold transition hover:bg-blue-600"
									data-id="${t.tournament_id}"
									data-name="${t.name}"
									title="You are already in an active tournament"
								>
									View
								</button>
							`;
						} else {
							statusText = `<span class="text-green-400 font-bold">OPEN</span>`;
							buttonHTML = `
								<button
									class="join-tournament-btn bg-[#4CF190] text-[#001B26] px-4 py-2 rounded font-bold transition hover:bg-[#EFD671]"
									data-id="${t.tournament_id}"
									data-name="${t.name}"
								>
									Join
								</button>
							`;
						}
					}
				}

				if (statusElement) statusElement.innerHTML = statusText;
				if (buttonContainer) buttonContainer.innerHTML = buttonHTML;
			} catch (err) {
				console.error("Error checking tournament participants:", err);
				// Set default button if there's an error
				if (statusElement)
					statusElement.innerHTML = `<span class="text-gray-400 font-bold">UNKNOWN</span>`;
				if (buttonContainer)
					buttonContainer.innerHTML = `
					<button class="bg-gray-500 text-white px-4 py-2 rounded font-bold cursor-not-allowed opacity-50" disabled>
						Error
					</button>
				`;
			}
		});

		// Wait a bit for all tournament status checks to complete, then add event listeners
		setTimeout(() => {
			// Add event listeners for join buttons
			document.querySelectorAll(".join-tournament-btn").forEach((btn) => {
				const tournamentId = btn.getAttribute("data-id");
				const tournamentName = btn.getAttribute("data-name");

				if (!tournamentId || !userId) return;

				btn.addEventListener("click", async () => {
					try {
						const joinRes = await fetch(
							`${API_BASE_URL}/tournaments/join`,
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
									Authorization: `Bearer ${getCookie("jwt")}`,
								},
								credentials: "include",
								body: JSON.stringify({
									tournamentName: tournamentName,
									tournamentId: Number(tournamentId),
									userId: Number(userId),
								}),
							}
						);

						if (!joinRes.ok) {
							const errorData = await joinRes.json();
							if (
								errorData.message &&
								errorData.message.includes(
									"already participating"
								)
							) {
								alert(
									"You can only participate in one tournament at a time. Please finish your current tournament first."
								);
							} else {
								alert(
									errorData.message ||
										"Failed to join tournament"
								);
							}
							return;
						}

						const result = await joinRes.json();
						if (result.success) {
							if (tournamentModal)
								tournamentModal.classList.add("hidden");
							// Store tournament ID and navigate
							(window as any).currentTournamentId = tournamentId;
							navigateTo("/tournament");
						} else {
							alert(
								result.message || "Failed to join tournament"
							);
						}
					} catch (err) {
						console.error("Join failed:", err);
						alert("Failed to join tournament.");
					}
				});
			});

			// Add event listeners for enter tournament buttons
			document
				.querySelectorAll(".enter-tournament-btn")
				.forEach((btn) => {
					const tournamentId = btn.getAttribute("data-id");
					if (!tournamentId) return;

					btn.addEventListener("click", () => {
						if (tournamentModal)
							tournamentModal.classList.add("hidden");
						// Store tournament ID and navigate
						(window as any).currentTournamentId = tournamentId;
						navigateTo("/tournament");
					});
				});

			// Add event listeners for view tournament buttons
			document.querySelectorAll(".view-tournament-btn").forEach((btn) => {
				const tournamentId = btn.getAttribute("data-id");
				if (!tournamentId) return;

				btn.addEventListener("click", () => {
					if (tournamentModal)
						tournamentModal.classList.add("hidden");
					// Store tournament ID and navigate
					(window as any).currentTournamentId = tournamentId;
					navigateTo("/tournament");
				});
			});
		}, 500);
	}

	// Create Tournament Form Logic (now inside the tab)
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

			const tournamentData = {
				name: nameInput.value.trim(),
				maxPlayers: parseInt(playersInput.value),
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
				alert("Tournament created successfully!");

				// Reset form and switch back to join tab
				createTournamentForm.reset();

				// Reset player count buttons to default
				const playerCountBtns =
					createTournamentForm.querySelectorAll<HTMLButtonElement>(
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
				const btn4 =
					createTournamentForm.querySelector<HTMLButtonElement>(
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
					createTournamentForm.querySelector<HTMLInputElement>(
						"#tournamentPlayers"
					);
				if (playerCountInput) playerCountInput.value = "4";

				// Switch back to join tab and refresh list
				if (joinTournamentTab) joinTournamentTab.click();
			} catch (err) {
				console.error("Error creating tournament", err);
				alert("Failed to create tournament. Please try again.");
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
			navigateTo("/");
		});
	}
	// Player vs AI button logic
	const btnPvAI = document.getElementById("btnPvAI");
	if (btnPvAI) {
		btnPvAI.addEventListener("click", () => {
			// Clear any previous game data and set AI mode
			delete (window as any).gameData;
			navigateTo("/play");
		});
	}

	// Player vs Player button logic
	const btnPvP = document.getElementById("btnPvP");
	let isJoiningMatchmaking = false;
	if (btnPvP) {
		const newHandler = async () => {
			if (isJoiningMatchmaking) {
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
			let polling = true;
			let hasDispatchedPlayPage = false;
			// Cancel matchmaking
			searchingModal
				.querySelector("#cancelMatchmaking")
				?.addEventListener("click", async () => {
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
				if (matchRes.ok) {
					const data = await matchRes.json();
					const status = data.matchmakingStatus;
					if (status && status.matched && !hasDispatchedPlayPage) {
						hasDispatchedPlayPage = true;
						polling = false;
						document.body.removeChild(searchingModal);
						// Store game data in window
						(window as any).gameData = {
							type: "matchmaking",
							opponentUsername: status.opponentUsername,
							gameId: status.gameId,
						};
						navigateTo("/play");
						return;
					}
				}
			}
			isJoiningMatchmaking = false;
		};
		const btnPvPClone = btnPvP.cloneNode(true) as HTMLElement;
		btnPvP.parentNode?.replaceChild(btnPvPClone, btnPvP);

		btnPvPClone.addEventListener("click", newHandler);
	}
};

if (!(window as any)._ft_transcendence_events_registered) {
	window.addEventListener("loadMenuPage", loadMenuPage);
	window.addEventListener("loadProfilePage", () => loadProfilePage());
	window.addEventListener("loadPlayPage", () => loadPlayPage());
	(window as any)._ft_transcendence_events_registered = true;
}
