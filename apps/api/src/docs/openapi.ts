import { schemas } from './schemas.js';
import type { ApiPaths } from './types.js';
import { adminPaths } from './paths/admin.js';
import { auctionsPaths } from './paths/auctions.js';
import { authPaths, miscPaths, usersPaths } from './paths/auth-users.js';
import { cartPaths, notificationsPaths } from './paths/cart-notifications.js';
import { ordersPaths, reviewsPaths } from './paths/orders-reviews.js';
import { producersPaths } from './paths/producers.js';
import { productsPaths } from './paths/products.js';

// One hand-written OpenAPI 3 document. Paths live one file per module under
// docs/paths/; components.schemas holds each contract type once (CT-01…CT-27
// in docs/schemas.ts). No generator: docs/openapi.test.ts walks the Express
// router and fails when a mounted /api route is missing here, or vice versa.

const paths: ApiPaths = {
  ...authPaths,
  ...usersPaths,
  ...productsPaths,
  ...producersPaths,
  ...cartPaths,
  ...ordersPaths,
  ...reviewsPaths,
  ...notificationsPaths,
  ...auctionsPaths,
  ...adminPaths,
  ...miscPaths,
};

export interface OpenApiDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string }>;
  tags: Array<{ name: string; description: string }>;
  paths: ApiPaths;
  components: {
    schemas: Record<string, unknown>;
    securitySchemes: Record<string, unknown>;
  };
}

export const openapi: OpenApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Farm to Table API',
    version: '1.0.0',
    description: [
      'Marketplace API. Base path `/api`, JSON in and out.',
      'Auth: `Authorization: Bearer <jwt>` (JWT from `POST /api/auth/login`); use the Authorize button, then protected calls work from this UI.',
      'Errors follow CT-00: `{ "error": { "code": "UPPER_SNAKE", "message": "...", "fields?": {...} } }`.',
      'Realtime (Socket.io, path `/socket.io`): rooms `user:<id>` and `auction:<id>`; events `order-updated`, `order-created`, `notification`, `bid-placed`, `bid-rejected`, `viewers`, `auction-ended` (CT-00, CT-11, CT-14).',
    ].join('\n\n'),
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Auth', description: 'Login and registration (CT-01)' },
    { name: 'Users', description: 'Profile and mock card (CT-10)' },
    { name: 'Products', description: 'Catalog and product manager (CT-03, CT-04, CT-13)' },
    { name: 'Producers', description: 'Directory, public page and dashboard (CT-05, CT-12, CT-17, CT-26)' },
    { name: 'Cart', description: 'Buyer cart (CT-06)' },
    { name: 'Orders', description: 'Checkout and order states (CT-07, CT-08, CT-14)' },
    { name: 'Reviews', description: 'Buyer ratings and producer reports (CT-08, CT-16)' },
    { name: 'Notifications', description: 'User notifications (CT-09)' },
    { name: 'Auctions', description: 'Public list, room, bidding, manager (CT-03, CT-11, CT-15, CT-27)' },
    { name: 'Admin', description: 'Moderation, lists and status (CT-18 … CT-25)' },
    { name: 'Health', description: 'Liveness probe' },
  ],
  paths,
  components: {
    schemas,
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT from POST /api/auth/login, sent as Authorization: Bearer <token>',
      },
    },
  },
};
