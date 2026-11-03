import { loadEnv, defineConfig } from 'vite'
import { assertSafeSupabaseBuildConfig } from './src/supabase-config.js'

export default defineConfig(({ mode }) => {
  assertSafeSupabaseBuildConfig(loadEnv(mode, process.cwd(), 'VITE_'))
  return {
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
  }
})
