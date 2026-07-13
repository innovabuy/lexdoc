# LexDoc — Test de survie au sinistre, depuis TA machine (Windows), Jeff

> **Lis ceci quand le serveur est mort et que tu dois prouver — seul, sans lui —
> que les sauvegardes hors-site sont récupérables.**
>
> Tu n'as besoin de RIEN d'autre que : ce document, ta machine Windows, ta
> **clé privée GPG + sa passphrase** (dans ton gestionnaire de mots de passe),
> et tes **clés API Scaleway**. Aucun accès au serveur n'est requis — c'est
> justement le but : le serveur n'existe plus.
>
> ⚠️ **Pourquoi ce test compte.** Le « test de déchiffrement » de ce matin tournait
> SUR le serveur, avec la clé privée qui y traînait. Il prouvait que la crypto
> marche — **pas** que tu peux restaurer depuis un serveur disparu. Le seul test
> qui vaut est celui-ci : toi, ta machine, ta copie de la clé.
>
> **Règle du jeu :** à chaque étape, exécute la commande **exacte**, regarde si
> l'affichage correspond à « ✅ ce que tu dois voir », et si ça casse, applique
> « ❌ si ça échoue ». Ne saute aucune étape, même celles qui semblent évidentes.

---

## AVANT DE COMMENCER — ouvre PowerShell

1. Menu Démarrer → tape `powershell` → **Windows PowerShell** → Entrée.
2. Crée et entre dans un dossier de travail (tout se passera là) :

```powershell
mkdir $HOME\lexdoc-restore -Force
cd $HOME\lexdoc-restore
pwd
```

✅ **Ce que tu dois voir :** la dernière ligne affiche un chemin qui finit par
`\lexdoc-restore` (ex. `C:\Users\jeff\lexdoc-restore`). **Reste dans cette fenêtre
PowerShell jusqu'à la fin.**

---

## ÉTAPE 1 — Installer les 3 outils (rclone, GPG, et de quoi vérifier)

Tu installes trois choses : **rclone** (télécharge depuis Scaleway), **GPG**
(déchiffre), et — pour l'étape 5 — les **outils PostgreSQL** (ouvrent le dump).
`tar` est déjà présent dans Windows 10/11, rien à installer pour ça.

### 1.1 — rclone

**Méthode A (rapide, si `winget` existe) :**
```powershell
winget install Rclone.Rclone
```
Puis **ferme cette fenêtre PowerShell et rouvre-en une neuve** (pour que `rclone`
soit reconnu), et refais le `cd $HOME\lexdoc-restore`.

**Méthode B (sûre, marche toujours) :**
1. Va sur **https://rclone.org/downloads/**
2. Clique **« Windows - AMD64 - 64 Bit »** (le `.zip`). Enregistre-le.
3. Clic droit sur le `.zip` → **Extraire tout…**
4. Dans le dossier extrait, tu vois un fichier **`rclone.exe`**. Copie-le
   (`Ctrl+C`), puis colle-le (`Ctrl+V`) **dans ton dossier `lexdoc-restore`**.
5. Avec la méthode B, tu appelleras l'outil `.\rclone` (avec le `.\` devant),
   pas `rclone`.

**Vérifie que ça marche :**
```powershell
rclone version
# ou, si tu as fait la méthode B :
.\rclone version
```
✅ **Ce que tu dois voir :** `rclone v1.xx.x` et quelques lignes (os, arch…).
❌ **Si `rclone n'est pas reconnu…` :** avec la méthode A, tu n'as pas rouvert
PowerShell — ferme et rouvre. Avec la méthode B, `rclone.exe` n'est pas dans le
dossier courant — refais l'étape 1.1 B.4, et mets bien `.\rclone`.

> 📌 **Dans la suite, si tu as fait la méthode B, écris `.\rclone` partout où c'est
> écrit `rclone`.**

### 1.2 — GPG (Gpg4win)

