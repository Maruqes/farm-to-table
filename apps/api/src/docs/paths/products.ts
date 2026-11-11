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

export const productsPaths: ApiPaths = {
  '/api/products': {
    get: {
      tags: ['Products'],
      summary: 'List catalog products, or own products with ?producer=me',
      description:
        'Public catalog search (CT-03). With `?producer=me` it returns the approved ' +
        'producer own products including out-of-stock ones (CT-13).',
      operationId: 'listProducts',
      parameters: [
        queryParam('q', 'Case-insensitive match on product name, ingredients or producer name', {
          type: 'string',
        }),
        queryParam('producer', 'Producer id, or `me` for the own catalog (approved producer token)', {
          type: 'string',
        }),
        queryParam('category', 'Category filter', {
          type: 'string',
          enum: ['vegetables', 'fruit', 'honey', 'wine', 'cheese', 'bakery'],
        }),
        queryParam('location', 'Case-insensitive substring of the producer location', {
          type: 'string',
        }),
        queryParam('season', 'Season filter', {
          type: 'string',
          enum: ['spring', 'summer', 'autumn', 'winter', 'all-year'],
        }),
        queryParam('organic', 'Organic filter', { type: 'string', enum: ['true', 'false'] }),
        queryParam('sort', 'Sort order', {
          type: 'string',
          enum: ['price-asc', 'price-desc', 'rating-desc'],
        }),
      ],
      responses: {
        '200': okResponse('Products (public list, or own products with ?producer=me)', {
          oneOf: [arr('ProductListItem'), arr('ManagedProduct')],
        }),
        '400': errorResponse('VALIDATION_ERROR', 'Unknown category, season, sort or non-boolean organic', true),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token (?producer=me only)'),
        '403': errorResponse('FORBIDDEN', 'Not a producer, or producer not approved (?producer=me only)'),
      },
    },
    post: {
      tags: ['Products'],
      summary: 'Create a product',
      description: 'Approved producer (CT-13).',
      operationId: 'createProduct',
      security: bearerAuth,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('SaveProductRequest') } },
      },
      responses: {
        '201': okResponse('Created product', ref('ManagedProduct')),
        '400': errorResponse('VALIDATION_ERROR', 'Invalid fields', true),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not a producer, or producer not approved'),
      },
    },
  },
  '/api/products/{id}': {
    get: {
      tags: ['Products'],
      summary: 'Get product detail with reviews',
      description: 'Public, also returned for stock 0 (CT-04).',
      operationId: 'getProduct',
      parameters: [pathParam('id', 'Product id')],
      responses: {
        '200': okResponse('Product detail', ref('ProductDetail')),
        '404': errorResponse('PRODUCT_NOT_FOUND', 'Unknown id, producer not approved, or hidden'),
      },
    },
    put: {
      tags: ['Products'],
      summary: 'Replace a product',
      description: 'Approved producer, own products only; imageUrl is kept (CT-13).',
      operationId: 'updateProduct',
      security: bearerAuth,
      parameters: [pathParam('id', 'Product id')],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('SaveProductRequest') } },
      },
      responses: {
        '200': okResponse('Updated product', ref('ManagedProduct')),
        '400': errorResponse('VALIDATION_ERROR', 'Invalid fields', true),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not the owner, or producer not approved'),
        '404': errorResponse('NOT_FOUND', 'Unknown product'),
      },
    },
    delete: {
      tags: ['Products'],
      summary: 'Delete a product',
      description: 'Approved producer, own products only (CT-13).',
      operationId: 'deleteProduct',
      security: bearerAuth,
      parameters: [pathParam('id', 'Product id')],
      responses: {
        '204': { description: 'Deleted, no body' },
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not the owner'),
        '404': errorResponse('NOT_FOUND', 'Unknown product'),
        '409': errorResponse('PRODUCT_IN_AUCTION', 'The product has an active auction'),
      },
    },
  },
  '/api/products/{id}/image': {
    get: {
      tags: ['Products'],
      summary: 'Stream the stored product image',
      description: 'Public (CT-13).',
      operationId: 'getProductImage',
      parameters: [pathParam('id', 'Product id')],
      responses: {
        '200': {
          description: 'Image bytes',
          content: { 'image/*': { schema: { type: 'string', format: 'binary' } } },
        },
        '404': errorResponse('NOT_FOUND', 'Unknown product or no image'),
      },
    },
    post: {
      tags: ['Products'],
      summary: 'Upload a product image',
      description: 'Approved producer. multipart/form-data, one file in field `image`; JPG, PNG or WebP, max 5 MB (CT-13).',
      operationId: 'uploadProductImage',
      security: bearerAuth,
      parameters: [pathParam('id', 'Product id')],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['image'],
              properties: { image: { type: 'string', format: 'binary' } },
            },
          },
        },
      },
      responses: {
        '200': okResponse('Stored image', ref('ImageUploadResponse')),
        '400': errorResponse('VALIDATION_ERROR', 'Missing file, wrong type, or over 5 MB', true),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not the owner, or producer not approved'),
        '404': errorResponse('NOT_FOUND', 'Unknown product'),
      },
    },
  },
};
