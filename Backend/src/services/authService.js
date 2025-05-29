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
		// Still not found? Create new user
		if (!user) {
			const result = await dbRun(
				`
			INSERT INTO users (username, email, pfp, google_id, is_oauth_only, country)
			VALUES (?, ?, ?, ?, ?, ?)
			`,
				[
					profile.name,
					profile.email,
					profile.picture,
					profile.sub,
					true,
					"Unknown", //TODO: CHECK THIS
				]
			);
			user = await dbGet("SELECT * FROM users WHERE id = ?", [result.lastID]);
		}
		// Check 2FA
		if (user.twofa_enabled) {
			return {
				twofa: true,
				userId: user.id,
				message: "2FA required",
			};
		}
		// Generate JWT token
		const jwtToken = fastify.jwt.sign({
			id: user.id,
			username: user.username,
			email: user.email,
		});
		return { token: jwtToken };
	} catch (error) {
		console.error("Error in handleGoogleCallback:", error);
		throw new Error("Authentication failed");
	}
}
