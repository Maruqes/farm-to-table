import type { ProducerReviewDto } from '../producer-reviews.dto'

// Producer fixtures for FE-16. Deterministic ids keep screenshots and tests stable.
export function createMockProducerReviews(): ProducerReviewDto[] {
  return [
    {
      id: 'review-1042',
      author: 'Marta Ferreira',
      rating: 5,
      text: 'The tomatoes arrived firm and full of flavour. You can tell they were picked that morning, and the box was packed with care.',
      product: 'Heirloom tomatoes',
      reported: false,
    },
    {
      id: 'review-1041',
      author: 'Rui Costa',
      rating: 4,
      text: 'The heather honey is excellent, especially on toast. Pickup was quick and the producer explained how the hives are kept.',
      product: 'Heather honey',
      reported: false,
    },
    {
      id: 'review-1040',
      author: 'Inês Almeida',
      rating: 5,
      text: 'Best sourdough I have had in months. Crisp crust, soft crumb, and it kept well for three days.',
      product: 'Sourdough loaf',
      reported: false,
    },
    {
      id: 'review-1039',
      author: 'Tiago Santos',
      rating: 3,
      text: 'Good produce, but the pickup window was shorter than the one shown at checkout. A little more flexibility would help.',
      product: null,
      reported: false,
    },
    {
      id: 'review-1038',
      author: 'Beatriz Lopes',
      rating: 2,
      text: 'The cheese was past its best when I collected it. I expected better for the price.',
      product: 'Serra cheese',
      reported: true,
    },
    {
      id: 'review-1036',
      author: 'Nuno Matos',
      rating: 5,
      text: 'The Vinho Verde was chilled and ready to drink. Ordering again for the weekend.',
      product: 'Vinho Verde',
      reported: false,
    },
    {
      id: 'review-1034',
      author: 'Sofia Martins',
      rating: 4,
      text: 'Friendly producer and easy pickup at the farm. Clear directions and a warm welcome.',
      product: null,
      reported: false,
    },
  ]
}
