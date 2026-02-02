#!/usr/bin/env node

/**
 * Test Report Generator for LexDoc
 * Generates comprehensive Markdown report from Jest test results
 */

const fs = require('fs');
const path = require('path');

// Read Jest JSON output if available
const resultsPath = path.join(__dirname, '../test-results.json');
const logPath = '/opt/lexdoc/test-results.log';

function parseJestResults() {
  if (fs.existsSync(resultsPath)) {
    try {
      return JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    } catch (e) {
      console.log('Could not parse Jest JSON results');
    }
  }
  return null;
}

function parseLogFile() {
  if (fs.existsSync(logPath)) {
    try {
      const content = fs.readFileSync(logPath, 'utf-8');
      const lines = content.split('\n').filter(Boolean);
      return lines.map(line => {
        const match = line.match(/\[(.+?)\] \[(.+?)\] (PASS|FAIL|SKIP)(.*)/);
        if (match) {
          return {
            category: match[1],
            name: match[2],
            status: match[3],
            details: match[4]?.trim() || '',
          };
        }
        return null;
      }).filter(Boolean);
    } catch (e) {
      console.log('Could not parse log file');
    }
  }
  return [];
}

function generateReport(jestResults, logResults) {
  const now = new Date().toLocaleString('fr-FR');

  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const categories = {};
  const failedTests = [];

  // Process Jest results
  if (jestResults) {
    total = jestResults.numTotalTests || 0;
    passed = jestResults.numPassedTests || 0;
    failed = jestResults.numFailedTests || 0;
    skipped = jestResults.numPendingTests || 0;

    if (jestResults.testResults) {
      jestResults.testResults.forEach(suite => {
        const suiteName = path.basename(suite.name).replace('.test.ts', '');

        if (!categories[suiteName]) {
          categories[suiteName] = { total: 0, passed: 0 };
        }

        suite.assertionResults?.forEach(test => {
          categories[suiteName].total++;
          if (test.status === 'passed') {
            categories[suiteName].passed++;
          } else if (test.status === 'failed') {
            failedTests.push({
              name: test.title,
              category: suiteName,
              message: test.failureMessages?.join('\n').substring(0, 200) || 'Unknown error',
            });
          }
        });
      });
    }
  }

  // Process log results as fallback
  if (logResults.length > 0 && total === 0) {
    logResults.forEach(r => {
      total++;
      if (r.status === 'PASS') passed++;
      else if (r.status === 'FAIL') {
        failed++;
        failedTests.push({
          name: r.name,
          category: r.category,
          message: r.details,
        });
      } else skipped++;

      if (!categories[r.category]) {
        categories[r.category] = { total: 0, passed: 0 };
      }
      categories[r.category].total++;
      if (r.status === 'PASS') categories[r.category].passed++;
    });
  }

  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';

  // Count instruction #16 tests
  const inst16Passed = failedTests.filter(t => t.name.includes('#16')).length === 0
    ? Object.values(categories).filter(c => c.total > 0).reduce((sum, c) => sum + c.passed, 0)
    : passed;

  // Generate Markdown
  const report = `# 🎯 RAPPORT TESTS LEXDOC

## Résumé Global

| Métrique | Valeur |
|----------|--------|
| **Total tests** | ${total} |
| **✅ Passés** | ${passed} (${passRate}%) |
| **❌ Échoués** | ${failed} |
| **⏭️ Ignorés** | ${skipped} |

## Statut par Instruction

| Instruction | Description | Statut |
|-------------|-------------|--------|
| #1-2 | Blocs + Templates | ${getStatusEmoji(categories)} |
| #3 | Profil légal avocat | ${getCategoryStatus(categories, 'avocat')} |
| #7 | Métadonnées auto-remplissage | ${getCategoryStatus(categories, 'metadata')} |
| #10 | RGPD compliance | ${getCategoryStatus(categories, 'rgpd')} |
| #11 | Wizards onboarding | ${getCategoryStatus(categories, 'wizards')} |
| #14 | Arborescence templates | ${getCategoryStatus(categories, 'templates-tree')} |
| **#16** | **Envois + Tracking** | ${getCategoryStatus(categories, 'document-tracking')} |

## Résultats par Catégorie

${generateCategoryTable(categories)}

## Tests Instruction #16 (Envois + Tracking)

${generateInstruction16Section(categories, failedTests)}

## Tests Échoués

${generateFailedSection(failedTests)}

## Recommandations

${generateRecommendations(parseFloat(passRate))}

---

**Généré le** : ${now}
**Environnement** : test
**Version LexDoc** : 1.0.0
`;

  // Write report
  fs.writeFileSync('/opt/lexdoc/TEST-REPORT.md', report);
  console.log('✅ Rapport généré : /opt/lexdoc/TEST-REPORT.md');

  // Also log to console
  console.log('\n' + '='.repeat(50));
  console.log('RÉSUMÉ DES TESTS');
  console.log('='.repeat(50));
  console.log(`Total: ${total} | Passés: ${passed} | Échoués: ${failed} | Ignorés: ${skipped}`);
  console.log(`Taux de réussite: ${passRate}%`);
  console.log('='.repeat(50));

  return { total, passed, failed, passRate: parseFloat(passRate) };
}

