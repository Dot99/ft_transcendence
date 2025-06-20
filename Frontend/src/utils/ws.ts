import { getCookie } from "./auth.js";

let ws: WebSocket | null = null;

export function startOnlineWebSocket() {
	const token = getCookie("jwt");
	if (!token) return;
	if (ws && ws.readyState === WebSocket.OPEN) return;

	ws = new WebSocket("ws://localhost:3000/api/ws", token);

	ws.onopen = () => {
		console.log("WebSocket connected (user online)");
	};
	ws.onclose = () => {
		console.log("WebSocket closed (user offline)");
	};
}

export function stopOnlineWebSocket() {
	if (ws) {
		ws.close();
		ws = null;
	}
}
