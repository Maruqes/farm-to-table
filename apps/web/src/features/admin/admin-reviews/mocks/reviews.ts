import type { AdminReviewDto } from '../admin-reviews.dto'

// Reported review fixtures for FE-20. Deterministic ids keep screenshots and tests stable.
export function createMockReportedReviews(): AdminReviewDto[] {
  return [
    {
      id: 'review-2041',
      author: 'Beatriz Lopes',
      rating: 2,
      text: 'The cheese was past its best when I collected it. I expected better for the price and the rind had started to dry out.',
      product: 'Serra da Estrela cheese',
      producer: 'Queijaria do Castelo',
      createdAt: '2026-11-09T10:15:00.000Z',
      report: {
        reason: 'offensive',
        note: 'The producer says the review accuses the farm of selling old stock without evidence.',
        reportedAt: '2026-11-09T18:40:00.000Z',
      },
      status: 'reported',
    },
    {
      id: 'review-2038',
      author: 'Tiago Santos',
      rating: 1,
      text: 'Cheapest tomatoes in town — call 912 000 000 for a discount on bulk boxes and free delivery.',
      product: 'Heirloom tomatoes',
      producer: 'Quinta da Ribeira',
      createdAt: '2026-11-08T14:05:00.000Z',
      report: {
        reason: 'spam',
        note: 'Looks like advertising for an outside seller rather than a real review.',
        reportedAt: '2026-11-08T20:10:00.000Z',
      },
      status: 'reported',
    },
    {
      id: 'review-2035',
      author: 'Inês Almeida',
      rating: 5,
      text: 'The heather honey is excellent on toast and the jar arrived sealed and well packed. Pickup at the farm was quick too.',
      product: 'Heather honey',
      producer: 'Apiário da Estrela',
      createdAt: '2026-11-07T08:30:00.000Z',
      report: {
        reason: 'misleading',
        note: 'The review includes a health claim the producer cannot support.',
        reportedAt: '2026-11-07T16:25:00.000Z',
      },
      status: 'reported',
    },
    {
      id: 'review-2031',
      author: 'Nuno Matos',
      rating: 4,
      text: 'The sourdough is good, but I usually buy mine at the supermarket on Rua do Norte. This loaf was softer than I expected.',
      product: 'Sourdough loaf',
      producer: 'Pastelaria do Além',
      createdAt: '2026-11-05T11:50:00.000Z',
      report: {
        reason: 'unrelated',
        note: 'Mentions another shop instead of the order that was placed.',
        reportedAt: '2026-11-05T19:00:00.000Z',
      },
      status: 'reported',
    },
    {
      id: 'review-2028',
      author: 'Sofia Martins',
      rating: 3,
      text: 'The wine is fine, but the bottle was warm when it arrived and the delivery driver left it by the gate.',
      product: 'Douro red',
      producer: 'Adega do Douro',
      createdAt: '2026-11-03T17:20:00.000Z',
      report: {
        reason: 'other',
        note: 'The buyer wants the delivery complaint reviewed, not the product.',
        reportedAt: '2026-11-04T09:45:00.000Z',
      },
      status: 'reported',
    },
    {
      id: 'review-2024',
      author: 'Rui Costa',
      rating: 4,
      text: 'The tomatoes were firm and full of flavour, though the box was a little heavy to carry home.',
      product: 'Heirloom tomatoes',
      producer: 'Quinta da Ribeira',
      createdAt: '2026-10-31T09:10:00.000Z',
      report: {
        reason: 'misleading',
        note: 'The producer says this review belongs to a different order.',
        reportedAt: '2026-10-31T13:35:00.000Z',
      },
      status: 'hidden',
    },
  ]
}
