import { PackOption, PopularCategoryCardItem, Product, ProductCategory } from '../types/store';

export const HERO_IMAGE_PATH = '/images/hero_vape_display_1794713683463.jpg';

export const IMG_ELFBAR = '/images/product_elfbar_10k_1794713684201.jpg';
export const IMG_JUUL2 = '/images/product_juul2_kit_1794713684954.jpg';
export const IMG_PODSALT = '/images/product_podsalt_35k_1794713685262.jpg';
export const IMG_ELIQUID = '/images/product_eliquid_bottle_1794713685538.jpg';

export const PACK_OPTIONS: PackOption[] = [
  {
    id: 'single',
    label: 'Single Unit (1x)',
    units: 1,
    discountPercent: 0,
  },
  {
    id: 'pack3',
    label: '3-Pack Bundle (Save 10%)',
    units: 3,
    discountPercent: 10,
    badge: 'Popular in Dubai',
  },
  {
    id: 'pack5',
    label: '5-Pack Box (Save 15%)',
    units: 5,
    discountPercent: 15,
    badge: 'Best Value',
  },
];

export const POPULAR_CATEGORY_CARDS: PopularCategoryCardItem[] = [
  {
    id: 'cat-disposable-vape',
    category: 'Disposable Vape',
    title: 'Disposable Vapes',
    subtitle: '10,000 to 35,000 Puff smart OLED telemetry devices with USB-C fast charging.',
    badge: '10K – 35K Puffs',
    startingPrice: 38.0,
    itemCountLabel: '4 Flagship Series',
    image: IMG_ELFBAR,
    featuredBrands: ['Elf Bar', 'Pod Salt', 'Vozol', 'Tugboat'],
    accentTheme: 'dark',
  },
  {
    id: 'cat-pods-system',
    category: 'Pods System',
    title: 'Closed Pod Systems',
    subtitle: 'Leak-resistant magnetic pod ecosystems with anti-counterfeit chip recognition.',
    badge: 'Pocket MTL Pods',
    startingPrice: 135.0,
    itemCountLabel: 'JUUL2 Ecosystem',
    image: IMG_JUUL2,
    featuredBrands: ['JUUL'],
    accentTheme: 'light',
  },
  {
    id: 'cat-e-liquid',
    category: 'E-Liquid',
    title: 'Nicotine Salt E-Liquids',
    subtitle: 'Authentic UK & California 30ml salt nicotine formulations for refillable pod kits.',
    badge: '20mg – 50mg Salts',
    startingPrice: 45.0,
    itemCountLabel: 'UK & USA Labs',
    image: IMG_ELIQUID,
    featuredBrands: ['Pod Salt', 'VGOD'],
    accentTheme: 'light',
  },
  {
    id: 'cat-vape-kit',
    category: 'Vape Kit',
    title: 'Pro Refillable Vape Kits',
    subtitle: 'CNC-machined 35W pod mods with full-screen UI displays and COREX 2.0 mesh pods.',
    badge: '35W Smart Hardware',
    startingPrice: 125.0,
    itemCountLabel: 'Pro Pod Mods',
    image: IMG_PODSALT,
    featuredBrands: ['Vaporesso', 'Uwell'],
    accentTheme: 'dark',
  },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'elf-bar-10000-puffs',
    title: 'Elf Bar 10000 Puffs Digital Display — Blue Razz Ice',
    brand: 'Elf Bar',
    category: 'Disposable Vape',
    price: 40.0,
    originalPrice: 55.0,
    puffCount: '10,000 Puffs',
    nicotineStrength: '50mg (5%)',
    flavorProfile: 'Chilled Blue Raspberry',
    image: IMG_ELFBAR,
    gallery: [IMG_ELFBAR, HERO_IMAGE_PATH, IMG_PODSALT],
    isOffer: true,
    inStock: true,
    variants: {
      flavors: [
        'Chilled Blue Raspberry',
        'Watermelon Bubblegum Ice',
        'Peach Mango Guava',
        'Blackberry Cranberry Mint',
      ],
      nicotineOptions: ['50mg (5%)', '20mg (2%)'],
    },
    specs: {
      battery: '850mAh USB-C Fast Charge',
      capacity: '18ml Pre-filled Mesh Coil',
      display: 'Live E-Liquid & Battery OLED',
    },
    description:
      'Engineered with Quaq mesh coil technology and a real-time digital telemetry display tracking battery percentage and e-liquid levels. ESMA UAE compliant.',
    longDescription: [
      'The Elf Bar 10000 Puffs Digital Display edition represents the next generation of high-capacity disposable hardware tailored for adult vapers across Dubai and the UAE. Built around an anodized aluminum-polycarbonate chassis, it integrates a high-contrast side OLED screen that eliminates dry hits by displaying exact battery percentage and remaining e-liquid saturation in real time.',
      'Powered by Elf Bar’s proprietary QUAQ ultra-fine mesh heating element, every draw atomizes at a calibrated temperature curve to preserve crisp fruit notes from the first puff to the 10,000th. The 850mAh high-density cobalt cell recharges from 0% to 80% in just 28 minutes via the bottom USB-C port, ensuring uninterrupted all-day reliability.',
    ],
    highlights: [
      'Real-time OLED digital telemetry for live battery % and e-liquid level monitoring',
      'QUAQ 1.0Ω precision mesh coil engineered for zero flavor degradation across 18ml capacity',
      'Anti-leak multi-layer silicone chamber seal tested for high UAE summer temperatures',
      'Official ESMA UAE compliant stock with verifiable QR hologram authenticity code',
    ],
    tastingNotes: {
      inhale: 'Tangy candied blue raspberry burst with bright berry aromatics',
      body: 'Balanced sweet-tart berry compote with smooth nicotine salt throat hit',
      finish: 'Crisp arctic menthol exhale that leaves a clean, refreshing palate',
      iceLevel: '4 / 5 — High Cooling Frost',
      sweetnessLevel: '3.5 / 5 — Balanced Sweet Berry',
    },
    boxContents: [
      '1× Elf Bar 10000 Puffs Digital Display Disposable Device (18ml Pre-filled)',
      '1× Hygienic Silicone Mouthpiece Seal & Airflow Sticker',
      '1× Official UAE Excise Tax Stamp & Scratch-Off QR Verification Box',
      '1× Multilingual User Safety & ESMA Compliance Guide',
    ],
  },
  {
    id: 'pod-salt-35k-puffs',
    title: 'Pod Salt 35K Puffs Smart Screen — Double Apple Shisha',
    brand: 'Pod Salt',
    category: 'Disposable Vape',
    price: 65.0,
    originalPrice: 80.0,
    puffCount: '35,000 Puffs',
    nicotineStrength: '20mg (2%)',
    flavorProfile: 'Authentic Two Apple Molasses',
    image: IMG_PODSALT,
    gallery: [IMG_PODSALT, HERO_IMAGE_PATH, IMG_ELFBAR],
    isOffer: true,
    inStock: true,
    variants: {
      flavors: [
        'Authentic Two Apple Molasses',
        'Blue Mist Berry Ice',
        'Cuban Creme Tobacco',
        'Fresh Mint Leaf Freeze',
      ],
      nicotineOptions: ['20mg (2%)', '50mg (5%)'],
    },
    specs: {
      battery: '1000mAh Dual Mode Boost',
      capacity: '28ml Dual Mesh Tank',
      display: 'Curved Smart HD Display',
    },
    description:
      'Flagship ultra-high capacity disposable hardware featuring switchable Eco (35K) and Boost (20K) wattage modes with British-formulated nicotine salts.',
    longDescription: [
      'Designed in the United Kingdom and filled with Pod Salt’s award-winning salicylic nicotine salt formula, the Pod Salt 35K Smart Screen is our highest-capacity flagship disposable in Dubai. Its wrap-around curved HD display provides instant visual telemetry for wattage output, puff counter, battery reserve, and dual-tank e-liquid volume.',
      'Switch effortlessly between Eco Mode (alternating single-mesh firing for up to 35,000 puffs) and Boost Mode (simultaneous dual-mesh 24W firing for 20,000 dense, shisha-grade clouds). The Double Apple Shisha blend replicates traditional Old Dubai lounge molasses with red sweet apples, crisp green apples, and a subtle aniseed undertone.',
    ],
    highlights: [
      'Switchable Eco Mode (35,000 Puffs) and Dual-Mesh Boost Mode (20,000 Puffs)',
      'Formulated in the UK with pharmaceutical-grade nicotine salts for ultra-smooth throat hit',
      'Curved 3D Smart HD Display with live puff counter and wattage animation',
      'Stepless bottom airflow slider from tight MTL draw to restricted direct-lung (RDL)',
    ],
    tastingNotes: {
      inhale: 'Rich caramelized red apple and crisp granny smith apple',
      body: 'Authentic Middle Eastern shisha molasses with warm spice nuances',
      finish: 'Smooth, lingering aniseed and gentle cooling exhale',
      iceLevel: '2.5 / 5 — Gentle Lounge Coolness',
      sweetnessLevel: '4 / 5 — Rich Molasses Sweetness',
    },
    boxContents: [
      '1× Pod Salt 35K Puffs Dual-Boost Smart Disposable Device (28ml)',
      '1× Pre-installed Ergonomic Soft-Touch Drip Tip Cover',
      '1× UK Batch Authenticity Hologram & UAE Tax Stamp Seal',
      '1× Quick-Start Wattage & Airflow Adjustment Card',
    ],
  },
  {
    id: 'juul-2-starter-kit',
    title: 'Juul 2 Starter Kit — Slate Grey Device + 2 Virginia & Menthol Pods',
    brand: 'JUUL',
    category: 'Pods System',
    price: 135.0,
    puffCount: 'Closed Pod Kit',
    nicotineStrength: '18mg/ml',
    flavorProfile: 'Virginia Tobacco & Crisp Menthol',
    image: IMG_JUUL2,
    gallery: [IMG_JUUL2, HERO_IMAGE_PATH, IMG_ELFBAR],
    isOffer: false,
    inStock: true,
    variants: {
      flavors: [
        'Virginia Tobacco & Crisp Menthol',
        'Autumn Tobacco & Polar Menthol',
        'Ruby Menthol Berry Pack',
        'Summer Menthol Tropical Pack',
      ],
      nicotineOptions: ['18mg/ml Official UAE Spec'],
    },
    specs: {
      battery: '25% Larger Smart Battery + Dock',
      capacity: '2x 1.2ml Authentic JUUL2 Pods',
      display: '4-LED Smart Pulse Interface',
    },
    description:
      'Official UAE JUUL2 Starter Kit complete with Slate Grey device, USB magnetic charging dock, and two authentic 18mg/ml JUUL2 pods with smart pod ID recognition.',
    longDescription: [
      'The official UAE JUUL2 Starter Kit is engineered for adult smokers seeking a clean, dependable, and pocket-friendly transition from combustible cigarettes. Featuring a 25% larger battery capacity and 70% more e-liquid per pod compared to the original generation, the Slate Grey weather-resistant aluminum chassis delivers consistent temperature-regulated vapor from full charge to empty.',
      'Each authentic JUUL2 pod contains an encrypted cryptographic microchip that communicates directly with the device upon magnetic insertion—automatically verifying pod authenticity to prevent counterfeit pods and calibrating the exact heating profile for Virginia Tobacco or Crisp Menthol.',
    ],
    highlights: [
      'Cryptographic Smart Pod-ID chip blocks counterfeit pods and auto-calibrates temperature',
      '4-LED smart light interface communicates battery charge level and remaining e-liquid',
      'Sealed metallic wick heating system engineered for zero spitting or pocket leakage',
      'Includes magnetic high-speed USB charging dock (full charge in under 30 minutes)',
    ],
    tastingNotes: {
      inhale: 'Clean, oven-cured American Virginia brightleaf tobacco',
      body: 'Authentic toasted leaf warmth paired with a separate Crisp Peppermint Menthol pod',
      finish: 'Dry, cigarette-style throat hit with zero lingering sweetness',
      iceLevel: '3 / 5 — Crisp Peppermint (Menthol Pod)',
      sweetnessLevel: '1 / 5 — Authentic Unsweetened Leaf',
    },
    boxContents: [
      '1× Rechargeable JUUL2 Device in Anodized Slate Grey',
      '1× Authentic JUUL2 Virginia Tobacco Pod (1.2ml, 18mg/ml)',
      '1× Authentic JUUL2 Crisp Menthol Pod (1.2ml, 18mg/ml)',
      '1× Magnetic USB Charging Dock & Official UAE Warranty Booklet',
    ],
  },
  {
    id: 'vozol-star-20000-puffs',
    title: 'Vozol Star 20000 Puffs Mirror Screen — Lush Watermelon Ice',
    brand: 'Vozol',
    category: 'Disposable Vape',
    price: 50.0,
    originalPrice: 65.0,
    puffCount: '20,000 Puffs',
    nicotineStrength: '50mg (5%)',
    flavorProfile: 'Sweet Red Watermelon & Ice',
    image: IMG_ELFBAR,
    gallery: [IMG_ELFBAR, IMG_PODSALT, HERO_IMAGE_PATH],
    isOffer: true,
    inStock: true,
    variants: {
      flavors: [
        'Sweet Red Watermelon & Ice',
        'Grape Ice Freeze',
        'Miami Mint Citrus',
        'Dragon Strawnana',
      ],
      nicotineOptions: ['50mg (5%)', '20mg (2%)'],
    },
    specs: {
      battery: '650mAh Rapid USB-C',
      capacity: '24ml Dual Mesh S.i.L.C Tech',
      display: '2.2-Inch HD Mirror LED Screen',
    },
    description:
      'Features a full-surface mirror screen that illuminates on draw with dual-power Eco/Power switch and hygienic mouthpiece protection cap.',
    longDescription: [
      'The Vozol Star 20000 Puffs combines avant-garde industrial styling with Vozol’s patented S.i.L.C. (Smooth, Identical, Long-lasting, Clean) dual-mesh atomization platform. When idle, the front panel presents a sleek electroplated mirror finish; upon drawing or pressing the mode button, a vibrant 2.2-inch color matrix display lights up through the mirror.',
      'Designed specifically for outdoor lifestyles in the Emirates, it includes a snap-on magnetic mouthpiece dust cap that keeps sand and pocket lint out of the airway. Toggle between Eco Mode (20,000 puffs) and Power Mode (15,000 high-density puffs) with a single click.',
    ],
    highlights: [
      '2.2-inch hidden electroplated Mirror HD Screen with dynamic wattage telemetry',
      'Dual S.i.L.C. mesh coils prevent carbon buildup and maintain pure fruit clarity',
      'Integrated magnetic mouthpiece hygiene cap ideal for beach and desert carry',
      'Fast Type-C charging reaches 100% battery in 35 minutes',
    ],
    tastingNotes: {
      inhale: 'Juicy sun-ripened red watermelon nectar',
      body: 'Crisp melon rind freshness with vibrant candy undertones',
      finish: 'Sub-zero menthol breeze on the exhale',
      iceLevel: '4.5 / 5 — Intense Glacial Freeze',
      sweetnessLevel: '4 / 5 — Juicy Summer Melon',
    },
    boxContents: [
      '1× Vozol Star 20000 Puffs Mirror Screen Device (24ml)',
      '1× Attached Magnetic Hygienic Mouthpiece Cap',
      '1× ESMA UAE Authenticity Sticker & User Manual',
    ],
  },
  {
    id: 'pod-salt-nic-salt-30ml',
    title: 'Pod Salt Reserve 30ml Nicotine Salt — Cuban Creme Tobacco',
    brand: 'Pod Salt',
    category: 'E-Liquid',
    price: 45.0,
    puffCount: '30ml Bottle',
    nicotineStrength: '25mg / 50mg',
    flavorProfile: 'Aged Havana Leaf & Madagascar Vanilla',
    image: IMG_ELIQUID,
    gallery: [IMG_ELIQUID, IMG_PODSALT, HERO_IMAGE_PATH],
    isOffer: false,
    inStock: true,
    variants: {
      flavors: [
        'Aged Havana Leaf & Madagascar Vanilla',
        'Blue Raspberry Slush',
        'Mango Ice Nexus',
        'Virginia Gold Tobacco',
      ],
      nicotineOptions: ['20mg (2.0%)', '36mg (3.6%)', '50mg (5.0%)'],
    },
    specs: {
      battery: '50/50 VG/PG Ratio for Pods',
      capacity: '30ml Chubby Gorilla Unicorn',
      display: 'ESMA Excise Tax Stamp Sealed',
    },
    description:
      'Premium UK-manufactured nicotine salt e-liquid crafted specifically for low-wattage pod systems. Ultra-smooth throat hit with rich aromatic vapor.',
    longDescription: [
      'Part of Pod Salt’s prestigious Origin Reserve collection crafted in the UK, Cuban Creme Tobacco is blended to a balanced 50% VG / 50% PG viscosity ratio. This ensures rapid wicking and extended coil life in all refillable MTL pod systems such as the Vaporesso XROS 4 Pro and Uwell Caliburn G3.',
      'Unlike standard freebase e-liquids that become harsh at higher strengths, Pod Salt’s refined nicotine salt formulation neutralizes pH alkalinity—delivering immediate nicotine satisfaction with a velvety throat hit.',
    ],
    highlights: [
      'Balanced 50VG/50PG ratio engineered for 0.6Ω to 1.2Ω refillable pod cartridges',
      'Manufactured in ISO-7 cleanrooms in the United Kingdom',
      'Child-resistant tamper-evident 30ml precision dropper bottle',
      'Sealed with official UAE Federal Tax Authority digital excise stamp',
    ],
    tastingNotes: {
      inhale: 'Earthy, hand-rolled Havana cigar leaf with woody cedar notes',
      body: 'Whipped Madagascar vanilla bean custard and caramelized brown sugar',
      finish: 'Warm, velvety tobacco reserve finish with zero harshness',
      iceLevel: '0 / 5 — Pure Non-Menthol Reserve',
      sweetnessLevel: '2.5 / 5 — Subtle Custard Warmth',
    },
    boxContents: [
      '1× 30ml Pod Salt Reserve Nicotine Salt E-Liquid Bottle',
      '1× Child-Proof Precision Needle-Tip Filling Cap',
      '1× UAE Excise Tax Sealed Outer Carton & Safety Leaflet',
    ],
  },
  {
    id: 'vaporesso-xros-4-pro-kit',
    title: 'Vaporesso XROS 4 Pro Vape Kit — Brushed Titanium Alloy',
    brand: 'Vaporesso',
    category: 'Vape Kit',
    price: 145.0,
    originalPrice: 170.0,
    puffCount: 'Refillable Kit',
    nicotineStrength: '0mg Hardware (Pods Included)',
    flavorProfile: '0.4Ω & 0.8Ω COREX 2.0 Mesh Pods',
    image: IMG_PODSALT,
    gallery: [IMG_PODSALT, HERO_IMAGE_PATH, IMG_JUUL2],
    isOffer: true,
    inStock: true,
    variants: {
      flavors: [
        'Brushed Titanium Alloy',
        'Obsidian Matte Black',
        'Champagne Gold Satin',
        'Cobalt Blue Anodized',
      ],
      nicotineOptions: ['0.4Ω + 0.8Ω COREX 2.0 Mesh', '0.6Ω + 1.0Ω COREX 2.0 Mesh'],
    },
    specs: {
      battery: '1200mAh 2A SuperCharge (35 Min)',
      capacity: '3.0ml Clamshell Top-Fill Pods',
      display: 'AXON Chipset + TFT Wattage Screen',
    },
    description:
      'Aerospace-grade aluminum unibody pod system with precise 0.5W wattage increments, physical slide-lock switch, and COREX 2.0 morph-mesh heating pods.',
    longDescription: [
      'The Vaporesso XROS 4 Pro is the pinnacle of refillable pod engineering. CNC-machined from 7-stage stretched aerospace aluminum alloy, it houses a high-capacity 1200mAh battery capable of full 2A rapid charging in just 35 minutes. The vivid TFT screen displays exact wattage (adjustable in 0.5W steps when using the 0.4Ω pod) or three intelligent output modes (Eco, Normal, Pulse).',
      'Equipped with Vaporesso’s upgraded COREX 2.0 morph-mesh pods and cumulus microfiber cotton, it boosts aroma reproduction by 30% and extends pod lifespan by 30%. A dedicated physical slide-lock switch on the side prevents accidental pocket firing.',
    ],
    highlights: [
      'COREX 2.0 Morph-Mesh technology increases flavor accuracy and pod longevity by 30%',
      'Physical side slide-lock button locks fire button while keeping auto-draw active',
      '1200mAh high-density battery with 2A USB-C SuperCharge (100% in 35 minutes)',
      'Fully compatible with the entire XROS pod family (0.4Ω, 0.6Ω, 0.8Ω, 1.0Ω, 1.2Ω)',
    ],
    tastingNotes: {
      inhale: 'Instant 0.01s AXON pulse ignition for immediate warm vapor',
      body: 'Precision airflow slider transitions from tight cigarette MTL to open RDL',
      finish: 'Ultra-clean flavor separation for both 50/50 nic salts and 70/30 freebase',
      iceLevel: 'Hardware Kit — Customizable by E-Liquid',
      sweetnessLevel: 'COREX 2.0 High-Fidelity Flavor Reproduction',
    },
    boxContents: [
      '1× Vaporesso XROS 4 Pro Battery Body (1200mAh)',
      '1× XROS Series 0.4Ω MESH Pod (3ml Top-Fill, Pre-installed)',
      '1× XROS Series 0.8Ω MESH Pod (3ml Top-Fill, In Box)',
      '1× Braided Type-C Charging Cable, Reminder Card & Warranty Manual',
    ],
  },
  {
    id: 'tugboat-super-12000-puffs',
    title: 'Tugboat Super 12000 Puffs Digital — Mango Passionfruit Freeze',
    brand: 'Tugboat',
    category: 'Disposable Vape',
    price: 38.0,
    puffCount: '12,000 Puffs',
    nicotineStrength: '50mg (5%)',
    flavorProfile: 'Alphonso Mango & Passionfruit Ice',
    image: IMG_ELFBAR,
    gallery: [IMG_ELFBAR, HERO_IMAGE_PATH, IMG_PODSALT],
    isOffer: false,
    inStock: true,
    variants: {
      flavors: [
        'Alphonso Mango & Passionfruit Ice',
        'Lush Watermelon Bubblegum',
        'Purple Rain Berry Mix',
        'Gummy Bear Ice',
      ],
      nicotineOptions: ['50mg (5%)', '20mg (2%)'],
    },
    specs: {
      battery: '600mAh Type-C Rechargeable',
      capacity: '14ml Dual Mesh Coil',
      display: 'Bottom Digital Status Ring',
    },
    description:
      'UAE best-selling tropical disposable delivering intense exotic fruit notes paired with a sub-zero menthol finish and adjustable bottom airflow.',
    longDescription: [
      'A longtime favorite across Dubai and Sharjah, the Tugboat Super 12000 Digital upgrades the classic Tugboat silhouette with a dual-mesh 1.0Ω coil core and a bottom digital telemetry ring. It delivers an unmistakable, punchy throat hit alongside vibrant tropical fruit saturation.',
      'The ergonomic matte-rubberized body resists fingerprints and heat while providing rotary airflow control at the base, allowing you to fine-tune draw resistance on the go.',
    ],
    highlights: [
      'Dual-mesh 1.0Ω heating core for dense, saturated tropical fruit clouds',
      'Soft-touch rubberized grip finish with rotary bottom airflow control ring',
      'Compact pocket dimensions holding 14ml of 50mg/ml nicotine salt e-liquid',
      'Digital battery and e-liquid status indicators integrated at the base',
    ],
    tastingNotes: {
      inhale: 'Ripe Indian Alphonso mango nectar',
      body: 'Zesty tropical passionfruit pulp with tangy citrus highlights',
      finish: 'Crisp glacier ice finish that balances the tropical sweetness',
      iceLevel: '4 / 5 — Chilled Tropical Frost',
      sweetnessLevel: '4.5 / 5 — Rich Exotic Nectar',
    },
    boxContents: [
      '1× Tugboat Super 12000 Puffs Digital Disposable Device (14ml)',
      '1× Sealed Foil Freshness Pouch & Silicone Stopper',
      '1× Authentic Tugboat Hologram Security Code Box',
    ],
  },
  {
    id: 'vgod-cubano-black-saltnic',
    title: 'VGOD SaltNic Labs 30ml E-Liquid — Cubano Black Reserve',
    brand: 'VGOD',
    category: 'E-Liquid',
    price: 55.0,
    puffCount: '30ml Bottle',
    nicotineStrength: '25mg / 50mg',
    flavorProfile: 'Bold Cigar Leaf & Rich Vanilla Custard',
    image: IMG_ELIQUID,
    gallery: [IMG_ELIQUID, HERO_IMAGE_PATH, IMG_PODSALT],
    isOffer: false,
    inStock: true,
    variants: {
      flavors: [
        'Bold Cigar Leaf & Rich Vanilla Custard',
        'Cubano Silver Honey',
        'Lush Ice Watermelon Menthol',
        'Purple Bomb Grape Ice',
      ],
      nicotineOptions: ['25mg (2.5%)', '50mg (5.0%)'],
    },
    specs: {
      battery: 'Optimized for Refillable Pods',
      capacity: '30ml Sealed Authenticity Bottle',
      display: 'Official UAE Tax Stamp Verified',
    },
    description:
      'Aged robust Cuban tobacco notes layered with rich, creamy vanilla custard. Sealed with verifiable hologram authenticity code.',
    longDescription: [
      'VGOD’s Cubano Black from SaltNic Labs in California is widely regarded as the gold standard of dessert-tobacco salt nicotine blends in the Middle East. Aged in oak-style aromatic vats before bottling, it intensifies the dark, smoky character of VGOD’s original Cubano profile.',
      'On the exhale, a rich, velvety layer of whipped vanilla custard rounds out the bold cigar leaf, making it an ideal all-day vape for open pod systems operating between 10W and 18W.',
    ],
    highlights: [
      'Authentic California-formulated VGOD SaltNic Labs 30ml reserve bottle',
      'Crafted specifically for low-wattage refillable pod devices (10W – 18W)',
      'Zero coil-gunking artificial sweeteners for extended cartridge life',
      'Verified genuine import with scratch-off VGOD serial code and UAE tax stamp',
    ],
    tastingNotes: {
      inhale: 'Robust, dark-cured Cuban cigar leaf with smoky espresso undertones',
      body: 'Rich, creamy French vanilla custard and warm caramelized sugar',
      finish: 'Smooth, full-bodied cigar lounge aroma on the exhale',
      iceLevel: '0 / 5 — Warm Aged Tobacco Reserve',
      sweetnessLevel: '3 / 5 — Rich Vanilla Custard Balance',
    },
    boxContents: [
      '1× 30ml VGOD SaltNic Labs Cubano Black Bottle',
      '1× VGOD Authenticity Hologram & UAE Excise Stamp Carton',
    ],
  },
  {
    id: 'uwell-caliburn-g3-pro-kit',
    title: 'Uwell Caliburn G3 Pro Full-Screen Kit — Space Grey',
    brand: 'Uwell',
    category: 'Vape Kit',
    price: 125.0,
    puffCount: '35W Pod Kit',
    nicotineStrength: '0mg Hardware (2 Pods Included)',
    flavorProfile: 'Pro-FOCS Flavor Technology',
    image: HERO_IMAGE_PATH,
    gallery: [HERO_IMAGE_PATH, IMG_PODSALT, IMG_JUUL2],
    isOffer: false,
    inStock: true,
    variants: {
      flavors: [
        'Space Grey Metallic',
        'Midnight Matte Black',
        'Pacific Cobalt Blue',
        'Emerald Green',
      ],
      nicotineOptions: ['0.4Ω + 0.9Ω G3 Pods', '0.6Ω + 1.2Ω G3 Pods'],
    },
    specs: {
      battery: '1000mAh Integrated High-Density',
      capacity: '3.0ml ClearView Side-Fill Pod',
      display: 'Full-Panel Dynamic UI Screen',
    },
    description:
      'The first full-screen Caliburn system featuring 35W maximum output, auto-draw and button ignition, and crystal-clear e-liquid viewing window.',
    longDescription: [
      'The Uwell Caliburn G3 Pro introduces the first edge-to-edge dynamic full-screen UI in the legendary Caliburn lineup. Cast from solid zinc alloy with a satin Space Grey finish, it pairs a 1000mAh battery with up to 35W of regulated output—unlocking true Restricted Direct Lung (RDL) performance with the included 0.4Ω G3 cartridge.',
      'Uwell’s patented Pro-FOCS flavor restoration technology recycles drawn airflow through the atomizer core to condense aromatic molecules, while ultrasonic-welded G3 pods prevent condensation buildup inside the magnetic bay.',
    ],
    highlights: [
      'Full-panel dynamic LCD UI displaying wattage, coil resistance, puff count, and battery %',
      'Ultrasonic-welded U² anti-leak cartridge design with oversized ClearView window',
      'Pro-FOCS flavor technology maximizes aroma density for both nic salts and freebase',
      'Dual-way airflow control (reversible pod orientation + precision side airflow slider)',
    ],
    tastingNotes: {
      inhale: 'Instant millisecond auto-draw activation with zero ramp-up delay',
      body: 'Warm, saturated vapor output up to 35W on the 0.4Ω FeCrAl meshed pod',
      finish: 'Crisp, clean flavor fidelity powered by Uwell Pro-FOCS airflow recycling',
      iceLevel: 'Hardware Kit — Customizable by E-Liquid',
      sweetnessLevel: 'Pro-FOCS High-Clarity Aroma Restoration',
    },
    boxContents: [
      '1× Uwell Caliburn G3 Pro Device in Space Grey (1000mAh)',
      '1× 0.4Ω Caliburn G3 Integrated Coil Cartridge (3ml Side-Fill)',
      '1× 0.9Ω Caliburn G3 Integrated Coil Cartridge (2.5ml Side-Fill)',
      '1× USB Type-C Charging Cable & Official User Manual',
    ],
  },
];

