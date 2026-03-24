import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const collectionPath = path.join(root, 'endpoints', 'ecommerce.postman.json');

const raw = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(raw);

const defaultVariables = [
  ['baseUrl', 'http://localhost:4000'],
  ['token', ''],
  ['refreshToken', ''],
  ['adminToken', ''],
  ['sellerToken', ''],
  ['googleIdToken', ''],
  ['confirmToken', ''],
  ['resetToken', ''],
  ['jwtToken', ''],
  ['stripeSignature', 't=0,v1=replace_me'],
  ['userId', ''],
  ['adminUserId', ''],
  ['sellerId', ''],
  ['sellerProfileId', ''],
  ['productId', ''],
  ['categoryId', ''],
  ['imageId', ''],
  ['addressId', ''],
  ['orderId', ''],
  ['reviewId', ''],
  ['promoCodeId', ''],
  ['adminSellerId', ''],
  ['adminProductId', ''],
  ['adminOrderId', ''],
  ['adminPromoCodeId', ''],
  ['adminBannerId', ''],
  ['adminRefundId', ''],
  ['wishlistProductId', ''],
  ['cartItemId', ''],
  ['promoCode', ''],
];

collection.description = [
  'E-commerce API collection with standardized auth, variables, and tests.',
  'Use the companion environment file and run via Newman in CI.',
].join('\n');

collection.variable = defaultVariables.map(([key, value]) => ({ key, value, type: 'string' }));

collection.auth = {
  type: 'bearer',
  bearer: [{ key: 'token', value: '{{token}}', type: 'string' }],
};

collection.event = [
  {
    listen: 'prerequest',
    script: {
      type: 'text/javascript',
      exec: [
        '// Skip refresh for explicit noauth requests',
        'const auth = pm.request.auth; ',
        "if (auth && auth.type === 'noauth') { return; }",
        '',
        "const token = pm.environment.get('token');",
        "const refreshToken = pm.environment.get('refreshToken');",
        '',
        'if (!token && refreshToken) {',
        '  pm.sendRequest({',
        "    url: pm.environment.get('baseUrl') + '/api/v1/auth/refresh',",
        "    method: 'POST'",
        '  }, function (err, res) {',
        '    if (err || !res) {',
        "      console.warn('Refresh request failed');",
        '      return;',
        '    }',
        '    let json = {};',
        '    try { json = res.json(); } catch (e) {}',
        '    const nextToken = json.accessToken || json.token || (json.data && (json.data.accessToken || json.data.token));',
        '    if (nextToken) {',
        "      pm.environment.set('token', nextToken);",
        "      console.log('token refreshed in pre-request script');",
        '    }',
        '  });',
        '}',
      ],
      packages: {},
    },
  },
  {
    listen: 'test',
    script: {
      type: 'text/javascript',
      exec: [
        "pm.test('Response time is acceptable', function () {",
        '  pm.expect(pm.response.responseTime).to.be.below(5000);',
        '});',
      ],
      packages: {},
    },
  },
];

const publicAuthRequests = new Set([
  'Register',
  'Confirm Email',
  'Login',
  'Refresh Token',
  'Forgot Password',
  'Reset Password',
  'Google Login',
]);

