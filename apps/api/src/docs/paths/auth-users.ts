import { bearerAuth, errorResponse, okResponse, type ApiPaths } from '../types.js';

const ref = (name: string): unknown => ({ $ref: `#/components/schemas/${name}` });

export const authPaths: ApiPaths = {
  '/api/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Log in',
      description: 'Public. Returns the user and a JWT (CT-01).',
      operationId: 'login',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('LoginRequest') } },
      },
      responses: {
        '200': okResponse('Logged in', ref('AuthResponse')),
        '400': errorResponse('VALIDATION_ERROR', 'Missing or invalid fields', true),
        '401': errorResponse('INVALID_CREDENTIALS', 'Unknown email or wrong password'),
      },
    },
  },
  '/api/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register as buyer or producer',
      description: 'Public. Only buyer and producer may self-register (CT-01).',
      operationId: 'register',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('RegisterRequest') } },
      },
      responses: {
        '201': okResponse('Registered', ref('AuthResponse')),
        '400': errorResponse('VALIDATION_ERROR', 'Invalid fields, e.g. duplicate email', true),
      },
    },
  },
};

export const usersPaths: ApiPaths = {
  '/api/users/me': {
    get: {
      tags: ['Users'],
      summary: 'Get my profile',
      description: 'Role buyer or producer (CT-10).',
      operationId: 'getMyProfile',
      security: bearerAuth,
      responses: {
        '200': okResponse('My profile', ref('Profile')),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Wrong role'),
      },
    },
    put: {
      tags: ['Users'],
      summary: 'Update my profile',
      description: 'Role buyer or producer (CT-10).',
      operationId: 'updateMyProfile',
      security: bearerAuth,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('UpdateProfileRequest') } },
      },
      responses: {
        '200': okResponse('Updated profile', ref('Profile')),
        '400': errorResponse('VALIDATION_ERROR', 'Invalid fields', true),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Wrong role'),
      },
    },
  },
  '/api/users/me/card': {
    put: {
      tags: ['Users'],
      summary: 'Replace my mock card',
      description: 'Role buyer only (CT-10).',
      operationId: 'updateMyCard',
      security: bearerAuth,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('UpdateCardRequest') } },
      },
      responses: {
        '200': okResponse('Profile with the new card', ref('Profile')),
        '400': errorResponse('VALIDATION_ERROR', 'Invalid card fields', true),
        '401': errorResponse('UNAUTHORIZED', 'No or expired token'),
        '403': errorResponse('FORBIDDEN', 'Not a buyer'),
      },
    },
  },
};

export const miscPaths: ApiPaths = {
  '/api/health': {
    get: {
      tags: ['Health'],
      summary: 'Health check',
      description: 'Public. Liveness probe, no auth.',
      operationId: 'health',
      responses: {
        '200': okResponse('API is running', {
          type: 'object',
          required: ['status'],
          properties: { status: { type: 'string', example: 'ok' } },
        }),
      },
    },
  },
};
