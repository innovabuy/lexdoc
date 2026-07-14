# Contre-recette Cowork #2 — GO-LIVE-6 (correctifs post-contre-recette)

> **Cible** : `http://76.13.50.173` (tenant Pragma Vox, **données de test uniquement**).
> **⚠️ AVANT DE COMMENCER — OBLIGATOIRE** : hard-refresh **Ctrl+Shift+R** pour purger le cache.
> Le nouveau bundle est **`index-BwXPgn8D.js`** — vérifie-le (DevTools → Network → index-*.js).
> Si tu vois encore `index-BsEtyLZf.js` ou plus ancien : tu testes l'ancien front, recommence.
> **Rôle** : connecte-toi en **ADMIN** (Me Bienaimé) pour les tests de suppression.
> ⛔ **Templates go-live INTOUCHABLES** (Lettre de mission, Mise en demeure PM, Assignation
> en référé) : les générer OK ; les supprimer / modifier / renommer NON.
>
> Pour chaque point : **CE QUE TU FAIS** → **CE QUE TU DOIS VOIR**. Note **tout** écart, même minime.

---

## 1. M6 — Catégorie d'upload sur un dossier NEUF (0 catégorie)
**Fais** : crée un **nouveau dossier** via le wizard (ou prends-en un tout neuf sans document) →
onglet Documents → **Importer** un fichier (PDF/DOCX).
**Tu dois voir** :
- Le sélecteur **« Catégorie » s'affiche** (avant, il était masqué sur un dossier sans catégorie).
- Il propose **« Non classé » + les 5 catégories prédéfinies** : Actes de procédure, Conclusions,
  Correspondances, Pièces, Décisions.
- Choisis **« Pièces »** → Importer → le document apparaît **classé dans « Pièces »**
  (PAS dans « Non classé »). La catégorie « Pièces » est bien créée dans le dossier.

*Contre-épreuve* : ré-importe un 2ᵉ fichier en « Pièces » → il se range dans la **même**
catégorie « Pièces » (pas de doublon de catégorie).

## 2. RÔLES — Cohérence création ↔ édition + « Nom » d'une PM
**Fais (a)** : ouvre un dossier → ajoute une partie avec le rôle **« Postulant »**.
Puis **édite** cette même partie (crayon).
**Tu dois voir** : dans la liste déroulante d'**édition** du rôle, **« Postulant » est présent**
(avant il en était absent → une partie créée « Postulant » devenait inéditable comme telle).
La liste d'édition et celle de création proposent **les mêmes rôles** : Partie adverse, Avocat
adverse, Postulant, Co-débiteur, Témoin, Expert, Notaire, Huissier, Médiateur, Autre.

**Fais (b)** : ajoute/édite une partie **personne morale (PM)** — remplis « Raison sociale »,
laisse le champ **« Nom »** vide → Enregistre.
**Tu dois voir** : l'enregistrement **passe** ; le libellé du champ est **« Nom (contact) »**
(plus d'astérisque obligatoire). Pour une personne **physique**, « Nom * » reste requis.

## 3. M5 — Complétude d'une fiche PM
**Fais** : ouvre (ou crée) une **PM** avec tous les champs société : Raison sociale, Forme,
Capital, Siège, Ville + N° immatriculation, **Email** (le téléphone et l'objet social ne sont
**pas** obligatoires).
**Tu dois voir** : **Complétude 100 %**, badge **« complet »**, **aucune alerte** « X champs
manquants ». (Avant : plafonnait à **85 %** à cause du téléphone.)

*Contre-épreuve* : vide le **Siège** (champ critique) → la complétude **redescend** et le siège
apparaît en champ manquant. Re-remplis → retour à 100 %.

## 4. M1 — LRAR : destinataires avec adresse renseignée
**Fais** : dossier avec des parties **ayant une adresse renseignée** (champ adresse libre, même
sans ville/CP séparés) → un document → menu ⋮ → **« Envoyer en LRAR »**.
**Tu dois voir** : les destinataires dont **l'adresse est renseignée** sont **sélectionnables**
et **NE portent PLUS** la mention « (adresse incomplète) ». Seuls ceux **sans aucune adresse**
restent marqués « (adresse **incomplète** » — accent) et désactivés.

## 5. SUPPRESSION CLIENT — plus de cul-de-sac
**Fais (en ADMIN)** : ouvre un **client lié à au moins un dossier** → bouton **Supprimer**.
**Tu dois voir** :
- **Un seul** dialogue de confirmation (plus de double confirmation).
- Comme le client a des dossiers → un **2ᵉ dialogue de cascade explicite** : « Ce client a N
  dossier(s)… Supprimer le client ET tous ses dossiers et documents ? ». Confirmer → **supprime
  tout** et renvoie à la liste. Annuler → **rien n'est supprimé**, pas de blocage.
- **Plus jamais** d'écran/bouton qui « se fige » sans message ni issue.

*Contre-épreuve* : client **sans dossier** → un seul dialogue → suppression directe.

## 6. COSMÉTIQUES
- **`&middot;`** : parcours fiche client (sous le nom), lignes de documents (taille · date · auteur),
  carte de doublon → **partout un vrai « · »**, plus jamais `&middot;` en toutes lettres.
- **« Référé »** : ouvre un dossier de **référé** → sa **page détail** affiche
  **« Nature : Référé »** (plus « refere »/« Refere »). Vérifie aussi l'arbre des dossiers
  (regroupement par nature) : **« Référé »**, pas « Refere ».
- **Suppression d'un dossier contenant des documents** (ADMIN) → le message est **en français**,
  du type « Ce dossier contient N document(s) et M sous-dossier(s). », **sans « force=true »**,
  et propose un bouton **« Tout supprimer »**.
- **Accents** : bouton **« Créer depuis un template »** (état « Aucun document » + modale) ;
  catégorie **« Actes de procédure »** (sélecteur templates) ; bouton **« Compléter et générer »**
  (modale des champs manquants).

## 7. NON-RÉGRESSION — les acquis doivent tenir
> ⚠️ **On a vu aujourd'hui qu'un correctif peut en casser un autre** (piste M6/B2). **Ne suppose
> rien : re-teste réellement.**

- **B1** — Création client **personne physique** : le champ **Prénom** existe, création sans 400 ;
  Prénom vide → refus.
- **B2** — Création de dossier (wizard) : **AUCUNE étape « documents recommandés »**, dossier créé
  avec **0 document fantôme**.
- **M2** — Génération avec un champ requis vide (ex. montant article 700) → **message rouge listant
  les manquants** + champ surligné ; une fois rempli → le document se génère.
- **M4** — Suppression document/dossier (ADMIN) : **modale applicative** (pas la native) ; dossier
  avec documents → cascade « Tout supprimer ». En **ASSISTANT** : les boutons Supprimer **absents**.
- **M7** — Aperçu d'un .docx : le contenu s'affiche + **bandeau jaune** « Aperçu — le document
  final peut différer légèrement. Téléchargez le fichier pour vérification avant envoi. » + bouton
  **Télécharger** visible ; fichier corrompu → message clair, **pas d'écran blanc**.
- **Art. 648 CPC** — Assignation avec un **défendeur PM** dont forme/capital/siège/n° RCS sont
  vides → **génération REFUSÉE** avec message explicite (art. 648 CPC). Complète → la génération
  passe.

---

### Après la contre-recette
Remonte **tous** les écarts (avec capture si possible). Rappel : la passe d'accents reste
**ciblée** — signale tout libellé ASCII résiduel croisé ailleurs, on le traitera par lot.
