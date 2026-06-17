const LOCALIZED_FOODS = [
  {
    id: 'pizza-hut-pepperoni-pizza',
    name: 'Pizza Hut Pepperoni Pizza',
    brand: 'Pizza Hut',
    searchTerms: ['pizza hut', 'pepperoni pizza', 'pizza hut pepperoni', 'pizza pepperoni'],
    per100g: { calories: 290, protein: 12, carbs: 31, fat: 13 },
    defaultGrams: 86,
    servingOptions: [
      { id: 'slice', label: '1 Slice', grams: 86, calories: 250, protein: 10, carbs: 27, fat: 11 },
      { id: '100g', label: '100g', grams: 100, calories: 290, protein: 12, carbs: 31, fat: 13 },
    ],
  },
  {
    id: 'pizza-hut-margherita-pizza',
    name: 'Pizza Hut Margherita Pizza',
    brand: 'Pizza Hut',
    searchTerms: ['pizza hut', 'margherita pizza', 'pizza hut margherita', 'pizza cheese'],
    per100g: { calories: 245, protein: 10, carbs: 32, fat: 8 },
    defaultGrams: 92,
    servingOptions: [
      { id: 'slice', label: '1 Slice', grams: 92, calories: 225, protein: 9, carbs: 29, fat: 7 },
      { id: '100g', label: '100g', grams: 100, calories: 245, protein: 10, carbs: 32, fat: 8 },
    ],
  },
  {
    id: 'pizza-hut-suprema-pizza',
    name: 'Pizza Hut Suprema Pizza',
    brand: 'Pizza Hut',
    searchTerms: ['pizza hut suprema', 'suprema pizza', 'pizza suprema'],
    per100g: { calories: 275, protein: 12, carbs: 29, fat: 12 },
    defaultGrams: 95,
    servingOptions: [
      { id: 'slice', label: '1 Slice', grams: 95, calories: 261, protein: 11.4, carbs: 27.6, fat: 11.4 },
      { id: '100g', label: '100g', grams: 100, calories: 275, protein: 12, carbs: 29, fat: 12 },
    ],
  },
  {
    id: 'mcdonalds-big-mac-ro',
    name: "McDonald's Big Mac",
    brand: "McDonald's",
    searchTerms: ['mcdonalds', "mcdonald's", 'big mac', 'mc donalds'],
    per100g: { calories: 257, protein: 12, carbs: 20, fat: 14 },
    defaultGrams: 217,
    servingOptions: [
      { id: 'burger', label: '1 Burger', grams: 217, calories: 558, protein: 26, carbs: 43, fat: 30 },
      { id: '100g', label: '100g', grams: 100, calories: 257, protein: 12, carbs: 20, fat: 14 },
    ],
  },
  {
    id: 'mcdonalds-cheeseburger-ro',
    name: "McDonald's Cheeseburger",
    brand: "McDonald's",
    searchTerms: [
      'mcdonalds cheeseburger',
      "mcdonald's cheeseburger",
      'mc cheeseburger',
      'mc cheesburger',
      'cheeseburger',
      'cheese burger',
    ],
    per100g: { calories: 263, protein: 13, carbs: 31, fat: 10 },
    defaultGrams: 115,
    servingOptions: [
      { id: 'burger', label: '1 Cheeseburger', grams: 115, calories: 302, protein: 15, carbs: 36, fat: 12 },
      { id: '100g', label: '100g', grams: 100, calories: 263, protein: 13, carbs: 31, fat: 10 },
    ],
  },
  {
    id: 'mcdonalds-mcpuisor-ro',
    name: "McDonald's McPuișor",
    brand: "McDonald's",
    searchTerms: ['mcdonalds mcpuisor', 'mcpuisor', 'mc puisor', 'mc puișor', 'pui mcdonalds'],
    per100g: { calories: 245, protein: 12, carbs: 27, fat: 10 },
    defaultGrams: 145,
    servingOptions: [
      { id: 'sandwich', label: '1 McPuișor', grams: 145, calories: 355, protein: 17, carbs: 39, fat: 15 },
      { id: '100g', label: '100g', grams: 100, calories: 245, protein: 12, carbs: 27, fat: 10 },
    ],
  },
  {
    id: 'mcdonalds-hamburger-ro',
    name: "McDonald's Hamburger",
    brand: "McDonald's",
    searchTerms: ['mcdonalds hamburger', "mcdonald's hamburger", 'mc hamburger', 'hamburger'],
    per100g: { calories: 260, protein: 12, carbs: 32, fat: 9 },
    defaultGrams: 105,
    servingOptions: [
      { id: 'burger', label: '1 Hamburger', grams: 105, calories: 273, protein: 13, carbs: 34, fat: 9.5 },
      { id: '100g', label: '100g', grams: 100, calories: 260, protein: 12, carbs: 32, fat: 9 },
    ],
  },
  {
    id: 'kfc-crispy-strips-ro',
    name: 'KFC Crispy Strips',
    brand: 'KFC',
    searchTerms: ['kfc', 'crispy strips', 'strips kfc', 'pui kfc'],
    per100g: { calories: 270, protein: 19, carbs: 16, fat: 15 },
    defaultGrams: 40,
    servingOptions: [
      { id: 'piece', label: '1 Strip', grams: 40, calories: 108, protein: 7.6, carbs: 6.4, fat: 6 },
      { id: '5-piece', label: '5 Strips', grams: 200, calories: 540, protein: 38, carbs: 32, fat: 30 },
      { id: '100g', label: '100g', grams: 100, calories: 270, protein: 19, carbs: 16, fat: 15 },
    ],
  },
  {
    id: 'kfc-smart-box-ro',
    name: 'KFC Smart Box',
    brand: 'KFC',
    searchTerms: ['kfc smart box', 'smart box', 'smartbox kfc', 'kfc box'],
    per100g: { calories: 255, protein: 15, carbs: 22, fat: 12 },
    defaultGrams: 360,
    servingOptions: [
      { id: 'box', label: '1 Smart Box', grams: 360, calories: 918, protein: 54, carbs: 79, fat: 43 },
      { id: '100g', label: '100g', grams: 100, calories: 255, protein: 15, carbs: 22, fat: 12 },
    ],
  },
  {
    id: 'kfc-fillet-tower-ro',
    name: 'KFC Fillet Tower Burger',
    brand: 'KFC',
    searchTerms: ['kfc fillet tower', 'fillet tower', 'tower burger', 'burger kfc'],
    per100g: { calories: 260, protein: 14, carbs: 24, fat: 12 },
    defaultGrams: 260,
    servingOptions: [
      { id: 'burger', label: '1 Burger', grams: 260, calories: 676, protein: 36, carbs: 62, fat: 31 },
      { id: '100g', label: '100g', grams: 100, calories: 260, protein: 14, carbs: 24, fat: 12 },
    ],
  },
  {
    id: 'subway-turkey-sandwich-ro',
    name: 'Subway Turkey Sandwich 15cm',
    brand: 'Subway',
    searchTerms: ['subway', 'turkey subway', 'sandwich subway', 'sub curcan'],
    per100g: { calories: 160, protein: 11, carbs: 24, fat: 3 },
    defaultGrams: 220,
    servingOptions: [
      { id: 'sandwich', label: '15cm Sandwich', grams: 220, calories: 352, protein: 24, carbs: 53, fat: 7 },
      { id: '100g', label: '100g', grams: 100, calories: 160, protein: 11, carbs: 24, fat: 3 },
    ],
  },
  {
    id: 'spartan-chicken-gyros',
    name: 'Spartan Chicken Gyros',
    brand: 'Spartan',
    searchTerms: ['spartan', 'gyros spartan', 'pui spartan', 'shaorma spartan'],
    per100g: { calories: 215, protein: 12, carbs: 20, fat: 9 },
    defaultGrams: 420,
    servingOptions: [
      { id: 'wrap', label: '1 Gyros', grams: 420, calories: 903, protein: 50, carbs: 84, fat: 38 },
      { id: '100g', label: '100g', grams: 100, calories: 215, protein: 12, carbs: 20, fat: 9 },
    ],
  },
  {
    id: 'spartan-souvlaki-chicken',
    name: 'Spartan Chicken Souvlaki',
    brand: 'Spartan',
    searchTerms: ['spartan souvlaki', 'souvlaki spartan', 'souvlaki pui', 'spartan pui'],
    per100g: { calories: 205, protein: 14, carbs: 17, fat: 8 },
    defaultGrams: 390,
    servingOptions: [
      { id: 'serving', label: '1 Souvlaki', grams: 390, calories: 800, protein: 55, carbs: 66, fat: 31 },
      { id: '100g', label: '100g', grams: 100, calories: 205, protein: 14, carbs: 17, fat: 8 },
    ],
  },
  {
    id: 'mesopotamia-chicken-kebab',
    name: 'Mesopotamia Chicken Kebab',
    brand: 'Mesopotamia',
    searchTerms: ['mesopotamia', 'kebab mesopotamia', 'shaorma mesopotamia'],
    per100g: { calories: 220, protein: 13, carbs: 18, fat: 10 },
    defaultGrams: 430,
    servingOptions: [
      { id: 'wrap', label: '1 Kebab', grams: 430, calories: 946, protein: 56, carbs: 77, fat: 43 },
      { id: '100g', label: '100g', grams: 100, calories: 220, protein: 13, carbs: 18, fat: 10 },
    ],
  },
  {
    id: 'dristor-kebab-chicken-shaorma',
    name: 'Dristor Kebab Chicken Shaorma',
    brand: 'Dristor Kebab',
    searchTerms: ['dristor', 'dristor kebab', 'shaorma dristor', 'shawarma dristor'],
    per100g: { calories: 230, protein: 12, carbs: 21, fat: 11 },
    defaultGrams: 450,
    servingOptions: [
      { id: 'wrap', label: '1 Shaorma', grams: 450, calories: 1035, protein: 54, carbs: 95, fat: 50 },
      { id: '100g', label: '100g', grams: 100, calories: 230, protein: 12, carbs: 21, fat: 11 },
    ],
  },
  {
    id: 'fornetti-cheese-pastry',
    name: 'Fornetti Cheese Pastry',
    brand: 'Fornetti',
    searchTerms: ['fornetti', 'fornetti branza', 'pateu branza', 'cheese pastry'],
    per100g: { calories: 365, protein: 9, carbs: 38, fat: 20 },
    defaultGrams: 100,
    servingOptions: [
      { id: '100g', label: '100g', grams: 100, calories: 365, protein: 9, carbs: 38, fat: 20 },
      { id: 'piece', label: '1 Piece', grams: 35, calories: 128, protein: 3, carbs: 13, fat: 7 },
    ],
  },
  {
    id: 'springtime-chicken-shaorma',
    name: 'Springtime Chicken Shaorma',
    brand: 'Springtime',
    searchTerms: ['springtime', 'springtime shaorma', 'springtime pui', 'shaorma springtime'],
    per100g: { calories: 225, protein: 12, carbs: 20, fat: 11 },
    defaultGrams: 420,
    servingOptions: [
      { id: 'wrap', label: '1 Shaorma', grams: 420, calories: 945, protein: 50, carbs: 84, fat: 46 },
      { id: '100g', label: '100g', grams: 100, calories: 225, protein: 12, carbs: 20, fat: 11 },
    ],
  },
  {
    id: 'mega-image-365-greek-yogurt',
    name: 'Mega Image 365 Greek Yogurt',
    brand: 'Mega Image 365',
    searchTerms: ['mega image', '365', 'iaurt grecesc', 'greek yogurt'],
    per100g: { calories: 97, protein: 8.5, carbs: 4, fat: 5 },
    defaultGrams: 150,
    servingOptions: [
      { id: 'cup', label: '150g Cup', grams: 150, calories: 146, protein: 12.8, carbs: 6, fat: 7.5 },
      { id: '100g', label: '100g', grams: 100, calories: 97, protein: 8.5, carbs: 4, fat: 5 },
    ],
  },
  {
    id: 'gusturi-romanesti-salata-vinete',
    name: 'Gusturi Românești Salată de Vinete',
    brand: 'Mega Image',
    searchTerms: ['gusturi romanesti', 'gusturi românești', 'salata de vinete', 'salată de vinete', 'vinete'],
    per100g: { calories: 180, protein: 2, carbs: 7, fat: 16 },
    defaultGrams: 100,
    servingOptions: [
      { id: 'serving', label: '1 Serving', grams: 100, calories: 180, protein: 2, carbs: 7, fat: 16 },
      { id: 'tablespoon', label: '1 Tbsp', grams: 20, calories: 36, protein: 0.4, carbs: 1.4, fat: 3.2 },
    ],
  },
  {
    id: 'kaufland-k-classic-mozzarella',
    name: 'K-Classic Mozzarella',
    brand: 'Kaufland K-Classic',
    searchTerms: ['kaufland', 'k classic', 'k-classic', 'mozzarella'],
    per100g: { calories: 248, protein: 18, carbs: 2, fat: 19 },
    defaultGrams: 125,
    servingOptions: [
      { id: 'ball', label: '125g Pack', grams: 125, calories: 310, protein: 22.5, carbs: 2.5, fat: 23.8 },
      { id: '100g', label: '100g', grams: 100, calories: 248, protein: 18, carbs: 2, fat: 19 },
    ],
  },
  {
    id: 'lidl-pilos-cottage-cheese',
    name: 'Pilos Cottage Cheese',
    brand: 'Lidl Pilos',
    searchTerms: ['lidl', 'pilos', 'cottage cheese', 'branza cottage', 'brânză cottage'],
    per100g: { calories: 98, protein: 12, carbs: 3, fat: 4 },
    defaultGrams: 200,
    servingOptions: [
      { id: 'cup', label: '200g Cup', grams: 200, calories: 196, protein: 24, carbs: 6, fat: 8 },
      { id: '100g', label: '100g', grams: 100, calories: 98, protein: 12, carbs: 3, fat: 4 },
    ],
  },
  {
    id: 'lidl-camara-noastra-sarmale',
    name: 'Cămara Noastră Sarmale',
    brand: 'Lidl Cămara Noastră',
    searchTerms: ['camara noastra', 'cămara noastră', 'lidl sarmale', 'sarmale'],
    per100g: { calories: 180, protein: 8, carbs: 12, fat: 11 },
    defaultGrams: 250,
    servingOptions: [
      { id: 'serving', label: '1 Serving', grams: 250, calories: 450, protein: 20, carbs: 30, fat: 27.5 },
      { id: '100g', label: '100g', grams: 100, calories: 180, protein: 8, carbs: 12, fat: 11 },
    ],
  },
  {
    id: 'profi-proxi-sunca-pui',
    name: 'Profi Chicken Ham',
    brand: 'Profi',
    searchTerms: ['profi', 'sunca pui profi', 'șuncă pui profi', 'chicken ham profi'],
    per100g: { calories: 115, protein: 18, carbs: 2, fat: 4 },
    defaultGrams: 50,
    servingOptions: [
      { id: 'serving', label: '50g Serving', grams: 50, calories: 58, protein: 9, carbs: 1, fat: 2 },
      { id: '100g', label: '100g', grams: 100, calories: 115, protein: 18, carbs: 2, fat: 4 },
    ],
  },
  {
    id: 'carrefour-classic-skyr',
    name: 'Carrefour Skyr Natural',
    brand: 'Carrefour',
    searchTerms: ['carrefour skyr', 'skyr carrefour', 'iaurt proteic carrefour'],
    per100g: { calories: 62, protein: 11, carbs: 4, fat: 0.2 },
    defaultGrams: 150,
    servingOptions: [
      { id: 'cup', label: '150g Cup', grams: 150, calories: 93, protein: 16.5, carbs: 6, fat: 0.3 },
      { id: '100g', label: '100g', grams: 100, calories: 62, protein: 11, carbs: 4, fat: 0.2 },
    ],
  },
  {
    id: 'auchan-ton-in-suc-propriu',
    name: 'Auchan Tuna in Brine',
    brand: 'Auchan',
    searchTerms: ['auchan ton', 'ton auchan', 'tuna auchan', 'ton in suc propriu'],
    per100g: { calories: 110, protein: 25, carbs: 0, fat: 1 },
    defaultGrams: 112,
    servingOptions: [
      { id: 'can', label: '1 Can Drained', grams: 112, calories: 123, protein: 28, carbs: 0, fat: 1.1 },
      { id: '100g', label: '100g', grams: 100, calories: 110, protein: 25, carbs: 0, fat: 1 },
    ],
  },
  {
    id: 'pufuleti-gusto',
    name: 'Pufuleți Gusto',
    brand: 'Gusto',
    searchTerms: ['pufuleti', 'pufuleți', 'gusto', 'pufuleti gusto'],
    per100g: { calories: 480, protein: 7, carbs: 68, fat: 20 },
    defaultGrams: 85,
    servingOptions: [
      { id: 'bag', label: '85g Bag', grams: 85, calories: 408, protein: 6, carbs: 58, fat: 17 },
      { id: '100g', label: '100g', grams: 100, calories: 480, protein: 7, carbs: 68, fat: 20 },
    ],
  },
  {
    id: 'ciocolata-rom',
    name: 'Ciocolată ROM',
    brand: 'ROM',
    searchTerms: ['ciocolata rom', 'ciocolată rom', 'rom chocolate', 'rom baton'],
    per100g: { calories: 455, protein: 4, carbs: 72, fat: 17 },
    defaultGrams: 30,
    servingOptions: [
      { id: 'bar', label: '1 Bar', grams: 30, calories: 137, protein: 1.2, carbs: 21.6, fat: 5.1 },
      { id: '100g', label: '100g', grams: 100, calories: 455, protein: 4, carbs: 72, fat: 17 },
    ],
  },
  {
    id: 'eugenia-biscuit',
    name: 'Eugenia Biscuit',
    brand: 'Eugenia',
    searchTerms: ['eugenia', 'biscuit eugenia', 'biscuiti eugenia', 'biscuiți eugenia'],
    per100g: { calories: 455, protein: 6, carbs: 67, fat: 18 },
    defaultGrams: 36,
    servingOptions: [
      { id: 'pack', label: '1 Pack', grams: 36, calories: 164, protein: 2.2, carbs: 24, fat: 6.5 },
      { id: '100g', label: '100g', grams: 100, calories: 455, protein: 6, carbs: 67, fat: 18 },
    ],
  },
  {
    id: 'covrigi-brasoveni',
    name: 'Covrigi Brașoveni',
    brand: 'Romanian Bakery',
    searchTerms: ['covrigi', 'covrigi brasoveni', 'covrigi brașoveni', 'pretzel romanian'],
    per100g: { calories: 310, protein: 9, carbs: 62, fat: 3 },
    defaultGrams: 80,
    servingOptions: [
      { id: 'piece', label: '1 Covrig', grams: 80, calories: 248, protein: 7.2, carbs: 49.6, fat: 2.4 },
      { id: '100g', label: '100g', grams: 100, calories: 310, protein: 9, carbs: 62, fat: 3 },
    ],
  },
  {
    id: 'boromir-croissant',
    name: 'Boromir Croissant',
    brand: 'Boromir',
    searchTerms: ['boromir', 'croissant boromir', 'croissante boromir'],
    per100g: { calories: 430, protein: 7, carbs: 48, fat: 23 },
    defaultGrams: 60,
    servingOptions: [
      { id: 'piece', label: '1 Croissant', grams: 60, calories: 258, protein: 4.2, carbs: 28.8, fat: 13.8 },
      { id: '100g', label: '100g', grams: 100, calories: 430, protein: 7, carbs: 48, fat: 23 },
    ],
  },
  {
    id: 'mici-mititei',
    name: 'Mici / Mititei',
    brand: 'Romanian Food',
    searchTerms: ['mici', 'mititei', 'gratar mici', 'mititei romanesti'],
    per100g: { calories: 290, protein: 15, carbs: 2, fat: 25 },
    defaultGrams: 50,
    servingOptions: [
      { id: 'piece', label: '1 Mic', grams: 50, calories: 145, protein: 7.5, carbs: 1, fat: 12.5 },
      { id: '100g', label: '100g', grams: 100, calories: 290, protein: 15, carbs: 2, fat: 25 },
    ],
  },
  {
    id: 'mamaliga',
    name: 'Mămăligă',
    brand: 'Romanian Food',
    searchTerms: ['mamaliga', 'mămăligă', 'polenta'],
    per100g: { calories: 85, protein: 2, carbs: 18, fat: 1 },
    defaultGrams: 200,
    servingOptions: [
      { id: 'serving', label: '1 Serving', grams: 200, calories: 170, protein: 4, carbs: 36, fat: 2 },
      { id: '100g', label: '100g', grams: 100, calories: 85, protein: 2, carbs: 18, fat: 1 },
    ],
  },
  {
    id: 'ciorba-radauteana',
    name: 'Ciorbă Rădăuțeană',
    brand: 'Romanian Food',
    searchTerms: ['ciorba radauteana', 'ciorbă rădăuțeană', 'radauteana', 'rădăuțeană'],
    per100g: { calories: 70, protein: 5, carbs: 4, fat: 4 },
    defaultGrams: 350,
    servingOptions: [
      { id: 'bowl', label: '1 Bowl', grams: 350, calories: 245, protein: 17.5, carbs: 14, fat: 14 },
      { id: '100g', label: '100g', grams: 100, calories: 70, protein: 5, carbs: 4, fat: 4 },
    ],
  },
  {
    id: 'ciorba-de-burta',
    name: 'Ciorbă de Burtă',
    brand: 'Romanian Food',
    searchTerms: ['ciorba de burta', 'ciorbă de burtă', 'burta', 'burtă'],
    per100g: { calories: 95, protein: 6, carbs: 3, fat: 7 },
    defaultGrams: 350,
    servingOptions: [
      { id: 'bowl', label: '1 Bowl', grams: 350, calories: 333, protein: 21, carbs: 10.5, fat: 24.5 },
      { id: '100g', label: '100g', grams: 100, calories: 95, protein: 6, carbs: 3, fat: 7 },
    ],
  },
];

