import fs from 'fs';
import path from 'path';

const STATIC_HTML_DIR = path.join(process.cwd(), 'static-html');

// 确保静态HTML目录存在
if (!fs.existsSync(STATIC_HTML_DIR)) {
    fs.mkdirSync(STATIC_HTML_DIR, { recursive: true });
} 