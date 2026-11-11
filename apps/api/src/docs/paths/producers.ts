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

export const producersPaths: ApiPaths = {
  '/api/producers': {
    get: {
      tags: ['Producers'],
      summary: 'List approved producers',
      description: 'Public directory (CT-26).',
      operationId: 'listProducers',
      parameters: [
        queryParam('q', 'Case-insensitive substring of the producer name', { type: 'string' }),
        queryParam('location', 'Exact (case-insensitive) match on the location', { type: 'string' }),
      ],
      responses: {
        '200': okResponse('Approved producers, sorted by name', arr('ProducerDirectoryItem')),
        '400': errorResponse('VALIDATION_ERROR', 'q or location longer than 100 chars', true),
      },
    },
  },
  '/api/producers/me': {
    get: {
      tags: ['Producers'],
      summary: 'Get my public page draft',
      description: 'Approved producer; a new producer gets blank bio/location (CT-17).',
      operationId: 'getMyProducerPage',
      security: bearerAuth,
      responses: {
        '200': okResponse('My producer page', ref('ProducerPage')),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not a producer'),
      },
    },
    put: {
      tags: ['Producers'],
      summary: 'Update my public page',
      description: 'Approved producer (CT-17).',
      operationId: 'updateMyProducerPage',
      security: bearerAuth,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('SaveProducerPageRequest') } },
      },
      responses: {
        '200': okResponse('Updated producer page', ref('ProducerPage')),
        '400': errorResponse('VALIDATION_ERROR', 'Invalid fields', true),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not a producer'),
      },
    },
  },
  '/api/producers/me/stats': {
    get: {
      tags: ['Producers'],
      summary: 'Get my dashboard stats',
      description: 'Approved producer, taken from the token (CT-12).',
      operationId: 'getMyProducerStats',
      security: bearerAuth,
      responses: {
        '200': okResponse('Dashboard stats', ref('ProducerStats')),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not a producer, or producer not approved (PRODUCER_NOT_APPROVED)'),
      },
    },
  },
  '/api/producers/{id}': {
    get: {
      tags: ['Producers'],
      summary: 'Get a public producer page',
      description: 'Public (CT-05).',
      operationId: 'getProducer',
      parameters: [pathParam('id', 'Producer id (user id)')],
      responses: {
        '200': okResponse('Public producer page', ref('ProducerPublic')),
        '404': errorResponse('PRODUCER_NOT_FOUND', 'Unknown id, not approved, or hidden'),
      },
    },
  },
};
