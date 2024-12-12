import { defineConfig } from 'vite';

export default defineConfig({
  root: 'frontend', // Serve from the 'frontend' directory
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001', // Proxy API requests to the backend
    },
  },
  build: {
    outDir: 'dist', // Output directory within 'frontend'
    minify: true,   // Ensure minification of JS and CSS
    rollupOptions: {
      input: 'frontend/src/main.js', // Entry file
      output: {
        entryFileNames: 'script.min.js', // Minified JS output
        assetFileNames: (chunkInfo) => {
          if (chunkInfo.name.endsWith('.css')) {
            return 'style.min.css'; // Minified CSS output
          }
          return '[name].[ext]';
        },
      },
    },
  },
});
