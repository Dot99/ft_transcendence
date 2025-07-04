import { getCookie } from "./auth.js";
import { WS_BASE_URL } from "../config.js";

let ws: WebSocket | null = null;
let onlineUserIds: number[] = [];
let listeners: ((ids: number[]) => void)[] = [];
let invitationListeners: ((invitation: any) => void)[] = [];

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

export function subscribeGameInvitations(cb: (invitation: any) => void) {
	if (!invitationListeners.includes(cb)) {
		invitationListeners.push(cb);
	}
}

export function unsubscribeGameInvitations(cb: (invitation: any) => void) {
	invitationListeners = invitationListeners.filter((listener) => listener !== cb);
}

function notifyListeners() {
	for (const cb of listeners) cb(onlineUserIds);
}

function notifyInvitationListeners(invitation: any) {
	for (const cb of invitationListeners) cb(invitation);
}

function showAcceptedNotification(message: string) {
	// Create a temporary notification
	const notification = document.createElement('div');
	notification.className = 'fixed top-4 right-4 bg-[#4CF190] text-[#001B26] px-6 py-3 rounded shadow-lg text-lg font-bold z-50';
	notification.textContent = message;
	document.body.appendChild(notification);
	
	// Remove after 3 seconds
	setTimeout(() => {
		document.body.removeChild(notification);
	}, 3000);
}

export function startOnlineWebSocket() {
	const token = getCookie("jwt");
	if (!token) return;
	if (ws && ws.readyState === WebSocket.OPEN) return;

	ws = new WebSocket(`${WS_BASE_URL}/api/ws?token=${token}`);

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
			} else if (data.type === "gameInvitation") {
				notifyInvitationListeners(data.invitation);
			} else if (data.type === "invitationAccepted") {
				// Handle invitation acceptance - redirect to game
				sessionStorage.setItem("gameId", data.gameId);
				sessionStorage.setItem("pvpOpponent", data.inviteeUsername);
				showAcceptedNotification(data.message);
				// Dispatch event to navigate to play page
				setTimeout(() => {
					window.dispatchEvent(new Event("loadPlayPage"));
				}, 1500);
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
