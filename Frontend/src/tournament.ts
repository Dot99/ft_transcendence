import { tournamentTemplate } from "./templates/tournamentTemplate.js";
import { getCookie, getUserIdFromToken } from "./utils/auth.js";
import { API_BASE_URL } from "./config.js";
import { loadMenuPage } from "./menu.js";
import { t } from "./locales/localeMiddleware.js";
declare const JSC: any;

function getElement<T extends HTMLElement>(id: string): T {
	const el = document.getElementById(id);
	if (!el) throw new Error(`Element with id '${id}' not found`);
	return el as T;
}

export const loadTournamentPage = async (
	tournament_id: string
): Promise<void> => {
	const app = getElement<HTMLElement>("app");
	app.innerHTML = tournamentTemplate;

	const res = await fetch(`${API_BASE_URL}/tournaments/${tournament_id}`, {
		headers: {
			Authorization: `Bearer ${getCookie("jwt")}`,
		},
	});
	const tournaments = await res.json();
	const list = getElement<HTMLDivElement>("bracketContainer");
	list.innerHTML = `
  <div class="border border-green-400 p-4 rounded hover:bg-teal-900 transition cursor-pointer" onclick="joinTournament(${tournaments.tournament.id})">
    <h3 class="text-xl font-semibold">${tournaments.tournament.name}</h3>
    <p class="text-sm">Players: ${tournaments.tournament.PLAYER_COUNT}/${tournaments.tournament.max_players}</p>
  </div>
`;
	if (tournament_id) {
		renderBracket(tournament_id);

		// Check if current user can start games (has upcoming match)
		const canStartGames = await checkUserCanStartGames(tournament_id);

		// Add event listener for Start Games button
		const startMatchesBtn = document.getElementById("startMatchesBtn");
		if (startMatchesBtn) {
			if (canStartGames) {
				startMatchesBtn.addEventListener("click", () => {
					handleStartGames(tournament_id);
				});
				startMatchesBtn.style.opacity = "1";
				startMatchesBtn.style.cursor = "pointer";
			} else {
				// Disable button for users without upcoming matches
				startMatchesBtn.style.opacity = "0.5";
				startMatchesBtn.style.cursor = "not-allowed";
				startMatchesBtn.addEventListener("click", (e) => {
					e.preventDefault();
					alert(
						"You don't have any upcoming matches in this tournament."
					);
				});
			}
		}
		const backBtn = document.getElementById("backBtn");
		if (backBtn) {
			backBtn.onclick = () => loadMenuPage();
		}

		// Start auto-refresh to show tournament progression
		startBracketAutoRefresh(tournament_id);
	}
	// Add back button functionality - goes to menu instead of play
};

// Utility function to group an array of objects by a key
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
	return array.reduce((result, currentItem) => {
		const groupKey = String(currentItem[key]);
		if (!result[groupKey]) {
			result[groupKey] = [];
		}
		result[groupKey].push(currentItem);
		return result;
	}, {} as Record<string, T[]>);
}

type Match = {
	match_id?: number;
	player1: string;
	player2: string;
	match_state: string;
	winner: string;
	player1_score?: number;
	player2_score?: number;
	round_number: number;
};

// Variável global para armazenar o número de rodadas
let totalRounds: number = 0;
let chartPoints: any[] = [];
// Add a global flag to track if missing matches have already been fetched
let missingMatchesFetched = false;

// Atualize o renderBracket para calcular o número de rodadas
async function renderBracket(tournamentId: string) {
	const chartContainer = getElement<HTMLDivElement>("bracketContainer");
	if (!chartContainer) return;

	// Fetch tournament details to get max_players
	const tournamentRes = await fetch(
		`${API_BASE_URL}/tournaments/${tournamentId}`,
		{
			headers: { Authorization: `Bearer ${getCookie("jwt")}` },
		}
	);

	if (!tournamentRes.ok) {
		console.error(
			"Error fetching tournament details:",
			await tournamentRes.text()
		);
		return;
	}

	const tournament = await tournamentRes.json();
	const maxPlayers = tournament.tournament.max_players;

	// Calcular o número total de rodadas
	totalRounds = Math.log2(maxPlayers);

	// REMOVE THIS LINE - it's overwriting your template styling:
	// chartContainer.innerHTML = createBracketLayout(maxPlayers);

	// Fetch matches
	const res = await fetch(
		`${API_BASE_URL}/tournaments/${tournamentId}/matches`,
		{
			headers: { Authorization: `Bearer ${getCookie("jwt")}` },
		}
	);

	let games: any;
	let matches: Match[] = [];
	if (res.ok === true) {
		games = await res.json();
		matches = games.matches.map((m: { round_number: any }) => ({
			...m,
			round_number: Number(m.round_number),
		}));
	}
	chartPoints = await generateChartPoints(matches);
	// Update bracket with actual match data
	createCustomBracket(chartPoints, matches, tournamentId);
}

