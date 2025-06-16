import { friendsTemplate } from "./templates/friendsTemplate.js";
import { getLang } from "./locales/localeMiddleware.js";
import { getCookie } from "./utils/auth.js";

const API_BASE_URL = "http://localhost:3000/api";

interface Friend {
	id: number;
	username: string;
}

let selectedFriendId: number | null = null;
let selectedFriendName: string | null = null;

export async function loadFriendsPage(): Promise<void> {
	// Render the template
	const app = document.getElementById("app");
	if (!app) return;
	app.innerHTML = friendsTemplate;
	const btn = document.getElementById("backToMenuBtn");
	if (btn) {
		btn.onclick = function () {
			import("./index.js").then((module) => {
				module.loadHomePage();
			});
		};
	}

	// Attach event listeners
	document.getElementById("addFriendBtn")?.addEventListener("click", addFriend);
	document.getElementById("inviteBtn")?.addEventListener("click", inviteToGame);
	document
		.getElementById("cancelInviteBtn")
		?.addEventListener("click", closeInviteModal);

	// Load friends
	await loadFriends();
}

async function loadFriends(): Promise<void> {
	try {
		const res = await fetch(`${API_BASE_URL}/users/friends`, {
			headers: {
				"Accept-Language": getLang(),
				Authorization: `Bearer ${getCookie("jwt")}`,
			},
		});
		const friends: Friend[] = await res.json();
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

function addFriend(): void {
	const input = document.getElementById("friendInput") as HTMLInputElement;
	const friendName = input?.value.trim();
	if (!friendName) return;

	// TODO: Implement add friend logic (API call)

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
