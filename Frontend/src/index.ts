import { homeTemplate } from './templates/homeTemplate.js';
import { loadProfilePage } from './profile.js';
import { loadTermsPage } from './terms.js';
import { login, register, usernameGoogle, handleGoogleSignIn, isAuthenticated, isTwoFactorEnabled, isGoogleAuthEnabled, getUserIdFromToken, getGoogleFlagFromToken } from './utils/auth.js';
import { forohforTemplate } from './templates/FourOhFour.js';
import { getCookie, deleteCookie } from './utils/auth.js';

const API_BASE_URL = "http://localhost:3000/api"

// DOM Elements
const getElement = <T extends HTMLElement>(id: string): T => {
    const element = document.getElementById(id) as T;
    if (!element) throw new Error(`Element with id ${id} not found`);
    return element;
};

// Event Handlers
const handleLogin = (): void => {
    const username = getElement<HTMLInputElement>('loginUsernameInput').value.trim();
    const password = getElement<HTMLInputElement>('loginPasswordInput').value.trim();
    login();
};

const handleRegister = (): void => {
    const username = getElement<HTMLInputElement>('loginUsernameInput').value.trim();
    const password = getElement<HTMLInputElement>('loginPasswordInput').value.trim();
    register();
};

const handleSetUsername = (): void => {
    const username = getElement<HTMLInputElement>('newUsernameInput').value.trim();
    if (!username) return;
    usernameGoogle(username);
    getElement<HTMLInputElement>('newUsernameInput').value = '';
    toggleUsernameLoginButton();
    closeSetUsernameModal();

};

// UI Functions
export const loadHomePage = (): void => {
    const app = getElement<HTMLElement>('app');
    app.innerHTML = homeTemplate;

    // Add event listeners
    getElement<HTMLButtonElement>('loginPopupLoginBtn').addEventListener('click', handleLogin);
    getElement<HTMLButtonElement>('loginPopupSignInBtn').addEventListener('click', handleRegister);
    getElement<HTMLButtonElement>('googleSignInBtn').addEventListener('click', handleGoogleSignIn);
    getElement<HTMLButtonElement>('usernameLoginBtn').addEventListener('click', handleSetUsername);
    getElement<HTMLButtonElement>('termsLink').addEventListener('click', loadTermsPage);

    // Add input event listeners
    getElement<HTMLInputElement>('loginUsernameInput').addEventListener('input', toggleLoginPopupButtons);
    getElement<HTMLInputElement>('loginPasswordInput').addEventListener('input', toggleLoginPopupButtons);
    getElement<HTMLInputElement>('newUsernameInput').addEventListener('input', toggleUsernameLoginButton);
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
        document.cookie = `jwt=${token}; path=/;`;
        window.history.replaceState({}, '', window.location.pathname);
        return;
    }
    if(!isAuthenticated()) {
        return ;
    }
    if(isTwoFactorEnabled()) {
        const userId = getUserIdFromToken();
        openTwoFAModal(String(userId));
        return;
    }
    
    if(getGoogleFlagFromToken())
    {
        openSetUsernameModal();
        return;
    }
    loadProfilePage();
};


const openSetUsernameModal = (): void => {
    getElement<HTMLElement>('setUsernameModal').style.display = 'flex';
};

const closeSetUsernameModal = (): void => {
    getElement<HTMLElement>('setUsernameModal').style.display = 'none';
};

const toggleUsernameLoginButton = (): void => {
    const input = getElement<HTMLInputElement>('newUsernameInput');
    const btn = getElement<HTMLButtonElement>('usernameLoginBtn');
    if (input.value.trim().length > 0) {
        btn.disabled = false;
        btn.classList.remove('disabled');
    } else {
        btn.disabled = true;
        btn.classList.add('disabled');
    }
};

const toggleLoginPopupButtons = (): void => {
    const username = getElement<HTMLInputElement>('loginUsernameInput').value.trim();
    const password = getElement<HTMLInputElement>('loginPasswordInput').value.trim();
    const loginBtn = getElement<HTMLButtonElement>('loginPopupLoginBtn');
    const signInBtn = getElement<HTMLButtonElement>('loginPopupSignInBtn');
    const enabled = username.length > 0 && password.length > 0;
    loginBtn.disabled = !enabled;
    signInBtn.disabled = !enabled;
};

const openTwoFAModal = (userId: string): void => {
    const modal = getElement<HTMLDivElement>('twoFAModal');
    if (!modal)
    {
        loadHomePage();
        return;
    }
    const input = getElement<HTMLInputElement>('twoFACodeInput');
    const submitBtn = getElement<HTMLButtonElement>('twoFASubmitBtn');
    const errorMsg = getElement<HTMLDivElement>('twoFAErrorMsg');
    modal.style.display = 'flex';
    input.value = '';
    errorMsg.textContent = '';
    errorMsg.classList.add('hidden');
    submitBtn.disabled = true;

    input.oninput = () => {
        submitBtn.disabled = input.value.trim().length !== 6;
    };

    submitBtn.onclick = async () => {
        submitBtn.disabled = true;
        errorMsg.classList.add('hidden');
        try {
            const res = await fetch(`${API_BASE_URL}/2fa/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('jwt')}`,
                },
                body: JSON.stringify({ token: input.value.trim() }),
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                document.cookie = `jwt=${data.token}; path=/;`;
                modal.style.display = 'none';
                loadProfilePage();
            } else {
                const data = await res.json();
                errorMsg.textContent = data.error || 'Invalid code';
                errorMsg.classList.remove('hidden');
                submitBtn.disabled = false;
            }
        } catch {
            errorMsg.textContent = 'Network error';
            errorMsg.classList.remove('hidden');
            submitBtn.disabled = false;
        }
    };
};

export const loadNotFoundPage = (): void => {
    const app = getElement<HTMLElement>('app');
    app.innerHTML = forohforTemplate;
    getElement<HTMLButtonElement>('goHomeButton').addEventListener('click', loadHomePage);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('loadHomePage', loadHomePage);
    window.addEventListener('loadProfilePage', () => loadProfilePage());
    loadHomePage();
});
