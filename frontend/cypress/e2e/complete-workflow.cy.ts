/**
 * LexDoc - Complete Workflow E2E Tests
 *
 * Tests full user workflows from login to document generation
 */

describe('LexDoc - Complete User Workflows', () => {
  const testUser = {
    email: 'admin@cabinet-demo.fr',
    password: 'Admin123!',
  };

  // ============================================
  // AUTHENTICATION FLOW
  // ============================================
  describe('Authentication Flow', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should display login page correctly', () => {
      cy.get('h1, h2').should('contain.text', 'Connexion');
      cy.get('input[type="email"], input[name="email"]').should('be.visible');
      cy.get('input[type="password"], input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.get('input[type="email"], input[name="email"]').type('wrong@email.com');
      cy.get('input[type="password"], input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      // Should show error message
      cy.get('[role="alert"], .error, .toast-error, [data-testid="error"]')
        .should('be.visible');
    });

    it('should login successfully with valid credentials', () => {
      cy.get('input[type="email"], input[name="email"]').type(testUser.email);
      cy.get('input[type="password"], input[name="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('nav, aside, [data-testid="sidebar"]').should('be.visible');
    });

    it('should persist session after page reload', () => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/dashboard');
      cy.reload();
      cy.url().should('include', '/dashboard');
    });
  });

  // ============================================
  // DASHBOARD
  // ============================================
  describe('Dashboard', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/dashboard');
    });

    it('should display dashboard elements', () => {
      // Should have navigation
      cy.get('nav, aside, [data-testid="sidebar"]').should('be.visible');

      // Should have main content area
      cy.get('main, [data-testid="main-content"]').should('be.visible');

      // Should have user menu or profile link
      cy.get('[data-testid="user-menu"], [aria-label*="profil"], [aria-label*="user"]')
        .should('exist');
    });

    it('should navigate to document builder', () => {
      cy.contains('Document Builder').click();
      cy.url().should('include', '/document-builder');
    });
  });

  // ============================================
  // DOCUMENT BLOCKS
  // ============================================
  describe('Document Blocks', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/document-blocks');
    });

    it('should list document blocks', () => {
      // Should have blocks listed
      cy.get('[data-testid="block-item"], .block-card, table tbody tr, .card')
        .should('have.length.greaterThan', 0);
    });

    it('should filter blocks by category', () => {
      // Look for category filter
      cy.get('select, [role="combobox"], [data-testid="category-filter"]')
        .first()
        .click();

      cy.contains('INTRO').click();

      // Wait for filter to apply
      cy.wait(500);

      // Verify filtered results
      cy.url().should('include', 'category=INTRO');
    });

    it('should search blocks', () => {
      const searchTerm = 'cession';

      cy.get('input[type="search"], input[placeholder*="Rechercher"], [data-testid="search-input"]')
        .type(searchTerm);

      cy.wait(500);

      // Should show filtered results
      cy.get('[data-testid="block-item"], .block-card, table tbody tr')
        .should('have.length.greaterThan', 0);
    });

    it('should view block details', () => {
      // Click on first block
      cy.get('[data-testid="block-item"], .block-card, table tbody tr')
        .first()
        .click();

      // Should navigate to detail page or open modal
      cy.get('[data-testid="block-detail"], .modal, [role="dialog"]')
        .should('be.visible');
    });
  });

  // ============================================
  // BUILDER TEMPLATES
  // ============================================
  describe('Builder Templates', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/document-templates');
    });

    it('should list templates', () => {
      cy.get('[data-testid="template-item"], .template-card, table tbody tr, .card')
        .should('have.length.greaterThan', 0);
    });

    it('should filter templates by document type', () => {
      cy.get('select, [role="combobox"], [data-testid="type-filter"]')
        .first()
        .click();

      // Select a document type
      cy.get('[role="option"], option')
        .contains(/LETTRE|ASSIGNATION|CONCLUSIONS/i)
        .click();

      cy.wait(500);
    });

    it('should view template details', () => {
      cy.get('[data-testid="template-item"], .template-card, table tbody tr')
        .first()
        .click();

      // Should show template details
      cy.get('[data-testid="template-detail"], .template-info')
        .should('be.visible');
    });
  });

  // ============================================
  // AVOCAT LEGAL INFO
  // ============================================
  describe('Avocat Legal Info Profile', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/profile/legal');
    });

    it('should display legal info page', () => {
      cy.get('h1, h2').should('contain.text', /Profil|Informations|légal/i);
    });

    it('should have form fields for legal info', () => {
      // Check for key form fields
      cy.get('input[name="nom"], input[name*="lastName"]').should('exist');
      cy.get('input[name="prenom"], input[name*="firstName"]').should('exist');
      cy.get('input[name="barreau"], select[name="barreau"]').should('exist');
    });

    it('should have tabs for different sections', () => {
      // Look for tabs or accordion
      cy.get('[role="tablist"], .tabs, [data-testid="tabs"]').should('exist');

      // Click on signature tab if exists
      cy.contains(/Signature|Cachet/i).click();

      // Should show signature upload area
      cy.get('[data-testid="signature-upload"], input[type="file"], .dropzone')
        .should('exist');
    });

    it('should save legal info', () => {
      // Fill in a field
      cy.get('input[name="telephone"], input[name="phone"]')
        .clear()
        .type('0123456789');

      // Submit form
      cy.get('button[type="submit"], button:contains("Enregistrer")')
        .click();

      // Should show success message
      cy.get('[data-testid="success-toast"], .toast-success, [role="alert"]')
        .should('be.visible');
    });
  });

  // ============================================
  // FOLDERS
  // ============================================
  describe('Folders Management', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/documents');
    });

    it('should display folder tree or list', () => {
      cy.get('[data-testid="folder-tree"], .folder-list, [role="tree"]')
        .should('exist');
    });

    it('should create a new folder', () => {
      // Click create button
      cy.get('button:contains("Nouveau"), button:contains("Créer"), [data-testid="create-folder"]')
        .click();

      // Fill in folder name
      cy.get('input[name="name"], input[placeholder*="Nom"]')
        .type('Test Folder E2E');

      // Submit
      cy.get('button[type="submit"], button:contains("Créer")')
        .click();

      // Should show success or new folder in list
      cy.contains('Test Folder E2E').should('exist');
    });
  });

  // ============================================
  // DOCUMENT GENERATION WIZARD
  // ============================================
  describe('Document Generation Wizard', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/document-generation/wizard');
    });

    it('should display wizard steps', () => {
      // Should have step indicator
      cy.get('[data-testid="wizard-steps"], .stepper, [role="progressbar"]')
        .should('exist');
    });

    it('should select template in step 1', () => {
      // Should show template selection
      cy.get('[data-testid="template-select"], .template-grid, [data-testid="template-list"]')
        .should('exist');

      // Select first template
      cy.get('[data-testid="template-card"], .template-item')
        .first()
        .click();

      // Click next
      cy.get('button:contains("Suivant"), button:contains("Next")')
        .click();

      // Should advance to step 2
      cy.get('[data-testid="step-2"], [data-step="2"]')
        .should('have.class', 'active');
    });

    it('should fill variables in step 2', () => {
      // Select template first
      cy.get('[data-testid="template-card"], .template-item')
        .first()
        .click();

      cy.get('button:contains("Suivant")')
        .click();

      // Should show variable form
      cy.get('form, [data-testid="variables-form"]')
        .should('exist');

      // Fill required variables if they exist
      cy.get('input[required]').each(($input) => {
        cy.wrap($input).type('Test Value');
      });
    });

    it('should show preview in step 3', () => {
      // Go through wizard
      cy.get('[data-testid="template-card"], .template-item')
        .first()
        .click();

      cy.get('button:contains("Suivant")')
        .click();

      // Fill any required fields
      cy.get('input[required]').each(($input) => {
        cy.wrap($input).type('Test Value');
      });

      cy.get('button:contains("Suivant")')
        .click();

      // Should show preview
      cy.get('[data-testid="document-preview"], .preview, iframe')
        .should('exist');
    });
  });

  // ============================================
  // USERS MANAGEMENT (Admin)
  // ============================================
  describe('Users Management', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/users');
    });

    it('should list users', () => {
      cy.get('table tbody tr, [data-testid="user-item"], .user-card')
        .should('have.length.greaterThan', 0);
    });

    it('should open create user form', () => {
      cy.get('button:contains("Ajouter"), button:contains("Nouveau"), [data-testid="add-user"]')
        .click();

      // Should show form or modal
      cy.get('form, [role="dialog"]')
        .should('be.visible');

      cy.get('input[name="email"], input[type="email"]')
        .should('exist');
    });
  });

  // ============================================
  // SETTINGS
  // ============================================
  describe('Settings', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/settings');
    });

    it('should display settings page', () => {
      cy.get('h1, h2').should('contain.text', /Paramètres|Settings/i);
    });
  });

  // ============================================
  // LOGOUT
  // ============================================
  describe('Logout', () => {
    it('should logout successfully', () => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/dashboard');

      // Find and click logout button
      cy.get('[data-testid="user-menu"], [aria-label*="profil"]')
        .click();

      cy.get('button:contains("Déconnexion"), button:contains("Logout"), [data-testid="logout"]')
        .click();

      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });
});

