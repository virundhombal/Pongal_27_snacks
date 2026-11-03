import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the built site work from any GitHub Pages sub-path
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: '127.0.0.1', port: 5173 },
});
