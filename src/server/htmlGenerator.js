import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import AV from 'leancloud-storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// HTML 模板路径
const TEMPLATE_DIR = path.join(__dirname, '../templates');
const OUTPUT_DIR = path.join(__dirname, '../../public/static');

// 确保目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 读取HTML模板
 * @param {string} templateName - 模板名称
 * @returns {string} - 模板内容
 */
const readTemplate = (templateName) => {
  const templatePath = path.join(TEMPLATE_DIR, `${templateName}.html`);
  return fs.readFileSync(templatePath, 'utf-8');
};

/**
 * 生成用户主页的静态HTML
 * @param {string} userId - 用户ID
 */
export const generateUserProfileHTML = async (userId) => {
  try {
    const user = await new AV.Query('_User')
      .equalTo('objectId', userId)
      .first();
    
    if (!user) throw new Error('User not found');

    const template = readTemplate('user-profile');
    const html = template
      .replace('{{username}}', user.get('username'))
      .replace('{{bio}}', user.get('bio') || '')
      .replace('{{avatar}}', user.get('avatar') || '/default-avatar.png');

    const outputPath = path.join(OUTPUT_DIR, `user-${userId}.html`);
    fs.writeFileSync(outputPath, html);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating user profile HTML:', error);
    throw error;
  }
};

/**
 * 生成作品详情页的静态HTML
 * @param {string} workId - 作品ID
 */
export const generateWorkDetailHTML = async (workId) => {
  try {
    const work = await new AV.Query('Work')
      .equalTo('objectId', workId)
      .include('user')
      .first();
    
    if (!work) throw new Error('Work not found');

    const template = readTemplate('work-detail');
    const html = template
      .replace('{{title}}', work.get('title'))
      .replace('{{description}}', work.get('description') || '')
      .replace('{{imageUrl}}', work.get('imageUrl'))
      .replace('{{author}}', work.get('user')?.get('username') || 'Anonymous')
      .replace('{{style}}', work.get('style') || '');

    const outputPath = path.join(OUTPUT_DIR, `work-${workId}.html`);
    fs.writeFileSync(outputPath, html);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating work detail HTML:', error);
    throw error;
  }
};

/**
 * 生成首页的静态HTML
 */
export const generateHomeHTML = async () => {
  try {
    const template = readTemplate('home');
    const works = await new AV.Query('Work')
      .limit(10)
      .descending('createdAt')
      .find();

    const worksHtml = works.map(work => `
      <div class="work-card">
        <img src="${work.get('imageUrl')}" alt="${work.get('title')}">
        <h3>${work.get('title')}</h3>
        <p>${work.get('description') || ''}</p>
      </div>
    `).join('');

    const html = template.replace('{{recentWorks}}', worksHtml);
    
    const outputPath = path.join(OUTPUT_DIR, 'home.html');
    fs.writeFileSync(outputPath, html);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating home HTML:', error);
    throw error;
  }
};

/**
 * 获取静态HTML文件路径
 * @param {string} type - 页面类型 ('user'|'work'|'home')
 * @param {string} id - 资源ID（用户ID或作品ID）
 * @returns {string|null} - HTML文件路径，如果不存在返回null
 */
export const getStaticHTMLPath = (type, id = null) => {
  let fileName;
  switch (type) {
    case 'user':
      fileName = `user-${id}.html`;
      break;
    case 'work':
      fileName = `work-${id}.html`;
      break;
    case 'home':
      fileName = 'home.html';
      break;
    default:
      return null;
  }

  const filePath = path.join(OUTPUT_DIR, fileName);
  return fs.existsSync(filePath) ? filePath : null;
}; 