import { getLang, t } from "../locales/localeMiddleware.js";
import { stopOnlineWebSocket } from "./ws.js";
import { API_BASE_URL } from "../config.js";

// Helper function to set cookies with appropriate security settings
const setCookieSecure = (name: string, value: string, options: string = "") => {
	// Check if we're on HTTPS or localhost
	const isSecure = window.location.protocol === 'https:' || 
	                 window.location.hostname === 'localhost' || 
	                 window.location.hostname === '127.0.0.1';
	
	const secureFlag = isSecure ? '; secure' : '';
	const sameSiteFlag = isSecure ? '; samesite=lax' : '; samesite=strict';
	
	document.cookie = `${name}=${value}; path=/${secureFlag}${sameSiteFlag}${options ? '; ' + options : ''}`;
};

// Types
interface LoginResponse {
	token?: string;
	message?: string;
	success?: boolean;
	userId?: string | number;
	twofa?: boolean;
	google_id?: string;
}

interface RegisterResponse {
	token?: string;
	message?: string;
	success?: boolean;
	userId?: string | number;
	twofa?: boolean;
	google_id?: string;
}

// DOM Elements
const getElement = <T extends HTMLElement>(id: string): T => {
	const element = document.getElementById(id) as T;
	if (!element) throw new Error(`Element with id ${id} not found`);
	return element;
};

// Authentication functions
const setInputError = (input: HTMLInputElement, hasError: boolean): void => {
	if (hasError) {
		input.classList.remove("border-[#4CF190]");
		input.classList.add("border-red-500", "bg-red-900/20");
	} else {
		input.classList.remove("border-red-500", "bg-red-900/20");
		input.classList.add("border-[#4CF190]");
	}
};

export const login = async (): Promise<void> => {
	const usernameInput = getElement<HTMLInputElement>("loginUsernameInput");
	const passwordInput = getElement<HTMLInputElement>("loginPasswordInput");
	const username = usernameInput.value.trim();
	const password = passwordInput.value.trim();
	const errorElement = getElement<HTMLElement>("loginErrorMsg");

	try {
		const response = await fetch(`${API_BASE_URL}/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept-Language": getLang(),
				Accept: "application/json",
			},
			body: JSON.stringify({ username, password }),
			credentials: "include",
			mode: "cors",
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || response.statusText);
		}
		const data: LoginResponse = await response.json();
		if (data.token) {
			setInputError(usernameInput, false);
			setInputError(passwordInput, false);
			errorElement.textContent = "";
			setCookieSecure('jwt', data.token);
			(window as any).handlePostAuth?.();
		} else {
			throw new Error("Login failed: " + (data?.message || "Unknown error"));
		}
	} catch (error) {
		setInputError(usernameInput, true);
		setInputError(passwordInput, true);
		errorElement.textContent =
			error instanceof Error ? error.message : "An error occurred";
		errorElement.style.display = "block";
	}
};

export const register = async (): Promise<void> => {
	const usernameInput = getElement<HTMLInputElement>("loginUsernameInput");
	const passwordInput = getElement<HTMLInputElement>("loginPasswordInput");
	const username = usernameInput.value.trim();
	const password = passwordInput.value.trim();
	const locale = navigator.language;
	const [lang, country] = locale.split("-");
	const errorElement = getElement<HTMLElement>("loginErrorMsg");

	try {
		if (username.length < 3 || username.length > 20) {
			throw new Error(t("username_limit"));
		}
		//Password must contain at least one number and one letter
		if (!/\d/.test(username) || !/[a-zA-Z]/.test(username)) {
			throw new Error(t("username_restrictions"));
		}
		if (password.length < 6) {
			throw new Error(t("password_limit"));
		}
		const response = await fetch(`${API_BASE_URL}/register`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept-Language": getLang(),
			},
			body: JSON.stringify({ username, password, country }),
			credentials: "include",
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || response.statusText);
		}
		const data: RegisterResponse = await response.json();
		if (data.success) {
			setCookieSecure('jwt', data.token!);
			setInputError(usernameInput, false);
			setInputError(passwordInput, false);
			errorElement.textContent = "";
			(window as any).handlePostAuth?.();
		} else {
			throw new Error(data?.message || "Unknown error");
		}
	} catch (error) {
		setInputError(usernameInput, true);
		setInputError(passwordInput, true);
		errorElement.textContent =
			error instanceof Error ? error.message : "An error occurred";
		errorElement.style.display = "block";
	}
};

export const logout = async (): Promise<void> => {
	try {
		await endSession();
		stopOnlineWebSocket();
		const response = await fetch(`${API_BASE_URL}/logout`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept-Language": getLang(),
			},
			body: JSON.stringify({ token: getCookie("jwt") }),
			credentials: "include",
		});
		if (response.ok) {
			deleteCookie("jwt");
		} else {
			throw new Error("Logout failed");
		}
	} catch (error) {
		console.error("Logout failed:", error);
		alert("Logout failed. Please try again.");
	}
};

//TODO: CHANGE THIS TO BE INGAME
export async function startSession() {
	await fetch(`${API_BASE_URL}/users/session/start`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${getCookie("jwt")}`,
			"Accept-Language": getLang(),
		},
	});
}

export async function endSession() {
	await fetch(`${API_BASE_URL}/users/session/stop`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${getCookie("jwt")}`,
			"Accept-Language": getLang(),
		},
	});
}

export const handleGoogleSignIn = (): void => {
	window.location.replace(`${API_BASE_URL}/auth/google`);
};

export const isAuthenticated = (): boolean => {
	const token = getCookie("jwt");
	return !!token;
};

export const isTwoFactorEnabled = (): boolean => {
	const jwt = getCookie("jwt");
	if (!jwt) return false;
	try {
		const payload = jwt.split(".")[1];
		const decoded = JSON.parse(atob(payload));
		return decoded.twofa_enabled === true && decoded.twofa_verified !== true;
	} catch {
		return false;
	}
};

export function getCookie(name: string): string | undefined {
	const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
	return match ? match[2] : undefined;
}

export function deleteCookie(name: string): void {
	document.cookie = `${name}=; Max-Age=0; path=/;`;
}

export { setCookieSecure };

export function getUserIdFromToken(): number | null {
	const token = getCookie("jwt");
	if (!token) return null;
	try {
		const payload = token.split(".")[1];
		const decoded = JSON.parse(atob(payload));
		return decoded.id || decoded.sub || null;
	} catch {
		return null;
	}
}
