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

export function getGameById(id) {
	return new Promise((resolve, reject) => {
		db.get("SELECT * FROM match_history WHERE match_id = ?", [id], (err, row) => {
			if (err) {
				reject({ success: false, error: err });
			}
			if (!row) {
				return resolve({ success: false, message: "Game not found" });
			}
			resolve({ success: true, game: row, message: "Game found" });
		});
	});
}

export function getGamesByUserId(userId) {
	return new Promise((resolve, reject) => {
		db.all("SELECT * FROM match_history WHERE player1 = ? OR player2 = ?", [userId], (err, rows) => {
			if (err) {
				reject({ success: false, error: err });
			}
			if (!rows) {
				return resolve({
					success: false,
					message: "No games found for this user",
				});
			}
			resolve({ success: true, games: rows, message: "Games found" });
		});
	});
}

export function getRecentGamesByUserId(userId) {
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
						message: "No games found for this user",
					});
				}
				resolve({ success: true, games: rows, message: "Games found" });
			}
		);
	});
}

export function getPastTournamentsByUserId(userId) {
	return new Promise((resolve, reject) => {
		db.all(
			`SELECT * FROM tournaments_players
			 WHERE player_id = ? 
			 ORDER BY tournament_date DESC`,
			[userId],
			(err, rows) => {
				if (err) {
					return reject({ success: false, error: err });
				}
				if (!rows || rows.length === 0) {
					return resolve({
						success: false,
						message: "No tournaments found for this user",
					});
				}
				resolve({ success: true, tournaments: rows, message: "Tournaments found" });
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
						message: "No upcoming tournaments found for this user",
					});
				}
				resolve({ success: true, tournaments: rows, message: "Upcoming tournaments found" });
			}
		);
	});
}
export function getTournamentById(tournamentId) {
	return new Promise((resolve, reject) => {
		db.get("SELECT * FROM tournaments WHERE tournament_id = ?", [tournamentId], (err, row) => {
			if (err) {
				reject({ success: false, error: err });
			}
			if (!row) {
				return resolve({ success: false, message: "Tournament not found" });
			}
			resolve({ success: true, tournament: row, message: "Tournament found" });
		});
	});
}
export function getTournamentMatchesById(tournamentId) {
	return new Promise((resolve, reject) => {
		db.all("SELECT * FROM tournament_matches WHERE tournament_id = ?", [tournamentId], (err, rows) => {
			if (err) {
				reject({ success: false, error: err });
			}
			if (!rows || rows.length === 0) {
				return resolve({ success: false, message: "No matches found for this tournament" });
			}
			resolve({ success: true, matches: rows, message: "Matches found" });
		});
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
					return resolve({ success: false, message: "No upcoming matches found for this tournament" });
				}
				resolve({ success: true, matches: rows, message: "Upcoming matches found" });
			}
		);
	});
}
