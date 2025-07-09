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
	// const homeBtn = document.getElementById("homeBtn");
	// if (homeBtn) {
	// 	const homeText = homeBtn.querySelector("span.text-base");
	// 	if (homeText) homeText.textContent = t("home");
	// 	homeBtn.onclick = () => loadMenuPage();
	// }
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
	}
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

	// Render initial bracket layout
	chartContainer.innerHTML = createBracketLayout(maxPlayers);

	// Fetch matches
	const res = await fetch(
		`${API_BASE_URL}/tournaments/${tournamentId}/matches`,
		{
			headers: { Authorization: `Bearer ${getCookie("jwt")}` },
		}
	);
	// if (!res.ok) {
	// 	console.error("Error searching matches:", await res.text());
	// 	// return;
	// }
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

	const rounds = groupBy(matches, "round_number"); // agora numbers
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

	// Create bracket HTML with proper grid layout
	let bracketHTML = `
    <div class="flex items-center justify-center gap-8 p-8 overflow-auto min-h-screen max-h-screen bg-gradient-to-br from-gray-800 to-teal-700 rounded-lg border-2 border-green-500 shadow-xl relative">
  `;

	for (let roundIndex = 0; roundIndex < sortedRounds.length; roundIndex++) {
		const round = sortedRounds[roundIndex];
		const roundNumber = Number(round);
		let roundMatches = rounds[round] || [];

		// Forçar criação de match "TBD vs TBD" na final se não existir nenhum
		const isFinalRound = roundNumber === sortedRounds.length;
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

		const verticalSpacing = Math.max(15, 40 * Math.pow(1.6, roundIndex));

		// Ensure the final round is displayed even if no matches exist
		const matchesInRound = Math.max(
			roundMatches.length,
			Math.pow(2, totalRounds - roundNumber)
		);

		bracketHTML += `
      <div class="flex flex-col items-center relative min-w-36 flex-shrink-0">
        <h3 class="text-green-200 text-lg font-bold mb-4 text-center shadow-md uppercase tracking-wide py-2 px-5 bg-green-600 rounded-lg border border-green-400">
          ${getRoundName(roundNumber, sortedRounds.length)}
        </h3>
        
        <div class="flex flex-col gap-${verticalSpacing}px items-center">
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

			// Ensure TBD is displayed for the final match if no players are available
			const isFinalRound = roundNumber === sortedRounds.length;
			const displayPlayer1 =
				isFinalRound && !match.player1 ? "TBD" : player1;
			const displayPlayer2 =
				isFinalRound && !match.player2 ? "TBD" : player2;

			bracketHTML += `
        <div class="bg-gradient-to-br from-teal-700 to-teal-600 border-2 border-green-400 rounded-lg p-5 w-36 min-h-20 flex flex-col justify-center relative shadow-lg transition cursor-pointer backdrop-blur-md hover:scale-105 hover:bg-teal-500">
          <div class="bg-green-300 rounded-md px-4 py-3 mb-3 border-l-4 ${
				isPlayer1Winner ? "border-green-500" : "border-green-400"
			}">
			<span class="${
				isPlayer1Winner ? "text-green-500" : "text-green-400"
			} font-bold text-sm">
				${truncate(displayPlayer1, 15)}${isCompleted ? ` (${player1Score})` : ""}
			</span>
			</div>

			<div class="text-center text-green-300 text-sm font-bold my-3 shadow-md">VS</div>

			<div class="bg-green-300 rounded-md px-4 py-3 mb-3 border-l-4 ${
				isPlayer2Winner ? "border-green-500" : "border-green-400"
			}">
			<span class="${
				isPlayer2Winner ? "text-green-500" : "text-green-400"
			} font-bold text-sm">
				${truncate(displayPlayer2, 15)}${isCompleted ? ` (${player2Score})` : ""}
			</span>
			</div>
        </div>
      `;

			// Add connector lines to the next round
			if (roundIndex < sortedRounds.length - 1) {
				const nextRoundIndex = roundIndex + 1;
				const nextMatchIndex = Math.floor(matchIndex / 2);

				bracketHTML += `
					<div class="w-0.5 h-${verticalSpacing}px bg-green-400 absolute left-1/2 bottom-0 transform -translate-x-1/2"></div>
					<div class="w-12 h-0.5 bg-green-400 absolute ${
						matchIndex % 2 === 0 ? "left-full" : "left-1/2"
					} bottom-${verticalSpacing}px transform ${
					matchIndex % 2 === 0 ? "" : "-translate-x-full"
				}"></div>
				`;
			}
		}

		bracketHTML += "</div></div>"; // Close matches-container and round-column
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

function createBracketLayout(maxPlayers: number): string {
	const totalRounds = Math.log2(maxPlayers); // Número de rodadas
	let bracketHTML = `
    <div class="flex items-start justify-center gap-8 p-8 overflow-auto min-h-screen max-h-screen bg-gradient-to-br from-gray-800 to-teal-700 rounded-lg border-2 border-green-500 shadow-xl relative">
  `;

	for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
		const matchesInRound = maxPlayers / Math.pow(2, roundIndex + 1); // Número de partidas na rodada
		const verticalSpacing = Math.max(15, 40 * Math.pow(1.6, roundIndex)); // Espaçamento vertical

		bracketHTML += `
      <div class="flex flex-col items-center relative min-w-36 flex-shrink-0">
        <h3 class="text-green-200 text-lg font-bold mb-4 text-center shadow-md uppercase tracking-wide py-2 px-5 bg-green-600 rounded-lg border border-green-400">
          ${getRoundName(roundIndex + 1, totalRounds)}
        </h3>
        
        <div class="flex flex-col gap-${verticalSpacing}px items-center">
    `;

		for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
			bracketHTML += `
        <div class="bg-gradient-to-br from-teal-700 to-teal-600 border-2 border-green-400 rounded-lg p-5 w-36 min-h-20 flex flex-col justify-center relative shadow-lg transition cursor-pointer backdrop-blur-md hover:scale-105 hover:bg-teal-500">
          <div class="bg-green-300 rounded-md px-4 py-3 mb-3 border-l-4 border-green-400">
            <span class="text-green-400 font-bold text-sm">
              TBD
            </span>
          </div>
          
          <div class="text-center text-green-300 text-sm font-bold my-3 shadow-md">VS</div>
          
          <div class="bg-green-300 rounded-md px-4 py-3 mb-3 border-l-4 border-green-400">
            <span class="text-green-400 font-bold text-sm">
              TBD
            </span>
          </div>
        </div>
      `;
		}

		bracketHTML += "</div></div>"; // Close matches-container and round-column
	}

	bracketHTML += "</div>"; // Close bracket-container

	return bracketHTML;
}

function getRoundName(roundNumber: number, totalRounds: number): string {
	if (roundNumber === totalRounds) return "Final";
	if (roundNumber === totalRounds - 1) return "Semifinal";
	if (roundNumber === totalRounds - 2) return "Quartas";
	return `Ronda ${roundNumber}`;
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
