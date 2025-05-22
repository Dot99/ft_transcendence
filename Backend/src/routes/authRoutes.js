import { googleOAuthCallback } from "../controllers/authController.js";

export default async function googleAuthRoutes(fastify) {
	/**
	 * @name googleAuth
	 * @description Route to initiate Google OAuth authentication
	 * @route GET /auth/google
	 */
	fastify.get("/auth/google/callback", googleOAuthCallback);
}
