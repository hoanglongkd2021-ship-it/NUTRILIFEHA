import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Stringify the API key to inject it into the build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill process.env object to avoid "process is not defined" runtime errors
      // This is crucial for libraries that might check process.env.*
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        API_KEY: JSON.stringify(env.API_KEY)
      } 
    },
    server: {
      port: 3000
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
          output: {
              manualChunks: {
                  vendor: ['react', 'react-dom', 'recharts', 'lucide-react', '@google/genai'],
              }
          }
      }
    }
  };
});