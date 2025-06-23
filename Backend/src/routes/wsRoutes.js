const onlineUsers = new Set();
const connections = new Set();

function broadcastOnlineUsers() {
	const userIds = Array.from(onlineUsers);
	const message = JSON.stringify({ type: "onlineFriends", userIds });
	for (const conn of connections) {
		try {
			conn.send(message);
		} catch (e) {}
	}
}

export default async function (fastify) {
	fastify.get("/ws", { websocket: true }, async (connection, req) => {
		let userId;
		try {
			const token = req.query.token;
			if (!token) throw new Error("No token provided");
			let decoded;
			try {
				decoded = fastify.jwt.verify(token);
			} catch (err) {
				fastify.log.error("WebSocket JWT verification failed:", err);
				if (connection) {
					connection.close();
				}
				return;
			}
			userId = decoded.id;
			onlineUsers.add(userId);
			connections.add(connection);
			broadcastOnlineUsers();
		} catch (e) {
			fastify.log.error("WebSocket authentication failed:", e);
			if (connection) {
				connection.close();
			}
			return;
		}
		connection.on("close", () => {
			onlineUsers.delete(userId);
			connections.delete(connection);
			broadcastOnlineUsers();
		});
	});
}
