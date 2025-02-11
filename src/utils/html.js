import { messages } from '../i18n'

export function generateFullHtml({ content, title, description, locale, data = {} }) {
  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="${getOgType(data)}">
    <meta property="og:locale" content="${locale}">
    
    <!-- Preload Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Styles -->
    <link rel="stylesheet" href="/assets/index.css">
</head>
<body>
    <div id="app">${content}</div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>`.trim()
}

function getOgType(data) {
  if (data.type === 'profile') return 'profile'
  if (data.type === 'work') return 'article'
  return 'website'
}

export function getPageTitle(route, locale) {
  const t = messages[locale]
  const path = route.path

  if (path === '/') return t.home.title
  if (path === '/about') return t.about.title
  if (path.startsWith('/profile/')) return t.profile.title
  if (path.startsWith('/work/')) return t.work.title
  
  return 'PhotoSong'
}

export function getPageDescription(route, locale) {
  const t = messages[locale]
  const path = route.path

  if (path === '/') return t.home.description
  if (path === '/about') return t.about.description
  if (path.startsWith('/profile/')) return t.profile.description
  if (path.startsWith('/work/')) return t.work.description
  
  return t.common.defaultDescription
} 