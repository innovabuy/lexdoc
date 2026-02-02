# Instruction #9 - Formulaire Client Public

## Objectif
Permettre aux clients de remplir un formulaire public pour fournir leurs informations, avec création automatique de fiche client et consentement RGPD.

## Fonctionnalités

### Formulaire Public
- URL unique par cabinet: `/form/{cabinetSlug}`
- Token temporaire pour sécurité
- Pas d'authentification requise
- Design responsive mobile

### Champs du Formulaire

**Particulier:**
- Civilité, Nom, Prénom
- Date de naissance
- Adresse complète
- Téléphone, Email
- Profession

**Entreprise:**
- Dénomination sociale
- Forme juridique
- SIRET
- Adresse siège
- Représentant légal
- Contact

### Consentement RGPD
- Case à cocher obligatoire
- Lien vers politique de confidentialité
- Enregistrement horodaté du consentement
- IP et user-agent conservés

## Flux de Données

```
1. Client accède au formulaire
2. Remplit les informations
3. Accepte le consentement RGPD
4. Soumet le formulaire
5. → Création Client en base
6. → Création RgpdConsent
7. → Notification à l'avocat
8. → Email de confirmation au client
```

## API Endpoints

- `GET /api/public/form/:token` - Récupérer config formulaire
- `POST /api/public/form/:token` - Soumettre le formulaire
- `GET /api/public/form/:token/privacy` - Politique confidentialité

## Sécurité

- Token à durée limitée (24h)
- Rate limiting (5 soumissions/IP/heure)
- Validation des données
- Sanitization des entrées
- Pas de données sensibles en clair

## Interface

### Page Formulaire
- Logo du cabinet
- Formulaire multi-étapes
- Validation en temps réel
- Indicateur de progression
- Message de confirmation

### Administration
- Génération de liens de formulaire
- Personnalisation des champs
- Consultation des soumissions
- Export des données

## Statut
✅ Complété
