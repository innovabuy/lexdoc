/**
 * LexDoc - Cypress E2E Support File
 *
 * This file is loaded before every E2E test file
 */

// Import commands
import './commands';

// Prevent TypeScript errors when accessing cy.state
declare global {
  namespace Cypress {
    interface cy {
      state(key: string): any;
    }
  }
}

// Hide fetch/XHR requests from command log (reduces noise)
const app = window.top;
if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Global before each hook
beforeEach(() => {
  // Intercept API calls for monitoring
  cy.intercept('GET', '**/api/**').as('apiGet');
  cy.intercept('POST', '**/api/**').as('apiPost');
  cy.intercept('PUT', '**/api/**').as('apiPut');
  cy.intercept('DELETE', '**/api/**').as('apiDelete');
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false prevents Cypress from failing the test
  // This is useful for handling React/Vue errors that don't affect functionality

  // Ignore ResizeObserver errors (common in modern apps)
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }

  // Ignore hydration errors
  if (err.message.includes('Hydration failed')) {
    return false;
  }

  // Ignore chunk loading errors
  if (err.message.includes('Loading chunk')) {
    return false;
  }

  // Let other errors fail the test
  return true;
});

// Log test start/end for debugging
Cypress.on('test:before:run', (test) => {
  console.log(`Starting: ${test.title}`);
});

Cypress.on('test:after:run', (test, runnable) => {
  if (test.state === 'failed') {
    console.error(`Failed: ${test.title}`);
  }
});

export {};
