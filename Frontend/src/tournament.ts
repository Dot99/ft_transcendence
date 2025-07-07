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
  const chartContainer = getElement<HTMLDivElement>("bracketContainer");
  console.log("chartContainer:", chartContainer);
  if (!chartContainer) return;

  // Fetch tournament details to get max_players
  const tournamentRes = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
    headers: { Authorization: `Bearer ${getCookie("jwt")}` },
  });

  if (!tournamentRes.ok) {
    console.error("Error fetching tournament details:", await tournamentRes.text());
    return;
  }

  const tournament = await tournamentRes.json();
  const maxPlayers = tournament.tournament.max_players;

  // Render initial bracket layout
  chartContainer.innerHTML = createBracketLayout(maxPlayers);

  // Fetch matches
  const res = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/matches`, {
    headers: { Authorization: `Bearer ${getCookie("jwt")}` },
  });

  if (!res.ok) {
    console.error("Error searching matches:", await res.text());
    return;
  }

  const games = await res.json();
  const matches = games.matches as Match[];

  if (!matches || matches.length === 0) {
    console.warn("No matches found for tournament:", tournamentId);
    return;
  }

  const chartPoints = await generateChartPoints(matches);
  // Update bracket with actual match data
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
  const chartContainer = document.getElementById("bracketContainer");
  if (!chartContainer) return;

  // Group matches by round for better organization
  const rounds = groupBy(matches, "round_number");
  const sortedRounds = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  // Ensure the final round is always displayed
  const totalRounds = Math.log2(chartPoints.length * 2);
  if (!sortedRounds.includes(totalRounds)) {
    sortedRounds.push(totalRounds);
  }

  // Create bracket HTML with proper grid layout
  let bracketHTML = `
    <div class="bracket-container" style="
      display: flex;
      align-items: center;
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

  for (let roundIndex = 0; roundIndex < sortedRounds.length; roundIndex++) {
    const round = sortedRounds[roundIndex];
    const roundMatches = rounds[round] || []; // Handle empty rounds
    const roundNumber = Number(round);

    const verticalSpacing = Math.max(15, 40 * Math.pow(1.6, roundIndex));

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

    for (let matchIndex = 0; matchIndex < Math.max(roundMatches.length, 1); matchIndex++) {
      const match = roundMatches[matchIndex] || {}; // Handle empty matches
      const chartPoint = chartPoints.find(
        (point) => point.id === `r${round}_m${matchIndex}`
      );

      const player1 = chartPoint?.label?.text.split("\n")[0] || match.player1 || "TBD";
      const player2 = chartPoint?.label?.text.split("\n")[2] || match.player2 || "TBD";
      const scheduledTime = match?.scheduled_date
        ? new Date(match.scheduled_date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      bracketHTML += `
        <div class="match-card" data-round="${roundIndex + 1}" data-match="${matchIndex}" style="
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
        ">
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
            scheduledTime
              ? `
            <div style="
              color: #83B7C4;
              font-size: 10px;
              text-align: center;
              margin-top: auto;
              padding: 4px;
              border-top: 1px solid rgba(76, 241, 144, 0.2);
            ">
              🕒 ${scheduledTime}
            </div>
          `
              : ""
          }
        </div>
      `;

      // Add connector lines to the next round
      if (roundIndex < sortedRounds.length - 1) {
        const nextRoundIndex = roundIndex + 1;
        const nextMatchIndex = Math.floor(matchIndex / 2);
        bracketHTML += `
          <div class="connector-line" style="
            width: 2px;
            height: ${verticalSpacing}px;
            background: #4CF190;
            position: absolute;
            left: 50%;
            bottom: 0;
            transform: translateX(-50%);
          "></div>
          <div class="horizontal-line" style="
            width: ${nextRoundIndex === sortedRounds.length - 1 ? 100 : 50}px;
            height: 2px;
            background: #4CF190;
            position: absolute;
            left: 50%;
            bottom: -${verticalSpacing}px;
            transform: translateX(${nextRoundIndex === sortedRounds.length - 1 ? '-50%' : '0%'});
          "></div>
        `;
      }
    }

    bracketHTML += "</div></div>"; // Close matches-container and round-column
  }

  bracketHTML += "</div>";

  chartContainer.innerHTML = bracketHTML;
}

function createBracketLayout(maxPlayers: number): string {
  const totalRounds = Math.log2(maxPlayers); // Número de rodadas
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

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
    const matchesInRound = maxPlayers / Math.pow(2, roundIndex + 1); // Número de partidas na rodada
    const verticalSpacing = Math.max(15, 40 * Math.pow(1.6, roundIndex)); // Espaçamento vertical

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
          ${getRoundName(roundIndex + 1, totalRounds)}
        </h3>
        
        <div class="matches-container" style="
          display: flex;
          flex-direction: column;
          gap: ${verticalSpacing}px;
          align-items: center;
        ">
    `;

    for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
      bracketHTML += `
        <div class="match-card" data-round="${roundIndex + 1}" data-match="${matchIndex}" style="
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
        ">
          <div class="player" style="
            background: rgba(76, 241, 144, 0.1);
            border-radius: 6px;
            padding: 8px 10px;
            margin-bottom: 4px;
            border-left: 3px solid #4CF190;
          ">
            <span style="color: #4CF190; font-weight: bold; font-size: 12px;">
              TBD
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
