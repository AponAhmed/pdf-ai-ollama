// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    root: 'frontend', // Make sure Vite is serving from the correct root
    server: {
        port: 3000, 
        proxy: {
            '/api': 'http://localhost:3001', // Proxy to Express server
        },
    },
});
