const userId = 1;

interface Friend {
  id: number;
  username: string;
}

let selectedFriendId: number | null = null;
let selectedFriendName: string | null = null;

document.addEventListener('DOMContentLoaded', () => {
  loadFriends();

  const addFriendBtn = document.querySelector('#addFriendBtn') as HTMLButtonElement;
  if (addFriendBtn) {
    addFriendBtn.addEventListener('click', addFriend);
  }

  const inviteBtn = document.querySelector('#inviteBtn') as HTMLButtonElement;
  if (inviteBtn) {
    inviteBtn.addEventListener('click', inviteToGame);
  }

  const cancelInviteBtn = document.querySelector('#cancelInviteBtn') as HTMLButtonElement;
  if (cancelInviteBtn) {
    cancelInviteBtn.addEventListener('click', closeInviteModal);
  }
});

async function loadFriends(): Promise<void> {
  try {
    const res = await fetch(`/api/user/${userId}/friends`);
    const friends: Friend[] = await res.json();
    const friendsList = document.getElementById('friendsList');

    if (!friendsList) return;

    friendsList.innerHTML = '';

    if (friends.length === 0) {
      friendsList.innerHTML = '<div class="text-white">No friends found.</div>';
      return;
    }

    friends.forEach(friend => {
      const friendDiv = document.createElement('div');
      friendDiv.className =
        'flex items-center border-2 border-[#4CF190] p-2 space-x-3 w-full cursor-pointer';
      friendDiv.innerHTML = `
        <img src="images/floppy_disk.svg" alt="icon" class="w-5 h-5 text-[#4CF190]" />
        <span class="text-white">${friend.username}</span>
      `;
      friendDiv.onclick = () => openInviteModal(friend.id, friend.username);
      friendsList.appendChild(friendDiv);
    });
  } catch (error) {
    console.error('Failed to load friends:', error);
  }
}

function openInviteModal(friendId: number, friendName: string): void {
  selectedFriendId = friendId;
  selectedFriendName = friendName;
  const inviteFriendName = document.getElementById('inviteFriendName');
  const inviteModal = document.getElementById('inviteModal');

  if (inviteFriendName) inviteFriendName.textContent = friendName;
  if (inviteModal) inviteModal.style.display = 'flex';
}

function closeInviteModal(): void {
  const inviteModal = document.getElementById('inviteModal');
  if (inviteModal) inviteModal.style.display = 'none';
}

function inviteToGame(): void {
  closeInviteModal();
  const invitedMsg = document.getElementById('friendInvite');
  if (!invitedMsg) return;
  invitedMsg.classList.remove('hidden');
  invitedMsg.classList.add('show');
  setTimeout(() => {
    invitedMsg.classList.remove('show');
    setTimeout(() => invitedMsg.classList.add('hidden'), 400);
  }, 2000);
}

function addFriend(): void {
  const input = document.getElementById('friendInput') as HTMLInputElement;
  const friendName = input?.value.trim();
  if (!friendName) return;

  // TODO: Implement add friend logic

  input.value = '';

  const msg = document.getElementById('friendAdded');
  if (!msg) return;
  msg.classList.remove('hidden');
  msg.classList.add('show');
  setTimeout(() => {
    msg.classList.remove('show');
    setTimeout(() => msg.classList.add('hidden'), 400);
  }, 2000);
}
