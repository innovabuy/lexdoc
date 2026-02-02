# Politique de Retention des Donnees

## Conformite Article 5.1.e RGPD - Limitation de la conservation

---

## 1. Principe general

Les donnees personnelles sont conservees uniquement pendant la duree necessaire aux finalites pour lesquelles elles ont ete collectees, conformement au principe de limitation de la conservation.

---

## 2. Durees de conservation par type de donnees

### 2.1 Donnees clients

| Type de donnees | Duree de conservation | Base legale | Action a expiration |
|-----------------|----------------------|-------------|---------------------|
| Dossier client actif | Duree de la prestation | Contrat | - |
| Dossier client cloture | 10 ans | Prescription actes avocat | Anonymisation |
| Documents generes | 10 ans | Prescription | Anonymisation |
| Correspondances | 10 ans | Prescription | Suppression |

### 2.2 Donnees de facturation

| Type de donnees | Duree de conservation | Base legale | Action a expiration |
|-----------------|----------------------|-------------|---------------------|
| Factures | 10 ans | Code de commerce | Archivage |
| Justificatifs comptables | 10 ans | Obligations fiscales | Archivage |

### 2.3 Donnees de consentement

| Type de donnees | Duree de conservation | Base legale | Action a expiration |
|-----------------|----------------------|-------------|---------------------|
| Preuves de consentement | 5 ans apres retrait | RGPD Art. 7.1 | Suppression |
| Demandes d'exercice des droits | 3 ans | Preuve de conformite | Anonymisation |

### 2.4 Donnees techniques

| Type de donnees | Duree de conservation | Base legale | Action a expiration |
|-----------------|----------------------|-------------|---------------------|
| Logs de connexion | 1 an | LCEN | Suppression |
| Logs d'audit RGPD | 5 ans | Preuve de conformite | Archivage |
| Donnees de session | Fin de session | Technique | Suppression |

---

## 3. Calcul du point de depart

| Situation | Point de depart |
|-----------|-----------------|
| Client actif | Date de debut de la prestation |
| Dossier cloture | Date de cloture du dossier |
| Consentement actif | Date de collecte du consentement |
| Consentement retire | Date de retrait |
| Demande RGPD | Date de cloture de la demande |

---

## 4. Procedures d'anonymisation

### 4.1 Donnees client

Lors de l'anonymisation d'un client :
- Nom → "[ANONYMISE]"
- Prenom → supprime
- Email → "anonymized-{id}@deleted.local"
- Telephone → supprime
- Adresse → "[SUPPRIME]"
- SIRET → supprime
- Donnees financieres → supprimees

### 4.2 Donnees documents

- Contenu sensible → [REDIGE]
- References personnelles → supprimees
- Metadonnees → conservees pour tracabilite

---

## 5. Automatisation

### 5.1 Tache CRON quotidienne

Une tache automatique s'execute chaque jour a 3h00 pour :
1. Identifier les entites ayant atteint leur date de retention
2. Appliquer l'anonymisation automatique
3. Journaliser les actions effectuees

### 5.2 Alertes

Des alertes sont generees :
- 30 jours avant expiration : notification administrateur
- A expiration : traitement automatique

---

## 6. Exceptions

### 6.1 Cas de prolongation

La duree peut etre prolongee dans les cas suivants :
- Litige en cours
- Obligation legale (requisition judiciaire)
- Demande explicite du client (avec nouveau consentement)

### 6.2 Documentation

Toute exception doit etre :
- Documentee avec justification
- Limitee dans le temps
- Revue periodiquement

---

## 7. Audit et controle

| Action | Frequence | Responsable |
|--------|-----------|-------------|
| Revue des politiques | Annuelle | DPO |
| Verification des durees | Trimestrielle | Administrateur |
| Test d'anonymisation | Semestriel | Technique |
| Audit de conformite | Annuel | DPO externe |

---

## Historique des modifications

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-02-02 | 1.0 | Creation initiale |

---

*Document a revoir annuellement*
