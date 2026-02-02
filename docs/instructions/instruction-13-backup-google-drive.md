# Instruction #13 - Backup Google Drive

## Objectif
Implémenter un système de sauvegarde automatique vers Google Drive pour la protection des données.

## Architecture

### Composants
- **BackupService**: Orchestration des sauvegardes
- **Google Drive API**: Stockage distant
- **BackupLog**: Suivi des opérations

### Modèle BackupLog
```prisma
model BackupLog {
  id          String
  backupId    String       @unique
  status      BackupStatus // IN_PROGRESS, SUCCESS, FAILED
  provider    String       // GOOGLE_DRIVE, AWS_S3, LOCAL
  duration    Float?       // Durée en secondes
  error       String?
  metadata    Json?        // Tailles, fichiers, etc.
  startedAt   DateTime
  completedAt DateTime?
}
```

## Configuration Google Drive

### Variables d'Environnement
```env
GOOGLE_DRIVE_CLIENT_ID=xxx
GOOGLE_DRIVE_CLIENT_SECRET=xxx
GOOGLE_DRIVE_REFRESH_TOKEN=xxx
GOOGLE_DRIVE_FOLDER_ID=xxx
```

### Authentification OAuth2
1. Création projet Google Cloud
2. Activation Drive API
3. Configuration OAuth consent
4. Génération credentials
5. Obtention refresh token

## Contenu des Sauvegardes

### Documents
- Tous les fichiers MinIO
- Organisés par cabinet/dossier
- Métadonnées incluses

### Base de Données
- Export PostgreSQL (optionnel)
- Format SQL compressé

### Configuration
- Variables d'environnement (masquées)
- Schéma Prisma
- Configurations cabinet

## Planification

### Sauvegarde Quotidienne
- Exécution: 3h00 (cron)
- Incrémentielle si possible
- Rétention: 30 jours

### Sauvegarde Hebdomadaire
- Exécution: Dimanche 2h00
- Complète
- Rétention: 12 semaines

### Sauvegarde Mensuelle
- Exécution: 1er du mois
- Complète + vérification
- Rétention: 12 mois

## API Endpoints

- `POST /api/admin/backup/start` - Lancer sauvegarde manuelle
- `GET /api/admin/backup/status/:id` - Statut d'une sauvegarde
- `GET /api/admin/backup/history` - Historique des sauvegardes
- `POST /api/admin/backup/restore/:id` - Restaurer (admin)

## Monitoring

### Alertes
- Échec de sauvegarde
- Espace disque faible
- Délai dépassé

### Rapports
- Email quotidien de statut
- Dashboard admin
- Métriques de taille

## Sécurité

- Chiffrement en transit (HTTPS)
- Chiffrement au repos (Google)
- Accès restreint au dossier Drive
- Logs d'audit

## Statut
✅ Complété
