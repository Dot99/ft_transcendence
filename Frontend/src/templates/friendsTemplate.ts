export const friendsTemplate = `
<div class="fixed inset-0 min-h-screen min-w-screen bg-[url(./images/background.png)] bg-cover bg-center text-white">
  <!-- Back to Menu Button -->
  <button id="backToMenuBtn" onclick="loadMenuPage()" class="absolute top-8 left-8 flex items-center gap-2 px-5 py-3 rounded border-2 border-[#4CF190] text-[#4CF190] bg-[#001B26] hover:bg-[#4CF190] hover:text-[#001B26] transition-all font-bold z-20">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
    MENU
  </button>
  <!-- Friend Requests Panel -->
  <div class="absolute top-32 left-8 w-80 bg-[#001B26] bg-opacity-80 border-2 border-[#4CF190] rounded-xl shadow-lg p-4 z-10">
    <h2 class="text-2xl text-[#4CF190] font-bold mb-4">Friend Requests</h2>
    <div id="friendRequestsList" class="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-[#4CF190] scrollbar-track-[rgba(76,241,144,0.1)]">
      <!-- Requests will be loaded here -->
      <div class="text-gray-400 text-sm" id="noFriendRequests">No friend requests.</div>
    </div>
  </div>
  <!-- Title -->
  <div class="flex justify-center items-center pt-16">
    <h1 class="text-4xl text-[#4CF190]">FRIENDS</h1>
  </div>
  <!-- Friends List -->
  <div class="flex justify-center mt-8">
    <div class="w-[640px] space-y-3 pr-2 max-h-[calc(100vh/2)] overflow-y-auto scrollbar-thin scrollbar-thumb-[#4CF190] scrollbar-track-[rgba(76,241,144,0.1)]" id="friendsList">
      <!-- Friends will be loaded here -->
    </div>
  </div>
  <!-- Input + Button Container -->
  <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
    <!-- Add Friend Button -->
    <button
      id="addFriendBtn"
      class="menu-button h-14 w-56 text-lg border-2 border-[#4CF190] bg-[#4CF190] text-[#001B26] hover:bg-[#43d17d] hover:border-[#43d17d] transition-all rounded flex items-center justify-center"
    >
      ADD FRIEND
    </button>
    <!-- Input Area -->
    <div class="h-14 rounded flex items-center">
      <div class="border-2 border-[#4CF190] h-full flex items-center px-3 rounded bg-[#001B26] w-56">
        <input
          id="friendInput"
          type="text"
          placeholder="Enter name"
          class="bg-transparent text-[#4CF190] text-center placeholder-[#4CF190] outline-none w-full text-lg tracking-wide"
        />
      </div>
    </div>
    <!-- Error Message -->
    <div id="friendInputError" class="ml-2 text-red-400 text-sm hidden">
      <!-- Error text will be set dynamically -->
    </div>
  </div>
  <!-- Friend Request Sent Notification -->
  <div id="friendAdded" class="fixed bottom-32 left-1/2 transform -translate-x-1/2 bg-[#4CF190] text-[#001B26] px-6 py-3 rounded shadow-lg text-lg font-bold hidden z-50 transition-all" style="min-width: 250px; text-align: center;">
    Friend request sent!
  </div>

  <!-- Invite Modal -->
  <div id="inviteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
    <div class="bg-[#001B26] p-6 rounded-xl border-2 border-[#4CF190] max-w-md w-full">
      <div class="text-2xl text-[#4CF190] font-bold mb-4">
        Invite <span id="inviteFriendName"></span> to play?
      </div>
      <div class="flex justify-end space-x-4">
        <button id="cancelInviteBtn" class="menu-button px-6 py-2">CANCEL</button>
        <button id="inviteBtn" class="menu-button px-6 py-2">INVITE</button>
      </div>
    </div>
  </div>
  <img src="images/computer.svg" class="fixed bottom-14 right-28 w-64 animate-[float_3s_ease-in-out_infinite] z-10" alt="paddle">
  <!-- Blocked Users Panel Trigger & Panel -->
  <div class="absolute top-32 right-8 flex flex-col items-end z-10">
    <button id="toggleBlockedBtn"
      class="flex items-center gap-2 px-5 py-3 rounded border-2 border-red-400 text-red-400 bg-[#001B26] hover:bg-red-400 hover:text-[#001B26] transition-all font-bold"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />
      </svg>
      BLOCKED USERS
    </button>
    <div id="blockedUsersPanel" class="w-80 mt-2 bg-[#001B26] bg-opacity-90 border-2 border-red-400 rounded-xl shadow-lg p-4 hidden">
      <h2 class="text-xl text-red-400 font-bold mb-4">Blocked Users</h2>
      <div id="blockedUsersList" class="space-y-3">
        <!-- Blocked users will be loaded here -->
      </div>
    </div>
  </div>
</div>
`;
