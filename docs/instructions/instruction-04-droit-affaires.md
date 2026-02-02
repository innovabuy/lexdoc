# Instruction #4 - Droit des Affaires

## Objectif
Implémenter les templates et blocs spécifiques au droit des affaires, notamment pour les cessions d'entreprise.

## Types de Dossiers

### Cession d'Entreprise
Métadonnées spécifiques:
- Cédant (vendeur)
- Cessionnaire (acquéreur)
- Société cible
- Prix de cession
- Garantie d'actif/passif
- Conditions suspensives
- Date de réalisation

### Création de Société
- Type de société (SAS, SARL, SA, etc.)
- Capital social
- Associés/actionnaires
- Objet social
- Siège social

### Pacte d'Associés
- Clauses de préemption
- Clauses de sortie
- Gouvernance
- Non-concurrence

## Templates Créés

### Actes de Cession
1. **Protocole de cession de parts sociales**
   - Préambule avec historique
   - Conditions de la cession
   - Garanties
   - Modalités de paiement

2. **Acte de cession définitif**
   - Références au protocole
   - Réalisation des conditions
   - Transfert de propriété

3. **Garantie d'actif et de passif**
   - Déclarations du cédant
   - Plafond et seuil
   - Durée de garantie
   - Procédure de réclamation

### Documents Sociétaires
1. **Statuts de SAS**
2. **Statuts de SARL**
3. **Procès-verbal d'assemblée**
4. **Décision de l'associé unique**

## Blocs Spécifiques

- Préambule cession
- Clause de prix
- Clause de garantie
- Clause de non-concurrence
- Clause de confidentialité
- Conditions suspensives types

## Variables Auto-fill

Le système pré-remplit automatiquement depuis les métadonnées du dossier:
- `{{cedant.nom}}`
- `{{cessionnaire.nom}}`
- `{{societe.denomination}}`
- `{{cession.prix}}`
- `{{cession.dateSignature}}`

## Statut
✅ Complété
