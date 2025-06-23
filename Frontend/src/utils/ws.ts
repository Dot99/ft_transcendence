import { getCookie } from "./auth.js";

let ws: WebSocket | null = null;
let onlineUserIds: number[] = [];
let listeners: ((ids: number[]) => void)[] = [];

export function getOnlineUserIds() {
	return onlineUserIds;
}

export function subscribeOnlineUsers(cb: (ids: number[]) => void) {
	if (!listeners.includes(cb)) {
		listeners.push(cb);
	}
}

export function unsubscribeOnlineUsers(cb: (ids: number[]) => void) {
	listeners = listeners.filter((listener) => listener !== cb);
}

function notifyListeners() {
	for (const cb of listeners) cb(onlineUserIds);
}

export function startOnlineWebSocket() {
	const token = getCookie("jwt");
	if (!token) return;
	if (ws && ws.readyState === WebSocket.OPEN) return;

	ws = new WebSocket(`ws://localhost:3000/api/ws?token=${token}`);

	ws.onopen = () => {
		//console.log("WebSocket connected (user online)");
	};
	ws.onclose = () => {
		//console.log("WebSocket closed (user offline)");
	};
	ws.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data);
			if (data.type === "onlineFriends" && Array.isArray(data.userIds)) {
				onlineUserIds = data.userIds.map(Number);
				notifyListeners();
			}
		} catch (error) {
			console.error("Error parsing WebSocket message:", error);
		}
	};
}

export function stopOnlineWebSocket() {
	if (ws) {
		ws.close();
		ws = null;
	}
}
