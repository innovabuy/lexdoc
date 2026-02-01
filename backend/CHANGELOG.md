# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Versionnement Sémantique](https://semver.org/lang/fr/).

## [1.0.0] - 2026-01-28

### Ajouté

#### Infrastructure
- Configuration TypeScript stricte avec path aliases
- ESLint et Prettier pour la qualité du code
- Jest et Supertest pour les tests d'intégration
- Dockerfile multi-stage optimisé pour la production
- Support des variables d'environnement avec validation

#### Base de données
- Schéma Prisma complet avec tous les modèles
- Row Level Security (RLS) pour l'isolation multi-tenant
- Migrations initiales avec politiques de sécurité
- Script de seed pour les données de démonstration

#### Authentification (`/api/auth`)
- Inscription cabinet avec création automatique admin
- Connexion avec email/mot de passe
- Système JWT avec access et refresh tokens
- Support 2FA complet (setup, enable, disable, verify)
- Déconnexion avec invalidation du refresh token

#### Gestion des cabinets (`/api/cabinets`)
- Récupération des informations du cabinet courant
- Mise à jour des informations (admin uniquement)
- Statistiques du cabinet (utilisateurs, documents, stockage)

#### Gestion des utilisateurs (`/api/users`)
- CRUD complet des utilisateurs
- Gestion des rôles (ADMIN, AVOCAT, SECRETAIRE)
- Gestion des statuts (ACTIVE, INACTIVE, SUSPENDED)
- Changement de mot de passe
- Soft delete pour la suppression

#### Sécurité
- Middleware d'authentification JWT
- Middleware de contexte tenant pour RLS
- Rate limiting par IP et endpoint
- Validation des entrées avec Zod
- Chiffrement des données sensibles (AES-256-GCM)
- Hashage des mots de passe (bcrypt, 12 rounds)
- Headers de sécurité avec Helmet

#### Monitoring
- Endpoints de health check (global, DB, MinIO)
- Logging structuré avec Winston
- Logs d'audit pour les actions importantes

#### Documentation
- Documentation Swagger/OpenAPI auto-générée
- README complet avec instructions
- Fichier .env.example documenté

### Sécurité

- Isolation complète des données entre cabinets via RLS PostgreSQL
- Tokens JWT avec durée de vie limitée
- Protection contre les attaques courantes (XSS, CSRF, injection)
- Validation stricte de toutes les entrées utilisateur

---

## Types de changements

- **Ajouté** pour les nouvelles fonctionnalités
- **Modifié** pour les changements de fonctionnalités existantes
- **Déprécié** pour les fonctionnalités qui seront supprimées
- **Retiré** pour les fonctionnalités supprimées
- **Corrigé** pour les corrections de bugs
- **Sécurité** pour les mises à jour de sécurité
