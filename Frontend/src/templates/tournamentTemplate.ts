export const tournamentTemplate = `
<div class="relative w-full min-h-screen flex flex-col items-center justify-center">
  <img src="/images/background.png" alt="Background" class="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none select-none">

  <!-- Back Button -->
  <button id="backBtn" class="fixed top-6 left-8 px-6 py-2 bg-[#4CF190] text-[#001B26] font-bold border-2 border-[#001B26] hover:bg-[#34c47c] z-50">
    ← Back
  </button>

  <!-- Start Button (Yellow) -->
  <button id="startMatchesBtn" class="fixed top-6 right-8 px-6 py-2 bg-[#FFD700] text-[#001B26] font-bold border-2 border-[#001B26] hover:bg-[#FFC107] z-50">
    Start Games
  </button>

  <!-- Arcade Icon (Bottom Left Corner - Much Bigger) -->
  <img src="images/arcade.svg" class="fixed bottom-0 left-0 w-72 h-72 z-50" alt="arcade">

  <!-- Bracket Container -->
  <div id="bracketContainer" class="relative z-10 flex justify-center items-center w-full max-w-7xl overflow-x-auto py-24 px-6">
    <div id="bracketColumns" class="flex flex-row space-x-16 p-8"></div>
  </div>
</div>
`;
