# Recette de test — Hemea / LaBI

Recette QA manuelle qui couvre l'ensemble des évolutions de la branche
`test/claude_design_reanimated`.

> **Mode d'emploi**
> - Dérouler la recette sur **iOS** (device physique recommandé) ET **Android**.
> - Cocher chaque ligne au fil des tests.
> - En cas d'écart, ajouter une note `> ⚠️ Observation : ...` sous la ligne concernée.
> - Les sections sont indépendantes — on peut les jouer dans n'importe quel ordre.

---

## 1. Refacto Reanimated pur — HomeScreen

**Contexte** : suppression de `runOnJS` + `useState(progress)`. Animations 100 % sur le
UI thread via `useAnimatedStyle` + `interpolate`. Objectif : éliminer le clignotement
sur Android lors d'un scroll lent doigt posé.

- [ ] Scroll lent (doigt posé, vitesse < 1 cm/s) → aucun clignotement, aucun jitter
- [ ] Scroll rapide + relâche → transition fluide jusqu'à 60 fps
- [ ] Scroll inverse (bas → haut) → l'animation se ré-étend sans saccade
- [ ] Overscroll en haut → brand et hero ne flickerent pas
- [ ] Multi-doigts / scroll interrompu → pas de glitch d'état

---

## 2. Trade-off Android : `width` / `height` animés (ShadowTree)

> ⚠️ **Section critique à valider en priorité.**

L'avatar (`avatarWrap`) anime `width` et `height` — ce sont des propriétés layout qui
passent par ShadowTree et **PAS** par le fast path `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS`.
C'est nécessaire pour obtenir la vraie réduction de hauteur du hero (200 → 60 px).

**Plan B si ça flicker** : remplacer par `height` animée directement sur le `hero`
+ contenu en `position: absolute`.

- [ ] Sur Android en **build release** (`expo run:android --variant release`), scroll lent
      → absence de flicker sur l'avatar (déformation, sauts de taille, halo)
- [ ] Sur Android **low-end** si dispo (Pixel 4a ou < 4 GB RAM) → même test
- [ ] Comparer le ressenti iOS vs Android : si Android visiblement moins fluide,
      noter ici et déclencher le plan B
- [ ] Mesurer FPS via React DevTools / Flipper / Perfetto sur ~5 sec de scroll continu
      → cible ≥ 55 fps moyen

---

## 3. Migration `GlassSurface` → `expo-glass-effect`

`GlassSurface.tsx` détecte runtime via `isGlassEffectAPIAvailable()` puis bascule entre
Liquid Glass natif (iOS 26+) et BlurView (iOS plus ancien). Android : opaque blanc.

- [ ] iOS 17+ : `GlassFAB` (settings du hero) affiche le Liquid Glass natif
      (translucide, saturation 180 %, highlight subtil en haut)
- [ ] iOS 15-16 : fallback BlurView, aspect glassmorphism doit rester correct
- [ ] Android : fond opaque blanc, aucune ombre/blur cassée
- [ ] Rotation device → pas de re-flash du glass
- [ ] Ouvrir/fermer plusieurs écrans avec glass → pas de lag d'apparition

---

## 4. `BottomSheet` (`@expo/ui/community/bottom-sheet`)

Nouveau composant `src/design-system/components/BottomSheet.tsx`. Wrapper sur le
`BottomSheetModal` Expo UI. `BottomSheetModalProvider` ajouté dans `app/_layout.tsx`.

> Note : ce composant n'est pas encore consommé. Tests à faire dès qu'un écran l'utilisera
> (candidat : `MarkerInfoSheet`).

- [ ] iOS : sheet glisse en bottom avec animation spring native
- [ ] Android : `ModalBottomSheet` Compose s'affiche, partial expand → expand
- [ ] Pan down to close fonctionne
- [ ] Backdrop tap ferme
- [ ] Contenu scrollable interne (si applicable)
- [ ] Provider wrapping vérifié dans `app/_layout.tsx`

---

## 5. Réintégration hero (Bonjour / prénom / meta / settings FAB)

- [ ] "Bonjour," visible en expanded, fade-out terminé à ~60 % du scroll range
- [ ] Prénom shrink fluide 32 → 18 (visuel via `transform: scale`)
- [ ] Meta (âge, sexe, count) visible en expanded, fade-out à ~40 % du scroll range
- [ ] Settings FAB cliquable en tout temps → navigation vers `/settings`
- [ ] Hero collapsed ≈ 60 px de haut (vérifier visuellement)
- [ ] Layout texte stable (pas de saut de ligne, pas de troncature soudaine)
- [ ] `numberOfLines={1}` du prénom et de la meta empêchent l'overflow horizontal

