// src/controllers/authController.js
import { handleGoogleCallback } from "../services/authService.js";

/**
 * Handles the Google OAuth callback.
 * @param {import("fastify").FastifyRequest} request - The Fastify request object.
 * @param {import("fastify").FastifyReply} reply - The Fastify reply object.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 * @throws {Error} - Throws an error if the authentication fails.
 * @description This function is called when the user is redirected back to the application after authentication with Google.
 * It handles the callback, retrieves the user information, and sends a token back to the client.
 */
export async function googleOAuthCallback(request, reply) {
	try {
		const result = await handleGoogleCallback(request, request.server);
		reply.code(200).send({ token });
	} catch (error) {
		request.log.error(error);
		reply.status(500).send({ error: "Authentication failed" });
	}
}
