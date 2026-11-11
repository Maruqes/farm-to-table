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

export const auctionsPaths: ApiPaths = {
  '/api/auctions': {
    get: {
      tags: ['Auctions'],
      summary: 'List public auctions, or own auctions with ?producer=me',
      description:
        'Public list filtered by `status` (CT-03, CT-27). With `?producer=me` it returns ' +
        'the approved producer own auctions in every status (CT-15).',
      operationId: 'listAuctions',
      parameters: [
        queryParam('status', 'Public filter: one of active, scheduled, ended', {
          type: 'string',
          enum: ['active', 'scheduled', 'ended'],
        }),
        queryParam('limit', 'Max items for the public strip, 1–20 (CT-03)', {
          type: 'integer',
          minimum: 1,
          maximum: 20,
        }),
        queryParam('producer', '`me` for the own auction manager (approved producer token)', {
          type: 'string',
        }),
      ],
      responses: {
        '200': okResponse('Public auctions, or own auctions with ?producer=me', {
          oneOf: [arr('AuctionSummary'), arr('AuctionListItem'), arr('ProducerAuction')],
        }),
        '400': errorResponse('VALIDATION_ERROR', 'Missing or unknown status, or bad limit'),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token (?producer=me only)'),
        '403': errorResponse('FORBIDDEN', 'Not a producer, or producer not approved (?producer=me only)'),
      },
    },
    post: {
      tags: ['Auctions'],
      summary: 'Create an auction draft',
      description: 'Approved producer (CT-15).',
      operationId: 'createAuction',
      security: bearerAuth,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('SaveAuctionRequest') } },
      },
      responses: {
        '201': okResponse('Created draft', ref('ProducerAuction')),
        '400': errorResponse('VALIDATION_ERROR', 'Invalid fields', true),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Product not owned, or producer not approved'),
      },
    },
  },
  '/api/auctions/{id}': {
    get: {
      tags: ['Auctions'],
      summary: 'Get an auction room',
      description: 'Public (CT-11).',
      operationId: 'getAuction',
      parameters: [pathParam('id', 'Auction id')],
      responses: {
        '200': okResponse('Auction room', ref('AuctionRoom')),
        '404': errorResponse('AUCTION_NOT_FOUND', 'Unknown auction'),
      },
    },
    put: {
      tags: ['Auctions'],
      summary: 'Update an auction draft',
      description: 'Approved producer, draft only (CT-15).',
      operationId: 'updateAuction',
      security: bearerAuth,
      parameters: [pathParam('id', 'Auction id')],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('SaveAuctionRequest') } },
      },
      responses: {
        '200': okResponse('Updated draft', ref('ProducerAuction')),
        '400': errorResponse('VALIDATION_ERROR', 'Invalid fields', true),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not the owner, or producer not approved'),
        '404': errorResponse('NOT_FOUND', 'Unknown auction'),
        '409': errorResponse('AUCTION_NOT_DRAFT', 'Only drafts can be updated'),
      },
    },
  },
  '/api/auctions/{id}/bids': {
    post: {
      tags: ['Auctions'],
      summary: 'Place a bid',
      description: 'Role buyer. One atomic update: auction active, now < endsAt, amount >= currentPrice + increment (CT-11).',
      operationId: 'placeBid',
      security: bearerAuth,
      parameters: [pathParam('id', 'Auction id')],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('PlaceBidRequest') } },
      },
      responses: {
        '201': okResponse('Placed bid', ref('AuctionBid')),
        '400': errorResponse('VALIDATION_ERROR', 'Missing or not a positive amount', true),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Non-buyer role, or own lot (OWN_LOT)'),
        '404': errorResponse('AUCTION_NOT_FOUND', 'Unknown auction'),
        '409': errorResponse(
          'BID_TOO_LOW',
          'Not active (AUCTION_NOT_ACTIVE), past endsAt (AUCTION_CLOSED), too low (BID_TOO_LOW), or lost a race (BID_OUTBID)',
        ),
      },
    },
  },
  '/api/auctions/{id}/publish': {
    post: {
      tags: ['Auctions'],
      summary: 'Publish a draft',
      description: 'Approved producer. Draft → scheduled (or active if startsAt passed) (CT-15).',
      operationId: 'publishAuction',
      security: bearerAuth,
      parameters: [pathParam('id', 'Auction id')],
      responses: {
        '200': okResponse('Published auction', ref('ProducerAuction')),
        '400': errorResponse('VALIDATION_ERROR', 'Start time in the past'),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not the owner, or producer not approved'),
        '404': errorResponse('NOT_FOUND', 'Unknown auction'),
        '409': errorResponse('AUCTION_NOT_DRAFT', 'Only drafts can be published'),
      },
    },
  },
  '/api/auctions/{id}/cancel': {
    post: {
      tags: ['Auctions'],
      summary: 'Cancel an auction',
      description:
        'Approved producer. Allowed for draft, scheduled or active with no bids; the auction ends with no winner (CT-15).',
      operationId: 'cancelAuction',
      security: bearerAuth,
      parameters: [pathParam('id', 'Auction id')],
      responses: {
        '200': okResponse('Cancelled auction', ref('ProducerAuction')),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not the owner, or producer not approved'),
        '404': errorResponse('NOT_FOUND', 'Unknown auction'),
        '409': errorResponse('AUCTION_HAS_BIDS', 'Has bids, or already ended (AUCTION_ALREADY_ENDED)'),
      },
    },
  },
};
