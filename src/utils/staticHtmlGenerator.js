import fs from 'fs'
import path from 'path'
import { generateHTML, generateStaticContent } from './htmlGenerator.js'
import { getPageTitle, getPageDescription } from './meta.js'

const STATIC_DIR = path.join(process.cwd(), 'server/static')

export async function generateStaticPages() {
  const locales = ['zh', 'en', 'ru']
  const routes = ['/', '/about']

  for (const locale of locales) {
    for (const route of routes) {
      await generateStaticPage(route, locale)
    }
  }
}

async function generateStaticPage(routePath, locale) {
  const content = generateStaticContent(routePath, locale)
  
  const html = generateHTML({
    title: getPageTitle({ path: routePath }, locale),
    description: getPageDescription({ path: routePath }, locale),
    locale,
    content
  })

  const fileName = routePath === '/' ? 'index.html' : `${routePath.slice(1)}.html`
  const filePath = path.join(STATIC_DIR, locale, fileName)
  
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, html)
} 