// ============================================
// RESPONSIVE TESTS
// ============================================
describe('Responsive Design', () => {
  const testUser = {
    email: 'admin@cabinet-demo.fr',
    password: 'Admin123!',
  };

  beforeEach(() => {
    cy.login(testUser.email, testUser.password);
  });

  it('should work on mobile viewport', () => {
    cy.viewport('iphone-x');
    cy.visit('/dashboard');

    // Should have hamburger menu or mobile nav
    cy.get('[data-testid="mobile-menu"], .hamburger, [aria-label*="menu"]')
      .should('exist');
  });

  it('should work on tablet viewport', () => {
    cy.viewport('ipad-2');
    cy.visit('/dashboard');

    cy.get('main, [data-testid="main-content"]')
      .should('be.visible');
  });

  it('should work on desktop viewport', () => {
    cy.viewport(1920, 1080);
    cy.visit('/dashboard');

    // Sidebar should be visible on desktop
    cy.get('aside, [data-testid="sidebar"]')
      .should('be.visible');
  });
});

// ============================================
// ACCESSIBILITY TESTS
// ============================================
describe('Accessibility', () => {
  const testUser = {
    email: 'admin@cabinet-demo.fr',
    password: 'Admin123!',
  };

  beforeEach(() => {
    cy.login(testUser.email, testUser.password);
  });

  it('should have proper heading hierarchy', () => {
    cy.visit('/dashboard');
    cy.get('h1').should('have.length.at.least', 1);
  });

  it('should have accessible forms', () => {
    cy.visit('/profile/legal');

    // All inputs should have labels
    cy.get('input:not([type="hidden"])').each(($input) => {
      const id = $input.attr('id');
      const name = $input.attr('name');

      if (id) {
        cy.get(`label[for="${id}"]`).should('exist');
      } else if (name) {
        cy.get(`label:contains("${name}")`).should('exist');
      }
    });
  });

  it('should have keyboard navigation', () => {
    cy.visit('/login');

    // Tab through form elements
    cy.get('body').tab();
    cy.focused().should('exist');
  });
});
