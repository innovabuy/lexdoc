# Procedure en cas de Violation de Donnees

## Conformite Articles 33 et 34 RGPD

---

## 1. Definition

Une violation de donnees personnelles est une violation de la securite entrainant, de maniere accidentelle ou illicite :
- La destruction
- La perte
- L'alteration
- La divulgation non autorisee
- L'acces non autorise

a des donnees personnelles.

---

## 2. Detection et signalement interne

### 2.1 Canaux de signalement

Tout incident doit etre signale immediatement via :
- Email : security@cabinet.fr
- Telephone : [NUMERO URGENCE]
- Formulaire interne de signalement

### 2.2 Qui peut signaler ?

- Tout collaborateur du cabinet
- Tout sous-traitant
- Tout utilisateur de la plateforme

### 2.3 Informations a fournir

- Date et heure de detection
- Nature de l'incident
- Systemes/donnees concernes
- Actions deja entreprises
- Coordonnees du declarant

---

## 3. Evaluation initiale (< 24h)

### 3.1 Equipe de crise

| Role | Responsabilite |
|------|----------------|
| DPO | Coordination, notification CNIL |
| DSI | Investigation technique |
| Direction | Decisions strategiques |
| Communication | Relations externes |

### 3.2 Criteres d'evaluation

Evaluer systematiquement :

1. **Nature des donnees**
   - Donnees sensibles (Art. 9) ?
   - Donnees financieres ?
   - Donnees d'identification ?

2. **Nombre de personnes concernees**
   - < 100 : Impact limite
   - 100-1000 : Impact moyen
   - > 1000 : Impact eleve

3. **Gravite potentielle**
   - Discrimination
   - Usurpation d'identite
   - Perte financiere
   - Atteinte a la reputation

### 3.3 Matrice de risque

| Probabilite / Impact | Mineur | Modere | Majeur | Critique |
|---------------------|--------|--------|--------|----------|
| Peu probable | Faible | Faible | Moyen | Moyen |
| Possible | Faible | Moyen | Eleve | Eleve |
| Probable | Moyen | Eleve | Eleve | Critique |
| Certain | Moyen | Eleve | Critique | Critique |

---

## 4. Notification a la CNIL (< 72h)

### 4.1 Obligation de notification

Notification obligatoire si la violation est susceptible d'engendrer un risque pour les droits et libertes des personnes.

**Exception** : Pas de notification si risque negligeable.

### 4.2 Contenu de la notification

Via le teleservice de la CNIL : https://notifications.cnil.fr

Informations requises :
- Nature de la violation
- Categories et nombre de personnes concernees
- Categories et nombre d'enregistrements
- Nom et coordonnees du DPO
- Consequences probables
- Mesures prises ou envisagees

### 4.3 Notification en plusieurs temps

Si toutes les informations ne sont pas disponibles dans les 72h, notification initiale puis complementaire.

---

## 5. Communication aux personnes concernees

### 5.1 Obligation de communication

Communication obligatoire si la violation est susceptible d'engendrer un **risque eleve** pour les droits et libertes.

### 5.2 Exceptions

Pas de communication si :
- Donnees chiffrees (cle non compromise)
- Mesures rendant les donnees incomprehensibles
- Effort disproportionne (communication publique)

### 5.3 Contenu de la communication

En termes clairs et simples :
- Nature de la violation
- Nom et coordonnees du DPO
- Consequences probables
- Mesures prises
- Recommandations (changement de mot de passe, vigilance...)

### 5.4 Moyens de communication

- Email individuel (prioritaire)
- Courrier postal si necessaire
- Communication publique en dernier recours

---

## 6. Mesures correctives

### 6.1 Court terme (< 48h)

- [ ] Isoler les systemes compromis
- [ ] Revoquer les acces compromis
- [ ] Sauvegarder les preuves
- [ ] Activer les sauvegardes

### 6.2 Moyen terme (< 1 semaine)

- [ ] Analyser la cause racine
- [ ] Corriger les vulnerabilites
- [ ] Renforcer les controles
- [ ] Tester les corrections

### 6.3 Long terme (< 1 mois)

- [ ] Reviser les politiques de securite
- [ ] Former les collaborateurs
- [ ] Auditer les systemes
- [ ] Mettre a jour la documentation

---

## 7. Documentation

### 7.1 Registre des violations

Tenir un registre contenant :
- Faits concernant la violation
- Effets de la violation
- Mesures prises

Conservation : 5 ans minimum

### 7.2 Rapport d'incident

Rediger un rapport complet incluant :
- Chronologie des evenements
- Analyse technique
- Impact evalue
- Mesures correctives
- Lecons apprises
- Plan d'amelioration

---

## 8. Post-incident

### 8.1 Debriefing

Organiser une reunion de retour d'experience :
- Participants : equipe de crise
- Delai : < 2 semaines apres cloture
- Objectif : identifier les ameliorations

### 8.2 Mise a jour des procedures

- Reviser la presente procedure si necessaire
- Mettre a jour le plan de continuite
- Integrer les lecons apprises

---

## 9. Contacts utiles

| Contact | Coordonnees |
|---------|-------------|
| CNIL - Notifications | https://notifications.cnil.fr |
| CNIL - Standard | 01 53 73 22 22 |
| ANSSI - CERT-FR | cert-fr@ssi.gouv.fr |
| Cybermalveillance | https://www.cybermalveillance.gouv.fr |

---

## Historique des modifications

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-02-02 | 1.0 | Creation initiale |

---

*Document a tester annuellement via exercice de simulation*
