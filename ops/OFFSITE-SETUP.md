# Réplication hors-site des sauvegardes — à mettre en place (Jeff)

> Objectif : que la perte totale du VPS (panne, erreur, compromission) ne détruise
> PAS les sauvegardes en même temps que la production. Sans ça, tout le travail de
> 2.C ne protège de rien face au sinistre le plus banal.

## 1. Choix du fournisseur (décision Jeff — compte à créer)

Contraintes : **hébergement UE (RGPD, données d'avocat français)**, S3-compatible,
chiffrement au repos + en transit, coût dérisoire (~30 Mo/jour × 30 j ≈ 1 Go).

| Fournisseur | RGPD | Prix indicatif | Note |
|---|---|---|---|
| **Scaleway Object Storage** (fr-par) ⭐ | 🇫🇷 société française | ~0,012 €/Go/mois (1er 75 Go gratuits) | **Recommandé** : français, facturation/support FR, pas d'exposition CLOUD Act US |
| **OVHcloud Object Storage** (GRA/SBG) | 🇫🇷 société française | ~0,01 €/Go/mois | Équivalent, français |
| Backblaze B2 (région EU Amsterdam) | 🇪🇺 données UE, société US | ~0,006 $/Go/mois | Le moins cher, mais **société US** (DPA + région EU dispo) |

**Recommandation : Scaleway** (ou OVH). Pour un cabinet d'avocat, un prestataire
**français** est la posture RGPD la plus défendable. Backblaze est moins cher mais
c'est une société américaine. **À toi de trancher — je ne crée pas le compte.**

Coût réel attendu : **quelques centimes à ~1 €/mois**.

## 2. Ce que tu dois créer (exemple Scaleway)
1. Compte Scaleway → **Object Storage** → **Create bucket**, région **fr-par (Paris)**,
   nom ex. `lexdoc-backups-offsite`, visibilité **Private**.
2. **API Keys** → générer une clé (Access Key + Secret Key) avec accès Object Storage.
3. Me transmettre (ou configurer toi-même, cf. §3) : Access Key, Secret Key,
   endpoint (`s3.fr-par.scw.cloud`), région (`fr-par`), nom du bucket.

## 3. Configuration serveur (à faire une fois)
```bash
# a) installer rclone
curl https://rclone.org/install.sh | sudo bash

# b) configurer le remote "offsite" (type s3, provider Scaleway)
sudo rclone config
#   name> offsite
#   Storage> s3
#   provider> Scaleway
#   access_key_id> <ACCESS_KEY>
#   secret_access_key> <SECRET_KEY>
#   region> fr-par
#   endpoint> s3.fr-par.scw.cloud
#   (le reste par défaut)

# c) vérifier
sudo rclone lsd offsite:

# d) planifier (après le backup local de 3h)
sudo crontab -e
#   0 4 * * * RCLONE_REMOTE=offsite:lexdoc-backups-offsite /home/lexdoc-dev/ops/replicate-offsite.sh
```
(Adapter `RCLONE_REMOTE` au nom réel du bucket.)

## 4. La CLÉ DE DÉCHIFFREMENT (critique)
Les backups sont chiffrés **avec la clé publique** `ops/backup-pubkey.asc` (sur le
serveur). Ils ne peuvent être déchiffrés qu'avec la **clé privée + passphrase**, qui
**NE doivent PAS rester sur le serveur** (sinon compromission = accès aux backups).

**À faire maintenant :**
1. Récupérer depuis le serveur : `/root/LEXDOC-BACKUP-KEY-POUR-JEFF/`
   (`lexdoc-backup-PRIVATE.asc` + `passphrase.txt`).
   ```bash
   scp -r root@<serveur>:/root/LEXDOC-BACKUP-KEY-POUR-JEFF ~/lexdoc-backup-key
   ```
2. **Stocker la clé privée + la passphrase dans ton gestionnaire de mots de passe**
   (Bitwarden/1Password) ET une copie hors-ligne (clé USB en coffre). Sans elles,
   les backups hors-site sont **définitivement illisibles**.
3. Une fois en sécurité, **supprimer du serveur** :
   ```bash
   sudo shred -u /root/LEXDOC-BACKUP-KEY-POUR-JEFF/* && sudo rmdir /root/LEXDOC-BACKUP-KEY-POUR-JEFF
   ```
   Le serveur ne garde alors que la clé publique (chiffre, ne déchiffre pas).
   *(Idéal : régénérer la paire toi-même hors-ligne et ne me donner que la publique.)*

## 5. Test de bout en bout (dès que le bucket existe)
```bash
sudo /home/lexdoc-dev/ops/replicate-offsite.sh      # chiffre + upload
sudo rclone lsf offsite:lexdoc-backups-offsite       # voir les .gpg
# puis : download → déchiffrement (clé privée) → pg_restore en base jetable (cf. RESTORE.md)
```
Un backup hors-site **non restauré** ne vaut pas mieux qu'un backup local non restauré.
