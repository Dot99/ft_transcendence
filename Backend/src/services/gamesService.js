import db from "../../db/dataBase.js";
import { messages } from "../locales/messages.js";

export function getAllGames() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM match_history", (err, rows) => {
      if (err) {
        reject({ success: false, error: err });
      } else {
        resolve({ success: true, games: rows });
      }
    });
  });
}

export function getGameById(id, lang = "en") {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM match_history WHERE match_id = ?",
      [id],
      (err, row) => {
        if (err) {
          reject({ success: false, error: err });
        }
        if (!row) {
          return resolve({ success: false, message: messages[lang].noGame });
        }
        resolve({ success: true, game: row });
      }
    );
  });
}

export function getGamesByUserId(userId, lang = "en") {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM match_history WHERE player1 = ? OR player2 = ?",
      [userId],
      (err, rows) => {
        if (err) {
          reject({ success: false, error: err });
        }
        if (!rows) {
          return resolve({
            success: false,
            message: messages[lang].noMatches,
          });
        }
        resolve({ success: true, games: rows });
      }
    );
  });
}

export function getRecentGamesByUserId(userId, lang = "en") {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM match_history 
			 WHERE player1 = ? OR player2 = ? 
			 ORDER BY match_date DESC`,
      [userId, userId],
      (err, rows) => {
        if (err) {
          return reject({ success: false, error: err });
        }
        if (!rows || rows.length === 0) {
          return resolve({
            success: false,
            message: messages[lang].noMatches,
          });
        }
        resolve({ success: true, games: rows });
      }
    );
  });
}

export function getTournaments() {
	return new Promise((resolve, reject) => {
		db.all("SELECT * FROM tournaments", (err, rows) => {
			if (err) {
				return reject({ success: false, error: err });
			}
			if (!rows || rows.length === 0) {
				return resolve({
					success: false,
					message: messages[lang].noTournament,
				});
			}
			resolve({ success: true, tournaments: rows });
		});
	});
}

export function getPastTournamentsByUserId(userId, lang = "en") {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT tp.*, t.name AS tournament_name, t.start_date AS tournament_date
				FROM tournament_players tp
				JOIN tournaments t ON tp.tournament_id = t.tournament_id
				WHERE tp.player_id = ?
				ORDER BY t.start_date DESC;`,
      [userId],
      (err, rows) => {
        if (err) {
          return reject({ success: false, error: err });
        }
        if (!rows || rows.length === 0) {
          return resolve({
            success: false,
            message: messages[lang].noTournament,
          });
        }
        resolve({
          success: true,
          tournaments: rows,
        });
      }
    );
  });
}
export function getUpcomingTournamentsByUserId(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM tournaments 
			 WHERE start_date > CURRENT_TIMESTAMP 
			 AND (player1 = ? OR player2 = ?) 
			 ORDER BY start_date ASC`,
      [userId, userId],
      (err, rows) => {
        if (err) {
          return reject({ success: false, error: err });
        }
        if (!rows || rows.length === 0) {
          return resolve({
            success: false,
          });
        }
        resolve({
          success: true,
          tournaments: rows,
          message: "Upcoming tournaments found",
        });
      }
    );
  });
}
export function getTournamentById(tournamentId, lang = "en") {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM tournaments WHERE tournament_id = ?",
      [tournamentId],
      (err, row) => {
        if (err) {
          reject({ success: false, error: err });
        }
        if (!row) {
          return resolve({
            success: false,
            message: messages[lang].noTournament,
          });
        }
        resolve({
          success: true,
          tournament: row,
          message: "Tournament found",
        });
      }
    );
  });
}
export function getTournamentMatchesById(tournamentId) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM tournament_matches WHERE tournament_id = ?",
      [tournamentId],
      (err, rows) => {
        if (err) {
          reject({ success: false, error: err });
        }
        if (!rows || rows.length === 0) {
          return resolve({
            success: false,
            message: messages[lang].noMatches,
          });
        }
        resolve({ success: true, matches: rows });
      }
    );
  });
}
export function getUpcomingTournamentMatchesById(tournamentId) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM upcoming_tournament_matches WHERE tournament_id = ?",
      [tournamentId],
      (err, rows) => {
        if (err) {
          reject({ success: false, error: err });
        }
        if (!rows || rows.length === 0) {
          return resolve({
            success: false,
            message: messages[lang].noMatches,
          });
        }
        resolve({
          success: true,
          matches: rows,
        });
      }
    );
  });
}

export function getTournamentPlayersById(tournamentId, userId) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM tournament_players WHERE tournament_id = ? AND player_id = ?",
      [tournamentId, userId],
      (err, rows) => {
        if (err) {
          reject({ success: false, error: err });
        }
        if (!rows || rows.length === 0) {
          return resolve({
            success: false,
            message: messages[lang].noUsers,
          });
        }
        resolve({ success: true, players: rows });
      }
    );
  });
}

export function updateCustomization(userId, customization) {
  const { paddle_color, ball_color, board_color, border_color } = customization;

  return new Promise((resolve, reject) => {
    db.run(
      `
      INSERT INTO game_configurations (user_id, paddle_color, ball_color, board_color, border_color)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET 
        paddle_color = excluded.paddle_color,
        ball_color = excluded.ball_color,
        board_color = excluded.board_color,
        border_color = excluded.border_color
      `,
      [userId, paddle_color, ball_color, board_color, border_color],
      function (err) {
        if (err) {
          reject({ success: false, error: err });
        } else {
          resolve({ success: true, message: "Customization saved." });
        }
      }
    );
  });
}
