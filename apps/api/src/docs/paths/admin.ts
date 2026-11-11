import {
  bearerAuth,
  errorResponse,
  okResponse,
  pathParam,
  queryParam,
  type ApiPaths,
} from '../types.js';

const ref = (name: string): unknown => ({ $ref: `#/components/schemas/${name}` });
const arr = (name: string): unknown => ({ type: 'array', items: ref(name) });

const adminAuth = {
  '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
  '403': errorResponse('FORBIDDEN', 'Not an admin'),
};

export const adminPaths: ApiPaths = {
  '/api/admin/summary': {
    get: {
      tags: ['Admin'],
      summary: 'Marketplace overview',
      description: 'Role admin (CT-18).',
      operationId: 'getAdminSummary',
      security: bearerAuth,
      responses: {
        '200': okResponse('Overview summary', ref('AdminSummary')),
        ...adminAuth,
      },
    },
  },
  '/api/admin/producers': {
    get: {
      tags: ['Admin'],
      summary: 'List producers waiting for approval',
      description: 'Role admin, newest application first (CT-19).',
      operationId: 'listPendingProducers',
      security: bearerAuth,
      parameters: [
        queryParam('status', 'Filter (pending)', { type: 'string', enum: ['pending'] }),
      ],
      responses: {
        '200': okResponse('Pending producers', arr('PendingProducer')),
        ...adminAuth,
      },
    },
  },
  '/api/admin/producers/{id}/approve': {
    post: {
      tags: ['Admin'],
      summary: 'Approve a producer',
      description: 'Role admin, no body (CT-19).',
      operationId: 'approveProducer',
      security: bearerAuth,
      parameters: [pathParam('id', 'Producer id')],
      responses: {
        '200': okResponse('Approved; body is ignored by the client'),
        ...adminAuth,
        '404': errorResponse('PRODUCER_NOT_FOUND', 'Unknown id, or no longer pending'),
      },
    },
  },
  '/api/admin/producers/{id}/reject': {
    post: {
      tags: ['Admin'],
      summary: 'Reject a producer',
      description: 'Role admin (CT-19).',
      operationId: 'rejectProducer',
      security: bearerAuth,
      parameters: [pathParam('id', 'Producer id')],
      requestBody: {
        required: false,
        content: { 'application/json': { schema: ref('RejectProducerRequest') } },
      },
      responses: {
        '200': okResponse('Rejected; body is ignored by the client'),
        '400': errorResponse('VALIDATION_ERROR', 'Reason over 300 chars', true),
        ...adminAuth,
        '404': errorResponse('PRODUCER_NOT_FOUND', 'Unknown id, or no longer pending'),
      },
    },
  },
  '/api/admin/content': {
    get: {
      tags: ['Admin'],
      summary: 'List moderated content',
      description: 'Role admin. All products, or all producer pages, including hidden ones (CT-21).',
      operationId: 'listAdminContent',
      security: bearerAuth,
      parameters: [
        queryParam('type', 'Content kind', { type: 'string', enum: ['product', 'producer'] }, true),
      ],
      responses: {
        '200': okResponse('Content items', arr('AdminContentItem')),
        '400': errorResponse('VALIDATION_ERROR', 'Missing or unknown type'),
        ...adminAuth,
      },
    },
  },
  '/api/admin/content/{type}/{id}': {
    patch: {
      tags: ['Admin'],
      summary: 'Hide or unhide content',
      description: 'Role admin, idempotent (CT-21).',
      operationId: 'patchAdminContent',
      security: bearerAuth,
      parameters: [
        pathParam('type', 'Content kind: product or producer'),
        pathParam('id', 'Content id'),
      ],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('UpdateContentRequest') } },
      },
      responses: {
        '200': okResponse('Updated item', ref('AdminContentItem')),
        '400': errorResponse('VALIDATION_ERROR', 'Unknown type, or hidden not boolean'),
        ...adminAuth,
        '404': errorResponse('CONTENT_NOT_FOUND', 'Unknown content'),
      },
    },
  },
  '/api/admin/users': {
    get: {
      tags: ['Admin'],
      summary: 'List users',
      description: 'Role admin, stable order across pages, fixed page size of 8 (CT-22).',
      operationId: 'listAdminUsers',
      security: bearerAuth,
      parameters: [
        queryParam('q', 'Case-insensitive substring of name or email', { type: 'string' }),
        queryParam('role', 'Role filter', { type: 'string', enum: ['buyer', 'producer', 'admin'] }),
        queryParam('page', '1-based page, default 1', { type: 'integer', minimum: 1 }),
      ],
      responses: {
        '200': okResponse('Users page', ref('AdminUsersResponse')),
        '400': errorResponse('VALIDATION_ERROR', 'Unknown role, or page not a positive integer'),
        ...adminAuth,
      },
    },
  },
  '/api/admin/orders': {
    get: {
      tags: ['Admin'],
      summary: 'List all orders',
      description: 'Role admin, newest first, fixed page size of 8. Read-only (CT-23).',
      operationId: 'listAdminOrders',
      security: bearerAuth,
      parameters: [
        queryParam('status', 'Status filter', {
          type: 'string',
          enum: ['pending', 'confirmed', 'ready', 'delivered', 'cancelled'],
        }),
        queryParam('page', '1-based page, default 1', { type: 'integer', minimum: 1 }),
      ],
      responses: {
        '200': okResponse('Orders page', ref('AdminOrdersResponse')),
        '400': errorResponse('VALIDATION_ERROR', 'Unknown status, or page not a positive integer'),
        ...adminAuth,
      },
    },
  },
  '/api/admin/auctions': {
    get: {
      tags: ['Admin'],
      summary: 'List all auctions',
      description: 'Role admin, newest first, fixed page size of 8. Read-only (CT-24).',
      operationId: 'listAdminAuctions',
      security: bearerAuth,
      parameters: [
        queryParam('status', 'Status filter', {
          type: 'string',
          enum: ['draft', 'scheduled', 'active', 'ended'],
        }),
        queryParam('page', '1-based page, default 1', { type: 'integer', minimum: 1 }),
      ],
      responses: {
        '200': okResponse('Auctions page', ref('AdminAuctionsResponse')),
        '400': errorResponse('VALIDATION_ERROR', 'Unknown status, or page not a positive integer'),
        ...adminAuth,
      },
    },
  },
  '/api/admin/status': {
    get: {
      tags: ['Admin'],
      summary: 'Service status panel',
      description:
        'Role admin. One entry per service in stable order; answers 200 even when a dependency is down (CT-25).',
      operationId: 'getAdminStatus',
      security: bearerAuth,
      responses: {
        '200': okResponse('Service statuses', arr('ServiceStatus')),
        ...adminAuth,
        '500': errorResponse('INTERNAL_ERROR', 'Unexpected failure'),
      },
    },
  },
  '/api/admin/reviews': {
    get: {
      tags: ['Admin'],
      summary: 'List reported reviews',
      description: 'Role admin. Open reports plus hidden reviews, newest report first (CT-20).',
      operationId: 'listAdminReviews',
      security: bearerAuth,
      parameters: [
        queryParam('reported', 'Report filter', { type: 'string', enum: ['true'] }),
      ],
      responses: {
        '200': okResponse('Reported reviews', arr('AdminReview')),
        ...adminAuth,
      },
    },
  },
  '/api/admin/reviews/{id}/keep': {
    post: {
      tags: ['Admin'],
      summary: 'Dismiss a report, keep the review public',
      description: 'Role admin, no body (CT-20).',
      operationId: 'keepAdminReview',
      security: bearerAuth,
      parameters: [pathParam('id', 'Review id')],
      responses: {
        '200': okResponse('Review that left the queue', ref('AdminReview')),
        ...adminAuth,
        '404': errorResponse('REVIEW_NOT_FOUND', 'Unknown id, or no longer in the queue'),
      },
    },
  },
  '/api/admin/reviews/{id}/hide': {
    post: {
      tags: ['Admin'],
      summary: 'Hide a reported review',
      description: 'Role admin, no body (CT-20).',
      operationId: 'hideAdminReview',
      security: bearerAuth,
      parameters: [pathParam('id', 'Review id')],
      responses: {
        '200': okResponse('Hidden review', ref('AdminReview')),
        ...adminAuth,
        '404': errorResponse('REVIEW_NOT_FOUND', 'Unknown id, or no longer in the queue'),
      },
    },
  },
};
