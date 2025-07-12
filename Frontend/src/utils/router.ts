import { loadNotFoundPage } from "../index.js";

// Types
type RouteHandler = () => void;

interface Routes {
	[key: string]: RouteHandler;
}

// Import the page load functions directly
import { loadHomePage } from "../index.js";
import { loadMenuPage } from "../menu.js";
import { loadProfilePage } from "../profile.js";
import { loadTermsPage } from "../terms.js";
import { loadFriendsPage } from "../friends.js";
import { loadPlayPage } from "../play.js";
import { loadTournamentPage } from "../tournament.js";
import { isAuthenticated } from "../utils/auth.js";

// Helper function to check authentication for protected routes
const requireAuth = (pageLoader: () => void): void => {
	if (!isAuthenticated()) {
		// User is not authenticated, redirect to login
		history.replaceState(null, "", "/");
		loadHomePage();
		return;
	}
	pageLoader();
};

// Routes configuration - call functions directly instead of dispatching events
const routes: Routes = {
	"/": () => {
		loadHomePage();
	},
	"/profile": () => {
		requireAuth(() => loadProfilePage());
	},
	"/terms": () => {
		loadTermsPage();
	},
	"/menu": () => {
		requireAuth(() => loadMenuPage());
	},
	"/friends": () => {
		requireAuth(() => loadFriendsPage());
	},
	"/play": () => {
		requireAuth(() => loadPlayPage());
	},
	"/tournament": () => {
		requireAuth(() => {
			// Handle tournament with stored ID
			const tournamentId = (window as any).currentTournamentId;
			if (tournamentId) {
				loadTournamentPage(tournamentId);
			} else {
				// If no tournament ID, redirect to menu
				loadMenuPage();
			}
		});
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
// Note: The main DOMContentLoaded handler is in index.ts for authentication
// This only handles cases where the router is imported after DOM is loaded
if (document.readyState === "complete") {
	// Document is already loaded, but only auto-load if no auth system took over
	const currentPath = window.location.pathname;
	if (currentPath !== "/" && !document.querySelector("#app")?.innerHTML) {
		loadRoute(currentPath);
	}
}
