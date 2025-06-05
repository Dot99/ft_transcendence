// src/controllers/authController.js
import { handleGoogleCallback } from "../services/authService.js";
import { getUserById } from "../services/usersServices.js";

/**
 * Handles the Google OAuth callback.
 * @param {import("fastify").FastifyRequest} request - The Fastify request object.
 * @param {import("fastify").FastifyReply} reply - The Fastify reply object.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 * @throws {Error} - Throws an error if the authentication fails.
 * @description This function is called when the user is redirected back to the application after authentication with Google.
 * It handles the callback, retrieves the user information, and sends a token back to the client.
 */
export async function googleOAuthCallback(request, reply, fastify) {
	try {
		const result = await handleGoogleCallback(request, fastify);
		const params = new URLSearchParams({
			token: result.token,
			userId: result.userId.toString(),
			twofa: result.twofa.toString(),
			google_id: result.exists.toString(),
		}).toString();

		// Redirect to frontend with the token
		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
		reply.redirect(`${frontendUrl}/?${params}`);
	} catch (error) {
		reply.log.error(error);
		reply.status(500).send({ error: "Authentication failed" });
	}
}

export async function twoFaSetup(request, reply, fastify) {
	try {
		const userId = request.user.id;
		const secret = speakeasy.generateSecret({
			name: `Trans (${request.user.email})`,
		});
		const result = await twoFaSetupService(userId, secret.base32);
		if (result.success) {
			const qrcode = await qrcode.toDataURL(secret.otpauth_url);
			reply.status(200).send({
				success: true,
				code: qrcode,
				message: "QR Code generated successfully",
			});
		} else {
			reply.status(400).send({ success: false, error: "2FA setup failed" });
		}
	} catch (error) {
		reply.log.error(error);
		reply.status(500).send({ error: "2FA setup failed" });
	}
}

export async function twoFaVerify(request, reply, fastify) {
	try {
		const { token } = request.body;
		const userId = request.user.id;
		const user = await getUserById(userId, fastify);
		const verification = speakeasy.totp.verify({
			secret: user.twofa_secret,
			encoding: "base32",
			token: token,
			window: 1,
		});
		if (!verification) {
			return reply.status(400).send({ success: false, error: "Invalid token" });
		}
		const result = await twoFaVerifyService(userId, true);
		if (result.success) {
			reply
				.status(200)
				.send({ success: true, message: "2FA verification successful" });
		} else {
			reply
				.status(400)
				.send({ success: false, error: "2FA verification failed" });
		}
	} catch (error) {
		reply.log.error(error);
		reply.status(500).send({ error: "2FA verification failed" });
	}
}
