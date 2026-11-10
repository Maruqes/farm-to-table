import {
  MOCK_PRODUCTS,
  type MockProductRecord,
} from '../../home-catalog/mocks/products'
import type { ProductDetailDto, ReviewDto } from '../product-detail.dto'

// Deterministic id that always fails in mock mode, for exercising the retry state.
export const MOCK_ERROR_PRODUCT_ID = 'prod-error'

const DESCRIPTIONS: Record<string, string> = {
  'prod-heirloom-tomatoes':
    'Grown outdoors in the Douro valley and picked the morning they are sent. The tomatoes are sweet, meaty and uneven in the best way — some are better for salads, others for slow sauces. Keep them on the counter, never in the fridge.',
  'prod-kiwi':
    'Soft, honeyed kiwis from the Minho, harvested when the sugar is just right. Peel and eat fresh, or spoon them over yoghurt and porridge.',
  'prod-kale':
    'Dark, sturdy Lacinato kale, the kind that holds up to a hard sear and a sharp dressing. Strip the stems for salads or roast the leaves until they crackle.',
  'prod-heather-honey':
    'Raw heather honey from hives kept high on the Serra da Estrela. It is thick, amber and faintly smoky, with the herbal edge that only late-season mountain flowers give.',
  'prod-chestnut-honey':
    'Autumn honey from chestnut groves, dark and malty with a long finish. Good on strong cheese, in marinades, or straight from the spoon.',
  'prod-vinho-verde':
    'A young Loureiro from the Lima valley: bright, lightly spritzy and low in alcohol. Serve well chilled with grilled fish or anything from the garden.',
  'prod-serra-cheese':
    'A small wheel of Serra da Estrela, made with raw sheep milk and thistle rennet. Creamy when young, sharper as it ages. Eat it with bread and a spoon.',
  'prod-sourdough':
    'A country loaf built on a slow sourdough starter, with a dark crust and an open, chewy crumb. Baked the same day it is sent.',
  'prod-rye-bread':
    'A dense rye loaf with toasted seeds and a gentle tang. Sliced thin it keeps for days; this week’s bake is already spoken for.',
  'prod-winter-oranges':
    'Thick-skinned oranges from the Algarve, sweet with a clean acidity. The peel is excellent candied or dried for tea.',
  'prod-pumpkin':
    'A sweet autumn pumpkin, good for roasting in wedges, puréeing into soup, or folding into a pie.',
  'prod-walnuts':
    'Fresh walnuts from old trees on the Douro slopes. Crack them into salads, toast them for pasta, or keep them for the cheese board.',
}

const REVIEWS: Record<string, ReviewDto[]> = {
  'prod-heirloom-tomatoes': [
    {
      author: 'Marta C.',
      rating: 5,
      text: 'The best tomatoes I have had outside my grandmother’s garden. They arrived ripe but firm and lasted nearly a week.',
      date: '2026-07-18',
    },
    {
      author: 'Tomás R.',
      rating: 4,
      text: 'Wonderful flavour and colour. A couple were a little soft on arrival, but the rest were perfect.',
      date: '2026-07-11',
    },
    {
      author: 'Inês F.',
      rating: 5,
      text: 'Bought these for a dinner party and everyone asked where they came from. Will buy again.',
      date: '2026-06-30',
    },
  ],
  'prod-kiwi': [
    {
      author: 'Rui P.',
      rating: 5,
      text: 'So much sweeter than supermarket kiwis. The box was gone in days.',
      date: '2026-08-02',
    },
    {
      author: 'Helena M.',
      rating: 4,
      text: 'Good value and very fresh. A few needed another day on the counter to soften.',
      date: '2026-07-21',
    },
  ],
  'prod-heather-honey': [
    {
      author: 'João A.',
      rating: 5,
      text: 'Thick, dark and full of flavour. A spoonful is enough — it is worth the price.',
      date: '2026-05-14',
    },
  ],
  'prod-serra-cheese': [
    {
      author: 'Sofia L.',
      rating: 5,
      text: 'Creamy, tangy and beautifully wrapped. We ate it with sourdough and a little honey.',
      date: '2026-04-27',
    },
    {
      author: 'Pedro S.',
      rating: 4,
      text: 'Excellent cheese, though it arrived a day later than promised. Still worth it.',
      date: '2026-04-19',
    },
  ],
  'prod-winter-oranges': [],
}

function descriptionFor(record: MockProductRecord): string {
  const own = DESCRIPTIONS[record.id]
  if (own) return own
  const origin = record.producer.location
    ? ` from ${record.producer.name} in ${record.producer.location}`
    : ` from ${record.producer.name}`
  return `Fresh ${record.name.toLowerCase()}${origin}, sold by the ${record.unit}.`
}

export function createMockProductDetail(id: string): ProductDetailDto | null {
  const record = MOCK_PRODUCTS.find((product) => product.id === id)
  if (!record) return null

  return {
    id: record.id,
    name: record.name,
    price: record.price,
    unit: record.unit,
    stock: record.stock,
    category: record.category,
    producer: record.producer,
    averageRating: record.averageRating,
    description: descriptionFor(record),
    reviews: REVIEWS[record.id] ?? [],
    ...(record.imageUrl ? { imageUrl: record.imageUrl } : {}),
  }
}
