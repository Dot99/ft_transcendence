// Configuration for API endpoints
const getServerIP = () => {
	// For local network access, determine the server based on current location
	const hostname = window.location.hostname;
	
	// If accessing from localhost, use the network IP
	if (hostname === 'localhost' || hostname === '127.0.0.1') {
		return 'http://10.11.9.1:3000';
	} else {
		// If accessed from another machine, assume the server is on port 3000 of the host IP
		return 'http://10.11.9.1:3000';
	}
};

export const API_BASE_URL = `${getServerIP()}/api`;
export const WS_BASE_URL = getServerIP().replace('http://', 'ws://');
