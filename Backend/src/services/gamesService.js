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

export function getTournaments(lang = "en") {
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

export function createTournament(tournamentData, lang = "en") {
  return new Promise((resolve, reject) => {
    const { name, maxPlayers, startDate } = tournamentData;
    db.run(
      `INSERT INTO tournaments (name, start_date, max_players)
       VALUES (?, ?, ?)`,
      [name, startDate, maxPlayers],
      function (err) {
        if (err) {
          return reject({ success: false, error: err });
        }
        resolve({
          success: true,
          tournamentId: this.lastID,
          message: messages[lang].tournamentCreated,
        });
      }
    );
  });
}

export function joinTournament(
  tournamentName,
  tournamentId,
  userId,
  lang = "en"
) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM tournaments WHERE tournament_id = ? AND name = ?`,
      [tournamentId, tournamentName],
      (err, row) => {
        if (err) return reject({ success: false, error: err });

        if (!row) {
          return resolve({
            success: false,
            message: messages[lang].tournamentNotFound,
          });
        } else if (row.max_players <= row.PLAYER_COUNT) {
          return resolve({
            success: false,
            message: messages[lang].tournamentFull,
          });
        }

        db.get(
          `SELECT * FROM tournament_players WHERE tournament_id = ? AND player_id = ?`,
          [tournamentId, userId],
          (err, existingPlayer) => {
            if (err) return reject({ success: false, error: err });

            if (existingPlayer) {
              return resolve({
                success: false,
                message:
                  messages[lang].alreadyJoined ||
                  "You already joined this tournament.",
              });
            }

            db.run(
              `INSERT INTO tournament_players (tournament_id, tournament_name, player_id, wins, losses)
               VALUES (?, ?, ?, 0, 0)`,
              [tournamentId, tournamentName, userId],
              function (err) {
                if (err) return reject({ success: false, error: err });

                db.run(
                  `UPDATE tournaments SET PLAYER_COUNT = PLAYER_COUNT + 1 WHERE tournament_id = ?`,
                  [tournamentId],
                  (err) => {
                    if (err) return reject({ success: false, error: err });

                    resolve({
                      success: true,
                      message: messages[lang].tournamentJoined,
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
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
export function getTournamentMatchesById(tournamentId, lang = "en") {
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
export function getUpcomingTournamentMatchesById(tournamentId, lang = "en") {
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

export function getTournamentPlayersById(tournamentId, userId, lang = "en") {
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

export function getAllTournamentPlayers(tournamentId, lang = "en") {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM tournament_players WHERE tournament_id = ?",
      [tournamentId],
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

export function updateCustomization(userId, customization, lang = "en") {
  const { paddle_color, ball_color, board_color, border_color } = customization;

  return new Promise((resolve, reject) => {
    db.run(
      `
      INSERT INTO game_costumization (user_id, paddle_color, ball_color, board_color, border_color)
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

export function getCustomization(userId, lang = "en") {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM game_costumization WHERE user_id = ?",
      [userId],
      (err, row) => {
        if (err) {
          reject({ success: false, error: err });
        }
        if (!row) {
          return resolve({
            success: false,
            message: messages[lang].noCustomization,
          });
        }
        resolve({ success: true, customization: row });
      }
    );
  });
}
