/**
 * Configuration centralisée pour les valeurs de laboratoire
 */

export const LAB_VALUE_CATEGORIES = {
  Hématologie: [
    "Hematies",
    "Hémoglobine",
    "Hématocrite",
    "VGM",
    "TCMH",
    "CCMH",
    "Leucocytes",
    "Polynucléaires neutrophiles",
    "Polynucléaires éosinophiles",
    "Polynucléaires basophiles",
    "Lymphocytes",
    "Monocytes",
    "Plaquettes",
  ],
  "Biochimie & Enzymologie": [
    "Transaminases TGO",
    "Transaminases TGP",
    "Proteine C Reactive",
    "Ferritine",
  ],
  Vitamines: ["Vitamine B9", "Vitamine B12"],
  "Autres Marqueurs": [
    "Glycémie",
    "Hémoglobine Glyquée",
    "Cholesterol HDL",
    "Cholesterol LDL",
    "Triglycérides",
    "Gamma GT",
    "Score de fibrose hépatique",
    "TSH",
  ],
};

export const LAB_VALUE_KEYS = Object.values(LAB_VALUE_CATEGORIES).flat();

export const LAB_VALUE_UNITS: Record<string, string> = {
  Hematies: "T/L",
  Hémoglobine: "g/dL",
  Hématocrite: "%",
  VGM: "fl",
  TCMH: "pg",
  CCMH: "g/dL",
  Leucocytes: "giga/L",
  "Polynucléaires neutrophiles": "giga/L",
  "Polynucléaires éosinophiles": "giga/L",
  "Polynucléaires basophiles": "giga/L",
  Lymphocytes: "giga/L",
  Monocytes: "giga/L",
  Plaquettes: "giga/L",
  "Proteine C Reactive": "mg/L",
  Ferritine: "μg/L",
  "Vitamine B9": "ng/mL",
  "Vitamine B12": "pg/mL",
  Glycémie: "g/l",
  "Hémoglobine Glyquée": "%",
  "Cholesterol HDL": "g/l",
  "Cholesterol LDL": "g/l",
  Triglycérides: "g/l",
  "Transaminases TGO": "U/L",
  "Transaminases TGP": "U/L",
  "Gamma GT": "U/L",
  "Score de fibrose hépatique": "%",
  TSH: "mUI/L",
};

export const LAB_VALUE_DEFAULT_RANGES = {
  Hematies: { min: 4.28, max: 6.0 },
  Hémoglobine: { min: 13.0, max: 18.0 },
  Hématocrite: { min: 39.0, max: 53.0 },
  VGM: { min: 78.0, max: 98.0 },
  TCMH: { min: 26.0, max: 34.0 },
  CCMH: { min: 31.0, max: 36.5 },
  Leucocytes: { min: 4.0, max: 11.0 },
  "Polynucléaires neutrophiles": { min: 1.4, max: 7.7 },
  "Polynucléaires éosinophiles": { min: 0.02, max: 0.63 },
  "Polynucléaires basophiles": { min: 0.0, max: 0.11 },
  Lymphocytes: { min: 1.0, max: 4.8 },
  Monocytes: { min: 0.18, max: 1.0 },
  Plaquettes: { min: 150.0, max: 400.0 },
  "Proteine C Reactive": { min: 0.0, max: 5.0 },
  Ferritine: { min: 22.0, max: 322.0 },
  "Vitamine B9": { min: 3.89, max: 26.8 },
  "Vitamine B12": { min: 197.0, max: 771.0 },
  Glycémie: { min: 0.74, max: 1.06 },
  "Hémoglobine Glyquée": { min: 4, max: 6 },
  "Cholesterol HDL": { min: 0.4, max: 10 },
  "Cholesterol LDL": { min: 0.0, max: 1.6 },
  Triglycérides: { min: 0.0, max: 1.5 },
  "Transaminases TGO": { min: 0.0, max: 40 },
  "Transaminases TGP": { min: 0.0, max: 40 },
  "Gamma GT": { min: 0.0, max: 38 },
  "Score de fibrose hépatique": { min: 0.0, max: 2.67 },
  TSH: { min: 0.55, max: 4.78 },
};

