import fs from 'fs';
import path from 'path';

const STATIC_HTML_DIR = path.join(process.cwd(), 'static-html');

export const getStaticHTMLPath = (type, id = '') => {
    const fileName = id ? `${type}-${id}.html` : `${type}.html`;
    const filePath = path.join(STATIC_HTML_DIR, fileName);
    return fs.existsSync(filePath) ? filePath : null;
};

export const generateHomeHTML = async () => {
    // 服务端实现
};

export const generateUserProfileHTML = async (userId) => {
    // 服务端实现
};

export const generateWorkDetailHTML = async (workId) => {
    // 服务端实现
}; 