import type { PendingProducerDto } from '../admin-producers.dto'

// The mock store lives for the session and reseeds on reload, so the page can be
// exercised again without clearing browser storage.
const pendingProducers: PendingProducerDto[] = [
  {
    id: 'producer-quinta-da-ribeira',
    name: 'Quinta da Ribeira',
    email: 'geral@quintadaribeira.pt',
    phone: '+351 912 345 678',
    location: 'Ponte de Lima, Minho',
    bio: 'A family market garden on the Lima valley floor, growing greens, tomatoes and soft fruit without synthetic pesticides. Produce is picked the morning it is sent.',
    categories: ['Vegetables', 'Fruit'],
    appliedAt: '2026-11-08T09:20:00.000Z',
    status: 'pending',
  },
  {
    id: 'producer-apiario-da-estrela',
    name: 'Apiário da Estrela',
    email: 'mel@apiariodaestrela.pt',
    phone: '+351 926 018 442',
    location: 'Manteigas, Serra da Estrela',
    bio: 'Beekeepers working heather and chestnut groves above the Zêzere valley. The hives stay in the mountains all year, which gives the honey its dark colour and long finish.',
    categories: ['Honey'],
    appliedAt: '2026-11-06T15:45:00.000Z',
    status: 'pending',
  },
  {
    id: 'producer-queijaria-do-castelo',
    name: 'Queijaria do Castelo',
    email: 'encomendas@queijariadocastelo.pt',
    phone: '+351 913 774 206',
    location: 'Seia, Serra da Estrela',
    bio: 'Small-batch Serra da Estrela cheese made from raw sheep milk and thistle rennet. Each wheel is turned and washed by hand while it matures.',
    categories: ['Cheese'],
    appliedAt: '2026-11-04T11:10:00.000Z',
    status: 'pending',
  },
  {
    id: 'producer-pastelaria-do-alem',
    name: 'Pastelaria do Além',
    email: 'ola@pastelariadoalem.pt',
    phone: '+351 967 530 118',
    location: 'Évora, Alentejo',
    bio: 'A village bakery firing a wood oven every morning. Sourdough loaves, corn bread and seasonal pastries are baked the same day they are delivered.',
    categories: ['Bakery'],
    appliedAt: '2026-11-02T07:55:00.000Z',
    status: 'pending',
  },
  {
    id: 'producer-adega-do-douro',
    name: 'Adega do Douro',
    email: 'vinhos@adegadodouro.pt',
    phone: '+351 254 882 190',
    location: 'Pinhão, Douro',
    bio: 'A small adega making red and white wines from old vines on the Douro terraces. Fermentation is slow and the bottles are filled young to keep the fruit bright.',
    categories: ['Wine'],
    appliedAt: '2026-10-30T16:05:00.000Z',
    status: 'pending',
  },
]

export function listMockPendingProducers(): PendingProducerDto[] {
  return structuredClone(pendingProducers)
}

export function removeMockPendingProducer(id: string): boolean {
  const index = pendingProducers.findIndex(
    (producer) => producer.id === id || producer._id === id,
  )
  if (index < 0) return false

  pendingProducers.splice(index, 1)
  return true
}
