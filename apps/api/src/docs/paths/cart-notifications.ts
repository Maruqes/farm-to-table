import { bearerAuth, errorResponse, okResponse, type ApiPaths } from '../types.js';

const ref = (name: string): unknown => ({ $ref: `#/components/schemas/${name}` });

export const cartPaths: ApiPaths = {
  '/api/cart': {
    get: {
      tags: ['Cart'],
      summary: 'Get my cart',
      description: 'Role buyer (CT-06).',
      operationId: 'getCart',
      security: bearerAuth,
      responses: {
        '200': okResponse('My cart', ref('Cart')),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not a buyer'),
      },
    },
    put: {
      tags: ['Cart'],
      summary: 'Replace my cart',
      description: 'Role buyer; replaces the whole cart, `[]` empties it (CT-06).',
      operationId: 'saveCart',
      security: bearerAuth,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('SaveCartRequest') } },
      },
      responses: {
        '200': okResponse('Saved cart, with current prices and stock', ref('Cart')),
        '400': errorResponse('VALIDATION_ERROR', 'Bad body or quantity'),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not a buyer'),
        '404': errorResponse('PRODUCT_NOT_FOUND', 'A product no longer exists or is hidden'),
        '409': errorResponse('STOCK_CHANGED', 'A quantity exceeds current stock; nothing saved'),
      },
    },
  },
};

export const notificationsPaths: ApiPaths = {
  '/api/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'List my notifications',
      description: 'Role buyer or producer, own notifications newest first (CT-09).',
      operationId: 'listNotifications',
      security: bearerAuth,
      responses: {
        '200': okResponse('Own notifications', {
          type: 'array',
          items: { $ref: '#/components/schemas/Notification' },
        }),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Wrong role'),
      },
    },
  },
  '/api/notifications/{id}': {
    patch: {
      tags: ['Notifications'],
      summary: 'Mark a notification as read',
      description: 'Idempotent; body must be `{ read: true }` (CT-09).',
      operationId: 'markNotificationRead',
      security: bearerAuth,
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('MarkReadRequest') } },
      },
      responses: {
        '200': okResponse('Marked as read'),
        '400': errorResponse('VALIDATION_ERROR', 'Body is not `{ read: true }`'),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Wrong role'),
        '404': errorResponse('NOTIFICATION_NOT_FOUND', 'Missing or not the caller notification'),
      },
    },
  },
};