async function createCustomBracket(
	chartPoints: any[],
	matches: Match[],
	tournamentId: string
) {
	const chartContainer = document.getElementById("bracketContainer");
	if (!chartContainer) return;

	const rounds = groupBy(matches, "round_number");
	const expectedRounds = [...Array(totalRounds).keys()].map((i) => i + 1);
	const sortedRounds = Array.from(
		new Set([...expectedRounds, ...Object.keys(rounds).map(Number)])
	).sort((a, b) => a - b);

	sortedRounds.forEach((r) => {
		if (!rounds[r]) rounds[r] = [];
	});

	for (let i = 1; i <= totalRounds; i++) {
		if (!sortedRounds.includes(i)) {
			sortedRounds.push(i);
		}
	}
	sortedRounds.forEach((r) => {
		if (!rounds[r]) rounds[r] = [];
	});
	sortedRounds.sort((a, b) => a - b);

	const tournamentRes = await fetch(
		`${API_BASE_URL}/tournaments/${tournamentId}`,
		{
			headers: { Authorization: `Bearer ${getCookie("jwt")}` },
		}
	);
	const tournament = await tournamentRes.json();

	const expectedMatches =
		expectedMatchesLeft(
			tournament.tournament.max_players,
			tournament.tournament.current_round
		) - 1;

	const upcomingMatches = matches.filter(
		(match) => match.match_state === "upcoming"
	);
	const completedMatches = matches.filter(
		(match) => match.match_state === "completed"
	);
	const totalKnownMatches = upcomingMatches.length + completedMatches.length;
	const totalExpectedMatches = tournament.tournament.max_players - 1;

	if (totalKnownMatches < totalExpectedMatches && !missingMatchesFetched) {
		console.warn(
			"Matches incompletos detectados. Buscando missing matches..."
		);
		await fetchMissingMatches(tournamentId, matches, chartPoints);
	}

	chartPoints = await generateChartPoints(matches);
	missingMatchesFetched = false;

	// --- DESIGN MELHORADO E BRACKETS ALINHADOS ---
	const roundsCount = sortedRounds.length;
	const maxMatches = Math.max(
		...sortedRounds.map((r) => rounds[r].length || 1),
		1
	);

	let bracketHTML = `
	<div class="overflow-auto min-h-screen max-h-screen bg-gradient-to-br from-gray-900 to-teal-900 rounded-lg border-2 border-green-500 shadow-2xl p-8">
		<div class="grid" style="grid-template-columns: repeat(${roundsCount}, minmax(220px, 1fr)); gap: 48px;">
	`;

	// SVG connectors
	let connectorsSVG = `<svg class="absolute top-0 left-0 pointer-events-none w-full h-full" style="z-index:0;" xmlns="http://www.w3.org/2000/svg">`;

	const cardHeight = 110;
	const cardGap = 40;

	for (let roundIndex = 0; roundIndex < roundsCount; roundIndex++) {
		const round = sortedRounds[roundIndex];
		const roundNumber = Number(round);
		let roundMatches = rounds[round] || [];

		const isFinalRound = roundNumber === roundsCount;
		if (isFinalRound && roundMatches.length === 0) {
			roundMatches = [
				{
					player1: "",
					player2: "",
					match_state: "upcoming",
					player1_score: undefined,
					player2_score: undefined,
					winner: "",
					round_number: 1,
				},
			];
		}

		const matchesInRound = Math.max(
			roundMatches.length,
			Math.pow(2, totalRounds - roundNumber)
		);

		bracketHTML += `
		<div class="flex flex-col items-center relative min-w-[220px]">
			<h3 class="text-green-100 text-lg font-bold mb-6 text-center shadow uppercase tracking-wider py-2 px-6 bg-green-700 rounded-lg border border-green-400 drop-shadow">
				${getRoundName(roundNumber, roundsCount)}
			</h3>
			<div class="flex flex-col items-center gap-[${cardGap}px] relative">
		`;

		// Dynamic spacing based on tournament size and round
		const baseSpacing = totalRounds <= 2 ? 8 : 4;
		const verticalSpacing = Math.max(
			baseSpacing,
			baseSpacing * Math.pow(1.5, roundIndex)
		);

		// Get the round name to check if it should be yellow
		const roundName = getRoundName(roundNumber, sortedRounds.length);
		const isSpecialRound =
			roundName === "Quarterfinals" ||
			roundName === "Semifinals" ||
			roundName === "Final";

		// Yellow text for special rounds, but GREEN borders for all
		const headerClasses = isSpecialRound
			? "text-[#FFD700] border-[#4CF190]"
			: "text-[#4CF190] border-[#4CF190]";
		const textClasses = isSpecialRound
			? "text-[#FFD700]"
			: "text-[#4CF190]";
		const borderClasses = "border-[#4CF190]"; // ALL borders are GREEN
		const lineClasses = "bg-[#4CF190]"; // ALL connector lines are GREEN

		bracketHTML += `
  <div class="flex flex-col items-center relative min-w-32 md:min-w-36 flex-shrink-0">
    <h3 class="${headerClasses} text-sm md:text-lg font-bold mb-2 md:mb-4 text-center uppercase tracking-wide py-1 md:py-2 px-3 md:px-5 bg-[#001B26] border-2">
      ${roundName}
    </h3>
    
    <div class="flex flex-col items-center" style="gap: ${
		verticalSpacing * 4
	}px;">
`;

		for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
			const match = roundMatches[matchIndex] || {
				player1: "",
				player2: "",
				match_state: "upcoming",
			};

			const chartPoint = chartPoints.find(
				(point) => point.id === `r${round}_m${matchIndex}`
			);

			const rawPlayer1 =
				chartPoint?.label?.text.split("\n")[0] ||
				match.player1 ||
				"TBD";
			const rawPlayer2 =
				chartPoint?.label?.text.split("\n")[2] ||
				match.player2 ||
				"TBD";

			const playersMap = new Map<string, string>();
			for (const player of tournament.players || []) {
				playersMap.set(
					player.id,
					player.username || player.name || "Unknown"
				);
			}

			const player1 = playersMap?.get(rawPlayer1) || rawPlayer1;
			const player2 = playersMap?.get(rawPlayer2) || rawPlayer2;

			const isCompleted = match.match_state === "completed";
			const winnerId = match.winner;
			const player1Score = match.player1_score ?? "";
			const player2Score = match.player2_score ?? "";

			const isPlayer1Winner = isCompleted && winnerId == match.player1;
			const isPlayer2Winner = isCompleted && winnerId == match.player2;

			const displayPlayer1 =
				isFinalRound && !match.player1 ? "TBD" : player1;
			const displayPlayer2 =
				isFinalRound && !match.player2 ? "TBD" : player2;

			// Winners use the appropriate color based on round - using exact same format as your working buttons
			const player1WinnerClasses = isPlayer1Winner
				? "bg-[#4CF190] text-[#001B26]"
				: "";
			const player2WinnerClasses = isPlayer2Winner
				? "bg-[#4CF190] text-[#001B26]"
				: "";

			bracketHTML += `
<div class="bg-[#001B26] ${borderClasses} border-2 p-3 md:p-5 w-32 md:w-36 min-h-16 md:min-h-20 flex flex-col justify-center relative transition cursor-pointer hover:bg-[#002B36]">
  <div class="bg-[#07303c] ${borderClasses} border-2 px-2 md:px-4 py-2 md:py-3 mb-2 md:mb-3 ${player1WinnerClasses}">
    <span class="${
		isPlayer1Winner ? "text-[#001B26]" : textClasses
	} font-bold text-xs md:text-sm">
        ${truncate(displayPlayer1, 12)}${
				isCompleted ? ` (${player1Score})` : ""
			}
    </span>
    </div>

    <div class="text-center ${textClasses} text-xs md:text-sm font-bold my-1 md:my-3">VS</div>

    <div class="bg-[#07303c] ${borderClasses} border-2 px-2 md:px-4 py-2 md:py-3 mb-2 md:mb-3 ${player2WinnerClasses}">
    <span class="${
		isPlayer2Winner ? "text-[#001B26]" : textClasses
	} font-bold text-xs md:text-sm">
        ${truncate(displayPlayer2, 12)}${
				isCompleted ? ` (${player2Score})` : ""
			}
    </span>
    </div>
</div>
`;

			// Only add connector lines if there's a next round AND it's not the last match in round
			if (
				roundIndex < sortedRounds.length - 1 &&
				matchIndex < matchesInRound - 1
			) {
				bracketHTML += `
          <div class="w-0.5 h-4 ${lineClasses} mb-2"></div>
        `;
			}
		}

		bracketHTML += "</div></div>";

		// Add SMALLER trophy after the final round
		if (isFinalRound) {
			bracketHTML += `
        <div class="flex items-center justify-center ml-8">
          <img src="images/trophy.svg" class="w-24 h-24" alt="trophy">
        </div>
      `;
		}
	}

	bracketHTML += "</div>";
	chartContainer.innerHTML = bracketHTML;
}

