# Photo Song 部署文档

## 目录

- [环境要求](#环境要求)
- [安装步骤](#安装步骤)
- [配置说明](#配置说明)
- [部署流程](#部署流程)
- [监控维护](#监控维护)
- [容器化部署](#容器化部署)
- [CI/CD 流程](#ci-cd-流程)
- [多环境配置](#多环境配置)

## 环境要求

### 系统要求
- Node.js >= 16.0.0
- NPM >= 8.0.0
- Vue.js 3.x
- Vite 4.x

### 服务器要求
- CPU: 2核心以上
- 内存: 4GB以上
- 存储: 20GB以上
- 操作系统: Ubuntu 20.04 LTS 或更高版本

### 依赖服务
- LeanCloud 数据存储
- OpenAI API
- Suno API
- Stripe 支付服务

## 安装步骤

### 1. 克隆代码
```bash
git clone https://github.com/your-repo/photo-song.git
cd photo-song
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
```bash
cp .env.example .env
# 编辑 .env 文件，填写必要的配置信息
```

### 4. 构建项目
```bash
npm run build
```

### 5. 启动服务
```bash
npm run start
```

## 配置说明

### 环境变量
```env
# 应用配置
NODE_ENV=production
PORT=3000

# API 配置
VITE_OPENAI_API_URL=your_openai_api_url
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_SUNO_API_URL=your_suno_api_url
VITE_SUNO_API_KEY=your_suno_api_key

# 数据库配置
VITE_LEANCLOUD_APP_ID=your_leancloud_app_id
VITE_LEANCLOUD_APP_KEY=your_leancloud_app_key

# 支付配置
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
VITE_STRIPE_SECRET_KEY=your_stripe_secret_key
```

### Nginx 配置
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 部署流程

### 1. 准备工作
- 确保服务器满足系统要求
- 准备好所有必要的API密钥
- 配置域名和SSL证书

### 2. 自动化部署
```bash
# 安装 PM2
npm install -g pm2

# 配置 PM2
pm2 ecosystem

# 编辑 ecosystem.config.js
module.exports = {
  apps: [{
    name: 'photo-song',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production'
    }
  }]
}

# 启动应用
pm2 start ecosystem.config.js
```

### 3. SSL 配置
```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

### 4. 数据库迁移
```bash
# 运行迁移脚本
npm run migrate
```

## 监控维护

### 1. 日志管理
```bash
# 查看应用日志
pm2 logs photo-song

# 设置日志轮转
pm2 install pm2-logrotate
```

### 2. 性能监控
```bash
# 监控应用状态
pm2 monit

# 查看性能指标
pm2 status
```

### 3. 备份策略
```bash
# 数据库备份
0 2 * * * /usr/local/bin/backup-db.sh

# 文件备份
0 3 * * * /usr/local/bin/backup-files.sh
```

### 4. 更新维护
```bash
# 更新应用
git pull
npm install
npm run build
pm2 reload photo-song

# 更新依赖
npm update
```

## 故障处理

### 1. 常见问题
- 502 Bad Gateway
  - 检查 Node.js 服务是否运行
  - 检查 Nginx 配置
  - 检查防火墙设置

- API 错误
  - 验证 API 密钥
  - 检查请求限制
  - 查看错误日志

### 2. 性能优化
- 启用 Gzip 压缩
- 配置浏览器缓存
- 使用 CDN 加速

### 3. 安全加固
- 启用 HTTPS
- 配置 CSP 头
- 启用防火墙
- 定期更新依赖

## 扩展建议

### 1. 负载均衡
```nginx
upstream photo_song {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}
```

### 2. 缓存策略
```nginx
location /static/ {
    expires 30d;
    add_header Cache-Control "public, no-transform";
}
```

### 3. 监控告警
```javascript
// 配置 Sentry
import * as Sentry from "@sentry/vue"

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV
})
```

## 容器化部署

### 1. Dockerfile
```dockerfile
# 构建阶段
FROM node:16-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 运行阶段
FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --production
EXPOSE 3000
CMD ["npm", "start"]
```

### 2. Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs
    restart: always
    depends_on:
      - redis
      - mongodb
  
  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
  
  mongodb:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  redis_data:
  mongo_data:
```

### 3. Kubernetes 配置
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: photo-song
spec:
  replicas: 3
  selector:
    matchLabels:
      app: photo-song
  template:
    metadata:
      labels:
        app: photo-song
    spec:
      containers:
      - name: photo-song
        image: photo-song:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
          requests:
            cpu: "500m"
            memory: "512Mi"
```

## CI/CD 流程

### 1. GitHub Actions
```yaml
name: CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
    - name: Run linting
      run: npm run lint
      
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to production
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /app/photo-song
          git pull
          docker-compose up -d --build
```

### 2. 自动化测试
```javascript
// 单元测试
npm run test:unit

// 集成测试
npm run test:integration

// E2E测试
npm run test:e2e
```

### 3. 自动化部署
```bash
# 构建镜像
docker build -t photo-song:latest .

# 推送到镜像仓库
docker push registry.example.com/photo-song:latest

# 更新服务
kubectl rollout restart deployment photo-song
```

## 多环境配置

### 1. 环境配置文件
```
.env.development    # 开发环境
.env.test          # 测试环境
.env.staging       # 预发布环境
.env.production    # 生产环境
```

### 2. 环境变量
```javascript
// 基础配置
const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    wsUrl: 'ws://localhost:3000'
  },
  test: {
    apiUrl: 'https://test-api.example.com',
    wsUrl: 'wss://test-api.example.com'
  },
  staging: {
    apiUrl: 'https://staging-api.example.com',
    wsUrl: 'wss://staging-api.example.com'
  },
  production: {
    apiUrl: 'https://api.example.com',
    wsUrl: 'wss://api.example.com'
  }
}
```

### 3. 环境切换
```bash
# 开发环境
npm run dev

# 测试环境
npm run build:test
npm run start:test

# 预发布环境
npm run build:staging
npm run start:staging

# 生产环境
npm run build:prod
npm run start:prod
``` 