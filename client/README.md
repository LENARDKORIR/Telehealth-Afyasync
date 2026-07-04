 # Secure Telehealth Portal with Offline Fast Sync

A modern healthcare dashboard built with React, TypeScript, Vite, Tailwind CSS, Axios, IndexedDB, and PWA support. It is designed for unstable connections so doctors can keep entering records offline and sync automatically when the network returns.

## Features

- JWT login, registration, protected routes, and role-based access
- Offline-first patient and appointment workflows
- IndexedDB-backed local storage and sync queue
- Tailwind-based responsive dashboard UI
- Service worker and manifest for PWA installation
- AES-256 encryption helper and secure local token handling

## Run It

```bash
cd client
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env` and adjust values as needed:

```env
VITE_API_URL=/api
VITE_APP_NAME=Secure Telehealth Portal
VITE_ENCRYPTION_KEY=your-encryption-key-here-change-in-production
```

Use `/api` during local development so the Vite proxy forwards requests to the backend. If you deploy the frontend and backend separately, replace it with the full backend URL for that environment.

For Vercel deployments, set `VITE_API_URL` in Project Settings to your backend URL (example: `https://afyasyncc-api.onrender.com/api`). If you leave it unset, browser calls to `/api/*` may return 404 when no rewrite/proxy is configured.

This project also includes `vercel.json` with a rewrite from `/api/*` to `https://afyasyncc-api.onrender.com/api/*` and a `.env.production` default for `VITE_API_URL`.

## Project Structure

- `src/components` reusable UI pieces
- `src/pages` auth and dashboard pages
- `src/layouts` auth and dashboard layouts
- `src/services` API, auth, patient, and sync services
- `src/database` IndexedDB helper
- `src/utils` constants, helpers, and encryption
- `src/types` TypeScript domain types

## Notes

The frontend is ready for a Django REST API backend. Update the API base URL in `.env` and wire the backend endpoints to match the service layer.
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