async function fetchMissingMatches(
	tournamentId: string,
	matches: Match[],
	chartPoints: any[]
) {
	// Prevent repeated calls to fetchMissingMatches
	if (missingMatchesFetched) {
		console.warn("Missing matches already fetched. Skipping...");
		return;
	}

	missingMatchesFetched = true;

	const res = await fetch(
		`${API_BASE_URL}/tournaments/${tournamentId}/matches/finished`,
		{
			headers: { Authorization: `Bearer ${getCookie("jwt")}` },
		}
	);

	if (!res.ok) {
		console.error("Error fetching missing matches:", await res.text());
		return;
	}

	const missingMatches = await res.json();
	matches.push(...missingMatches.matches);

	createCustomBracket(chartPoints, matches, tournamentId);
}

async function generateChartPoints(matches: Match[]) {
	const rounds = groupBy(matches, "round_number");
	const chartPoints: any[] = [];
	const matchIdsByRound: Record<number, string[]> = {};

	const sortedRounds = Object.keys(rounds)
		.map(Number)
		.sort((a, b) => a - b);

	for (const round of sortedRounds) {
		const roundMatches = rounds[round];
		matchIdsByRound[round] = [];

		for (let index = 0; index < roundMatches.length; index++) {
			const match = roundMatches[index];
			const matchId = `r${round}_m${index}`;
			matchIdsByRound[round].push(matchId);

			const parentRound = matchIdsByRound[round - 1];
			const parentId =
				round > 1 && parentRound
					? parentRound[Math.floor(index / 2)]
					: undefined;

			const [player1Res, player2Res] = await Promise.all([
				fetch(`${API_BASE_URL}/users/${match.player1}`, {
					headers: { Authorization: `Bearer ${getCookie("jwt")}` },
				}),
				fetch(`${API_BASE_URL}/users/${match.player2}`, {
					headers: { Authorization: `Bearer ${getCookie("jwt")}` },
				}),
			]);
			const [player1Data, player2Data] = await Promise.all([
				player1Res.json(),
				player2Res.json(),
			]);

			chartPoints.push({
				id: matchId,
				name: `match_${index}`,
				label: {
					text: `${player1Data.user.username}\nvs\n${player2Data.user.username}`,
				},

				...(parentId && { parent: parentId }),
			});
		}
	}

	return chartPoints;
}

