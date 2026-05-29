# Héméa — Mobile UI kit

Recréation cliquable de l'application **Héméa** (iOS / Android, React Native + Expo dans la vraie app).

Ouvre `index.html` pour une démo en iPhone frame avec navigation :
- **Accueil** — liste des analyses, ouvre le détail au tap.
- **Importer** (FAB primaire) — sélection PDF + indicateur d'étapes OCR.
- **Graphiques** — un graphique par marqueur, FAB plage de temps (1y / 3y / 5y / Max).
- **Réglages** (FAB glass en haut à droite de l'Accueil) — profil, clé API, base, support.
- **Détail d'analyse** — table par catégorie avec valeurs, plages, alertes.

## Architecture

- `components.jsx` — primitives partagées : `HemeaWordmark`, `TabBar` (Liquid Glass), `GlassFAB`, `ScreenHeader`, `PrimaryButton`, `AnalysisCard`, `StatCard`, `ListRow`, `ListSection`, `Banner`. Toutes exposées sur `window` pour Babel cross-script.
- `data.jsx` — données factices (5 analyses, catégories de marqueurs).
- `HemeaApp.jsx` — orchestrateur : state `tab` + `overlay` (upload / settings) + `openAnalysis`.
- `screens/Home.jsx` — liste cartes, settings glass FAB, empty state.
- `screens/Upload.jsx` — drop zone + steps OCR animés.
- `screens/Charts.jsx` — `MiniChart` SVG inline avec gradient feathered + stats.
- `screens/AnalysisDetail.jsx` — drill-in détail.
- `screens/Settings.jsx` — 3 sections (Profil / Configuration / Support).
- `ios-frame.jsx`, `design-canvas.jsx` — starter components.

## Charte appliquée

- Tab bar **Liquid Glass** compacte ancrée à gauche (Accueil + Graphiques) + FAB primaire **Importer** à droite ; Réglages en FAB glass au coin haut-droit de l'Accueil.
- Couleurs et radii tirés de `colors_and_type.css` (variables CSS) ou de la constante `HEMEA` dans `components.jsx`.
- Charts : ligne `#4484B2`, gradient vert feathered pour la plage, points rouges pour le hors plage.
- Tabular nums sur toutes les valeurs labo, pas d'emoji.

## Hors périmètre

L'UI kit est une recréation **visuelle** : pas de SQLite, pas d'OCR réel, pas de date picker fonctionnel. Les écrans réels de la vraie app (notamment `AnalysisDetailsScreen`, `CreateProfileModal`, `ChartScreen` complet) sont dans le codebase https://github.com/YHallouard/LaBI — référez-vous-y pour la logique métier.
