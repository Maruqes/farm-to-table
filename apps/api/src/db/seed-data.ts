// Demo data for BE-23. Realistic names match the web fixtures in
// apps/web/src/features/**/mocks/*. Display fields only; ids and prices
// come from the database at seed time.

export interface SeedProducer {
  email: string
  name: string
  farmName: string
  status: 'approved' | 'pending'
  bio: string
  location: string
  lat?: number
  lng?: number
}

export interface SeedProduct {
  producerEmail: string
  name: string
  description: string
  ingredients: string
  category: 'vegetables' | 'fruit' | 'honey' | 'wine' | 'cheese' | 'bakery'
  price: number
  unit: 'kg' | 'bunch' | 'jar' | 'bottle' | 'wheel' | 'loaf'
  stock: number
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all-year'
  organic: boolean
}

export const SEED_PRODUCERS: SeedProducer[] = [
  {
    email: 'approved-producer@farmtotable.test',
    name: 'Joao Pereira',
    farmName: 'Quinta do Vale',
    status: 'approved',
    bio: 'A family farm on the terraces above the Douro, growing tomatoes, greens and walnuts. Everything is picked by hand and sold within a day of leaving the field.',
    location: 'Douro, Portugal',
    lat: 41.1632,
    lng: -7.5435,
  },
  {
    email: 'laranjeiras@farmtotable.test',
    name: 'Mariana Sousa',
    farmName: 'Quinta das Laranjeiras',
    status: 'approved',
    bio: 'An orange grove in the Algarve hills, watered by the winter rain and picked to order. The fruit stays on the tree until the sugar is right.',
    location: 'Silves, Algarve',
    lat: 37.1918,
    lng: -8.4386,
  },
  {
    email: 'apiario-serra@farmtotable.test',
    name: 'Manuel Ribeiro',
    farmName: 'Apiário da Serra',
    status: 'approved',
    bio: 'Beekeepers working the heather and chestnut groves high on the Serra da Estrela. The hives stay in the mountains all year.',
    location: 'Manteigas, Serra da Estrela',
    lat: 40.3728,
    lng: -7.5398,
  },
  {
    email: 'adega-lima@farmtotable.test',
    name: 'Carlos Lima',
    farmName: 'Adega do Lima',
    status: 'approved',
    bio: 'A tiny adega making Vinho Verde from old Loureiro vines. Fermented slowly and bottled young, bright acidity with a light sparkle.',
    location: 'Ponte de Lima, Minho',
  },
  {
    email: 'queijaria-beira@farmtotable.test',
    name: 'Isabel Fonseca',
    farmName: 'Queijaria da Beira',
    status: 'approved',
    bio: 'Hand-made Serra da Estrela cheese from raw sheep milk and thistle rennet. Each small wheel is turned and washed by hand while it matures.',
    location: 'Seia, Serra da Estrela',
    lat: 40.4224,
    lng: -7.7076,
  },
  {
    email: 'pao-aldeia@farmtotable.test',
    name: 'Rosa Martins',
    farmName: 'Pão da Aldeia',
    status: 'approved',
    bio: 'A village bakery firing a wood oven every morning. The loaves are built on a slow sourdough starter and baked the day they are sent.',
    location: 'Évora, Alentejo',
    lat: 38.5714,
    lng: -7.913,
  },
  {
    email: 'pending-producer@farmtotable.test',
    name: 'Ana Costa',
    farmName: 'Horta da Ribeira',
    status: 'pending',
    bio: 'A small market garden in the Lima valley, worked without synthetic pesticides. Greens and fruit for the weekly market.',
    location: 'Torres Vedras',
  },
]

export const SEED_BUYERS = [
  { email: 'buyer@farmtotable.test', name: 'Maria Silva', address: 'Rua das Flores 12, Lisboa' },
  { email: 'buyer2@farmtotable.test', name: 'Rui Santos', address: 'Avenida da Liberdade 45, Braga' },
]

