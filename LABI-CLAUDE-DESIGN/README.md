# Héméa — Design System

**Héméa** est une application mobile francophone de **suivi personnel d'analyses biologiques**. Elle permet d'importer des PDF de bilans sanguins via OCR (Mistral), de saisir des valeurs manuellement, puis de visualiser leur évolution dans le temps avec des plages de référence adaptées au profil (âge, sexe).

- **Plateforme** : React Native (Expo) — iOS + Android, mode clair uniquement.
- **Stockage** : 100 % local, SQLite chiffré, synchronisation pair-à-pair sur réseau local.
- **Vie privée** : aucune donnée ne quitte l'appareil ; seul l'OCR transite par la clé Mistral fournie par l'utilisateur.
- **Couverture** : hématologie, biochimie, lipides, vitamines, enzymes hépatiques, TSH…

Ce design system condense les couleurs, la typographie, les composants et le ton de l'app dans un format réutilisable par d'autres surfaces (web, deck, marketing).

---

## Sources

- **Codebase** — https://github.com/YHallouard/LaBI · explorez ce dépôt pour aller plus loin que ce qui est répliqué ici (architecture hexagonale, services OCR, modèle de référence par âge).
- **Brand assets fournis** — logo (`Master — White BG.png`), icônes app (iOS solid, Android adaptive, gradient variant), wordmark à 4 tailles, boutons Figma.
- **Spec produit** — fournie en accompagnement (palette, typographie, glassmorphisme iOS, tokens charts).

---

## Index

| Fichier | Contenu |
|---|---|
| `colors_and_type.css` | Tokens CSS (couleurs, type, espacement, radii, ombres, glass, charts). |
| `assets/` | Logos PNG, icônes app, wordmarks, capture Figma de référence. |
| `preview/` | Cartes 700px pour la galerie Design System (couleurs, type, spacing, composants, brand). |
| `ui_kits/mobile/` | Recréation cliquable de l'app mobile (Accueil, Importer, Graphiques, Réglages, Détail d'analyse). |
| `SKILL.md` | Instructions pour réutiliser ce design system comme skill Claude. |
| `README.md` | Ce fichier. |

---

## CONTENT FUNDAMENTALS

Le ton de Héméa est **médical, sobre, rassurant, francophone**. Pas de marketing-speak, pas de "vous allez adorer", pas d'emoji.

