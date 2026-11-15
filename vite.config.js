/* =========================================================================
 * ARCHITECTURE DESIGNED BY f_nord // MOON LOVER CORE
 * ========================================================================= */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
});