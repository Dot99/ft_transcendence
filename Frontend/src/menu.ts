import { menuTemplate } from "./templates/menuTemplate.js";
import { loadProfilePage } from "./profile.js";
import { loadPlayPage } from "./play.js";

// Utility to get element by id
const getElement = <T extends HTMLElement>(id: string): T => {
	const element = document.getElementById(id) as T;
	if (!element) throw new Error(`Element with id ${id} not found`);
	return element;
};

// Fetch username
const fetchUsername = async (): Promise<string> => {
	try {
		const res = await fetch("/api/user/profile", {
			headers: {
				Authorization: `Bearer ${localStorage.getItem("jwt")}`,
			},
		});
		if (!res.ok) throw new Error("Failed to fetch username");
		const data = await res.json();
		return data.username || "Username";
	} catch {
		return "Username";
	}
};

// Load Menu Page
export const loadMenuPage = async (): Promise<void> => {
	const app = getElement<HTMLElement>("app");
	app.innerHTML = menuTemplate;

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
	getElement<HTMLButtonElement>("gotoProfile").addEventListener("click", () => {
		window.dispatchEvent(new Event("loadProfilePage"));
	});
	getElement<HTMLButtonElement>("logoutBtn").addEventListener("click", () => {
		localStorage.removeItem("jwt");
		window.dispatchEvent(new Event("loadHomePage"));
	});

	const paddle = getElement<HTMLDivElement>("previewPaddle");
	const ball = getElement<HTMLDivElement>("previewBall");
	const board = getElement<HTMLDivElement>("previewBoard");
	const dottedLine = getElement<HTMLDivElement>("previewDottedLine");

	getElement<HTMLInputElement>("colorPaddle").addEventListener("input", (e) => {
		paddle.style.backgroundColor = (e.target as HTMLInputElement).value;
	});
	getElement<HTMLInputElement>("colorBall").addEventListener("input", (e) => {
		ball.style.backgroundColor = (e.target as HTMLInputElement).value;
	});
	getElement<HTMLInputElement>("colorBoard").addEventListener("input", (e) => {
		board.style.backgroundColor = (e.target as HTMLInputElement).value;
	});
	getElement<HTMLInputElement>("colorBoardBorder").addEventListener(
		"input",
		(e) => {
			const color = (e.target as HTMLInputElement).value;
			board.style.borderColor = color;
			dottedLine.style.background = `repeating-linear-gradient(
      to bottom,
      ${color} 0 8px,
      transparent 8px 20px
    )`;
		}
	);

	// Tournament modal logic
	const btnTournament = document.getElementById("btnTournament");
	const tournamentModal = document.getElementById("tournamentModal");
	const closeTournamentModal = document.getElementById("closeTournamentModal");

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
			// Fetch tournaments from backend
			let tournaments: { name: string; players: number; maxPlayers: number }[] =
				[];
			try {
				const res = await fetch("/api/tournaments", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("jwt")}`,
					},
				});
				if (res.ok) {
					const data = await res.json();
					// Only include tournaments that are not full
					tournaments = data.tournaments.filter(
						(t: { players: number; maxPlayers: number }) =>
							t.players < t.maxPlayers
					);
				}
			} catch (e) {
				console.error("Failed to fetch tournaments:", e);
				tournaments = [];
			}

			// Populate tournament list
			tournamentList.innerHTML = tournaments.length
				? tournaments
						.map(
							(t) =>
								`<li class="flex justify-between items-center bg-[#01222c] px-6 py-3 rounded border-2 border-[#4CF190]">
                        <span class="font-semibold">${t.name}</span>
                        <span class="text-[#4CF190]">${t.players}/${t.maxPlayers} players</span>
                        <button class="ml-4 px-4 py-2 bg-[#4CF190] text-[#001B26] rounded font-bold border-2 border-[#001B26] hover:bg-[#34c47c]">Join</button>
                    </li>`
						)
						.join("")
				: `<li class="text-center text-white py-4">No tournaments available.</li>`;

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
					form.querySelectorAll<HTMLButtonElement>(".player-count-btn");
				playerCountBtns.forEach((b) => {
					b.classList.remove(
						"bg-[#4CF190]",
						"text-[#001B26]",
						"ring-2",
						"ring-[#4CF190]"
					);
					b.classList.add("bg-gray-600", "text-white", "border-gray-700");
					b.classList.remove("border-[#001B26]");
				});
				const btn4 = form.querySelector<HTMLButtonElement>(
					'.player-count-btn[data-value="4"]'
				);
				if (btn4) {
					btn4.classList.remove("bg-gray-600", "text-white", "border-gray-700");
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
					b.classList.add("bg-gray-600", "text-white", "border-gray-700");
					b.classList.remove("border-[#001B26]");
				});
				btn.classList.remove("bg-gray-600", "text-white", "border-gray-700");
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

	// Player vs AI button logic
	const btnPvAI = document.getElementById("btnPvAI");
	if (btnPvAI) {
		btnPvAI.addEventListener("click", () => {
			window.dispatchEvent(new Event("loadPlayPage"));
		});
	}

	// Player vs Player button logic
	const btnPvP = document.getElementById("btnPvP");
	const pvpModal = document.getElementById("pvpModal");
	const closePvpModal = document.getElementById("closePvpModal");
	const pvpForm = document.getElementById("pvpForm") as HTMLFormElement | null;
	const pvpOpponent = document.getElementById("pvpOpponent") as HTMLInputElement | null;
	const pvpError = document.getElementById("pvpError");

	if (btnPvP && pvpModal && closePvpModal && pvpForm && pvpOpponent && pvpError) {
		btnPvP.addEventListener("click", () => {
			pvpModal.classList.remove("hidden");
			pvpError.classList.add("hidden");
			pvpForm.reset();
		});
		closePvpModal.addEventListener("click", () => {
			pvpModal.classList.add("hidden");
		});
		pvpForm.addEventListener("submit", async (e) => {
			e.preventDefault();
			const opponent = pvpOpponent.value.trim();
			if (!opponent) return;
			// PLACEHOLDER: Check if player exists
			const isUser = true; //  PLACEHOLDER flag
			if (!isUser) {
				pvpError.textContent = "User not found";
				pvpError.classList.remove("hidden");
				return;
			}
			// Store opponent username in sessionStorage and load play page
			sessionStorage.setItem("pvpOpponent", opponent);
			pvpModal.classList.add("hidden");
			window.dispatchEvent(new Event("loadPlayPage"));
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
};

// Auto-load if routed directly
document.addEventListener("DOMContentLoaded", () => {
	window.addEventListener("loadMenuPage", loadMenuPage);
	window.addEventListener("loadProfilePage", () => loadProfilePage());
	window.addEventListener("loadPlayPage", () => loadPlayPage()); 
});
