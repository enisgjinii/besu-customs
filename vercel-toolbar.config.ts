import { defineConfig } from '@vercel/toolbar/config';

export default defineConfig({
  // Enable toolbar in production for authenticated users
  production: {
    enabled: true,
  },
  // Always enabled in preview deployments
  preview: {
    enabled: true,
  },
  // Always enabled in development
  development: {
    enabled: true,
  },
});
