import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apps/backend/tests/**/*.test.js'],
    environment: 'node',
  },
});
