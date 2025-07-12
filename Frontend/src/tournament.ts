import { tournamentTemplate } from "./templates/tournamentTemplate.js";
import { getCookie, getUserIdFromToken } from "./utils/auth.js";
import { API_BASE_URL } from "./config.js";
import { t } from "./locales/localeMiddleware.js";
import { navigateTo } from "./utils/router.js";
declare const JSC: any;

function getElement<T extends HTMLElement>(id: string): T {
	const el = document.getElementById(id);
	if (!el) throw new Error(`Element with id '${id}' not found`);
	return el as T;
}

export const loadTournamentPage = async (
	tournament_id: string
): Promise<void> => {
	// Reset notification flag for this tournament
	tournamentCompletionNotified = false;

	const app = getElement<HTMLElement>("app");
	app.innerHTML = tournamentTemplate;

	// Update the current URL without triggering navigation if needed
	if (window.location.pathname !== "/tournament") {
		history.replaceState(null, "", "/tournament");
	}

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
		// Display tournament information at the top
		await displayTournamentInfo(tournament_id);

		// Force refresh the bracket to get the latest state
		await renderBracket(tournament_id);

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
			backBtn.onclick = () => navigateTo("/menu");
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
	Winner?: string; // Backend uses capital W
	player1_score?: number;
	player2_score?: number;
	round_number: number;
};

// Variável global para armazenar o número de rodadas
let totalRounds: number = 0;
let chartPoints: any[] = [];

// Variable to track if tournament completion notification has been shown
let tournamentCompletionNotified = false;

