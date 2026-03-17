import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import request from 'supertest';

// Required by env.js during app import.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';

const rootDir = path.resolve(process.cwd());
const appFilePath = path.join(rootDir, 'apps', 'backend', 'src', 'app.js');
const appSource = fs.readFileSync(appFilePath, 'utf8');

const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const normalizePath = (value) => {
  const normalized = value.replace(/\/+/g, '/').replace(/\/$/, '');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

const joinPaths = (prefix, routePath) => {
  const left = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  const right = routePath.startsWith('/') ? routePath : `/${routePath}`;
  return normalizePath(`${left}${right}`);
};

const materializePathParams = (routePath) =>
  routePath
    .replace(/:token\b/g, 'test-token')
    .replace(/:any\b/g, 'test-any')
    .replace(/:[a-zA-Z0-9_]+\b/g, '507f1f77bcf86cd799439011');

const parseRouterImports = (source) => {
  const imports = new Map();
  const importRegex = /import\s+(\w+)\s+from\s+'(\.\/features\/.+?\.routes\.js)'\s*;/g;
  let match = importRegex.exec(source);

  while (match) {
    imports.set(match[1], match[2]);
    match = importRegex.exec(source);
  }

  return imports;
};

const parseMountedRouters = (source) => {
  const mounts = [];
  const mountRegex = /app\.use\(\s*['\"]([^'\"]+)['\"]\s*,\s*(?:(?:authenticate|[a-zA-Z_$][\w$]*)\s*,\s*)?(\w+)\s*\)/g;
  let match = mountRegex.exec(source);

  while (match) {
    mounts.push({ prefix: normalizePath(match[1]), routerVar: match[2] });
    match = mountRegex.exec(source);
  }

  return mounts;
};

const parseRouterRoutes = (source) => {
  const routes = [];
  const routeRegex = /router\.(all|get|post|put|patch|delete|options|head)\(\s*['\"]([^'\"]+)['\"]/g;
  let match = routeRegex.exec(source);

  while (match) {
    routes.push({ method: match[1].toUpperCase(), path: normalizePath(match[2]) });
    match = routeRegex.exec(source);
  }

  return routes;
};

const parseAppDirectRoutes = (source) => {
  const routes = [];
  const directRouteRegex = /app\.(get|post|put|patch|delete|options|head)\(\s*['\"]([^'\"]+)['\"]/g;
  let match = directRouteRegex.exec(source);

  while (match) {
    routes.push({ method: match[1].toUpperCase(), path: normalizePath(match[2]) });
    match = directRouteRegex.exec(source);
  }

  return routes;
};

const parseAllEndpoints = () => {
  const source = stripComments(appSource);
  const imports = parseRouterImports(source);
  const mounts = parseMountedRouters(source);
  const endpoints = [];

  for (const mount of mounts) {
    const relativeRouteFile = imports.get(mount.routerVar);
    if (!relativeRouteFile) continue;

    const routeFilePath = path.join(rootDir, 'apps', 'backend', 'src', relativeRouteFile.replace('./', ''));
    const routerSource = stripComments(fs.readFileSync(routeFilePath, 'utf8'));
    const routerEndpoints = parseRouterRoutes(routerSource);

    for (const endpoint of routerEndpoints) {
      endpoints.push({
        method: endpoint.method,
        path: materializePathParams(joinPaths(mount.prefix, endpoint.path)),
      });
    }
  }

  const directAppRoutes = parseAppDirectRoutes(source).map((endpoint) => ({
    method: endpoint.method,
    path: materializePathParams(endpoint.path),
  }));

  const unique = new Map();
  for (const endpoint of [...endpoints, ...directAppRoutes]) {
    const key = `${endpoint.method} ${endpoint.path}`;
    if (!unique.has(key)) {
      unique.set(key, endpoint);
    }
  }

  return [...unique.values()];
};

const endpoints = parseAllEndpoints();
const { default: app } = await import('../src/app.js');

describe('API Endpoint Registration Smoke Test', () => {
  it('discovers endpoints from source', () => {
    expect(endpoints.length).toBeGreaterThan(0);
  });

  it.each(endpoints)('$method $path should be reachable (not 404)', async ({ path: endpointPath }) => {
    const response = await request(app).options(endpointPath).send();

    expect(response.status).not.toBe(404);
    expect(response.status).toBeLessThan(500);
  });
});
