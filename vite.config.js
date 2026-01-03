import { defineConfig } from 'vite';

export default defineConfig({
    define: {
        'process.env.GOOGLE_GENAI_API_KEY': JSON.stringify(process.env.GOOGLE_GENAI_API_KEY)
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: './index.html'
            }
        }
    },
    server: {
        port: 3000
    }
});
