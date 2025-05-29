function loadProfilePage() {
	const app = document.getElementById("app");
	app.innerHTML = `
        <div id="deleteModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        Delete Account
      </div>
      <div class="text-gray-200 mb-4">
        Are you sure you want to delete your account? This action cannot be undone.
      </div>
      <div class="modal-buttons">
        <button class="modal-btn" onclick="closeDeleteModal()">CANCEL</button>
        <button class="modal-btn" onclick="confirmDelete()">DELETE</button>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto">
    <!-- Main Profile Card -->
    <div class="retro-border p-6 mb-6">
      <div class="profile-section">
        <!-- Left side - Avatar -->
        <div class="profile-left">
          <div class="avatar-container">
            <img id="pfp" src="" alt="Avatar" />
          </div>
        </div>

        <!-- Middle - User info -->
        <div class="profile-info">
          <h1 id="name" class="profile-name">Power Guido</h1>
          <h2 id="username" class="profile-username">@powerguido</h2>
          <div class="profile-details">
            <div id="email" class="profile-email">powerguido@gmail.com</div>
            <div class="profile-country">
              <img id="flag" src="" alt="Flag" class="w-6 h-5 rounded-sm border border-green-400" />
              <span id="country" class="text-sm text-gray-400">PT</span>
            </div>
          </div>
        </div>

        <!-- Time Played Section -->
        <div class="time-played-section">
          <div class="hours-played">
            <span id="hoursPlayed"></span>
            <span class="text-sm">hours played</span>
          </div>
          <a onclick="window.location.href='/friends'" class="friends-btn">FRIENDS</a>
        </div>

        <!-- Delete and Arcade Section -->
        <div class="delete-arcade-section">
          <button class="delete-btn">DELETE ACCOUNT</button>
          <img src="images/arcade.svg" alt="Arcade" class="arcade-image" />
        </div>
      </div>
    </div>

    <!-- Performance Overview -->
    <div class="retro-border p-6 mb-6">
      <div class="section-header">
        <h2 class="text-xl font-bold">Performance Overview</h2>
      </div>
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div class="stat-box p-4">
          <div class="text-gray-400 text-sm mb-2">Matches</div>
          <div id="totalMatches" class="text-2xl retro-text"></div>
        </div>
        <div class="stat-box p-4">
          <div class="text-gray-400 text-sm mb-2">Wins</div>
          <div id="matchesWon" class="text-2xl retro-text"></div>
        </div>
        <div class="stat-box p-4">
          <div class="text-gray-400 text-sm mb-2">Losses</div>
          <div id="matchesLost" class="text-2xl retro-text"></div>
        </div>
        <div class="stat-box p-4">
          <div class="text-gray-400 text-sm mb-2">Avg Score</div>
          <div id="avgScore" class="text-2xl retro-text"></div>
        </div>
        <div class="stat-box p-4">
          <div class="text-gray-400 text-sm mb-2">Win Streak</div>
          <div id="winStreak" class="text-2xl retro-text"></div>
        </div>
        <div class="stat-box p-4">
          <div class="text-gray-400 text-sm mb-2">Tournaments Won</div>
          <div id="tournaments" class="text-2xl retro-text"></div>
        </div>        
      </div>
      <div class="gold-box p-4 text-center gold-border">
        <div class="text-gray-400 text-sm mb-2">🏆 Leaderboard Rank</div>
        <div id="leaderboard" class="text-3xl gold-text"></div>
      </div>
    </div>

    <!-- Split View -->
    <div class="split-view">
      <!-- LEFT column -->
      <div class="left-column space-y-6">
        
        <!-- Recent Matches -->
        <div class="retro-border p-6">
          <div class="section-header">
            <h2 class="text-xl font-bold">Recent Matches</h2>
          </div>
          <div class="matches-container scrollable-container" id="matchTableBody">
            <!-- Match entries populated by JS -->
          </div>
        </div>

        <!-- Past Tournaments -->
        <div class="retro-border p-6">
          <div class="section-header">
            <h2 class="text-xl font-bold">Past Tournaments</h2>
          </div>
          <div class="space-y-2 scrollable-container" id="tournamentTableBody">
            <!-- Past tournaments populated by JS -->
          </div>
        </div>

      </div>

      <!-- RIGHT column -->
      <div class="right-column space-y-6">
        
        <!-- Upcoming Matches -->
        <div class="retro-border p-6">
          <div class="section-header">
            <h2 class="text-xl font-bold">Upcoming Matches</h2>
          </div>
          <div id="upcomingMatches" class="space-y-2 scrollable-container">
            <!-- Upcoming matches populated by JS -->
          </div>
        </div>

        <!-- Current Tournament -->
        <div class="retro-border p-6">
          <div class="section-header">
            <h2 class="text-xl font-bold">Current Tournament</h2>
          </div>
          <div class="tournament-header">
            <div id="currTournamentName" class="tournament-name"></div>
            <div class="text-sm text-gray-400">Position: <span id="currTournamentPosition" class="gold-text"></span></div>
          </div>
          <div id="currTournamentMatches" class="space-y-2 scrollable-container">
            <!-- Tournament matches populated by JS -->
          </div>
        </div>

      </div>
    </div>
    `;

	// Close modal when clicking outside
	// window.onclick = function (event) {
	// 	const modal = document.getElementById("deleteModal");
	// 	if (event.target === modal) {
	// 		closeDeleteModal();
	// 	}
	// };

	// Load dashboard data
	loadDashboardData();
}

