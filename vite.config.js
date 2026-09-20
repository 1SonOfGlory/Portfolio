import {defineConfig} from 'vite';
import tailwind from '@tailwindcss/vite';
export default defineConfig({plugins:[tailwind()],server:{host:'127.0.0.1',allowedHosts:['localhost','127.0.0.1']},build:{chunkSizeWarningLimit:1100}});
