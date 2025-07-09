// Configuration for API endpoints
const getServerIP = () => {
    // Always use localhost with Docker port mapping
    return "http://localhost:3000";
};

export const API_BASE_URL = `${getServerIP()}/api`;
export const WS_BASE_URL = getServerIP().replace("http://", "ws://");
