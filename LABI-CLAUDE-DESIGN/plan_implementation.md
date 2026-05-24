# Refonte Héméa : adoption du design system LABI-CLAUDE-DESIGN

## Context

L'app Héméa (`com.anonymous.hemea`, Expo SDK 54) est un tracker d'analyses biologiques personnelles : OCR PDF via Mistral, SQLite chiffré (SQLCipher), sync multi-appareils (Multipeer / Android files), charts time-series, profil utilisateur, navigation Expo Router + NativeTabs.

La branche actuelle `feat/expo-router-liquid-glass` est WIP : migration vers Expo Router + NativeTabs + glass effects. Le code UI s'est sédimenté (composants legacy `TabBar`, écrans monolithiques copiés depuis l'ancien `App.tsx` de 1089 lignes, glass design partiel).

En parallèle, le dossier `LABI-CLAUDE-DESIGN/` (sorti de Claude Design) contient un **design system complet** : tokens (couleurs, type, spacing, radii, shadows, glass), 10 composants primitives React, 7 écrans prototypes (Home, Charts, Settings, Upload, Profile, AnalysisDetail, AnalysesList), assets (logo, wordmark, icônes), preview cards, et une charte de marque (français, sobre, médical).

**Objectif** : repartir d'une UI neuve qui suit fidèlement le design Claude, tout en **conservant 100% des fonctionnalités** actuelles (OCR, SQLCipher, Multipeer, BLE, charts, profil). L'ancienne app sert de référence fonctionnelle et de réservoir de code business à recycler.

**Décisions prises avec l'utilisateur** :
- Stack : **Managed workflow + expo-dev-client** (pas Expo Go strict). On garde tous les modules natifs.
- Périmètre : **garder tout** (OCR Mistral, SQLCipher, Multipeer sync, BLE).
- Backup : **tout déplacer dans `labi_old/`** à la racine, repartir d'une app neuve.
- Glass : **expo-glass-effect natif** (Liquid Glass iOS 26).

---

## Stratégie globale

Le code métier de l'ancienne app (domain, ports, adapters, infrastructure, config LabConfig) est solide et testé — on le **recycle tel quel**. Ce qu'on réécrit, c'est exclusivement la couche présentation (`app/`, `src/presentation/`) en s'alignant pixel-près sur le design system Claude.

Couches à recycler depuis `labi_old/` :
- `src/domain/` — entités, schemas, use cases (26 use cases business)
- `src/ports/` — interfaces repositories & services
- `src/adapters/` — SQLite repos, Mistral OCR/LLM, Multipeer/Android sync
- `src/infrastructure/` — DatabaseInitializer, RepositoryFactory, AppInitializer, polyfills
- `src/config/LabConfig.ts` — métadonnées des analyses (catégories, units, ranges)
- Tooling : `jest.config.js`, `jest.setup.js`, `eslint.config.mjs`, `tsconfig.json`, `scripts/`, `ios-scripts/`, `__mocks__/`

Couches à **réécrire from scratch** :
- `app/` — routes Expo Router (nouveau découpage écrans + modals)
- `src/presentation/` — composants, écrans, contexts UI
- `src/config/themes.ts` → remplacé par `src/design-system/tokens.ts`

---

## Phase 0 — Sauvegarde de l'app actuelle

Tout déplacer dans `labi_old/` :

```
labi_old/
├── app/
├── src/
├── assets/
├── docs/
├── ios-scripts/
├── scripts/
├── __mocks__/
├── app.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── eslint.config.mjs
├── jest.config.js
├── jest.setup.js
├── .prettierrc*
├── babel.config.js (s'il existe)
└── metro.config.js (s'il existe)
```

À **garder à la racine** :
- `.git/`, `.gitignore`, `.github/` (CI/CD)
- `.claude/` (config harness)
- `LABI-CLAUDE-DESIGN/` (source de vérité design)
- `README.md` projet, `LICENSE`
- `Start using Liquid Glass in your React Native + Expo Apps.md` (référence)

