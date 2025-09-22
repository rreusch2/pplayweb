// Minimal ESLint config for Next.js 15 to avoid legacy options errors
import nextConfig from 'eslint-config-next';

export default [
  {
    ignores: ['node_modules/**', '.next/**'],
  },
  ...nextConfig,
];
