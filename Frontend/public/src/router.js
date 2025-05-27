const routes = {
	"/": loadHomePage,
	"/profile": loadProfilePage,
	// "/play": loadPlayPage,
	// "/friends": loadFriendsPage,
};

function navigateTo(path) {
	history.pushState({}, "", path); // Update the URL without reloading
	loadRoute(path); // Load the corresponding route
}

console.log("Routes object:", routes);

function loadRoute(path) {
	const route = routes[path] || loadNotFoundPage; // Fallback to a 404 page
	route();
}

window.addEventListener("popstate", () => {
	loadRoute(window.location.pathname); // Handle back/forward navigation
});

// Initial route load
document.addEventListener("DOMContentLoaded", () => {
	loadRoute(window.location.pathname);
});