Commande : `git mv` pour chaque path (préserve l'historique).

---

## Phase 1 — Bootstrap de la nouvelle app

À la racine, créer la nouvelle structure :

1. **`package.json`** : copier depuis `labi_old/package.json` en gardant les mêmes versions Expo SDK 54 / RN 0.81.5. Garder toutes les deps métier (expo-sqlite, expo-secure-store, expo-document-picker, expo-image-picker, @ai-sdk/mistral, @mistralai/mistralai, ai, react-native-multipeer-connectivity, react-native-ble-plx, react-native-ble-manager, react-native-permissions, react-native-device-info, react-native-gifted-charts, react-native-svg, react-native-reanimated, react-native-gesture-handler, expo-blur, expo-linear-gradient, expo-glass-effect, expo-router, etc.). Retirer ce qui n'est pas utilisé après audit (à valider à l'usage).

2. **`app.json`** : repartir de `labi_old/app.json` (bundle id, permissions iOS local-network + photos, plugins SQLCipher, expo-router, expo-glass-effect). Mettre à jour les chemins d'assets (icons, splash) vers `assets/` (qui sera remplie en Phase 2).

3. **`tsconfig.json`, `eslint.config.mjs`, `jest.config.js`, `jest.setup.js`, `__mocks__/`** : copier tels quels depuis `labi_old/`.

4. **Recopier `scripts/`, `ios-scripts/`, `docs/`** depuis `labi_old/`.

5. Installation : `npm install` puis `npx expo prebuild --clean` si dev client.

---

## Phase 2 — Design system foundation (`src/design-system/`)

Traduire `LABI-CLAUDE-DESIGN/colors_and_type.css` et `components.jsx` en RN/TS.

### 2.1 Tokens — `src/design-system/tokens.ts`

```ts
export const colors = {
  primary: '#2C7BE5', primaryHover: '#1F66C9', primaryPressed: '#1856AC', primaryDisabled: '#A0C7F0', primaryTint: '#EEF2FB',
  secondary: '#00B4A6', secondaryHover: '#009489', secondaryTint: '#E3F7F5',
  gradient: { from: '#E5363F', mid: '#CE5283', to: '#C255DF' }, // LOGO ONLY
  text: '#212529', textStrong: '#12263F', textBody: '#5A7184', textMuted: '#ADB5BD', textFaint: '#95AAC9', textOnColor: '#FFFFFF',
  bg: '#F8F9FA', bgBlue: '#EEF2FB', bgViolet: '#F4F0F8', bgElevated: '#FFFFFF', bgScrim: 'rgba(18,38,63,0.35)',
  border: '#E3EBF6', borderStrong: '#D6DEEA', divider: '#ECECEC',
  success: '#6DD39A', successDeep: '#00A86B',
  warning: '#FFC107', warningDeep: '#856404', warningTint: '#FFF3CD',
  danger: '#E5363F',
  labAlert: '#CE5283',
  chartLine: '#4484B2', chartRangeFill: 'rgba(0,200,0,0.15)', chartRangeStroke: '#00C800', chartGrid: '#ECECEC',
  glassFill: 'rgba(255,255,255,0.62)', glassFillStrong: 'rgba(255,255,255,0.78)', glassBorder: 'rgba(255,255,255,0.55)',
} as const;

export const spacing = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40 } as const;
export const radii = { xs: 4, sm: 6, md: 8, lg: 12, xl: 16, '2xl': 22, pill: 9999 } as const;
export const elevation = { 1: {...}, 2: {...}, 3: {...}, 4: {...}, fab: {...} }; // RN shadow objects
export const motion = { durFast: 150, durBase: 250, durSlow: 400 };
```

### 2.2 Typography — `src/design-system/typography.ts`

Styles RN reproduisant `.hemea-display`, `.hemea-h1..h3`, `.hemea-lead`, `.hemea-body`, `.hemea-small`, `.hemea-caption`, `.hemea-label`, `.hemea-value`, `.hemea-value--alert`. Polices natives (SF Pro iOS / Roboto Android via system stack — pas besoin de fonts custom). `fontVariant: ['tabular-nums']` sur `value`.

### 2.3 Composants primitives — `src/design-system/components/`

Un fichier `.tsx` par composant, prop typées strictement. Référence : `LABI-CLAUDE-DESIGN/components.jsx`.

