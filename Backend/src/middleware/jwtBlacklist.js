const jwtBlacklist = new Set();

export function addToBlacklist(token) {
	jwtBlacklist.add(token);
}

export function isTokenBlacklisted(token) {
	return jwtBlacklist.has(token);
}

export function removeFromBlacklist(token) {
	jwtBlacklist.delete(token);
}