const keyEndpointSpecs = {
  Register: {
    description: 'Create a new account. Saves userId from response to environment.',
    code: 201,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      additionalProperties: true,
    },
    example: { message: 'Registration successful. Please confirm your email.' },
  },
  Login: {
    description: 'Authenticate with email/password. Stores token/adminToken and userId.',
    code: 200,
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
      additionalProperties: true,
    },
    example: { accessToken: '<jwt>', data: { userId: '<id>', role: 'user' } },
  },
  'Refresh Token': {
    description: 'Issue a fresh access token using refresh token cookie/session.',
    code: 200,
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
      additionalProperties: true,
    },
    example: { accessToken: '<jwt>' },
  },
  'Create Product': {
    description: 'Create a product and store productId for chained requests.',
    code: 201,
    schema: {
      type: 'object',
      properties: {
        data: { type: 'object' },
      },
      additionalProperties: true,
    },
    example: { data: { id: '<productId>', name: 'Monitor', price: 99 } },
  },
  'Get All Products': {
    description: 'Fetch paginated products for storefront browsing.',
    code: 200,
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
      },
      additionalProperties: true,
    },
    example: { data: [{ id: '<productId>', name: 'Monitor' }], pagination: { page: 1, totalPages: 1 } },
  },
  Checkout: {
    description: 'Create Stripe checkout/payment intent for current cart.',
    code: 200,
    schema: {
      type: 'object',
      properties: {
        data: { type: 'object' },
      },
      additionalProperties: true,
    },
    example: { data: { paymentId: '<paymentId>', orderId: '<orderId>' } },
  },
  Webhook: {
    description: 'Stripe webhook endpoint. Requires valid Stripe-Signature header.',
    code: 200,
    schema: {
      type: 'object',
      additionalProperties: true,
    },
    example: { received: true },
  },
  'Place Order (Cash-On-Delivery)': {
    description: 'Place COD order from active cart with optional promo code.',
    code: 201,
    schema: {
      type: 'object',
      properties: {
        data: { type: 'object' },
      },
      additionalProperties: true,
    },
    example: { data: { id: '<orderId>', status: 'pending' } },
  },
  'Get Cart': {
    description: 'Retrieve current authenticated user cart.',
    code: 200,
    schema: {
      type: 'object',
      properties: {
        data: { type: 'object' },
      },
      additionalProperties: true,
    },
    example: { data: { items: [], total: 0 } },
  },
  'Health Check': {
    description: 'Service liveness endpoint used by smoke tests and monitors.',
    code: 200,
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
      },
      required: ['status'],
      additionalProperties: true,
    },
    example: { status: 'ok' },
  },
};

function makeSchemaTestLines(expectedCode, schema) {
  return [
    `pm.test('Status is ${expectedCode}', function () {`,
    `  pm.response.to.have.status(${expectedCode});`,
    '});',
    '',
    "pm.test('Response is valid JSON schema', function () {",
    '  var json = pm.response.json();',
    `  var schema = ${JSON.stringify(schema)};`,
    '  pm.expect(tv4.validate(json, schema), JSON.stringify(tv4.error)).to.be.true;',
    '});',
  ];
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function isHex24(value) {
  return typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);
}

function inferVarForKey(key) {
  const k = String(key || '').toLowerCase();
  if (k.includes('address')) return 'addressId';
  if (k.includes('category')) return 'categoryId';
  if (k.includes('product')) return 'productId';
  if (k.includes('image')) return 'imageId';
  if (k.includes('order')) return 'orderId';
  if (k.includes('review')) return 'reviewId';
  if (k.includes('user')) return 'userId';
  if (k.includes('sellerprofile')) return 'sellerProfileId';
  if (k.includes('seller')) return 'sellerId';
  if (k.includes('promo')) return 'promoCodeId';
  if (k.includes('cart')) return 'cartItemId';
  if (k.includes('wishlist')) return 'wishlistProductId';
  if (k.includes('token')) {
    if (k.includes('confirm')) return 'confirmToken';
    if (k.includes('reset')) return 'resetToken';
    return 'jwtToken';
  }
  return 'resourceId';
}

function inferVarForPathSegment(previousSegment) {
  const prev = String(previousSegment || '').toLowerCase();
  if (prev === 'addresses') return 'addressId';
  if (prev === 'categories') return 'categoryId';
  if (prev === 'products') return 'productId';
  if (prev === 'images') return 'imageId';
  if (prev === 'orders') return 'orderId';
  if (prev === 'reviews') return 'reviewId';
  if (prev === 'users') return 'adminUserId';
  if (prev === 'sellers') return 'adminSellerId';
  if (prev === 'promo-codes') return 'promoCodeId';
  if (prev === 'profile') return 'sellerProfileId';
  if (prev === 'cart') return 'cartItemId';
  if (prev === 'wishlist') return 'wishlistProductId';
  if (prev === 'refunds') return 'adminRefundId';
  if (prev === 'banners') return 'adminBannerId';
  return 'resourceId';
}