| Composant | Référence prototype | Notes RN |
|---|---|---|
| `HemeaWordmark` | components.jsx → HemeaWordmark | Image + Text, 3 tailles |
| `GlassFAB` | components.jsx → GlassFAB | `expo-glass-effect` (iOS) + fallback `expo-blur` Android |
| `TabBar` | components.jsx → TabBar | **À ne pas utiliser dans l'app** — `NativeTabs` d'Expo Router fait le job nativement. Garder le composant pour usage modal éventuel uniquement. |
| `ScreenHeader` | components.jsx → ScreenHeader | Titre + sous-titre + logo optionnel |
| `PrimaryButton` | components.jsx → PrimaryButton | Variants `primary/secondary/danger/ghost`, sizes `sm/md/lg`, état pressed via Pressable |
| `AnalysisCard` | components.jsx → AnalysisCard | Carte d'analyse (date, valeur, unité, alert) |
| `StatCard` | components.jsx → StatCard | Métrique (label, valeur, unité, date, alert) |
| `ListRow` | components.jsx → ListRow | Icône + titre + détail + chevron (Ionicons via @expo/vector-icons) |
| `ListSection` | components.jsx → ListSection | Section title uppercase + enfants groupés |
| `Banner` | components.jsx → Banner | Success/error/warning inline |
| `GlassSurface` | nouveau | Wrapper `expo-glass-effect` + fallback. Remplace `src/presentation/components/glass/GlassSurface.tsx` |
| `PersonAvatar` | screens/Home.jsx | Avatar circulaire dégradé + initiales |
| `BalanceTrendChart` | screens/Home.jsx | Mini-chart hero (SVG via react-native-svg, look gradient feathered) |
| `MiniChart` | screens/Charts.jsx | Chart inline (déjà existant — réécrire au design Claude) |
| `MarkerInfoSheet` | screens/Charts.jsx | Bottom sheet glassmorphic |

---

## Phase 3 — Recyclage code métier (`src/`)

Copier depuis `labi_old/src/` :
- `domain/` (entities, schemas, services, **les 26 usecases**) — copier tel quel
- `ports/` — copier tel quel
- `adapters/` — copier tel quel (SQLite repos, Mistral services, Multipeer/Android sync, InMemory adaptateurs de test)
- `infrastructure/` — copier tel quel (DatabaseInitializer, RepositoryFactory, AppInitializer, polyfills)
- `types/` — copier (navigation.ts à mettre à jour pour le nouveau routing)
- `utils/` — copier

À **ne pas** recopier :
- `src/presentation/` → réécrit from scratch
- `src/config/themes.ts` → remplacé par `src/design-system/tokens.ts`

Conserver :
- `src/config/LabConfig.ts` (essentiel : catégories, units, reference ranges)
- `src/config/constants.ts`

---

## Phase 4 — Routes & écrans (`app/` + `src/presentation/`)

Structure cible inspirée de la branche actuelle, simplifiée selon le state-machine du prototype Claude (`HemeaApp.jsx`) :

```
app/
├── _layout.tsx                  # Stack racine + Providers (SafeArea, UseCases, TimeRange)
├── +not-found.tsx
├── (tabs)/
│   ├── _layout.tsx              # NativeTabs : Accueil (home), Graphiques (charts) + FAB Importer
│   ├── index.tsx                # → HomeScreen
│   └── charts.tsx               # → ChartsScreen
├── analyses/
│   ├── _layout.tsx              # Stack
│   ├── index.tsx                # → AllAnalysesScreen (modal sheet style)
│   └── [id].tsx                 # → AnalysisDetailScreen (drill-in)
├── upload/
│   ├── _layout.tsx              # Modal stack
│   ├── index.tsx                # ImportChoice (AI vs Manual)
│   ├── ai-import.tsx            # AIUploadFlow
│   └── manual.tsx               # ManualEntryFlow
└── settings/
    ├── _layout.tsx              # Modal stack
    ├── index.tsx                # → SettingsScreen
    ├── profile.tsx              # → ProfileScreen
    ├── api-key.tsx              # → ApiKeySettingsScreen
    ├── api-key-tutorial.tsx     # → MistralApiKeyTutorialScreen
    ├── database.tsx             # → DatabaseSettingsScreen
    ├── sync.tsx                 # → SyncScreen
    ├── privacy.tsx              # → PrivacySecurityScreen
    ├── privacy-policy.tsx       # → PrivacyPolicyWebViewScreen
    ├── help.tsx                 # → HelpCenterScreen
    └── about.tsx                # → AboutScreen
```

Note : le prototype Claude présente Settings comme overlay modal, mais la branche actuelle l'a mis en tab. On choisit la **structure de la branche actuelle (Settings hors `(tabs)`, en modal)** pour rapprocher du prototype Claude (3e onglet = pas dans le design Claude). NativeTabs : juste Home + Charts. Settings accessible via `GlassFAB` en haut à droite de Home (comme le prototype).

