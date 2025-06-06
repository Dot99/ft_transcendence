import { loadHomePage } from './index.js';
import { profileTemplate } from './templates/profileTemplate.js';
import { deleteCookie, getCookie, isAuthenticated } from './utils/auth.js';

// Types
interface UserData {
    username: string;
    email: string;
    avatar: string;
    // Add other user data fields as needed
}

interface StatsData {
    wins: number;
    losses: number;
    rank: number;
    // Add other stats fields as needed
}

// DOM Elements
const getElement = <T extends HTMLElement>(id: string): T => {
    const element = document.getElementById(id) as T;
    if (!element) throw new Error(`Element with id ${id} not found`);
    return element;
};

// Event Handlers
const handleDeleteAccount = (): void => {
    showDeleteModal();
};

const handleCancelDelete = (): void => {
    closeDeleteModal();
};

const handleConfirmDelete = async (): Promise<void> => {
    try {
        const response = await fetch('/api/user/delete', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getCookie('jwt')}`,
            },
        });
        if (response.ok) {
            deleteCookie('jwt');
            loadHomePage()
        } else {
            throw new Error('Failed to delete account');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account. Please try again.');
    }
};

const handleFriendsClick = (): void => {
    console.log("FRIENDS")
    //navigateTo('/friends');
};

// UI Functions
export const loadProfilePage = (): void => {
    if(!isAuthenticated()) {
        console.log("teste");
        loadHomePage();
        return;
    }
    const app = getElement<HTMLElement>('app');
    app.innerHTML = profileTemplate;

    // Add event listeners
    getElement<HTMLButtonElement>('deleteAccountBtn').addEventListener('click', handleDeleteAccount);
    getElement<HTMLButtonElement>('cancelDeleteBtn').addEventListener('click', handleCancelDelete);
    getElement<HTMLButtonElement>('confirmDeleteBtn').addEventListener('click', handleConfirmDelete);
    getElement<HTMLButtonElement>('friendsBtn').addEventListener('click', handleFriendsClick);

    // Load dashboard data
    loadDashboardData();
};

const loadDashboardData = async (): Promise<void> => {
    try {
        const [userResponse, statsResponse] = await Promise.all([
            fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${getCookie('jwt')}`,
                },
            }),
            fetch('/api/user/stats', {
                headers: {
                    'Authorization': `Bearer ${getCookie('jwt')}`,
                },
            }),
        ]);

        if (!userResponse.ok || !statsResponse.ok) {
            throw new Error('Failed to load profile data');
        }

        const userData: UserData = await userResponse.json();
        const statsData: StatsData = await statsResponse.json();

        // Update profile page with user data
        getElement<HTMLElement>('username').textContent = userData.username;
        getElement<HTMLElement>('email').textContent = userData.email;
        getElement<HTMLImageElement>('avatar').src = userData.avatar;

        // Update stats
        getElement<HTMLElement>('wins').textContent = statsData.wins.toString();
        getElement<HTMLElement>('losses').textContent = statsData.losses.toString();
        getElement<HTMLElement>('rank').textContent = statsData.rank.toString();
    } catch (error) {
        console.error('Error loading profile data:', error);
        alert('Failed to load profile data. Please try again.');
    }
};

const showDeleteModal = (): void => {
    getElement<HTMLElement>('deleteModal').style.display = 'flex';
};

const closeDeleteModal = (): void => {
    getElement<HTMLElement>('deleteModal').style.display = 'none';
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Listen for route events
    window.addEventListener('loadProfilePage', loadProfilePage);
}); 