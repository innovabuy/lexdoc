-- Seed Template Pragmavox — Assignation en référé (Tribunal de commerce)
-- GO-LIVE-1.C — pilote Me Yves-Marie BIENAIME
-- Source : assignation_refere_commerce.docm converti en .docx (macros perso retirées),
--          mappé run-aware en .template.docx (identité adverse/client PP/PM conditionnelle).
-- Tenant-scoped + isSystem=true, cohérent avec les autres templates Pragmavox.
-- Idempotent : ON CONFLICT (id) DO UPDATE.

INSERT INTO templates (
  id, "tenantId", name, category, "sourceFileUrl",
  "isSystem", "isPersonalise", "folderNature", description, variables,
  "createdAt", "updatedAt"
) VALUES (
  'cml-pragmavox-assignation-refere-tc-v1',
  'cml6vykdd0000jms2wwxl9s27',
  'Pragmavox - Assignation en référé (Tribunal de commerce)',
  'actes_procedure',
  'pragmavox/assignation_refere_commerce.template.docx',
  true,
  false,
  NULL,
  'Assignation en référé devant le Président du Tribunal de commerce (représentation obligatoire). Identité demanderesse et adverse en rendu conditionnel personne physique / morale. Champs audience et montants renseignés à la génération. Source : Cabinet Pragmavox / Me Yves-Marie BIENAIME.',
  '[
    {"key": "dossier.reference",              "label": "Référence interne du dossier",            "required": true},
    {"key": "dossier.tribunal_ville",         "label": "Ville du tribunal de commerce",           "required": true},
    {"key": "dossier.tribunal_adresse",       "label": "Adresse du tribunal",                     "required": true},
    {"key": "dossier.date_audience_lettres",  "label": "Date audience en lettres (auto si date_audience)", "required": false},
    {"key": "dossier.date_audience",          "label": "Date audience (chiffres)",                "required": true},
    {"key": "dossier.heure_audience",         "label": "Heure audience en lettres (auto)",        "required": false},
    {"key": "dossier.montant_provisionnel",   "label": "Montant provisionnel réclamé",            "required": true},
    {"key": "dossier.montant_article_700",    "label": "Montant article 700",                     "required": true},
    {"key": "dossier.date_mise_en_demeure",   "label": "Date de la mise en demeure",              "required": true},
    {"key": "client.raison_sociale",          "label": "Raison sociale demanderesse (si PM)",     "required": false},
    {"key": "adversaire.denomination",        "label": "Dénomination adverse (auto 1er PARTIE_ADVERSE)", "required": false}
  ]'::jsonb,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  "sourceFileUrl" = EXCLUDED."sourceFileUrl",
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  "updatedAt" = now();
