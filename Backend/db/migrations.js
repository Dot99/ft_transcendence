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
      twofa_verified BOOLEAN DEFAULT false,
      date_joined DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_play_time INTEGER DEFAULT 0
    )
  `);

	// stats
	db.run(`
    CREATE TABLE IF NOT EXISTS stats (
      player_id INTEGER PRIMARY KEY,
      total_matches INTEGER DEFAULT 0,
      matches_won INTEGER DEFAULT 0,
      matches_lost INTEGER DEFAULT 0,
      average_score REAL DEFAULT 0.0,
      win_streak_max INTEGER DEFAULT 0,
      tournaments_won INTEGER DEFAULT 0,
      leaderboard_position INTEGER,
      current_tournament INTEGER,
      FOREIGN KEY (current_tournament) REFERENCES tournaments(tournament_id),
      FOREIGN KEY (player_id) REFERENCES users(id)
    )
  `);

	// Match History
	db.run(`
    CREATE TABLE IF NOT EXISTS match_history (
      match_id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1 INTEGER NOT NULL,
      player2 INTEGER NOT NULL,
      match_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      winner INTEGER,
      player1_score INTEGER NOT NULL,
      player2_score INTEGER NOT NULL,
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
      game_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
	// Tournaments
	db.run(`
  CREATE TABLE IF NOT EXISTS tournaments (
    tournament_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME,
    PLAYER_COUNT INTEGER DEFAULT 0,
    max_players INTEGER NOT NULL,
	current_round INTEGER DEFAULT 1,
    status TEXT CHECK(status IN ('upcoming', 'ongoing', 'completed')) DEFAULT 'upcoming'
  )`);

	// Tournament Players
	db.run(`
  CREATE TABLE IF NOT EXISTS tournament_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,
    tournament_name TEXT,
    player_id INTEGER,
    wins INTEGER, 
    losses INTEGER,
	current_position INTEGER DEFAULT 0,


    FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id),
    FOREIGN KEY (player_id) REFERENCES users(id)
  )`);

	// Tournament Matches
	db.run(`
  CREATE TABLE IF NOT EXISTS tournament_matches (
    match_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,
    round INTEGER,
    player1 INTEGER,
    player2 INTEGER,
    Winner INTEGER,
    player1_score INTEGER,
    player2_score INTEGER,
    match_date TEXT DEFAULT CURRENT_TIMESTAMP,
    match_state TEXT CHECK(match_state IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
	round_number INTEGER,
	scheduled_date DATETIME,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id),
    FOREIGN KEY (player1) REFERENCES users(id),
    FOREIGN KEY (player2) REFERENCES users(id)
  )`);

	// Costumization
	db.run(`  
    CREATE TABLE IF NOT EXISTS game_costumization (
    user_id INTEGER PRIMARY KEY,
    paddle_color TEXT NOT NULL DEFAULT '#4CF190',
    ball_color TEXT NOT NULL DEFAULT '#4CF190',
    board_color TEXT NOT NULL DEFAULT '#07303c',
    border_color TEXT NOT NULL DEFAULT '#4CF190',
    FOREIGN KEY (user_id) REFERENCES users(id)  
    )`);

	//Sessions
	db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

	// Game Invitations
	db.run(`
    CREATE TABLE IF NOT EXISTS game_invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inviter_id INTEGER NOT NULL,
      invitee_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
      game_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      responded_at DATETIME,
      FOREIGN KEY (inviter_id) REFERENCES users(id),
      FOREIGN KEY (invitee_id) REFERENCES users(id)
    )`);
}
