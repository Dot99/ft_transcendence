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
		db.get("SELECT * FROM match_history WHERE id = ?", [id], (err, row) => {
			if (err) {
				reject({ success: false, error: err });
			}
			if (row.length === 0) {
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
			if (rows.length === 0) {
				return resolve({
					success: false,
					message: "No games found for this user",
				});
			}
			resolve({ success: true, games: rows, message: "Games found" });
		});
	});
}
