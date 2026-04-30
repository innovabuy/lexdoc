-- Seed Template Pragmavox — Lettre de mission constitution de société
-- Mission B Phase 1 — pilote
-- Référence : docs/MASTER_TEMPLATES_PRAGMAVOX.md
--
-- ID hardcodé pour reproductibilité (le schéma 'id' est text NOT NULL sans default ;
-- Prisma utilise cuid() côté JS, on choisit ici un identifiant explicite et idempotent).
-- updatedAt explicite (NOT NULL sans default côté DB).

INSERT INTO templates (
  id,
  "tenantId",
  name,
  category,
  "sourceFileUrl",
  "isSystem",
  "isPersonalise",
  "folderNature",
  description,
  variables,
  "createdAt",
  "updatedAt"
) VALUES (
  'cml-pragmavox-lm-constitution-v1',
  'cml6vykdd0000jms2wwxl9s27',
  'Pragmavox - Lettre de mission constitution',
  'droit_societes',
  'pragmavox/lettre_mission_constitution.template.docx',
  true,
  false,
  NULL,
  'Lettre de mission pour la constitution d''une société (SAS, SARL, SCI, ...). Inclut tableau honoraires, provision et mention médiateur consommation. Source : Cabinet Pragmavox / Me Yves-Marie BIENAIME.',
  '[
    {"key": "client.nom_complet",     "label": "Nom complet du client",                 "required": true},
    {"key": "document_date",          "label": "Date du document",                      "required": false},
    {"key": "dossier.forme_societe",  "label": "Forme de la société (SAS, SARL, ...)",  "required": true},
    {"key": "honoraires.ht",          "label": "Honoraires HT (€)",                     "required": true},
    {"key": "honoraires.tva",         "label": "TVA (€) — calculé auto",                "required": false},
    {"key": "honoraires.ttc",         "label": "Honoraires TTC (€) — calculé auto",     "required": false},
    {"key": "provision.ht",           "label": "Provision HT (€)",                      "required": true},
    {"key": "provision.ttc",          "label": "Provision TTC (€) — calculé auto",      "required": false},
    {"key": "mediateur.nom_complet",  "label": "Nom complet du médiateur",              "required": false},
    {"key": "mediateur.barreau",      "label": "Barreau du médiateur",                  "required": false}
  ]'::jsonb,
  NOW(),
  NOW()
);