// Function to check and notify tournament completion
async function checkAndNotifyTournamentCompletion(tournamentId: string) {
	try {
		const res = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
			headers: {
				Authorization: `Bearer ${getCookie("jwt")}`,
			},
		});

		if (!res.ok) {
			return;
		}

		const data = await res.json();
		const tournament = data.tournament;

		// If tournament is completed and we haven't notified yet
		if (
			tournament.status === "completed" &&
			!tournamentCompletionNotified
		) {
			tournamentCompletionNotified = true;

			// Show completion notification
			const notification = document.createElement("div");
			notification.innerHTML = `
				<div class="fixed top-4 right-4 bg-[#FFD700] text-[#001B26] px-6 py-4 rounded-lg border-2 border-[#4CF190] shadow-2xl z-50 animate-pulse">
					<div class="flex items-center">
						<span class="text-2xl mr-2">🏆</span>
						<div>
							<div class="font-bold text-lg">Tournament Completed!</div>
							<div class="text-sm">Check the results below</div>
						</div>
						<button id="closeNotification" class="ml-4 text-[#001B26] hover:text-red-600 font-bold text-xl">×</button>
					</div>
				</div>
			`;

			document.body.appendChild(notification);

			// Auto-remove notification after 8 seconds
			setTimeout(() => {
				if (notification.parentNode) {
					notification.parentNode.removeChild(notification);
				}
			}, 8000);

			// Manual close button
			const closeBtn = notification.querySelector("#closeNotification");
			if (closeBtn) {
				closeBtn.addEventListener("click", () => {
					if (notification.parentNode) {
						notification.parentNode.removeChild(notification);
					}
				});
			}
		}
	} catch (error) {
		console.error("Error checking tournament completion:", error);
	}
}

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

	// Fetch both upcoming and completed matches
	const [upcomingRes, completedRes] = await Promise.all([
		fetch(`${API_BASE_URL}/tournaments/${tournamentId}/matches`, {
			headers: { Authorization: `Bearer ${getCookie("jwt")}` },
		}),
		fetch(`${API_BASE_URL}/tournaments/${tournamentId}/matches/finished`, {
			headers: { Authorization: `Bearer ${getCookie("jwt")}` },
		}),
	]);

	let matches: Match[] = [];

	// Combine upcoming and completed matches
	if (upcomingRes.ok) {
		const upcomingData = await upcomingRes.json();
		if (upcomingData.matches) {
			matches.push(
				...upcomingData.matches.map((m: { round_number: any }) => ({
					...m,
					round_number: Number(m.round_number),
				}))
			);
		}
	}

	if (completedRes.ok) {
		const completedData = await completedRes.json();
		if (completedData.matches) {
			matches.push(
				...completedData.matches.map((m: { round_number: any }) => ({
					...m,
					round_number: Number(m.round_number),
				}))
			);
		}
	}

	// Sort matches by round number for consistent display
	matches.sort((a, b) => a.round_number - b.round_number);
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

	// Get tournament info
	const tournamentRes = await fetch(
		`${API_BASE_URL}/tournaments/${tournamentId}`,
		{
			headers: { Authorization: `Bearer ${getCookie("jwt")}` },
		}
	);
	const tournament = await tournamentRes.json();

	// Group matches by round and clean up the logic
	const rounds = groupBy(matches, "round_number");

	// Only use the rounds that actually exist in the matches
	const actualRounds = Object.keys(rounds)
		.map(Number)
		.sort((a, b) => a - b);

	// For display purposes, ensure we have all expected rounds up to totalRounds
	const expectedRounds = [...Array(totalRounds).keys()].map((i) => i + 1);

	// Use the maximum of actual rounds and expected rounds, but avoid duplicates
	const sortedRounds = Array.from(
		new Set([...actualRounds, ...expectedRounds])
	)
		.sort((a, b) => a - b)
		.filter((r) => r <= totalRounds);

	// Initialize empty arrays for rounds that don't have matches yet
	sortedRounds.forEach((r) => {
		if (!rounds[r]) rounds[r] = [];
	});

	// Generate chart points with the combined matches
	chartPoints = await generateChartPoints(matches);

	// Create tournament bracket with proper layout and connector lines
	const roundsCount = sortedRounds.length;
	// Create players map once for the entire tournament
	const playersMap = new Map<string, string>();
	for (const player of tournament.tournament.players || []) {
		// Ensure both the key and value are strings for consistent lookup
		const playerId = String(player.id);
		const playerName = player.username || player.name || "Unknown";
		playersMap.set(playerId, playerName);
	}
	let bracketHTML = `
		<div class="relative w-full min-h-screen bg-gradient-to-br from-gray-900 to-teal-900 rounded-lg border-2 border-green-500 shadow-2xl p-8 overflow-x-auto">
			<div class="flex justify-center items-center min-h-[700px] py-16">
				<div class="relative flex items-center justify-center" style="gap: 8rem;">
	`;

	for (let roundIndex = 0; roundIndex < roundsCount; roundIndex++) {
		const round = sortedRounds[roundIndex];
		const roundNumber = Number(round);
		let roundMatches = rounds[round] || [];

		// Check if this is the final round
		const isFinalRound = roundNumber === totalRounds;

		// For final round, don't create empty matches if none exist
		// Let the backend handle match creation
		if (isFinalRound && roundMatches.length === 0) {
			// Skip creating empty final matches - let the backend handle it
			continue;
		}

		// Calculate expected matches for this round
		const expectedMatchesInRound = Math.pow(2, totalRounds - roundNumber);
		const matchesInRound = Math.max(
			roundMatches.length,
			expectedMatchesInRound
		);

		// Perfect centering logic with normal spacing
		let verticalGap = "gap-8";
		let containerClasses = "flex flex-col items-center";

		if (roundsCount === 2) {
			// 4-player tournament: Semifinals and Final
			if (roundIndex === 0) {
				verticalGap = "gap-16"; // Space between semifinal matches
			} else {
				containerClasses = "flex items-center justify-center"; // Center final match perfectly
			}
		} else if (roundsCount === 3) {
			// 8-player tournament: Quarterfinals, Semifinals, Final
			if (roundIndex === 0) {
				verticalGap = "gap-8"; // Tight spacing for quarterfinals
			} else if (roundIndex === 1) {
				verticalGap = "gap-24"; // Wider spacing for semifinals
			} else {
				containerClasses = "flex items-center justify-center"; // Center final match perfectly
			}
		}

		// Get round styling
		const roundName = getRoundName(roundNumber, sortedRounds.length);
		const isSpecialRound =
			roundName === "Quarterfinals" ||
			roundName === "Semifinals" ||
			roundName === "Final";

		const headerClasses = isSpecialRound
			? "text-[#FFD700] border-[#4CF190] bg-[#001B26]"
			: "text-[#4CF190] border-[#4CF190] bg-[#001B26]";
		const textClasses = isSpecialRound
			? "text-[#FFD700]"
			: "text-[#4CF190]";

		bracketHTML += `
			<div class="flex flex-col items-center relative">
				<h3 class="${headerClasses} text-2xl font-bold mb-8 text-center uppercase tracking-wider py-4 px-8 border-2 rounded-xl shadow-2xl">
					${roundName}
				</h3>
				<div class="${containerClasses} ${verticalGap}">
		`;

		for (
			let matchIndex = 0;
			matchIndex < roundMatches.length;
			matchIndex++
		) {
			const match = roundMatches[matchIndex];

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

			// Convert player IDs to strings for consistent map lookup
			const player1 = playersMap?.get(String(rawPlayer1)) || rawPlayer1;
			const player2 = playersMap?.get(String(rawPlayer2)) || rawPlayer2;
			const isCompleted = match.match_state === "completed";
			const winnerId = match.Winner || match.winner; // Handle both backend variations
			const player1Score = match.player1_score ?? "";
			const player2Score = match.player2_score ?? "";

			// Fix winner determination - ensure we're comparing the right values
			const isPlayer1Winner =
				isCompleted && String(winnerId) === String(match.player1);
			const isPlayer2Winner =
				isCompleted && String(winnerId) === String(match.player2);

			const displayPlayer1 = player1 === "TBD" ? "TBD" : player1;
			const displayPlayer2 = player2 === "TBD" ? "TBD" : player2;

			const player1WinnerClasses = isPlayer1Winner
				? "bg-[#4CF190] text-[#001B26]"
				: "";
			const player2WinnerClasses = isPlayer2Winner
				? "bg-[#4CF190] text-[#001B26]"
				: "";

			bracketHTML += `
				<div class="relative group">
					<div class="bg-[#001B26] border-[#4CF190] border-2 p-4 w-52 min-h-[120px] flex flex-col justify-center relative transition-all duration-300 cursor-pointer hover:bg-[#002B36] hover:scale-[1.02] rounded-lg shadow-xl">
						<div class="bg-[#07303c] border-[#4CF190] border-2 px-3 py-2 mb-2 rounded ${player1WinnerClasses} transition-all duration-200">
							<div class="flex justify-between items-center">
								<span class="${
									isPlayer1Winner
										? "text-[#001B26]"
										: textClasses
								} font-bold text-sm">
									${truncate(displayPlayer1, 8)}
								</span>
								${
									isCompleted
										? `
									<span class="${
										isPlayer1Winner
											? "text-[#001B26]"
											: textClasses
									} font-bold text-lg">
										${player1Score}
									</span>
								`
										: ""
								}
							</div>
						</div>

						<div class="text-center ${textClasses} text-xs font-bold my-2 tracking-wider">VS</div>

						<div class="bg-[#07303c] border-[#4CF190] border-2 px-3 py-2 mt-2 rounded ${player2WinnerClasses} transition-all duration-200">
							<div class="flex justify-between items-center">
								<span class="${
									isPlayer2Winner
										? "text-[#001B26]"
										: textClasses
								} font-bold text-sm">
									${truncate(displayPlayer2, 8)}
								</span>
								${
									isCompleted
										? `
									<span class="${
										isPlayer2Winner
											? "text-[#001B26]"
											: textClasses
									} font-bold text-lg">
										${player2Score}
									</span>
								`
										: ""
								}
							</div>
						</div>
					</div>
				</div>
			`;
		}

		bracketHTML += `</div></div>`;

		// Add trophy after final round with retro/pixel art styling
		if (isFinalRound && roundMatches.length > 0) {
			// Find the champion - only show if tournament is actually completed
			let finalMatch = null;
			let championName = "TBD";
			let finalMatchScore = "";

			// Look for completed match in the final round ONLY
			finalMatch = roundMatches.find(
				(match) => match.match_state === "completed"
			);

			// Only determine champion if there's a completed final match
			if (finalMatch && finalMatch.match_state === "completed") {
				let winnerId = finalMatch.Winner || finalMatch.winner; // Handle both backend variations
				// If winner is not set but match is completed, determine winner from scores
				if (
					!winnerId &&
					finalMatch.player1_score !== undefined &&
					finalMatch.player2_score !== undefined
				) {
					if (finalMatch.player1_score > finalMatch.player2_score) {
						winnerId = finalMatch.player1;
					} else if (
						finalMatch.player2_score > finalMatch.player1_score
					) {
						winnerId = finalMatch.player2;
					}
				}

				if (winnerId) {
					// Convert winnerId to string to ensure proper map lookup
					const winnerIdStr = String(winnerId);
					let mappedName = playersMap.get(winnerIdStr);
					// If mapping failed, try to fetch user data directly
					if (!mappedName || mappedName === winnerIdStr) {
						try {
							const userRes = await fetch(
								`${API_BASE_URL}/users/${winnerIdStr}`,
								{
									headers: {
										Authorization: `Bearer ${getCookie(
											"jwt"
										)}`,
									},
								}
							);
							if (userRes.ok) {
								const userData = await userRes.json();
								mappedName =
									userData.user?.username ||
									userData.user?.name ||
									winnerIdStr;
							}
						} catch (error) {
							console.error("Error fetching user data:", error);
						}
					}

					championName = mappedName || winnerIdStr;
				}

				// Add score information for the final match
				if (
					finalMatch.player1_score !== undefined &&
					finalMatch.player2_score !== undefined
				) {
					const player1Name =
						playersMap?.get(String(finalMatch.player1)) ||
						finalMatch.player1;
					const player2Name =
						playersMap?.get(String(finalMatch.player2)) ||
						finalMatch.player2;
					finalMatchScore = `${truncate(player1Name, 12)} ${
						finalMatch.player1_score
					} - ${finalMatch.player2_score} ${truncate(
						player2Name,
						12
					)}`;
				}
			}

			// Determine if tournament is completed - only if final match is completed
			const isCompleted =
				finalMatch && finalMatch.match_state === "completed";
			const tournamentStatus = tournament.tournament?.status || "unknown";

			bracketHTML += `
				<div class="flex flex-col items-center justify-center ml-8">
					<!-- WINNER Label -->
					<div class="mb-4 px-4 py-2 bg-[#001B26] border-2 border-[#4CF190] rounded-lg shadow-xl">
						<span class="text-[#4CF190] font-bold text-lg tracking-wider uppercase">🏆 WINNER 🏆</span>
					</div>
					
					<div class="flex flex-col items-center">
						<img src="images/trophy.svg" class="w-24 h-24 filter drop-shadow-lg ${
							isCompleted
								? "brightness-110"
								: "opacity-50 grayscale"
						}" alt="trophy">
						
						<div class="mt-4 text-center">
							${
								isCompleted && championName !== "TBD"
									? `
								<div class="bg-[#4CF190] text-[#001B26] px-4 py-2 font-bold text-base border-2 border-[#FFD700] shadow-lg rounded-lg">
									${championName}
								</div>
							`
									: `
								<div class="mt-2 text-[#4CF190] font-medium text-sm">
									Awaiting Final
								</div>
							`
							}
						</div>
					</div>
				</div>
			`;
		}
	}

	bracketHTML += `</div></div></div>`;
	chartContainer.innerHTML = bracketHTML;
}