function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bcheesburger\b/g, 'cheeseburger')
    .replace(/\bmcpuisor\b/g, 'mc puisor')
    .replace(/[^a-z0-9\s'-]/gi, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const BRAND_TOKENS = new Set([
  'mc',
  'mcdonalds',
  "mcdonald's",
  'kfc',
  'pizza',
  'hut',
  'subway',
  'spartan',
  'mesopotamia',
  'dristor',
  'kebab',
  'fornetti',
  'springtime',
  'lidl',
  'mega',
  'image',
  'kaufland',
  'carrefour',
  'profi',
  'auchan',
]);

function foodHaystack(food) {
  return normalize([
    food.name,
    food.brand,
    ...(food.searchTerms || []),
  ].join(' '));
}

function scoreFood(food, query) {
  const q = normalize(query);
  if (q.length < 2) return 0;
  const tokens = q.split(' ').filter(Boolean);
  const haystack = foodHaystack(food);

  let score = 0;
  if (normalize(food.name) === q) score += 140;
  if ((food.searchTerms || []).some((term) => normalize(term) === q)) score += 130;
  if (normalize(food.brand) === q) score += 100;
  if (haystack.includes(q)) score += 80;
  for (const token of tokens) {
    if (!haystack.includes(token)) continue;
    score += BRAND_TOKENS.has(token) ? 12 : 45;
  }
  if (tokens.length > 1 && tokens.every((token) => haystack.includes(token))) score += 80;
  const specificTokens = tokens.filter((token) => !BRAND_TOKENS.has(token));
  if (specificTokens.length > 0 && specificTokens.every((token) => haystack.includes(token))) score += 120;
  return score;
}

