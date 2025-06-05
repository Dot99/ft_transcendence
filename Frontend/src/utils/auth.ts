import { loadProfilePage } from '../profile.js';

// Types
interface LoginResponse {
    token?: string;
    message?: string;
    success?: boolean;
}

interface RegisterResponse {
    token?: string;
    message?: string;
    success?: boolean;
}

// Constants
const API_BASE_URL = 'http://localhost:3000/api';

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
        if (data.token) {
            localStorage.setItem('jwt', data.token);
            closeLoginModal();
            showLoginSuccessTempMsg();
            setInputError(usernameInput, false);
            setInputError(passwordInput, false);
            errorElement.textContent = '';
            setTimeout(() => {
                loadProfilePage();
            }, 50);
        } else {
            throw new Error('Login failed: ' + (data?.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Login failed:', error);
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
            localStorage.setItem('jwt', data.token || '');
            showRegisterSuccessTempMsg();
            setInputError(usernameInput, false);
            setInputError(passwordInput, false);
            errorElement.textContent = '';
            setTimeout(() => {
                loadProfilePage();
            }, 50);
        } else {
            throw new Error(data?.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Registration failed:', error);
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
            body: JSON.stringify({ token: localStorage.getItem('jwt') }),
            credentials: 'include',
        });
        if (response.ok) {
            localStorage.removeItem('jwt');
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
                token: localStorage.getItem('jwt'),
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
        if (data.success) {
            localStorage.setItem('jwt', data.token || '');
            showRegisterSuccessTempMsg();
            setTimeout(() => {
                loadProfilePage();
            }, 50);
        } else {
            throw new Error(data?.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Username registration failed:', error);
        alert(error instanceof Error ? error.message : 'An error occurred');
    }
};

export const handleGoogleSignIn = (): void => {
    // Use the API_BASE_URL constant instead of hardcoding the URL
    window.location.replace(`${API_BASE_URL}/auth/google`);
};

// UI Functions
const closeLoginModal = (): void => {
    const modal = getElement<HTMLElement>('loginModal');
    modal.style.display = 'none';
    getElement<HTMLInputElement>('loginUsernameInput').value = '';
    getElement<HTMLInputElement>('loginPasswordInput').value = '';
};

const showLoginSuccessTempMsg = (): void => {
    const msg = getElement<HTMLElement>('loginSuccessMsg');
    msg.classList.remove('hidden');
    msg.classList.add('show');
    setTimeout(() => {
        msg.classList.remove('show');
        setTimeout(() => {
            msg.classList.add('hidden');
        }, 400);
    }, 2000);
};

const showRegisterSuccessTempMsg = (): void => {
    const msg = getElement<HTMLElement>('registerSuccessMsg');
    msg.classList.remove('hidden');
    msg.classList.add('show');
    setTimeout(() => {
        msg.classList.remove('show');
        setTimeout(() => {
            msg.classList.add('hidden');
        }, 400);
    }, 2000);
};

const showLogoutSuccessTempMsg = (): void => {
    // TODO: Implement logout success message
}; 