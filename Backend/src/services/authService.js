import e from "express";
import db from "../../db/dataBase.js";

// Helper to promisify db.get
function dbGet(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.get(sql, params, (err, row) => {
			if (err) {
				console.error("DB GET error:", err);
				return reject(err);
			}
			resolve(row);
		});
	});
}

// Helper to promisify db.run
function dbRun(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.run(sql, params, function (err) {
			if (err) {
				console.error("DB RUN error:", err);
				return reject(err);
			}
			resolve(this); // gives access to `lastID`, `changes`, etc.
		});
	});
}

export async function handleGoogleCallback(request, fastify) {
	try {
		let exists = false;
		const tokenResponse =
			await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
				request
			);
		const profile = fastify.jwt.decode(tokenResponse.token.id_token);
		let user = await dbGet("SELECT * FROM users WHERE google_id = ?", [
			profile.sub,
		]);
		// If not found, try fallback by email
		if (!user) {
			user = await dbGet("SELECT * FROM users WHERE email = ?", [
				profile.email,
			]);
			if (user) {
				await dbRun(
					`
				UPDATE users
				SET google_id = ?, is_oauth_only = true
				WHERE id = ?
			`,
					[profile.sub, user.id]
				);
			}
		}
		if (user) exists = true;
		// Still not found? Create new user
		if (!user) {
			const result = await dbRun(
				`
			INSERT INTO users (username, email, pfp, google_id, is_oauth_only, country)
			VALUES (?, ?, ?, ?, ?, ?)
			`,
				[
					"Unknown",
					profile.email,
					profile.picture,
					profile.sub,
					true,
					"Unknown", //TODO: CHECK THIS
				]
			);
			user = await dbGet("SELECT * FROM users WHERE id = ?", [result.lastID]);
		}
		const token = fastify.jwt.sign({
			id: user.id,
			username: user.username,
			email: user.email,
		});
		return {
			token,
			userId: user.id,
			twofa: !!user.twofa_enabled,
			exists: exists,
		};
	} catch (error) {
		console.error("Error in handleGoogleCallback:", error);
		throw new Error("Authentication failed");
	}
}
