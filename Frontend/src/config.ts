// Configuration for API endpoints
const getServerIP = () => {
	return "http://c1r9s1.42porto.com:3000";
};

export const API_BASE_URL = `${getServerIP()}/api`;
export const WS_BASE_URL = getServerIP().replace("http://", "ws://");