---

## 6. État vide (`analyses.length === 0`)

- [ ] Quand 0 analyses → branche empty state s'affiche (pas de hero scrollable)
- [ ] Bouton "Importer un PDF" → ouvre l'écran upload
- [ ] Aucune erreur React lors du basculement vide → non-vide après import

---

## 7. Feature flag Reanimated `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS`

Flag statique défini dans `package.json` → `reanimated.staticFeatureFlags`.

- [ ] Vérifier qu'un `expo run:android` (rebuild natif) a bien été fait
- [ ] Confirmer dans les logs natifs que le flag est actif au démarrage
- [ ] Comparer perf avant/après si possible (cf. section 2)

---

## 8. Onboarding profil au premier lancement

**Contexte** : `ProfileRequiredModal` supprimé du `_layout.tsx`. Remplacé par un screen
plein écran via `useProfileGuard` + route `app/onboarding.tsx`.

- [ ] Premier lancement (DB vide) → redirect automatique vers l'écran "Bienvenue / Créer mon profil"
- [ ] Swipe down / geste retour iOS désactivé sur l'écran d'onboarding (pas de fuite vers HomeScreen)
- [ ] Remplir prénom, nom, date de naissance, genre + sauvegarder → redirect vers `/(tabs)` et profil visible dans HomeScreen hero
- [ ] Si profil déjà existant → pas de redirect, HomeScreen s'affiche directement
- [ ] Après création, fermer/rouvrir l'app → onboarding NE réapparaît PAS
- [ ] Tester sur iOS ET Android (comportement `fullScreenModal` diffère)

---

## 9. Refonte AIImportScreen — Choice + Upload zone

**Contexte** : `AIImportScreen` redesigné d'après `Upload.jsx`. Écran de choix (IA vs
manuel) → flow IA avec zone dashed + steps card.

- [ ] Ouvrir `/upload` → écran de choix avec deux cards (IA et Manuel)
- [ ] Card "Import par IA" : badge "Recommandé" visible, pills (~20s · PDF · Tous marqueurs)
- [ ] Card "Import manuel" : badge "Bientôt disponible" ou banner info (pas de navigation cassée)
- [ ] Appuyer sur card IA → transition vers la zone d'upload dashed + bouton "Sélectionner & analyser PDF"
- [ ] Bouton retour (flèche ou swipe) dans le flow IA → retour à l'écran de choix
- [ ] Lancer une analyse → steps card apparaît, progression visible étape par étape
- [ ] Analyse réussie → `Banner kind="success"` visible, retour possible vers l'accueil
- [ ] Clé API manquante → `Banner kind="warning"` + lien vers `/settings/api-key`
- [ ] Rotation device → layout des cards ne se casse pas

---

## 10. Persistance de l'image de profil après réinstallation

**Contexte** : URI retourné par `ImagePicker` pointe vers le cache (effacé à la
réinstallation). Fix : copie vers `FileSystem.documentDirectory` avant sauvegarde.

- [ ] Choisir une photo de profil → s'affiche dans `HomeScreen` hero (avatar) et dans `ProfileScreen`
- [ ] Forcer un kill + relance de l'app → image toujours présente
- [ ] Désinstaller + réinstaller l'app → **iOS** : si iCloud Backup actif, image restaurée avec le profil ; **Android** : comportement attendu = image effacée (DB aussi)
- [ ] Changer de photo de profil → ancienne image remplacée sans résidu de fichier
- [ ] Choisir une photo → annuler → ancienne photo inchangée
- [ ] `quality: 0.7` (vs 0.5 précédent) — avatar 104px net, pas de flou visible

---

## 11. Features futures

À compléter au fur et à mesure des prochaines tâches :

- [ ] Hero gradient (parallax du fond bleu derrière le hero)
- [ ] Charts : reference band feathering (gradient + masque)
- [ ] Tab bar glass pill (alternative à `NativeTabs`)
- [ ] `MarkerInfoSheet` via `BottomSheet`
- [ ] FAB de raccourci global (45° rotation, sub-buttons stagger)
- [ ] Import manuel (ManualEntryFlow)
