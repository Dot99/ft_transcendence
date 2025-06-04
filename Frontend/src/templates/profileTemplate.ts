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
        <div class="flex flex-col md:flex-row items-center justify-between">
            <!-- Left side - Avatar -->
            <div class="mb-6 md:mb-0">
                <div class="w-32 h-32 rounded-full overflow-hidden border-2 border-[#4CF190]">
                    <img id="pfp" src="" alt="Avatar" class="w-full h-full object-cover" />
                </div>
            </div>

            <!-- Middle - User info -->
            <div class="text-center md:text-left mb-6 md:mb-0">
                <h1 id="name" class="text-3xl font-bold text-[#4CF190] mb-2">Power Guido</h1>
                <h2 id="username" class="text-xl text-gray-400 mb-4">@powerguido</h2>
                <div class="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
                    <div id="email" class="text-gray-300">powerguido@gmail.com</div>
                    <div class="flex items-center space-x-2">
                        <img id="flag" src="" alt="Flag" class="w-6 h-5 rounded-sm border border-[#4CF190]" />
                        <span id="country" class="text-sm text-gray-400">PT</span>
                    </div>
                </div>
            </div>

            <!-- Right side - Stats -->
            <div class="text-center">
                <div class="mb-4">
                    <span id="hoursPlayed" class="text-2xl text-[#4CF190]"></span>
                    <span class="text-sm text-gray-400">hours played</span>
                </div>
                <a id="friendsBtn" class="menu-button block">FRIENDS</a>
            </div>
        </div>

        <!-- Delete Account Button -->
        <div class="mt-6 flex justify-end">
            <button id="deleteAccountBtn" class="menu-button bg-red-500 hover:bg-red-600">DELETE ACCOUNT</button>
        </div>
    </div>

    <!-- Performance Overview -->
    <div class="bg-[#001B26] border-2 border-[#4CF190] rounded-xl p-6 mb-6">
        <h2 class="text-2xl font-bold text-[#4CF190] mb-6">Performance Overview</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-[#002B3B] p-4 rounded-lg">
                <div class="text-gray-400 text-sm mb-2">Matches</div>
                <div id="totalMatches" class="text-2xl text-[#4CF190]"></div>
            </div>
            <div class="bg-[#002B3B] p-4 rounded-lg">
                <div class="text-gray-400 text-sm mb-2">Wins</div>
                <div id="matchesWon" class="text-2xl text-[#4CF190]"></div>
            </div>
            <div class="bg-[#002B3B] p-4 rounded-lg">
                <div class="text-gray-400 text-sm mb-2">Losses</div>
                <div id="matchesLost" class="text-2xl text-[#4CF190]"></div>
            </div>
            <div class="bg-[#002B3B] p-4 rounded-lg">
                <div class="text-gray-400 text-sm mb-2">Avg Score</div>
                <div id="avgScore" class="text-2xl text-[#4CF190]"></div>
            </div>
            <div class="bg-[#002B3B] p-4 rounded-lg">
                <div class="text-gray-400 text-sm mb-2">Win Streak</div>
                <div id="winStreak" class="text-2xl text-[#4CF190]"></div>
            </div>
            <div class="bg-[#002B3B] p-4 rounded-lg">
                <div class="text-gray-400 text-sm mb-2">Tournaments Won</div>
                <div id="tournaments" class="text-2xl text-[#4CF190]"></div>
            </div>
        </div>
        <div class="bg-[#002B3B] p-4 rounded-lg text-center border-2 border-yellow-400">
            <div class="text-gray-400 text-sm mb-2">🏆 Leaderboard Rank</div>
            <div id="leaderboard" class="text-3xl text-yellow-400"></div>
        </div>
    </div>

    <!-- Split View -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- LEFT column -->
        <div class="space-y-6">
            <!-- Recent Matches -->
            <div class="bg-[#001B26] border-2 border-[#4CF190] rounded-xl p-6">
                <h2 class="text-2xl font-bold text-[#4CF190] mb-4">Recent Matches</h2>
                <div id="matchTableBody" class="space-y-2 max-h-96 overflow-y-auto">
                    <!-- Match entries populated by JS -->
                </div>
            </div>

            <!-- Past Tournaments -->
            <div class="bg-[#001B26] border-2 border-[#4CF190] rounded-xl p-6">
                <h2 class="text-2xl font-bold text-[#4CF190] mb-4">Past Tournaments</h2>
                <div id="tournamentTableBody" class="space-y-2 max-h-96 overflow-y-auto">
                    <!-- Past tournaments populated by JS -->
                </div>
            </div>
        </div>

        <!-- RIGHT column -->
        <div class="space-y-6">
            <!-- Upcoming Matches -->
            <div class="bg-[#001B26] border-2 border-[#4CF190] rounded-xl p-6">
                <h2 class="text-2xl font-bold text-[#4CF190] mb-4">Upcoming Matches</h2>
                <div id="upcomingMatches" class="space-y-2 max-h-96 overflow-y-auto">
                    <!-- Upcoming matches populated by JS -->
                </div>
            </div>

            <!-- Current Tournament -->
            <div class="bg-[#001B26] border-2 border-[#4CF190] rounded-xl p-6">
                <h2 class="text-2xl font-bold text-[#4CF190] mb-4">Current Tournament</h2>
                <div class="mb-4">
                    <div id="currTournamentName" class="text-xl text-[#4CF190]"></div>
                    <div class="text-sm text-gray-400">
                        Position: <span id="currTournamentPosition" class="text-yellow-400"></span>
                    </div>
                </div>
                <div id="currTournamentMatches" class="space-y-2 max-h-96 overflow-y-auto">
                    <!-- Tournament matches populated by JS -->
                </div>
            </div>
        </div>
    </div>
</div>
`; 