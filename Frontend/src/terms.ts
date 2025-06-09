import { termsTemplate } from './templates/termsTemplate.js';

const getElement = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el as T;
};

export const loadTermsPage = (): void => {
  const app = getElement<HTMLElement>('app');
  app.innerHTML = termsTemplate;
};

(window as any).loadTermsPage = loadTermsPage;