// Minimal ESLint config for Next.js 15 to avoid legacy options errors
// Uses the default Next.js core web vitals rules
export default [
  {
    ignores: ['node_modules/**', '.next/**'],
  },
  ...require('eslint-config-next')(),
];
