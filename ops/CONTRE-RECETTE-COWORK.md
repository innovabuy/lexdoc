# Contre-recette Cowork — GO-LIVE-6 (14/07/2026)

> **Cible** : `http://76.13.50.173` (tenant Pragma Vox, données de test uniquement).
> **AVANT DE COMMENCER** : hard-refresh du navigateur (**Ctrl+Shift+R**) pour purger un
> éventuel `index.html` en cache — sinon tu testerais l'ancien front.
> **Déploiement confirmé** : nginx sert le dernier build (index `index-BNRo0L6B.js`,
> contient M7 + « Importer » + docx-preview).
> **Rôle** : connecte-toi en **ADMIN** (Me Bienaimé) pour les tests de suppression (M4).
>
> Pour chaque point : **CE QUE TU FAIS** → **CE QUE TU DOIS VOIR**. Note tout écart.
> ⛔ Ne touche jamais aux 3 templates go-live (Lettre de mission, Mise en demeure PM,
> Assignation en référé) : les utiliser (générer) OK, les supprimer/modifier/renommer NON.

---

## B1 — Création client personne physique
**Fais** : Clients → Nouveau client → type **PP** → remplis **Nom** ET **Prénom** + email → Créer.
**Tu dois voir** : le champ **Prénom** existe (à côté de Nom) ; le client est créé **sans erreur 400**.
*Contre-épreuve* : laisse le Prénom vide → le formulaire refuse (champ requis).

## B2 — Création de dossier : plus de documents fantômes
**Fais** : Nouveau dossier (wizard) → Client → Type → Informations → Récapitulatif → Créer.
**Tu dois voir** : **AUCUNE étape « documents recommandés »** (le wizard a 4 écrans : Client,
Type, Informations, Récapitulatif). Le dossier créé contient **0 document** (aucun fantôme size 0).

## M1 — LRAR : liste des destinataires peuplée
**Fais** : ouvre un dossier ayant des parties (client + adversaire avec adresse) → un document →
menu ⋮ → « Envoyer en LRAR ».
**Tu dois voir** : la liste **Destinataire est peuplée** (client + parties) ; celles avec adresse
complète sont sélectionnables (les autres marquées « adresse incomplète »). Choisir un destinataire
active « Confirmer ».

## M2 — Génération sans un champ requis : plus de no-op muet
**Fais** : génère une assignation, laisse un champ obligatoire vide (ex. **montant article 700**),
clique **« Compléter et générer »**.
**Tu dois voir** : un **message rouge listant les champs manquants** + le(s) champ(s) vide(s)
**surligné(s) en rouge**. Le bouton n'est plus grisé-muet. Une fois tout rempli → le document se génère.

## M4 — Suppression documents / dossiers (ADMIN)
**Fais (en ADMIN)** : document → menu ⋮ → **« Supprimer »** (en rouge) ; et dossier → bouton
**« Supprimer le dossier »** (en-tête).
**Tu dois voir** : une **modale de confirmation applicative** (pas la boîte native du navigateur).
Confirmer supprime. Un **dossier contenant des documents** → message explicite + bouton
**« Tout supprimer »** (cascade).
*Contre-épreuve* : connecte-toi en **ASSISTANT** → les boutons Supprimer **n'apparaissent pas** (pas un 403, absents).

## M5 — Complétude d'une fiche PM
**Fais** : ouvre (ou crée) une PM avec **tous** les champs société remplis (raison sociale, forme,
capital, siège, ville + n° immat, email).
**Tu dois voir** : **Complétude 100 %**, **plus d'alerte** « 15 champs manquants » ni de champs
personne physique (civilité, naissance, filiation) réclamés.

## M6 — Catégorie d'upload
**Fais** : dans un dossier ayant une catégorie « Pièces » → Importer un document → choisis la
catégorie **« Pièces »** → Importer.
**Tu dois voir** : le document apparaît **classé dans « Pièces »**, pas dans « Non classé ».

## M7 — Aperçu d'un .docx
**Fais** : génère (ou ouvre) un document Word → clique l'aperçu (œil).
**Tu dois voir** : le contenu du .docx **s'affiche dans le navigateur**, avec en haut le **bandeau
jaune** : « **Aperçu — le document final peut différer légèrement. Téléchargez le fichier pour
vérification avant envoi.** » + un bouton **Télécharger** visible. Si un fichier est corrompu →
message clair (« Aperçu impossible… Téléchargez… »), **pas d'écran blanc**.

## Garde-fou art. 648 CPC — identité personne morale
**Fais** : dossier avec un **défendeur personne morale** dont **forme/capital/siège/n° RCS sont
vides** → génère une **assignation**.
**Tu dois voir** : **génération REFUSÉE** avec message explicite du type
« *Identité de personne morale incomplète (art. 648 CPC) — Défendeur … : forme sociale, capital
social, siège, n° RCS* ». Complète la fiche → la génération passe et l'acte identifie la partie
(capital, siège, RCS rendus).

## Mineurs (cosmétique — vérif au coup d'œil)
- **Accents** : « Télécharger », « Prévisualisation », « Catégorie », « Créé par/le »,
  « Connectez-vous **à** votre espace » (page de login).
- **« · »** au lieu de `&middot;` brut (carte d'alerte de document en double).
- **« Référé »** au lieu de « refere » (nature d'un dossier).
- **« Importer »** pour l'upload (≠ « Télécharger » pour le téléchargement).
- **Messages d'erreur en français** (ex. création client : « Le nom et le prénom sont requis pour
  un particulier », « Un client avec cet email existe déjà »).
- **Signature** : clique « Envoyer » sans avoir ajouté de signataire → message
  « Sélectionnez au moins un signataire » (plus de no-op).
- **Filtre client « Association »** : le type **Association** existe désormais aussi dans le
  formulaire de création (bouton « Asso »).

> ⚠️ La passe d'accents est **ciblée sur les écrans testés**, pas exhaustive : d'autres libellés
> ASCII peuvent subsister ailleurs (balayage complet planifié plus tard, écran par écran).
> Signale ceux que tu croises, on les traitera par lot.

---

### Après la contre-recette
Remonte les écarts. Une fois validé, on **nettoie les données de test** `TEST-RECETTE-14072026`.
