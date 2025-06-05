export const profileTemplate = `
<div id="deleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
    <div class="bg-[#001B26] p-6 rounded-xl border-2 border-[#4CF190] max-w-md w-full">
        <div class="text-2xl text-[#4CF190] font-bold mb-4">
            Delete Account
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

<div class="max-w-7xl mx-auto px-4 py-8">
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
                <button id="deleteAccountBtn" class="menu-button absolute bottom-32 right-1.5">DELETE ACCOUNT</button>
                <img src="images/arcade.svg" alt="Arcade" class="w-auto h-[140px] scale-x-[-1] absolute -bottom-4 right-0 z-10" />
            </div>
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
`; 