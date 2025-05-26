const userId = 1;

  async function loadPerformanceOverview() {
    try {
      const matchRes = await fetch(`/api/users/${userId}/matches`);
      const matches = await matchRes.json();

      const totalMatches = matches.length;
      const wins = matches.filter(m => m.result === 'win').length;
      const losses = matches.filter(m => m.result === 'loss').length;
      const avgScore =
        matches.reduce((sum, m) => sum + (m.score || 0), 0) / (totalMatches || 1);
      const winStreak = calculateWinStreak(matches);

      document.getElementById('totalMatches').textContent = totalMatches;
      document.getElementById('matchesWon').textContent = wins;
      document.getElementById('matchesLost').textContent = losses;
      document.getElementById('avgScore').textContent = avgScore.toFixed(1);
      document.getElementById('winStreak').textContent = winStreak;

    //   const tournamentRes = await fetch(`/api/users/${userId}/tournaments`);
    //   const tournaments = await tournamentRes.json();
    //   const wonTournaments = tournaments.filter(t => t.winner_id === userId).length;
    //   document.getElementById('tournaments').textContent = wonTournaments;

    //   const leaderboardRes = await fetch(`/api/user/${userId}/leaderboard`);
    //   const leaderboardData = await leaderboardRes.json();
    //   document.getElementById('leaderboard').textContent = `#${leaderboardData.rank}`;
    } catch (err) {
      console.error('Error laoding performance:', err);
    }
  }

  function calculateWinStreak(matches) {
    matches.sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    for (let match of matches) {
      if (match.result === 'win') streak++;
      else break;
    }
    return streak;
  }

  loadPerformanceOverview();
loadPerformanceOverview();