async function loadDashboardData() {
	// Fetch user data and populate the profile page
	const userId = 1; // Replace with dynamic user ID
	const userRes = await fetch(`/api/users/${userId}`);
	const userData = await userRes.json();

	// Update profile info
	document.getElementById(
		"username"
	).textContent = `@${userData.user.username}`;
	document.getElementById("country").textContent = userData.user.country;
	const countryCode = userData.user.country.toLowerCase();
	document.getElementById(
		"flag"
	).src = `https://flagcdn.com/w40/${countryCode}.png`;
	document.getElementById("name").textContent = userData.user.name;
	document.getElementById("email").textContent = userData.user.email;
	if (userData.user.pfp) {
		document.getElementById("pfp").src = `/images/${userData.user.pfp}`;
	}

	// Update stats
	const statsRes = await fetch(`/api/users/${userId}/stats`);
	const statsData = await statsRes.json();
  console.log("statsData", statsData);
	document.getElementById("totalMatches").textContent =
		statsData.stats.total_matches;
	document.getElementById("matchesWon").textContent =
		statsData.stats.matches_won;
	document.getElementById("matchesLost").textContent =
		statsData.stats.matches_lost;
	document.getElementById("avgScore").textContent =
		statsData.stats.average_score;
	document.getElementById("winStreak").textContent =
		statsData.stats.win_streak_max;
	document.getElementById("tournaments").textContent =
		statsData.stats.tournaments_won;
	document.getElementById("leaderboard").textContent =
		statsData.stats.leaderboard_position;
	document.getElementById("hoursPlayed").textContent = (
		userData.user.total_play_time / 3600
	).toFixed(2);


	const recentMatch = await fetch(`/api/games/users/${userId}/recent`);
  const recentMatchData = await recentMatch.json();

  const container = document.getElementById("matchTableBody");
  container.innerHTML = "";
  
  for (const match of recentMatchData.games) {
    const player1Res = await fetch(`/api/users/${match.player1}`);
    const player1Data = await player1Res.json();
    const player1Name = player1Data.user.username;
  
    const player2Res = await fetch(`/api/users/${match.player2}`);
    const player2Data = await player2Res.json();
    const player2Name = player2Data.user.username;
    const matchDate = new Date(match.match_date);
    const formattedDate = matchDate
    .toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", "");
    
    let winnerName = "-";
    if (match.winner) {
      const winnerRes = await fetch(`/api/users/${match.winner}`);
      const winnerData = await winnerRes.json();
      winnerName = winnerData.user.username;
    }
  
    const matchElement = document.createElement("div");
    matchElement.className = "match-entry flex justify-between items-center p-2 border-b border-green-500";  
  
    matchElement.innerHTML = `
      <div>
        <div class="font-bold text-green-400">${formattedDate}</div>
        <div class="text-sm text-gray-400">
          ${player1Name} vs ${player2Name}
        </div>
      </div>
      <div class="text-right">
        <div class="text-sm text-green-400">
          Score: ${match.player1_score} - ${match.player2_score}
        </div>
        <div class="text-sm text-yellow-400">
          Winner: ${winnerName}
        </div>
      </div>
    `;
  
    container.appendChild(matchElement);
    await loadPastTournaments(userId);
  };
}

async function loadUpComingMatchesById(tournamentId) {
  const res = await fetch(`/api/tournaments/${tournamentId}/matches`);
  const data = await res.json();
  console.log("UpComingMatches Data:", data);
  const container = document.getElementById("upcomingMatches");
  container.innerHTML = "";

  data.tournaments.forEach(tournament => {
    const date = new Date(tournament.tournament_date);
    const formattedDate = date
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
        <span class="text-green-300 font-semibold">${tournament.tournament_name}</span>
        <span class="text-sm text-gray-400">${formattedDate}</span>
      </div>
      <div class="text-sm text-yellow-400">Position: ${tournament.current_position}</div>
    `;

    container.appendChild(div);
  });
}

async function loadPastTournaments(userId) {
  const res = await fetch(`/api/tournaments/users/${userId}/past`);
  const data = await res.json();
  const container = document.getElementById("tournamentTableBody");
  container.innerHTML = "";
  
  data.tournaments.forEach(tournament => {
    const date = new Date(tournament.tournament_date);
    const formattedDate = date
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
    console.log("Tournament:", tournament);
    div.innerHTML = `
    <div class="flex justify-between items-center">
    <span class="text-green-300 font-semibold">${tournament.tournament_name}</span>
    <span class="text-sm text-gray-400">${formattedDate}</span>
    </div>
    <div class="text-sm text-yellow-400">Position: ${tournament.current_position}</div>
    `;
    
    container.appendChild(div);
  });
  for (const tournament of data.tournaments) {
  await loadUpComingMatchesById(tournament.tournament_id);
  }

}

function showDeleteModal() {
	document.getElementById("deleteModal").style.display = "flex";
}

function closeDeleteModal() {
	document.getElementById("deleteModal").style.display = "none";
}

function confirmDelete() {
	// Add account deletion logic here
	console.log("Account deletion confirmed");
	closeDeleteModal();
	alert("Your account has been deleted");
	navigateTo("/");
}

window.loadProfilePage = loadProfilePage;
