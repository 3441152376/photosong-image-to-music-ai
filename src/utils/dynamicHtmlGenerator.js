import fs from 'fs'
import path from 'path'
import { generateHTML, generateDynamicContent } from './htmlGenerator.js'
import { getPageTitle, getPageDescription } from './meta.js'

const DYNAMIC_DIR = path.join(process.cwd(), 'server/dynamic')

export function generateDynamicHTML(data, locale) {
  // 确保 data 对象包含必要的信息
  const pageData = {
    ...data,
    path: data.type === 'profile' ? '/profile/' + data.id : 
          data.type === 'work' ? '/work/' + data.id : '/'
  }

  return generateHTML({
    title: getPageTitle(pageData, locale),
    description: getPageDescription(pageData, locale),
    locale,
    content: generateDynamicContent(pageData, locale)
  })
}

export function generateDynamicContent(data, locale) {
  const t = messages[locale]
  
  switch (data.type) {
    case 'profile':
      return `
        <div class="profile-content">
          <h1>${data.username || 'User'}'s Profile</h1>
          <div class="profile-info">
            <p class="bio">${data.bio || t?.profile?.defaultBio || '这位用户还没有填写个人简介。'}</p>
            ${data.works ? `
              <section class="works-section">
                <h2>${t?.profile?.works || '作品列表'}</h2>
                <div class="works-grid">
                  ${data.works.map(work => `
                    <article class="work-card">
                      <h3>${work.title || 'Untitled'}</h3>
                      <p>${work.description || ''}</p>
                      <div class="work-meta">
                        <time datetime="${work.createdAt}">${new Date(work.createdAt).toLocaleDateString(locale)}</time>
                        <span class="style">${work.style || 'Default'}</span>
                      </div>
                    </article>
                  `).join('')}
                </div>
              </section>
            ` : ''}
          </div>
        </div>`;

    case 'work':
      return `
        <div class="work-content">
          <h2>${data.title || t?.work?.defaultTitle || 'Untitled'}</h2>
          <p>${data.description || ''}</p>
          <div class="work-details">
            <p>${t?.work?.author || 'Author'}: ${data.author || t?.work?.defaultAuthor || 'Anonymous'}</p>
            <p>${t?.work?.style || 'Style'}: ${data.style || t?.work?.defaultStyle || 'Default'}</p>
            <p>${t?.work?.createdAt || 'Created At'}: ${new Date(data.createdAt).toLocaleDateString(locale)}</p>
          </div>
        </div>`;

    default:
      return ''
  }
}

function parseDynamicPath(path) {
  if (path.startsWith('/profile/')) {
    return { type: 'profile', id: path.split('/')[2] }
  }
  if (path.startsWith('/work/')) {
    return { type: 'work', id: path.split('/')[2] }
  }
  throw new Error('Invalid dynamic path')
} 