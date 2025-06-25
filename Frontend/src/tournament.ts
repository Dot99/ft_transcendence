import { tournamentTemplate } from "./templates/tournamentTemplate.js";
import { getCookie, getUserIdFromToken } from "./utils/auth.js";
const API_BASE_URL = "http://localhost:3000/api";

// Utility function to get an element by ID with type safety
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

  // Aqui podes buscar os torneios da API
  const res = await fetch(`${API_BASE_URL}/tournaments/${tournament_id}`);
  const tournaments = await res.json();
  const list = getElement<HTMLDivElement>("tournamentList");
  list.innerHTML = tournaments
    .map(
      (t: any) => `
    <div class="border border-[#4CF190] p-4 rounded hover:bg-[#0a3e4c] transition cursor-pointer" onclick="joinTournament(${t.id})">
      <h3 class="text-xl font-semibold">${t.name}</h3>
      <p class="text-sm">Players: ${t.currentPlayers}/${t.maxPlayers}</p>
    </div>
  `
    )
    .join("");
  const tournamentId = getCookie("tournamentId");
  if (tournamentId) {
    renderBracket(tournamentId);
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

async function renderBracket(tournamentId: string) {
  const container = document.getElementById("bracketContainer");
  if (!container) return;

  const res = await fetch(`${API_BASE_URL}/tournament/${tournamentId}/games`);
  const games = await res.json();

  const rounds = groupBy(games, "round");
  const numRounds = Object.keys(rounds).length;

  for (let i = 1; i <= numRounds; i++) {
    const roundDiv = document.createElement("div");
    roundDiv.className = "flex flex-col gap-6";

    for (const game of rounds[i]) {
      const gameDiv = document.createElement("div");
      gameDiv.className =
        "border border-[#4CF190] rounded p-4 text-white w-40 text-center bg-[#07303c]";
      gameDiv.innerHTML = `
        <div>${game.round.player1}</div>
        <div class="text-xs text-[#EFD671]">vs</div>
        <div>${game.round.player2}</div>
        <div class="text-xs mt-2">${new Date(
          game.round.startTime
        ).toLocaleTimeString()}</div>
      `;
      roundDiv.appendChild(gameDiv);
    }

    container.appendChild(roundDiv);
  }
}
