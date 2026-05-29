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
> ⚠️ Observation : Ca continue de clignoter et de sacader, mais quand le scroll en laissant le droit mais en faisant un grand mouvement pour aller à la fin de l'animation ça marche
- [x] Scroll rapide + relâche → transition fluide jusqu'à 60 fps
- [ ] Scroll inverse (bas → haut) → l'animation se ré-étend sans saccade
> ⚠️ Observation : Ca continue de clignoter et de sacader
- [ ] Overscroll en haut → brand et hero ne flickerent pas
> ⚠️ Observation : Je sais pas ce qu'est un over scroll
- [x] Multi-doigts / scroll interrompu → pas de glitch d'état

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
> ⚠️ Observation : Ca continue de clignoter et de sacader
- [ ] Sur Android **low-end** si dispo (Pixel 4a ou < 4 GB RAM) → même test
- [ ] Comparer le ressenti iOS vs Android : si Android visiblement moins fluide,
      noter ici et déclencher le plan B
> ⚠️ Observation : Plan B 
- [ ] Mesurer FPS via React DevTools / Flipper / Perfetto sur ~5 sec de scroll continu
      → cible ≥ 55 fps moyen
> ⚠️ Observation : comment avoir devTool ? 

---

## 3. Migration `GlassSurface` → `expo-glass-effect`

`GlassSurface.tsx` détecte runtime via `isGlassEffectAPIAvailable()` puis bascule entre
Liquid Glass natif (iOS 26+) et BlurView (iOS plus ancien). Android : opaque blanc.

- [ ] iOS 17+ : `GlassFAB` (settings du hero) affiche le Liquid Glass natif
      (translucide, saturation 180 %, highlight subtil en haut)
> ⚠️ Observation : ios26 et pas de vrai glass c'est encore le blur
- [x] iOS 15-16 : fallback BlurView, aspect glassmorphism doit rester correct
- [x] Android : fond opaque blanc, aucune ombre/blur cassée
- [x] Rotation device → pas de re-flash du glass
- [x] Ouvrir/fermer plusieurs écrans avec glass → pas de lag d'apparition

---

## 4. `BottomSheet` (`@expo/ui/community/bottom-sheet`)

Nouveau composant `src/design-system/components/BottomSheet.tsx`. Wrapper sur le
`BottomSheetModal` Expo UI. `BottomSheetModalProvider` ajouté dans `app/_layout.tsx`.

> Note : ce composant n'est pas encore consommé. Tests à faire dès qu'un écran l'utilisera
> (candidat : `MarkerInfoSheet`).

- [x] iOS : sheet glisse en bottom avec animation spring native
- [x] Android : `ModalBottomSheet` Compose s'affiche, partial expand → expand
- [x] Pan down to close fonctionne
- [x] Backdrop tap ferme
- [x] Contenu scrollable interne (si applicable)
- [x] Provider wrapping vérifié dans `app/_layout.tsx`

---

## 5. Réintégration hero (Bonjour / prénom / meta / settings FAB)

- [x] "Bonjour," visible en expanded, fade-out terminé à ~60 % du scroll range
- [ ] Prénom shrink fluide 32 → 18 (visuel via `transform: scale`)
> ⚠️ Observation : Ca continue de clignoter et de sacader
- [x] Meta (âge, sexe, count) visible en expanded, fade-out à ~40 % du scroll range
- [x] Settings FAB cliquable en tout temps → navigation vers `/settings`
- [x] Hero collapsed ≈ 60 px de haut (vérifier visuellement)
- [x] Layout texte stable (pas de saut de ligne, pas de troncature soudaine)
- [x] `numberOfLines={1}` du prénom et de la meta empêchent l'overflow horizontal

> ⚠️ Observation : le brand en haut n'est pas assez a gauche lorsqu'on collapse, il n'est pas aligné avec le avatar

---

## 6. État vide (`analyses.length === 0`)

- [x] Quand 0 analyses → branche empty state s'affiche (pas de hero scrollable)
- [x] Bouton "Importer un PDF" → ouvre l'écran upload
- [x] Aucune erreur React lors du basculement vide → non-vide après import

---

## 7. Feature flag Reanimated `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS`

Flag statique défini dans `package.json` → `reanimated.staticFeatureFlags`.

