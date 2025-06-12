export const termsTemplate = `
<div class="fixed inset-0 min-h-screen min-w-screen bg-[url(./images/background.png)] bg-cover bg-center text-white items-center justify-center overflow-y-auto">
  <div class="bg-[#001B26] p-8 rounded-xl border-2 border-[#4CF190] max-w-2xl w-full shadow-lg justify-center mx-auto mt-10 mb-10">
    <h1 class="text-4xl font-bold text-[#4CF190] mb-6 text-center">Terms and Conditions</h1>
    <p class="text-gray-400 mb-4 text-sm text-center">Last updated: June 9, 2025</p>

    <h2 class="text-2xl text-[#4CF190] font-semibold mt-6 mb-2">1. Introduction</h2>
    <p class="mb-4 text-gray-300">
      By accessing or using our services, you agree to these Terms and Conditions. Please read them carefully.
    </p>

    <h2 class="text-2xl text-[#4CF190] font-semibold mt-6 mb-2">2. Data Protection (GDPR)</h2>
    <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2">
      <li>
        <span class="font-semibold text-white">Data Collection:</span> We collect only necessary personal data (e.g., username, email) for providing our services.
      </li>
      <li>
        <span class="font-semibold text-white">Purpose:</span> Your data is used to operate, maintain, and improve our services, and to communicate with you.
      </li>
      <li>
        <span class="font-semibold text-white">Your Rights:</span> You may access, correct or delete your data. You may also request data portability.
      </li>
      <li>
        <span class="font-semibold text-white">Security:</span> We use appropriate technical and organizational measures to protect your data.
      </li>
      <li>
        <span class="font-semibold text-white">Contact:</span> For privacy questions or requests, email us at <a href="mailto:privacy@example.com" class="underline text-[#4CF190] hover:text-[#38c172]">privacy@example.com</a>.
      </li>
    </ul>

    <h2 class="text-2xl text-[#4CF190] font-semibold mt-6 mb-2">3. Use of Service</h2>
    <p class="mb-4 text-gray-300">
      You agree to use our services lawfully and not misuse them in any way.
    </p>

    <h2 class="text-2xl text-[#4CF190] font-semibold mt-6 mb-2">4. Intellectual Property</h2>
    <p class="mb-4 text-gray-300">
      All content is owned by us or our licensors and protected by copyright and intellectual property laws.
    </p>

    <h2 class="text-2xl text-[#4CF190] font-semibold mt-6 mb-2">5. Limitation of Liability</h2>
    <p class="mb-4 text-gray-300">
      We are not liable for damages arising from use or inability to use our services, except as required by law.
    </p>

    <h2 class="text-2xl text-[#4CF190] font-semibold mt-6 mb-2">6. Changes to Terms</h2>
    <p class="mb-4 text-gray-300">
      We may update these Terms and Conditions. Changes will be posted on this page.
    </p>

    <h2 class="text-2xl text-[#4CF190] font-semibold mt-6 mb-2">7. Contact Us</h2>
    <p class="mb-2 text-gray-300">
      For questions about these Terms and Conditions, contact us at <a href="mailto:support@example.com" class="underline text-[#4CF190] hover:text-[#38c172]">support@example.com</a>.
    </p>
    <div class="flex justify-center mt-8">
      <button id="goBackBtn" class="bg-[#4CF190] text-[#001B26] px-6 py-2 rounded-lg font-semibold hover:bg-[#38c172] transition">
        Go Back
      </button>
    </div>
  </div>
</div>
`;