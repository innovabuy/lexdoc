# Instruction #16 - Envois, Tracking et Relances

## Objectif
Implémenter le système d'envoi de documents (signature électronique, LRAR), le suivi en temps réel et les relances automatiques.

## Fonctionnalités

### Signature Électronique (Universign)
- Envoi pour signature
- Multi-signataires
- Ordre de signature
- Suivi en temps réel
- Récupération document signé

### LRAR (SendingBox)
- Envoi lettre recommandée
- Suivi postal
- Preuve de dépôt
- Accusé de réception

### Tracking Unifié
- Statut centralisé
- Historique des événements
- Notifications en temps réel

## Modèle DocumentTracking

```prisma
model DocumentTracking {
  id                   String
  documentId           String    @unique
  status               DocumentTrackingStatus
  deliveryMethod       DeliveryMethod?

  // Signature
  signatureRequestId   String?
  signatureStatus      TrackingSignatureStatus?
  signedAt             DateTime?
  signedBy             String[]
  expiresAt            DateTime?

  // LRAR
  lrarRequestId        String?
  lrarTrackingNumber   String?
  lrarStatus           TrackingLrarStatus?
  sentAt               DateTime?
  deliveredAt          DateTime?

  // Relances
  reminderCount        Int       @default(0)
  lastReminderAt       DateTime?
  nextReminderAt       DateTime?
  autoRemindersEnabled Boolean   @default(true)
  reminderFrequency    ReminderFrequency
  maxReminders         Int       @default(5)

  // Destinataires
  recipients           Json      // [{name, email, status}]
}
```

## Statuts de Tracking

```typescript
enum DocumentTrackingStatus {
  DRAFT              // Pas encore envoyé
  PENDING_SIGNATURE  // En attente de signature
  PARTIALLY_SIGNED   // Partiellement signé
  SIGNED             // Totalement signé
  PENDING_DELIVERY   // LRAR en cours
  DELIVERED          // LRAR livré
  CANCELLED          // Annulé
  EXPIRED            // Expiré
  FAILED             // Échec
}
```

## Système de Relances

### Configuration
- Fréquence: quotidien, 2 jours, 3 jours, hebdomadaire
- Nombre max de relances
- Activation/désactivation

### Job Cron
```typescript
// Exécution toutes les heures
cron.schedule('0 * * * *', processSignatureReminders);
```

### Processus
1. Recherche documents nécessitant relance
2. Envoi email de rappel
3. Envoi notification push (si client extranet)
4. Mise à jour compteur et date
5. Log de la relance

## Modèle ReminderLog

```prisma
model ReminderLog {
  id              String
  trackingId      String
  reminderNumber  Int
  sentTo          String
  sentAt          DateTime
  emailSubject    String
  emailBody       String
  opened          Boolean
  openedAt        DateTime?
  clicked         Boolean
  clickedAt       DateTime?
}
```

## Interface Utilisateur

### Composants
- `SendSignatureModal` - Modal d'envoi signature
- `SendLRARModal` - Modal d'envoi LRAR
- `DocumentStatusBadge` - Badge de statut
- `DocumentTrackingCard` - Carte de suivi détaillé
- `ReminderIndicator` - Indicateur de relances

### Vue Tracking
- Timeline des événements
- Statut par destinataire
- Actions disponibles
- Historique des relances

## API Endpoints

- `POST /api/documents/:id/send-signature` - Envoyer signature
- `POST /api/documents/:id/send-lrar` - Envoyer LRAR
- `GET /api/documents/:id/tracking` - Statut de suivi
- `POST /api/documents/:id/remind` - Relance manuelle
- `PUT /api/documents/:id/tracking/settings` - Config relances

## Statut
✅ Complété
