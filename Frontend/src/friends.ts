import { friendsTemplate } from "./templates/friendsTemplate.js";
import { getLang } from "./locales/localeMiddleware.js";
import { getCookie, getUserIdFromToken } from "./utils/auth.js";
import { t } from "./locales/localeMiddleware.js";
import {
	getOnlineUserIds,
	subscribeOnlineUsers,
	subscribeGameInvitations,
	unsubscribeGameInvitations,
} from "./utils/ws.js";
import { API_BASE_URL } from "./config.js";
let onlineUserIds: number[] = [];

interface Friend {
	id: number;
	username: string;
}

interface GameInvitation {
	id: string;
	inviter_id: number;
	invitee_id: number;
	game_id: string;
	status: "pending" | "accepted" | "declined";
	created_at: string;
	inviter_username: string;
}

let selectedFriendId: number | null = null;
let selectedFriendName: string | null = null;

export async function loadFriendsPage(): Promise<void> {
	const app = document.getElementById("app");
	if (!app) return;
	app.innerHTML = friendsTemplate;
	document
		.getElementById("addFriendBtn")
		?.addEventListener("click", addFriend);
	document
		.getElementById("inviteBtn")
		?.addEventListener("click", inviteToGame);
	document
		.getElementById("cancelInviteBtn")
		?.addEventListener("click", closeInviteModal);
	const toggleBlockedBtn = document.getElementById("toggleBlockedBtn");
	const blockedUsersPanel = document.getElementById("blockedUsersPanel");
	if (toggleBlockedBtn && blockedUsersPanel) {
		toggleBlockedBtn.addEventListener("click", async () => {
			blockedUsersPanel.classList.toggle("hidden");
			if (!blockedUsersPanel.classList.contains("hidden")) {
				await loadBlockedUsers();
			}
		});
	}
	onlineUserIds = getOnlineUserIds();
	const update = (ids: number[]) => {
		onlineUserIds = ids;
		loadFriends();
	};
	subscribeOnlineUsers(update);
	await loadFriends();
	await loadFriendRequests();
	await loadGameInvitations();

	// Subscribe to real-time game invitations
	const handleInvitation = (invitation: any) => {
		createInvitationNotification(invitation, 0);
	};
	subscribeGameInvitations(handleInvitation);

	// Clean up on page unload
	window.addEventListener("beforeunload", () => {
		unsubscribeGameInvitations(handleInvitation);
	});
}

