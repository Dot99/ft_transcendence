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
		if (res.status === 404) return;
		const data = await res.json();
		const friends: Friend[] = Array.isArray(data.friends) ? data.friends : [];
		const friendsList = document.getElementById("friendsList");
		if (!friendsList) return;

		friendsList.innerHTML = "";

		if (friends.length === 0) {
			friendsList.innerHTML = '<div class="text-white">No friends found.</div>';
			return;
		}

		friends.forEach((friend: Friend) => {
			const friendDiv = document.createElement("div");
			friendDiv.className =
				"flex items-center border-2 border-[#4CF190] p-2 space-x-3 w-full cursor-pointer";
			friendDiv.innerHTML = `
        <img src="images/floppy_disk.svg" alt="icon" class="w-5 h-5 text-[#4CF190]" />
        <span class="text-white">${friend.username}</span>
      `;
			friendDiv.onclick = () => openInviteModal(friend.id, friend.username);
			friendsList.appendChild(friendDiv);
		});
	} catch (error) {
		console.error("Failed to load friends:", error);
	}
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
