import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(),
      tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': 'https://personal-finance-track-ox0v.onrender.com', 
    },
  },
});
