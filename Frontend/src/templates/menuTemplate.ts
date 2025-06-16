export const menuTemplate = `
<div class="min-h-screen w-screen text-white relative overflow-hidden" style="position:relative;">
    <img src="/images/background.png" alt="Background" class="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none select-none" style="min-height:100vh; min-width:100vw;">
    <div class="relative z-10 min-h-screen">
        <!-- Navigation -->
        <nav class="container mx-auto px-4 py-6 flex justify-between items-center">
            <div id="pongTitle" class="text-4xl font-bold text-[#4CF190]" style="cursor:pointer;">Pong</div>
            <div class="relative">
                <button
                    id="userMenuBtn"
                    class="flex items-center gap-2 h-10 bg-green-800 hover:bg-green-700 text-white py-1.5 px-3 rounded focus:outline-none transition min-w-[90px]"
                >
                    <span id="menuUsername">...</span>
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                </button>
                <!-- Dropdown Menu -->
                <div id="userDropdown" class="absolute right-0 mt-2 bg-[#001B26] border border-[#4CF190] rounded shadow-lg py-2 z-50 hidden" style="min-width: 100%;">
                    <button id="gotoProfile" class="block w-full text-left px-4 py-2 hover:bg-[#4CF190] hover:text-[#001B26] transition">Profile</button>
                    <button id="logoutBtn" class="block w-full text-left px-4 py-2 hover:bg-red-500 hover:text-white transition">Logout</button>
                </div>
            </div>
        </nav>
        <!-- Main Content -->
        <div class="container mx-auto px-4 py-16 flex gap-16 justify-center">
            <!-- Left Buttons -->
            <div class="flex flex-col gap-8 items-center pt-8 h-full ml-10">
                <div class="flex flex-col gap-8 w-72">
                    <button id="btnPvAI" class="bg-[#4CF190] text-[#001B26] text-xl px-8 py-4 rounded-md border-4 border-[#001B26] shadow-[4px_4px_0_0_#001B26] hover:bg-[#34c47c] active:scale-95 transition-all duration-75 focus:outline-none w-full">
                        Player vs AI
                    </button>
                    <button id="btnPvP" class="bg-[#4CF190] text-[#001B26] text-xl px-8 py-4 rounded-md border-4 border-[#001B26] shadow-[4px_4px_0_0_#001B26] hover:bg-[#34c47c] active:scale-95 transition-all duration-75 focus:outline-none w-full">
                        Player vs Player
                    </button>
                </div>
                <div class="flex-1"></div>
                <button id="btnTournament" class="bg-yellow-400 text-[#001B26] text-xl px-8 py-4 rounded-md border-4 border-[#001B26] shadow-[4px_4px_0_0_#001B26] hover:bg-yellow-300 active:scale-95 transition-all duration-75 focus:outline-none w-72 mt-12">
                    Tournaments
                </button>
            </div>
            <!-- Center Content -->
            <div class="flex flex-col items-center flex-1">
                <div class="w-full max-w-3xl border-4 border-[#4CF190] rounded-xl p-0 flex flex-col items-center shadow-lg">
                    <div class="w-full flex flex-col items-center pt-8" id="customizationSection">
                        <h2 class="text-2xl font-bold text-[#4CF190] mb-4">Customize Your Game</h2>
                        <div class="flex flex-row flex-wrap justify-center gap-8 w-full">
                            <label class="flex items-center gap-2">
                                <span class="w-24 text-base">Paddle</span>
                                <input id="colorPaddle" type="color" value="#4CF190" class="w-8 h-8 border-none rounded" />
                            </label>
                            <label class="flex items-center gap-2">
                                <span class="w-24 text-base">Ball</span>
                                <input id="colorBall" type="color" value="#4CF190" class="w-8 h-8 border-none rounded" />
                            </label>
                            <label class="flex items-center gap-2">
                                <span class="w-24 text-base">Board</span>
                                <input id="colorBoard" type="color" value="#07303c" class="w-8 h-8 border-none rounded" />
                            </label>
                            <label class="flex items-center gap-2">
                                <span class="w-24 text-base">Board Border</span>
                                <input id="colorBoardBorder" type="color" value="#4CF190" class="w-8 h-8 border-none rounded" />
                            </label>
                        </div>
                    </div>
                    <!-- Game Mockup -->
                    <div class="w-full flex flex-col items-center mb-10 pt-6">
                        <div id="previewBoard" class="relative w-full max-w-[520px] h-[300px] border-8 border-[#4CF190] bg-[#07303c] flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl transition-colors duration-200">
                            <!-- Center dotted line -->
                            <div
                                id="previewDottedLine"
                                class="absolute left-1/2 top-0 -translate-x-1/2 h-full w-2 z-10 pointer-events-none"
                                style="
                                    background: repeating-linear-gradient(
                                        to bottom,
                                        #4CF190 0 8px,
                                        transparent 8px 20px
                                    );
                                    opacity: 0.5;
                                    border-radius: 4px;
                                ">
                            </div>
                            <!-- Paddle -->
                            <div id="previewPaddle" class="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-24 rounded bg-[#4CF190]"></div>
                            <!-- Ball -->
                            <div id="previewBall" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#4CF190]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Tournament Popup Modal -->
        <div id="tournamentModal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 hidden">
            <div class="bg-[#001B26] border-4 border-[#4CF190] rounded-xl p-8 w-full max-w-md flex flex-col items-center shadow-2xl relative">
                <button id="closeTournamentModal" class="absolute top-3 right-4 text-[#4CF190] text-2xl font-bold hover:text-white focus:outline-none">&times;</button>
                <h2 class="text-2xl font-bold text-[#4CF190] mb-6">Tournaments</h2>
                <button id="createTournament" class="w-full mb-4 bg-[#4CF190] text-[#001B26] text-lg font-semibold px-6 py-3 rounded-md border-4 border-[#001B26] shadow-[3px_3px_0_0_#001B26] hover:bg-[#34c47c] active:scale-95 transition-all duration-75">
                    Create New Tournament
                </button>
                <button id="joinTournament" class="w-full bg-[#4CF190] text-[#001B26] text-lg font-semibold px-6 py-3 rounded-md border-4 border-[#001B26] shadow-[3px_3px_0_0_#001B26] hover:bg-[#34c47c] active:scale-95 transition-all duration-75">
                    Join Tournament
                </button>
            </div>
        </div>
        <!-- Create Tournament Modal -->
        <div id="createTournamentModal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 hidden">
            <div class="bg-[#001B26] border-4 border-[#4CF190] rounded-xl p-8 w-full max-w-md flex flex-col items-center shadow-2xl relative">
                <button id="closeCreateTournamentModal" class="absolute top-3 right-4 text-[#4CF190] text-2xl font-bold hover:text-white focus:outline-none">&times;</button>
                <h2 class="text-2xl font-bold text-[#4CF190] mb-6">Create Tournament</h2>
                <form id="createTournamentForm" class="w-full flex flex-col gap-4">
                    <label class="flex flex-col gap-1">
                        <span class="text-white font-semibold">Tournament Name</span>
                        <input type="text" id="tournamentName" required maxlength="32" class="px-3 py-2 rounded bg-[#01222c] border-2 border-[#4CF190] text-white focus:outline-none" />
                    </label>
                    <div class="flex flex-col gap-1">
                        <span class="text-white font-semibold mb-1">Number of Players</span>
                        <div id="playerCountBtns" class="flex gap-4">
                            <button type="button" data-value="4" class="player-count-btn bg-[#4CF190] text-[#001B26] font-bold px-4 py-2 rounded border-2 border-[#001B26] shadow ring-2 ring-[#4CF190]">4</button>
                            <button type="button" data-value="8" class="player-count-btn bg-gray-600 text-white font-bold px-4 py-2 rounded border-2 border-gray-700 shadow">8</button>
                            <button type="button" data-value="16" class="player-count-btn bg-gray-600 text-white font-bold px-4 py-2 rounded border-2 border-gray-700 shadow">16</button>
                        </div>
                        <input type="hidden" id="tournamentPlayers" name="tournamentPlayers" value="4" />
                    </div>
                    <label class="flex flex-col gap-1">
                        <span class="text-white font-semibold">Start Date</span>
                        <input type="date" id="tournamentDate" required class="px-3 py-2 rounded bg-gray-600 border-2 border-[#4CF190] text-white focus:outline-none" />
                    </label>
                    <button type="submit" class="w-full mt-2 bg-[#4CF190] text-[#001B26] text-lg font-semibold px-6 py-3 rounded-md border-4 border-[#001B26] shadow-[3px_3px_0_0_#001B26] hover:bg-[#34c47c] active:scale-95 transition-all duration-75">
                        Create
                    </button>
                </form>
            </div>
        </div>
        <!-- Join Tournament Modal -->
        <div id="joinTournamentModal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 hidden">
            <div class="bg-[#001B26] border-4 border-[#4CF190] rounded-xl p-8 w-full max-w-lg flex flex-col items-center shadow-2xl relative">
                <button id="closeJoinTournamentModal" class="absolute top-3 right-4 text-[#4CF190] text-2xl font-bold hover:text-white focus:outline-none">&times;</button>
                <h2 class="text-2xl font-bold text-[#4CF190] mb-6">Join a Tournament</h2>
                <ul id="tournamentList" class="w-full flex flex-col gap-4">
                    <!-- Tournament items will be injected here -->
                </ul>
            </div>
        </div>
        <!-- PvP Modal -->
        <div id="pvpModal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 hidden">
          <div class="bg-[#001B26] border-4 border-[#4CF190] rounded-xl p-8 w-full max-w-sm flex flex-col items-center shadow-2xl relative">
            <button id="closePvpModal" class="absolute top-3 right-4 text-[#4CF190] text-2xl font-bold hover:text-white focus:outline-none">&times;</button>
            <form id="pvpForm" class="w-full flex flex-col gap-4">
              <label class="flex flex-col gap-1">
                <span class="text-white font-semibold">Opponent Username</span>
                <input type="text" id="pvpOpponent" required maxlength="32" class="px-3 py-2 rounded bg-[#01222c] border-2 border-[#4CF190] text-white focus:outline-none" />
              </label>
              <button type="submit" class="w-full mt-2 bg-[#4CF190] text-[#001B26] text-lg font-semibold px-6 py-3 rounded-md border-4 border-[#001B26] shadow-[3px_3px_0_0_#001B26] hover:bg-[#34c47c] active:scale-95 transition-all duration-75">
                Start Game
              </button>
              <div id="pvpError" class="text-red-400 text-center text-sm mt-2 hidden"></div>
            </form>
          </div>
        </div>
    </div>
</div>
`;