import fastify from "fastify";
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

export default async function fastifyPlugin(fastify) {
	fastify.post("/2fa/setup", (request, reply) => 
		twoFaSetup(request, reply, fastify)
	);
	fastify.post("/2fa/verify", (request, reply) => 
		twoFaVerify(request, reply, fastify)
	);
	fastify.post("/2fa/login", (request, reply) =>
		twoFaLogin(request, reply, fastify)
	);
};