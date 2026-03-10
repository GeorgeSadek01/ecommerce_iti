import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'MEAN E-Commerce API',
      version: '1.0.0',
      description:
        'REST API for the MEAN E-Commerce Platform. ' +
        'All authenticated endpoints require a Bearer access token obtained from `POST /auth/login`.',
      contact: {
        name: 'Team',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Current environment',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Short-lived access token (15 min). Obtain it from POST /auth/login.',
        },
      },
      schemas: {
        // ─── Shared ───────────────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'fail' },
            message: { type: 'string', example: 'A descriptive error message.' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'fail' },
            message: { type: 'string', example: 'Validation failed.' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Please provide a valid email address.' },
                },
              },
            },
          },
        },
        // ─── User / Auth ──────────────────────────────────────────────────
        UserPublic: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
            firstName: { type: 'string', example: 'Jane' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            role: { type: 'string', enum: ['customer', 'seller', 'admin'], example: 'customer' },
            isEmailConfirmed: { type: 'boolean', example: true },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password'],
          properties: {
            firstName: { type: 'string', example: 'Jane' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              example: 'Str0ngPass!',
              description: 'Min 8 chars, at least one uppercase letter and one number.',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            password: { type: 'string', format: 'password', example: 'Str0ngPass!' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            message: { type: 'string', example: 'Login successful.' },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  description: 'Short-lived JWT (15 min). Include in Authorization: Bearer <token>.',
                },
                user: { $ref: '#/components/schemas/UserPublic' },
              },
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Missing or invalid access token.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
          },
        },
        Forbidden: {
          description: 'Authenticated but insufficient permissions.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
          },
        },
        NotFound: {
          description: 'Requested resource not found.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
          },
        },
        UnprocessableEntity: {
          description: 'Request body failed validation.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } },
          },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication & session management' },
      { name: 'Products', description: 'Product catalogue' },
      { name: 'Categories', description: 'Product categories' },
      { name: 'Cart', description: 'Shopping cart' },
      { name: 'Orders', description: 'Order placement & tracking' },
      { name: 'Payment', description: 'Payment processing' },
      { name: 'Seller', description: 'Seller panel' },
      { name: 'Admin', description: 'Admin panel' },
    ],
  },
  // Scan all route files for JSDoc @swagger annotations
  apis: ['./src/Features/**/*.routes.js', './src/Features/**/*.controller.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
