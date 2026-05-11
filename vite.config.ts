import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Phase 1d: redirect bare store imports to the Supabase-backed shims.
      // Remove these two lines once storyStore.ts / missionStore.ts are
      // fully replaced (i.e. the re-export barrel files are deleted).
      '@/store/storyStore':  path.resolve(__dirname, './src/store/storyStore.shim'),
      '@/store/missionStore': path.resolve(__dirname, './src/store/missionStore.shim'),
    },
  },
})