async function loadFriends(): Promise<void> {
	try {
		const userId = getUserIdFromToken();
		const res = await fetch(`${API_BASE_URL}/users/${userId}/friends`, {
			headers: {
				"Accept-Language": getLang(),
				Authorization: `Bearer ${getCookie("jwt")}`,
			},
		});
		const data = await res.json();
		const friends: Friend[] = Array.isArray(data.friends)
			? data.friends
			: [];
		const friendsList = document.getElementById("friendsList");
		if (!friendsList) return;

		friendsList.innerHTML = "";
		if (!Array.isArray(data.friends) || friends.length === 0) {
			friendsList.innerHTML =
				'<div class="text-white text-center py-8 text-lg">No friends 😢</div>';
			return;
		}
		friends.forEach((friend: Friend) => {
			const isOnline = onlineUserIds.includes(friend.id);
			const friendDiv = document.createElement("div");
			friendDiv.className =
				"flex items-center border-2 border-[#4CF190] p-4 min-h-[64px] space-x-3 w-full";
			friendDiv.innerHTML = `
                <img src="images/floppy_disk.svg" alt="icon" class="w-5 h-5 text-[#4CF190] flex-shrink-0" />
                <span class="text-white flex-1 flex items-center gap-2 min-w-0 max-w-[250px]">
                    <span class="truncate" title="${friend.username}">${
				friend.username
			}</span>
                    ${
						isOnline
							? '<span title="Online" class="inline-block w-3 h-3 rounded-full bg-green-400 flex-shrink-0"></span>'
							: ""
					}
                </span>
                <div class="flex gap-2 flex-shrink-0">
                    <button class="invite-btn text-[#4CF190] border border-[#4CF190] rounded px-3 py-1 hover:bg-[#4CF190] hover:text-[#001B26] transition" data-id="${
						friend.id
					}" data-name="${friend.username}">
                        Invite
                    </button>
                    <button class="remove-btn text-yellow-400 border border-yellow-400 rounded px-3 py-1 hover:bg-yellow-400 hover:text-[#001B26] transition" data-id="${
						friend.id
					}">
                        Remove
                    </button>
                    <button class="block-btn text-red-400 border border-red-400 rounded px-3 py-1 hover:bg-red-400 hover:text-[#001B26] transition" data-id="${
						friend.id
					}">
                        Block
                    </button>
                </div>
            `;
			friendsList.appendChild(friendDiv);
		});
		friendsList.querySelectorAll(".invite-btn").forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const id = (e.currentTarget as HTMLElement).getAttribute(
					"data-id"
				);
				const name = (e.currentTarget as HTMLElement).getAttribute(
					"data-name"
				);
				if (id && name) openInviteModal(Number(id), name);
			});
		});
		friendsList.querySelectorAll(".remove-btn").forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				const id = (e.currentTarget as HTMLElement).getAttribute(
					"data-id"
				);
				if (!id) return;
				await removeFriend(id);
				await loadFriends();
			});
		});
		friendsList.querySelectorAll(".block-btn").forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				const id = (e.currentTarget as HTMLElement).getAttribute(
					"data-id"
				);
				if (!id) return;
				await blockUser(id);
				await removeFriend(id);
				await loadBlockedUsers();
				await loadFriendRequests();
				await loadFriends();
			});
		});
	} catch (error) {
		console.error("Failed to load friends:", error);
	}
}

async function loadBlockedUsers(): Promise<void> {
	const blockedUsersList = document.getElementById("blockedUsersList");
	if (!blockedUsersList) return;
	blockedUsersList.innerHTML = '<div class="text-gray-400">Loading...</div>';
	try {
		const userId = getUserIdFromToken();
		const res = await fetch(`${API_BASE_URL}/users/blocked`, {
			headers: {
				"Accept-Language": getLang(),
				Authorization: `Bearer ${getCookie("jwt")}`,
			},
		});
		const data = await res.json();
		const blocked: Friend[] = Array.isArray(data.blockedUsers)
			? data.blockedUsers
			: [];
		if (blocked.length === 0) {
			blockedUsersList.innerHTML =
				'<div class="text-gray-400">No blocked users.</div>';
			return;
		}
		blockedUsersList.innerHTML = "";
		blocked.forEach((user) => {
			const userDiv = document.createElement("div");
			userDiv.className =
				"flex items-center border border-red-400 rounded px-3 py-2 bg-[#2a2323]";
			userDiv.innerHTML = `
                <span class="text-red-300 flex-1">${user.username}</span>
                <button class="unblock-btn text-green-400 border border-green-400 rounded px-3 py-1 hover:bg-green-400 hover:text-[#001B26] transition" data-id="${user.id}">
                    Unblock
                </button>
            `;
			blockedUsersList.appendChild(userDiv);
		});
		blockedUsersList.querySelectorAll(".unblock-btn").forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				const id = (e.currentTarget as HTMLElement).getAttribute(
					"data-id"
				);
				if (!id) return;
				await unblockUser(id);
				await loadBlockedUsers();
				await loadFriendRequests();
				await loadFriends();
			});
		});
	} catch {
		blockedUsersList.innerHTML =
			'<div class="text-red-400">Failed to load blocked users.</div>';
	}
}

async function unblockUser(userId: string) {
	const endpoint = `${API_BASE_URL}/users/${userId}/block`;
	await fetch(endpoint, {
		method: "DELETE",
		headers: {
			"Accept-Language": getLang(),
			Authorization: `Bearer ${getCookie("jwt")}`,
		},
		credentials: "include",
	});
}

