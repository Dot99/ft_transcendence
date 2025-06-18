export const playTemplate = `
<div class="relative w-full h-[600px] flex items-center justify-center">
    <img src="/images/background.png" alt="Background" class="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none select-none" style="min-height:100vh; min-width:100vw;">
  <!-- Top Trophy and Arrows -->
  <div class="fixed top-2 left-1/2 -translate-x-1/2 flex items-center space-x-6 z-50">
    <img src="images/arrow.svg" class="w-6 h-6 rotate-180" alt="arrow">
    <img src="images/trophy.svg" class="w-14 h-14" alt="trophy">
    <img src="images/arrow.svg" class="w-6 h-6" alt="arrow">
  </div>

  <!-- Left Player Panel -->
  <div class="fixed left-10 top-1/2 -translate-y-1/2 flex flex-col items-center w-48 z-30">
    <span id="player-username" class="text-[#4CF190] text-2xl mb-3 w-full text-center">player</span>
    <div id="player-banner" class="border-4 border-[#4CF190] p-1 mb-3 w-28 h-28 flex items-center justify-center transition-all">
        <img id="player-avatar" class="w-24 h-24 rounded" style="display:none;" />
    </div>
    <div class="relative w-36 h-20 flex items-center justify-center mb-2">
        <img src="images/score.svg" class="absolute inset-0 w-full h-full" alt="score" />
        <span id="player-score" class="relative z-10 text-[#EFD671] text-xl flex items-center justify-center w-full h-full text-center" style="margin-left:32px;">09</span>
    </div>
  </div>

  <!-- Right Player Panel -->
  <div class="fixed right-10 top-1/2 -translate-y-1/2 flex flex-col items-center w-48 z-30">
    <span id="bot-username" class="text-[#4CF190] text-2xl mb-3 w-full text-center">Bot</span>
    <div id="bot-banner" class="border-4 border-[#4CF190] p-1 mb-3 w-28 h-28 flex items-center justify-center transition-all">
        <img src="images/robot.svg" alt="Bot" class="w-24 h-24 rounded" />
    </div>
    <div class="relative w-36 h-20 flex items-center justify-center mb-2">
        <img src="images/score.svg" class="absolute inset-0 w-full h-full" alt="score" />
        <span id="bot-score" class="relative z-10 text-[#EFD671] text-xl flex items-center justify-center w-full h-full text-center" style="margin-left:32px;">05</span>
    </div>
  </div>

  <!-- Pong Game Area -->
  <div class="relative w-[850px] h-[500px] border-4 border-[#4CF190] bg-[#07303c] flex items-center justify-center overflow-hidden z-10">
    <div class="absolute left-1/2 top-0 -translate-x-1/2 h-full flex flex-col items-center z-0 pointer-events-none">
      <div class="flex flex-col h-full justify-between py-2">
        ${Array(13).fill('<div class="w-1 h-8 bg-[#4CF190] mb-4 opacity-50"></div>').join('')}
      </div>
    </div>
    <canvas id="pong-canvas" width="850" height="500" class="absolute left-0 top-0 z-10"></canvas>
  </div>

  <!-- Give Up Button (smaller, top right corner, now red) -->
  <button id="giveUpBtn" class="fixed top-6 right-8 px-3 py-1 bg-red-600 text-white rounded font-bold border-2 border-red-800 hover:bg-red-700 z-50 text-xs">Give Up</button>

  <!-- Winner Modal -->
  <div id="winnerModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100] hidden">
    <div class="bg-[#001B26] border-4 border-yellow-400 rounded-xl p-10 flex flex-col items-center shadow-2xl relative max-w-xs text-center">
      <img src="images/trophy.svg" alt="Trophy" class="w-24 h-24 mb-4" />
      <h2 class="text-2xl font-bold text-[#EFD671] mb-2 text-center">Winner!</h2>
      <span id="winnerUsername" class="block text-[#4CF190] text-xl font-bold mb-6 px-6 py-2"></span>
      <div class="flex gap-4 w-full justify-center">
        <button id="playAgainBtn" class="px-6 py-2 bg-[#4CF190] text-[#001B26] rounded font-bold border-2 border-[#001B26] hover:bg-[#34c47c]">Play Again</button>
        <button id="menuBtn" class="px-6 py-2 bg-[#4CF190] text-[#001B26] rounded font-bold border-2 border-[#001B26] hover:bg-[#34c47c]">Menu</button>
      </div>
    </div>
  </div>

  <!-- Give Up Modal (now green, wider) -->
  <div id="giveUpModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[101] hidden">
    <div class="bg-[#001B26] border-4 border-[#4CF190] rounded-xl p-8 flex flex-col items-center shadow-2xl relative w-[420px] max-w-full text-center">
      <h2 class="text-2xl font-bold text-[#4CF190] mb-6">Give Up?</h2>
      <div class="flex gap-4 w-full justify-center">
        <button id="continueGameBtn" class="px-6 py-2 bg-[#4CF190] text-[#001B26] rounded font-bold border-2 border-[#001B26] hover:bg-[#34c47c]">Continue Game</button>
        <button id="giveUpMenuBtn" class="px-6 py-2 bg-[#4CF190] text-[#001B26] rounded font-bold border-2 border-[#001B26] hover:bg-[#34c47c]">Menu</button>
      </div>
    </div>
  </div>

  <!-- Bottom Center Arcade Logo -->
  <div class="fixed left-1/2 -translate-x-1/2 bottom-8 flex flex-col items-center -mb-24 z-50">
    <img src="images/logo.svg" class="w-48 h-48" alt="arcade">
  </div>
</div>
`;