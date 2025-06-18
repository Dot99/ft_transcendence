import { friendsTemplate } from "./templates/friendsTemplate.js";
import { getLang } from "./locales/localeMiddleware.js";
import { getCookie, getUserIdFromToken } from "./utils/auth.js";

const API_BASE_URL = "http://localhost:3000/api";

interface Friend {
	id: number;
	username: string;
}

let selectedFriendId: number | null = null;
let selectedFriendName: string | null = null;

export async function loadFriendsPage(): Promise<void> {
	const app = document.getElementById("app");
	if (!app) return;
	app.innerHTML = friendsTemplate;
	document.getElementById("addFriendBtn")?.addEventListener("click", addFriend);
	document.getElementById("inviteBtn")?.addEventListener("click", inviteToGame);
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
	await loadFriends();
	await loadFriendRequests();
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
		const friends: Friend[] = Array.isArray(data.friends) ? data.friends : [];
		const friendsList = document.getElementById("friendsList");
		if (!friendsList) return;

		friendsList.innerHTML = "";
		if (!Array.isArray(data.friends) || friends.length === 0) {
			friendsList.innerHTML =
				'<div class="text-white text-center py-8 text-lg">No friends 😢</div>';
			return;
		}
		friends.forEach((friend: Friend) => {
			const friendDiv = document.createElement("div");
			friendDiv.className =
				"flex items-center border-2 border-[#4CF190] p-4 min-h-[64px] space-x-3 w-full";
			friendDiv.innerHTML = `
				<img src="images/floppy_disk.svg" alt="icon" class="w-5 h-5 text-[#4CF190]" />
				<span class="text-white flex-1">${friend.username}</span>
				<button class="invite-btn text-[#4CF190] border border-[#4CF190] rounded px-3 py-1 hover:bg-[#4CF190] hover:text-[#001B26] transition" data-id="${friend.id}" data-name="${friend.username}">
					Invite
				</button>
				<button class="remove-btn text-yellow-400 border border-yellow-400 rounded px-3 py-1 hover:bg-yellow-400 hover:text-[#001B26] transition" data-id="${friend.id}">
        			Remove
    			</button>
				<button class="block-btn text-red-400 border border-red-400 rounded px-3 py-1 hover:bg-red-400 hover:text-[#001B26] transition" data-id="${friend.id}">
					Block
				</button>
			`;
			friendsList.appendChild(friendDiv);
		});
		friendsList.querySelectorAll(".invite-btn").forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const id = (e.currentTarget as HTMLElement).getAttribute("data-id");
				const name = (e.currentTarget as HTMLElement).getAttribute("data-name");
				if (id && name) openInviteModal(Number(id), name);
			});
		});
		friendsList.querySelectorAll(".remove-btn").forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				const id = (e.currentTarget as HTMLElement).getAttribute("data-id");
				if (!id) return;
				await removeFriend(id);
				await loadFriends();
			});
		});
		friendsList.querySelectorAll(".block-btn").forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				const id = (e.currentTarget as HTMLElement).getAttribute("data-id");
				if (!id) return;
				console.log("Block button clicked, id:", id);
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
				const id = (e.currentTarget as HTMLElement).getAttribute("data-id");
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
				No friend requests. Looks like you're too cool for requests right now 😎
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
				const id = (e.currentTarget as HTMLElement).getAttribute("data-id");
				await respondToFriendRequest(id, true);
				await loadFriendRequests();
				await loadFriends();
			});
		});
		requestsList.querySelectorAll(".reject-btn").forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				const id = (e.currentTarget as HTMLElement).getAttribute("data-id");
				await respondToFriendRequest(id, false);
				await loadFriendRequests();
			});
		});
		requestsList.querySelectorAll(".block-btn").forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				const id = (e.currentTarget as HTMLElement).getAttribute("data-id");
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

function inviteToGame(): void {
	closeInviteModal();
	const invitedMsg = document.getElementById("friendInvite");
	if (!invitedMsg) return;
	invitedMsg.classList.remove("hidden");
	invitedMsg.classList.add("show");
	setTimeout(() => {
		invitedMsg.classList.remove("show");
		setTimeout(() => invitedMsg.classList.add("hidden"), 400);
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
