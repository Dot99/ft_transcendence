import { loadHomePage } from "./index.js";
import { profileTemplate } from "./templates/profileTemplate.js";
import { deleteCookie, getCookie, getUserIdFromToken } from "./utils/auth.js";

const API_BASE_URL = "http://localhost:3000/api";

interface User {
	username: string;
	email: string;
	country: string;
	name: string;
	pfp?: string;
	total_play_time: number;
}

interface Stats {
	total_matches: number;
	matches_won: number;
	matches_lost: number;
	average_score: number;
	win_streak_max: number;
	tournaments_won: number;
	leaderboard_position: number;
	current_tournament: number;
}

interface Match {
	scheduled_date: string | number | Date;
	player1: number;
	player2: number;
	player1_score: number;
	player2_score: number;
	match_date: string;
	winner?: number;
}

interface Tournament {
	tournament_id: number;
	tournament_name: string;
	tournament_date: string;
}

const getElement = <T extends HTMLElement>(id: string): T => {
	const el = document.getElementById(id);
	if (!el) throw new Error(`Element #${id} not found`);
	return el as T;
};

// Event Handlers
const handleDeleteAccount = (): void => {
	showDeleteModal();
};

const handleConfirmDelete = async (): Promise<void> => {
	try {
		const response = await fetch("/api/user/delete", {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${getCookie("jwt")}`,
			},
		});
		if (response.ok) {
			deleteCookie("jwt");
			loadHomePage();
		} else {
			throw new Error("Failed to delete account");
		}
	} catch (error) {
		console.error("Error deleting account:", error);
		alert("Failed to delete account. Please try again.");
	}
};

const handleFriendsClick = (): void => {
	console.log("FRIENDS"); //TODO: Implement friends page navigation
	//navigateTo('/friends');
};

const handleCancelDelete = (): void => {
	closeDeleteModal();
};

// UI Functions
export const loadProfilePage = (pushState: boolean = true): void => {
	const app = getElement<HTMLElement>("app");
	app.innerHTML = profileTemplate;
	getElement<HTMLButtonElement>("deleteAccountBtn").addEventListener(
		"click",
		handleDeleteAccount
	);
	loadDashboardData();
	renderPerformanceChart();
};

const getOpponentId = (match: Match, userId: number): number => {
	return match.player1 === userId ? match.player2 : match.player1;
};

async function loadDashboardData(): Promise<void> {
	const userId = getUserIdFromToken();
	if (!userId) {
		loadHomePage();
		return;
	}
	const userRes = await fetch(`/api/users/${userId}`, {
		headers: {
			Authorization: `Bearer ${getCookie("jwt")}`,
		},
	});
	const userData = await userRes.json();
	const user: User = userData.user;
	const twofaRes = await fetch(`${API_BASE_URL}/users/${userId}`, {
		headers: {
			Authorization: `Bearer ${getCookie("jwt")}`,
		},
	});
	const twofaData = await twofaRes.json();
	const twofaEnabled = twofaData.enabled;

	attachProfileEventListeners(user, twofaEnabled);

	getElement<HTMLHeadingElement>("username").textContent = `@${user.username}`;
	getElement<HTMLHeadingElement>("name").textContent = user.name;
	getElement<HTMLDivElement>("email").textContent = user.email;
	if (user.pfp) {
		getElement<HTMLImageElement>("pfp").src = user.pfp;
	} else {
		getElement<HTMLImageElement>("pfp").src = "/images/default_pfp.png";
	}

	getElement<HTMLSpanElement>("hoursPlayed").textContent = (
		user.total_play_time / 3600
	).toFixed(2);

	const statsRes = await fetch(`/api/users/${userId}/stats`, {
		headers: {
			Authorization: `Bearer ${getCookie("jwt")}`,
		},
	});
	const statsData = await statsRes.json();
	const stats: Stats = statsData.stats;

	if (!stats) {
		// If stats is missing, set all fields to '0'
		getElement<HTMLDivElement>("totalMatches").textContent = "0";
		getElement<HTMLDivElement>("matchesWon").textContent = "0";
		getElement<HTMLDivElement>("matchesLost").textContent = "0";
		getElement<HTMLDivElement>("avgScore").textContent = "0";
		getElement<HTMLDivElement>("winStreak").textContent = "0";
		getElement<HTMLDivElement>("tournaments").textContent = "0";
		getElement<HTMLDivElement>("leaderboard").textContent = "0";
		return;
	}

	getElement<HTMLDivElement>("totalMatches").textContent =
		stats.total_matches?.toString() ?? "0";
	getElement<HTMLDivElement>("matchesWon").textContent =
		stats.matches_won?.toString() ?? "0";
	getElement<HTMLDivElement>("matchesLost").textContent =
		stats.matches_lost?.toString() ?? "0";
	getElement<HTMLDivElement>("avgScore").textContent =
		stats.average_score?.toString() ?? "0";
	getElement<HTMLDivElement>("winStreak").textContent =
		stats.win_streak_max?.toString() ?? "0";
	getElement<HTMLDivElement>("tournaments").textContent =
		stats.tournaments_won?.toString() ?? "0";
	getElement<HTMLDivElement>("leaderboard").textContent =
		stats.leaderboard_position?.toString() ?? "0";

	await loadRecentMatches(userId);
	await loadPastTournaments(userId, stats.current_tournament);
}

async function loadRecentMatches(userId: number): Promise<void> {
	const res = await fetch(`/api/games/users/${userId}/recent`);
	const data = await res.json();
	const container = getElement<HTMLDivElement>("matchTableBody");
	container.innerHTML = "";

	for (const match of data.games as Match[]) {
		const [p1, p2] = await Promise.all([
			fetch(`/api/users/${match.player1}`).then((res) => res.json()),
			fetch(`/api/users/${match.player2}`).then((res) => res.json()),
		]);

		if (!p1.user) {
			p1.user = { username: "Unknown Player" };
		}
		if (!p2.user) {
			p2.user = { username: "Unknown Player" };
		}
		const date = new Date(match.match_date)
			.toLocaleString("pt-PT", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})
			.replace(",", "");

		let winner = "-";
		if (match.player1_score > match.player2_score) {
			winner = p1.user.username;
		} else if (match.player2_score > match.player1_score) {
			winner = p2.user.username;
		}

		const div = document.createElement("div");
		div.className =
			"match-entry flex justify-between items-center p-2 border-b border-green-500";
		div.innerHTML = `
			<div>
				<div class="font-bold text-green-400">${date}</div>
				<div class="text-sm text-gray-400">${p1.user.username} vs ${p2.user.username}</div>
			</div>
			<div class="text-right">
				<div class="text-sm text-green-400">Score: ${match.player1_score} - ${match.player2_score}</div>
				<div class="text-sm text-yellow-400">Winner: ${winner}</div>
			</div>`;

		container.appendChild(div);
	}
}

async function loadPastTournaments(
	userId: number,
	currentTournamentId: number
): Promise<void> {
	const res = await fetch(`/api/tournaments/users/${userId}/past`);
	const data = await res.json();
	const container = getElement<HTMLDivElement>("tournamentTableBody");
	container.innerHTML = "";

	for (const t of data.tournaments as Tournament[]) {
		const positionRes = await fetch(
			`/api/tournaments/${t.tournament_id}/players/${userId}`
		);
		const positionData = await positionRes.json();
		const date = new Date(t.tournament_date)
			.toLocaleString("pt-PT", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})
			.replace(",", "");

		const player = positionData.players?.find(
			(p: any) => p.player_id === userId
		);
		const div = document.createElement("div");
		div.className = "p-2 border border-green-500 rounded";
		div.innerHTML = `
			<div class="flex justify-between items-center">
				<span class="text-green-300 font-semibold">${t.tournament_name}</span>
				<span class="text-sm text-gray-400">${date}</span>
			</div>
			<div class="text-sm text-yellow-400">Position: ${
				player?.current_position ?? "-"
			}</div>`;

		container.appendChild(div);
		await loadUpComingMatchesById(t.tournament_id, userId);
	}

	const tournamentRes = await fetch(`/api/tournaments/${currentTournamentId}`);
	const tournamentData = await tournamentRes.json();
	const positionRes = await fetch(
		`/api/tournaments/${currentTournamentId}/players/${userId}`
	);
	const positionData = await positionRes.json();
	const player = positionData.players.find((p: any) => p.player_id === userId);

	getElement<HTMLSpanElement>("currTournamentName").textContent =
		tournamentData.tournament.name;
	getElement<HTMLSpanElement>("currTournamentPosition").textContent =
		player?.current_position ?? "-";
}

async function loadUpComingMatchesById(
	tournamentId: number,
	userId: number
): Promise<void> {
	const [tournamentRes, matchesRes] = await Promise.all([
		fetch(`/api/tournaments/${tournamentId}`),
		fetch(`/api/tournaments/${tournamentId}/matches`),
	]);
	const tournament = await tournamentRes.json();
	const data = await matchesRes.json();

	const container = getElement<HTMLDivElement>("upcomingMatches");
	container.innerHTML = "";

	console.log(data.matches);
	for (const match of data.matches as Match[]) {
		const opponentId = getOpponentId(match, userId);
		const opponentData = await fetch(`/api/users/${opponentId}`).then((res) =>
			res.json()
		);
		if (!opponentData.user) {
			opponentData.user = { username: "Unknown Player" };
		}
		const date = new Date(match.scheduled_date)
			.toLocaleString("pt-PT", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})
			.replace(",", "");

		const div = document.createElement("div");
		div.className = "p-2 border border-green-500 rounded";
		div.innerHTML = `
			<div class="flex justify-between items-center">
				<span class="text-green-300 font-semibold">${tournament.tournament.name}</span>
				<span class="text-sm text-gray-400">${date}</span>
			</div>
			<div class="text-sm text-yellow-400">Opponent: ${opponentData.user.username}</div>`;

		container.appendChild(div);
	}
}

function showDeleteModal(): void {
	getElement<HTMLDivElement>("deleteModal").style.display = "flex";
}

function showEditProfileModal(user: User, twofaEnabled: boolean): void {
	const modal = getElement<HTMLDivElement>("editProfileModal");
	modal.style.display = "flex";
	const usernameInput = getElement<HTMLInputElement>("editUsername");
	usernameInput.value = user.username;

	const twofaSection = getElement<HTMLDivElement>("twofaSection");
	if (twofaEnabled) {
		twofaSection.innerHTML = `<div class="text-green-400">2FA is already enabled.</div>`;
	} else {
		twofaSection.innerHTML = `
			<label class="flex items-center gap-2">
				<input id="enable2faCheckbox" type="checkbox" class="accent-[#4CF190]" />
				<span class="text-[#4CF190]">Enable Two-Factor Authentication</span>
			</label>
		`;
	}
}

function closeEditProfileModal(): void {
	getElement<HTMLDivElement>("editProfileModal").style.display = "none";
}

function attachProfileEventListeners(user: User, twofaEnabled: boolean) {
	// Edit Profile button
	getElement<HTMLButtonElement>("editProfileBtn").onclick = () =>
		showEditProfileModal(user, twofaEnabled);

	// Cancel button in modal
	getElement<HTMLButtonElement>("cancelEditProfileBtn").onclick =
		closeEditProfileModal;

	// Form submit
	getElement<HTMLFormElement>("editProfileForm").onsubmit = async (e) => {
		e.preventDefault();
		const username = getElement<HTMLInputElement>("editUsername").value;
		const pfpInput = getElement<HTMLInputElement>("editPfp");
		let pfpUrl = pfpInput.value.trim() || user.pfp;

		getElement<HTMLDivElement>("editUsernameError").textContent = "";
		if (username.length <= 3) {
			getElement<HTMLDivElement>("editUsernameError").textContent =
				"Username must be longer than 3 characters.";
			return;
		}
		if (username.length >= 20) {
			getElement<HTMLDivElement>("editUsernameError").textContent =
				"Username must be less than 20 characters.";
			return;
		}
		let twofa_enabled = false;
		const enable2faCheckbox = document.getElementById(
			"enable2faCheckbox"
		) as HTMLInputElement | null;
		if (enable2faCheckbox && enable2faCheckbox.checked) {
			twofa_enabled = true;
		}
		const userId = getUserIdFromToken();
		const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${getCookie("jwt")}`,
			},
			body: JSON.stringify({
				username,
				pfp: pfpUrl,
				twofa_enabled,
			}),
		});
		if (res.ok) {
			if (twofa_enabled) {
				const twofaRes = await fetch(`${API_BASE_URL}/2fa/setup`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${getCookie("jwt")}`,
					},
				});
				if (twofaRes.ok) {
					const twofaData = await twofaRes.json();
					const qrModal = getElement<HTMLDivElement>("twofaQrModal");
					const qrImg = getElement<HTMLImageElement>("twofaQrImg");
					qrImg.src = twofaData.code;
					getElement<HTMLDivElement>("editProfileModal").style.display = "none";
					qrModal.style.display = "flex";

					getElement<HTMLButtonElement>("closeTwofaQrBtn").onclick = () => {
						qrModal.style.display = "none";
						loadProfilePage();
					};

					qrModal.onclick = (e) => {
						if (e.target === qrModal) {
							qrModal.style.display = "none";
							loadProfilePage();
						}
					};
				} else {
					alert("Failed to enable 2FA.");
				}
			} else {
				closeEditProfileModal();
				loadProfilePage();
			}
		} else {
			let errorMsg = "Failed to update profile.";
			try {
				const errorData = await res.json();
				if (
					errorData &&
					errorData.message
				) {
					errorMsg = errorData.message;
				}
			} catch {}
			getElement<HTMLDivElement>("editUsernameError").textContent = errorMsg;
		}
	};
	// getElement<HTMLDivElement>("deleteModal").style.display = "flex";
	getElement<HTMLButtonElement>("cancelDeleteBtn").addEventListener(
		"click",
		closeDeleteModal
	);
	getElement<HTMLButtonElement>("confirmDeleteBtn").addEventListener(
		"click",
		confirmDelete
	);
}

function closeDeleteModal(): void {
	getElement<HTMLDivElement>("deleteModal").style.display = "none";
}

async function confirmDelete(): Promise<void> {
	closeDeleteModal();
	try {
		const userId = getUserIdFromToken();
		const token = getCookie("jwt");

		const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ token: getCookie("jwt") }),
			credentials: "include",
		});
		console.log(response);
		if (!response.ok) {
			throw new Error("Error deleting user");
		}

		alert("Your account has been deleted");

		document.cookie = "jwt=; Max-Age=0; path=/";
		window.location.href = "/";
	} catch (error) {
		console.error(error);
		alert("Error deleting accoun");
	}
}

async function renderPerformanceChart(): Promise<void> {
	const userId = getUserIdFromToken();
	if (!userId) {
		console.error("User ID not found.");
		return;
	}

	const userRes = await fetch(`/api/users/${userId}`, {
		headers: {
			Authorization: `Bearer ${getCookie("jwt")}`,
		},
	});
	const userData = await userRes.json();
	const user: User = userData.user;

	getElement<HTMLHeadingElement>("username").textContent = `@${user.username}`;
	getElement<HTMLHeadingElement>("name").textContent = user.name;
	getElement<HTMLDivElement>("email").textContent = user.email;
	getElement<HTMLImageElement>("pfp").src =
		user.pfp || "/images/default_pfp.png";
	getElement<HTMLSpanElement>("hoursPlayed").textContent = (
		user.total_play_time / 3600
	).toFixed(2);

	const statsRes = await fetch(`/api/users/${userId}/stats`, {
		headers: {
			Authorization: `Bearer ${getCookie("jwt")}`,
		},
	});
	const statsData = await statsRes.json();
	const stats: Stats = statsData.stats ?? {
		total_matches: 0,
		matches_won: 0,
		matches_lost: 0,
		average_score: 0,
		win_streak_max: 0,
		tournaments_won: 0,
	};

	const Chart = (window as any).Chart;
	const ChartDataLabels = (window as any).ChartDataLabels;

	if (!Chart || !ChartDataLabels) {
		console.error("Chart.js ou ChartDataLabels não carregado.");
		return;
	}

	Chart.register(ChartDataLabels);

	const doughnutCanvas = document.getElementById(
		"doughnutChart"
	) as HTMLCanvasElement;
	const barCanvas = document.getElementById("barChart") as HTMLCanvasElement;

	const totalMatches = stats.total_matches ?? 0;
	const matchesWon = stats.matches_won ?? 0;
	const matchesLost = stats.matches_lost ?? 0;
	const doughnutCenterText = {
		id: "doughnutCenterText",
		beforeDraw(chart: any) {
			const { width, height, ctx } = chart;
			ctx.save();
			ctx.textBaseline = "middle";
			ctx.textAlign = "center";

			const total = `${totalMatches}`;
			const fontSizeNumber = height / 7;
			const fontSizeLabel = height / 25;

			ctx.font = `bold ${fontSizeNumber}px 'Courier New', monospace`;
			ctx.fillStyle = "#4CF190";
			ctx.fillText(total, width / 2, height / 2 - 10);

			ctx.font = `${fontSizeLabel}px 'Courier New', monospace`;
			ctx.fillStyle = "#BBB";
			ctx.fillText("Total Matches", width / 2, height / 2 + 25);

			ctx.restore();
		},
	};

	// Chart.register(doughnutCenterText);

	if (doughnutCanvas && barCanvas) {
		const doughnutCtx = doughnutCanvas.getContext("2d");
		const barCtx = barCanvas.getContext("2d");
		let doughnutData = [matchesWon, matchesLost];
		const isEmptyStats = matchesWon === 0 && matchesLost === 0;

		if (matchesWon === 0 && matchesLost === 0) {
			doughnutData = [1, 1];
		}

		// Doughnut Chart
		new Chart(doughnutCtx, {
			type: "doughnut",
			data: {
				labels: ["Wins", "Losses"],
				datasets: [
					{
						label: "Total",
						data: doughnutData,
						backgroundColor: ["#4CF190", "#E57373"],
						borderColor: "#001B26",
						borderWidth: 2,
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					tooltip: { enabled: true },
					legend: {
						position: "bottom",
						labels: { color: "#ffffff" },
					},
					datalabels: {
						display: false,
					},
				},
			},
			plugins: [doughnutCenterText, ChartDataLabels],
		});

		const res = await fetch(`/api/tournaments/users/${userId}/past`);
		const data = await res.json();

		console.log(data.tournaments);
		const tournamentStats = data.tournaments
			.map((tournament: any, index: number) => ({
				tournament_id: tournament.tournament_id,
				name: tournament.tournament_name,
				wins: tournament.wins ?? 0,
				losses: tournament.losses ?? 0,
			}))
			.slice(0, 10)
			.reverse();

		const tournamentLabels = tournamentStats.map(
			(t: { name: string; wins: number; losses: number }) => t.name
		);

		const winsData = tournamentStats.map(
			(t: { name: string; wins: number; losses: number }) => t.wins
		);
		const lossesData = tournamentStats.map(
			(t: { name: string; wins: number; losses: number }) => t.losses
		);
		const win_rate = tournamentStats.map(
			(t: { name: string; wins: number; losses: number }) => {
				const total = t.wins + t.losses;
				return total === 0 ? 0 : +((t.wins / total) * 10).toFixed(1);
			}
		);

		new Chart(barCtx, {
			type: "line",
			data: {
				labels: tournamentLabels,
				datasets: [
					{
						label: "Wins",
						data: winsData,
						borderColor: "#4CF190",
						backgroundColor: "rgba(76, 241, 144, 0.2)",
						pointBackgroundColor: "#4CF190",
						tension: 0.4,
						borderWidth: 2,
						fill: false,
					},
					{
						label: "Losses",
						data: lossesData,
						borderColor: "#E57373",
						backgroundColor: "rgba(229, 115, 115, 0.2)",
						pointBackgroundColor: "#E57373",
						tension: 0.4,
						borderWidth: 2,
						fill: false,
					},
					{
						label: "Win Rate/1=10%",
						data: win_rate,
						borderColor: "#FFD54F",
						backgroundColor: "rgba(255, 213, 79, 0.2)",
						pointBackgroundColor: "#FFD54F",
						tension: 0.4,
						borderWidth: 2,
						fill: false,
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					legend: {
						labels: { color: "#4CF190" },
					},
					tooltip: { enabled: true },
					datalabels: {
						color: "#FFFFFF",
						align: "end",
						anchor: "start",
						offset: 2,
						font: {
							weight: "bold",
							size: 10,
						},
					},
				},

				scales: {
					y: {
						beginAtZero: true,
						min: 0,
						max: 25,
						ticks: {
							stepSize: 1,
							color: "#4CF190",
						},
						grid: {
							color: "rgba(76,241,144,0.1)",
						},
						title: {
							display: true,
							text: "Quantidade / Posição",
							color: "#4CF190",
						},
					},
					x: {
						ticks: {
							color: "#4CF190",
						},
						grid: {
							color: "rgba(76,241,144,0.05)",
						},
						title: {
							display: true,
							text: "Torneios",
							color: "#4CF190",
						},
					},
				},
			},
		});
	}
}

(window as any).loadProfilePage = loadProfilePage;