async function loadFriendRequests(): Promise<void> {
	try {
		const res = await fetch(`${API_BASE_URL}/users/friends-requests`, {
			headers: {
				"Accept-Language": getLang(),
				Authorization: `Bearer ${getCookie("jwt")}`,
			},
			credentials: "include",
		});
		const data = await res.json();
		const requests = Array.isArray(data.friendsRequests)
			? data.friendsRequests
			: [];
		const requestsList = document.getElementById("friendRequestsList");
		const noRequests = document.getElementById("noFriendRequests");
		if (!requestsList) return;

		requestsList.innerHTML = "";

		if (requests.length === 0) {
			requestsList.innerHTML = `<div class="text-gray-400 text-sm" id="noFriendRequests">
        ${t("no_friend_requests")}
    </div>`;
			return;
		}
		if (noRequests) noRequests.classList.add("hidden");
		requests.forEach((req: { id: number; username: string }) => {
			const reqDiv = document.createElement("div");
			reqDiv.className =
				"flex items-center justify-between border border-[#4CF190] rounded px-3 py-2 bg-[#002733]";

			reqDiv.innerHTML = `
				<span class="text-[#4CF190] font-semibold">${req.username}</span>
				<div class="flex gap-2">
					<button class="accept-btn text-green-400 hover:text-green-600 text-xl" title="Accept" data-id="${req.id}">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
						</svg>
					</button>
					<button class="reject-btn text-red-400 hover:text-red-600 text-xl" title="Reject" data-id="${req.id}">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
					<button class="block-btn text-yellow-400 hover:text-yellow-600 text-xl" title="Block" data-id="${req.id}">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/>
							<line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" stroke-width="2"/>
						</svg>
					</button>
				</div>
			`;

			requestsList.appendChild(reqDiv);
		});

		// Attach event listeners for accept/reject
		requestsList.querySelectorAll(".accept-btn").forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				const id = (e.currentTarget as HTMLElement).getAttribute(
					"data-id"
				);
				await respondToFriendRequest(id, true);
				await loadFriendRequests();
				await loadFriends();
			});
		});
		requestsList.querySelectorAll(".reject-btn").forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				const id = (e.currentTarget as HTMLElement).getAttribute(
					"data-id"
				);
				await respondToFriendRequest(id, false);
				await loadFriendRequests();
			});
		});
		requestsList.querySelectorAll(".block-btn").forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				const id = (e.currentTarget as HTMLElement).getAttribute(
					"data-id"
				);
				if (!id) return;
				await blockUser(id);
				await loadBlockedUsers();
				await loadFriendRequests();
				await loadFriends();
			});
		});
	} catch (error) {
		console.error("Failed to load friend requests:", error);
	}
}

async function respondToFriendRequest(
	requesterId: string | null,
	accept: boolean
) {
	if (!requesterId) return;
	if (accept) {
		const endpoint = `${API_BASE_URL}/users/${requesterId}/accept-friend`;
		await fetch(endpoint, {
			method: "POST",
			headers: {
				"Accept-Language": getLang(),
				Authorization: `Bearer ${getCookie("jwt")}`,
			},
			credentials: "include",
		});
	} else {
		const endpoint = `${API_BASE_URL}/users/friends/${requesterId}`;
		await fetch(endpoint, {
			method: "DELETE",
			headers: {
				"Accept-Language": getLang(),
				Authorization: `Bearer ${getCookie("jwt")}`,
			},
			credentials: "include",
		});
	}
}

function openInviteModal(friendId: number, friendName: string): void {
	selectedFriendId = friendId;
	selectedFriendName = friendName;
	const inviteFriendName = document.getElementById("inviteFriendName");
	const inviteModal = document.getElementById("inviteModal");
	if (inviteFriendName) inviteFriendName.textContent = friendName;
	if (inviteModal) inviteModal.style.display = "flex";
}

function closeInviteModal(): void {
	const inviteModal = document.getElementById("inviteModal");
	if (inviteModal) inviteModal.style.display = "none";
}

