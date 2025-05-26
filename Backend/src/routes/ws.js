import { UnauthorizedError } from "../errors/unauthorizedError.js";

export default async function (fastify, opts) {
	fastify.get("/ws", { websocket: true }, async (connection, req) => {
		try {
			// Extract JWT from query params
			const token = new URL(
				req.url,
				`http://${req.headers.host}`
			).searchParams.get("token");

			if (!token) {
				throw new UnauthorizedError("Missing token");
			}

			// Verify token using Fastify's JWT plugin
			const user = await fastify.jwt.verify(token);
			req.user = user; // Attach user to request

			console.log(`User ${user.username} connected via WebSocket`);

			connection.socket.on("message", (message) => {
				console.log(`Received from ${user.username}:`, message.toString());

				connection.socket.send(`Echo from server: ${message}`);
			});
		} catch (err) {
			const errorMessage = err.message || "Unauthorized";
			console.error("WebSocket Auth Error:", errorMessage);

			connection.socket.send(
				JSON.stringify({ type: "error", message: errorMessage })
			);
			connection.socket.close();
		}
	});
}