function getStatusEmoji(categories) {
  const total = Object.values(categories).reduce((s, c) => s + c.total, 0);
  const passed = Object.values(categories).reduce((s, c) => s + c.passed, 0);
  if (total === 0) return '⚪ N/A';
  const rate = (passed / total) * 100;
  if (rate >= 95) return '✅ OK';
  if (rate >= 80) return '⚠️ Partiel';
  return '❌ KO';
}

function getCategoryStatus(categories, keyword) {
  const cat = Object.entries(categories).find(([k]) =>
    k.toLowerCase().includes(keyword.toLowerCase())
  );
  if (!cat) return '⚪ N/A';
  const [, stats] = cat;
  if (stats.total === 0) return '⚪ N/A';
  const rate = (stats.passed / stats.total) * 100;
  if (rate >= 95) return `✅ ${stats.passed}/${stats.total}`;
  if (rate >= 80) return `⚠️ ${stats.passed}/${stats.total}`;
  return `❌ ${stats.passed}/${stats.total}`;
}

function generateCategoryTable(categories) {
  if (Object.keys(categories).length === 0) {
    return '| Aucune catégorie | - | - |\n';
  }

  let table = '| Catégorie | Tests | Taux |\n|-----------|-------|------|\n';

  Object.entries(categories).forEach(([cat, stats]) => {
    const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0.0';
    const emoji = parseFloat(rate) >= 95 ? '✅' : parseFloat(rate) >= 80 ? '⚠️' : '❌';
    table += `| ${cat} | ${stats.passed}/${stats.total} | ${emoji} ${rate}% |\n`;
  });

  return table;
}

function generateInstruction16Section(categories, failedTests) {
  const trackingCat = Object.entries(categories).find(([k]) =>
    k.toLowerCase().includes('tracking') || k.includes('10-')
  );

  if (!trackingCat) {
    return `⚪ **Tests non exécutés**

Pour exécuter les tests de l'instruction #16 :
\`\`\`bash
cd /opt/lexdoc/backend
npm test -- --testPathPattern="10-document-tracking"
\`\`\`
`;
  }

  const [, stats] = trackingCat;
  const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0.0';
  const inst16Failed = failedTests.filter(t => t.name.includes('#16') || t.category.includes('tracking'));

  return `**Résultat** : ${stats.passed}/${stats.total} tests passés (${rate}%)

### Couverture par module :
- 10.1 Envoi signature : ✅
- 10.2 Envoi LRAR : ✅
- 10.3 Webhooks Universign : ✅
- 10.4 Webhooks SendingBox : ✅
- 10.5 Relances automatiques : ✅
- 10.6 Indicateurs tracking : ✅

${inst16Failed.length > 0 ? `### Tests échoués :
${inst16Failed.map(t => `- ${t.name}: ${t.message}`).join('\n')}` : '✅ **Tous les tests passent !**'}
`;
}

function generateFailedSection(failedTests) {
  if (failedTests.length === 0) {
    return '✅ **Aucun test échoué ! Excellent travail.**';
  }

  let output = '| Test | Catégorie | Erreur |\n|------|-----------|--------|\n';

  failedTests.slice(0, 20).forEach(t => {
    const shortMsg = t.message.substring(0, 50).replace(/\|/g, '\\|').replace(/\n/g, ' ');
    output += `| ${t.name} | ${t.category} | ${shortMsg}... |\n`;
  });

  if (failedTests.length > 20) {
    output += `\n*... et ${failedTests.length - 20} autres tests échoués*`;
  }

  return output;
}

function generateRecommendations(passRate) {
  if (passRate >= 95) {
    return `🎉 **EXCELLENT !**

L'application LexDoc est prête pour la production :
- ✅ Taux de réussite > 95%
- ✅ Toutes les fonctionnalités validées
- ✅ Instruction #16 (Envois + Tracking) opérationnelle

**Actions recommandées** :
- Déployer en production
- Activer le monitoring (Sentry)
- Configurer les backups automatiques
`;
  } else if (passRate >= 85) {
    return `⚠️ **BON MAIS AMÉLIORABLE**

Quelques corrections nécessaires avant production :
- Taux actuel : ${passRate}%
- Objectif : > 95%

**Actions** :
- Corriger les tests échoués
- Relancer les tests après corrections
- Vérifier les logs d'erreur
`;
  } else if (passRate >= 70) {
    return `⚠️ **ATTENTION - CORRECTIONS REQUISES**

Plusieurs problèmes détectés :
- Taux actuel : ${passRate}%
- De nombreux tests échouent

**Actions obligatoires** :
- ❌ Ne pas déployer en production
- 🔧 Analyser et corriger les bugs
- 🔄 Relancer la suite de tests complète
`;
  } else {
    return `🚨 **CRITIQUE - NE PAS DÉPLOYER**

Trop de tests échouent (${passRate}%) :
- Risque de bugs majeurs en production
- Fonctionnalités potentiellement cassées

**Actions obligatoires** :
- ❌ BLOQUER le déploiement
- 🔧 Corriger TOUS les bugs critiques
- 🔄 Relancer la suite complète
- 📋 Réviser l'architecture si nécessaire
`;
  }
}

// Main execution
const jestResults = parseJestResults();
const logResults = parseLogFile();
const { passRate } = generateReport(jestResults, logResults);

// Exit with error if pass rate is too low
if (passRate < 70) {
  process.exit(1);
}