### 4.1 Mapping écrans → composants Claude

| Écran nouveau | Référence Claude | Use cases / services à brancher |
|---|---|---|
| `HomeScreen` | `screens/Home.jsx` | LoadAnalysesUseCase, LoadProfileUseCase, GetPinnedMarkersUseCase, TogglePinUseCase |
| `ChartsScreen` | `screens/Charts.jsx` | LoadAnalysesUseCase, ReferenceRangeCalculator, TimeRangeContext |
| `UploadScreen` (choice) | `screens/Upload.jsx` (ImportChoice) | — |
| `AIImportScreen` | `screens/Upload.jsx` (AIUploadFlow) | UploadPdfUseCase, ExtractAnalysisFromPdfUseCase (Mistral OCR), SaveAnalysisUseCase |
| `ManualEntryScreen` | `screens/Upload.jsx` (ManualEntryFlow) | SaveAnalysisUseCase |
| `SettingsScreen` | `screens/Settings.jsx` | — (navigation) |
| `ProfileScreen` | `screens/Profile.jsx` | LoadProfileUseCase, SaveProfileUseCase |
| `ApiKeySettingsScreen` | (équivalent ListRow Settings) | SaveApiKeyUseCase, DeleteApiKeyUseCase, ValidateApiKeyUseCase |
| `DatabaseSettingsScreen` | (idem) | ResetDatabaseUseCase, ExportDatabaseUseCase |
| `SyncScreen` | (idem) | StartSyncUseCase, AcceptSyncUseCase (Multipeer/Android) |
| `AnalysisDetailScreen` | `screens/AnalysisDetail.jsx` | LoadAnalysisByIdUseCase, UpdateAnalysisUseCase, DeleteAnalysisUseCase |
| `AllAnalysesScreen` | `screens/AnalysesList.jsx` | LoadAnalysesUseCase (paginé) |

### 4.2 Contexts (`src/presentation/contexts/`)

Recycler depuis `labi_old/src/presentation/contexts/` :
- `UseCasesContext.tsx` — DI container, init app, gestion erreurs API key
- `TimeRangeContext.tsx` — sélection de plage (1W/1M/3M/6M/1Y/All)

Supprimer `TabBarContext.tsx` (legacy, plus utile avec NativeTabs).

### 4.3 Hooks

Recycler `useAnalysisProgress.ts`. Créer au besoin des hooks de chargement (`useAnalyses`, `useProfile`) qui wrappent les use cases.

---

## Phase 5 — Assets

Copier dans `assets/` :
- Logo et wordmark depuis `LABI-CLAUDE-DESIGN/assets/` :
  - `logo-master.png`, `logo-ios-120.png`, `icon-ios.png`, `icon-android.png`, `icon-splash.png`, `icon-variant-gradient.png`, `wordmark-sm/md/lg/xl.png`
- Mettre à jour `app.json` pour pointer vers ces assets (icon, splash, adaptive-icon).

Conserver les assets fonctionnels qui n'existent pas dans le design (placeholders, etc.) en piochant dans `labi_old/assets/`.

---

## Phase 6 — Vérification

1. **Lint & types** : `npm run lint && npx tsc --noEmit`
2. **Tests Jest** : `npm test` — tous les tests métier (domain/usecases) doivent passer puisqu'on n'a pas touché à cette couche. Tests UI à réécrire au fil des composants.
3. **Build dev client** : `npx expo prebuild --clean && npx expo run:ios` (et `run:android`)
4. **Parcours fonctionnel manuel** sur device iOS :
   - Premier lancement → modal création profil → save
   - Home : voir analyses pinned, balance trend chart, FAB Settings, CTA "Mes analyses"
   - Tab Charts : naviguer entre markers, voir reference band, ouvrir MarkerInfoSheet
   - FAB Importer → choice → AI Import (avec une vraie PDF) → vérifier extraction Mistral → save
   - FAB Importer → Manual entry → save
   - Settings → Profile, API key tutorial, Database reset, Sync (Multipeer entre 2 devices)
   - AnalysisDetail : drill-in depuis Home, édition, delete