async function inviteToGame(): Promise<void> {
	if (!selectedFriendId) return;

	try {
		const response = await fetch(
			`${API_BASE_URL}/games/invite/${selectedFriendId}`,
			{
				method: "POST",
				headers: {
					"Accept-Language": getLang(),
					Authorization: `Bearer ${getCookie("jwt")}`,
				},
				credentials: "include",
			}
		);

		closeInviteModal();

		if (response.ok) {
			const data = await response.json();
			showMessage("Game invitation sent!", "success");

			// Store the invitation data for potential navigation to play page
			if (data.invitation && data.invitation.game_id) {
				sessionStorage.setItem(
					"pendingGameId",
					data.invitation.game_id
				);
				sessionStorage.setItem("invitationId", data.invitation.id);
			}
		} else {
			const errorData = await response.json();
			showMessage(
				errorData.error || "Failed to send invitation",
				"error"
			);
		}
	} catch (error) {
		closeInviteModal();
		console.error("Error sending game invitation:", error);
		showMessage("Failed to send invitation", "error");
	}
}

function showMessage(text: string, type: "success" | "error"): void {
	const messageId = type === "success" ? "friendInvite" : "friendInputError";
	const msg = document.getElementById(messageId);
	if (!msg) return;

	msg.textContent = text;
	msg.classList.remove("hidden");
	msg.classList.add("show");
	setTimeout(() => {
		msg.classList.remove("show");
		setTimeout(() => msg.classList.add("hidden"), 400);
	}, 2000);
}

async function addFriend(): Promise<void> {
	const input = document.getElementById("friendInput") as HTMLInputElement;
	const friendName = input?.value.trim();
	if (!friendName) return;
	const friend = await fetch(`${API_BASE_URL}/users/username/${friendName}`, {
		headers: {
			"Accept-Language": getLang(),
			Authorization: `Bearer ${getCookie("jwt")}`,
		},
		credentials: "include",
	});

	if (!friend.ok) {
		const errorMsg = document.getElementById("friendInputError");
		let errorText = "Unknown error";
		try {
			const data = await friend.json();
			errorText = data?.error || errorText;
		} catch {
			errorText = friend.statusText || errorText;
		}
		if (errorMsg) {
			errorMsg.textContent = errorText;
			errorMsg.classList.remove("hidden");
			errorMsg.classList.add("show");
			setTimeout(() => {
				errorMsg.classList.remove("show");
				setTimeout(() => errorMsg.classList.add("hidden"), 400);
			}, 2000);
		}
		return;
	}
	const friendData = await friend.json();
	const friendId = friendData?.user?.id;
	const response = await fetch(`${API_BASE_URL}/users/${friendId}/friends`, {
		headers: {
			"Accept-Language": getLang(),
			Authorization: `Bearer ${getCookie("jwt")}`,
		},
		method: "POST",
		credentials: "include",
	});
	if (!response.ok) {
		const errorMsg = document.getElementById("friendInputError");
		let errorText = "Unknown error";
		try {
			const data = await response.json();
			errorText = data?.error || errorText;
		} catch {
			errorText = response.statusText || errorText;
		}
		if (errorMsg) {
			errorMsg.textContent = errorText;
			errorMsg.classList.remove("hidden");
			errorMsg.classList.add("show");
			setTimeout(() => {
				errorMsg.classList.remove("show");
				setTimeout(() => errorMsg.classList.add("hidden"), 400);
			}, 2000);
		}
		return;
	}

	input.value = "";

	const msg = document.getElementById("friendAdded");
	if (!msg) return;
	msg.classList.remove("hidden");
	msg.classList.add("show");
	setTimeout(() => {
		msg.classList.remove("show");
		setTimeout(() => msg.classList.add("hidden"), 400);
	}, 2000);
}

async function loadGameInvitations(): Promise<void> {
	try {
		const response = await fetch(
			`${API_BASE_URL}/games/invitations/pending`,
			{
				headers: {
					"Accept-Language": getLang(),
					Authorization: `Bearer ${getCookie("jwt")}`,
				},
				credentials: "include",
			}
		);

		if (!response.ok) return;

		const data = await response.json();
		const invitations = Array.isArray(data.invitations)
			? data.invitations
			: [];
		displayGameInvitations(invitations);
	} catch (error) {
		console.error("Failed to load game invitations:", error);
	}
}

