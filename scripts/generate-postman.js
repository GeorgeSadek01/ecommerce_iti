#!/usr/bin/env node
/**
 * scripts/generate-postman.js
 *
 * Scans all Express route files in apps/backend/src and rebuilds
 * postman/postman_collection.json automatically.
 *
 * Usage:
 *   node scripts/generate-postman.js
 *
 * Requirements (install once):
 *   npm install --save-dev glob
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const ROOT       = resolve(__dirname, '..');
const ROUTES_DIR = join(ROOT, 'apps', 'backend', 'src');
const APP_FILE   = join(ROOT, 'apps', 'backend', 'src', 'app.js');
const OUT_FILE   = join(ROOT, 'postman', 'postman_collection.json');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Recursively collect *.routes.js files */
function findRouteFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...findRouteFiles(fullPath));
    } else if (entry.endsWith('.routes.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

/** Extract app.use prefix mounts from app.js */
function extractMountPaths(appSource) {
  const mounts = {};
  // Matches: app.use('/api/v1/auth', authRoutes)
  const re = /app\.use\(\s*['"`]([^'"`]+)['"`]\s*,\s*(\w+)/g;
  let m;
  while ((m = re.exec(appSource)) !== null) {
    const prefix   = m[1];
    const varName  = m[2];
    mounts[varName] = prefix;
  }
  return mounts;
}

/** Extract import variable → file mapping from a source file */
function extractImports(source) {
  const imports = {};
  // import authRoutes from './Features/Auth/auth.routes.js'
  const re = /import\s+(\w+)\s+from\s+['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    imports[m[1]] = m[2];
  }
  return imports;
}

/** Parse router.get / router.post / etc. from a route file */
function extractRoutes(source) {
  const routes = [];
  const re = /router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    routes.push({ method: m[1].toUpperCase(), path: m[2] });
  }
  return routes;
}

/** Normalize path: join prefix + route path, collapse // */
function buildFullPath(prefix, routePath) {
  return (prefix + routePath).replace(/\/+/g, '/');
}

/** Convert Express path params (:id) to Postman variables ({{id}}) */
function toPostmanPath(path) {
  return path.replace(/:([^/]+)/g, '{{$1}}');
}

/** Derive a human-readable folder name from the route file path */
function folderName(filePath) {
  const rel  = relative(ROUTES_DIR, filePath);
  const part = rel.split(/[/\\]/)[0];
  return part.charAt(0).toUpperCase() + part.slice(1);
}

/** Build a minimal Postman request item */
function buildRequest(method, fullPath, folder) {
  const url       = `{{base_url}}${toPostmanPath(fullPath)}`;
  const needsAuth = !fullPath.includes('/auth/');
  const headers   = [
    ...(needsAuth
      ? [{ key: 'Authorization', value: 'Bearer {{token}}' }]
      : []),
    ...(['POST', 'PUT', 'PATCH'].includes(method)
      ? [{ key: 'Content-Type', value: 'application/json' }]
      : []),
  ];

  const pathParts = url
    .replace('{{base_url}}', '')
    .split('/')
    .filter(Boolean)
    .map((p) => ({ value: p }));

  const item = {
    name: `${method} ${fullPath}`,
    request: {
      method,
      header: headers,
      url: {
        raw: url,
        host: ['{{base_url}}'],
        path: pathParts.map((p) => p.value),
      },
    },
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            `pm.test('Status is 2xx', function () {`,
            `  pm.expect(pm.response.code).to.be.within(200, 299);`,
            `});`,
            `pm.test('Response time < 500ms', function () {`,
            `  pm.expect(pm.response.responseTime).to.be.below(500);`,
            `});`,
          ],
        },
      },
    ],
  };

  // Add empty JSON body for mutating methods
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    item.request.body = {
      mode: 'raw',
      raw: '{}',
      options: { raw: { language: 'json' } },
    };
  }

  return item;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const appSource     = readFileSync(APP_FILE, 'utf8');
const mountPaths    = extractMountPaths(appSource);
const appImports    = extractImports(appSource);

// Build varName → prefix mapping using the import path to locate the route file
const prefixByFile = {};
for (const [varName, prefix] of Object.entries(mountPaths)) {
  if (appImports[varName]) {
    const absImport = resolve(dirname(APP_FILE), appImports[varName]);
    prefixByFile[absImport] = prefix;
    // Also match without .js extension
    prefixByFile[absImport.replace(/\.js$/, '')] = prefix;
  }
}

const routeFiles = findRouteFiles(ROUTES_DIR);

const folderMap = {};

for (const filePath of routeFiles) {
  const source  = readFileSync(filePath, 'utf8');
  if (!source.trim()) continue; // skip empty stub files

  const prefix  = prefixByFile[filePath] ?? prefixByFile[filePath.replace(/\.js$/, '')] ?? '';
  const routes  = extractRoutes(source);
  const folder  = folderName(filePath);

  if (!routes.length) continue;

  if (!folderMap[folder]) folderMap[folder] = [];
  for (const { method, path } of routes) {
    const fullPath = buildFullPath(prefix, path);
    folderMap[folder].push(buildRequest(method, fullPath, folder));
  }
}

// Always add the /health endpoint
const healthFolder = 'Health';
folderMap[healthFolder] = [
  {
    name: 'GET /health',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{base_url}}/health',
        host: ['{{base_url}}'],
        path: ['health'],
      },
    },
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            "pm.test('Status is 200', function () { pm.response.to.have.status(200); });",
            "pm.test('Body has status ok', function () {",
            "  pm.expect(pm.response.json().status).to.eql('ok');",
            "});",
          ],
        },
      },
    ],
  },
];

const collection = {
  info: {
    name: 'Ecommerce API (generated)',
    _postman_id: 'ecommerce-api-generated',
    description: `Auto-generated by scripts/generate-postman.js on ${new Date().toISOString()}`,
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'base_url', value: 'http://localhost:4000', type: 'string' },
    { key: 'token',    value: '',                      type: 'string' },
  ],
  item: Object.entries(folderMap).map(([name, items]) => ({ name, item: items })),
};

writeFileSync(OUT_FILE, JSON.stringify(collection, null, 2), 'utf8');
console.log(`\n✅  Postman collection written to: ${relative(ROOT, OUT_FILE)}`);
console.log(`   Folders : ${collection.item.length}`);
console.log(`   Requests: ${collection.item.reduce((s, f) => s + f.item.length, 0)}\n`);
