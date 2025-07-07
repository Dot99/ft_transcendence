import { loadNotFoundPage } from "../index.js";

// Types
type RouteHandler = () => void;

interface Routes {
	[key: string]: RouteHandler;
}

// Routes configuration
const routes: Routes = {
	"/": () => {
		const event = new CustomEvent("loadHomePage");
		window.dispatchEvent(event);
	},
	"/profile": () => {
		const event = new CustomEvent("loadProfilePage");
		window.dispatchEvent(event);
	},
	"/terms": () => {
		const event = new CustomEvent("loadTermsPage");
		window.dispatchEvent(event);
	},
	"/menu": () => {
		const event = new CustomEvent("loadMenuPage");
		window.dispatchEvent(event);
	},
	"/friends": () => {
		const event = new CustomEvent("loadFriendsPage");
		window.dispatchEvent(event);
	},
};

const loadRoute = (path: string): void => {
	const route = routes[path] || loadNotFoundPage; // Fallback to a 404 page
	route();
};

// Event listeners
window.addEventListener("popstate", () => {
	loadRoute(window.location.pathname); // Handle back/forward navigation
});

// Initial route load
document.addEventListener("DOMContentLoaded", () => {
	loadRoute(window.location.pathname);
});
