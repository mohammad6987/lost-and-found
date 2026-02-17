# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## CORS in local development

CORS is enforced by the backend API, not by React itself.  
For local development, this project supports a Vite proxy to avoid browser CORS errors.

1. In `.env`, keep your real backend URLs:
   - `VITE_API_BASE_URL=https://your-auth-api.example.com`
   - `VITE_PRODUCTS_API_BASE_URL=https://your-products-api.example.com`
2. Enable proxy mode in development:
   - `VITE_USE_DEV_PROXY=true`
3. Start dev server:
   - `npm run dev`

When `VITE_USE_DEV_PROXY=true`, frontend requests go through:
- `/auth-api` -> `VITE_API_BASE_URL`
- `/products-api` -> `VITE_PRODUCTS_API_BASE_URL`

Production build behavior is unchanged.