// Function to display tournament status information
async function displayTournamentInfo(tournamentId: string) {
	try {
		const res = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
			headers: {
				Authorization: `Bearer ${getCookie("jwt")}`,
			},
		});

		if (!res.ok) {
			return;
		}

		const data = await res.json();
		const tournament = data.tournament;

		// Check if info container already exists
		let infoContainer = document.getElementById("tournamentInfo");
		if (!infoContainer) {
			// Create tournament info container
			infoContainer = document.createElement("div");
			infoContainer.id = "tournamentInfo";
			infoContainer.className =
				"fixed top-20 left-1/2 transform -translate-x-1/2 z-40";

			// Insert after the back button
			const tournamentContainer =
				document.querySelector("#bracketContainer");
			if (tournamentContainer && tournamentContainer.parentNode) {
				tournamentContainer.parentNode.insertBefore(
					infoContainer,
					tournamentContainer
				);
			}
		}

		// Determine status color and text
		let statusClass = "";
		let statusText = "";
		let statusIcon = "";

		switch (tournament.status) {
			case "completed":
				statusClass = "bg-[#FFD700] text-[#001B26] border-[#4CF190]";
				statusText = "COMPLETED";
				statusIcon = "🏆";
				break;
			case "ongoing":
				statusClass = "bg-[#4CF190] text-[#001B26] border-[#FFD700]";
				statusText = "IN PROGRESS";
				statusIcon = "⚔️";
				break;
			default:
				// Don't show status for upcoming tournaments - just show tournament info
				statusClass = "hidden";
				statusText = "";
				statusIcon = "";
				break;
		}

		infoContainer.innerHTML = `
			<div class="bg-[#001B26] border-2 border-[#4CF190] rounded-lg px-6 py-3 shadow-2xl">
				<div class="flex items-center justify-center space-x-4">
					<div class="text-[#4CF190] font-bold text-xl">${tournament.name}</div>
					${
						statusText
							? `
						<div class="${statusClass} px-3 py-1 rounded font-bold text-sm border-2">
							${statusIcon} ${statusText}
						</div>
					`
							: ""
					}
					<div class="text-[#4CF190] text-sm">
						Round ${tournament.current_round || 1} | ${tournament.PLAYER_COUNT}/${
			tournament.max_players
		} Players
					</div>
				</div>
			</div>
		`;
	} catch (error) {
		console.error("Error displaying tournament info:", error);
	}
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

function truncate(name: string, maxLength = 15): string {
	if (!name || name === "TBD") return name;
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
	navigateTo("/play");
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
		// Update tournament info at the top
		await displayTournamentInfo(tournamentId);

		await renderBracket(tournamentId);

		// Check for tournament completion and notify if needed
		await checkAndNotifyTournamentCompletion(tournamentId);

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

// Function to be called when returning from a game to force refresh
export function forceRefreshTournament(tournamentId: string) {
	// Clear any cached data or flags
	tournamentCompletionNotified = false;

	// Immediately refresh the bracket
	refreshBracket(tournamentId);
}

// Export for use by other modules
export { refreshBracket };
