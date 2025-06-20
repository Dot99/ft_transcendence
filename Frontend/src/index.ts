import { homeTemplate } from "./templates/homeTemplate.js";
import { loadTermsPage } from "./terms.js";
import {
	login,
	register,
	handleGoogleSignIn,
	isAuthenticated,
	isTwoFactorEnabled,
	getUserIdFromToken,
	startSession,
} from "./utils/auth.js";
import { forohforTemplate } from "./templates/FourOhFour.js";
import { getCookie, deleteCookie } from "./utils/auth.js";
import { getLang, setLang, t } from "./locales/localeMiddleware.js";
import { loadMenuPage } from "./menu.js";
import { startOnlineWebSocket } from "./utils/ws.js";

const API_BASE_URL = "http://localhost:3000/api";

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

// UI Functions
export const loadHomePage = (): void => {
	const app = getElement<HTMLElement>("app");
	app.innerHTML = homeTemplate;
	const langSelector = document.getElementById(
		"langSelector"
	) as HTMLSelectElement;
	langSelector.value = getLang();
	langSelector.onchange = () => {
		setLang(langSelector.value as any);
		loadHomePage();
	};

	const Title = document.querySelector("h1.text-6xl");
	if (Title) Title.textContent = t("welcome");
	const Subtitle = document.querySelector("p.text-xl");
	if (Subtitle) Subtitle.textContent = t("ultimate_experience");
	const loginHeader = document.querySelector("h2.text-2xl");
	if (loginHeader) loginHeader.textContent = t("login");
	const usernameInput = document.getElementById(
		"loginUsernameInput"
	) as HTMLInputElement;
	if (usernameInput) usernameInput.placeholder = t("username");
	const passwordInput = document.getElementById(
		"loginPasswordInput"
	) as HTMLInputElement;
	if (passwordInput) passwordInput.placeholder = t("password");
	const loginBtn = document.getElementById("loginPopupLoginBtn");
	if (loginBtn) loginBtn.textContent = t("login");
	const signUpBtn = document.getElementById("loginPopupSignInBtn");
	if (signUpBtn) signUpBtn.textContent = t("sign_up");
	const termsPrefix = document.getElementById("termsPrefix");
	if (termsPrefix) termsPrefix.textContent = t("terms_prefix");
	const termsLink = document.getElementById("termsLink");
	if (termsLink) termsLink.textContent = t("terms_link");
	const orContinueSpan = document.querySelector(
		".relative.flex.justify-center.text-sm span"
	);
	if (orContinueSpan) orContinueSpan.textContent = t("or_continue_with");
	const googleBtnSpan = document.querySelector("#googleSignInBtn span");
	if (googleBtnSpan) googleBtnSpan.textContent = t("google_sign_in");
	const twoFATitle = document.querySelector("#twoFAModal h2");
	if (twoFATitle) twoFATitle.textContent = t("two_factor_authentication");
	const twoFAInput = document.getElementById(
		"twoFACodeInput"
	) as HTMLInputElement;
	if (twoFAInput) twoFAInput.placeholder = t("enter_code_placeholder");
	const twoFABtn = document.getElementById("twoFASubmitBtn");
	if (twoFABtn) twoFABtn.textContent = t("verify");

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
	getElement<HTMLButtonElement>("termsLink").addEventListener("click", (e) => {
		e.preventDefault();
		loadTermsPage();
	});

	// Add input event listeners
	getElement<HTMLInputElement>("loginUsernameInput").addEventListener(
		"input",
		toggleLoginPopupButtons
	);
	getElement<HTMLInputElement>("loginPasswordInput").addEventListener(
		"input",
		toggleLoginPopupButtons
	);
	if (!isAuthenticated()) {
		return;
	}
	if (isTwoFactorEnabled()) {
		const userId = getUserIdFromToken();
		openTwoFAModal(String(userId));
		return;
	}
};

const toggleLoginPopupButtons = (): void => {
	const username =
		getElement<HTMLInputElement>("loginUsernameInput").value.trim();
	const password =
		getElement<HTMLInputElement>("loginPasswordInput").value.trim();
	const loginBtn = getElement<HTMLButtonElement>("loginPopupLoginBtn");
	const signInBtn = getElement<HTMLButtonElement>("loginPopupSignInBtn");
	const enabled =
		username.length > 3 && username.length <= 20 && password.length > 0;
	loginBtn.disabled = !enabled;
	signInBtn.disabled = !enabled;
};

const openTwoFAModal = (userId: string): void => {
	const modal = getElement<HTMLDivElement>("twoFAModal");
	if (!modal) {
		loadHomePage();
		return;
	}
	const input = getElement<HTMLInputElement>("twoFACodeInput");
	const submitBtn = getElement<HTMLButtonElement>("twoFASubmitBtn");
	const errorMsg = getElement<HTMLDivElement>("twoFAErrorMsg");
	modal.style.display = "flex";
	input.value = "";
	errorMsg.textContent = "";
	errorMsg.classList.add("hidden");
	submitBtn.disabled = true;

	input.oninput = () => {
		submitBtn.disabled = input.value.trim().length !== 6;
	};

	submitBtn.onclick = async () => {
		submitBtn.disabled = true;
		errorMsg.classList.add("hidden");
		try {
			const res = await fetch(`${API_BASE_URL}/2fa/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getCookie("jwt")}`,
				},
				body: JSON.stringify({ token: input.value.trim() }),
				credentials: "include",
			});
			if (res.ok) {
				const data = await res.json();
				document.cookie = `jwt=${data.token}; path=/;`;
				modal.style.display = "none";
				startOnlineWebSocket();
				startSession();
				loadMenuPage();
			} else {
				const data = await res.json();
				errorMsg.textContent = data.error || "Invalid code";
				errorMsg.classList.remove("hidden");
				submitBtn.disabled = false;
			}
		} catch {
			errorMsg.textContent = "Network error";
			errorMsg.classList.remove("hidden");
			submitBtn.disabled = false;
		}
	};
};

export const loadNotFoundPage = (): void => {
	const app = getElement<HTMLElement>("app");
	app.innerHTML = forohforTemplate;
	getElement<HTMLButtonElement>("goHomeButton").addEventListener(
		"click",
		loadHomePage
	);
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

function handlePostAuth() {
	if (isTwoFactorEnabled()) {
		const userId = getUserIdFromToken();
		loadHomePage();
		setTimeout(() => {
			openTwoFAModal(String(userId));
		}, 0);
		openTwoFAModal(String(userId));
	} else {
		startOnlineWebSocket();
		startSession();
		loadMenuPage();
	}
}
(window as any).handlePostAuth = handlePostAuth;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
	const params = new URLSearchParams(window.location.search);
	const token = params.get("token");
	if (token) {
		document.cookie = `jwt=${token}; path=/;`;
		window.history.replaceState({}, "", window.location.pathname);
		handlePostAuth();
		return;
	}
	if (!isAuthenticated()) {
		loadHomePage();
	} else {
		handlePostAuth();
	}
});

(window as any).loadMenuPage = loadMenuPage;
