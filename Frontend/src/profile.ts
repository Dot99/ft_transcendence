import { loadHomePage } from './index.js';
import { profileTemplate } from './templates/profileTemplate.js';

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

const handleCancelDelete = (): void => {
    closeDeleteModal();
};

const handleConfirmDelete = async (): Promise<void> => {
    try {
        const response = await fetch('/api/user/delete', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
            },
        });
        if (response.ok) {
            localStorage.removeItem('jwt');
            loadHomePage()
        } else {
            throw new Error('Failed to delete account');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account. Please try again.');
    }
};

const handleFriendsClick = (): void => {
    console.log("FRIENDS")
    //navigateTo('/friends');
};

// UI Functions
export const loadProfilePage = (): void => {
  const app = getElement<HTMLElement>('app');
  app.innerHTML = profileTemplate;
  loadDashboardData();
};

function getUserIdFromToken(): number | null {
    const token = localStorage.getItem('jwt');
    console.log("Token:", token);
    if (!token) return null;

    try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        console.log("Decoded Payload:", decodedPayload);
        return decodedPayload.id || null;
    } catch (e) {
        console.error('Invalid token:', e);
        return null;
    }
}

const getOpponentId = (match: Match, userId: number): number => {
  return match.player1 === userId ? match.player2 : match.player1;
};

async function loadDashboardData(): Promise<void> {
  const userId = getUserIdFromToken();

  console.log("Token (User ID):", userId);
  if (!userId) {
    console.error("User ID not found. Probably not logged in.");
    return;
  }
  const userRes = await fetch(`/api/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
    }
  });
  const userData = await userRes.json();
  const user: User = userData.user;

  getElement<HTMLHeadingElement>('username').textContent = `@${user.username}`;
  getElement<HTMLHeadingElement>('name').textContent = user.name;
  getElement<HTMLDivElement>('email').textContent = user.email;
  if (user.pfp) getElement<HTMLImageElement>('pfp').src = `/images/${user.pfp}`;
  getElement<HTMLSpanElement>('hoursPlayed').textContent = (user.total_play_time / 3600).toFixed(2);

  const statsRes = await fetch(`/api/users/${userId}/stats`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
    }
  });
  const statsData = await statsRes.json();
  const stats: Stats = statsData.stats;

  getElement<HTMLDivElement>('totalMatches').textContent = stats.total_matches.toString();
  getElement<HTMLDivElement>('matchesWon').textContent = stats.matches_won.toString();
  getElement<HTMLDivElement>('matchesLost').textContent = stats.matches_lost.toString();
  getElement<HTMLDivElement>('avgScore').textContent = stats.average_score.toString();
  getElement<HTMLDivElement>('winStreak').textContent = stats.win_streak_max.toString();
  getElement<HTMLDivElement>('tournaments').textContent = stats.tournaments_won.toString();
  getElement<HTMLDivElement>('leaderboard').textContent = stats.leaderboard_position.toString();

  await loadRecentMatches(userId);
  await loadPastTournaments(userId, stats.current_tournament);
}

async function loadRecentMatches(userId: number): Promise<void> {
  const res = await fetch(`/api/games/users/${userId}/recent`);
  const data = await res.json();
  const container = getElement<HTMLDivElement>('matchTableBody');
  container.innerHTML = '';

  for (const match of data.games as Match[]) {
    const [p1, p2] = await Promise.all([
      fetch(`/api/users/${match.player1}`).then(res => res.json()),
      fetch(`/api/users/${match.player2}`).then(res => res.json())
    ]);

    const date = new Date(match.match_date).toLocaleString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).replace(',', '');

    let winner = '-';
    if (match.winner) {
      const winnerRes = await fetch(`/api/users/${match.winner}`);
      winner = (await winnerRes.json()).user.username;
    }

    const div = document.createElement('div');
    div.className = 'match-entry flex justify-between items-center p-2 border-b border-green-500';
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

async function loadPastTournaments(userId: number, currentTournamentId: number): Promise<void> {
  const res = await fetch(`/api/tournaments/users/${userId}/past`);
  const data = await res.json();
  const container = getElement<HTMLDivElement>('tournamentTableBody');
  container.innerHTML = '';

  console.log(data.tournaments);
  for (const t of data.tournaments as Tournament[]) {
    const positionRes = await fetch(`/api/tournaments/${t.tournament_id}/players/${userId}`);
    const positionData = await positionRes.json();
    const date = new Date(t.tournament_date).toLocaleString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).replace(',', '');

    const player = positionData.players?.find((p: any) => p.player_id === userId);
    const div = document.createElement('div');
    div.className = 'p-2 border border-green-500 rounded';
    div.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="text-green-300 font-semibold">${t.tournament_name}</span>
        <span class="text-sm text-gray-400">${date}</span>
      </div>
      <div class="text-sm text-yellow-400">Position: ${player?.current_position ?? '-'}</div>`;

    container.appendChild(div);
    await loadUpComingMatchesById(t.tournament_id, userId);
  }

  const tournamentRes = await fetch(`/api/tournaments/${currentTournamentId}`);
  const tournamentData = await tournamentRes.json();
  const positionRes = await fetch(`/api/tournaments/${currentTournamentId}/players/${userId}`);
  const positionData = await positionRes.json();
  const player = positionData.players.find((p: any) => p.player_id === userId);

  getElement<HTMLSpanElement>('currTournamentName').textContent = tournamentData.tournament.name;
  getElement<HTMLSpanElement>('currTournamentPosition').textContent = player?.current_position ?? '-';
}

async function loadUpComingMatchesById(tournamentId: number, userId: number): Promise<void> {
  const [tournamentRes, matchesRes] = await Promise.all([
    fetch(`/api/tournaments/${tournamentId}`),
    fetch(`/api/tournaments/${tournamentId}/matches`)
  ]);
  const tournament = await tournamentRes.json();
  const data = await matchesRes.json();

  const container = getElement<HTMLDivElement>('upcomingMatches');
  container.innerHTML = '';

  for (const match of data.matches as Match[]) {
    const opponentId = getOpponentId(match, userId);
    const opponentData = await fetch(`/api/users/${opponentId}`).then(res => res.json());
    const date = new Date(match.scheduled_date).toLocaleString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).replace(',', '');

    const div = document.createElement('div');
    div.className = 'p-2 border border-green-500 rounded';
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
  getElement<HTMLDivElement>('deleteModal').style.display = 'flex';
}

function closeDeleteModal(): void {
  getElement<HTMLDivElement>('deleteModal').style.display = 'none';
}

function confirmDelete(): void {
  closeDeleteModal();
  alert('Your account has been deleted');
  // navigateTo('/');
}

(window as any).loadProfilePage = loadProfilePage;
