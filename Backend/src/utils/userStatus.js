export const onlineUsers = new Set();
export const userConnections = new Map();

export function isUserActive(userId) {
	return userConnections.has(userId) && onlineUsers.has(userId);
}
