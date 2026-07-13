# Réplication hors-site des sauvegardes (GO-LIVE-2.E)

> Objectif : que la perte totale du VPS (panne, erreur, compromission) ne détruise
> PAS les sauvegardes en même temps que la production. Le serveur ne détient que la
> clé **publique** : il chiffre les backups mais **ne peut pas les déchiffrer**. La
> clé **privée + passphrase** vivent **hors serveur**, chez Jeff.

---

## ⚠️ POST-MORTEM — la 1re paire GPG a été perdue (à lire avant toute régénération)

**Ce qui s'est passé.** La première paire (`D33E4DF4…131A602E`) a été générée sur le
serveur, mais **détruite avant que Jeff ne la récupère** : `passphrase.txt` a été
supprimée lors d'un nettoyage, la clé privée n'a jamais quitté la machine.
Aucune perte réelle (bucket vide, rien n'avait été chiffré ni uploadé), mais le
dispositif était **factice**.

**Cause racine.** Le workflow demandait à Jeff de récupérer la clé *après* génération,
« plus tard ». Le nettoyage est passé avant la récupération. Pire : le test de
déchiffrement était fait **sur le serveur** → il prouvait que la crypto marchait, **pas**
que Jeff pouvait restaurer depuis un serveur mort. Fausse confiance.

**Second incident (paire `ECDA332E…`).** La régénération a d'abord **affiché** la
passphrase et la clé privée dans un rapport ; comme ces rapports sont copiés-collés
hors du terminal, la passphrase a été considérée **compromise**. Paire jetée.

**Règles qui en découlent (appliquées ci-dessous) :**
1. **Aucun secret n'est jamais affiché** (passphrase, clé privée, clé API). Il est écrit
   dans un fichier `600`, et seul le **chemin** est communiqué.
2. Jeff **rapatrie et confirme AVANT** toute suppression. Rien n'est détruit tant qu'il
   n'a pas dit « c'est en sécurité chez moi ».
3. Le seul test qui compte : après retrait de la clé privée, **le serveur DOIT échouer à
   déchiffrer**. C'est ça la preuve — pas un déchiffrement réussi sur le serveur.
4. Le vrai test de survie au sinistre se fait **depuis la machine de Jeff** (cf. §6).

---

## Paire en service

| | |
|---|---|
| **Empreinte** | `47E9C4629776EE0F2137D5CD5A0C4C398DEDD473` (clé `5A0C4C398DEDD473`, sous-clé de chiffrement `C366F9FD394B8C0B`) |
| **UID** | `LexDoc Backup Offsite (offsite backup encryption) <backup@lexdoc.fr>` |
| **Clé publique (serveur)** | `ops/backup-pubkey.asc` — trackée git, sert à **chiffrer** |
| **Clé privée + passphrase** | **hors serveur uniquement**, chez Jeff (gestionnaire de mots de passe + copie hors-ligne). Le serveur en est **incapable de déchiffrer** — vérifié. |

---

## 1. Fournisseur (décision Jeff — retenu : Scaleway)

Contraintes : **hébergement UE (RGPD, données d'avocat français)**, S3-compatible,
chiffrement au repos + en transit, coût dérisoire (~30 Mo/jour × 30 j ≈ 1 Go).

| Fournisseur | RGPD | Prix indicatif | Note |
|---|---|---|---|
| **Scaleway Object Storage** (fr-par) ⭐ | 🇫🇷 société française | ~0,012 €/Go/mois (75 premiers Go gratuits) | **Retenu** : français, facturation/support FR, pas de CLOUD Act US |
| OVHcloud Object Storage (GRA/SBG) | 🇫🇷 | ~0,01 €/Go/mois | Équivalent |
| Backblaze B2 (EU Amsterdam) | 🇪🇺 données UE, société US | ~0,006 $/Go/mois | Moins cher mais société US |

Coût réel attendu : **quelques centimes à ~1 €/mois**.

## 2. Bucket Scaleway (créé par Jeff)
1. Console Scaleway → **Object Storage** → **Create bucket**, région **fr-par (Paris)**,
   nom `lexdoc-backups-offsite`, visibilité **Private**.
2. **API Keys** → générer une clé (Access Key + Secret Key) avec accès Object Storage.

## 3. Configuration serveur (rclone) — **sans jamais afficher les clés**
rclone est déjà installé (`/usr/bin/rclone`). La config se fait **sans écho** des
secrets : Jeff dépose les 2 clés dans un fichier `600`, le script les lit, puis le
fichier est `shred`.

```bash
# a) Jeff dépose les clés dans un fichier temporaire (ligne 1 = Access Key, ligne 2 = Secret Key)
#    (depuis SA machine, sans les coller dans un chat)
scp cle-scaleway.txt root@76.13.50.173:/root/scw-api.txt      # OU: nano /root/scw-api.txt sur le serveur

# b) création du remote SANS afficher les clés
AK=$(sed -n 1p /root/scw-api.txt); SK=$(sed -n 2p /root/scw-api.txt)
rclone config create offsite s3 \
  provider Scaleway env_auth false \
  access_key_id "$AK" secret_access_key "$SK" \
  region fr-par endpoint s3.fr-par.scw.cloud
unset AK SK
chmod 600 /root/.config/rclone/rclone.conf
shred -u /root/scw-api.txt          # les clés ne restent nulle part en clair

# c) vérifier (n'affiche pas les clés)
rclone lsd offsite:
```
`rclone.conf` est **hors du repo** (`/root/.config/rclone/`) et **gitignoré**
(`rclone.conf`, `*.rclone.conf`).

## 4. Planification (cron root, après le backup local de 3h)
```bash
crontab -e
#   0 4 * * * RCLONE_REMOTE=offsite:lexdoc-backups-offsite /home/lexdoc-dev/ops/replicate-offsite.sh
```
Rétention distante 30 j (`REMOTE_RETENTION_DAYS`). Échec **bruyant** (log + `logger` +
`mail root`), jamais silencieux.

## 5. Test bout-en-bout serveur (chiffrement + upload)
```bash
RCLONE_REMOTE=offsite:lexdoc-backups-offsite /home/lexdoc-dev/ops/replicate-offsite.sh
rclone lsf --format "sp" offsite:lexdoc-backups-offsite      # voir les .gpg + tailles
```
Le **déchiffrement n'est PAS testable sur le serveur** (il n'a pas la clé privée) —
c'est **voulu**. Le vrai test se fait chez Jeff (§6).

## 6. Test de survie au sinistre — **depuis la machine de Jeff (Windows)**
> C'est LE test qui prouve qu'on peut restaurer après « le serveur a brûlé ».
> Pré-requis : **rclone for Windows** + **Gpg4win (Kleopatra/gpg)**, et la clé privée +
> passphrase importées depuis le gestionnaire de mots de passe. Voir `ops/RESTORE.md §6`.

Un backup hors-site **non restauré depuis un poste tiers** ne vaut pas mieux qu'un backup
local non restauré.
