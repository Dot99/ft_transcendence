// Types
type RouteHandler = () => void;

interface Routes {
    [key: string]: RouteHandler;
}

// Routes configuration
const routes: Routes = {
    '/': () => {
        const event = new CustomEvent('loadHomePage');
        window.dispatchEvent(event);
    },
    '/profile': () => {
        const event = new CustomEvent('loadProfilePage');
        window.dispatchEvent(event);
    },
    // '/play': loadPlayPage,
    // '/friends': loadFriendsPage,
};

// Navigation functions
export const navigateTo = (path: string): void => {
    history.pushState({}, '', path); // Update the URL without reloading
    loadRoute(path); // Load the corresponding route
};

const loadRoute = (path: string): void => {
    const route = routes[path] || loadNotFoundPage; // Fallback to a 404 page
    route();
};

// 404 handler
const loadNotFoundPage = (): void => {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-screen">
                <h1 class="text-4xl text-[#4CF190] mb-4">404</h1>
                <p class="text-gray-400 mb-8">Page not found</p>
                <button onclick="navigateTo('/')" class="menu-button">Go Home</button>
            </div>
        `;
    }
};

// Event listeners
window.addEventListener('popstate', () => {
    loadRoute(window.location.pathname); // Handle back/forward navigation
});

// Initial route load
document.addEventListener('DOMContentLoaded', () => {
    loadRoute(window.location.pathname);
}); 