function normalizeFood(food, score) {
  const serving = food.servingOptions?.[0];
  return {
    ...food,
    id: `localized-${food.id}`,
    displayName: food.brand && !food.name.includes(food.brand) ? `${food.name} (${food.brand})` : food.name,
    source: 'localized-nutrition',
    nutritionSource: 'localized-nutrition',
    confidence: score >= 150 ? 0.88 : 0.78,
    searchKind: 'localized',
    calories: serving?.calories ?? Math.round((food.per100g.calories || 0) * (food.defaultGrams || 100) / 100),
    protein: serving?.protein ?? Math.round((food.per100g.protein || 0) * (food.defaultGrams || 100) / 100 * 10) / 10,
    carbs: serving?.carbs ?? Math.round((food.per100g.carbs || 0) * (food.defaultGrams || 100) / 100 * 10) / 10,
    fat: serving?.fat ?? Math.round((food.per100g.fat || 0) * (food.defaultGrams || 100) / 100 * 10) / 10,
  };
}

export function searchLocalizedFoods(query, { limit = 12 } = {}) {
  const q = normalize(query);
  const tokens = q.split(' ').filter(Boolean);
  const specificTokens = tokens.filter((token) => !BRAND_TOKENS.has(token));
  const scored = LOCALIZED_FOODS
    .map((food) => ({ food, score: scoreFood(food, query) }))
    .filter((match) => match.score > 0);
  const strict = specificTokens.length > 0
    ? scored.filter(({ food }) => specificTokens.every((token) => foodHaystack(food).includes(token)))
    : scored;

  return (strict.length > 0 ? strict : scored)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ food, score }) => normalizeFood(food, score));
}

export function hasStrongLocalizedMatch(query) {
  return LOCALIZED_FOODS.some((food) => scoreFood(food, query) >= 150);
}