function truncate(name: string, maxLength = 12): string {
	return name.length > maxLength ? name.slice(0, maxLength - 1) + "…" : name;
}

function getRoundName(roundNumber: number, totalRounds: number): string {
	if (totalRounds === 2) {
		// 4-player tournament
		if (roundNumber === 1) return "Semifinals";
		if (roundNumber === 2) return "Final";
	} else if (totalRounds === 3) {
		// 8-player tournament
		if (roundNumber === 1) return "Quarterfinals";
		if (roundNumber === 2) return "Semifinals";
		if (roundNumber === 3) return "Final";
	}

	// Fallback for other sizes
	if (roundNumber === totalRounds) return "Final";
	if (roundNumber === totalRounds - 1) return "Semifinals";
	if (roundNumber === totalRounds - 2) return "Quarterfinals";
	return `Round ${roundNumber}`;
}

function expectedMatchesLeft(totalPlayers: number, currentRound: number) {
	const totalRounds = Math.log2(totalPlayers);
	const roundsLeft = totalRounds - currentRound + 1;
	let matches = 0;
	for (let i = 0; i < roundsLeft; i++) {
		matches += Math.pow(2, totalRounds - i - 1);
	}
	return matches;
}

/**
 * Handle the Start Games button click - find user's current match and mark them as ready
 */
