import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    // The SDK lives in ../sdk and is imported from source, so let Vite read it.
    fs: { allow: ['..'] },
    proxy: { '/api': 'http://localhost:8080' },
  },
});
