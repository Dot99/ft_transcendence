async function login() {
	const username = document.getElementById("loginUsernameInput").value.trim();
	const password = document.getElementById("loginPasswordInput").value.trim();

	try {
		const response = await fetch("/api/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username, password }), // send raw password
		});
		const data = await response.json();
		if (response.ok && data.token) {
			localStorage.setItem("jwt", data.token);
			showLoginSuccessTempMsg?.();
		} else {
			throw new Error("Login failed: " + (data?.message || "Unknown error"));
		}
	} catch (error) {
		console.error("Login failed:", error);
		alert("Login failed. Please try again.");
	}
}

async function register() {
	const username = document.getElementById("loginUsernameInput").value.trim();
	const password = document.getElementById("loginPasswordInput").value.trim();

	try {
		const response = await fetch("/api/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username, password }), // send raw password
		});
		const data = await response.json();
		if (response.ok && data.token) {
			localStorage.setItem("jwt", data.token);
			showRegisterSuccessTempMsg?.();
		} else {
			throw new Error(
				"Registration failed: " + (data?.message || "Unknown error")
			);
		}
	} catch (error) {
		console.error("Registration failed:", error);
		alert("Registration failed. Please try again.");
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
