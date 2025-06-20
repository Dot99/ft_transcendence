import fp from "fastify-plugin";
import { UnauthorizedError } from "../errors/unauthorizedError.js";
import { isTokenBlacklisted } from "./jwtBlacklist.js";

async function authMiddleware(fastify) {
	fastify.decorate("authenticate", async function (request, reply) {
		let token = request.headers.authorization?.split(" ")[1];
		// Check WebSocket protocol header if Authorization is missing
		if (!token && request.headers["sec-websocket-protocol"]) {
			token = request.headers["sec-websocket-protocol"];
		}
		if (!token || isTokenBlacklisted(token)) {
			return reply.status(401).send({ message: "Token has been invalidated" });
		}
		try {
			await request.jwtVerify({ token });
		} catch {
			throw new UnauthorizedError();
		}
	});
}

export default fp(authMiddleware);
