export const tournamentTemplate = `
<div class="relative w-full min-h-screen flex flex-col items-center justify-center">
  <img src="/images/background.png" alt="Background" class="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none select-none">

  <!-- Top Trophy -->
  <div class="fixed top-2 left-1/2 -translate-x-1/2 flex items-center space-x-6 z-50">
    <img src="images/arrow.svg" class="w-6 h-6 rotate-180" alt="arrow">
    <img src="images/trophy.svg" class="w-14 h-14" alt="trophy">
    <img src="images/arrow.svg" class="w-6 h-6" alt="arrow">
  </div>

  <!-- Bracket Container -->
  <div id="bracketContainer" class="relative z-10 flex justify-center items-start w-full max-w-7xl overflow-x-auto py-24 px-6">
    <div id="bracketColumns" class="flex flex-row space-x-16 p-8"></div>
  </div>

  <!-- Start Button -->
  <button id="startMatchesBtn" class="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-2 bg-[#4CF190] text-[#001B26] rounded font-bold border-2 border-[#001B26] hover:bg-[#34c47c] z-50">Start Games</button>

  <!-- Bottom Logo -->
  <div class="fixed left-1/2 -translate-x-1/2 bottom-2 flex flex-col items-center z-50">
    <img src="images/logo.svg" class="w-40 h-40" alt="arcade">
  </div>
</div>
`;