1. Va sur **https://gpg4win.org** → **Download Gpg4win** → lance l'installateur.
2. Installe avec les options par défaut (garde **Kleopatra** coché — c'est lui qui
   affichera la fenêtre pour taper la passphrase).
3. **Ferme cette fenêtre PowerShell et rouvre-en une neuve** (Gpg4win ajoute `gpg`
   au système, mais seule une fenêtre neuve le voit), puis :
```powershell
cd $HOME\lexdoc-restore
gpg --version
```
✅ **Ce que tu dois voir :** `gpg (GnuPG) 2.x.x` + des lignes de licence.
❌ **Si `gpg n'est pas reconnu…` :** tu n'as pas rouvert PowerShell après
l'installation — ferme et rouvre la fenêtre.

### 1.3 — Importer TA clé privée GPG

C'est le cœur : sans la clé privée, les backups sont des blocs illisibles.

1. Ouvre ton **gestionnaire de mots de passe** et copie le **bloc complet** de la
   clé privée. Il commence par
   `-----BEGIN PGP PRIVATE KEY BLOCK-----` et finit par
   `-----END PGP PRIVATE KEY BLOCK-----` (garde ces deux lignes).
2. Ouvre le **Bloc-notes** (Notepad), colle le bloc, puis **Fichier → Enregistrer
   sous** :
   - Dossier : ton `lexdoc-restore`
   - Nom du fichier : **`lexdoc-backup-PRIVATE.asc`**
   - Type : **« Tous les fichiers (*.*) »** (⚠️ sinon Windows ajoute `.txt` et
     l'import échoue)
   - Encodage : **UTF-8**
3. Importe la clé :
```powershell
gpg --import lexdoc-backup-PRIVATE.asc
```
✅ **Ce que tu dois voir :** une ligne du type
`gpg: key 5A0C4C398DEDD473: secret key imported` (ou `clé secrète importée`).

### 1.4 — VÉRIFIE que la clé PRIVÉE est bien là (`sec`, pas `sec#`)

```powershell
gpg --list-secret-keys
```
✅ **Ce que tu dois voir** — une entrée qui commence par **`sec`** (clé secrète
présente), avec l'empreinte de la paire LexDoc :
```
sec   rsa4096 2026-07-13 [SCEAR]
      47E9C4629776EE0F2137D5CD5A0C4C398DEDD473
uid           [ unknown] LexDoc Backup Offsite (offsite backup encryption) <backup@lexdoc.fr>
ssb   rsa4096 2026-07-13 [SEA]
```
❌ **Si tu vois `sec#` (avec un dièse) au lieu de `sec` :** tu n'as importé que la
partie **publique** — le `#` veut dire « clé privée absente ». Tu ne pourras PAS
déchiffrer. Retourne en **1.3** et importe bien le bloc
`BEGIN PGP **PRIVATE** KEY BLOCK` (pas le bloc `PUBLIC`).
❌ **Si la liste est vide :** l'import a échoué (mauvais fichier / `.txt` caché).
Refais **1.3** en choisissant bien « Tous les fichiers » à l'enregistrement.

---

## ÉTAPE 2 — Se connecter à Scaleway et voir les sauvegardes

### 2.1 — Configurer le remote (une seule fois)

Remplace **`TON_ACCESS_KEY`** et **`TON_SECRET_KEY`** par tes vraies clés API
Scaleway (celles de ton coffre). **Tape-les toi-même — ne les colle jamais dans un
chat ni dans un mail.** Le `` ` `` en fin de ligne est une continuation PowerShell,
garde-le.

```powershell
rclone config create offsite s3 `
  provider Scaleway env_auth false `
  access_key_id TON_ACCESS_KEY secret_access_key TON_SECRET_KEY `
  region fr-par endpoint s3.fr-par.scw.cloud
```
✅ **Ce que tu dois voir :** un petit récapitulatif de config (type = s3,
provider = Scaleway, region = fr-par…) **sans erreur**. Les clés ne sont pas
réaffichées.

> 🔒 Après coup, tes clés restent dans `rclone.conf` (normal, c'est ta machine) et
> dans l'historique PowerShell. Si tu veux effacer cette dernière trace :
> `Clear-History; Remove-Item (Get-PSReadlineOption).HistorySavePath -ErrorAction SilentlyContinue`

### 2.2 — Lister le bucket : tu dois VOIR les `.gpg`

```powershell
rclone lsf --format "sp" offsite:lexdoc-backups-offsite
```
✅ **Ce que tu dois voir :** une liste `taille;nom` de fichiers finissant tous par
**`.gpg`**, par exemple :
```
213677;db_20260713_1407.backup.gpg
1688;env_20260713_1407.backup.gpg
26434166;minio_20260713_1407.tar.gz.gpg
...
```
❌ **Si `directory not found` / `AccessDenied` / erreur 403 :** clés API fausses ou
sans droit Object Storage → refais **2.1** avec les bonnes clés.
❌ **Si la liste est vide :** ce n'est pas le bon bucket. Vérifie dans la console
Scaleway que le bucket s'appelle exactement `lexdoc-backups-offsite`, région
`fr-par`.

---

## ÉTAPE 3 — Choisir le dernier jeu complet et le télécharger

Un « jeu complet » = les **trois** fichiers du **même horodatage** : `db_…`,
`env_…`, `minio_…`. (Certaines nuits n'ont que db+env ; il faut les trois pour une
vraie restauration, donc prends le dernier horodatage présent dans les **trois**.)

### 3.1 — Repérer le dernier horodatage complet

```powershell
$noms = rclone lsf offsite:lexdoc-backups-offsite
"MINIO (le facteur limitant) :"; $noms | Select-String '^minio_' | Sort-Object -Descending | Select-Object -First 3
```
✅ **Ce que tu dois voir :** les `minio_<horodatage>.tar.gz.gpg` les plus récents.
Prends l'horodatage du plus récent, ex. `20260713_1407`, et vérifie que db+env
existent aussi pour lui :
```powershell
$D = "20260713_1407"     # ← REMPLACE par l'horodatage que tu viens de voir
$noms | Select-String "_$D\."
```
✅ Tu dois voir **exactement trois lignes** : `db_$D.backup.gpg`,
`env_$D.backup.gpg`, `minio_$D.tar.gz.gpg`. Si l'une manque, choisis l'horodatage
complet précédent.

### 3.2 — Télécharger les trois fichiers de ce jeu

```powershell
rclone copy offsite:lexdoc-backups-offsite $HOME\lexdoc-restore `
  --include "db_$D.backup.gpg" --include "env_$D.backup.gpg" --include "minio_$D.tar.gz.gpg" `
  --progress
```
✅ **Ce que tu dois voir :** une barre de progression, puis retour à l'invite sans
erreur. Vérifie les tailles :
```powershell
Get-ChildItem *$D*.gpg | Select-Object Name, Length
```
✅ **Ce que tu dois voir :** trois fichiers ; `db_…` ≈ **200–220 Ko**, `env_…`
≈ **1–2 Ko**, `minio_…` **plusieurs Mo à dizaines de Mo** (pas 0 octet !).
❌ **Si un fichier fait 0 octet ou manque :** le téléchargement a été coupé — relance
la commande **3.2** (rclone reprend ce qui manque).

---

## ÉTAPE 4 — Déchiffrer les trois fichiers

GPG va afficher (via Kleopatra) une **fenêtre te demandant la passphrase** de la
clé privée. Prépare-la depuis ton coffre.

```powershell
gpg --output db.backup    --decrypt "db_$D.backup.gpg"
gpg --output minio.tar.gz --decrypt "minio_$D.tar.gz.gpg"
gpg --output env.backup   --decrypt "env_$D.backup.gpg"
```
✅ **Ce que tu dois voir** pour chacun : une fenêtre passphrase → tu tapes ta
passphrase → dans PowerShell, une ligne du type
`gpg: encrypted with rsa4096 key ... C366F9FD394B8C0B`
`gpg: ... "LexDoc Backup Offsite ..."` **sans message d'erreur**. Trois nouveaux
fichiers apparaissent : `db.backup`, `minio.tar.gz`, `env.backup`.

❌ **Si `gpg: decryption failed: No secret key` :** ta clé privée n'est PAS importée
(ou tu n'as importé que la publique). **Retourne à l'ÉTAPE 1.3/1.4** et assure-toi
d'avoir un **`sec`** (pas `sec#`).
❌ **Si `Bad passphrase` / mauvaise passphrase :** recommence, la passphrase est
celle du coffre (attention majuscules/espaces). Après 3 échecs, ferme la fenêtre et
relance la commande.
❌ **Si rien ne se passe / pas de fenêtre :** relance la commande ; si toujours rien,
lance d'abord `gpg-connect-agent /bye` puis réessaie.

---

## ÉTAPE 5 — LE POINT DE VÉRITÉ : les fichiers s'ouvrent-ils VRAIMENT ?

Déchiffrer ne suffit pas : il faut prouver que le **contenu** est exploitable.

### 5.1 — La base (`db.backup`)

C'est un dump PostgreSQL au format « custom ». Deux niveaux de preuve :

**Preuve FORTE (recommandée) — lister les tables avec `pg_restore` :**
`pg_restore` n'est **pas** livré avec Windows. Installe les outils clients :
1. Va sur **https://www.postgresql.org/download/windows/** → « Download the
   installer » (EDB).
2. Lance-le. À l'écran **« Select Components »**, **décoche tout sauf
   « Command Line Tools »** (tu n'as pas besoin du serveur). Termine.
3. Les outils sont dans `C:\Program Files\PostgreSQL\<version>\bin\`. Liste le
   contenu du dump (adapte le numéro de version au tien) :
```powershell
& "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -l db.backup | Select-String -Pattern "clients|documents|folders|TABLE"
```
✅ **Ce que tu dois voir :** des lignes listant des tables, dont **`clients`**,
**`documents`**, **`folders`** (parmi d'autres `TABLE DATA …`). **C'est LA preuve
que la base est récupérable.**

**Preuve MINIMALE (si tu ne peux pas installer PostgreSQL maintenant) —**
vérifier que le fichier est bien un dump PostgreSQL intègre (il commence par la
signature magique `PGDMP`) :
```powershell
$fs = [System.IO.File]::OpenRead("$PWD\db.backup"); $b = New-Object byte[] 5
$fs.Read($b,0,5) | Out-Null; $fs.Close()
[System.Text.Encoding]::ASCII.GetString($b)
(Get-Item db.backup).Length
```
✅ **Ce que tu dois voir :** la 1re sortie est **`PGDMP`**, et la taille est de
l'ordre de **200 000 octets** (pas 0, pas 20 octets). Cela prouve que le
déchiffrement a produit un vrai dump non corrompu. *(La preuve forte reste
préférable dès que tu peux installer les outils.)*
❌ **Si tu ne vois pas `PGDMP`** ou que la taille est ridicule : le déchiffrement a
échoué ou le fichier est corrompu → refais l'ÉTAPE 4 pour `db`.

### 5.2 — Les documents (`minio.tar.gz`)

`tar` est intégré à Windows 10/11 — rien à installer.
```powershell
tar -tzf minio.tar.gz | Select-Object -First 20
tar -tzf minio.tar.gz | Measure-Object -Line
```
✅ **Ce que tu dois voir :** une liste de chemins **commençant par `minio/`**
(dossiers/fichiers des documents stockés), et un **nombre de lignes > 0** (souvent
des centaines/milliers). C'est la preuve que les actes et pièces sont là.
❌ **Si `tar: Error opening archive` :** l'archive est corrompue ou le déchiffrement
a raté → refais l'ÉTAPE 4 pour `minio`.
❌ **Si `tar n'est pas reconnu` (vieux Windows) :** installe **7-Zip**
(https://www.7-zip.org), puis ouvre `minio.tar.gz` dedans (double décompression :
`.gz` → `.tar` → dossier `minio/`).

### 5.3 — Les secrets (`env.backup`)

```powershell
Select-String -Path env.backup -Pattern "DATABASE_URL|MINIO|JWT" | Select-Object -First 5
```
✅ **Ce que tu dois voir :** au moins une ligne **`DATABASE_URL=...`** (et
probablement des variables MinIO/JWT). C'est du texte lisible.
❌ **Si le fichier est illisible / vide :** déchiffrement raté → refais l'ÉTAPE 4
pour `env`.

---

## ÉTAPE 6 — CE QUI PROUVE LE SUCCÈS (critère non ambigu)

> ### ✅ Le test est RÉUSSI si, et seulement si, LES TROIS conditions suivantes sont vraies :
>
> 1. **Base** — `pg_restore -l db.backup` liste les tables **`clients`,
>    `documents`, `folders`** (preuve forte).
>    *À défaut d'outils PostgreSQL :* `db.backup` commence par **`PGDMP`** et pèse
>    ~200 Ko (preuve minimale acceptable en dépannage).
> 2. **Documents** — `tar -tzf minio.tar.gz` liste des chemins sous **`minio/`**,
>    en nombre **> 0**.
> 3. **Secrets** — `env.backup` contient une ligne **`DATABASE_URL=`** lisible.
>
> **Si les 3 sont vertes → le hors-site protège réellement du sinistre : depuis ta
> seule machine, sans le serveur, tu as reconstitué une base restaurable, les
> documents, et les secrets.** Note la date de réussite (voir ci-dessous).
>
> **Si UNE seule échoue → le test est ÉCHOUÉ.** N'écris pas « ça marche ». La cause
> est presque toujours ta **copie de la clé privée / passphrase** (reprends-la
> proprement depuis le coffre, ÉTAPE 1.3) ou un téléchargement coupé (ÉTAPE 3.2).

### Consigner le résultat

Note quelque part de durable (coffre, doc d'équipe) :
`Test de survie hors-site RÉUSSI le <date>, jeu <D>, clé 47E9C462…8DEDD473.`
**À refaire après chaque rotation de clé GPG** — une clé changée non testée = un
hors-site non prouvé.

---

## ÉTAPE 7 — Nettoyage (une fois le test réussi)

Tu viens de manipuler des secrets en clair (`.env`, dump base). Sur ta machine
c'est à toi de voir, mais par hygiène :

```powershell
# Efface les fichiers déchiffrés en clair (garde les .gpg si tu veux)
Remove-Item db.backup, minio.tar.gz, env.backup -ErrorAction SilentlyContinue
# La clé privée en fichier : garde-la SEULEMENT si ton dossier est sûr, sinon supprime-la
# (l'original reste dans ton gestionnaire de mots de passe)
Remove-Item lexdoc-backup-PRIVATE.asc -ErrorAction SilentlyContinue
```

> ⚠️ **Ne supprime jamais** la clé privée de ton **gestionnaire de mots de passe** :
> c'est la seule chose au monde qui peut déchiffrer les backups. Le serveur ne l'a
> pas. Sa perte = tous les hors-site deviennent illisibles pour toujours.

---

## En cas de vraie catastrophe (reconstruire la production, pas juste tester)

Ce document **prouve** la restaurabilité. Pour **remonter LexDoc en production**
sur un serveur neuf à partir des 3 fichiers déchiffrés, la suite (Docker,
`pg_restore` dans le conteneur, remontée MinIO, `.env`, PM2, nginx) est décrite
dans **`ops/RESTORE.md` §5** (reconstruction depuis le hors-site) — à faire sur le
nouveau serveur Linux, pas sur Windows. Ce test-ci s'arrête à « les fichiers
s'ouvrent et le contenu est là », ce qui est exactement ce qu'on voulait prouver.
