# Instruction #18 - PWA Installation Bureau

## Objectif
Convertir l'extranet client en Progressive Web App (PWA) installable sur bureau et mobile avec support hors-ligne et notifications push.

## Fonctionnalités PWA

### Installation
- Icône sur le bureau
- Mode standalone (sans barre URL)
- Splash screen au lancement
- Raccourcis d'application

### Hors-ligne
- Cache des pages visitées
- Documents récents disponibles
- Page de fallback offline
- Synchronisation au retour

### Notifications Push
- Nouveau document disponible
- Document à signer
- Rappels de signature
- Accusé de réception LRAR

## Fichiers PWA

### manifest.json
```json
{
  "name": "Extranet Client LexDoc",
  "short_name": "LexDoc Client",
  "description": "Accédez à vos documents juridiques",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0066ff",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512" }
  ],
  "shortcuts": [
    {
      "name": "Mes documents",
      "url": "/documents"
    }
  ]
}
```

### service-worker.js
```javascript
// Stratégie Network-first
// Cache des assets statiques
// Cache des documents consultés
// Gestion des notifications push
```

## Notifications Push

### Configuration VAPID
```env
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx
VAPID_SUBJECT=mailto:contact@lexdoc.fr
```

### Modèle PushSubscription
```prisma
model PushSubscription {
  id             String
  endpoint       String    @unique
  p256dh         String
  auth           String
  clientAccessId String
}
```

### API Push
- `GET /api/extranet/push/vapid-key` - Clé publique
- `POST /api/extranet/push/subscribe` - S'abonner
- `POST /api/extranet/push/unsubscribe` - Se désabonner

## Composants Frontend

### InstallButton
- Détection installation possible
- Prompt d'installation
- Badge "Installée" si déjà fait

### InstallBanner
- Bannière promotionnelle
- Apparaît après 3 secondes
- Dismissable (session)

### UpdateNotification
- Détection nouvelle version
- Prompt de mise à jour
- Rechargement automatique

### OfflineIndicator
- Détection état réseau
- Affichage discret si offline
- Animation de reconnexion

### PWAProvider
- Context React pour état PWA
- Gestion service worker
- État online/offline

## Service Worker

### Stratégies de Cache
- **Network-first**: API calls
- **Cache-first**: Assets statiques
- **Stale-while-revalidate**: Pages

### Événements
- `install` - Pré-cache des assets
- `activate` - Nettoyage ancien cache
- `fetch` - Interception requêtes
- `push` - Réception notification
- `notificationclick` - Clic notification

## Page Offline

- Message explicatif
- Bouton "Réessayer"
- Liste documents en cache
- Conseil d'installation

## Icônes

Tailles générées:
- 72x72, 96x96, 128x128
- 144x144, 152x152, 192x192
- 384x384, 512x512
- apple-touch-icon
- favicon

## Statut
✅ Complété
