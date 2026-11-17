import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {fileURLToPath} from 'node:url';
const projectDirectory=fileURLToPath(new URL('.',import.meta.url));
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    build:{rollupOptions:{input:{app:path.resolve(projectDirectory,'index.html'),dashboard:path.resolve(projectDirectory,'dashboard.html')}}},
    resolve: {
      alias: {
        '@': path.resolve(projectDirectory, '.'),
      },
    },
    server: {
      fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/server/**','**/mumble-connector/**']},
      
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {usePolling:process.platform==='win32',interval:500,ignored:['**/server/data/**','**/mumble-connector/node_modules/**']},
    },
  };
});
