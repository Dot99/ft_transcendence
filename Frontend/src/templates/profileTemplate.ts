export const profileTemplate = `
<div id="deleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
    <div class="bg-[#001B26] p-6 rounded-xl border-2 border-[#4CF190] max-w-md w-full">
        <div class="text-2xl text-[#4CF190] font-bold mb-4">
            Logout
        </div>
        <div class="text-gray-200 mb-4">
            Are you sure you want to delete your account? This action cannot be undone.
        </div>
        <div class="flex justify-end space-x-4">
            <button id="cancelDeleteBtn" class="menu-button px-6 py-2">CANCEL</button>
            <button id="confirmDeleteBtn" class="menu-button px-6 py-2 bg-red-500 hover:bg-red-600">DELETE</button>
        </div>
    </div>
</div>
<div id="twofaQrModal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center hidden z-50">
    <div class="bg-[#001B26] p-6 rounded-xl border-2 border-[#4CF190] max-w-md w-full flex flex-col items-center">
        <div class="text-2xl text-[#4CF190] font-bold mb-4">Scan this QR Code</div>
        <img id="twofaQrImg" src="" alt="2FA QR Code" class="mb-4 max-w-xs rounded border-2 border-[#4CF190]" />
        <button id="closeTwofaQrBtn" class="menu-button px-6 py-2 bg-[#4CF190] text-[#001B26]">CLOSE</button>
    </div>
</div>

<div class="w-screen min-h-screen px-4 py-8 bg-[url(./images/background.png)]">
    <!-- Main Profile Card -->
    <div class="bg-[#001B26] border-2 border-[#4CF190] rounded-xl p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 items-start relative p-4 bg-[rgba(76,241,144,0.03)] rounded-lg min-h-[180px]">
            <!-- Left side - Avatar -->
            <div class="flex flex-col items-center">
                <div class="w-[140px] h-[140px] rounded-full overflow-hidden border-3 border-[#4CF190] shadow-[0_0_20px_rgba(76,241,144,0.2)] bg-[rgba(76,241,144,0.1)]">
                    <img id="pfp" src="" alt="Avatar" class="w-full h-full object-cover" />
                </div>
            </div>

            <!-- Middle - User info -->
            <div class="flex flex-col pt-4 w-full min-w-0">
                <h1 id="name" class="text-[#4CF190] font-['Press_Start_2P'] text-[clamp(1rem,5vw,2rem)] mb-2 whitespace-nowrap w-full text-ellipsis overflow-hidden">Power Guido</h1>
                <h2 id="username" class="text-[#4CF190] font-['Press_Start_2P'] text-xl opacity-80 mb-6">@powerguido</h2>
                <div class="flex items-center gap-4 text-sm">
                    <div id="email" class="font-mono text-white opacity-70">powerguido@gmail.com</div>
                </div>
            </div>

            <!-- Time Played Section -->
            <div class="flex flex-col items-center justify-center gap-2 h-full pr-0 -mr-20 relative top-2">
                <div class="bg-[rgba(239,214,113,0.1)] border border-[#EFD671] p-4 font-['Press_Start_2P'] text-sm text-center whitespace-nowrap text-[#EFD671] mt-4">
                    <span id="hoursPlayed"></span>
                    <span class="text-sm">hours played</span>
                </div>
                <a id="friendsBtn" class="menu-button mt-4">FRIENDS</a>
            </div>
            <!-- Delete and Arcade Section -->
            <div class="flex flex-col items-end h-full relative">
                <div class="absolute bottom-32 right-1.5 flex flex-row-reverse gap-2">
                    <button id="logoutButton" class="menu-button bg-red-800 py-1 px-2 rounded text-black text-[0.65rem] leading-tight flex items-center justify-center h-6 min-w-[70px]">LOGOUT</button>
                    <button id="editProfileBtn" class="menu-button bg-[#4CF190] text-[#001B26] py-1 px-2 rounded text-[0.65rem] leading-tight flex items-center justify-center h-6 min-w-[70px]">EDIT PROFILE</button>
                </div>
                <img src="images/arcade.svg" alt="Arcade" class="w-auto h-[140px] scale-x-[-1] absolute -bottom-4 right-0 z-10" />
            </div>
        </div>
    </div>
    <div id="editProfileModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
        <div class="bg-[#001B26] p-6 rounded-xl border-2 border-[#4CF190] max-w-md w-full">
            <div class="text-2xl text-[#4CF190] font-bold mb-4">Edit Profile</div>
            <form id="editProfileForm" class="space-y-4">
                <div>
                    <label class="block text-[#4CF190] mb-1" for="editUsername">Username</label>
                    <input id="editUsername" name="username" type="text" class="w-full px-3 py-2 rounded bg-[#012733] text-white border border-[#4CF190] focus:outline-none" />
                    <div id="editUsernameError" class="text-red-400 text-xs mt-1"></div>
                </div>
                <div>
                    <label class="block text-[#4CF190] mb-1" for="editPfp">Profile Picture</label>
                    <input id="editPfp" name="pfp" type="text" class="w-full px-3 py-2 rounded bg-[#012733] text-white border border-[#4CF190] focus:outline-none" />
                </div>
                <div id="twofaSection">
                    <!-- 2FA toggle will be injected by JS -->
                </div>

                <!-- DELETE button on top -->
                <div class="flex justify-center mb-4 ">
                    <button type="button" id="deleteAccountBtn" class="bg-red-600 hover:bg-red-700 menu-button px-4 py-2">
                        DELETE ACCOUNT
                    </button>
                </div>

                <!-- EDIT / CANCEL buttons -->
                <div class="flex justify-end space-x-4 pt-2">
                    <button type="button" id="cancelEditProfileBtn" class="bg-red-800 menu-button px-6 py-2">CANCEL</button>
                    <button type="submit" class="menu-button px-6 py-2 bg-[#4CF190] text-[#001B26]">SAVE</button>
                </div>
            </form>
        </div>
    </div>


    <!-- Performance Overview -->
    <div class="bg-[#001B26] border-2 border-[#4CF190] rounded-xl p-6 mb-6">
        <div class="bg-[#4CF190] text-[#001B26] py-2 px-4 mb-4 font-bold">
            <h2 class="text-xl font-bold">Performance Overview</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-[rgba(76,241,144,0.05)] border-2 border-[#4CF190] p-4 rounded-lg">
                <div class="text-gray-400 text-sm mb-2">Matches</div>
                <div id="totalMatches" class="text-2xl text-[#4CF190]"></div>
            </div>
            <div class="bg-[rgba(76,241,144,0.05)] border-2 border-[#4CF190] p-4 rounded-lg">
                <div class="text-gray-400 text-sm mb-2">Wins</div>
                <div id="matchesWon" class="text-2xl text-[#4CF190]"></div>
            </div>
            <div class="bg-[rgba(76,241,144,0.05)] border-2 border-[#4CF190] p-4 rounded-lg">
                <div class="text-gray-400 text-sm mb-2">Losses</div>
                <div id="matchesLost" class="text-2xl text-[#4CF190]"></div>
            </div>
            <div class="bg-[rgba(76,241,144,0.05)] border-2 border-[#4CF190] p-4 rounded-lg">
                <div class="text-gray-400 text-sm mb-2">Avg Score</div>
                <div id="avgScore" class="text-2xl text-[#4CF190]"></div>
            </div>
            <div class="bg-[rgba(76,241,144,0.05)] border-2 border-[#4CF190] p-4 rounded-lg">
                <div class="text-gray-400 text-sm mb-2">Win Streak</div>
                <div id="winStreak" class="text-2xl text-[#4CF190]"></div>
            </div>
            <div class="bg-[rgba(76,241,144,0.05)] border-2 border-[#4CF190] p-4 rounded-lg">
                <div class="text-gray-400 text-sm mb-2">Tournaments Won</div>
                <div id="tournaments" class="text-2xl text-[#4CF190]"></div>
            </div>
        </div>
        <div class="bg-[rgba(76,241,144,0.05)] border-2 border-[#EFD671] p-4 rounded-lg text-center">
            <div class="text-gray-400 text-sm mb-2">🏆 Leaderboard Rank</div>
            <div id="leaderboard" class="text-3xl text-[#EFD671]"></div>
        </div>
    </div>
        <!-- Performance Overview as Chart -->
   <div class="bg-[#001B26] border-2 border-[#4CF190] rounded-xl p-6 mb-6">
  
  <div class="flex flex-col md:flex-row gap-6 mb-6">

    <!-- left chard-->
    <div class="flex-1 flex flex-col">
      <!-- Título estilo "Performance Overview" -->
      <div class="bg-[#4CF190] text-[#001B26] py-2 px-4 mb-4 font-bold rounded-md text-center">
        <h2 class="text-lg md:text-xl">All Time Stats</h2>
      </div>
      <div class="flex-1 flex items-center justify-center">
        <canvas id="doughnutChart" class="max-w-full max-h-full"></canvas>
      </div>
    </div>

    <!-- right chart -->
    <div class="flex-1 flex flex-col">
      <!-- Título estilo "Performance Overview" -->
      <div class="bg-[#4CF190] text-[#001B26] py-2 px-4 mb-4 font-bold rounded-md text-center">
        <h2 class="text-lg md:text-xl">Stats per Tournament</h2>
      </div>
      <div class="flex-1 flex items-center justify-center">
        <canvas id="barChart" class="w-full h-full"></canvas>
      </div>
    </div>

  </div>

</div>

    <!-- Split View -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- LEFT column -->
        <div class="space-y-6">
            <!-- Recent Matches -->
            <div class="bg-[#001B26] border-2 border-[#4CF190] rounded-xl p-6">
                <div class="bg-[#4CF190] text-[#001B26] py-2 px-4 mb-4 font-bold">
                    <h2 class="text-xl font-bold">Recent Matches</h2>
                </div>
                <div id="matchTableBody" class="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-[#4CF190] scrollbar-track-[rgba(76,241,144,0.1)]">
                    <!-- Match entries populated by JS -->
                </div>
            </div>

            <!-- Past Tournaments -->
            <div class="bg-[#001B26] border-2 border-[#4CF190] rounded-xl p-6">
                <div class="bg-[#4CF190] text-[#001B26] py-2 px-4 mb-4 font-bold">
                    <h2 class="text-xl font-bold">Past Tournaments</h2>
                </div>
                <div id="tournamentTableBody" class="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-[#4CF190] scrollbar-track-[rgba(76,241,144,0.1)]">
                    <!-- Past tournaments populated by JS -->
                </div>
            </div>
        </div>

        <!-- RIGHT column -->
        <div class="space-y-6">
            <!-- Upcoming Matches -->
            <div class="bg-[#001B26] border-2 border-[#4CF190] rounded-xl p-6">
                <div class="bg-[#4CF190] text-[#001B26] py-2 px-4 mb-4 font-bold">
                    <h2 class="text-xl font-bold">Upcoming Matches</h2>
                </div>
                <div id="upcomingMatches" class="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-[#4CF190] scrollbar-track-[rgba(76,241,144,0.1)]">
                    <!-- Upcoming matches populated by JS -->
                </div>
            </div>

            <!-- Current Tournament -->
            <div class="bg-[#001B26] border-2 border-[#4CF190] rounded-xl p-6">
                <div class="bg-[#4CF190] text-[#001B26] py-2 px-4 mb-4 font-bold">
                    <h2 class="text-xl font-bold">Current Tournament</h2>
                </div>
                <div class="bg-[rgba(239,214,113,0.1)] border-2 border-[#EFD671] p-4 mb-4 rounded">
                    <div id="currTournamentName" class="text-[#EFD671] text-xl mb-2"></div>
                    <div class="text-sm text-gray-400">
                        Position: <span id="currTournamentPosition" class="text-[#EFD671]"></span>
                    </div>
                </div>
                <div id="currTournamentMatches" class="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-[#4CF190] scrollbar-track-[rgba(76,241,144,0.1)]">
                    <!-- Tournament matches populated by JS -->
                </div>
            </div>
        </div>
    </div>
</div>
</div>
`;
