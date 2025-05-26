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
	const tokenResponse =
		await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

	const userInfoResponse = await fetch(
		"https://www.googleapis.com/oauth2/v2/userinfo",
		{
			headers: {
				Authorization: `Bearer ${tokenResponse.access_token}`,
			},
		}
	);

	const profile = await userInfoResponse.json();

	let user = await dbGet("SELECT * FROM users WHERE google_id = ?", [
		profile.id,
	]);

	// If not found, try fallback by email
	if (!user) {
		user = await dbGet("SELECT * FROM users WHERE email = ?", [profile.email]);

		if (user) {
			await dbRun(
				`
				UPDATE users
				SET google_id = ?, is_oauth_only = true
				WHERE id = ?
			`,
				[profile.id, user.id]
			);
		}
	}

	// Still not found? Create new user
	if (!user) {
		const result = await dbRun(
			`
			INSERT INTO users (username, name, email, pfp, google_id, is_oauth_only)
			VALUES (?, ?, ?, ?, ?, ?)
			`,
			[
				profile.name, // You may want to slugify or deduplicate this
				profile.name,
				profile.email,
				profile.picture,
				profile.id,
				true,
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
}
