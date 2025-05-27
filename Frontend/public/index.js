function loadHomePage() {
	const app = document.getElementById("app");
	app.innerHTML = `<img src="images/arcade.svg" class="fixed left-10 bottom-0.5 w-80 opacity-90" alt="arcade">
    <img src="images/keyboard.svg" class="fixed right-24 top-0.5 w-64 opacity-90" alt="keyboard">
    <img src="images/paddle.svg" class="fixed top-20 left-24 w-16 opacity-90 floating" alt="paddle">
    <img src="images/paddle.svg" class="fixed bottom-20 right-28 w-16 opacity-90 floating" alt="paddle">
    <img src="images/ball.svg" class="fixed bottom-40 right-60 w-12 floating" alt="ball">
  
    <div class="text-center space-y-16 relative">
      <!-- Title -->
      <div class="flex items-center justify-center space-x-4">
        <img src="images/arrow.svg" class="w-8 h-8 -mt-2 rotate-180"  alt="Left Arrow">
        <h1 class="text-6xl text-[#4CF190]">PONG</h1>
        <img src="images/arrow.svg" class="w-8 h-8 -mt-2" alt="Left Arrow">
      </div>
  
      <!-- Buttons -->
      <div class="flex flex-col items-center space-y-6">
        <button onclick="openLoginModal()" class="menu-button w-80 h-20 text-2xl hover:brightness-110 transition-all">LOGIN</button>
        <button onclick="navigateTo('/play')'" class="menu-button w-80 h-20 text-2xl hover:brightness-110 transition-all">PLAY</button>
        <button onclick="navigateTo('/profile')" class="menu-button w-80 h-20 text-2xl hover:brightness-110 transition-all">PROFILE</button>
      </div>
    </div>
  
    <!-- Temporary login success message -->
    <div id="loginSuccessMsg" class="fixed top-6 right-6 px-6 py-4 retro-border text-[#4CF190] bg-[#001B26] z-[1001] hidden">
      Login successful!
    </div>
  
    <!-- Login Modal -->
    <div id="loginModal" class="centered-modal hidden">
      <div class="modal-content p-12 pt-16 rounded-xl flex flex-col items-center justify-center relative">
        <button
          class="absolute -top-3 right-4 close-x-btn"
          onclick="closeLoginModal()"
          aria-label="Close"
          type="button"
        >&#10005;</button>
        <h2 class="text-3xl text-[#4CF190] mb-4 font-bold text-center">Login</h2>
        <div class="w-full flex flex-col space-y-4">
          <input
            type="text"
            id="loginUsernameInput"
            placeholder="Username"
            class="login-input border-2 border-[#4CF190] bg-transparent text-[#4CF190] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#4CF190] px-4 py-2 rounded transition-colors"
            oninput="toggleLoginPopupButtons()"
          />
          <input
            type="password"
            id="loginPasswordInput"
            placeholder="Password"
            class="login-input border-2 border-[#4CF190] bg-transparent text-[#4CF190] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#4CF190] px-4 py-2 rounded transition-colors"
            oninput="toggleLoginPopupButtons()"
          />
        </div>
        <!-- Login and Sign In buttons in the login popup -->
        <div class="flex w-full justify-between mt-10 space-x-8">
          <button
            id="loginPopupLoginBtn"
            class="menu-button flex-1 h-20 text-base py-2"
            style="min-width:0;"
            onclick="login()"
            disabled
          >Login</button>
          <button
            id="loginPopupSignInBtn"
            class="menu-button flex-1 h-20 text-base py-2"
            style="min-width:0;"
            onclick="register()"
            disabled
          >Sign In</button>
        </div>
        <p id="loginErrorMsg" class="text-red-500 text-sm mt-4 hidden"></p>
        <div class="flex items-center justify-center w-full mt-10 google-signin-btn">
          <img
            src="images/google_signin.svg"
            alt="Google Sign In"
            class="h-16 cursor-pointer hover:scale-105 transition-transform"
            id="googleSignInBtn"
            onclick="handleGoogleSignIn()"
          />
        </div>
      </div>
    </div>
  
    <!-- Set Username Modal -->
    <div id="setUsernameModal" class="centered-modal hidden">
      <div class="modal-content p-12 pt-16 rounded-xl flex flex-col items-center justify-center relative" style="max-width:200px; min-width:140px;">
        <h2 class="text-2xl text-[#4CF190] mb-8 font-bold text-center">Set username</h2>
        <input
          type="text"
          id="newUsernameInput"
          placeholder="Enter username"
          class="w-80 login-input border-2 border-[#4CF190] bg-transparent text-[#4CF190] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#4CF190] px-4 py-2 rounded transition-colors mb-8"
          oninput="toggleUsernameLoginButton()"
        />
        <button
          id="usernameLoginBtn"
          class="menu-button w-full h-16 text-base py-2"
          onclick="finishSetUsername()"
          disabled
        >Login</button>
      </div>
    </div>
  `;

	// Add event listeners for modals
	document
		.getElementById("loginPopupLoginBtn")
		.addEventListener("click", login);
	document
		.getElementById("loginPopupSignInBtn")
		.addEventListener("click", register);
}

function openLoginModal() {
	document.getElementById("loginModal").style.display = "flex";
}

function closeLoginModal() {
	document.getElementById("loginModal").style.display = "none";
	document.getElementById("loginUsernameInput").value = "";
	document.getElementById("loginPasswordInput").value = "";
	toggleLoginPopupButtons(); // Reset button state
}

function handleGoogleSignIn() {
	// TODO: Google sign-in logic
	closeLoginModal();
	openSetUsernameModal();
}

function mockLogin() {
	// TODO: Login logic
	showLoginSuccessTempMsg();
}
function mockSignIn() {
	// TODO: Sign in logic
	showLoginSuccessTempMsg();
}

function showLoginSuccessTempMsg() {
	closeLoginModal();
	const msg = document.getElementById("loginSuccessMsg");
	msg.classList.remove("hidden");
	msg.classList.add("show");
	setTimeout(() => {
		msg.classList.remove("show");
		setTimeout(() => {
			msg.classList.add("hidden");
		}, 400);
	}, 2000);
}

// Set Username Modal logic
function openSetUsernameModal() {
	document.getElementById("setUsernameModal").style.display = "flex";
}
function closeSetUsernameModal() {
	document.getElementById("setUsernameModal").style.display = "none";
}
function toggleUsernameLoginButton() {
	const input = document.getElementById("newUsernameInput");
	const btn = document.getElementById("usernameLoginBtn");
	if (input.value.trim().length > 0) {
		btn.disabled = false;
		btn.classList.remove("disabled");
	} else {
		btn.disabled = true;
		btn.classList.add("disabled");
	}
}
function finishSetUsername() {
	// TODO: Save username logic
	document.getElementById("newUsernameInput").value = "";
	toggleUsernameLoginButton(); // Reset button state
	closeSetUsernameModal();
	showLoginSuccessTempMsg();
}

function toggleLoginPopupButtons() {
	const username = document.getElementById("loginUsernameInput").value.trim();
	const password = document.getElementById("loginPasswordInput").value.trim();
	const loginBtn = document.getElementById("loginPopupLoginBtn");
	const signInBtn = document.getElementById("loginPopupSignInBtn");
	const enabled = username.length > 0 && password.length > 0;
	loginBtn.disabled = !enabled;
	signInBtn.disabled = !enabled;
}

// Initialize the home page
document.addEventListener("DOMContentLoaded", () => {
	loadHomePage();
});