- **Langue** : français exclusivement (l'app est franco-centrée). Pas d'anglicismes inutiles ; on dit "Importer", "Analyse", "Plage de référence" — pas "Upload" ni "Range".
- **Personne** : on s'adresse à l'utilisateur en **vous**, mais sobrement. Exemples du code : *"Sélectionnez un PDF de votre bilan…"*, *"Vos données ne quittent jamais l'appareil."*
- **Casing** : titres et boutons en **Capitalisation française** (premier mot capitalisé seulement). Labels de section en SMALL CAPS façon iOS settings.
- **Ponctuation** : espace insécable avant `:`, `?`, `!`, `;` (norme typo française). Apostrophe courbe (`'`) recommandée.
- **Nombres** : tabular nums systématiquement pour les valeurs labo. Décimales avec virgule en français (`3,42 mg/L`) mais le code actuel utilise le point ; les deux sont acceptables — privilégier la virgule pour les surfaces produit.
- **Plages** : toujours `min – max unité`, e.g. `0,0 – 5,0 mg/L`.
- **Erreurs** : factuelles, jamais culpabilisantes. *"Clé API non configurée. Définissez-la dans Réglages."*
- **Empty states** : phrase courte + action concrète. Pas de mascotte ni de jeu de mots.
- **Émoji** : **non**. L'app utilise des icônes Ionicons exclusivement.

Mots-clés à privilégier : analyse, bilan, plage de référence, marqueur, profil, suivi, évolution, local, confidentiel.

---

## VISUAL FOUNDATIONS

### Palette

- **Primaire** : `#2C7BE5` (Bleu Héméa) — toutes les actions principales, l'état actif, les valeurs labo normales, le tracé des graphiques.
- **Secondaire** : `#00B4A6` (Teal) — actions secondaires, synchronisation P2P.
- **Dégradé marque** : `#E5363F → #CE5283 → #C255DF`. **Réservé à la goutte du logo.** Jamais utilisé comme fond d'écran ni de bouton.
- **Sémantique** : succès `#6DD39A`, warning `#FFC107`, erreur `#E5363F`, alerte labo `#CE5283` (rose — résultat hors plage dans les graphiques).
- **Texte** : `#212529` corps · `#12263F` titres · `#5A7184` paragraphes · `#95AAC9` meta · `#ADB5BD` placeholders.
- **Fonds** : `#F8F9FA` écran de base · `#EEF2FB` tinté bleu · `#F4F0F8` tinté violet · `#FFFFFF` surfaces élevées.

### Typographie

- **Famille** : SF Pro (iOS) / Roboto (Android) en natif ; **Inter** utilisé comme substitut sur les surfaces web/preview. *À remplacer* par les fichiers de police définitifs si la marque adopte une famille custom.
- **Échelle** : 12 → 14 → 16 → 18 → 22 → 24 → 32px. Tracking légèrement négatif sur les titres (-0.01 à -0.02em).
- **Numérique** : `font-variant-numeric: tabular-nums` partout où il y a des valeurs labo.

### Mise en page

- **Grille** : baseline 4-pt (4, 8, 12, 16, 20, 24, 32, 40).
- **Marge écran** : 16px latéral, 20px sur les titres/headers.
- **Pas de full-bleed** sauf splash et fonds tintés. Les listes sont des cartes blanches sur fond `#F8F9FA`.

### Coins, ombres, élévation

- Radii : 6 (sm), 8 (boutons, inputs), 12 (lg), 14 (cartes inline), 16 (modal, conteneurs graphique), pill (segmented, FAB).
- Ombres très douces, bleutées vers le noir : `0 2px 6px rgba(18,38,63,.06)` pour les cartes, `0 6px 20px rgba(44,123,229,.45)` pour le FAB primaire.

### Glassmorphism (iOS Liquid Glass)

- **Où** : tab bar flottante, FAB Réglages, GlassCard sur fonds colorés/photo.
- **Comment** : `background: rgba(255,255,255,0.55–0.62)` + `backdrop-filter: blur(24–28px) saturate(180%)` + bordure blanche translucide + inner shadow `inset 0 1px 0 rgba(255,255,255,.7)`.
- **Fallback** Android / iOS antérieur : `expo-blur` ; sans support → opacité plus marquée (0.85) sans flou.

### Animation

- **Easing** standard : `cubic-bezier(0.22, 0.61, 0.36, 1)` (ease-out). Pour les apparitions ressorties : `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring).
- **Durées** : 150ms feedback tap, 250ms transitions standard, 400ms entrée modal.
- **Patterns clés du code** : FAB time-range qui pivote (45°) + sous-boutons en stagger spring (`Animated.stagger(50, …)`), Spinner natif `ActivityIndicator` couleur primaire, swipe-to-delete sur les cartes.

### Hover / press

- iOS : pas de hover, pression = légère opacité (~0.7) via `TouchableOpacity`.
- Hover web preview : assombrissement de la couleur primaire (`#1F66C9`).
- Pressed : encore plus foncé (`#1856AC`).

### Bordures et séparateurs

- Bordure standard : `1px solid #E3EBF6`.
- Séparateurs de liste : `1px solid #E3EBF6`, alignés au texte (pas sous l'icône — `margin-left: 52px`).

### Transparence et flou

- Utilisée pour la **profondeur**, jamais purement décorative : tab bar, FAB glass, overlays au-dessus de contenu.
- Jamais en dessous de 0.5 d'opacité (lisibilité du contenu derrière).

### Imagerie

- L'app n'utilise pas de photos. Tout est icône + valeur + graphique.
- Si on ajoutait des images médicales (illustrations), tonalité **froide / pastel**, fonds clairs, sans grain.

### Charts

- Ligne `#4484B2`, 2.5–3px, points 4px (5px en alerte rouge `#E5363F`).
- Plage normale : gradient vert `#00C800` à 22 % → 4 % d'opacité, **sans bordure dure**, feathering latéral pour un fondu propre.
- Grille `#F1F4F8`, labels 9px en `#95AAC9`.

---

## ICONOGRAPHY

- **Système** : [Ionicons](https://ionic.io/ionicons) (via `@expo/vector-icons` côté React Native). Style **outline** par défaut, **filled** à l'état actif (e.g. icône Accueil en bottom tab).
- **Stroke** : 1.8 – 2px, line-cap/line-join arrondis.
- **Taille** : 18px (inline, segmented), 20–22px (tab bar, FAB glass), 24px (FAB primaire), 60px (empty states).
- **Couleur** : `#12263F` ou `#2C7BE5` à l'état actif ; `#95AAC9` au repos sur fonds clairs.

Côté web/HTML (slides, marketing, preview), on remplace par des SVG inline équivalents (cf. `preview/brand-iconography.html` pour les principaux : home, add-circle, bar-chart, person, key, server, shield, info, help, upload, trash, time, search, settings, water, chevron). Tous taillés au même stroke.

**Pas d'emoji, pas d'unicode comme glyphe d'UI.** L'unique exception est la goutte du logo qui peut apparaître inline avec le mot-symbole (cf. `HemeaWordmark` dans le UI kit).

**Logos disponibles** dans `assets/`:
- `logo-master.png` — goutte gradient sur fond blanc (logo principal).
- `icon-ios.png`, `icon-android.png` — icônes app (bleu solide).
- `icon-variant-gradient.png` — variante avec gradient de marque.
- `wordmark-sm/md/lg/xl.png` — mot-symbole Héméa + goutte aux 4 tailles.

---

## Substitutions notées (à confirmer / remplacer)

- **Police** : Inter utilisée comme substitut de SF Pro / Roboto. **Remplacez-la** par les fichiers de police définitifs si la marque a une famille custom.
- **Icônes** : SVG inline équivalents à Ionicons. Si un sprite officiel existe, importez-le dans `assets/icons/` et référencez-le.

---

## Mode

L'application est **uniquement en mode clair** (`userInterfaceStyle: "light"` dans `app.json`). Aucun thème sombre n'est prévu — ne pas en concevoir.
