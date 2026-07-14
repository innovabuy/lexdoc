# LexDoc — Procédure de restauration (à 3h du matin, sous stress)

> Sauvegardes : `/opt/backups/lexdoc/` — `db_*.backup` (PostgreSQL `-Fc`),
> `minio_*.tar.gz` (documents), `env_*.backup` (secrets, chmod 600). Rétention 7 j.
> Script : `ops/backup.sh` (cron root `0 3 * * *`).

## 0. Choisir la sauvegarde
```bash
ls -lt /opt/backups/lexdoc/db_*.backup      # la plus récente en haut
D=20260713_0300                             # ← timestamp choisi (adapter)
```
Vérifier que le trio existe : `db_$D.backup`, `minio_$D.tar.gz`, `env_$D.backup`.

## 1. Restaurer la BASE PostgreSQL

### 1a. Vérifier que le dump est lisible (AVANT de toucher au live)
```bash
docker cp /opt/backups/lexdoc/db_$D.backup postgres-lexdoc:/tmp/r.backup
docker exec postgres-lexdoc pg_restore -l /tmp/r.backup | head    # doit lister les tables
```

### 1b. Restaurer dans une base JETABLE d'abord (validation)
```bash
docker exec postgres-lexdoc psql -U lexdoc_user -d postgres -c "DROP DATABASE IF EXISTS lexdoc_restore;"
docker exec postgres-lexdoc psql -U lexdoc_user -d postgres -c "CREATE DATABASE lexdoc_restore;"
docker exec postgres-lexdoc pg_restore -U lexdoc_user -d lexdoc_restore /tmp/r.backup
docker exec postgres-lexdoc psql -U lexdoc_user -d lexdoc_restore -c \
  "select count(*) clients from clients; select count(*) documents from documents;"
```
Si les comptes sont cohérents → passer au live.

### 1c. Restaurer sur le LIVE (⚠️ écrase les données actuelles)
```bash
# Arrêter l'app pour éviter les écritures concurrentes
pm2 stop lexdoc-api
# Recréer la base cible proprement
docker exec postgres-lexdoc psql -U lexdoc_user -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='lexdoc_dev';"
docker exec postgres-lexdoc psql -U lexdoc_user -d postgres -c "DROP DATABASE lexdoc_dev;"
docker exec postgres-lexdoc psql -U lexdoc_user -d postgres -c "CREATE DATABASE lexdoc_dev OWNER lexdoc_user;"
docker exec postgres-lexdoc pg_restore -U lexdoc_user -d lexdoc_dev /tmp/r.backup
pm2 start lexdoc-api
curl -s http://127.0.0.1:4000/api/health          # doit renvoyer status ok
```

## 2. Restaurer les DOCUMENTS (MinIO)
```bash
# Le tar contient le dossier `minio/` (= le volume monté sur /data du conteneur).
pm2 stop lexdoc-api                                # optionnel, évite les lectures pendant la restauration
docker stop minio-lexdoc
# Sauvegarder l'état actuel avant d'écraser
mv /opt/lexdoc-data/minio /opt/lexdoc-data/minio.avant-restore.$(date +%s)
tar xzf /opt/backups/lexdoc/minio_$D.tar.gz -C /opt/lexdoc-data     # recrée /opt/lexdoc-data/minio
docker start minio-lexdoc
pm2 start lexdoc-api
```
Vérifier : générer/télécharger un document via l'app.

## 3. Restaurer les SECRETS (.env) — si perdu
```bash
sudo cp /opt/backups/lexdoc/env_$D.backup /home/lexdoc-dev/backend/.env
sudo chmod 600 /home/lexdoc-dev/backend/.env
pm2 restart lexdoc-api
```

## 4. Reconstruction complète (serveur perdu)
Ordre : (a) réinstaller Docker + conteneurs `postgres-lexdoc` / `minio-lexdoc`
(**publier en `127.0.0.1` — cf. SESSION_REPRISE, Docker bypasse UFW**),
(b) restaurer `.env` (§3), (c) base (§1c), (d) documents (§2), (e) `pm2 start`,
(f) nginx + health.

## Nettoyage
```bash
docker exec postgres-lexdoc rm -f /tmp/r.backup
docker exec postgres-lexdoc psql -U lexdoc_user -d postgres -c "DROP DATABASE IF EXISTS lexdoc_restore;"
```

## 5. « Le serveur a brûlé » — reconstruction depuis le HORS-SITE
> Pré-requis : réplication hors-site en place (`ops/replicate-offsite.sh`, cf.
> `ops/OFFSITE-SETUP.md`) + tu détiens la **clé privée GPG + passphrase** (hors serveur).
>
> **Paire en service : `47E9C4629776EE0F2137D5CD5A0C4C398DEDD473`** (UID
> `LexDoc Backup Offsite <backup@lexdoc.fr>`). Le serveur ne détient que la clé
> **publique** (`ops/backup-pubkey.asc`) — il chiffre mais **ne peut pas déchiffrer**
> (vérifié : `gpg -d` sur le serveur → `No secret key`). Historique des paires perdues :
> cf. **post-mortem** dans `ops/OFFSITE-SETUP.md`.

