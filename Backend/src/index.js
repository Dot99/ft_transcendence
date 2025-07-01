import Fastify from "fastify";
import cors from "@fastify/cors";
import AutoLoad from "@fastify/autoload"; // Automatically load routes
import fastifyJwt from "@fastify/jwt"; // JWT authentication
import googleOAuth2 from "@fastify/oauth2"; // OAuth2 support
import ws from "@fastify/websocket"; // WebSocket support
import { fileURLToPath } from "url"; // Import fileURLToPath to get the current directory
import { dirname, join } from "path"; // Import dirname and join from path to handle file paths
import dotenv from "dotenv"; // Load environment variables from .env file
import authMiddleware from "./middleware/authMiddleware.js";
import fastifyStatic from "@fastify/static";

dotenv.config();

const fastify = Fastify({
	logger: false,
});

const __dirname = dirname(fileURLToPath(import.meta.url));

await fastify.register(cors, {
	origin: [process.env.FRONTEND_URL, /^http:\/\/10\.11\.9\.\d+:3001$/],
	methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
	exposedHeaders: ["Content-Range", "X-Content-Range"],
	maxAge: 600,
});

await fastify.register(fastifyJwt, {
	secret: process.env.JWT_SECRET,
});

await fastify.register(authMiddleware);

await fastify.register(googleOAuth2, {
	name: "googleOAuth2",
	credentials: {
		client: {
			id: process.env.GOOGLE_CLIENT_ID,
			secret: process.env.GOOGLE_CLIENT_SECRET,
		},
		auth: {
			authorizeHost: "https://accounts.google.com",
			authorizePath: "/o/oauth2/v2/auth",
			tokenHost: "https://oauth2.googleapis.com",
			tokenPath: "/token",
		},
	},
	startRedirectPath: "/api/auth/google",
	callbackUri: process.env.GOOGLE_REDIRECT_URI,
	scope: [
		"openid",
		"https://www.googleapis.com/auth/userinfo.profile",
		"https://www.googleapis.com/auth/userinfo.email",
	],
});

await fastify.register(ws);

await fastify.register(AutoLoad, {
	dir: join(__dirname, "routes"),
	options: { prefix: "/api" },
});

await fastify.register(fastifyStatic, {
	root: "/app/Frontend/dist",
	prefix: "/",
});

fastify.setNotFoundHandler((request, reply) => {
	// Only serve index.html for non-API routes
	if (request.url.startsWith('/api/')) {
		reply.status(404).send({ error: 'API endpoint not found' });
	} else {
		reply.sendFile("index.html");
	}
});

fastify.setErrorHandler((error, request, reply) => {
	// Log the error for debugging
	fastify.log.error(error);

	if (error.validation) {
		return reply.status(400).send({
			message: "Validation failed",
			error: error.validation,
		});
	}
	if (error instanceof BaseError) {
		return reply.status(error.statusCode).send({
			message: error.message,
			code: error.code,
		});
	}
	// Catch all for unexpected errors
	return reply.status(500).send({
		message: "Internal Server Error",
		error: error.message,
	});
});

await fastify.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" });

export default fastify;