export const LAB_VALUE_EXPLANATIONS: Record<string, string> = {
  Hematies: "Les hématies, ou globules rouges, sont les cellules sanguines responsables du transport de l'oxygène des poumons vers les tissus. Leur nombre est crucial pour l'apport d'oxygène dans tout le corps. Des niveaux bas peuvent indiquer une anémie, une hémorragie, ou des carences nutritionnelles, tandis que des niveaux élevés peuvent suggérer une déshydratation, des maladies pulmonaires, ou certains troubles de la moelle osseuse.",
  
  Hémoglobine: "L'hémoglobine est la protéine riche en fer présente dans les globules rouges qui se lie à l'oxygène dans les poumons et le transporte vers les tissus. Elle joue un rôle essentiel dans la production d'énergie cellulaire et le maintien des fonctions vitales. Une hémoglobine basse (anémie) peut causer fatigue, pâleur et essoufflement, tandis qu'une hémoglobine élevée peut être liée à des problèmes cardiaques, pulmonaires ou à une déshydratation.",
  
  Hématocrite: "L'hématocrite représente le pourcentage du volume sanguin occupé par les globules rouges. Cette mesure aide à évaluer l'état d'hydratation, la capacité de transport d'oxygène et à diagnostiquer différents types d'anémies. Un hématocrite bas peut indiquer une anémie ou une surhydratation, tandis qu'un hématocrite élevé peut signaler une déshydratation, une polyglobulie ou des maladies cardio-pulmonaires.",
  
  VGM: "Le Volume Globulaire Moyen (VGM) mesure la taille moyenne des globules rouges. C'est un paramètre crucial pour classifier les types d'anémies: microcytaire (petites cellules, souvent liée à une carence en fer), normocytaire (taille normale) ou macrocytaire (grandes cellules, souvent associée à des carences en vitamines B9 ou B12). Le VGM aide à orienter le diagnostic et à déterminer les causes sous-jacentes des troubles hématologiques.",
  
  TCMH: "La Teneur Corpusculaire Moyenne en Hémoglobine (TCMH) mesure la quantité moyenne d'hémoglobine contenue dans chaque globule rouge. Ce paramètre est utile pour évaluer les capacités de transport d'oxygène des globules rouges. Une TCMH basse peut indiquer une carence en fer ou une thalassémie, tandis qu'une TCMH élevée peut être observée dans certaines anémies macrocytaires ou lors d'expositions à certaines toxines.",
  
  CCMH: "La Concentration Corpusculaire Moyenne en Hémoglobine (CCMH) mesure la concentration moyenne d'hémoglobine dans un volume donné de globules rouges. Ce paramètre aide à caractériser les anémies et à évaluer l'efficacité du transport d'oxygène. Une CCMH basse peut être observée dans les anémies hypochromes (carence en fer), tandis qu'une CCMH élevée est rare mais peut être liée à certaines pathologies comme la sphérocytose héréditaire.",
  
  Leucocytes: "Les leucocytes, ou globules blancs, constituent le système de défense de l'organisme contre les infections et les corps étrangers. Ils jouent un rôle central dans l'immunité innée et adaptative. Une augmentation des leucocytes (leucocytose) indique généralement une infection bactérienne, une inflammation, un stress physiologique ou certains cancers, tandis qu'une diminution (leucopénie) peut être liée à certaines infections virales, maladies auto-immunes ou traitements médicamenteux immunosuppresseurs.",
  
  "Polynucléaires neutrophiles": "Les polynucléaires neutrophiles sont le type de globules blancs le plus abondant dans le sang. Ces cellules constituent la première ligne de défense contre les infections bactériennes, participant activement à la phagocytose des microorganismes. Une augmentation (neutrophilie) est typiquement observée lors d'infections bactériennes, d'inflammations aiguës ou de stress, tandis qu'une diminution (neutropénie) peut être liée à certaines infections virales, des maladies auto-immunes, ou des effets secondaires médicamenteux.",
  
  "Polynucléaires éosinophiles": "Les polynucléaires éosinophiles sont des globules blancs impliqués principalement dans les réactions allergiques et la défense contre les parasites. Ils libèrent des substances qui combattent les infections mais peuvent aussi endommager les tissus lors de réactions allergiques prolongées. Un taux élevé d'éosinophiles (éosinophilie) est fréquent dans les allergies, l'asthme, les infections parasitaires et certaines maladies auto-immunes, tandis qu'un taux bas est moins significatif cliniquement.",
  
  "Polynucléaires basophiles": "Les polynucléaires basophiles sont les globules blancs les moins nombreux dans la circulation sanguine. Ils contiennent des granules riches en histamine et jouent un rôle dans les réactions inflammatoires, allergiques et la réponse immunitaire contre certains parasites. Une augmentation des basophiles (basophilie) peut être observée dans les réactions allergiques sévères, les maladies myéloprolifératives et certaines leucémies, tandis que leur diminution est rarement significative cliniquement.",
  
  Lymphocytes: "Les lymphocytes sont des globules blancs essentiels pour le système immunitaire adaptatif. Ils se divisent en lymphocytes T (immunité cellulaire), lymphocytes B (production d'anticorps) et cellules NK (natural killer). Ces cellules reconnaissent spécifiquement les agents pathogènes, produisent des anticorps et détruisent les cellules infectées ou cancéreuses. Une lymphocytose (augmentation) peut indiquer des infections virales, certaines leucémies ou maladies auto-immunes, tandis qu'une lymphopénie (diminution) peut être liée à des infections sévères, des immunodéficiences ou certains traitements médicamenteux.",
  
  Monocytes: "Les monocytes sont de grands globules blancs qui circulent dans le sang avant de migrer dans les tissus où ils se transforment en macrophages. Ils jouent un rôle crucial dans la phagocytose des micro-organismes, l'élimination des cellules mortes et la présentation d'antigènes aux lymphocytes. Une augmentation des monocytes (monocytose) peut indiquer des infections chroniques, des maladies inflammatoires, auto-immunes ou certains cancers, tandis qu'une diminution est rarement significative cliniquement.",
  
  Plaquettes: "Les plaquettes (ou thrombocytes) sont des fragments cellulaires essentiels à la coagulation sanguine et à la réparation vasculaire. Elles adhèrent aux parois des vaisseaux endommagés et s'agrègent pour former un clou plaquettaire initial. Une thrombocytopénie (diminution) augmente le risque de saignements et peut être causée par des infections, des maladies auto-immunes ou certains médicaments. Une thrombocytose (augmentation) peut augmenter le risque de thrombose et peut être réactionnelle (inflammation, infection) ou primaire (maladies myéloprolifératives).",
  
  "Proteine C Reactive": "La Protéine C Réactive (CRP) est un marqueur inflammatoire produit par le foie en réponse à des signaux de cytokines pro-inflammatoires. Elle participe à l'activation du complément et à l'élimination des agents pathogènes. Son taux augmente rapidement lors d'infections bactériennes, d'inflammations aiguës, de traumatismes tissulaires ou après une chirurgie. La CRP est utilisée pour suivre l'évolution des maladies inflammatoires, détecter les infections et évaluer le risque cardiovasculaire (forme ultrasensible). Des valeurs normales suggèrent l'absence d'inflammation systémique significative.",
  
  Ferritine: "La ferritine est la principale protéine de stockage du fer dans l'organisme, principalement dans le foie, la rate et la moelle osseuse. Son dosage sanguin reflète les réserves en fer de l'organisme et constitue un marqueur de l'inflammation. Une ferritine basse indique généralement une carence en fer, tandis qu'une ferritine élevée peut être liée à une surcharge en fer (hémochromatose), une inflammation, certaines pathologies hépatiques, des syndromes métaboliques ou des cancers. L'interprétation doit tenir compte du contexte clinique et des autres paramètres du bilan martial.",
  
  "Vitamine B9": "La vitamine B9 (acide folique ou folate) est une vitamine hydrosoluble essentielle pour la synthèse de l'ADN, la division cellulaire et le métabolisme des acides aminés. Elle joue un rôle crucial dans la formation des globules rouges, le développement neurologique fœtal et la prévention des malformations du tube neural. Une carence peut entraîner une anémie mégaloblastique, des troubles neurologiques, un risque accru de malformations congénitales et potentiellement des maladies cardiovasculaires. Les besoins sont augmentés pendant la grossesse, l'allaitement et chez les personnes souffrant de malabsorption intestinale.",
  
  "Vitamine B12": "La vitamine B12 (cobalamine) est essentielle au fonctionnement neurologique, à la synthèse de l'ADN et à la formation des globules rouges. Elle nécessite le facteur intrinsèque gastrique pour son absorption intestinale. Une carence peut causer une anémie pernicieuse (mégaloblastique), des troubles neurologiques (neuropathies, troubles cognitifs) et des symptômes psychiatriques. Les carences sont fréquentes chez les végétaliens stricts, les personnes âgées, celles souffrant de gastrite atrophique, de maladie de Crohn ou ayant subi une chirurgie gastrique. Le diagnostic précoce est important car certains dommages neurologiques peuvent être irréversibles.",
  
  Glycémie: "La glycémie mesure la concentration de glucose dans le sang, principale source d'énergie de l'organisme. Sa régulation, assurée principalement par l'insuline et le glucagon, est essentielle au fonctionnement cellulaire. Une hyperglycémie à jeun peut indiquer un diabète, un prédiabète, un stress physiologique ou certaines pathologies endocriniennes. Une hypoglycémie peut être due à un excès d'insuline, certains médicaments, des troubles hépatiques ou endocriniens, ou survenir après un jeûne prolongé. Les fluctuations glycémiques peuvent affecter de nombreux systèmes corporels et nécessitent une surveillance régulière chez les personnes à risque.",
  
  "Hémoglobine Glyquée": "L'hémoglobine glyquée (HbA1c) reflète la glycémie moyenne sur les 2-3 derniers mois. Elle mesure le pourcentage d'hémoglobine liée au glucose de façon irréversible, proportion qui augmente avec la glycémie. Contrairement à la glycémie ponctuelle, l'HbA1c n'est pas influencée par les variations quotidiennes et ne nécessite pas de jeûne. C'est un outil essentiel pour le diagnostic du diabète (≥6,5%) et le suivi thérapeutique. Elle permet d'évaluer le risque de complications micro et macrovasculaires du diabète. Une réduction de l'HbA1c est associée à une diminution significative de ces complications.",
  
  "Cholesterol HDL": "Le cholestérol HDL (lipoprotéines de haute densité) est souvent appelé \"bon cholestérol\" car il participe au transport inverse du cholestérol, des tissus périphériques vers le foie où il est éliminé. Il possède des propriétés anti-inflammatoires, antioxydantes et contribue à la protection cardiovasculaire. Un taux bas de HDL (<0,4 g/L) est un facteur de risque cardiovasculaire indépendant et peut être associé à l'obésité, la sédentarité, le tabagisme ou des facteurs génétiques. Un taux élevé est généralement bénéfique, bien que certaines élévations pathologiques existent.",
  
  "Cholesterol LDL": "Le cholestérol LDL (lipoprotéines de basse densité), souvent appelé \"mauvais cholestérol\", transporte le cholestérol du foie vers les tissus périphériques. En excès, il s'accumule dans les parois artérielles, formant des plaques d'athérome qui peuvent obstruer les vaisseaux et causer des maladies cardiovasculaires. Un taux élevé est influencé par des facteurs génétiques, l'alimentation, la sédentarité ou certaines pathologies. L'objectif thérapeutique varie selon le niveau de risque cardiovasculaire global du patient, avec des cibles plus basses pour les personnes à haut risque ou en prévention secondaire.",
  
  Triglycérides: "Les triglycérides sont les principales graisses de stockage énergétique dans l'organisme. Transportés dans le sang par les lipoprotéines, ils proviennent de l'alimentation ou sont synthétisés par le foie. Une hypertriglycéridémie peut être liée à une alimentation riche en sucres raffinés ou en alcool, à l'obésité, au diabète, à certains médicaments ou à des facteurs génétiques. Des taux très élevés (>10 g/L) augmentent le risque de pancréatite aiguë, tandis que des élévations modérées sont associées à un risque cardiovasculaire accru, particulièrement en présence d'autres facteurs de risque comme un HDL bas.",
  
  "Transaminases TGO": "Les transaminases TGO (ASAT - aspartate aminotransférase) sont des enzymes présentes principalement dans les cellules du foie, du cœur et des muscles. Leur élévation dans le sang indique une souffrance ou une destruction cellulaire de ces tissus. Une augmentation des TGO peut être causée par une hépatite virale ou médicamenteuse, une stéatose hépatique, une consommation excessive d'alcool, un infarctus du myocarde, une myopathie ou un effort musculaire intense. Le rapport TGO/TGP peut aider à orienter le diagnostic étiologique d'une atteinte hépatique.",
  
  "Transaminases TGP": "Les transaminases TGP (ALAT - alanine aminotransférase) sont des enzymes majoritairement présentes dans le foie, ce qui en fait des marqueurs plus spécifiques de l'atteinte hépatique que les TGO. Leur élévation sanguine signale une cytolyse hépatique dont les causes peuvent être diverses: hépatites virales, toxiques ou médicamenteuses, stéatose métabolique (NASH), maladie alcoolique du foie, hépatites auto-immunes, ou obstruction biliaire. La persistance d'une élévation modérée des TGP est fréquente dans la stéatose hépatique non alcoolique, très répandue dans les pays occidentaux.",
  
  "Gamma GT": "Les Gamma-GT (gamma-glutamyl transférases) sont des enzymes présentes dans de nombreux tissus, principalement les voies biliaires, le foie, le pancréas et les reins. Elles participent au métabolisme du glutathion et au transport des acides aminés. Leur élévation est un marqueur sensible mais peu spécifique de pathologie hépatobiliaire: cholestase, consommation excessive d'alcool, médicaments inducteurs enzymatiques, stéatose hépatique, cholécystite. L'association d'une élévation des gamma-GT et des phosphatases alcalines oriente vers une pathologie des voies biliaires.",
  
  "Score de fibrose hépatique": "Le score de fibrose hépatique est un indicateur calculé à partir de biomarqueurs sanguins pour évaluer le degré de fibrose (cicatrisation) du foie sans recourir à la biopsie. Cette fibrose progressive, quelle que soit sa cause (hépatites virales, NASH, alcool), peut évoluer vers une cirrhose et compromettre les fonctions hépatiques essentielles. Les scores non-invasifs (FIB-4, NAFLD Fibrosis Score, FibroTest) combinent des paramètres comme l'âge, les plaquettes, les transaminases ou d'autres biomarqueurs pour estimer la probabilité de fibrose avancée. Un score élevé peut nécessiter des explorations complémentaires (élastographie, biopsie) et une prise en charge spécifique.",
  
  TSH: "La Thyréostimuline (TSH) est l'hormone produite par l'hypophyse qui régule la production des hormones thyroïdiennes (T3 et T4). Son dosage est l'examen de première intention pour évaluer la fonction thyroïdienne. Une TSH élevée avec T4 basse indique une hypothyroïdie primaire (insuffisance thyroïdienne); une TSH basse avec T4 élevée signe une hyperthyroïdie. Les dysthyroïdies peuvent être d'origine auto-immune (maladie de Hashimoto, maladie de Basedow), médicamenteuse, post-partum ou liées à des anomalies structurelles. Le traitement et le suivi sont adaptés à l'étiologie et au contexte clinique du patient.",
};
