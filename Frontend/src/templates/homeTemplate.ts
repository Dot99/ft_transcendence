export const homeTemplate = `
<div class="min-h-screen bg-[#001B26] text-white">
    <!-- Navigation -->
    <nav class="container mx-auto px-4 py-6">
        <div class="flex justify-between items-center">
            <div class="text-2xl font-bold text-[#4CF190]">PONG</div>
            <div class="space-x-4">
                <button id="loginBtn" class="menu-button">LOGIN</button>
                <button id="playBtn" class="menu-button">PLAY</button>
                <button id="profileBtn" class="menu-button">PROFILE</button>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="container mx-auto px-4 py-16">
        <div class="text-center">
            <h1 class="text-6xl font-bold text-[#4CF190] mb-6">Welcome to PONG</h1>
            <p class="text-xl text-gray-400 mb-8">The ultimate multiplayer ping pong experience</p>
            <button id="startGameBtn" class="menu-button text-xl px-8 py-4">START GAME</button>
        </div>
    </div>

    <!-- Login Modal -->
    <div id="loginModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
        <div class="bg-[#001B26] p-8 rounded-xl border-2 border-[#4CF190] max-w-md w-full">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl text-[#4CF190] font-bold">Login</h2>
                <button id="closeLoginModalBtn" class="text-gray-400 hover:text-white">&times;</button>
            </div>
            <div class="space-y-4">
                <div>
                    <input type="text" id="loginUsernameInput" placeholder="Username" class="w-full p-2 bg-[#002B3B] border border-[#4CF190] rounded text-white">
                </div>
                <div>
                    <input type="password" id="loginPasswordInput" placeholder="Password" class="w-full p-2 bg-[#002B3B] border border-[#4CF190] rounded text-white">
                </div>
                <div id="loginErrorMsg" class="text-red-500 hidden"></div>
                <div class="flex space-x-4">
                    <button id="loginPopupLoginBtn" class="menu-button flex-1" disabled>LOGIN</button>
                    <button id="loginPopupSignInBtn" class="menu-button flex-1" disabled>SIGN UP</button>
                </div>
                <div class="relative">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-600"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-[#001B26] text-gray-400">Or continue with</span>
                    </div>
                </div>
                <button id="googleSignInBtn" class="w-full p-2 bg-white text-gray-800 rounded flex items-center justify-center space-x-2">
                    <img src="/images/google-icon.png" alt="Google" class="w-5 h-5">
                    <span>Sign in with Google</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Set Username Modal -->
    <div id="setUsernameModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
        <div class="bg-[#001B26] p-8 rounded-xl border-2 border-[#4CF190] max-w-md w-full">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl text-[#4CF190] font-bold">Set Username</h2>
                <button id="closeSetUsernameModalBtn" class="text-gray-400 hover:text-white">&times;</button>
            </div>
            <div class="space-y-4">
                <div>
                    <input type="text" id="newUsernameInput" placeholder="Choose a username" class="w-full p-2 bg-[#002B3B] border border-[#4CF190] rounded text-white">
                </div>
                <button id="usernameLoginBtn" class="menu-button w-full" disabled>SET USERNAME</button>
            </div>
        </div>
    </div>

    <!-- Success Messages -->
    <div id="loginSuccessMsg" class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg transform translate-y-[-100%] opacity-0 transition-all duration-300 hidden">
        Login successful!
    </div>
    <div id="registerSuccessMsg" class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg transform translate-y-[-100%] opacity-0 transition-all duration-300 hidden">
        Registration successful!
    </div>
</div>
`; 