```bash
# a) Nouveau serveur : Docker + rclone + la clé PRIVÉE importée
curl https://rclone.org/install.sh | sudo bash
rclone config                         # recréer le remote "offsite" (mêmes creds bucket)
gpg --import lexdoc-backup-PRIVATE.asc # depuis ton coffre

# b) Récupérer les backups chiffrés
mkdir -p /restore && cd /restore
rclone copy offsite:lexdoc-backups-offsite /restore   # db_*.gpg, env_*.gpg, minio_*.gpg
D=20260713_0300                       # ← choisir le jeu le plus récent

# c) Déchiffrer (clé privée + passphrase)
for f in db_$D.backup env_$D.backup minio_$D.tar.gz; do
  gpg --pinentry-mode loopback --passphrase '<PASSPHRASE>' -o "$f" -d "$f.gpg"
done

# d) Remonter la stack (conteneurs en 127.0.0.1 — cf. SESSION_REPRISE, Docker bypasse UFW),
#    puis restaurer : base (§1c avec db_$D.backup), documents (§2 avec minio_$D.tar.gz),
#    .env (§3 avec env_$D.backup). Enfin pm2 start + nginx + health.
```
**Sans la clé privée, les backups hors-site sont illisibles.** La stocker hors-ligne
(gestionnaire de mots de passe + copie physique) est aussi critique que les backups
eux-mêmes.

## 6. Test de survie au sinistre — **depuis TA machine (Windows), Jeff**
> C'est LE test qui prouve que le hors-site est réel : télécharger un backup chiffré
> depuis Scaleway et l'ouvrir **sans le serveur**. À refaire après chaque rotation de clé.
>
> Pré-requis (une fois) : installer **rclone for Windows** (https://rclone.org/downloads/)
> et **Gpg4win** (https://gpg4win.org — fournit `gpg`/Kleopatra), puis importer ta clé
> privée depuis ton gestionnaire de mots de passe :
> ```powershell
> gpg --import lexdoc-backup-PRIVATE.asc      # le bloc privé stocké dans ton coffre
> ```

```powershell
# a) configurer le remote Scaleway (une fois) — mêmes creds bucket
rclone config create offsite s3 provider Scaleway env_auth false `
  access_key_id VOTRE_ACCESS_KEY secret_access_key VOTRE_SECRET_KEY `
  region fr-par endpoint s3.fr-par.scw.cloud

# b) lister et télécharger le dernier jeu chiffré
rclone lsf --format "sp" offsite:lexdoc-backups-offsite      # voir les .gpg + tailles
mkdir %USERPROFILE%\lexdoc-restore
rclone copy offsite:lexdoc-backups-offsite %USERPROFILE%\lexdoc-restore
cd %USERPROFILE%\lexdoc-restore

# c) DÉCHIFFRER avec ta clé privée + passphrase (gpg demandera la passphrase)
gpg --output db.backup    --decrypt db_20260713_0400.backup.gpg
gpg --output minio.tar.gz --decrypt minio_20260713_0400.tar.gz.gpg
gpg --output env.backup   --decrypt env_20260713_0400.backup.gpg
```
**Vérifier que ça s'ouvre vraiment** (PRÉSENCE, jamais le CONTENU) :
- `db.backup` : `pg_restore -l db.backup | grep -cE 'TABLE DATA public (clients|documents|folders)'` → **3**.
- `minio.tar.gz` : `tar tzf minio.tar.gz | grep -c '^minio/'` → **> 0** (ne pas dérouler : les
  chemins révèlent des noms de fichiers clients).
- `env.backup` : `grep -c '^DATABASE_URL=' env.backup` → **1**.
  🔴 **NE JAMAIS afficher le contenu de `env.backup`** (`cat`/`less`/`grep` sans `-c`) : ce
  fichier déchiffré contient TOUS les secrets en clair (mot de passe DB, `JWT_SECRET`, clés
  MinIO, SMTP…). On vérifie qu'une ligne existe, jamais ce qu'elle contient.

Si les 3 comptes sont bons → **le hors-site protège réellement du sinistre** — sans avoir
affiché le moindre secret. Sinon, ta copie de la clé privée/passphrase est en cause :
reprends-la depuis le gestionnaire de mots de passe.

## État actuel
- ✅ Backups locaux : DB + `.env` + **MinIO** (documents), restaurables, script durci
  (cron `0 3 * * *`).
- ✅ **Hors-site OPÉRATIONNEL** (GO-LIVE-2.E-ter, 2026-07-13) : Scaleway Object Storage
  `fr-par`, bucket `lexdoc-backups-offsite`, chiffrement GPG **clé publique** avant envoi
  (paire `47E9C462…8DEDD473`), cron `0 4 * * *`, rétention distante 30 j, échec bruyant.
  Vérifié : 23 objets `.gpg` uploadés, chiffrés vers la sous-clé `C366F9FD394B8C0B`
  (déchiffrables **uniquement** par la clé privée de Jeff, hors serveur).
- 🟠 **Reste à faire par Jeff** : le **test de survie depuis son poste Windows** (§6) —
  télécharger + déchiffrer un backup hors serveur. Tant qu'il n'est pas fait, la
  restaurabilité réelle n'est pas prouvée de bout en bout.
