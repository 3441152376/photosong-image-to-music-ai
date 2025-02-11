# PhotoSong 支付 API 文档

## 基础信息

- 基础URL: `https://pay.photosong.com/api`
- 所有请求都应该使用 HTTPS
- 所有响应都是 JSON 格式

## 接口列表

### 1. 创建支付会话

**请求**
- 方法: `POST`
- 路径: `/create-checkout-session`
- Content-Type: `application/json`

**请求参数**
```json
{
  "priceId": "price_xxx",  // Stripe价格ID，系统会自动检测是订阅还是一次性支付
  "metadata": {
    "userId": "用户ID",
    "userEmail": "用户邮箱",
    "username": "用户名",
    "locale": "语言",
    "planType": "计划类型",
    "plan": "计划名称",
    "timestamp": "时间戳",
    "priceId": "价格ID"
  },
  "paymentMethodTypes": ["card"],  // 可选，默认为 ["card"]
  "successUrl": "支付成功跳转URL",
  "cancelUrl": "支付取消跳转URL",
  "customerEmail": "客户邮箱",
  "allowPromotionCodes": false,    // 可选，默认为 false
  "locale": "zh"                   // 可选，默认为 "zh"
}
```

**说明**
- 系统会自动检测 `priceId` 对应的价格类型：
  - 如果是循环付费价格（recurring），将自动使用 `subscription` 模式
  - 如果是一次性价格，将自动使用 `payment` 模式
- 不需要手动指定 `mode` 参数，系统会自动处理

**响应**
```json
{
  "id": "cs_live_xxx",
  "url": "https://checkout.stripe.com/xxx",
  "status": "open"
}
```

**错误响应**
除了通用错误响应外，还可能出现以下特定错误：
```json
{
  "error": "Invalid metadata",
  "details": "Missing required metadata fields: field1, field2"
}
```
或
```json
{
  "error": "server_error",
  "message": "Failed to create checkout session",
  "details": "具体错误信息"
}
```

### 2. 查询支付状态

**请求**
- 方法: `GET`
- 路径: `/check-payment-status/:sessionId`

**响应**
```json
{
  "status": "unpaid",
  "amount_total": 500,
  "currency": "usd",
  "customer": "cus_xxx",
  "payment_intent": "pi_xxx",
  "metadata": {
    // 支付会话的元数据
  }
}
```

### 3. 查询支付会话元数据

**请求**
- 方法: `GET`
- 路径: `/payment/metadata/:sessionId`

**响应**
```json
{
  "status": "unpaid",
  "amount": 500,
  "currency": "usd",
  "paymentIntent": {
    "id": "pi_xxx",
    "status": "succeeded"
  },
  "customer": "cus_xxx",
  "lineItems": {
    // 商品明细
  },
  "metadata": {
    // 支付会话的元数据
  },
  "createdAt": "2024-02-02T20:00:00Z",
  "expiresAt": "2024-02-03T20:00:00Z"
}
```

### 4. 记录支付取消

**请求**
- 方法: `POST`
- 路径: `/payment/cancel`
- Content-Type: `application/json`

**请求参数**
```json
{
  "sessionId": "cs_live_xxx",
  "reason": "取消原因",
  "feedback": "取消反馈",
  "timestamp": "取消时间"
}
```

**响应**
```json
{
  "success": true,
  "message": "Cancel recorded",
  "cancelInfo": {
    "sessionId": "cs_live_xxx",
    "originalStatus": "open",
    "cancelReason": "price_too_high",
    "cancelFeedback": "价格太贵了",
    "canceledAt": "2024-02-02T20:00:00Z",
    "metadata": {
      // 支付会话的元数据
    }
  }
}
```

## 错误响应

所有接口在发生错误时都会返回统一的错误格式：

```json
{
  "error": "error_type",
  "message": "错误描述",
  "details": "详细错误信息"
}
```

常见错误类型：
- `server_error`: 服务器内部错误
- `invalid_request`: 请求参数错误
- `invalid_metadata`: 元数据字段缺失或无效

