import Fastify from "fastify";
import cors from "@fastify/cors";
import AutoLoad from "@fastify/autoload"; // Automatically load routes
import fastifyJwt from "@fastify/jwt"; // JWT authentication
import { fileURLToPath } from "url"; // Import fileURLToPath to get the current directory
import { dirname, join } from "path"; // Import dirname and join from path to handle file paths
import dotenv from "dotenv"; // Load environment variables from .env file
import authMiddleware from "./middleware/authMiddleware.js";
import fastifyStatic from "@fastify/static";

dotenv.config();

const fastify = Fastify();
const __dirname = dirname(fileURLToPath(import.meta.url));

await fastify.register(cors, {
	origin: process.env.FRONTEND_URL,
	credentials: true,
});

await fastify.register(fastifyJwt, {
	secret: process.env.JWT_SECRET,
});

await fastify.register(authMiddleware);

await fastify.register(AutoLoad, {
	dir: join(__dirname, "routes"),
	options: { prefix: "/api" },
});

await fastify.register(fastifyStatic, {
	root: "/app/Frontend/public",
	prefix: "/",
});

fastify.setNotFoundHandler((request, reply) => {
	reply.sendFile("index.html");
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