function replaceTokenLike(value, key) {
  if (typeof value !== 'string') return value;
  if (/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(value)) {
    const varName = inferVarForKey(key || 'token');
    return `{{${varName}}}`;
  }
  if (isHex24(value)) {
    const varName = inferVarForKey(key || 'id');
    return `{{${varName}}}`;
  }
  return value;
}

function deepReplaceBody(obj) {
  if (Array.isArray(obj)) return obj.map((v) => deepReplaceBody(v));
  if (!obj || typeof obj !== 'object') return obj;

  const next = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      next[k] = replaceTokenLike(v, k);
    } else {
      next[k] = deepReplaceBody(v);
    }
  }
  return next;
}

function normalizeUrl(urlObj) {
  if (!urlObj) return;

  if (Array.isArray(urlObj.path)) {
    urlObj.path = urlObj.path.map((seg, idx, arr) => {
      if (isHex24(seg)) {
        return `{{${inferVarForPathSegment(arr[idx - 1])}}}`;
      }
      if (typeof seg === 'string' && /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(seg)) {
        return '{{confirmToken}}';
      }
      return seg;
    });
  }

  if (typeof urlObj.raw === 'string') {
    let updated = urlObj.raw;

    updated = updated.replace(/\/categories\/([a-f0-9]{24})(?=\/|$)/gi, '/categories/{{categoryId}}');
    updated = updated.replace(/\/products\/([a-f0-9]{24})(?=\/|$)/gi, '/products/{{productId}}');
    updated = updated.replace(/\/images\/([a-f0-9]{24})(?=\/|$)/gi, '/images/{{imageId}}');
    updated = updated.replace(/\/orders\/([a-f0-9]{24})(?=\/|$)/gi, '/orders/{{orderId}}');
    updated = updated.replace(/\/reviews\/([a-f0-9]{24})(?=\/|$)/gi, '/reviews/{{reviewId}}');
    updated = updated.replace(/\/users\/([a-f0-9]{24})(?=\/|$)/gi, '/users/{{adminUserId}}');
    updated = updated.replace(/\/sellers\/([a-f0-9]{24})(?=\/|$)/gi, '/sellers/{{adminSellerId}}');
    updated = updated.replace(/\/promo-codes\/([a-f0-9]{24})(?=\/|$)/gi, '/promo-codes/{{promoCodeId}}');
    updated = updated.replace(/\/wishlist\/([a-f0-9]{24})(?=\/|$)/gi, '/wishlist/{{wishlistProductId}}');
    updated = updated.replace(/\/cart\/([a-f0-9]{24})(?=\/|$)/gi, '/cart/{{cartItemId}}');
    updated = updated.replace(/\/addresses\/([a-f0-9]{24})(?=\/|$)/gi, '/addresses/{{addressId}}');
    updated = updated.replace(/\/confirm\/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '/confirm/{{confirmToken}}');

    urlObj.raw = updated;
  }
}

function ensureHeader(headers, key, value) {
  const existing = headers.find((h) => String(h.key || '').toLowerCase() === key.toLowerCase());
  if (existing) {
    existing.value = value;
    return;
  }
  headers.push({ key, value, type: 'string' });
}

function removeHeader(headers, key) {
  return headers.filter((h) => String(h.key || '').toLowerCase() !== key.toLowerCase());
}

function bearerAuthFor(tokenVar) {
  return {
    type: 'bearer',
    bearer: [{ key: 'token', value: `{{${tokenVar}}}`, type: 'string' }],
  };
}

function setNoAuth(request) {
  request.auth = { type: 'noauth' };
}