export const FEATURED_BRANDS = [
  { name: 'Elf Bar', origin: 'Global Flagship', count: '10K – 25K Series' },
  { name: 'Pod Salt', origin: 'United Kingdom', count: '35K & Reserve Salts' },
  { name: 'JUUL', origin: 'United States', count: 'Authentic JUUL2 Ecosystem' },
  { name: 'Vozol', origin: 'Smart Display Series', count: 'Star & Vista 20K' },
  { name: 'Vaporesso', origin: 'Precision Hardware', count: 'XROS 4 & Luxe Series' },
  { name: 'VGOD', origin: 'California USA', count: 'Cubano & Lush Ice Labs' },
  { name: 'Uwell', origin: 'Pro-FOCS Engineering', count: 'Caliburn G3 Series' },
  { name: 'Tugboat', origin: 'UAE Bestseller', count: 'Super 12K & Evo' },
];

export interface MegaMenuColumn {
  heading: string;
  links: {
    label: string;
    subtext: string;
    brand?: string;
    search?: string;
  }[];
}

export const MEGA_MENU_CONFIG: Record<
  ProductCategory,
  {
    tagline: string;
    description: string;
    columns: MegaMenuColumn[];
    spotlightProductId: string;
  }
> = {
  'Disposable Vape': {
    tagline: '10,000 to 35,000 Puff Digital Telemetry Series',
    description:
      'Rechargeable high-capacity disposables with OLED battery and e-liquid readouts.',
    columns: [
      {
        heading: 'By Puff Capacity',
        links: [
          { label: '35,000 Puffs Flagship', subtext: 'Pod Salt Dual-Boost Screen', search: '35K' },
          { label: '20,000 Puffs Mirror LED', subtext: 'Vozol Star 20K Series', search: '20000' },
          { label: '10,000 – 12,000 Puffs', subtext: 'Elf Bar & Tugboat Daily', search: '10000' },
        ],
      },
      {
        heading: 'Top Disposable Brands',
        links: [
          { label: 'Elf Bar Official UAE', subtext: 'Quaq Mesh 10K Series', brand: 'Elf Bar' },
          { label: 'Pod Salt UK 35K', subtext: 'British Nicotine Salt Hardware', brand: 'Pod Salt' },
          { label: 'Vozol Smart Display', subtext: 'S.i.L.C Tech 20K', brand: 'Vozol' },
          { label: 'Tugboat Super Series', subtext: 'Alphonso Mango & Ice', brand: 'Tugboat' },
        ],
      },
    ],
    spotlightProductId: 'pod-salt-35k-puffs',
  },
  'Pods System': {
    tagline: 'Closed Pod Kits & Pre-Filled Replacement Pods',
    description:
      'Leak-free magnetic pod ecosystems with verified ESMA excise stamps.',
    columns: [
      {
        heading: 'Pod Ecosystems',
        links: [
          { label: 'JUUL 2 Starter Kits', subtext: 'Slate Device + 2 Pods + Dock', brand: 'JUUL' },
          { label: 'Virginia & Crisp Menthol', subtext: '18mg/ml Authentic Pods', search: 'Virginia' },
        ],
      },
      {
        heading: 'Why Closed Pods',
        links: [
          { label: 'Zero Mess & Pocket Ready', subtext: 'Snap-in magnetic pods', brand: 'JUUL' },
          { label: 'Smart Pod-ID Chip', subtext: 'Anti-counterfeit verification', brand: 'JUUL' },
        ],
      },
    ],
    spotlightProductId: 'juul-2-starter-kit',
  },
  'E-Liquid': {
    tagline: 'UK & USA Nicotine Salts · 20mg to 50mg',
    description:
      'Crafted for refillable MTL pod systems with smooth throat hit and rich flavor.',
    columns: [
      {
        heading: 'Flavour Profiles',
        links: [
          { label: 'Cuban Cigar & Vanilla', subtext: 'Aged tobacco reserve blends', search: 'Cuban' },
          { label: 'Fruit & Menthol Ice', subtext: 'Chilled tropical & berry salts', search: 'Salt' },
        ],
      },
      {
        heading: 'Featured Salt Labs',
        links: [
          { label: 'Pod Salt Nexus & Reserve', subtext: 'Handcrafted UK 30ml', brand: 'Pod Salt' },
          { label: 'VGOD SaltNic Labs', subtext: 'California Cubano Black', brand: 'VGOD' },
        ],
      },
    ],
    spotlightProductId: 'vgod-cubano-black-saltnic',
  },
  'Vape Kit': {
    tagline: 'Refillable OLED Pod Mods & Sub-Ohm Hardware',
    description:
      'Precision aerospace aluminum kits with adjustable wattage and rapid USB-C charging.',
    columns: [
      {
        heading: 'Flagship Hardware Kits',
        links: [
          { label: 'Vaporesso XROS 4 Pro', subtext: '1200mAh COREX 2.0 Mesh', brand: 'Vaporesso' },
          { label: 'Uwell Caliburn G3 Pro', subtext: 'Full-Screen 35W UI Kit', brand: 'Uwell' },
        ],
      },
      {
        heading: 'Coil & Pod Specs',
        links: [
          { label: '0.4Ω RDL High Wattage', subtext: 'Dense warm vapor output', search: 'Pro' },
          { label: '0.8Ω / 0.9Ω Tight MTL', subtext: 'Optimized for nicotine salts', search: 'Kit' },
        ],
      },
    ],
    spotlightProductId: 'vaporesso-xros-4-pro-kit',
  },
  Brands: {
    tagline: '100% Authentic Global Vape Manufacturers',
    description:
      'Direct distributor partnerships with hologram verification on every box.',
    columns: [
      {
        heading: 'Disposable & Salt Leaders',
        links: [
          { label: 'Elf Bar', subtext: '10,000 Puffs OLED Series', brand: 'Elf Bar' },
          { label: 'Pod Salt UK', subtext: '35K Disposables & 30ml Salts', brand: 'Pod Salt' },
          { label: 'Vozol', subtext: 'Star 20000 Mirror Screen', brand: 'Vozol' },
          { label: 'VGOD USA', subtext: 'Cubano Black SaltNic Labs', brand: 'VGOD' },
        ],
      },
      {
        heading: 'Pod & Hardware Pioneers',
        links: [
          { label: 'JUUL Labs', subtext: 'Official JUUL2 UAE Kits', brand: 'JUUL' },
          { label: 'Vaporesso', subtext: 'XROS 4 Pro Titanium Series', brand: 'Vaporesso' },
          { label: 'Uwell', subtext: 'Caliburn G3 Full-Screen', brand: 'Uwell' },
          { label: 'Tugboat', subtext: 'Super 12,000 Puffs', brand: 'Tugboat' },
        ],
      },
    ],
    spotlightProductId: 'elf-bar-10000-puffs',
  },
  Offers: {
    tagline: 'Bundle Discounts & Flash Multi-Buy Deals',
    description:
      'Save up to 15% with 3-Pack and 5-Pack bundle tiers plus free UAE shipping over 350 AED.',
    columns: [
      {
        heading: 'Active Price Drops',
        links: [
          { label: 'Elf Bar 10K — AED 40', subtext: 'Reduced from AED 55.00', brand: 'Elf Bar' },
          { label: 'Pod Salt 35K — AED 65', subtext: 'Reduced from AED 80.00', brand: 'Pod Salt' },
          { label: 'XROS 4 Pro — AED 145', subtext: 'Reduced from AED 170.00', brand: 'Vaporesso' },
        ],
      },
      {
        heading: 'Multi-Buy Pack Tiers',
        links: [
          { label: '3-Pack Bundle (10% Off)', subtext: 'Available on every product page', search: '' },
          { label: '5-Pack Box (15% Off)', subtext: 'Unlock instant free UAE shipping', search: '' },
        ],
      },
    ],
    spotlightProductId: 'elf-bar-10000-puffs',
  },
};
