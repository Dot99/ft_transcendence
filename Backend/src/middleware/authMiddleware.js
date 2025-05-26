import { UnauthorizedError } from "../errors/unauthorizedError.js";
import { isTokenBlacklisted } from "./jwtBlacklist.js";

export default async function (fastify) {
	fastify.decorate("authenticate", async function (request, reply) {
		const token = request.headers.authorization?.split(" ")[1];
		if (!token || isTokenBlacklisted(token)) {
			return reply.status(401).send({ message: "Token has been invalidated" });
		}
		try {
			await request.jwtVerify();
		} catch {
			throw new UnauthorizedError();
		}
	});
}
