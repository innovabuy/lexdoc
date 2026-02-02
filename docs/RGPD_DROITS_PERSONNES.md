# Procedure d'Exercice des Droits des Personnes

## Conformite Articles 15 a 22 RGPD

---

## 1. Vue d'ensemble des droits

| Droit | Article RGPD | Delai | Gratuit |
|-------|--------------|-------|---------|
| Acces | Art. 15 | 1 mois | Oui* |
| Rectification | Art. 16 | 1 mois | Oui |
| Effacement | Art. 17 | 1 mois | Oui |
| Limitation | Art. 18 | 1 mois | Oui |
| Portabilite | Art. 20 | 1 mois | Oui |
| Opposition | Art. 21 | 1 mois | Oui |

*Gratuit sauf demandes manifestement excessives ou repetitives

---

## 2. Reception des demandes

### 2.1 Canaux de reception

- **Portail RGPD en ligne** : /rgpd (recommande)
- **Email** : rgpd@cabinet.fr
- **Courrier postal** : [Adresse du cabinet]
- **En personne** : Sur rendez-vous

### 2.2 Enregistrement

Chaque demande est enregistree avec :
- Date de reception
- Identite du demandeur
- Type de droit exerce
- Verification d'identite (statut)
- Date limite de reponse

---

## 3. Verification d'identite

### 3.1 Principe

Avant tout traitement, verifier l'identite du demandeur pour eviter toute divulgation non autorisee.

### 3.2 Methodes de verification

| Methode | Niveau de confiance | Cas d'usage |
|---------|---------------------|-------------|
| Email de confirmation | Standard | Demandes simples |
| Document d'identite | Eleve | Donnees sensibles |
| Code SMS | Moyen | Verification rapide |
| Entretien telephonique | Moyen | Clarification |

### 3.3 En cas de doute

- Demander une piece justificative supplementaire
- Ne jamais traiter sans verification suffisante
- Documenter les raisons du doute

---

## 4. Traitement par type de droit

### 4.1 Droit d'acces (Art. 15)

**Objectif** : Obtenir confirmation et copie des donnees traitees

**Procedure** :
1. Verifier l'identite
2. Identifier toutes les donnees de la personne
3. Preparer une copie structuree (JSON/PDF)
4. Inclure les informations Article 15.1

**Informations a fournir** :
- Finalites du traitement
- Categories de donnees
- Destinataires
- Duree de conservation
- Droits applicables
- Source des donnees (si collecte indirecte)
- Existence de decision automatisee

**Format de reponse** : Export JSON via `/rgpd/clients/{id}/export`

---

### 4.2 Droit de rectification (Art. 16)

**Objectif** : Corriger des donnees inexactes ou incompletes

**Procedure** :
1. Verifier l'identite
2. Identifier les donnees a rectifier
3. Verifier l'exactitude des nouvelles donnees
4. Effectuer la modification
5. Informer les destinataires (si applicable)
6. Confirmer au demandeur

**Points d'attention** :
- Conserver trace de l'ancienne valeur
- Documenter la justification de la modification

---

### 4.3 Droit a l'effacement (Art. 17)

**Objectif** : Supprimer les donnees personnelles

**Conditions d'application** :
- [ ] Donnees plus necessaires
- [ ] Retrait du consentement
- [ ] Opposition fondee
- [ ] Traitement illicite
- [ ] Obligation legale d'effacement

**Exceptions (refus legitime)** :
- Liberte d'expression
- Obligation legale (ex: conservation 10 ans avocat)
- Archivage interet public
- Defense de droits en justice

**Procedure si accepte** :
1. Verifier les conditions
2. Verifier absence d'exception
3. Proceder a l'anonymisation (pas suppression complete)
4. Informer les destinataires
5. Confirmer au demandeur

**Procedure si refuse** :
1. Documenter les motifs legaux
2. Repondre avec explication claire
3. Informer du droit de recours CNIL

---

### 4.4 Droit a la limitation (Art. 18)

**Objectif** : Geler le traitement des donnees

**Conditions** :
- Contestation de l'exactitude
- Traitement illicite (preferant limitation a effacement)
- Donnees necessaires pour defense juridique
- Verification opposition Art. 21

**Effet** : Donnees conservees mais non traitees (sauf stockage)

**Procedure** :
1. Marquer les donnees comme "limitees"
2. Bloquer tout traitement actif
3. Informer avant levee de la limitation

---

### 4.5 Droit a la portabilite (Art. 20)

**Objectif** : Recuperer ses donnees dans un format exploitable

**Conditions** :
- Traitement fonde sur consentement ou contrat
- Traitement automatise

**Format de reponse** :
- JSON structure (recommande)
- CSV (alternative)
- XML (si demande)

**Procedure** :
1. Identifier les donnees concernees
2. Exporter via `/rgpd/clients/{id}/export`
3. Transmettre de maniere securisee

---

### 4.6 Droit d'opposition (Art. 21)

**Objectif** : S'opposer au traitement des donnees

**Application** :
- Opposition au marketing direct : automatique
- Autres cas : evaluation motifs legitimes

**Procedure** :
1. Verifier le fondement legal du traitement
2. Si interet legitime : evaluer la demande
3. Accepter ou refuser avec motivation
4. Si accepte : cesser le traitement

---

## 5. Delais de reponse

### 5.1 Delai standard

**1 mois** a compter de la reception de la demande complete.

### 5.2 Prolongation

Possible de **2 mois supplementaires** si :
- Demande complexe
- Nombre eleve de demandes

**Obligation** : Informer dans le premier mois avec justification.

### 5.3 Calcul du delai

- Jour 0 : Date de reception
- En cas de verification d'identite : jour de verification complete
- Jours feries : inclus dans le calcul

---

## 6. Reponse au demandeur

### 6.1 Contenu minimum

- Confirmation de reception
- Suite donnee (acceptation ou refus)
- Si refus : motifs et voies de recours

### 6.2 Format

- Meme canal que la demande (sauf indication contraire)
- Format electronique privilegie
- Copie papier sur demande

### 6.3 Voies de recours

Mentionner systematiquement :
- Droit de reclamation aupres de la CNIL
- Droit de recours juridictionnel

---

## 7. Documentation

### 7.1 Pour chaque demande

Conserver pendant 3 ans :
- Copie de la demande originale
- Preuve de verification d'identite
- Date de reponse
- Contenu de la reponse
- Justification si refus

### 7.2 Statistiques

Suivre mensuellement :
- Nombre de demandes par type
- Delai moyen de traitement
- Taux d'acceptation/refus
- Demandes en retard

---

## 8. Cas particuliers

### 8.1 Demande pour un mineur

- < 15 ans : Demande par titulaire autorite parentale
- >= 15 ans : Demande directe possible

### 8.2 Demande pour une personne decedee

- Heritiers : Acces aux donnees necessaires succession
- Limites : Respect instructions du defunt

### 8.3 Demande abusive

Criteres de rejet :
- Repetition excessive
- Intention de nuire evidente
- Charge manifestement disproportionnee

**Important** : Documenter soigneusement la qualification

---

## 9. Contacts

| Role | Email |
|------|-------|
| DPO | dpo@cabinet.fr |
| Support RGPD | rgpd@cabinet.fr |
| Direction | direction@cabinet.fr |

---

## Historique des modifications

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-02-02 | 1.0 | Creation initiale |

---

*Document a revoir annuellement*
