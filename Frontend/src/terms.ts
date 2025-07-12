import { termsTemplate } from "./templates/termsTemplate.js";
import { t } from "./locales/localeMiddleware.js"; // Import your translation function
import { navigateTo } from "./utils/router.js";

const getElement = <T extends HTMLElement>(id: string): T => {
	const el = document.getElementById(id);
	if (!el) throw new Error(`Element #${id} not found`);
	return el as T;
};

export const loadTermsPage = (): void => {
	const app = document.getElementById("app");
	if (!app) return;
	app.innerHTML = termsTemplate;

	// Update the current URL without triggering navigation if needed
	if (window.location.pathname !== "/terms") {
		history.replaceState(null, "", "/terms");
	}

	translateTermsPage();
	// Attach the Go Back button event handler here
	const btn = document.getElementById("goBackBtn");
	if (btn) {
		btn.onclick = function () {
			navigateTo("/");
		};
	}
};

function translateTermsPage(): void {
	// Title and metadata
	const termsTitle = document.getElementById("termsTitle");
	if (termsTitle) termsTitle.textContent = t("terms_title");

	const lastUpdated = document.getElementById("lastUpdated");
	if (lastUpdated) lastUpdated.textContent = t("last_updated");

	// Section 1: Introduction
	const introductionTitle = document.getElementById("introductionTitle");
	if (introductionTitle)
		introductionTitle.textContent = t("introduction_title");

	const introductionText = document.getElementById("introductionText");
	if (introductionText) introductionText.textContent = t("introduction_text");

	// Section 2: Data Protection
	const dataProtectionTitle = document.getElementById("dataProtectionTitle");
	if (dataProtectionTitle)
		dataProtectionTitle.textContent = t("data_protection_title");

	const dataCollectionLabel = document.getElementById("dataCollectionLabel");
	if (dataCollectionLabel)
		dataCollectionLabel.textContent = t("data_collection_label");

	const dataCollectionText = document.getElementById("dataCollectionText");
	if (dataCollectionText)
		dataCollectionText.textContent = t("data_collection_text");

	const purposeLabel = document.getElementById("purposeLabel");
	if (purposeLabel) purposeLabel.textContent = t("purpose_label");

	const purposeText = document.getElementById("purposeText");
	if (purposeText) purposeText.textContent = t("purpose_text");

	const rightsLabel = document.getElementById("rightsLabel");
	if (rightsLabel) rightsLabel.textContent = t("rights_label");

	const rightsText = document.getElementById("rightsText");
	if (rightsText) rightsText.textContent = t("rights_text");

	const securityLabel = document.getElementById("securityLabel");
	if (securityLabel) securityLabel.textContent = t("security_label");

	const securityText = document.getElementById("securityText");
	if (securityText) securityText.textContent = t("security_text");

	const contactLabel = document.getElementById("contactLabel");
	if (contactLabel) contactLabel.textContent = t("contact_label");

	const contactText = document.getElementById("contactText");
	if (contactText) contactText.textContent = t("contact_text");

	// Section 3: Use of Service
	const useOfServiceTitle = document.getElementById("useOfServiceTitle");
	if (useOfServiceTitle)
		useOfServiceTitle.textContent = t("use_of_service_title");

	const useOfServiceText = document.getElementById("useOfServiceText");
	if (useOfServiceText)
		useOfServiceText.textContent = t("use_of_service_text");

	// Section 4: Intellectual Property
	const intellectualPropertyTitle = document.getElementById(
		"intellectualPropertyTitle"
	);
	if (intellectualPropertyTitle)
		intellectualPropertyTitle.textContent = t(
			"intellectual_property_title"
		);

	const intellectualPropertyText = document.getElementById(
		"intellectualPropertyText"
	);
	if (intellectualPropertyText)
		intellectualPropertyText.textContent = t("intellectual_property_text");

	// Section 5: Limitation of Liability
	const limitationLiabilityTitle = document.getElementById(
		"limitationLiabilityTitle"
	);
	if (limitationLiabilityTitle)
		limitationLiabilityTitle.textContent = t("limitation_liability_title");

	const limitationLiabilityText = document.getElementById(
		"limitationLiabilityText"
	);
	if (limitationLiabilityText)
		limitationLiabilityText.textContent = t("limitation_liability_text");

	// Section 6: Changes to Terms
	const changesTermsTitle = document.getElementById("changesTermsTitle");
	if (changesTermsTitle)
		changesTermsTitle.textContent = t("changes_terms_title");

	const changesTermsText = document.getElementById("changesTermsText");
	if (changesTermsText)
		changesTermsText.textContent = t("changes_terms_text");

	// Section 7: Contact Us
	const contactUsTitle = document.getElementById("contactUsTitle");
	if (contactUsTitle) contactUsTitle.textContent = t("contact_us_title");

	const contactUsText = document.getElementById("contactUsText");
	if (contactUsText) contactUsText.textContent = t("contact_us_text");

	// Go Back button
	const goBackBtn = document.getElementById("goBackBtn");
	if (goBackBtn) goBackBtn.textContent = t("go_back");
}

(window as any).loadTermsPage = loadTermsPage;
