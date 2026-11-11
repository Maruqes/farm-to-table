import {
  bearerAuth,
  errorResponse,
  okResponse,
  pathParam,
  type ApiPaths,
} from '../types.js';

const ref = (name: string): unknown => ({ $ref: `#/components/schemas/${name}` });
const arr = (name: string): unknown => ({ type: 'array', items: ref(name) });

export const ordersPaths: ApiPaths = {
  '/api/orders': {
    post: {
      tags: ['Orders'],
      summary: 'Checkout: turn my cart into one order per producer',
      description:
        'Role buyer. Decrements stock atomically and empties the cart (CT-07).',
      operationId: 'checkout',
      security: bearerAuth,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('CheckoutRequest') } },
      },
      responses: {
        '201': okResponse('One order per producer', arr('Order')),
        '400': errorResponse('VALIDATION_ERROR', 'Bad fulfilment, missing address fields, or empty cart'),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not a buyer'),
        '409': errorResponse('STOCK_CHANGED', 'Some quantity exceeds stock; no order created'),
      },
    },
    get: {
      tags: ['Orders'],
      summary: 'List orders containing my products',
      description: 'Approved producer, newest first (CT-14).',
      operationId: 'listProducerOrders',
      security: bearerAuth,
      responses: {
        '200': okResponse('Orders with my products', arr('ProducerOrder')),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not a producer, or producer not approved'),
      },
    },
  },
  '/api/orders/mine': {
    get: {
      tags: ['Orders'],
      summary: 'List my orders',
      description: 'Role buyer, newest first (CT-08).',
      operationId: 'listMyOrders',
      security: bearerAuth,
      responses: {
        '200': okResponse('My orders', arr('MyOrder')),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not a buyer'),
      },
    },
  },
  '/api/orders/{id}/status': {
    patch: {
      tags: ['Orders'],
      summary: 'Move an order to the next step',
      description:
        'Approved producer. Only the next step (pending→confirmed→ready→delivered) or `cancelled` while pending (CT-14).',
      operationId: 'updateOrderStatus',
      security: bearerAuth,
      parameters: [pathParam('id', 'Order id')],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('UpdateOrderStatusRequest') } },
      },
      responses: {
        '200': okResponse('Updated order', ref('ProducerOrder')),
        '400': errorResponse('INVALID_STATUS_TRANSITION', 'Not the next step, or cancelling after pending'),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Order has none of my products, or producer not approved'),
        '404': errorResponse('ORDER_NOT_FOUND', 'Unknown order'),
      },
    },
  },
};

export const reviewsPaths: ApiPaths = {
  '/api/reviews': {
    post: {
      tags: ['Reviews'],
      summary: 'Rate a delivered order',
      description: 'Role buyer (CT-08).',
      operationId: 'createReview',
      security: bearerAuth,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('CreateReviewRequest') } },
      },
      responses: {
        '201': okResponse('Created review', ref('CreatedReview')),
        '400': errorResponse('VALIDATION_ERROR', 'Rating out of range or text too long', true),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not a buyer'),
        '404': errorResponse('ORDER_NOT_FOUND', 'Not one of my orders'),
        '409': errorResponse('ORDER_NOT_DELIVERED', 'Order not delivered, or already reviewed (ALREADY_REVIEWED)'),
      },
    },
    get: {
      tags: ['Reviews'],
      summary: 'List reviews on my products and page',
      description: 'Approved producer, newest first (CT-16).',
      operationId: 'listProducerReviews',
      security: bearerAuth,
      responses: {
        '200': okResponse('Reviews on my products and page', arr('ProducerReview')),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not a producer, or producer not approved'),
      },
    },
  },
  '/api/reviews/{id}/report': {
    post: {
      tags: ['Reviews'],
      summary: 'Report a review',
      description: 'Approved producer. Idempotent; free-text reason 1–300 chars (CT-16).',
      operationId: 'reportReview',
      security: bearerAuth,
      parameters: [pathParam('id', 'Review id')],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('ReportReviewRequest') } },
      },
      responses: {
        '200': okResponse('Reported review', ref('ProducerReview')),
        '400': errorResponse('VALIDATION_ERROR', 'Missing or invalid reason'),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Review is not on my products or page, or producer not approved'),
        '404': errorResponse('REVIEW_NOT_FOUND', 'Unknown review'),
      },
    },
  },
};
