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

function handleGoogleSignIn(googleUser) {
	// const width = 500;
	// const height = 600;
	// const left = (window.innerWidth - width) / 2;
	// const top = (window.innerHeight - height) / 2;

	// const popup = window.open(
	// 	"/auth/google",
	// 	"GoogleSignIn",
	// 	`width=${width},height=${height},top=${top},left=${left}`
	// );

	// if (!popup) {
	// 	alert("Please allow popups for this site");
	// 	return;
	// }

	// // Listen for message from popup
	// window.addEventListener("message", function handler(event) {
	// 	console.log("Received message from popup:", event);
	// 	if (event.origin !== window.origin) return;
	// 	if (!event.data || typeof event.data !== "object") return;

	// 	const { token, twofa, userId, error } = event.data;

	// 	if (error) {
	// 		alert("Sign-in failed. Please try again.");
	// 		window.removeEventListener("message", handler);
	// 		return;
	// 	}

	// 	if (!token) {
	// 		alert("Sign-in failed. No token received.");
	// 		window.removeEventListener("message", handler);
	// 		return;
	// 	}

	// 	localStorage.setItem("jwt", token);
	// 	window.removeEventListener("message", handler);

	// 	closeLoginModal();

	// 	if (twofa) {
	// 		openTwoFAModal(userId);
	// 	} else {
	// 		openSetUsernameModal();
	// 	}
	// });
	window.location.href = "/api/auth/google";
}
