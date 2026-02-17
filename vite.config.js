import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const authApiTarget = env.VITE_API_BASE_URL || 'https://lostfound1.pythonanywhere.com'
  const productsApiTarget =
    env.VITE_PRODUCTS_API_BASE_URL || 'https://sharif-lost-found-production.up.railway.app'

  return {
    plugins: [react()],
    base: '/lost-and-found',
    server: {
      cors: true,
      proxy: {
        '/auth-api': {
          target: authApiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/auth-api/, ''),
        },
        '/products-api': {
          target: productsApiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/products-api/, ''),
        },
      },
    },
  }
})


