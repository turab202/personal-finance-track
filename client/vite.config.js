import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(),
      tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:5000', // your backend server
    },
  },
});
