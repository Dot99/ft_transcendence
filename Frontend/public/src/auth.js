async function login() {
	const username = document.getElementById("loginUsernameInput").value.trim();
	const password = document.getElementById("loginPasswordInput").value.trim();
	const errorElement = document.getElementById("loginErrorMsg");

	try {
		const response = await fetch("/api/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username, password }),
		});
		const data = await response.json();
		if (response.ok && data.token) {
			localStorage.setItem("jwt", data.token);
			closeLoginModal();
			showLoginSuccessTempMsg?.();
			errorElement.textContent = "";
			setTimeout(() => {
				navigateTo("/profile"); //TODO: CHANGE TO INTERMEDIATE PAGE
			}, 50);
		} else {
			throw new Error("Login failed: " + (data?.message || "Unknown error"));
		}
	} catch (error) {
		console.error("Login failed:", error);
		errorElement.textContent = error.message;
		errorElement.style.display = "block";
	}
}

async function register() {
	const username = document.getElementById("loginUsernameInput").value.trim();
	const password = document.getElementById("loginPasswordInput").value.trim();
	const locale = navigator.language || navigator.userLanguage;
	const [lang, country] = locale.split("-");
	const errorElement = document.getElementById("loginErrorMsg");

	try {
		const response = await fetch("/api/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username, password, lang, country }),
		});
		const data = await response.json();
		if (response.ok && data.success) {
			localStorage.setItem("jwt", data.token);
			showRegisterSuccessTempMsg?.();
			errorElement.textContent = "";
			setTimeout(() => {
				navigateTo("/profile"); //TODO: CHANGE TO INTERMEDIATE PAGE
			}, 50);
		} else {
			throw new Error(
				"Registration failed: " + (data?.message || "Unknown error")
			);
		}
	} catch (error) {
		console.error("Registration failed:", error);
		errorElement.textContent = error.message;
		errorElement.style.display = "block";
	}
}

async function logout() {
	try {
		const response = await fetch("/api/logout", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ token: localStorage.getItem("jwt") }),
		});
		if (response.ok) {
			localStorage.removeItem("jwt");
			showLogoutSuccessTempMsg?.();
		} else {
			throw new Error("Logout failed");
		}
	} catch (error) {
		console.error("Logout failed:", error);
		alert("Logout failed. Please try again.");
	}
}

async function usernameGoogle() {
	const username = document.getElementById("newUsernameInput").value.trim();
	const locale = navigator.language || navigator.userLanguage;
	const [lang, country] = locale.split("-");

	try {
		const response = await fetch("/api/register/username", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username,
				lang,
				country,
				token: localStorage.getItem("jwt"),
			}),
		});
		const data = await response.json();
		if (response.ok && data.success) {
			localStorage.setItem("jwt", data.token);
			showRegisterSuccessTempMsg?.();
			setTimeout(() => {
				loadProfilePage(); //TODO: CHECK INTERMEDIATE PAGE
			}, 50);
		} else {
			console.error("Server rejected username:", data.message || data);
			alert(
				"Username registration failed: " + (data.message || "Unknown error")
			);
		}
	} catch (error) {
		console.error("Username registration failed:", error);
	}
}

function handleGoogleSignIn() {
	window.location.href = "/api/auth/google";
}