## 目录
- [基本信息](#基本信息)
- [接口说明](#接口说明)
- [支付流程](#支付流程)
- [错误处理](#错误处理)
- [测试指南](#测试指南)

## 基本信息

### 环境信息
| 环境 | 接口域名 |
|------|----------|
| 生产环境 | `https://pay.photosong.com` |
| 测试环境 | `http://localhost:3002` |

### 通用说明
- 接口采用 RESTful 规范
- 请求与响应均使用 JSON 格式
- 时间格式：ISO 8601 标准
- 货币单位：美元（USD）
- 金额单位：分（cent）

## 接口说明

### 1. 创建支付会话

**接口地址：** `POST /api/create-checkout-session`

**请求参数：**
```json
{
    "priceId": "price_xxx" // Stripe价格ID
}
```

**响应数据：**
```json
{
    "url": "https://checkout.stripe.com/xxx" // 支付页面URL
}
```

**可用价格ID：**
| 套餐名称 | 价格(USD) | 价格ID | 说明 |
|---------|-----------|--------|------|
| Starter Plan | $5 | price_1QlYNRHVMy0i1BlJA1y0DxB2 | 入门套餐 |
| Advanced Plan | $15 | price_1QlYO1HVMy0i1BlJyDD3GlsN | 高级套餐 |
| Professional Plan | $99 | price_1QlYOaHVMy0i1BlJ1ZpdOMAO | 专业套餐 |
| Lifetime Plan | $400 | price_1QlYOrHVMy0i1BlJDHxIswM7 | 终身套餐 |
| Small Points | $2 | price_1Qme87HVMy0i1BlJR1PRWOgz | 小额积分包 |
| Medium Points | $5 | price_1Qme9BHVMy0i1BlJwFyjwZwj | 中额积分包 |
| Large Points | $12 | price_1QmeA6HVMy0i1BlJQD5dc34Z | 大额积分包 |

### 2. 查询支付状态

**接口地址：** 
- `GET /api/check-payment-status/{CHECKOUT_SESSION_ID}`
- `GET /api/payment/check/{CHECKOUT_SESSION_ID}`

**路径参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| CHECKOUT_SESSION_ID | string | 是 | 支付会话ID |

**响应数据：**
```json
{
    "status": "paid",          // 支付状态
    "amount": 500,             // 支付金额（分）
    "currency": "usd",         // 货币类型
    "paymentIntent": "pi_xxx", // 支付意向ID
    "customer": "cus_xxx"      // 客户ID
}
```

**状态说明：**
| 状态值 | 说明 | 处理建议 |
|--------|------|----------|
| paid | 支付成功 | 开始提供服务 |
| unpaid | 未支付 | 等待用户完成支付 |
| expired | 已过期 | 建议重新发起支付 |
| canceled | 已取消 | 可以重新发起支付 |

## 支付流程

1. 创建支付会话
   ```javascript
   const response = await fetch('https://pay.photosong.com/api/create-checkout-session', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ priceId: 'price_xxx' })
   });
   const { url } = await response.json();
   ```

2. 重定向到支付页面
   ```javascript
   window.location.href = url;
   ```

3. 查询支付状态
   ```javascript
   const response = await fetch(
       `https://pay.photosong.com/api/check-payment-status/${sessionId}`
   );
   const result = await response.json();
   ```

## 错误处理

### HTTP 状态码
| 状态码 | 说明 | 处理建议 |
|--------|------|----------|
| 200 | 请求成功 | - |
| 400 | 参数错误 | 检查请求参数 |
| 401 | 未授权 | 检查认证信息 |
| 404 | 资源不存在 | 检查ID是否正确 |
| 500 | 服务器错误 | 稍后重试 |

### 错误响应格式
```json
{
    "error": "错误信息描述"
}
```

## 测试指南

### 测试卡号
```
成功卡号：4242 4242 4242 4242
失败卡号：4000 0000 0000 0002
有效期：任何未来日期
CVC：任意三位数
邮编：任意五位数
```

### 接口测试示例

1. 创建支付会话：
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"priceId": "price_1QlYNRHVMy0i1BlJA1y0DxB2"}' \
  https://pay.photosong.com/api/create-checkout-session
```

2. 查询支付状态：
```bash
curl https://pay.photosong.com/api/check-payment-status/cs_test_xxx
```

### 测试工具
- [在线测试页面](https://pay.photosong.com/test.html)
- [Stripe 测试面板](https://dashboard.stripe.com/test/payments)

## 最佳实践

1. 支付状态查询
   - 实现轮询机制
   - 合理设置重试间隔
   - 处理超时情况

2. 错误处理
   - 记录详细错误日志
   - 实现优雅降级
   - 提供友好错误提示

3. 安全建议
   - 使用 HTTPS
   - 验证所有输入
   - 实现请求签名

## 更新日志

### v1.2.0 (2024-02-25)
- 添加积分套餐支持
- 完善支付状态查询
- 优化错误处理

### v1.1.0 (2024-02-20)
- 添加新的支付状态
- 完善错误处理
- 补充接口文档

### v1.0.0 (2024-02-01)
- 初始版本发布 

## 代码示例

### JavaScript/TypeScript (使用 axios)

```javascript
// 创建支付会话
const createCheckoutSession = async (priceId, userInfo) => {
  try {
    const response = await axios.post('https://pay.photosong.com/api/create-checkout-session', {
      priceId,
      metadata: {
        userId: userInfo.id,
        userEmail: userInfo.email,
        username: userInfo.name,
        locale: 'zh',
        planType: 'premium',
        plan: 'yearly',
        timestamp: new Date().toISOString(),
        priceId
      },
      successUrl: 'https://photosong.com/payment/success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://photosong.com/payment/cancel',
      customerEmail: userInfo.email,
      allowPromotionCodes: true
    });

    // 重定向到 Stripe Checkout 页面
    window.location.href = response.data.url;
  } catch (error) {
    console.error('支付会话创建失败:', error.response?.data || error.message);
    throw error;
  }
};

// 查询支付状态
const checkPaymentStatus = async (sessionId) => {
  try {
    const response = await axios.get(`https://pay.photosong.com/api/check-payment-status/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('支付状态查询失败:', error.response?.data || error.message);
    throw error;
  }
};

// 记录支付取消
const recordPaymentCancel = async (sessionId, reason) => {
  try {
    const response = await axios.post('https://pay.photosong.com/api/payment/cancel', {
      sessionId,
      reason,
      feedback: '价格太贵了',
      timestamp: new Date().toISOString()
    });
    return response.data;
  } catch (error) {
    console.error('取消记录失败:', error.response?.data || error.message);
    throw error;
  }
};
```

### React 组件示例

```tsx
import { useState } from 'react';
import axios from 'axios';

interface PaymentProps {
  priceId: string;
  userInfo: {
    id: string;
    email: string;
    name: string;
  };
}

const PaymentButton: React.FC<PaymentProps> = ({ priceId, userInfo }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('https://pay.photosong.com/api/create-checkout-session', {
        priceId,
        metadata: {
          userId: userInfo.id,
          userEmail: userInfo.email,
          username: userInfo.name,
          locale: 'zh',
          planType: 'premium',
          plan: 'yearly',
          timestamp: new Date().toISOString(),
          priceId
        },
        successUrl: 'https://photosong.com/payment/success?session_id={CHECKOUT_SESSION_ID}',
        cancelUrl: 'https://photosong.com/payment/cancel',
        customerEmail: userInfo.email
      });

      // 重定向到支付页面
      window.location.href = response.data.url;
    } catch (err) {
      setError(err.response?.data?.message || '支付初始化失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handlePayment} 
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        {loading ? '处理中...' : '立即支付'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default PaymentButton;
```

### Python 示例

```python
import requests
from datetime import datetime

class PaymentAPI:
    def __init__(self, base_url='https://pay.photosong.com/api'):
        self.base_url = base_url

    def create_checkout_session(self, price_id, user_info):
        url = f"{self.base_url}/create-checkout-session"
        
        payload = {
            "priceId": price_id,
            "metadata": {
                "userId": user_info["id"],
                "userEmail": user_info["email"],
                "username": user_info["name"],
                "locale": "zh",
                "planType": "premium",
                "plan": "yearly",
                "timestamp": datetime.utcnow().isoformat(),
                "priceId": price_id
            },
            "successUrl": "https://photosong.com/payment/success?session_id={CHECKOUT_SESSION_ID}",
            "cancelUrl": "https://photosong.com/payment/cancel",
            "customerEmail": user_info["email"]
        }

        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error creating checkout session: {e}")
            raise

    def check_payment_status(self, session_id):
        url = f"{self.base_url}/check-payment-status/{session_id}"
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error checking payment status: {e}")
            raise

# 使用示例
payment_api = PaymentAPI()

# 创建支付会话
user_info = {
    "id": "user_123",
    "email": "user@example.com",
    "name": "Test User"
}

try:
    session = payment_api.create_checkout_session("price_xxx", user_info)
    print(f"Checkout URL: {session['url']}")
except Exception as e:
    print(f"Payment failed: {e}")
```

### 错误处理最佳实践

```javascript
// 统一错误处理
const handlePaymentError = (error) => {
  if (error.response) {
    // 服务器返回的错误
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        // 处理请求参数错误
        if (data.error === 'Invalid metadata') {
          return `缺少必要的支付信息: ${data.details}`;
        }
        return '请求参数错误，请检查输入';
        
      case 401:
        return '未授权的访问，请先登录';
        
      case 500:
        if (data.error === 'server_error') {
          return `服务器处理失败: ${data.message}`;
        }
        return '服务器内部错误，请稍后重试';
        
      default:
        return '支付服务暂时不可用，请稍后重试';
    }
  }
  
  if (error.request) {
    // 请求发送失败
    return '网络连接失败，请检查网络设置';
  }
  
  // 其他错误
  return '支付初始化失败，请重试';
};

// 使用示例
try {
  await createCheckoutSession(priceId, userInfo);
} catch (error) {
  const errorMessage = handlePaymentError(error);
  showErrorToast(errorMessage);
}
```

## 测试指南

### 测试卡号
- Visa 成功: 4242 4242 4242 4242
- Visa 失败: 4000 0000 0000 0002
- 需要 3D 验证: 4000 0000 0000 3220

### 测试流程
1. 使用测试价格 ID（以 `price_test_` 开头）
2. 填写测试卡信息：
   - 卡号：使用上述测试卡号
   - 有效期：任何未来日期
   - CVC：任意三位数
   - 持卡人姓名：任意名称
3. 使用测试邮箱（如 `test@example.com`）

### 测试流程
1. 使用测试价格 ID（以 `price_test_` 开头）
2. 填写测试卡信息：
   - 卡号：使用上述测试卡号
   - 有效期：任何未来日期
   - CVC：任意三位数
   - 持卡人姓名：任意名称
3. 使用测试邮箱（如 `test@example.com`）

完整参考
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PhotoSong 支付测试</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.7/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div id="app" class="container mx-auto px-4 py-8">
        <!-- 标题 -->
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">PhotoSong 支付测试</h1>
            <p class="text-gray-600">用于测试支付流程的各个环节</p>
        </div>

        <!-- 测试配置 -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">测试配置</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">API 基础地址</label>
                    <input type="text" v-model="config.apiBase" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例如: https://pay.photosong.com/api">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">价格 ID</label>
                    <select v-model="config.priceId" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="price_1QlYNRHVMy0i1BlJA1y0DxB2">Starter Plan ($5)</option>
                        <option value="price_1QlYO1HVMy0i1BlJyDD3GlsN">Advanced Plan ($15)</option>
                        <option value="price_1QlYOaHVMy0i1BlJ1ZpdOMAO">Professional Plan ($99)</option>
                        <option value="price_1QlYOrHVMy0i1BlJDHxIswM7">Lifetime Plan ($400)</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- 测试步骤 -->
        <div class="space-y-6">
            <!-- 1. 创建支付会话 -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold mb-4">1. 创建支付会话</h3>
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">用户邮箱</label>
                            <input type="email" v-model="checkoutData.customerEmail" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="test@example.com">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
                            <input type="text" v-model="checkoutData.metadata.username" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Test User">
                        </div>
                    </div>
                    <button @click="createCheckoutSession" 
                        class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        :disabled="loading.create">
                        {{ loading.create ? '创建中...' : '创建支付会话' }}
                    </button>
                    <div v-if="results.create" class="mt-4">
                        <div class="bg-gray-50 rounded p-4">
                            <pre class="text-sm overflow-auto">{{ JSON.stringify(results.create, null, 2) }}</pre>
                        </div>
                        <div v-if="results.create.url" class="mt-4">
                            <a :href="results.create.url" target="_blank" 
                                class="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                                打开支付页面
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. 查询支付状态 -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold mb-4">2. 查询支付状态</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">会话 ID</label>
                        <input type="text" v-model="sessionId" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="cs_live_xxxxx">
                    </div>
                    <button @click="checkPaymentStatus" 
                        class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        :disabled="loading.status">
                        {{ loading.status ? '查询中...' : '查询支付状态' }}
                    </button>
                    <div v-if="results.status" class="mt-4">
                        <div class="bg-gray-50 rounded p-4">
                            <pre class="text-sm overflow-auto">{{ JSON.stringify(results.status, null, 2) }}</pre>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. 查询元数据 -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold mb-4">3. 查询元数据</h3>
                <div class="space-y-4">
                    <button @click="checkMetadata" 
                        class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        :disabled="loading.metadata">
                        {{ loading.metadata ? '查询中...' : '查询元数据' }}
                    </button>
                    <div v-if="results.metadata" class="mt-4">
                        <div class="bg-gray-50 rounded p-4">
                            <pre class="text-sm overflow-auto">{{ JSON.stringify(results.metadata, null, 2) }}</pre>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 4. 取消支付 -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold mb-4">4. 取消支付</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">取消原因</label>
                        <select v-model="cancelData.reason" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                            <option value="price_too_high">价格太高</option>
                            <option value="changed_mind">改变主意</option>
                            <option value="technical_issue">技术问题</option>
                            <option value="other">其他原因</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">反馈信息</label>
                        <textarea v-model="cancelData.feedback" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                            placeholder="请输入取消原因的详细说明"></textarea>
                    </div>
                    <button @click="cancelPayment" 
                        class="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        :disabled="loading.cancel">
                        {{ loading.cancel ? '取消中...' : '取消支付' }}
                    </button>
                    <div v-if="results.cancel" class="mt-4">
                        <div class="bg-gray-50 rounded p-4">
                            <pre class="text-sm overflow-auto">{{ JSON.stringify(results.cancel, null, 2) }}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const { createApp, ref, reactive, watch } = Vue;

        createApp({
            setup() {
                // 配置
                const config = reactive({
                    apiBase: 'http://localhost:3002/api',
                    priceId: 'price_1QlYNRHVMy0i1BlJA1y0DxB2'
                });

                // 会话ID
                const sessionId = ref('');

                // 加载状态
                const loading = reactive({
                    create: false,
                    status: false,
                    metadata: false,
                    cancel: false
                });

                // 结果数据
                const results = reactive({
                    create: null,
                    status: null,
                    metadata: null,
                    cancel: null
                });

                // 创建会话数据
                const checkoutData = reactive({
                    successUrl: 'http://localhost:3002/test.html?session_id={CHECKOUT_SESSION_ID}',
                    cancelUrl: 'http://localhost:3002/test.html',
                    metadata: {
                        userId: 'test_123',
                        userEmail: 'test@example.com',
                        username: 'Test User',
                        locale: 'zh',
                        planType: 'subscription',
                        plan: 'starter',
                        timestamp: new Date().toISOString(),
                        priceId: config.priceId
                    },
                    customerEmail: 'test@example.com',
                    mode: 'payment',
                    locale: 'zh',
                    paymentMethodTypes: ['card'],
                    allowPromotionCodes: true
                });

                // 监听 priceId 变化
                watch(() => config.priceId, (newPriceId) => {
                    checkoutData.metadata.priceId = newPriceId;
                });

                // 取消数据
                const cancelData = reactive({
                    reason: 'price_too_high',
                    feedback: ''
                });

                // API 请求函数
                const makeRequest = async (method, url, data = null) => {
                    try {
                        const apiUrl = `${config.apiBase}${url}`;
                        console.log('请求URL:', apiUrl);
                        
                        const requestConfig = {
                            method,
                            url: apiUrl,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        };

                        if (data) {
                            requestConfig.data = data;
                            console.log('请求数据:', data);
                        }

                        const response = await axios(requestConfig);
                        console.log('响应数据:', response.data);
                        return response.data;
                    } catch (error) {
                        console.error('API请求失败:', error);
                        if (error.response) {
                            console.error('错误响应:', error.response.data);
                        }
                        throw error;
                    }
                };

                // 1. 创建支付会话
                const createCheckoutSession = async () => {
                    loading.create = true;
                    try {
                        // 构建请求数据
                        const data = {
                            priceId: config.priceId,
                            ...checkoutData,
                            metadata: {
                                ...checkoutData.metadata,
                                priceId: config.priceId
                            }
                        };
                        console.log('创建支付会话，数据:', data);
                        
                        const result = await makeRequest('POST', '/create-checkout-session', data);
                        results.create = result;
                        
                        if (result.url) {
                            const urlObj = new URL(result.url);
                            const pathParts = urlObj.pathname.split('/');
                            sessionId.value = pathParts[pathParts.length - 1].split('#')[0];
                            console.log('提取的会话ID:', sessionId.value);
                        }
                    } catch (error) {
                        console.error('创建支付会话失败:', error);
                        const errorMessage = error.response?.data?.details || error.response?.data?.message || error.message;
                        alert('创建支付会话失败: ' + errorMessage);
                    } finally {
                        loading.create = false;
                    }
                };

                // 2. 查询支付状态
                const checkPaymentStatus = async () => {
                    if (!sessionId.value) {
                        alert('请先创建支付会话或输入会话ID');
                        return;
                    }
                    loading.status = true;
                    try {
                        results.status = await makeRequest('GET', `/check-payment-status/${sessionId.value}`);
                    } catch (error) {
                        console.error('查询支付状态失败:', error);
                        alert('查询支付状态失败: ' + (error.response?.data?.message || error.message));
                    } finally {
                        loading.status = false;
                    }
                };

                // 3. 查询元数据
                const checkMetadata = async () => {
                    if (!sessionId.value) {
                        alert('请先创建支付会话或输入会话ID');
                        return;
                    }
                    loading.metadata = true;
                    try {
                        results.metadata = await makeRequest('GET', `/payment/metadata/${sessionId.value}`);
                    } catch (error) {
                        console.error('查询元数据失败:', error);
                        alert('查询元数据失败: ' + (error.response?.data?.message || error.message));
                    } finally {
                        loading.metadata = false;
                    }
                };

                // 4. 取消支付
                const cancelPayment = async () => {
                    if (!sessionId.value) {
                        alert('请先创建支付会话或输入会话ID');
                        return;
                    }
                    loading.cancel = true;
                    try {
                        const data = {
                            sessionId: sessionId.value,
                            ...cancelData,
                            timestamp: new Date().toISOString()
                        };
                        results.cancel = await makeRequest('POST', '/payment/cancel', data);
                    } catch (error) {
                        console.error('取消支付失败:', error);
                        alert('取消支付失败: ' + (error.response?.data?.message || error.message));
                    } finally {
                        loading.cancel = false;
                    }
                };

                // 检查 URL 参数
                const checkUrlParams = () => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const urlSessionId = urlParams.get('session_id');
                    if (urlSessionId) {
                        sessionId.value = urlSessionId;
                        checkPaymentStatus();
                    }
                };

                // 页面加载时检查 URL 参数
                checkUrlParams();

                return {
                    config,
                    sessionId,
                    loading,
                    results,
                    checkoutData,
                    cancelData,
                    createCheckoutSession,
                    checkPaymentStatus,
                    checkMetadata,
                    cancelPayment
                };
            }
        }).mount('#app');
    </script>
</body>
</html> 