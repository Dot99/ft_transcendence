import { getCookie } from "./auth.js";
import { WS_BASE_URL } from "../config.js";
import { navigateTo } from "./router.js";

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
	invitationListeners = invitationListeners.filter(
		(listener) => listener !== cb
	);
}

function notifyListeners() {
	for (const cb of listeners) cb(onlineUserIds);
}

function notifyInvitationListeners(invitation: any) {
	for (const cb of invitationListeners) cb(invitation);
}

function showAcceptedNotification(message: string) {
	// Create a temporary notification
	const notification = document.createElement("div");
	notification.className =
		"fixed top-4 right-4 bg-[#4CF190] text-[#001B26] px-6 py-3 rounded shadow-lg text-lg font-bold z-50";
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

	ws.onopen = () => {};
	ws.onclose = () => {};
	ws.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data);
			if (data.type === "onlineFriends" && Array.isArray(data.userIds)) {
				onlineUserIds = data.userIds.map(Number);
				notifyListeners();
			} else if (data.type === "gameInvitation") {
				notifyInvitationListeners(data.invitation);
			} else if (data.type === "invitationAccepted") {
				// Check if we have pending game data (for inviter)
				const pendingGameData = (window as any).pendingGameData;

				if (pendingGameData) {
					// This is the inviter - use the pending game data
					(window as any).gameData = pendingGameData;
					delete (window as any).pendingGameData;
				} else {
					// This is the invitee - use the data from the WebSocket message
					(window as any).gameData = {
						type: "friend_invite",
						opponentUsername: data.inviterUsername || "Unknown",
						gameId: data.gameId,
						isInviter: false,
					};
				}

				showAcceptedNotification(data.message);
				// Dispatch event to navigate to play page
				setTimeout(() => {
					navigateTo("/play");
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