function inferAuthFromHeaders(headers = []) {
  const authHeader = headers.find((h) => String(h.key || '').toLowerCase() === 'authorization');
  if (!authHeader || typeof authHeader.value !== 'string') return null;
  const value = authHeader.value;
  if (value.includes('{{adminToken}}')) return 'adminToken';
  if (value.includes('{{sellerToken2}}') || value.includes('{{sellerToken}}')) return 'sellerToken';
  return 'token';
}

function isRequestObject(item) {
  return item && item.request;
}

function normalizeRequest(item, topFolderName) {
  const request = item.request;
  if (!request) return;

  request.header = ensureArray(request.header);

  const inferred = inferAuthFromHeaders(request.header);

  // Standardized auth strategy.
  if (topFolderName === 'Health') {
    setNoAuth(request);
  } else if (topFolderName === 'Admin Panel') {
    request.auth = bearerAuthFor('adminToken');
  } else if (topFolderName === 'Seller') {
    request.auth = bearerAuthFor('sellerToken');
  } else if (topFolderName === 'Auth' && publicAuthRequests.has(item.name)) {
    setNoAuth(request);
  } else if (inferred) {
    request.auth = bearerAuthFor(inferred);
  }

  request.header = removeHeader(request.header, 'Authorization');

  const body = request.body || {};
  const mode = body.mode;

  if (mode === 'raw') {
    const rawBody = typeof body.raw === 'string' ? body.raw : '';
    if (rawBody.trim()) {
      try {
        const jsonBody = JSON.parse(rawBody);
        body.raw = JSON.stringify(deepReplaceBody(jsonBody), null, 2);
      } catch {
        body.raw = rawBody
          .replace(/"([a-zA-Z0-9_]*Id)"\s*:\s*"[a-f0-9]{24}"/g, '"$1": "{{$1}}"')
          .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '{{jwtToken}}');
      }
      request.body = body;
      ensureHeader(request.header, 'Content-Type', 'application/json');
    }
  }

  if (mode === 'formdata') {
    request.header = removeHeader(request.header, 'Content-Type');
  }

  if (mode !== 'raw' && mode !== 'formdata') {
    request.header = removeHeader(request.header, 'Content-Type');
  }

  normalizeUrl(request.url);

  const spec = keyEndpointSpecs[item.name];
  if (spec) {
    item.description = spec.description;

    item.event = ensureArray(item.event).filter((e) => e.listen !== 'test');
    const testScript = {
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: makeSchemaTestLines(spec.code, spec.schema),
        packages: {},
      },
    };

    if (item.name === 'Webhook') {
      if (!request.header.some((h) => String(h.key || '').toLowerCase() === 'stripe-signature')) {
        request.header.push({ key: 'Stripe-Signature', value: '{{stripeSignature}}', type: 'string' });
      }

      testScript.script.exec.push('');
      testScript.script.exec.push("pm.test('Stripe-Signature header exists on request', function () {");
      testScript.script.exec.push("  pm.expect(pm.request.headers.has('Stripe-Signature')).to.be.true;");
      testScript.script.exec.push('});');
    }

    item.event.push(testScript);

    item.response = [
      {
        name: `Example ${spec.code}`,
        originalRequest: {
          method: request.method,
          header: request.header,
          url: request.url,
        },
        status: spec.code === 201 ? 'Created' : 'OK',
        code: spec.code,
        _postman_previewlanguage: 'json',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: JSON.stringify(spec.example, null, 2),
      },
    ];
  }
}

function walkItems(items, topFolderName) {
  for (const item of ensureArray(items)) {
    if (Array.isArray(item.item)) {
      if (item.name === 'Admin Panel') {
        item.auth = bearerAuthFor('adminToken');
      } else if (item.name === 'Seller') {
        item.auth = bearerAuthFor('sellerToken');
      } else if (item.name === 'Health') {
        item.auth = { type: 'noauth' };
      }

      walkItems(item.item, topFolderName || item.name);
      continue;
    }

    if (isRequestObject(item)) {
      normalizeRequest(item, topFolderName);
    }
  }
}

walkItems(collection.item, '');

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 4) + '\n', 'utf8');
console.log('Postman collection refactored successfully.');
