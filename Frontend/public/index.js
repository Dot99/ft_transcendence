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
    <div id="registerSuccessMsg" class="fixed top-6 right-6 px-6 py-4 retro-border text-[#4CF190] bg-[#001B26] z-[1001] hidden">
      Registration successful!
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
        <div class="mt-6 mb-4 w-full flex justify-center items-center">
          <button id="googleSignInBtn" onclick="handleGoogleSignIn()" type="button"
            class="whitespace-nowrap m-3 px-6 shadow-lg shadow-emerald-300 btn btn-ghost inline-flex justify-center items-center rounded-md bg-transparent py-2 text-xs font-semibold text-emerald-500 border-2 border-emerald-300 bg-gray-50 sm:mt-0">
            <svg aria-label="Google icon" class="amplify-icon w-5 h-5 mr-2" viewBox="0 0 256 262"
              xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
              <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                fill="#4285F4" />
              <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                fill="#34A853" />
              <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                fill="#FBBC05" />
              <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                fill="#EB4335" />
            </svg>
            Sign in with Google
          </button>
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
	const loginBtn = document.getElementById("loginPopupLoginBtn");
	const signInBtn = document.getElementById("loginPopupSignInBtn");
	if (loginBtn) {
		loginBtn.removeEventListener("click", login);
		loginBtn.addEventListener("click", login);
	}

	if (signInBtn) {
		signInBtn.removeEventListener("click", register);
		signInBtn.addEventListener("click", register);
	}
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

function showRegisterSuccessTempMsg() {
	closeLoginModal();
	const msg = document.getElementById("registerSuccessMsg");
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
