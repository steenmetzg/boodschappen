/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// De testversie (VITE_TEST=1) staat op /lijstjes/test/ en heet "Lijstjes TEST", zodat je hem naast de
// echte app kunt installeren. Zie ook src/storageKey.ts: hij heeft zijn eigen opslag.
const isTest = process.env.VITE_TEST === '1'

function testVersion(): Plugin {
  let outDir = 'dist'
  return {
    name: 'lijstjes-testversie',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    transformIndexHtml(html) {
      return isTest ? html.replaceAll('>Lijstjes<', '>Lijstjes TEST<').replace('content="Lijstjes"', 'content="Lijstjes TEST"') : html
    },
    closeBundle() {
      if (!isTest) return
      const file = resolve(outDir, 'manifest.webmanifest')
      const manifest = JSON.parse(readFileSync(file, 'utf8'))
      writeFileSync(file, JSON.stringify({ ...manifest, name: 'Lijstjes TEST', short_name: 'Lijstjes TEST' }, null, 2))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Relatieve paden, zodat de app ook vanuit een submap online kan staan.
  base: './',
  // Het versienummer uit package.json, getoond onderaan de instellingen.
  define: {
    __APP_VERSION__: JSON.stringify(JSON.parse(readFileSync('./package.json', 'utf8')).version),
  },
  plugins: [
    react(),
    testVersion(),
    // Service worker: bewaart alle bestanden van de app op de telefoon, zodat hij
    // offline werkt en installeerbaar is. Nieuwe versies worden op de achtergrond
    // opgehaald en zijn actief bij de volgende keer openen.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: false, // het manifest staat al in public/manifest.webmanifest
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
        // De testversie in de submap test/ heeft een eigen service worker; de echte app mag die
        // pagina's niet overnemen.
        navigateFallbackDenylist: [/\/test\//],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
