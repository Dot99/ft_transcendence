const onlineUsers = new Set();

/**
 *  @param {import('fastify').FastifyInstance} fastify
 *  @param {import('fastify').FastifyPluginOptions} options
 *  @returns {Promise<void>}
 *  @description WebSocket routes for handling real-time connections
 */
export default async function (fastify) {
	fastify.get("/ws", { websocket: true }, async (connection, req) => {
		let userId;
		try {
			await fastify.authenticate(req, {});
			const decoded = req.user;
			userId = decoded.id;
			onlineUsers.add(userId);
		} catch (e) {
			fastify.log.error("WebSocket authentication failed:", e);
			if (connection.socket) {
				connection.socket.close();
			}
			return;
		}
		connection.socket.on("close", () => {
			onlineUsers.delete(userId);
		});
	});
}
