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
  player1: string;
  player2: string;
  scheduled_date: string;
  round_number: string;
};

async function renderBracket(tournamentId: string) {
  const chartContainer = document.getElementById("bracketContainer");
  if (!chartContainer) return;

  chartContainer.innerHTML = `<div id="bracketChart" style="width:100%; height:700px;"></div>`;

  const res = await fetch(
    `${API_BASE_URL}/tournaments/${tournamentId}/matches`,
    {
      headers: { Authorization: `Bearer ${getCookie("jwt")}` },
    }
  );

  if (!res.ok) {
    console.error("Error searching matches:", await res.text());
    return;
  }

  const games = await res.json();

  const matches = games.matches as Match[];
  console.log("Matches fetched:", matches);
  if (!matches || matches.length === 0) {
    console.warn("No matches found for tournament:", tournamentId);
    return;
  }
  const chartPoints = await generateChartPoints(matches);

  console.log("Chart points:", chartPoints);

  // Create custom bracket HTML instead of using JSC chart
  createCustomBracket(chartPoints, matches);
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

      // Buscar dados dos jogadores
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
          text: `${player1Data.user.username}\nvs\n${
            player2Data.user.username
          }\n${new Date(match.scheduled_date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
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

function createCustomBracket(chartPoints: any[], matches: Match[]) {
  const chartContainer = document.getElementById("bracketChart");
  if (!chartContainer) return;

  // Group matches by round for better organization
  const rounds = groupBy(matches, "round_number");
  const sortedRounds = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  // Calculate total height needed for proper spacing
  const baseHeight = 120;
  const baseSpacing = 40;

  // Create bracket HTML with proper grid layout
  let bracketHTML = `
    <div class="bracket-container" style="
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: 60px;
      padding: 20px;
      overflow-x: auto;
      overflow-y: auto;
      min-height: 100vh;
      max-height: 100vh;
      background: linear-gradient(135deg, #001B26 0%, #083744 100%);
      border-radius: 12px;
      border: 2px solid #4CF190;
      position: relative;
    ">
  `;

  // Create each round column with proper positioning
  for (let roundIndex = 0; roundIndex < sortedRounds.length; roundIndex++) {
    const round = sortedRounds[roundIndex];
    const roundMatches = rounds[round];
    const roundNumber = Number(round);

    // Calculate spacing for this round (more compact for 16 players)
    const verticalSpacing = Math.max(
      15,
      baseSpacing * Math.pow(1.6, roundIndex)
    );

    bracketHTML += `
      <div class="round-column" style=" 
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        min-width: 200px;
        flex-shrink: 0;
      ">
        <h3 style="
          color: #4CF190;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 15px;
          text-align: center;
          text-shadow: 0 0 8px rgba(76, 241, 144, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 6px 12px;
          background: rgba(76, 241, 144, 0.1);
          border-radius: 15px;
          border: 1px solid rgba(76, 241, 144, 0.3);
        ">
          ${getRoundName(roundNumber, sortedRounds.length)}
        </h3>
        
        <div class="matches-container" style="
          display: flex;
          flex-direction: column;
          gap: ${verticalSpacing}px;
          align-items: center;
        ">
    `;

    // Add matches for this round
    for (let i = 0; i < roundMatches.length; i++) {
      const match = roundMatches[i];

      // Find correct match data based on round and index
      const matchData = chartPoints.find(
        (point) => point.id === `r${round}_m${i}`
      );

      // Parse player names from the label text
      const labelText = matchData?.label?.text || "";
      const lines = labelText.split("\n");
      const player1 = lines[0] || "TBD";
      const player2 = lines[2] || "TBD";
      const time = lines[3] || "";

      bracketHTML += `
        <div class="match-card" data-round="${round}" data-match="${i}" style="
          background: linear-gradient(145deg, #083744, #0a3e4c);
          border: 2px solid #4CF190;
          border-radius: 15px;
          padding: 12px;
          width: 180px;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4), 
                      0 0 25px rgba(76, 241, 144, 0.15),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          backdrop-filter: blur(10px);
        " 
        onmouseover="this.style.transform='translateY(-8px) scale(1.02)'; this.style.boxShadow='0 15px 30px rgba(0, 0, 0, 0.5), 0 0 40px rgba(76, 241, 144, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';"
        onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 10px 20px rgba(0, 0, 0, 0.4), 0 0 25px rgba(76, 241, 144, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)';">
          
          <div class="player" style="
            background: rgba(76, 241, 144, 0.1);
            border-radius: 6px;
            padding: 8px 10px;
            margin-bottom: 4px;
            border-left: 3px solid #4CF190;
          ">
            <span style="color: #4CF190; font-weight: bold; font-size: 12px;">
              ${truncate(player1, 15)}
            </span>
          </div>
          
          <div style="
            text-align: center;
            color: #4CF190;
            font-size: 10px;
            font-weight: bold;
            margin: 3px 0;
            text-shadow: 0 0 5px rgba(76, 241, 144, 0.6);
          ">VS</div>
          
          <div class="player" style="
            background: rgba(76, 241, 144, 0.1);
            border-radius: 6px;
            padding: 8px 10px;
            margin-bottom: 6px;
            border-left: 3px solid #4CF190;
          ">
            <span style="color: #4CF190; font-weight: bold; font-size: 12px;">
              ${truncate(player2, 15)}
            </span>
          </div>
          
          ${
            time
              ? `
            <div style="
              color: #83B7C4;
              font-size: 10px;
              text-align: center;
              margin-top: auto;
              padding: 4px;
              border-top: 1px solid rgba(76, 241, 144, 0.2);
            ">
              🕒 ${time}
            </div>
          `
              : ""
          }
        </div>
      `;
    }

    bracketHTML += "</div></div>"; // Close matches-container and round-column
  }

  bracketHTML += "</div>";

  chartContainer.innerHTML = bracketHTML;
}

function getRoundName(roundNumber: number, totalRounds: number): string {
  if (roundNumber === totalRounds) return "🏆 FINAL";
  if (roundNumber === totalRounds - 1) return "🥉 SEMI-FINAL";
  if (roundNumber === totalRounds - 2 && totalRounds > 3)
    return "🏅 QUARTER-FINAL";
  if (roundNumber === totalRounds - 3 && totalRounds > 4)
    return "🎯 ROUND OF 16";
  if (roundNumber === totalRounds - 4 && totalRounds > 5)
    return "⚡ ROUND OF 32";
  return `🎮 ROUND ${roundNumber}`;
}
