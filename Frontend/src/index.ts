import { homeTemplate } from "./templates/homeTemplate.js";
import { loadProfilePage } from "./profile.js";
import { loadTermsPage } from "./terms.js";
import {
  login,
  register,
  usernameGoogle,
  handleGoogleSignIn,
  isAuthenticated,
} from "./utils/auth.js";
import { forohforTemplate } from "./templates/FourOhFour.js";

// Types
interface URLParams {
  token?: string;
  userId?: string;
  twofa?: boolean;
  google_id?: boolean;
}

// DOM Elements
const getElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id) as T;
  if (!element) throw new Error(`Element with id ${id} not found`);
  return element;
};

// Event Handlers
const handleLogin = (): void => {
  const username =
    getElement<HTMLInputElement>("loginUsernameInput").value.trim();
  const password =
    getElement<HTMLInputElement>("loginPasswordInput").value.trim();
  login();
};

const handleRegister = (): void => {
  const username =
    getElement<HTMLInputElement>("loginUsernameInput").value.trim();
  const password =
    getElement<HTMLInputElement>("loginPasswordInput").value.trim();
  register();
};

const handleSetUsername = (): void => {
  const username =
    getElement<HTMLInputElement>("newUsernameInput").value.trim();
  if (!username) return;
  usernameGoogle(username);
  getElement<HTMLInputElement>("newUsernameInput").value = "";
  toggleUsernameLoginButton();
  closeSetUsernameModal();
};

// UI Functions
export const loadHomePage = (): void => {
  if (isAuthenticated()) {
    loadProfilePage(); //TODO: Mudar pag intermedia
    return;
  }
  const app = getElement<HTMLElement>("app");
  app.innerHTML = homeTemplate;

  // Add event listeners
  getElement<HTMLButtonElement>("loginPopupLoginBtn").addEventListener(
    "click",
    handleLogin
  );
  getElement<HTMLButtonElement>("loginPopupSignInBtn").addEventListener(
    "click",
    handleRegister
  );
  getElement<HTMLButtonElement>("googleSignInBtn").addEventListener(
    "click",
    handleGoogleSignIn
  );
  getElement<HTMLButtonElement>("usernameLoginBtn").addEventListener(
    "click",
    handleSetUsername
  );
  getElement<HTMLButtonElement>("termsLink").addEventListener(
    "click",
    loadTermsPage
  );

  // Add input event listeners
  getElement<HTMLInputElement>("loginUsernameInput").addEventListener(
    "input",
    toggleLoginPopupButtons
  );
  getElement<HTMLInputElement>("loginPasswordInput").addEventListener(
    "input",
    toggleLoginPopupButtons
  );
  getElement<HTMLInputElement>("newUsernameInput").addEventListener(
    "input",
    toggleUsernameLoginButton
  );

  // Handle URL parameters
  const params = new URLSearchParams(window.location.search);
  const urlParams: URLParams = {
    token: params.get("token") || undefined,
    userId: params.get("userId") || undefined,
    twofa: params.get("twofa") === "true",
    google_id: params.get("google_id") === "true",
  };

  if (urlParams.token) {
    document.cookie = `jwt=${urlParams.token}; path=/; secure; samesite=lax`;

    if (urlParams.google_id) {
      setTimeout(() => {
        loadProfilePage(); // TODO: CHECK INTERMEDIATE PAGE
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }, 50);
    }

    setTimeout(() => {
      if (urlParams.twofa && urlParams.userId) {
        openTwoFAModal(urlParams.userId);
      } else {
        openSetUsernameModal();
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 0);
  }
};

const openSetUsernameModal = (): void => {
  getElement<HTMLElement>("setUsernameModal").style.display = "flex";
};

const closeSetUsernameModal = (): void => {
  getElement<HTMLElement>("setUsernameModal").style.display = "none";
};

const toggleUsernameLoginButton = (): void => {
  const input = getElement<HTMLInputElement>("newUsernameInput");
  const btn = getElement<HTMLButtonElement>("usernameLoginBtn");
  if (input.value.trim().length > 0) {
    btn.disabled = false;
    btn.classList.remove("disabled");
  } else {
    btn.disabled = true;
    btn.classList.add("disabled");
  }
};

const toggleLoginPopupButtons = (): void => {
  const username =
    getElement<HTMLInputElement>("loginUsernameInput").value.trim();
  const password =
    getElement<HTMLInputElement>("loginPasswordInput").value.trim();
  const loginBtn = getElement<HTMLButtonElement>("loginPopupLoginBtn");
  const signInBtn = getElement<HTMLButtonElement>("loginPopupSignInBtn");
  const enabled = username.length > 0 && password.length > 0;
  loginBtn.disabled = !enabled;
  signInBtn.disabled = !enabled;
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Listen for route events
  // window.addEventListener('loadHomePage', loadHomePage);
  // window.addEventListener('loadProfilePage', loadProfilePage);

  // Load initial route
  loadHomePage();
});

const openTwoFAModal = (userId: string): void => {
  // Implementation needed
};

export const loadNotFoundPage = (): void => {
  const app = getElement<HTMLElement>("app");
  app.innerHTML = forohforTemplate;
  getElement<HTMLButtonElement>("goHomeButton").addEventListener(
    "click",
    loadHomePage
  );
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("loadHomePage", loadHomePage);
  window.addEventListener("loadProfilePage", () => loadProfilePage());
  loadHomePage();
});