5. **Parcours Android** : vérifier fallback glass (opaque blanc), sync file-based.
6. **Visual check** vs preview Claude : ouvrir `LABI-CLAUDE-DESIGN/ui_kits/mobile/index.html` côte-à-côte avec l'app, screen par screen.

---

## Fichiers critiques

**Source de vérité design** :
- `LABI-CLAUDE-DESIGN/colors_and_type.css` (tokens)
- `LABI-CLAUDE-DESIGN/components.jsx` (specs composants)
- `LABI-CLAUDE-DESIGN/ui_kits/mobile/screens/*.jsx` (specs écrans)
- `LABI-CLAUDE-DESIGN/README.md` (charte de marque, non-négociables)

**À créer** :
- `src/design-system/tokens.ts`
- `src/design-system/typography.ts`
- `src/design-system/components/*.tsx` (15 composants)
- `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/settings/_layout.tsx`, `app/upload/_layout.tsx`, `app/analyses/_layout.tsx`
- `src/presentation/screens/**/*.tsx` (tous les écrans, réécrits)

**À recycler tel quel depuis `labi_old/`** :
- `src/domain/**`, `src/ports/**`, `src/adapters/**`, `src/infrastructure/**`
- `src/config/LabConfig.ts`, `src/config/constants.ts`
- `src/presentation/contexts/UseCasesContext.tsx`, `src/presentation/contexts/TimeRangeContext.tsx`
- `src/presentation/hooks/useAnalysisProgress.ts`
- `jest.config.js`, `jest.setup.js`, `tsconfig.json`, `eslint.config.mjs`, `__mocks__/`, `scripts/`, `ios-scripts/`

**À ne PAS recycler** :
- `src/presentation/components/**` (réécrits)
- `src/presentation/screens/**` (réécrits)
- `src/presentation/contexts/TabBarContext.tsx` (legacy)
- `src/config/themes.ts` (remplacé)
- `src/presentation/navigation/AppNavigator.tsx` (legacy, Expo Router gère)

---

## Risques & points d'attention

1. **expo-glass-effect** : ne fonctionne pas en Expo Go → confirmer que `expo-dev-client` est bien dans les deps et que le build natif est fait avant chaque session UI. Le mock `__mocks__/expo-glass-effect.ts` permet aux tests Jest de passer.
2. **SQLCipher** : passwords clés stockés via expo-secure-store. Migration de la DB depuis l'ancienne app : à valider — soit l'utilisateur réimporte ses analyses, soit on prévoit une étape de migration (lire `labi_old` DB → écrire nouveau format). **Décision recommandée** : pas de migration en première itération, recommencer avec une DB vierge (acceptable car app pas encore publiée).
3. **Polices** : le design vise Inter (web) / SF Pro (iOS) / Roboto (Android). On utilise la stack système RN par défaut — pas de chargement de fonts custom (sauf si l'utilisateur veut explicitement Inter partout, auquel cas ajouter `expo-font` + fichiers Inter).
4. **NativeTabs Liquid Glass** : le design Claude présente la tab bar comme une "pill glass" centrée + FAB primaire — ça **diverge** de NativeTabs standard d'Expo Router (tab bar pleine largeur). Choix possibles :
   - **A.** Adopter NativeTabs (simple, look iOS 26 natif) — légère divergence visuelle vs prototype.
   - **B.** Custom TabBar glass (reproduit fidèlement le prototype) — plus de code, perte des automatismes natifs.
   - Recommandation : **A** (NativeTabs) en première itération, **B** envisageable si l'utilisateur juge le rendu insuffisamment fidèle.
5. **Volume du chantier** : ~15 composants design system + ~12 écrans à réécrire. À découper en plusieurs sessions (ne pas tenter en un seul commit).

---

## Découpage de livraison suggéré

1. **Commit 1** : Phase 0 (déplacement vers `labi_old/`)
2. **Commit 2** : Phase 1 (bootstrap nouvelle racine : package.json, tsconfig, app.json, configs)
3. **Commit 3** : Phase 2 (design system : tokens + typography + composants primitives)
4. **Commit 4** : Phase 3 (recyclage domain/ports/adapters/infrastructure/config)
5. **Commit 5-N** : Phase 4 par groupe d'écrans (Home + (tabs) layout, puis Charts, puis Upload, puis Settings + Profile + sub-screens, puis AnalysisDetail + AnalysesList)
6. **Commit final** : Phase 5 assets + ajustements app.json + smoke test