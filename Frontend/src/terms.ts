import { termsTemplate } from "./templates/termsTemplate.js";

const getElement = <T extends HTMLElement>(id: string): T => {
	const el = document.getElementById(id);
	if (!el) throw new Error(`Element #${id} not found`);
	return el as T;
};

export const loadTermsPage = (): void => {
	const app = document.getElementById("app");
	if (!app) return;
	app.innerHTML = termsTemplate;

	// Attach the Go Back button event handler here
	const btn = document.getElementById("goBackBtn");
	if (btn) {
		btn.onclick = function () {
			import("./index.js").then((module) => {
				module.loadHomePage();
			});
		};
	}
};

(window as any).loadTermsPage = loadTermsPage;
