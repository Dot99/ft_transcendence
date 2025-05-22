export default function runMigrations(db) {
  // Users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT,
      country TEXT NOT NULL,
      email TEXT UNIQUE,
      pfp TEXT,
      google_id TEXT UNIQUE,
      is_oauth_only BOOLEAN DEFAULT false,
      twofa_enabled BOOLEAN DEFAULT false,
      twofa_secret TEXT,
      date_joined DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_play_time INTEGER DEFAULT 0
    )
  `);

  // Gameplay
  db.run(`
    CREATE TABLE IF NOT EXISTS gameplay (
      player_id INTEGER PRIMARY KEY,
      total_matches INTEGER DEFAULT 0,
      matches_won INTEGER DEFAULT 0,
      matches_lost INTEGER DEFAULT 0,
      avg_score REAL DEFAULT 0,
      win_streak_max INTEGER DEFAULT 0,
      tournaments_won INTEGER DEFAULT 0,
      leaderboard_position INTEGER,
      FOREIGN KEY (player_id) REFERENCES users(id)
    )
  `);

  // Match History
  db.run(`
    CREATE TABLE IF NOT EXISTS match_history (
      match_id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      opponent_id INTEGER NOT NULL,
      match_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      result TEXT CHECK(result IN ('win', 'loss', 'draw')) NOT NULL,
      player_score INTEGER NOT NULL,
      opponent_score INTEGER NOT NULL,
      FOREIGN KEY (player_id) REFERENCES users(id),
      FOREIGN KEY (opponent_id) REFERENCES users(id)
    )
  `);

  // Games
  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1 INTEGER NOT NULL,
      player2 INTEGER NOT NULL,
      winner INTEGER,
      FOREIGN KEY (player1) REFERENCES users(id),
      FOREIGN KEY (player2) REFERENCES users(id),
      FOREIGN KEY (winner) REFERENCES users(id)
    )
  `);

  // Friends
  db.run(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (friend_id) REFERENCES users(id)
    )
  `);

  // Blocked Users
  db.run(`
    CREATE TABLE IF NOT EXISTS blocked_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      blocked_user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (blocked_user_id) REFERENCES users(id)
    )
  `);

  // Matchmaking
  db.run(`
    CREATE TABLE IF NOT EXISTS matchmaking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('waiting', 'matched', 'cancelled')) DEFAULT 'waiting',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  // Tournaments
  db.run(`
  CREATE TABLE IF NOT EXISTS tournaments (
    tournament_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT
  )`);

  // Tournament Players
  db.run(`
  CREATE TABLE IF NOT EXISTS tournament_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,
    player_id INTEGER,
    current_position INTEGER,
    wins INTEGER,
    losses INTEGER,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id),
    FOREIGN KEY (player_id) REFERENCES users(id)
  )`);

  // Tournament Matches
  db.run(`
  CREATE TABLE IF NOT EXISTS tournament_matches (
    match_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,
    player_id INTEGER,
    opponent_id INTEGER,
    result TEXT,
    player_score INTEGER,
    opponent_score INTEGER,
    match_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id),
    FOREIGN KEY (player_id) REFERENCES users(id),
    FOREIGN KEY (opponent_id) REFERENCES users(id)
  )`);

  // Upcoming Tournament Matches
  db.run(`
  CREATE TABLE IF NOT EXISTS upcoming_tournament_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,
    player_id INTEGER,
    opponent_id INTEGER,
    scheduled_date TEXT,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id),
    FOREIGN KEY (player_id) REFERENCES users(id),
    FOREIGN KEY (opponent_id) REFERENCES users(id)
  )`);
}