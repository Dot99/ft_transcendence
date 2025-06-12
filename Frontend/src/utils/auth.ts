import { loadProfilePage } from '../profile.js';
import { loadHomePage } from '../index.js';
const API_BASE_URL = "http://localhost:3000/api";

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
        input.classList.remove('border-[#4CF190]');
        input.classList.add('border-red-500', 'bg-red-900/20');
    } else {
        input.classList.remove('border-red-500', 'bg-red-900/20');
        input.classList.add('border-[#4CF190]');
    }
};

export const login = async (): Promise<void> => {
    const usernameInput = getElement<HTMLInputElement>('loginUsernameInput');
    const passwordInput = getElement<HTMLInputElement>('loginPasswordInput');
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const errorElement = getElement<HTMLElement>('loginErrorMsg');

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include',
            mode: 'cors',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || response.statusText);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server did not return JSON');
        }

        const data: LoginResponse = await response.json();
        console.log("data:", data);
        if (data.token) {
            setInputError(usernameInput, false);
            setInputError(passwordInput, false);
            errorElement.textContent = '';
            document.cookie = `jwt=${data.token}; path=/; secure; samesite=lax`;
            loadHomePage();
        } else {
            throw new Error('Login failed: ' + (data?.message || 'Unknown error'));
        }
    } catch (error) {
        setInputError(usernameInput, true);
        setInputError(passwordInput, true);
        errorElement.textContent = error instanceof Error ? error.message : 'An error occurred';
        errorElement.style.display = 'block';
    }
};

export const register = async (): Promise<void> => {
    const usernameInput = getElement<HTMLInputElement>('loginUsernameInput');
    const passwordInput = getElement<HTMLInputElement>('loginPasswordInput');
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const locale = navigator.language;
    const [lang, country] = locale.split('-');
    const errorElement = getElement<HTMLElement>('loginErrorMsg');

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, country }),
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || response.statusText);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server did not return JSON');
        }

        const data: RegisterResponse = await response.json();
        if (data.success) {
            document.cookie = `jwt=${data.token}; path=/; secure; samesite=lax`;
            setInputError(usernameInput, false);
            setInputError(passwordInput, false);
            errorElement.textContent = '';
            document.cookie = `jwt=${data.token}; path=/; secure; samesite=lax`;
            loadHomePage();
        } else {
            throw new Error(data?.message || 'Unknown error');
        }
    } catch (error) {
        setInputError(usernameInput, true);
        setInputError(passwordInput, true);
        errorElement.textContent = error instanceof Error ? error.message : 'An error occurred';
        errorElement.style.display = 'block';
    }
};

export const logout = async (): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: getCookie('jwt') }),
            credentials: 'include',
        });
        if (response.ok) {
            deleteCookie('jwt');
            showLogoutSuccessTempMsg();
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Logout failed:', error);
        alert('Logout failed. Please try again.');
    }
};

export const usernameGoogle = async (username: string): Promise<void> => {
    const locale = navigator.language;
    const [lang, country] = locale.split('-');

    try {
        const response = await fetch(`${API_BASE_URL}/register/username`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                lang,
                country,
                token: getCookie('jwt'),
            }),
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server did not return JSON');
        }

        const data: RegisterResponse = await response.json();
        if (!data.success) {
            throw new Error(data?.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Username registration failed:', error);
        alert(error instanceof Error ? error.message : 'An error occurred');
    }
};

export const handleGoogleSignIn = (): void => {
    window.location.replace(`${API_BASE_URL}/auth/google`);
};

export const isAuthenticated = (): boolean => {
    const token = getCookie('jwt');
    return !!token;
}

export const isTwoFactorEnabled = (): boolean => {
    const jwt = getCookie('jwt');
    if (!jwt) return false;
    try {
        const payload = jwt.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.twofa_enabled === true && decoded.twofa_verified !== true;
    } catch {
        return false;
    }
};

export const isGoogleAuthEnabled = (): boolean => {
    const jwt = getCookie('jwt');
    if (!jwt) return false;
    try {
        const payload = jwt.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return !!decoded.google_id;
    } catch {
        return false;
    }
};

export function getCookie(name: string): string | undefined {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : undefined;
}

export function deleteCookie(name: string): void {
    document.cookie = `${name}=; Max-Age=0; path=/;`;
}

export function getUserIdFromToken(): number | null {
    const token = getCookie('jwt');
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.id || decoded.sub || null;
    } catch {
        return null;
    }
}

export function getGoogleFlagFromToken(): boolean {
    const token = getCookie('jwt');
    if (!token) return false;
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return !!decoded.google_id;
    } catch {
        return false;
    }
}

const showLogoutSuccessTempMsg = (): void => {
    // TODO: Implement logout success message
};