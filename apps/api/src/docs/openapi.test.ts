import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { Router } from 'express'

// Honesty test (BE-22): the OpenAPI document is hand-written, so this test
// walks the real Express router and fails when a mounted /api route has no
// operation in the spec, or the spec lists a path that is not mounted.
// Express 5 hides mount prefixes inside matcher closures, so mounts are
// recorded by wrapping Router.prototype.use BEFORE app.js is evaluated.
interface RouterLike {
  stack: Layer[];
}

interface Layer {
  route?: { path: unknown; methods: Record<string, boolean> };
  handle?: RouterLike & Record<string, unknown>;
}

interface MountRecord {
  parent: object;
  prefix: string;
  child: RouterLike;
}

const mounts: MountRecord[] = [];

function isRouterLike(value: unknown): value is RouterLike {
  return typeof value === 'function' && Array.isArray((value as { stack?: unknown }).stack);
}

const routerProto = Router.prototype as unknown as Record<string, unknown>;
const originalUse = routerProto.use as (...args: unknown[]) => unknown;
routerProto.use = function (this: unknown, ...args: unknown[]): unknown {
  const [first, ...rest] = args;
  const prefix = typeof first === 'string' ? first : '/';
  const handlers = (typeof first === 'string' ? rest : args).flat(Infinity);
  for (const handler of handlers) {
    if (isRouterLike(handler)) mounts.push({ parent: this as object, prefix, child: handler });
  }
  return originalUse.apply(this, args);
};

// Dynamic imports so the wrapper above is installed before any router exists.
const { app } = await import('../app.js');
const { openapi } = await import('./openapi.js');

function normalize(full: string): string {
  let path = full.replace(/\/+/g, '/');
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, '{$1}');
}

function collectMounted(node: RouterLike, base: string, out: Set<string>): void {
  for (const layer of node.stack ?? []) {
    if (layer.route) {
      const methods = layer.route.methods ?? {};
      const routePaths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
      for (const [method, on] of Object.entries(methods)) {
        if (!on) continue;
        for (const routePath of routePaths) {
          out.add(`${method.toUpperCase()} ${normalize(base + String(routePath))}`);
        }
      }
    } else if (layer.handle && Array.isArray(layer.handle.stack)) {
      const prefixes = mounts
        .filter((m) => m.parent === node && m.child === layer.handle)
        .map((m) => m.prefix);
      for (const prefix of prefixes.length > 0 ? prefixes : ['/']) {
        collectMounted(layer.handle as RouterLike, base + prefix, out);
      }
    }
  }
}

function mountedApiRoutes(): Set<string> {
  const all = new Set<string>();
  const router = (app as unknown as { router: RouterLike }).router;
  collectMounted(router, '', all);
  return new Set(
    [...all].filter((entry) => {
      const path = entry.split(' ')[1] ?? '';
      return path === '/api/health' || path.startsWith('/api/');
    }),
  );
}

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

function specOperations(): Set<string> {
  const ops = new Set<string>();
  for (const [path, item] of Object.entries(openapi.paths)) {
    for (const method of Object.keys(item)) {
      if (HTTP_METHODS.has(method)) ops.add(`${method.toUpperCase()} ${normalize(path)}`);
    }
  }
  return ops;
}

test('every mounted /api route has an operation in the spec', () => {
  const mounted = mountedApiRoutes();
  assert.ok(mounted.size > 0, 'expected to discover mounted routes');
  const spec = specOperations();
  const missing = [...mounted].filter((route) => !spec.has(route)).sort();
  assert.deepEqual(missing, [], `mounted but not documented: ${missing.join(', ')}`);
});

test('every spec path is mounted on the app', () => {
  const mounted = mountedApiRoutes();
  const spec = specOperations();
  const extra = [...spec].filter((route) => !mounted.has(route)).sort();
  assert.deepEqual(extra, [], `documented but not mounted: ${extra.join(', ')}`);
});

test('every non-public operation requires bearerAuth', () => {
  const publicOps = new Set([
    'GET /api/health',
    'POST /api/auth/login',
    'POST /api/auth/register',
    'GET /api/products',
    'GET /api/products/{id}',
    'GET /api/products/{id}/image',
    'GET /api/producers',
    'GET /api/producers/{id}',
    'GET /api/auctions',
    'GET /api/auctions/{id}',
  ]);
  const violations: string[] = [];
  for (const [path, item] of Object.entries(openapi.paths)) {
    for (const [method, op] of Object.entries(item)) {
      if (!HTTP_METHODS.has(method)) continue;
      const key = `${method.toUpperCase()} ${normalize(path)}`;
      const security = op.security ?? [];
      const hasBearer = security.some((entry) => 'bearerAuth' in (entry as Record<string, unknown>));
      if (publicOps.has(key)) {
        if (hasBearer) violations.push(`${key} is public but requires auth`);
      } else if (!hasBearer) {
        violations.push(`${key} is not public but has no bearerAuth security`);
      }
    }
  }
  assert.deepEqual(violations, []);
});

test('every ENDPOINTS.md line has an operation in the spec', () => {
  const url = new URL('../../../../.tickets/contract/ENDPOINTS.md', import.meta.url);
  const text = readFileSync(url, 'utf8');
  const spec = specOperations();
  const missing: string[] = [];
  for (const line of text.split('\n')) {
    const match = /^- \[[ x]] (\w+) (\S+)/.exec(line.trim());
    if (!match) continue;
    const [, method, rawPath] = match;
    const path = normalize(rawPath.split('?')[0] as string);
    if (!path.startsWith('/api/')) continue;
    if (!spec.has(`${method} ${path}`)) missing.push(`${method} ${path}`);
  }
  assert.ok(missing.length === 0, `ENDPOINTS.md lines without an operation: ${missing.join(', ')}`);
});
