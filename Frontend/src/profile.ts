import { loadHomePage } from "./index.js";
import { profileTemplate } from "./templates/profileTemplate.js";
import { deleteCookie, getCookie, getUserIdFromToken } from "./utils/auth.js";
import { getLang, setLang, t } from "./locales/localeMiddleware.js";
import { loadFriendsPage } from "./friends.js";
import { loadMenuPage } from "./menu.js";
import { stopOnlineWebSocket } from "./utils/ws.js";
import { API_BASE_URL } from "./config.js";

interface User {
    username: string;
    email: string;
    country: string;
    name: string;
    pfp?: string;
    total_play_time: number;
}

interface Stats {
    total_matches: number;
    matches_won: number;
    matches_lost: number;
    average_score: number;
    win_streak_max: number;
    tournaments_won: number;
    leaderboard_position: number;
    current_tournament: number;
}

interface Match {
    scheduled_date: string | number | Date;
    player1: number;
    player2: number;
    player1_score: number;
    player2_score: number;
    match_date: string;
    winner?: number;
}

interface Tournament {
    tournament_id: number;
    tournament_name: string;
    tournament_date: string;
}

const getElement = <T extends HTMLElement>(id: string): T => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found`);
    return el as T;
};

function translateMenuStaticTexts() {
    // === TRANSLATION STATIC TEXTS ===
    // Delete Modal
    const deleteModalTitle = document.querySelector("#deleteModal .text-2xl");
    if (deleteModalTitle) deleteModalTitle.textContent = t("delete_account");
    const deleteModalMsg = document.querySelector(
        "#deleteModal .text-gray-200"
    );
    if (deleteModalMsg)
        deleteModalMsg.textContent = t("delete_account_confirmation");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    if (cancelDeleteBtn) cancelDeleteBtn.textContent = t("cancel");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    if (confirmDeleteBtn) confirmDeleteBtn.textContent = t("confirm");

    // 2FA QR Modal
    const qrTitle = document.querySelector("#twofaQrModal .text-2xl");
    if (qrTitle) qrTitle.textContent = t("qrcode_scan");
    const closeTwofaQrBtn = document.getElementById("closeTwofaQrBtn");
    if (closeTwofaQrBtn) closeTwofaQrBtn.textContent = t("close");

    // Main Profile Card
    const hoursPlayedLabel = document.getElementById("hoursPlayedLabel");
    if (hoursPlayedLabel) hoursPlayedLabel.textContent = t("hours_played");
    const friendsBtn = document.getElementById("friendsBtn");
    if (friendsBtn) {
        friendsBtn.textContent = t("friends");
        friendsBtn.onclick = () => loadFriendsPage();
    }

    // Top-right buttons
    const logoutBtn = document.getElementById("logoutButton");
    if (logoutBtn) logoutBtn.textContent = t("logout");
    const editProfileBtn = document.getElementById("editProfileBtn");
    if (editProfileBtn) editProfileBtn.textContent = t("edit_profile");

    // Edit Profile Modal
    const editProfileTitle = document.querySelector(
        "#editProfileModal .text-2xl"
    );
    if (editProfileTitle) editProfileTitle.textContent = t("edit_profile");
    const editUsernameLabel = document.querySelector(
        "label[for='editUsername']"
    );
    if (editUsernameLabel) editUsernameLabel.textContent = t("username");
    const editPfpLabel = document.querySelector("label[for='editPfp']");
    if (editPfpLabel) editPfpLabel.textContent = t("pfp");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    if (deleteAccountBtn) deleteAccountBtn.textContent = t("delete_account");
    const cancelEditProfileBtn = document.getElementById(
        "cancelEditProfileBtn"
    );
    if (cancelEditProfileBtn) cancelEditProfileBtn.textContent = t("cancel");
    const saveBtn = document.querySelector(
        "#editProfileModal button[type='submit']"
    );
    if (saveBtn) saveBtn.textContent = t("save");

    // Performance Overview
    const overviewTitle = document.getElementById("overviewTitle");
    if (overviewTitle) overviewTitle.textContent = t("overview");
    const matchesLabel = document
        .querySelector("#totalMatches")
        ?.parentElement?.querySelector(".text-gray-400");
    if (matchesLabel) matchesLabel.textContent = t("matches");
    const winsLabel = document
        .querySelector("#matchesWon")
        ?.parentElement?.querySelector(".text-gray-400");
    if (winsLabel) winsLabel.textContent = t("wins");
    const lossesLabel = document
        .querySelector("#matchesLost")
        ?.parentElement?.querySelector(".text-gray-400");
    if (lossesLabel) lossesLabel.textContent = t("losses");
    const avgScoreLabel = document
        .querySelector("#avgScore")
        ?.parentElement?.querySelector(".text-gray-400");
    if (avgScoreLabel) avgScoreLabel.textContent = t("avg_score");
    const winStreakLabel = document
        .querySelector("#winStreak")
        ?.parentElement?.querySelector(".text-gray-400");
    if (winStreakLabel) winStreakLabel.textContent = t("win_streak");
    const tournamentsLabel = document
        .querySelector("#tournaments")
        ?.parentElement?.querySelector(".text-gray-400");
    if (tournamentsLabel) tournamentsLabel.textContent = t("tournaments_win");
    const leaderboardLabel = document.getElementById("leaderboardLabel");
    if (leaderboardLabel)
        leaderboardLabel.textContent = "🏆 " + t("leaderboard_rank");

    // Chart Titles
    const allTimeStatsTitle = document.getElementById("allTimeStatsTitle");
    if (allTimeStatsTitle) allTimeStatsTitle.textContent = t("all_time_stats");
    const statsPerTournamentTitle = document.getElementById(
        "statsPerTournamentTitle"
    );
    if (statsPerTournamentTitle)
        statsPerTournamentTitle.textContent = t("stats_per_tournament");

    // Recent Matches, Past Tournaments, Upcoming Matches, Current Tournament
    const recentMatchesTitle = document.getElementById("recentMatchesTitle");
    if (recentMatchesTitle)
        recentMatchesTitle.textContent = t("recent_matches");
    const pastTournamentsTitle = document.getElementById(
        "pastTournamentsTitle"
    );
    if (pastTournamentsTitle)
        pastTournamentsTitle.textContent = t("tournament_past");
    const upcomingMatchesTitle = document.getElementById(
        "upcomingMatchesTitle"
    );
    if (upcomingMatchesTitle)
        upcomingMatchesTitle.textContent = t("upcoming_matches");
    const currentTournamentTitle = document.getElementById(
        "currentTournamentTitle"
    );
    if (currentTournamentTitle)
        currentTournamentTitle.textContent = t("current_tournament");

    // Current Tournament Position
    const currTournamentPositionLabel = document.querySelector(
        "#currTournamentPosition"
    )?.parentElement;
    if (currTournamentPositionLabel) {
        currTournamentPositionLabel.innerHTML =
            t("position") +
            ': <span id="currTournamentPosition" class="text-[#EFD671]"></span>';
    }
    // === END TRANSLATE STATIC TEXTS ===
}

// Event Handlers
const handleDeleteAccount = (): void => {
    closeEditProfileModal();
    showDeleteModal();
};

const handleLogout = (): void => {
    deleteCookie("jwt");
    stopOnlineWebSocket();
    loadHomePage();
};

const handleFriendsClick = (): void => {
    loadFriendsPage();
};

const handleCancelDelete = (): void => {
    closeDeleteModal();
};

export const loadProfilePage = (pushState: boolean = true): void => {
    const app = getElement<HTMLElement>("app");
    app.innerHTML = profileTemplate;

    const homeBtn = document.getElementById("homeBtn");
    if (homeBtn) {
        const homeText = homeBtn.querySelector("span.text-base");
        if (homeText) homeText.textContent = t("home");
        homeBtn.onclick = () => loadMenuPage();
    }
    getElement<HTMLButtonElement>("deleteAccountBtn").addEventListener(
        "click",
        handleDeleteAccount
    );
    getElement<HTMLButtonElement>("logoutButton").addEventListener(
        "click",
        handleLogout
    );
    loadDashboardData();
    renderPerformanceChart();
};

const getOpponentId = (match: Match, userId: number): number => {
    return match.player1 === userId ? match.player2 : match.player1;
};

let isLoadingDashboard = false;

async function loadDashboardData(): Promise<void> {
    if (isLoadingDashboard) {
        return;
    }
    translateMenuStaticTexts();
    isLoadingDashboard = true;
    // Initialize stats to default values
    getElement<HTMLDivElement>("totalMatches").textContent = "0";
    getElement<HTMLDivElement>("matchesWon").textContent = "0";
    getElement<HTMLDivElement>("matchesLost").textContent = "0";
    getElement<HTMLDivElement>("avgScore").textContent = "0";
    getElement<HTMLDivElement>("winStreak").textContent = "0";
    getElement<HTMLDivElement>("tournaments").textContent = "0";
    getElement<HTMLDivElement>("leaderboard").textContent = "0";

    const userId = getUserIdFromToken();
    if (!userId) {
        console.error("No user ID found, redirecting to home");
        loadHomePage();
        return;
    }

    // Load user profile data first (critical for name display)
    await loadUserProfileData(userId);

    // Load additional data (stats, matches, etc.) separately
    await loadUserStatsAndMatches(userId);

    isLoadingDashboard = false;
}

async function loadUserProfileData(userId: number): Promise<void> {
    try {
        console.log("Loading user profile data for ID:", userId);
        const userRes = await fetch(`${API_BASE_URL}/users/${userId}`, {
            headers: {
                "Accept-Language": getLang(),
                Authorization: `Bearer ${getCookie("jwt")}`,
            },
        });

        if (!userRes.ok) {
            throw new Error(`Failed to fetch user data: ${userRes.status}`);
        }

        const userData = await userRes.json();
        console.log("User profile data loaded:", userData);
        const user = userData.user;
        console.log("User data:", user);
        console.log("User pfp", user.pfp);

        // Check if user data is valid
        if (!user) {
            throw new Error("User data not found in response");
        }
        const twofaEnabled = userData.twofa_enabled || false;

        attachProfileEventListeners(user, twofaEnabled);

        const nameElement = document.getElementById("name");
        if (nameElement) {
            nameElement.textContent = user.username || "Unknown";
        }
        if (
            user.pfp &&
            (user.pfp.startsWith("http://") || user.pfp.startsWith("https://"))
        ) {
            const pfpElement = getElement<HTMLImageElement>("pfp");
            pfpElement.src = user.pfp;
            pfpElement.onerror = () => {
                pfpElement.src = "/images/default_pfp.png";
            };
        } else {
            getElement<HTMLImageElement>("pfp").src = "/images/default_pfp.png";
        }
    } catch (error) {
        console.error("Error loading user profile data:", error);
        const nameElement = getElement<HTMLHeadingElement>("name");
        if (nameElement) {
            nameElement.textContent = "Error loading profile";
        }
        getElement<HTMLImageElement>("pfp").src = "/images/default_pfp.png";
    }
}

async function loadUserStatsAndMatches(userId: number): Promise<void> {
    // Load each data type separately so failures don't affect others

    // Load total hours
    try {
        const totalHours = await fetch(
            `${API_BASE_URL}/users/status/totalhours`,
            {
                headers: {
                    "Accept-Language": getLang(),
                    Authorization: `Bearer ${getCookie("jwt")}`,
                },
            }
        );
        const totalHoursData = await totalHours.json();
        const totalHoursPlayed = totalHoursData.totalHoursPlayed || 0;
        getElement<HTMLSpanElement>("hoursPlayed").textContent =
            totalHoursPlayed.toFixed(2);
    } catch (error) {
        console.error("Error loading total hours:", error);
        getElement<HTMLSpanElement>("hoursPlayed").textContent = "0.00";
    }

    // Load stats
    let stats: Stats | null = null;
    try {
        const statsRes = await fetch(`${API_BASE_URL}/users/${userId}/stats`, {
            headers: {
                "Accept-Language": getLang(),
                Authorization: `Bearer ${getCookie("jwt")}`,
            },
        });
        const statsData = await statsRes.json();
        stats = statsData.stats;

        if (stats) {
            getElement<HTMLDivElement>("totalMatches").textContent =
                stats.total_matches?.toString() ?? "0";
            getElement<HTMLDivElement>("matchesWon").textContent =
                stats.matches_won?.toString() ?? "0";
            getElement<HTMLDivElement>("matchesLost").textContent =
                stats.matches_lost?.toString() ?? "0";
            getElement<HTMLDivElement>("avgScore").textContent =
                stats.average_score?.toString() ?? "0";
            getElement<HTMLDivElement>("winStreak").textContent =
                stats.win_streak_max?.toString() ?? "0";
            getElement<HTMLDivElement>("tournaments").textContent =
                stats.tournaments_won?.toString() ?? "0";
            getElement<HTMLDivElement>("leaderboard").textContent =
                stats.leaderboard_position?.toString() ?? "0";
        }
    } catch (error) {
        console.error("Error loading user stats:", error);
        // Stats will remain at default "0" values
    }

    // Load recent matches
    try {
        await loadRecentMatches(userId);
    } catch (error) {
        console.error("Error loading recent matches:", error);
    }

    // Load tournaments (handle gracefully if endpoint doesn't exist)
    try {
        if (stats && stats.current_tournament) {
            await loadPastTournaments(userId, stats.current_tournament);
            await loadUpComingMatchesById(stats.current_tournament, userId);
        }
    } catch (error) {
        console.error(
            "Error loading tournament data (this is expected if tournaments are not implemented):",
            error
        );
        // Tournament data loading is optional - don't throw error
    }
}

// Add a flag to prevent duplicate loading
let isLoadingMatches = false;

async function loadRecentMatches(userId: number): Promise<void> {
    // Prevent multiple simultaneous calls
    if (isLoadingMatches) {
        console.log("Already loading matches, skipping duplicate call");
        return;
    }

    isLoadingMatches = true;

    try {
        console.log("Starting to load recent matches for user:", userId);
        const res = await fetch(
            `${API_BASE_URL}/games/users/${userId}/recent`,
            {
                headers: {
                    "Accept-Language": getLang(),
                    Authorization: `Bearer ${getCookie("jwt")}`,
                },
            }
        );

        if (!res.ok) {
            throw new Error(`Failed to fetch recent matches: ${res.status}`);
        }

        const data = await res.json();
        const container = getElement<HTMLDivElement>("matchTableBody");

        // Clear container to prevent duplicates
        container.innerHTML = "";

        console.log(
            "Loading recent matches:",
            data.games?.length || 0,
            "matches found"
        );

        if (!data.games || data.games.length === 0) {
            container.innerHTML =
                '<div class="text-gray-400 text-center p-4">No recent matches found</div>';
            return;
        }

        for (const match of data.games as Match[]) {
            const [p1, p2] = await Promise.all([
                fetch(`${API_BASE_URL}/users/${match.player1}`, {
                    headers: {
                        "Accept-Language": getLang(),
                        Authorization: `Bearer ${getCookie("jwt")}`,
                    },
                }).then((res) => res.json()),
                fetch(`${API_BASE_URL}/users/${match.player2}`, {
                    headers: {
                        "Accept-Language": getLang(),
                        Authorization: `Bearer ${getCookie("jwt")}`,
                    },
                }).then((res) => res.json()),
            ]);

            if (!p1.user) {
                p1.user = { username: "Unknown Player" };
            }
            if (!p2.user) {
                p2.user = { username: "Unknown Player" };
            }
            const date = new Date(match.match_date)
                .toLocaleString("pt-PT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })
                .replace(",", "");

            let winner = "-";
            if (match.player1_score > match.player2_score) {
                winner = p1.user.username;
            } else if (match.player2_score > match.player1_score) {
                winner = p2.user.username;
            }

            const div = document.createElement("div");
            div.className =
                "match-entry flex justify-between items-center p-2 border-b border-green-500";
            div.innerHTML = `
				<div>
					<div class="font-bold text-green-400">${date}</div>
					<div class="text-sm text-gray-400">${p1.user.username} vs ${p2.user.username}</div>
				</div>
				<div class="text-right">
					<div class="text-sm text-green-400">Score: ${match.player1_score} - ${match.player2_score}</div>
					<div class="text-sm text-yellow-400">Winner: ${winner}</div>
				</div>`;

            container.appendChild(div);
        }

        console.log("Successfully loaded", data.games.length, "recent matches");
    } catch (error) {
        console.error("Error loading recent matches:", error);
        const container = getElement<HTMLDivElement>("matchTableBody");
        container.innerHTML =
            '<div class="text-red-400 text-center p-4">Error loading matches</div>';
    } finally {
        isLoadingMatches = false;
    }
}

async function loadPastTournaments(
    userId: number,
    currentTournamentId: number
): Promise<void> {
    try {
        const res = await fetch(
            `${API_BASE_URL}/tournaments/users/${userId}/past`,
            {
                headers: {
                    "Accept-Language": getLang(),
                    Authorization: `Bearer ${getCookie("jwt")}`,
                },
            }
        );

        if (!res.ok) {
            if (res.status === 404) {
                console.log(
                    "Tournament endpoint not found - tournaments feature not implemented"
                );
                const container = getElement<HTMLDivElement>(
                    "tournamentTableBody"
                );
                container.innerHTML =
                    '<div class="text-gray-400 text-center p-4">Tournaments not available</div>';
                return;
            }
            throw new Error(`Failed to fetch tournaments: ${res.status}`);
        }

        const data = await res.json();
        const container = getElement<HTMLDivElement>("tournamentTableBody");
        container.innerHTML = "";

        if (!data.tournaments || data.tournaments.length === 0) {
            container.innerHTML =
                '<div class="text-gray-400 text-center p-4">No past tournaments found</div>';
            return;
        }
        for (const t of data.tournaments as Tournament[]) {
            const positionRes = await fetch(
                `${API_BASE_URL}/tournaments/${t.tournament_id}/players/${userId}`,
                {
                    headers: {
                        "Accept-Language": getLang(),
                        Authorization: `Bearer ${getCookie("jwt")}`,
                    },
                }
            );
            const positionData = await positionRes.json();
            const date = new Date(t.tournament_date)
                .toLocaleString("pt-PT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })
                .replace(",", "");

            const player = positionData.players?.find(
                (p: any) => p.player_id === userId
            );
            const div = document.createElement("div");
            div.className = "p-2 border border-green-500 rounded";
            div.innerHTML = `
				<div class="flex justify-between items-center">
					<span class="text-green-300 font-semibold">${t.tournament_name}</span>
					<span class="text-sm text-gray-400">${date}</span>
				</div>
				<div class="text-sm text-yellow-400">Position: ${
                    player?.current_position ?? "-"
                }</div>`;

            container.appendChild(div);
        }
    } catch (error) {
        console.error("Error loading past tournaments:", error);
        const container = getElement<HTMLDivElement>("tournamentTableBody");
        container.innerHTML =
            '<div class="text-red-400 text-center p-4">Error loading tournaments</div>';
    }
}

async function loadUpComingMatchesById(
    tournamentId: number,
    userId: number
): Promise<void> {
    try {
        const [tournamentRes, matchesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
                headers: {
                    "Accept-Language": getLang(),
                    Authorization: `Bearer ${getCookie("jwt")}`,
                },
            }),
            fetch(`${API_BASE_URL}/tournaments/${tournamentId}/matches`, {
                headers: {
                    "Accept-Language": getLang(),
                    Authorization: `Bearer ${getCookie("jwt")}`,
                },
            }),
        ]);

        if (!tournamentRes.ok || !matchesRes.ok) {
            throw new Error("Failed to fetch tournament or matches data");
        }

        const tournament = await tournamentRes.json();
        const data = await matchesRes.json();

        const container = getElement<HTMLDivElement>("upcomingMatches");
        container.innerHTML = "";

        if (!data.matches || data.matches.length === 0) {
            container.innerHTML =
                '<div class="text-gray-400 text-center p-4">No upcoming matches</div>';
            return;
        }

        for (const match of data.matches as Match[]) {
            const opponentId = getOpponentId(match, userId);
            const opponentData = await fetch(
                `${API_BASE_URL}/users/${opponentId}`,
                {
                    headers: {
                        "Accept-Language": getLang(),
                        Authorization: `Bearer ${getCookie("jwt")}`,
                    },
                }
            ).then((res) => res.json());
            if (!opponentData.user) {
                opponentData.user = { username: "Unknown Player" };
            }
            const date = new Date(match.scheduled_date)
                .toLocaleString("pt-PT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })
                .replace(",", "");

            const div = document.createElement("div");
            div.className = "p-2 border border-green-500 rounded";
            div.innerHTML = `
			<div class="flex justify-between items-center">
				<span class="text-green-300 font-semibold">${tournament.tournament.name}</span>
				<span class="text-sm text-gray-400">${date}</span>
			</div>
			<div class="text-sm text-yellow-400">Opponent: ${opponentData.user.username}</div>`;

            container.appendChild(div);
        }
    } catch (error) {
        console.error("Error loading upcoming matches:", error);
        const container = getElement<HTMLDivElement>("upcomingMatches");
        container.innerHTML =
            '<div class="text-red-400 text-center p-4">Error loading upcoming matches</div>';
    }
}

function showDeleteModal(): void {
    getElement<HTMLDivElement>("deleteModal").style.display = "flex";
}

function showEditProfileModal(user: User, twofaEnabled: boolean): void {
    const modal = getElement<HTMLDivElement>("editProfileModal");
    modal.style.display = "flex";
    const usernameInput = getElement<HTMLInputElement>("editUsername");
    usernameInput.value = user.username;

    const twofaSection = getElement<HTMLDivElement>("twofaSection");
    if (twofaEnabled) {
        twofaSection.innerHTML = `<div class="text-green-400">2FA is already enabled.</div>`;
    } else {
        twofaSection.innerHTML = `
			<label class="flex items-center gap-2">
				<input id="enable2faCheckbox" type="checkbox" class="accent-[#4CF190]" />
				<span class="text-[#4CF190]">Enable Two-Factor Authentication</span>
			</label>
		`;
    }
    const langSelector = document.getElementById(
        "languageSelector"
    ) as HTMLSelectElement | null;
    if (langSelector) {
        langSelector.value = getLang();
        langSelector.onchange = (e) => {
            const newLang = (e.target as HTMLSelectElement).value;
            setLang(newLang as "en" | "pt" | "zh");
            loadProfilePage(false);
        };
        // Optionally translate the label
        const langLabel = document.querySelector(
            "label[for='languageSelector']"
        );
        if (langLabel) langLabel.textContent = t("language") || "Language";
    }
}

function closeEditProfileModal(): void {
    getElement<HTMLDivElement>("editProfileModal").style.display = "none";
}

function attachProfileEventListeners(user: User, twofaEnabled: boolean) {
    // Edit Profile button
    getElement<HTMLButtonElement>("editProfileBtn").onclick = () =>
        showEditProfileModal(user, twofaEnabled);

    // Cancel button in modal
    getElement<HTMLButtonElement>("cancelEditProfileBtn").onclick =
        closeEditProfileModal;

    // Form submit
    getElement<HTMLFormElement>("editProfileForm").onsubmit = async (e) => {
        e.preventDefault();
        const username = getElement<HTMLInputElement>("editUsername").value;
        const pfpInput = getElement<HTMLInputElement>("editPfp");
        let pfpUrl = pfpInput.value.trim() || user.pfp;

        getElement<HTMLDivElement>("editUsernameError").textContent = "";
        if (username.length <= 3) {
            getElement<HTMLDivElement>("editUsernameError").textContent =
                "Username must be longer than 3 characters.";
            return;
        }
        if (username.length >= 20) {
            getElement<HTMLDivElement>("editUsernameError").textContent =
                "Username must be less than 20 characters.";
            return;
        }
        let twofa_enabled = false;
        const enable2faCheckbox = document.getElementById(
            "enable2faCheckbox"
        ) as HTMLInputElement | null;
        if (enable2faCheckbox && enable2faCheckbox.checked) {
            twofa_enabled = true;
        }
        const userId = getUserIdFromToken();
        const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: "PUT",
            headers: {
                "Accept-Language": getLang(),
                "Content-Type": "application/json",
                Authorization: `Bearer ${getCookie("jwt")}`,
            },
            body: JSON.stringify({
                username,
                pfp: pfpUrl,
                twofa_enabled,
            }),
        });
        if (res.ok) {
            if (twofa_enabled) {
                const twofaRes = await fetch(`${API_BASE_URL}/2fa/setup`, {
                    method: "POST",
                    headers: {
                        "Accept-Language": getLang(),
                        Authorization: `Bearer ${getCookie("jwt")}`,
                    },
                });
                if (twofaRes.ok) {
                    const twofaData = await twofaRes.json();
                    const qrModal = getElement<HTMLDivElement>("twofaQrModal");
                    const qrImg = getElement<HTMLImageElement>("twofaQrImg");
                    qrImg.src = twofaData.code;
                    getElement<HTMLDivElement>(
                        "editProfileModal"
                    ).style.display = "none";
                    qrModal.style.display = "flex";

                    getElement<HTMLButtonElement>("closeTwofaQrBtn").onclick =
                        () => {
                            qrModal.style.display = "none";
                        };

                    qrModal.onclick = (e) => {
                        if (e.target === qrModal) {
                            qrModal.style.display = "none";
                        }
                    };
                } else {
                    alert("Failed to enable 2FA.");
                }
            } else {
                closeEditProfileModal();
                loadProfilePage();
            }
        } else {
            let errorMsg = "Failed to update profile.";
            try {
                const errorData = await res.json();
                if (
                    errorData &&
                    errorData.message &&
                    errorData.message.includes("username")
                ) {
                    errorMsg = errorData.message;
                }
            } catch {}
            getElement<HTMLDivElement>("editUsernameError").textContent =
                errorMsg;
        }
    };
    // getElement<HTMLDivElement>("deleteModal").style.display = "flex";
    getElement<HTMLButtonElement>("cancelDeleteBtn").addEventListener(
        "click",
        closeDeleteModal
    );
    getElement<HTMLButtonElement>("confirmDeleteBtn").addEventListener(
        "click",
        confirmDelete
    );
}

function closeDeleteModal(): void {
    getElement<HTMLDivElement>("deleteModal").style.display = "none";
}

async function confirmDelete(): Promise<void> {
    closeDeleteModal();
    try {
        const userId = getUserIdFromToken();
        const token = getCookie("jwt");

        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: "DELETE",
            headers: {
                "Accept-Language": getLang(),
                Authorization: `Bearer ${getCookie("jwt")}`,
            },
            body: JSON.stringify({ token: getCookie("jwt") }),
            credentials: "include",
        });
        if (!response.ok) {
            throw new Error("Error deleting user");
        }

        alert("Your account has been deleted");

        document.cookie = "jwt=; Max-Age=0; path=/";
        window.location.href = "/";
    } catch (error) {
        console.error(error);
        alert("Error deleting accoun");
    }
}

async function renderPerformanceChart(): Promise<void> {
    const userId = getUserIdFromToken();
    if (!userId) {
        console.error("User ID not found.");
        return;
    }

    // Get stats for chart rendering - don't re-fetch user profile data
    const statsRes = await fetch(`${API_BASE_URL}/users/${userId}/stats`, {
        headers: {
            "Accept-Language": getLang(),
            Authorization: `Bearer ${getCookie("jwt")}`,
        },
    });
    const statsData = await statsRes.json();
    const stats: Stats = statsData.stats ?? {
        total_matches: 0,
        matches_won: 0,
        matches_lost: 0,
        average_score: 0,
        win_streak_max: 0,
        tournaments_won: 0,
    };

    const Chart = (window as any).Chart;
    const ChartDataLabels = (window as any).ChartDataLabels;

    if (!Chart || !ChartDataLabels) {
        console.error("Chart.js ou ChartDataLabels não carregado.");
        return;
    }

    Chart.register(ChartDataLabels);

    const doughnutCanvas = document.getElementById(
        "doughnutChart"
    ) as HTMLCanvasElement;
    const barCanvas = document.getElementById("barChart") as HTMLCanvasElement;

    const totalMatches = stats.total_matches ?? 0;
    const matchesWon = stats.matches_won ?? 0;
    const matchesLost = stats.matches_lost ?? 0;
    const doughnutCenterText = {
        id: "doughnutCenterText",
        beforeDraw(chart: any) {
            const { width, height, ctx } = chart;
            ctx.save();
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";

            const total = `${totalMatches}`;
            const fontSizeNumber = height / 7;
            const fontSizeLabel = height / 25;

            ctx.font = `bold ${fontSizeNumber}px 'Courier New', monospace`;
            ctx.fillStyle = "#4CF190";
            ctx.fillText(total, width / 2, height / 2 - 10);

            ctx.font = `${fontSizeLabel}px 'Courier New', monospace`;
            ctx.fillStyle = "#BBB";
            ctx.fillText(t("total_matches"), width / 2, height / 2 + 25);

            ctx.restore();
        },
    };

    // Chart.register(doughnutCenterText);

    if (doughnutCanvas && barCanvas) {
        const doughnutCtx = doughnutCanvas.getContext("2d");
        const barCtx = barCanvas.getContext("2d");
        let doughnutData = [matchesWon, matchesLost];
        const isEmptyStats = matchesWon === 0 && matchesLost === 0;

        if (matchesWon === 0 && matchesLost === 0) {
            doughnutData = [1, 1];
        }

        // Doughnut Chart
        new Chart(doughnutCtx, {
            type: "doughnut",
            data: {
                labels: [t("wins"), t("losses")],
                datasets: [
                    {
                        label: t("total"),
                        data: doughnutData,
                        backgroundColor: ["#4CF190", "#E57373"],
                        borderColor: "#001B26",
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: { enabled: true },
                    legend: {
                        position: "bottom",
                        labels: { color: "#ffffff" },
                    },
                    datalabels: {
                        display: false,
                    },
                },
            },
            plugins: [doughnutCenterText, ChartDataLabels],
        });

        const res = await fetch(
            `${API_BASE_URL}/tournaments/users/${userId}/past`,
            {
                headers: {
                    "Accept-Language": getLang(),
                    Authorization: `Bearer ${getCookie("jwt")}`,
                },
            }
        );
        const data = await res.json();

        const tournamentStats = Array.isArray(data.tournaments)
            ? data.tournaments
                  .map((tournament: any, index: number) => ({
                      tournament_id: tournament.tournament_id,
                      name: tournament.tournament_name ?? "no data",
                      wins: tournament.wins ?? 0,
                      losses: tournament.losses ?? 0,
                  }))
                  .slice(0, 10)
                  .reverse()
            : [];

        const tournamentLabels = tournamentStats.map(
            (t: { name: string; wins: number; losses: number }) =>
                t.name ?? "No Data"
        );

        const winsData = tournamentStats.map(
            (t: { name: string; wins: number; losses: number }) => t.wins ?? 0
        );
        const lossesData = tournamentStats.map(
            (t: { name: string; wins: number; losses: number }) => t.losses ?? 0
        );
        const win_rate = tournamentStats.map(
            (t: { name: string; wins: number; losses: number }) => {
                const total = t.wins + t.losses;
                return total === 0 ? 0 : +((t.wins / total) * 10).toFixed(1);
            }
        );
        new Chart(barCtx, {
            type: "line",
            data: {
                labels: tournamentLabels,
                datasets: [
                    {
                        label: t("wins"),
                        data: winsData,
                        borderColor: "#4CF190",
                        backgroundColor: "rgba(76, 241, 144, 0.2)",
                        pointBackgroundColor: "#4CF190",
                        tension: 0.4,
                        borderWidth: 2,
                        fill: false,
                    },
                    {
                        label: t("losses"),
                        data: lossesData,
                        borderColor: "#E57373",
                        backgroundColor: "rgba(229, 115, 115, 0.2)",
                        pointBackgroundColor: "#E57373",
                        tension: 0.4,
                        borderWidth: 2,
                        fill: false,
                    },
                    {
                        label: t("win_rate"),
                        data: win_rate,
                        borderColor: "#FFD54F",
                        backgroundColor: "rgba(255, 213, 79, 0.2)",
                        pointBackgroundColor: "#FFD54F",
                        tension: 0.4,
                        borderWidth: 2,
                        fill: false,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: "#4CF190" },
                    },
                    tooltip: { enabled: true },
                    datalabels: {
                        color: "#FFFFFF",
                        align: "end",
                        anchor: "start",
                        offset: 2,
                        font: {
                            weight: "bold",
                            size: 10,
                        },
                    },
                },

                scales: {
                    y: {
                        beginAtZero: true,
                        min: 0,
                        max: 25,
                        ticks: {
                            stepSize: 1,
                            color: "#4CF190",
                        },
                        grid: {
                            color: "rgba(76,241,144,0.1)",
                        },
                        title: {
                            display: true,
                            text: t("quantity"),
                            color: "#4CF190",
                        },
                    },
                    x: {
                        ticks: {
                            color: "#4CF190",
                        },
                        grid: {
                            color: "rgba(76,241,144,0.05)",
                        },
                        title: {
                            display: true,
                            text: t("tournaments"),
                            color: "#4CF190",
                        },
                    },
                },
            },
        });
    }
}
