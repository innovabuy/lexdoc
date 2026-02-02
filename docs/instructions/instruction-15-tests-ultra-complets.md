# Instruction #15 - Tests Ultra-Complets

## Objectif
Implémenter une suite de tests complète couvrant tous les aspects de l'application: unitaires, intégration, E2E, performance et sécurité.

## Structure des Tests

```
backend/tests/
├── unit/
│   ├── 00-infrastructure.test.ts
│   ├── 01-auth.test.ts
│   ├── 02-avocat-legal-info.test.ts
│   ├── 03-templates-tree.test.ts
│   ├── 04-metadata-autofill.test.ts
│   ├── 05-pdf-generation.test.ts
│   ├── 06-client-forms.test.ts
│   ├── 07-rgpd.test.ts
│   └── 10-envois-tracking.test.ts
├── integration/
│   └── complete-workflow.test.ts
├── e2e/
│   └── user-journey.test.ts
├── performance.test.ts
├── security.test.ts
└── setup.ts
```

## Tests Unitaires

### 00-infrastructure
- Connexion base de données
- Connexion MinIO
- Configuration environnement

### 01-auth
- Login/Logout
- Refresh token
- 2FA activation/validation
- Password reset

### 02-avocat-legal-info
- CRUD informations légales
- Upload signature/cachet
- Validation des champs

### 03-templates-tree
- Création/modification templates
- Organisation par catégories
- Favoris et récents

### 04-metadata-autofill
- Remplissage automatique
- Mapping variables
- Formatage des valeurs

### 05-pdf-generation
- Génération DOCX
- Génération PDF
- Variables Handlebars
- Mise en page

### 06-client-forms
- Formulaire public
- Validation données
- Création client

### 07-rgpd
- Enregistrement consentement
- Demandes de droits
- Anonymisation

### 10-envois-tracking
- Envoi signature
- Envoi LRAR
- Suivi et relances

## Tests d'Intégration

### Workflow Complet
1. Création cabinet
2. Ajout utilisateur
3. Configuration profil légal
4. Création client
5. Création dossier
6. Génération document
7. Envoi signature
8. Suivi et relances

## Tests de Performance

```typescript
describe('Performance', () => {
  it('should handle 100 concurrent users', async () => {
    // Test de charge avec autocannon
  });

  it('should generate document under 5s', async () => {
    // Test de temps de génération
  });

  it('should list 1000 documents under 1s', async () => {
    // Test de pagination
  });
});
```

## Tests de Sécurité

- Injection SQL (Prisma protège)
- XSS (sanitization)
- CSRF (tokens)
- Rate limiting
- Authentication bypass
- Authorization checks

## Configuration Jest

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.ts'],
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
```

## Scripts NPM

```json
{
  "test": "jest --coverage",
  "test:watch": "jest --watch",
  "test:integration": "jest --testPathPattern=integration",
  "test:e2e": "jest --testPathPattern=e2e",
  "test:performance": "tsx tests/performance/load-test.ts"
}
```

## Statut
✅ Complété
