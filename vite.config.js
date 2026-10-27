import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const BUILD_TIME = new Date().toISOString()
const BUILD_COMMIT = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '').slice(0, 7)
// بصمة النسخة: بتتغير مع كل بناء. التطبيق بيقارن بصمته بـ /version.json على الموقع، ولو اختلفوا بيحدّث نفسه.
const BUILD_ID = `${BUILD_TIME.replace(/[^0-9]/g, '').slice(0, 14)}${BUILD_COMMIT ? `-${BUILD_COMMIT}` : ''}`

function liveUrl(mode) {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.CAP_SERVER_URL) return env.CAP_SERVER_URL.trim().replace(/\/+$/, '')
  try { return String(JSON.parse(fs.readFileSync('app-update.json', 'utf8')).liveUrl || '').trim().replace(/\/+$/, '') } catch { return '' }
}

// بعد البناء: يكتب dist/version.json، ويحط رابط الموقع في offline.html عشان زرار «إعادة المحاولة» جوه التطبيق يرجع للموقع.
function liveUpdatePlugin(mode) {
  let outDir = 'dist'
  return {
    name: 'nahhas-live-update',
    apply: 'build',
    configResolved(cfg) { outDir = path.resolve(cfg.root, cfg.build.outDir) },
    closeBundle() {
      fs.writeFileSync(path.join(outDir, 'version.json'), JSON.stringify({ build: BUILD_ID, time: BUILD_TIME, commit: BUILD_COMMIT }))
      const offline = path.join(outDir, 'offline.html')
      if (fs.existsSync(offline)) fs.writeFileSync(offline, fs.readFileSync(offline, 'utf8').replaceAll('__NX_LIVE_URL__', liveUrl(mode)))
    },
  }
}

export default defineConfig(({ mode }) => ({
  define: {
    __NX_BUILD_TIME__: JSON.stringify(BUILD_TIME),
    __NX_BUILD_COMMIT__: JSON.stringify(BUILD_COMMIT),
    __NX_BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [react(), liveUpdatePlugin(mode)],
  resolve: {
    alias: {
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@v2': fileURLToPath(new URL('./src/v2', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
      '@admin': fileURLToPath(new URL('./src/admin', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/shared/core', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor-react'
          if (id.includes('node_modules/firebase')) return 'vendor-firebase'
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/lucide-react')) return 'vendor-ui'
          if (id.includes('node_modules/recharts')) return 'vendor-charts'
          if (id.includes('node_modules/pdfjs-dist')) return 'vendor-pdf'
        }
      }
    }
  }
}))
