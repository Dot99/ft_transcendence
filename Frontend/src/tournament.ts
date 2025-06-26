import { tournamentTemplate } from "./templates/tournamentTemplate.js";
import { getCookie, getUserIdFromToken } from "./utils/auth.js";
declare const JSC: any;

const API_BASE_URL = "http://localhost:3000/api";

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
  console.log("Tournaments fetched:", tournaments);
  console.log("test");
  list.innerHTML = `
    <div class="border border-[#4CF190] p-4 rounded hover:bg-[#0a3e4c] transition cursor-pointer" onclick="joinTournament(${tournaments.tournament.id})">
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
  round_number: number;
  player1: string;
  player2: string;
  scheduled_date: string;
};

async function renderBracket(tournamentId: string) {
  const chartContainer = document.getElementById("bracketContainer");
  if (!chartContainer) return;

  chartContainer.innerHTML = `<div id="bracketChart" style="width:100%; height:700px;"></div>`;

  const res = await fetch(
    `${API_BASE_URL}/tournaments/${tournamentId}/matches`,
    {
      headers: {
        Authorization: `Bearer ${getCookie("jwt")}`,
      },
    }
  );

  if (!res.ok) {
    console.error("Erro ao buscar partidas:", await res.text());
    return;
  }

  const games = await res.json();
  const matches = games.matches as Match[];
  matches.forEach((match, index) => {
    const matchId = `match_${match.round_number}_${index}`;
    const parentId =
      match.round_number > 1
        ? `match_${match.round_number - 1}_${Math.floor(index / 2)}`
        : undefined;

    chartPoints.push({
      id: matchId,
      name: `${match.player1} vs ${match.player2}`,
      label: {
        text: `${match.player1} vs ${match.player2}\n${new Date(
          match.scheduled_date
        ).toLocaleTimeString()}`,
      },
      parent: parentId,
    });
  });

  const chartPoints = generateChartPoints(matches);

  JSC.chart("bracketChart", {
    type: "organizational",
    series: [{ points: chartPoints }],
    defaultSeries: {
      mouseTracking: false,
      color: "#4CF190",
      shape: {
        label: {
          style: {
            fontSize: "12px",
            color: "#001B26",
            fontWeight: "bold",
          },
        },
      },
    },
    defaultPoint: {
      connectorLine: {
        color: "#4CF190",
      },
    },
    chartArea: {
      fill: "#001B26",
    },
  });
}

function generateChartPoints(matches: Match[]) {
  const rounds = groupBy(matches, "round_number");
  const chartPoints: any[] = [];
  const matchIdsByRound: Record<number, string[]> = {};

  Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((round) => {
      const roundMatches = rounds[round];
      matchIdsByRound[round] = [];

      roundMatches.forEach((match, index) => {
        const matchId = `r${round}_m${index}`;
        matchIdsByRound[round].push(matchId);

        const parentRound = matchIdsByRound[round - 1];
        const parentId =
          round > 1 && parentRound
            ? parentRound[Math.floor(index / 2)] // Liga aos jogos da ronda anterior
            : undefined;

        chartPoints.push({
          id: matchId,
          name: `${match.player1} vs ${match.player2}`,
          label: {
            text: `${match.player1} vs ${match.player2}\n${new Date(
              match.scheduled_date
            ).toLocaleTimeString()}`,
          },
          ...(parentId && { parent: parentId }),
        });
      });
    });

  return chartPoints;
}
