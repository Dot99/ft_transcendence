
-- Create tables

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  pfp TEXT,
  country TEXT,
  total_play_time INTEGER
);

CREATE TABLE IF NOT EXISTS gameplay (
  player_id INTEGER PRIMARY KEY,
  total_matches INTEGER,
  matches_won INTEGER,
  matches_lost INTEGER,
  avg_score REAL,
  win_streak_max INTEGER,
  tournaments_won INTEGER,
  leaderboard_position INTEGER,
  FOREIGN KEY (player_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS match_history (
  match_id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER,
  opponent_id INTEGER,
  result TEXT,
  player_score INTEGER,
  opponent_score INTEGER,
  match_date TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES users(id),
  FOREIGN KEY (opponent_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player1 INTEGER,
  player2 INTEGER,
  winner INTEGER,
  FOREIGN KEY (player1) REFERENCES users(id),
  FOREIGN KEY (player2) REFERENCES users(id),
  FOREIGN KEY (winner) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tournaments (
  tournament_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT
);

CREATE TABLE IF NOT EXISTS tournament_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER,
  player_id INTEGER,
  current_position INTEGER,
  wins INTEGER,
  losses INTEGER,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id),
  FOREIGN KEY (player_id) REFERENCES users(id)
);

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
);

CREATE TABLE IF NOT EXISTS upcoming_tournament_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER,
  player_id INTEGER,
  opponent_id INTEGER,
  scheduled_date TEXT,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id),
  FOREIGN KEY (player_id) REFERENCES users(id),
  FOREIGN KEY (opponent_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS friends (
  user_id INTEGER,
  friend_id INTEGER,
  PRIMARY KEY (user_id, friend_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (friend_id) REFERENCES users(id)
);


-- Insert users
INSERT INTO users (username, name, email, password, pfp, country, total_play_time)
VALUES 
('juno420', 'juno', 'juno97@gmail.com', 'hashedpassword1', 'avatar1.jpg', 'PT', 15480),
('player2', 'Bob Johnson', 'bob@example.com', 'hashedpassword2', 'avatar2.png', 'UK', 2400),
('player3', 'Charlie Lee', 'charlie@example.com', 'hashedpassword3', 'avatar3.png', 'Canada', 1800);

-- Insert gameplay stats
INSERT INTO gameplay (player_id, total_matches, matches_won, matches_lost, avg_score, win_streak_max, tournaments_won, leaderboard_position)
VALUES 
(1, 42, 24, 18, 7.4, 5, 2, 15),
(2, 45, 25, 20, 6.8, 4, 1, 22),
(3, 40, 20, 20, 6.0, 3, 0, 30);

-- Insert match history (existing + 12 more for juno)
INSERT INTO match_history (player_id, opponent_id, result, player_score, opponent_score, match_date) VALUES
(1, 2, 'win', 10, 7, '2024-05-01'),
(1, 3, 'loss', 5, 10, '2024-05-02'),
(1, 2, 'loss', 9, 10, '2024-05-03'),
(1, 3, 'win', 10, 6, '2024-05-04'),
(2, 3, 'loss', 7, 10, '2024-05-05'),
(3, 1, 'loss', 6, 10, '2024-05-06'),
(2, 1, 'win', 10, 8, '2024-05-07'),
(3, 2, 'win', 10, 9, '2024-05-08'),
(1, 2, 'win', 10, 6, '2024-05-09'),
(1, 3, 'loss', 7, 10, '2024-05-10'),
(1, 2, 'win', 10, 9, '2024-05-11'),
(1, 3, 'win', 10, 8, '2024-05-12'),
(1, 2, 'loss', 6, 10, '2024-05-13'),
(1, 3, 'win', 10, 5, '2024-05-14'),
(1, 2, 'win', 10, 7, '2024-05-15'),
(1, 3, 'loss', 9, 10, '2024-05-16'),
(1, 2, 'loss', 8, 10, '2024-05-17'),
(1, 3, 'win', 10, 4, '2024-05-18'),
(1, 2, 'win', 10, 6, '2024-05-19'),
(1, 3, 'loss', 6, 10, '2024-05-20');

-- Insert games
INSERT INTO games (player1, player2, winner)
VALUES 
(1, 2, 1),
(1, 3, 3),
(2, 3, 2);

-- Insert friends
INSERT INTO friends (user_id, friend_id) VALUES 
(1, 2), (2, 1),
(1, 3), (3, 1);

-- Insert tournaments
INSERT INTO tournaments (name, start_date, end_date)
VALUES 
('Spring Showdown', '2024-04-01', '2024-04-30'),
('Winter Clash', '2024-01-01', '2024-01-31'),
('Autumn Arena', '2023-10-01', '2023-10-30'),
('May Masters', '2025-05-01', '2025-05-31');

-- Tournament players
INSERT INTO tournament_players (tournament_id, player_id, current_position, wins, losses) VALUES
(1, 1, 1, 2, 1),
(1, 2, 2, 1, 2),
(1, 3, 3, 1, 1),
(2, 1, 2, 2, 1),
(2, 2, 1, 3, 0),
(2, 3, 3, 1, 3),
(3, 1, 1, 3, 0),
(3, 2, 2, 2, 1),
(3, 3, 3, 0, 3),
(4, 1, 1, 2, 0),
(4, 2, 2, 1, 1),
(4, 3, 3, 0, 2);

-- Tournament matches
INSERT INTO tournament_matches (tournament_id, player_id, opponent_id, result, player_score, opponent_score, match_date) VALUES
-- Spring Showdown
(1, 1, 2, 'win', 10, 6, '2024-04-05'),
(1, 1, 3, 'loss', 8, 10, '2024-04-10'),
(1, 1, 3, 'win', 10, 9, '2024-04-15'),
(1, 2, 3, 'loss', 7, 10, '2024-04-18'),
(1, 2, 1, 'loss', 6, 10, '2024-04-20'),
(1, 3, 2, 'win', 10, 7, '2024-04-25'),
-- Winter Clash
(2, 1, 3, 'win', 10, 7, '2024-01-05'),
(2, 1, 2, 'loss', 8, 10, '2024-01-10'),
(2, 1, 3, 'win', 10, 9, '2024-01-20'),
-- Autumn Arena
(3, 1, 2, 'win', 10, 5, '2023-10-05'),
(3, 1, 3, 'win', 10, 7, '2023-10-12'),
(3, 1, 2, 'win', 10, 9, '2023-10-20'),
-- May Masters
(4, 1, 2, 'win', 10, 8, '2025-05-05'),
(4, 1, 3, 'win', 10, 6, '2025-05-10'),
(4, 2, 3, 'win', 10, 9, '2025-05-12');

-- Upcoming matches for May Masters
INSERT INTO upcoming_tournament_matches (tournament_id, player_id, opponent_id, scheduled_date) VALUES
(4, 1, 3, '2025-05-18'),
(4, 2, 1, '2025-05-20'),
(4, 3, 2, '2025-05-25');