async function handleStartGames(tournamentId: string) {
	try {
		const userId = getUserIdFromToken();
		if (!userId) {
			alert("Please log in to start games");
			return;
		}

		// Find the user's current upcoming match
		const currentMatch = await findUserCurrentMatch(tournamentId, userId);
		if (!currentMatch) {
			alert("No upcoming matches found for you in this tournament");
			return;
		}

		// Mark player as ready
		await markPlayerReady(tournamentId, currentMatch.match_id!, userId);
	} catch (error) {
		console.error("Error starting games:", error);
		alert("Failed to start games. Please try again.");
	}
}

/**
 * Find the user's current upcoming match in the tournament
 */
async function findUserCurrentMatch(
	tournamentId: string,
	userId: number
): Promise<Match | null> {
	try {
		const res = await fetch(
			`${API_BASE_URL}/tournaments/${tournamentId}/matches`,
			{
				headers: {
					Authorization: `Bearer ${getCookie("jwt")}`,
				},
			}
		);

		if (!res.ok) {
			throw new Error("Failed to fetch matches");
		}

		const data = await res.json();
		const matches = data.matches || [];

		// Find the first upcoming match where the user is a participant
		for (const match of matches) {
			if (
				match.match_state === "upcoming" &&
				(match.player1 == userId || match.player2 == userId)
			) {
				return match;
			}
		}

		return null;
	} catch (error) {
		console.error("Error finding user match:", error);
		return null;
	}
}

/**
 * Mark a player as ready for their match and handle the response
 */