- [x] Vérifier qu'un `expo run:android` (rebuild natif) a bien été fait
- [ ] Confirmer dans les logs natifs que le flag est actif au démarrage
> ⚠️ Observation : pas sur de le voir dans les logs
```bash
Android Bundled 35ms src/domain/usecases/RetrieveUserProfileUseCase.ts (1 module)
 LOG  User profile table check: [{"name":"user_profile"}]
 WARN  DateTimePicker: `onChange` is deprecated. Use `onValueChange`, `onDismiss`, and `onNeutralButtonPress` instead.
 LOG  GetAnalysesUseCase.execute() called
 LOG  GetAnalysesUseCase received results: 16
 LOG  User profile table check: [{"name":"user_profile"}]
 LOG  User profile table check: [{"name":"user_profile"}]
 LOG  User profile table check: [{"name":"user_profile"}]
 LOG  GetAnalysesUseCase.execute() called
 LOG  GetAnalysesUseCase received results: 16
 LOG  GetAnalysesUseCase.execute() called
 LOG  User profile table check: [{"name":"user_profile"}]
 LOG  User profile table check: [{"name":"
 ```
 et
 ```bash
 [Incubating] Problems report is available at: file:///Users/yann.hallouard/PycharmProjects/personal/LaBI/android/build/reports/problems/problems-report.html

Deprecated Gradle features were used in this build, making it incompatible with Gradle 10.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/9.3.1/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

BUILD SUCCESSFUL in 5s
1118 actionable tasks: 82 executed, 1036 up-to-date
Waiting on http://localhost:8081
› Installing /Users/yann.hallouard/PycharmProjects/personal/LaBI/android/app/build/outputs/apk/release/app-release.apk
› Opening hemea://expo-development-client/?url=http%3A%2F%2F192.168.1.51%3A8081 on Medium_Phone_API_36

 ```
- [x] Comparer perf avant/après si possible (cf. section 2)

---

## 8. Onboarding profil au premier lancement

**Contexte** : `ProfileRequiredModal` supprimé du `_layout.tsx`. Remplacé par un screen
plein écran via `useProfileGuard` + route `app/onboarding.tsx`.

- [x] Premier lancement (DB vide) → redirect automatique vers l'écran "Bienvenue / Créer mon profil"
- [x] Swipe down / geste retour iOS désactivé sur l'écran d'onboarding (pas de fuite vers HomeScreen)
- [x] Remplir prénom, nom, date de naissance, genre + sauvegarder → redirect vers `/(tabs)` et profil visible dans HomeScreen hero
- [x] Si profil déjà existant → pas de redirect, HomeScreen s'affiche directement
- [x] Après création, fermer/rouvrir l'app → onboarding NE réapparaît PAS
- [x] Tester sur iOS ET Android (comportement `fullScreenModal` diffère)

---

## 9. Refonte AIImportScreen — Choice + Upload zone

**Contexte** : `AIImportScreen` redesigné d'après `Upload.jsx`. Écran de choix (IA vs
manuel) → flow IA avec zone dashed + steps card.

- [x] Ouvrir `/upload` → écran de choix avec deux cards (IA et Manuel)
- [x] Card "Import par IA" : badge "Recommandé" visible, pills (~20s · PDF · Tous marqueurs)
- [x] Card "Import manuel" : badge "Bientôt disponible" ou banner info (pas de navigation cassée)
- [x] Appuyer sur card IA → transition vers la zone d'upload dashed + bouton "Sélectionner & analyser PDF"
- [x] Bouton retour (flèche ou swipe) dans le flow IA → retour à l'écran de choix
- [x] Lancer une analyse → steps card apparaît, progression visible étape par étape
- [x] Analyse réussie → `Banner kind="success"` visible, retour possible vers l'accueil
- [x] Clé API manquante → `Banner kind="warning"` + lien vers `/settings/api-key`
- [x] Rotation device → layout des cards ne se casse pas

---

## 10. Persistance de l'image de profil après réinstallation

**Contexte** : URI retourné par `ImagePicker` pointe vers le cache (effacé à la
réinstallation). Fix : copie vers `FileSystem.documentDirectory` avant sauvegarde.

- [x] Choisir une photo de profil → s'affiche dans `HomeScreen` hero (avatar) et dans `ProfileScreen`
- [x] Forcer un kill + relance de l'app → image toujours présente
- [x] Désinstaller + réinstaller l'app → **iOS** : si iCloud Backup actif, image restaurée avec le profil ; **Android** : comportement attendu = image effacée (DB aussi)
- [x] Changer de photo de profil → ancienne image remplacée sans résidu de fichier
- [x] Choisir une photo → annuler → ancienne photo inchangée
- [x] `quality: 0.7` (vs 0.5 précédent) — avatar 104px net, pas de flou visible

---

## 11. Features futures

À compléter au fur et à mesure des prochaines tâches :

- [ ] Hero gradient (parallax du fond bleu derrière le hero)
- [ ] Charts : reference band feathering (gradient + masque)
- [ ] Tab bar glass pill (alternative à `NativeTabs`)
- [ ] `MarkerInfoSheet` via `BottomSheet`
- [ ] FAB de raccourci global (45° rotation, sub-buttons stagger)
- [ ] Import manuel (ManualEntryFlow)
