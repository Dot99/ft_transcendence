import { googleOAuthCallback } from "../controllers/authController.js";

export default async function googleAuthRoutes(fastify) {
	/**
	 * @name googleAuth
	 * @description Route to initiate Google OAuth authentication
	 * @route GET /auth/google/callback
	 */
	fastify.get("/auth/google/callback", (request, reply) =>
		googleOAuthCallback(request, reply, fastify)
	);
}
