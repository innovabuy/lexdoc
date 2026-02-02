/**
 * LexDoc - Cypress Custom Commands
 */

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login command - authenticates user and stores token
       * @param email - User email
       * @param password - User password
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Logout command - clears session
       */
      logout(): Chainable<void>;

      /**
       * Get by data-testid attribute
       * @param testId - The data-testid value
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Check if element is in viewport
       */
      isInViewport(): Chainable<boolean>;

      /**
       * Wait for API request to complete
       * @param alias - The request alias
       */
      waitForApi(alias: string): Chainable<void>;

      /**
       * Upload file to input
       * @param fileName - Name of file in fixtures
       * @param mimeType - MIME type of file
       */
      uploadFile(fileName: string, mimeType?: string): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session(
    [email, password],
    () => {
      // API login
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL') || 'http://localhost:3005'}/api/auth/login`,
        body: { email, password },
        failOnStatusCode: false,
      }).then((response) => {
        if (response.status === 200 && response.body.data?.accessToken) {
          const token = response.body.data.accessToken;
          const refreshToken = response.body.data.refreshToken;

          // Store tokens in localStorage
          window.localStorage.setItem('accessToken', token);
          window.localStorage.setItem('refreshToken', refreshToken);
          window.localStorage.setItem('user', JSON.stringify(response.body.data.user));
        } else {
          // Fallback to UI login
          cy.visit('/login');
          cy.get('input[type="email"], input[name="email"]').type(email);
          cy.get('input[type="password"], input[name="password"]').type(password);
          cy.get('button[type="submit"]').click();
          cy.url().should('not.include', '/login');
        }
      });
    },
    {
      validate: () => {
        // Validate session by checking token exists
        const token = window.localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No access token found');
        }
      },
    }
  );
});

// Logout command
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('accessToken');
  window.localStorage.removeItem('refreshToken');
  window.localStorage.removeItem('user');
  cy.clearCookies();
  cy.visit('/login');
});

// Get by data-testid
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Check if in viewport
Cypress.Commands.add(
  'isInViewport',
  { prevSubject: true },
  (subject: JQuery<HTMLElement>) => {
    const bottom = Cypress.$(cy.state('window')).height()!;
    const rect = subject[0].getBoundingClientRect();

    return cy.wrap(rect.top < bottom && rect.bottom > 0);
  }
);

// Wait for API
Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.wait(`@${alias}`);
});

// Upload file command
Cypress.Commands.add(
  'uploadFile',
  { prevSubject: 'element' },
  (subject: JQuery<HTMLElement>, fileName: string, mimeType = 'application/octet-stream') => {
    cy.fixture(fileName, 'base64').then((content) => {
      const blob = Cypress.Blob.base64StringToBlob(content, mimeType);
      const file = new File([blob], fileName, { type: mimeType });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const input = subject[0] as HTMLInputElement;
      input.files = dataTransfer.files;

      cy.wrap(subject).trigger('change', { force: true });
    });
  }
);

export {};
