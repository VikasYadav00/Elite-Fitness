import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function spaRoutesPlugin() {
  return {
    name: 'spa-routes-generator',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      const indexHtmlPath = path.join(distDir, 'index.html')
      if (!fs.existsSync(indexHtmlPath)) return

      const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8')
      const routes = ['feedback', 'register', 'checkin', 'attendance', 'qr', 'complaint']

      routes.forEach((route) => {
        const routeDir = path.join(distDir, route)
        if (!fs.existsSync(routeDir)) {
          fs.mkdirSync(routeDir, { recursive: true })
        }
        fs.writeFileSync(path.join(routeDir, 'index.html'), htmlContent)
      })

      // Ensure 404.html is in dist
      const public404 = path.resolve(__dirname, 'public/404.html')
      const dist404 = path.join(distDir, '404.html')
      if (fs.existsSync(public404)) {
        fs.copyFileSync(public404, dist404)
      } else {
        fs.writeFileSync(dist404, htmlContent)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/Elite-Fitness/' : '/'),
  plugins: [react(), spaRoutesPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  }
})
