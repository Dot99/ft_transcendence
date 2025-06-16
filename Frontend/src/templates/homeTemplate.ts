export const homeTemplate = `
<div class="fixed inset-0 min-h-screen min-w-screen bg-[url(./images/background.png)] bg-cover bg-center text-white">
    <!-- Hero Section -->
    <div class="container mx-auto px-4 py-16">
        <div class="text-center">
            <h1 class="text-6xl font-bold text-[#4CF190] mb-6">Welcome to PONG</h1>
            <p class="text-xl text-gray-400 mb-8">The ultimate multiplayer ping pong experience</p>
        </div>
    </div>

    <div class="container mx-auto px-4 py-8 flex justify-center">
        <div class="bg-[#001B26] p-8 rounded-xl border-2 border-[#4CF190] max-w-md w-full">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl text-[#4CF190] font-bold">Login</h2>
                    <select id="langSelector" class="bg-[#002B3B] border border-[#4CF190] text-white rounded px-2 py-1 ml-4">
                        <option value="en">EN</option>
                        <option value="pt">PT</option>
                        <option value="zh">中文</option>
                    </select>
            </div>
            <div class="space-y-4">
                <div>
                    <input type="text" id="loginUsernameInput" placeholder="Username" class="w-full p-2 bg-[#002B3B] border border-[#4CF190] rounded text-white focus:outline-none">
                </div>
                <div>
                    <input type="password" id="loginPasswordInput" placeholder="Password" class="w-full p-2 bg-[#002B3B] border border-[#4CF190] rounded text-white focus:outline-none">
                </div>
                <div id="loginErrorMsg" class="text-red-500 text-sm hidden"></div>
                <div class="flex mb-4 gap-4">
                    <button id="loginPopupLoginBtn" class="flex-1 h-12 bg-green-800 enabled:hover:bg-green-700 text-white py-2 rounded focus:outline-none" disabled>LOGIN</button>
                    <button id="loginPopupSignInBtn" class="flex-1 h-12 bg-green-800 enabled:hover:bg-green-700 text-white py-2 rounded focus:outline-none" disabled>SIGN UP</button>
                </div>
                <div class="text-xs text-gray-400 text-center mb-2">
                    <span id="termsPrefix">By signing up, you agree to our </span>
                    <a id="termsLink" class="underline text-[#4CF190] hover:text-[#38c172]">Terms and Conditions</a>.
                </div>
                <div class="relative mb-2">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-600"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-[#001B26] text-gray-400">Or continue with</span>
                    </div>
                </div>
                <button id="googleSignInBtn" class="w-full p-2 bg-white text-gray-800 rounded flex items-center justify-center space-x-2">
                    <img src="https://www.google.com/favicon.ico" alt="Google" class="w-5 h-5">
                    <span>Sign in with Google</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Two Factor Authentication Modal -->
    <div id="twoFAModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
        <div class="bg-[#001B26] p-8 rounded-xl border-2 border-[#4CF190] max-w-md w-full">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl text-[#4CF190] font-bold">Two-Factor Authentication</h2>
            </div>
            <div class="space-y-4">
                <div>
                    <input type="text" id="twoFACodeInput" placeholder="Enter 2FA code" class="w-full p-2 bg-[#002B3B] border border-[#4CF190] rounded text-white focus:outline-none" maxlength="6" autocomplete="one-time-code">
                </div>
                <div id="twoFAErrorMsg" class="text-red-500 text-sm hidden"></div>
                <button id="twoFASubmitBtn" class="w-full h-12 bg-green-800 enabled:hover:bg-green-700 text-white py-2 rounded" disabled>VERIFY</button>
            </div>
        </div>
    </div>
    <!-- End Two Factor Authentication Modal -->
</div>
`;