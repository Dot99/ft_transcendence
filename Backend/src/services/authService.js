import db from "../../db/dataBase.js";
import speakeasy from "speakeasy";

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
					profile.name || profile.email.split("@")[0],
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
			twofa_enabled: !!user.twofa_enabled,
			twofa_verified: !!user.twofa_verified,
			google_flag: true,
		});
		return {
			token,
			userId: user.id,
			twofa: !!user.twofa_enabled,
			exists: exists,
		};
	} catch (error) {
		console.error("Error in handleGoogleCallback:", error);
		console.error("Error details:", {
			message: error.message,
			stack: error.stack,
			request: request.query,
		});
		throw new Error("Authentication failed");
	}
}

export async function twoFaSetupService(userId, secret) {
	try {
		const result = await dbRun(
			"UPDATE users SET twofa_secret = ?, twofa_enabled = ? WHERE id = ?",
			[secret, true, userId]
		);
		if (result.changes === 0) {
			throw new Error("User not found or 2FA secret already set");
		}
		return { success: true, message: "2FA setup successful" };
	} catch (error) {
		console.error("Error in twoFaSetupService:", error);
		throw new Error("2FA setup failed");
	}
}

export async function twoFaVerifyService(userId, enabled) {
	try {
		const result = await dbRun("SELECT * FROM users WHERE id = ?", [userId]);
		if (!result || !result.twofa_secret) {
			throw new Error("User not found or 2FA not set up");
		}
		return { success: true, message: "2FA active" };
	} catch (error) {
		console.error("Error in twoFaVerifyService:", error);
		throw new Error("2FA verification failed");
	}
}

export async function twoFaLoginService(userId, token) {
	try {
		const user = await dbGet("SELECT * FROM users WHERE id = ?", [userId]);
		if (!user || !user.twofa_secret) {
			throw new Error("User not found or 2FA not set up");
		}
		const verification = speakeasy.totp.verify({
			secret: user.twofa_secret,
			encoding: "base32",
			token: token,
			window: 1,
		});
		console.log("Verification result:", verification);
		if (!verification) {
			throw new Error("Invalid token");
		}
		await dbRun("UPDATE users SET twofa_verified = ? WHERE id = ?", [
			true,
			userId,
		]);
		return { success: true, message: "2FA login successful" };
	} catch (error) {
		console.error("Error in twoFaLoginService:", error);
		throw new Error("2FA login failed");
	}
}
