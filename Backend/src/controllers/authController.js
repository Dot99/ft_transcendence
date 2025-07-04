import speakeasy from "speakeasy"; // For two-factor authentication
import qrcode from "qrcode"; // For generating QR codes
import { getUserById } from "../services/usersServices.js";
import {
    handleGoogleCallback,
    twoFaSetupService,
    twoFaVerifyService,
    twoFaLoginService,
} from "../services/authService.js";

/**
 * Handles the Google OAuth callback.
 * @param {import("fastify").FastifyRequest} request - The Fastify request object.
 * @param {import("fastify").FastifyReply} reply - The Fastify reply object.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 * @throws {Error} - Throws an error if the authentication fails.
 * @description This function is called when the user is redirected back to the application after authentication with Google.
 * It handles the callback, retrieves the user information, and sends a token back to the client.
 */
const googleOAuthCallback = async (request, reply, fastify) => {
    try {
        if (request.query && request.query.error) {
            const error = request.query.error;
            const frontendUrl = process.env.FRONTEND_URL;
            return reply.redirect(
                `${frontendUrl}/?oauth_error=${encodeURIComponent(error)}`
            );
        }
        const result = await handleGoogleCallback(request, fastify);
        const params = new URLSearchParams({
            token: result.token,
            userId: result.userId.toString(),
            twofa: result.twofa.toString(),
            google_id: result.exists.toString(),
        }).toString();

        // Redirect to frontend with the token
        const frontendUrl = process.env.FRONTEND_URL;
        reply.redirect(`${frontendUrl}/?${params}`);
    } catch (error) {
        reply.log.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};

const twoFaSetup = async (request, reply, fastify) => {
    try {
        const userId = request.user.id;
        const secret = speakeasy.generateSecret({
            name: `Trans (${request.user.username})`,
        });
        const result = await twoFaSetupService(userId, secret.base32);
        if (result.success) {
            const qrCodeData = await qrcode.toDataURL(secret.otpauth_url); //Requires await!
            reply.status(200).send({
                success: true,
                code: qrCodeData,
            });
        } else {
            reply.status(400).send({
                success: false,
                error: messages.TwoFAFailed[request.lang],
            });
        }
    } catch (error) {
        reply.log.error(error);
        reply.status(500).send({ error: "2FA setup failed" });
    }
};

const twoFaVerify = async (request, reply, fastify) => {
    try {
        const { token } = request.body;
        const userId = request.user.id;
        const result = await twoFaVerifyService(userId, token, true);
        if (result.success) {
            reply.status(200).send({ success: true });
        } else {
            reply.status(400).send({
                success: false,
                error: messages.TwoFAFailed[request.lang],
            });
        }
    } catch (error) {
        reply.log.error(error);
        reply.status(500).send({ error: messages.TwoFAFailed[request.lang] });
    }
};

const twoFaLogin = async (request, reply, fastify) => {
    try {
        const { token } = request.body;
        const userId = request.user.id;
        const result = await twoFaLoginService(userId, token);
        if (result.success) {
            const user = await getUserById(userId);
            const newToken = fastify.jwt.sign({
                id: user.user.id,
                username: user.user.username,
                twofa_enabled: !!user.user.twofa_enabled,
                twofa_verified: true,
            });
            return reply.status(200).send({ success: true, token: newToken });
        } else {
            return reply.status(400).send({
                success: false,
                error: messages.TwoFAFailed[request.lang],
            });
        }
    } catch (error) {
        reply.log.error(error);
        reply.status(500).send({ error: messages.TwoFAFailed[request.lang] });
    }
};

export { googleOAuthCallback, twoFaSetup, twoFaVerify, twoFaLogin };
