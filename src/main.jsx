import { handleSEO } from './middleware/seo';
import { isCrawler } from './utils/crawler';

// 检查是否是爬虫访问
const userAgent = navigator.userAgent;
if (isCrawler(userAgent)) {
    // 如果是爬虫访问，生成静态HTML
    const path = window.location.pathname;
    const html = await handleSEO(path);
    document.documentElement.innerHTML = html;
} else {
    // 正常渲染React应用
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
} 