function displayGameInvitations(invitations: GameInvitation[]): void {
	// Remove any existing invitation notifications
	document
		.querySelectorAll(".game-invitation-notification")
		.forEach((el) => el.remove());

	invitations.forEach((invitation, index) => {
		createInvitationNotification(invitation, index);
	});
}

function createInvitationNotification(
	invitation: GameInvitation,
	index: number
): void {
	const notification = document.createElement("div");
	notification.className =
		"game-invitation-notification fixed top-24 right-8 bg-[#001B26] border-2 border-[#4CF190] rounded-xl p-4 shadow-lg z-50 w-80";
	notification.style.transform = `translateY(${index * 120}px)`;

	notification.innerHTML = `
		<div class="text-[#4CF190] font-bold text-lg mb-2">Game Invitation</div>
		<div class="text-white mb-4">${invitation.inviter_username} invited you to play!</div>
		<div class="flex gap-2">
			<button class="accept-invitation-btn flex-1 bg-[#4CF190] text-[#001B26] py-2 px-4 rounded font-bold hover:bg-[#43d17d] transition" data-invitation-id="${invitation.id}" data-game-id="${invitation.game_id}">
				Accept
			</button>
			<button class="decline-invitation-btn flex-1 bg-red-500 text-white py-2 px-4 rounded font-bold hover:bg-red-600 transition" data-invitation-id="${invitation.id}">
				Decline
			</button>
		</div>
	`;

	document.body.appendChild(notification);

	// Add event listeners
	const acceptBtn = notification.querySelector(
		".accept-invitation-btn"
	) as HTMLButtonElement;
	const declineBtn = notification.querySelector(
		".decline-invitation-btn"
	) as HTMLButtonElement;

	acceptBtn?.addEventListener("click", () =>
		respondToInvitation(invitation.id, invitation.game_id, true)
	);
	declineBtn?.addEventListener("click", () =>
		respondToInvitation(invitation.id, invitation.game_id, false)
	);
}

async function respondToInvitation(
	invitationId: string,
	gameId: string,
	accept: boolean
): Promise<void> {
	try {
		const response = await fetch(
			`${API_BASE_URL}/games/invitation/${invitationId}/respond`,
			{
				method: "POST",
				headers: {
					"Accept-Language": getLang(),
					"Content-Type": "application/json",
					Authorization: `Bearer ${getCookie("jwt")}`,
				},
				credentials: "include",
				body: JSON.stringify({ accept }),
			}
		);

		if (response.ok) {
			// Remove the notification
			document
				.querySelector(`[data-invitation-id="${invitationId}"]`)
				?.closest(".game-invitation-notification")
				?.remove();

			if (accept) {
				const data = await response.json();
				// Store game data in window and navigate to play page
				(window as any).gameData = {
					type: "friend_invite",
					opponentUsername: data.inviterUsername,
					gameId: gameId,
				};
				window.dispatchEvent(new Event("loadPlayPage"));
			} else {
				showMessage("Invitation declined", "success");
			}
		} else {
			const errorData = await response.json();
			showMessage(
				errorData.error || "Failed to respond to invitation",
				"error"
			);
		}
	} catch (error) {
		console.error("Error responding to invitation:", error);
		showMessage("Failed to respond to invitation", "error");
	}
}

async function removeFriend(friendId: string) {
	const endpoint = `${API_BASE_URL}/users/friends/${friendId}`;
	await fetch(endpoint, {
		method: "DELETE",
		headers: {
			"Accept-Language": getLang(),
			Authorization: `Bearer ${getCookie("jwt")}`,
		},
		credentials: "include",
	});
}

async function blockUser(userId: string) {
	const endpoint = `${API_BASE_URL}/users/${userId}/block`;
	await fetch(endpoint, {
		method: "POST",
		headers: {
			"Accept-Language": getLang(),
			Authorization: `Bearer ${getCookie("jwt")}`,
		},
		credentials: "include",
	});
}