async function markPlayerReady(
	tournamentId: string,
	matchId: number,
	userId: number
) {
	try {
		// Mark player as ready
		const readyRes = await fetch(
			`${API_BASE_URL}/tournaments/${tournamentId}/matches/${matchId}/ready`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getCookie("jwt")}`,
				},
				body: JSON.stringify({ userId: userId }),
			}
		);

		if (!readyRes.ok) {
			throw new Error("Failed to mark player as ready");
		}

		const readyData = await readyRes.json();

		if (readyData.bothReady && readyData.gameId) {
			// Both players are ready, start the game immediately
			startTournamentMatch(readyData.gameId, readyData.opponentUsername);
		} else {
			// Show waiting modal and poll for opponent
			showWaitingModal(tournamentId, matchId);
		}
	} catch (error) {
		console.error("Error marking player ready:", error);
		throw error;
	}
}

/**
 * Show waiting modal and poll for opponent readiness
 */
async function showWaitingModal(tournamentId: string, matchId: number) {
	// Create waiting modal
	const waitingModal = document.createElement("div");
	waitingModal.className =
		"fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[110]";
	waitingModal.innerHTML = `
		<div class="bg-[#001B26] border-4 border-[#4CF190] rounded-xl p-8 flex flex-col items-center shadow-2xl relative max-w-md text-center">
			<h2 class="text-2xl font-bold text-[#4CF190] mb-4">Waiting for Opponent</h2>
			<div class="text-white mb-6">
				<div class="animate-spin w-8 h-8 border-2 border-[#4CF190] border-t-transparent rounded-full mx-auto mb-4"></div>
				<p>Waiting for your opponent to press "Start Games"...</p>
			</div>
			<button id="cancelWaiting" class="px-6 py-2 bg-red-600 text-white rounded font-bold border-2 border-red-800 hover:bg-red-700">Cancel</button>
		</div>
	`;

	document.body.appendChild(waitingModal);

	// Add cancel event listener
	const cancelBtn = waitingModal.querySelector("#cancelWaiting");
	let polling = true;

	cancelBtn?.addEventListener("click", () => {
		polling = false;
		document.body.removeChild(waitingModal);
	});

	// Poll for opponent readiness
	while (polling) {
		await new Promise((resolve) => setTimeout(resolve, 2000));
		if (!polling) break;

		try {
			const statusRes = await fetch(
				`${API_BASE_URL}/tournaments/${tournamentId}/matches/${matchId}/status`,
				{
					headers: {
						Authorization: `Bearer ${getCookie("jwt")}`,
					},
				}
			);

			if (statusRes.ok) {
				const statusData = await statusRes.json();
				if (statusData.bothReady && statusData.gameId) {
					polling = false;
					document.body.removeChild(waitingModal);
					startTournamentMatch(
						statusData.gameId,
						statusData.opponentUsername
					);
					break;
				}
			}
		} catch (error) {
			console.error("Error polling match status:", error);
		}
	}
}

/**
 * Start the tournament match by setting game data and loading play page
 */
function startTournamentMatch(gameId: string, opponentUsername: string) {
	// Set game data for tournament match
	(window as any).gameData = {
		type: "tournament",
		gameId: gameId,
		opponentUsername: opponentUsername,
	};

	// Load the play page
	window.dispatchEvent(new Event("loadPlayPage"));
}

/**
 * Check if the current user has an upcoming match in the tournament
 */
async function checkUserCanStartGames(tournamentId: string): Promise<boolean> {
	try {
		const userId = getUserIdFromToken();
		if (!userId) {
			return false;
		}

		const res = await fetch(
			`${API_BASE_URL}/tournaments/${tournamentId}/matches`,
			{
				headers: {
					Authorization: `Bearer ${getCookie("jwt")}`,
				},
			}
		);

		if (!res.ok) {
			return false;
		}

		const data = await res.json();
		const matches = data.matches || [];

		// Check if user has any upcoming matches
		return matches.some(
			(match: any) =>
				match.match_state === "upcoming" &&
				(match.player1 == userId || match.player2 == userId)
		);
	} catch (error) {
		console.error("Error checking if user can start games:", error);
		return false;
	}
}

/**
 * Refresh the tournament bracket display
 */
async function refreshBracket(tournamentId: string) {
	try {
		await renderBracket(tournamentId);

		// Also update the start button status
		const canStartGames = await checkUserCanStartGames(tournamentId);
		const startMatchesBtn = document.getElementById("startMatchesBtn");

		if (startMatchesBtn) {
			// Remove existing event listeners
			const newBtn = startMatchesBtn.cloneNode(true) as HTMLElement;
			startMatchesBtn.parentNode?.replaceChild(newBtn, startMatchesBtn);

			if (canStartGames) {
				newBtn.addEventListener("click", () => {
					handleStartGames(tournamentId);
				});
				newBtn.style.opacity = "1";
				newBtn.style.cursor = "pointer";
			} else {
				newBtn.style.opacity = "0.5";
				newBtn.style.cursor = "not-allowed";
				newBtn.addEventListener("click", (e) => {
					e.preventDefault();
					alert(
						"You don't have any upcoming matches in this tournament."
					);
				});
			}
		}
	} catch (error) {
		console.error("Error refreshing bracket:", error);
	}
}

// Auto-refresh bracket every 10 seconds to show tournament progression
let refreshInterval: number | null = null;

// Function to start auto-refresh
function startBracketAutoRefresh(tournamentId: string) {
	// Clear any existing interval
	if (refreshInterval) {
		window.clearInterval(refreshInterval);
	}

	// Set up new interval
	refreshInterval = window.setInterval(() => {
		refreshBracket(tournamentId);
	}, 10000); // Refresh every 10 seconds
}

// Function to stop auto-refresh
function stopBracketAutoRefresh() {
	if (refreshInterval) {
		window.clearInterval(refreshInterval);
		refreshInterval = null;
	}
}

// Export cleanup function for use by other modules
export function cleanupTournamentPage() {
	stopBracketAutoRefresh();
}