export const SEED_PRODUCTS: SeedProduct[] = [
  // Quinta do Vale — vegetables and fruit
  { producerEmail: 'approved-producer@farmtotable.test', name: 'Heirloom tomatoes', description: 'Sun-ripened heirloom tomatoes, picked the same morning they are sent.', ingredients: 'tomato, basil', category: 'vegetables', price: 3.2, unit: 'kg', stock: 40, season: 'summer', organic: true },
  { producerEmail: 'approved-producer@farmtotable.test', name: 'Curly kale', description: 'Dark curly kale, sweetened by the cold nights in the valley.', ingredients: 'kale', category: 'vegetables', price: 2.1, unit: 'bunch', stock: 25, season: 'winter', organic: false },
  { producerEmail: 'approved-producer@farmtotable.test', name: 'Courgette', description: 'Young courgettes with thin skin, best grilled or in soups.', ingredients: 'courgette', category: 'vegetables', price: 2.2, unit: 'kg', stock: 30, season: 'summer', organic: true },
  { producerEmail: 'approved-producer@farmtotable.test', name: 'Spring greens', description: 'A mixed bunch of whatever is tender in the plot this week.', ingredients: 'mixed greens', category: 'vegetables', price: 1.8, unit: 'bunch', stock: 22, season: 'spring', organic: false },
  { producerEmail: 'approved-producer@farmtotable.test', name: 'Walnuts', description: 'Dried walnuts from the old trees along the terrace walls.', ingredients: 'walnut', category: 'fruit', price: 9.0, unit: 'kg', stock: 10, season: 'autumn', organic: false },
  // Quinta das Laranjeiras — fruit
  { producerEmail: 'laranjeiras@farmtotable.test', name: 'Winter oranges', description: 'Sweet winter oranges, heavy with juice.', ingredients: 'orange', category: 'fruit', price: 2.8, unit: 'kg', stock: 50, season: 'winter', organic: false },
  { producerEmail: 'laranjeiras@farmtotable.test', name: 'Kiwi', description: 'Fragrant kiwis, picked ripe and ready to eat.', ingredients: 'kiwi', category: 'fruit', price: 2.4, unit: 'kg', stock: 60, season: 'autumn', organic: true },
  { producerEmail: 'laranjeiras@farmtotable.test', name: 'Lemons', description: 'Unwaxed lemons, juice and zest safe for cooking.', ingredients: 'lemon', category: 'fruit', price: 2.1, unit: 'kg', stock: 35, season: 'winter', organic: false },
  { producerEmail: 'laranjeiras@farmtotable.test', name: 'Figs', description: 'Black figs, fragile and honeyed, only while the season lasts.', ingredients: 'fig', category: 'fruit', price: 4.5, unit: 'kg', stock: 15, season: 'summer', organic: true },
  { producerEmail: 'laranjeiras@farmtotable.test', name: 'Pomegranates', description: 'Split-open pomegranates with deep red arils.', ingredients: 'pomegranate', category: 'fruit', price: 3.9, unit: 'kg', stock: 20, season: 'autumn', organic: false },
  // Apiário da Serra — honey
  { producerEmail: 'apiario-serra@farmtotable.test', name: 'Heather honey', description: 'Dark heather honey with a long, slightly bitter finish.', ingredients: 'heather honey', category: 'honey', price: 8.5, unit: 'jar', stock: 18, season: 'all-year', organic: true },
  { producerEmail: 'apiario-serra@farmtotable.test', name: 'Chestnut honey', description: 'Amber chestnut honey, bold and woody.', ingredients: 'chestnut honey', category: 'honey', price: 7.8, unit: 'jar', stock: 12, season: 'autumn', organic: false },
  { producerEmail: 'apiario-serra@farmtotable.test', name: 'Wildflower honey', description: 'Light spring honey from mountain meadows.', ingredients: 'wildflower honey', category: 'honey', price: 6.9, unit: 'jar', stock: 20, season: 'spring', organic: false },
  { producerEmail: 'apiario-serra@farmtotable.test', name: 'Honeycomb', description: 'A cut of raw comb, still capped, to spread or chew.', ingredients: 'honeycomb', category: 'honey', price: 9.9, unit: 'jar', stock: 8, season: 'summer', organic: true },
  { producerEmail: 'apiario-serra@farmtotable.test', name: 'Eucalyptus honey', description: 'Pale eucalyptus honey, mild and good for winter teas.', ingredients: 'eucalyptus honey', category: 'honey', price: 7.2, unit: 'jar', stock: 14, season: 'winter', organic: false },
  // Adega do Lima — wine
  { producerEmail: 'adega-lima@farmtotable.test', name: 'Vinho Verde', description: 'Young Vinho Verde, crisp with a light sparkle.', ingredients: 'loureiro grape', category: 'wine', price: 6.9, unit: 'bottle', stock: 30, season: 'autumn', organic: false },
  { producerEmail: 'adega-lima@farmtotable.test', name: 'Vinho Verde Reserva', description: 'Aged on lees for a year, rounder and more serious.', ingredients: 'loureiro, arinto grape', category: 'wine', price: 11.5, unit: 'bottle', stock: 12, season: 'all-year', organic: false },
  { producerEmail: 'adega-lima@farmtotable.test', name: 'Young red wine', description: 'Fruity young red, made to drink slightly cool.', ingredients: 'vinhao grape', category: 'wine', price: 7.5, unit: 'bottle', stock: 24, season: 'autumn', organic: false },
  { producerEmail: 'adega-lima@farmtotable.test', name: 'Loureiro white', description: 'Single-variety Loureiro, floral and mineral.', ingredients: 'loureiro grape', category: 'wine', price: 8.2, unit: 'bottle', stock: 16, season: 'summer', organic: true },
  { producerEmail: 'adega-lima@farmtotable.test', name: 'Rose wine', description: 'Pale rose for warm evenings, strawberry and citrus.', ingredients: 'espadeiro grape', category: 'wine', price: 7.9, unit: 'bottle', stock: 18, season: 'summer', organic: false },
  // Queijaria da Beira — cheese
  { producerEmail: 'queijaria-beira@farmtotable.test', name: 'Serra da Estrela cheese', description: 'The classic raw-milk wheel, buttery and spoonable when ripe.', ingredients: 'sheep milk, salt, thistle rennet', category: 'cheese', price: 14.5, unit: 'wheel', stock: 8, season: 'all-year', organic: true },
  { producerEmail: 'queijaria-beira@farmtotable.test', name: 'Cured cheese', description: 'Firm cured wheel, aged six months in the cellar.', ingredients: 'sheep milk, salt', category: 'cheese', price: 12.0, unit: 'wheel', stock: 10, season: 'all-year', organic: false },
  { producerEmail: 'queijaria-beira@farmtotable.test', name: 'Fresh cheese', description: 'Soft fresh cheese, best eaten within days.', ingredients: 'goat milk, salt', category: 'cheese', price: 5.5, unit: 'wheel', stock: 15, season: 'spring', organic: false },
  { producerEmail: 'queijaria-beira@farmtotable.test', name: 'Aged reserve cheese', description: 'Twelve months in the cellar, crystalline and intense.', ingredients: 'sheep milk, salt', category: 'cheese', price: 16.0, unit: 'wheel', stock: 2, season: 'winter', organic: false },
  { producerEmail: 'queijaria-beira@farmtotable.test', name: 'Smoked cheese', description: 'Lightly smoked over oak, a winter table cheese.', ingredients: 'sheep milk, salt, smoke', category: 'cheese', price: 11.0, unit: 'wheel', stock: 6, season: 'autumn', organic: false },
  // Pão da Aldeia — bakery
  { producerEmail: 'pao-aldeia@farmtotable.test', name: 'Sourdough loaf', description: 'Slow-fermented sourdough from the wood oven.', ingredients: 'wheat flour, water, salt, sourdough', category: 'bakery', price: 3.6, unit: 'loaf', stock: 15, season: 'all-year', organic: false },
  { producerEmail: 'pao-aldeia@farmtotable.test', name: 'Rye bread', description: 'Dense rye that keeps for days.', ingredients: 'rye flour, water, salt, sourdough', category: 'bakery', price: 4.1, unit: 'loaf', stock: 12, season: 'all-year', organic: false },
  { producerEmail: 'pao-aldeia@farmtotable.test', name: 'Corn bread', description: 'Golden corn bread, crumbly and sweet.', ingredients: 'corn flour, wheat flour, water, salt', category: 'bakery', price: 3.2, unit: 'loaf', stock: 20, season: 'all-year', organic: true },
  { producerEmail: 'pao-aldeia@farmtotable.test', name: 'Olive bread', description: 'Studded with black olives and olive oil.', ingredients: 'wheat flour, olives, olive oil, salt', category: 'bakery', price: 4.5, unit: 'loaf', stock: 9, season: 'all-year', organic: false },
  { producerEmail: 'pao-aldeia@farmtotable.test', name: 'Honey cake', description: 'Spiced honey cake with walnuts, a winter treat.', ingredients: 'honey, walnuts, cinnamon, flour', category: 'bakery', price: 5.0, unit: 'loaf', stock: 7, season: 'winter', organic: false },
]
