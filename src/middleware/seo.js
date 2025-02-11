import { isCrawler } from '../utils/crawler.js';
import { generateHTML } from '../utils/htmlGenerator.js';
import { generateStaticContent, generateDynamicContent } from '../utils/htmlGenerator.js';
import { getPageTitle, getPageDescription } from '../utils/meta.js';

// 只在服务端导入
let fs = null;
let path = null;

// 使用普通的 import() 而不是 top-level await
function loadServerModules() {
  if (typeof window === 'undefined') {
    return Promise.all([
      import('fs').then(module => { fs = module.default }),
      import('path').then(module => { path = module.default })
    ]);
  }
  return Promise.resolve();
}

/**
 * 客户端 SEO 处理
 */
export const handleSEO = async (path) => {
    const html = generateHTML({
        title: getPageTitle({ path }, 'zh'),
        description: getPageDescription({ path }, 'zh')
    });
    return html;
};

/**
 * SEO中间件 - 处理爬虫请求
 */
export const seoMiddleware = {
    install: (app) => {
        // 在客户端，我们只需要处理路由变化
        app.config.globalProperties.$handleSEO = async (to) => {
            try {
                const userAgent = navigator.userAgent;
                if (!isCrawler(userAgent)) {
                    return;
                }
                const { path, locale } = parsePath(to.path);
                const html = await getHTML(path, locale);
                if (html) {
                    document.documentElement.innerHTML = html;
                }
            } catch (error) {
                console.error('SEO middleware error:', error);
            }
        };
    }
};

/**
 * Express 中间件 - 处理所有请求
 */
export const expressSeoMiddleware = async (req, res, next) => {
    try {
        const userAgent = req.headers['user-agent'];
        const isViewSource = req.headers['sec-fetch-dest'] === 'document';
        
        // 如果不是爬虫或查看源码请求，直接返回 Vue 应用
        if (!isCrawler(userAgent) && !isViewSource) {
            return next();
        }

        const { path, locale } = parsePath(req.path);
        let content = '';
        let data = { path };
        
        // 根据路径生成不同的内容
        if (path === '/' || path === '/about') {
            content = generateStaticContent(path, locale);
        } else if (path.startsWith('/profile/') || path.startsWith('/work/')) {
            data = await fetchData(path, locale);
            if (data) {
                content = generateDynamicContent({
                    ...data,
                    path  // 确保包含 path 属性
                }, locale);
            }
        }

        // 生成完整的 HTML
        const html = generateHTML({
            title: getPageTitle(data, locale),
            description: getPageDescription(data, locale),
            locale,
            content,
            path,
            url: `https://photosong.com/${locale}${path === '/' ? '' : path}`
        });

        // 确保只发送一次响应
        if (!res.headersSent) {
            res.set('Content-Language', locale);
            res.set('Content-Type', 'text/html; charset=utf-8');
            return res.send(html);
        }
    } catch (error) {
        console.error('SEO middleware error:', error);
        next();
    }
};

/**
 * 获取静态 HTML 文件路径 (仅服务端)
 */
function getStaticHtmlPath(routePath, locale) {
    if (typeof window !== 'undefined') return '';
    
    const STATIC_DIR = path.join(process.cwd(), 'dist/static');
    
    if (routePath === '/') {
        return path.join(STATIC_DIR, locale, 'index.html');
    }
    
    if (routePath.startsWith('/profile/')) {
        const userId = routePath.split('/')[2];
        return path.join(STATIC_DIR, locale, 'profile', `${userId}.html`);
    }
    
    if (routePath.startsWith('/work/')) {
        const workId = routePath.split('/')[2];
        return path.join(STATIC_DIR, locale, 'work', `${workId}.html`);
    }
    
    return path.join(STATIC_DIR, locale, `${routePath.slice(1)}.html`);
}

function parsePath(fullPath) {
    const parts = fullPath.split('/').filter(Boolean);
    const locale = ['en', 'ru', 'zh'].includes(parts[0]) ? parts[0] : 'zh';
    const pathParts = parts.slice(locale === parts[0] ? 1 : 0);
    const path = '/' + pathParts.join('/');
    
    return { path, locale };
}

async function fetchData(path, locale) {
    if (path.startsWith('/work/')) {
        const workId = path.split('/')[2];
        const content = {
            zh: {
                title: '测试作品',
                description: '这是一个测试作品的详细描述',
                author: '测试作者',
                style: '古典'
            },
            en: {
                title: 'Test Work',
                description: 'This is a test work description',
                author: 'Test Author',
                style: 'Classical'
            },
            ru: {
                title: 'Тестовая работа',
                description: 'Это описание тестовой работы',
                author: 'Тестовый автор',
                style: 'Классический'
            }
        };
        
        return {
            type: 'work',
            id: workId,
            ...content[locale],  // 根据语言返回对应内容
            createdAt: new Date()
        };
    }
    return null;
}

async function getHTML(routePath, locale) {
    try {
        let content = '';
        let data = { path: routePath };
        
        // 根据路径生成不同的内容
        if (routePath === '/' || routePath === '/about') {
            content = generateStaticContent(routePath, locale);
        } else if (routePath.startsWith('/profile/') || routePath.startsWith('/work/')) {
            data = await fetchData(routePath, locale);
            if (data) {
                content = generateDynamicContent(data, locale);
            }
        }

        const html = generateHTML({
            title: getPageTitle(data, locale),
            description: getPageDescription(data, locale),
            locale,
            content
        });
        return html;
    } catch (error) {
        console.error('Failed to generate HTML:', error);
        return null;
    }
} 