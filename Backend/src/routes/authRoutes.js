import {
	googleOAuthCallback,
	twoFaSetup,
	twoFaVerify,
	twoFaLogin,
} from "../controllers/authController.js";

export default async function (fastify, opts) {
	/**
	 * @name googleAuth
	 * @description Route to initiate Google OAuth authentication
	 * @route GET /auth/google/callback
	 */
	fastify.get("/auth/google/callback", (request, reply) =>
		googleOAuthCallback(request, reply, fastify)
	);
	/**
	 * @name 2FA Setup
	 * @description Route to set up two-factor authentication for a user
	 * @route POST /2fa/setup
	 * @access Private
	 * @requires Authentication
	 * @handler twoFaSetup
	 * @param {import("fastify").FastifyRequest}
	 * @param {import("fastify").FastifyReply}
	 * @returns {Promise<void>}
	 * @throws {Error} If the setup fails
	 * @description This route allows authenticated users to set up two-factor authentication (2FA) by generating a QR code.
	 * The user must be authenticated to access this route.
	 * The QR code can be scanned by an authenticator app to enable 2FA.
	 * The handler function `twoFaSetup` is responsible for generating the QR code and returning it in the response.
	 */
	fastify.post("/2fa/setup", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) => twoFaSetup(request, reply, fastify),
	});
	/**
	 * @name 2FA Verify
	 * @description Route to verify two-factor authentication for a user
	 * @route POST /2fa/verify
	 * @access Private
	 * @requires Authentication
	 * @handler twoFaVerify
	 * @param {import("fastify").FastifyRequest}
	 * @param {import("fastify").FastifyReply}
	 * @returns {Promise<void>}
	 * @throws {Error} If the verification fails
	 * @description This route allows authenticated users to verify their two-factor authentication (2FA) by providing a token.
	 * The user must be authenticated to access this route.
	 * The handler function `twoFaVerify` is responsible for verifying the provided token and enabling 2FA for the user.
	 */
	fastify.post("/2fa/verify", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) => twoFaVerify(request, reply, fastify),
	});
	/**
	 * @name 2FA Login
	 * @description Route to log in with two-factor authentication
	 * @route POST /2fa/login
	 * @access Private
	 * @requires Authentication
	 * @handler twoFaLogin
	 * @param {import("fastify").FastifyRequest}
	 * @param {import("fastify").FastifyReply}
	 * @returns {Promise<void>}
	 * @throws {Error} If the login fails
	 * @description This route allows authenticated users to log in using two-factor authentication (2FA).
	 * The user must be authenticated to access this route.
	 * The handler function `twoFaLogin` is responsible for verifying the user's 2FA token and completing the login process.
	 */
	fastify.post("/2fa/login", {
		preHandler: [fastify.authenticate],
		handler: async (request, reply) => twoFaLogin(request, reply, fastify),
	});
}
