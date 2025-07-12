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
	"/play": () => {
		const event = new CustomEvent("loadPlayPage");
		window.dispatchEvent(event);
	},
	"/tournament": () => {
		const event = new CustomEvent("loadTournamentPage");
		window.dispatchEvent(event);
	},
};

const loadRoute = (path: string): void => {
	const route = routes[path] || loadNotFoundPage;
	route();
};

// Navigate programmatically and update history
export const navigateTo = (path: string): void => {
	history.pushState(null, "", path);
	loadRoute(path);
};

// Handle back/forward navigation
window.addEventListener("popstate", () => {
	loadRoute(window.location.pathname);
});

// Initial route load only if not already handled
if (!document.readyState || document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => {
		// Only load route if we're not already on a handled page
		if (!window.location.pathname || window.location.pathname === "/") {
			loadRoute(window.location.pathname);
		}
	});
} else {
	// Document is already loaded, check current route
	if (!window.location.pathname || window.location.pathname === "/") {
		loadRoute(window.location.pathname);
	}
}
