# Stripe支付系统前端对接文档

## 基本信息

- 接口基础URL: 
  - 生产环境：`https://pay.photosong.com/api`
  - 测试环境：`http://localhost:3002/api`
- 所有请求和响应均使用JSON格式
- 所有金额均以美元计价
- API 限流：每个IP每分钟最多100次请求
- 并发请求：支持并发，建议单个客户端并发不超过10个请求

## 可用的商品套餐

| 套餐名称 | 价格(USD) | 价格ID | 说明 |
|---------|-----------|--------|------|
| Starter Plan | $5 | `price_1QlYNRHVMy0i1BlJA1y0DxB2` | 入门套餐 |
| Advanced Plan | $15 | `price_1QlYO1HVMy0i1BlJyDD3GlsN` | 高级套餐 |
| Professional Plan | $99 | `price_1QlYOaHVMy0i1BlJ1ZpdOMAO` | 专业套餐 |
| Lifetime Plan | $400 | `price_1QlYOrHVMy0i1BlJDHxIswM7` | 终身套餐 |
| Small Points Pack | $2 | `price_1Qme87HVMy0i1BlJR1PRWOgz` | 小额积分包 |
| Medium Points Pack | $5 | `price_1Qme9BHVMy0i1BlJwFyjwZwj` | 中额积分包 |
| Large Points Pack | $12 | `price_1QmeA6HVMy0i1BlJQD5dc34Z` | 大额积分包 |

## API接口

### 1. 创建支付会话

**请求方式：** POST  
**接口地址：** `/create-checkout-session`  
**Content-Type：** `application/json`

**请求参数：**
```json
{
  "priceId": "price_xxx" // 使用上面列出的价格ID
}
```

**成功响应：**
```json
{
  "url": "https://checkout.stripe.com/xxx", // Stripe支付页面URL
  "sessionId": "cs_xxx" // 支付会话ID，用于后续查询支付状态
}
```

**错误响应：**
```json
{
  "error": {
    "code": "error_code",
    "message": "错误信息",
    "type": "error_type"
  }
}
```

**错误码说明：**
| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| invalid_price_id | 无效的价格ID | 检查价格ID是否正确 |
| price_not_found | 价格不存在 | 确认价格ID是否已失效 |
| currency_not_supported | 不支持的货币 | 使用支持的货币类型 |
| amount_too_small | 金额太小 | 确保金额大于最小支付限额 |
| amount_too_large | 金额太大 | 确保金额小于最大支付限额 |
| rate_limit_exceeded | 超出请求限制 | 降低请求频率 |

### 2. 查询支付状态

**请求方式：** GET  
**接口地址：** `/check-payment-status/:sessionId`  
**参数说明：** sessionId 为支付会话ID，从支付成功回调URL中获取

**成功响应：**
```json
{
  "status": "paid" // 支付状态
}
```

**支付状态说明：**
| 状态 | 说明 | 后续处理建议 |
|------|------|--------------|
| paid | 支付成功 | 可以开始提供服务 |
| unpaid | 未支付 | 等待用户完成支付 |
| processing | 处理中 | 等待最终支付结果 |
| expired | 已过期 | 需要重新发起支付 |
| failed | 支付失败 | 检查失败原因，可能需要重新支付 |
| canceled | 已取消 | 支付已被取消，需要重新发起 |
| no_payment_required | 无需支付 | 可以直接提供服务 |

### 3. Webhook 事件处理

**Webhook 接口地址：** `/api/stripe/webhook`  
**Content-Type：** `application/json`  
**签名验证：** 需要验证 `stripe-signature` 请求头

**主要事件类型：**
| 事件类型 | 说明 | 处理建议 |
|----------|------|----------|
| checkout.session.completed | 支付会话完成 | 更新订单状态，开始提供服务 |
| checkout.session.expired | 支付会话过期 | 标记订单为过期状态 |
| payment_intent.succeeded | 支付意向成功 | 确认付款已完成 |
| payment_intent.payment_failed | 支付失败 | 记录失败原因，通知用户 |
| charge.succeeded | 收费成功 | 更新支付记录 |
| charge.failed | 收费失败 | 记录失败原因 |

**Webhook 测试：**
1. 使用 Stripe CLI 进行本地测试：
```bash
stripe listen --forward-to localhost:3002/api/stripe/webhook
```

2. 使用 Stripe Dashboard 发送测试事件

## 前端集成示例

### React/Next.js 示例代码

```typescript
// types.ts
interface PaymentSession {
  url: string;
  sessionId: string;
}

interface PaymentStatus {
  status: PaymentStatusType;
}

type PaymentStatusType = 
  | 'paid'
  | 'unpaid'
  | 'processing'
  | 'expired'
  | 'failed'
  | 'canceled'
  | 'no_payment_required';

// api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pay.photosong.com/api';

export const createCheckoutSession = async (priceId: string): Promise<PaymentSession> => {
  const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ priceId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create checkout session');
  }

  return response.json();
};

export const checkPaymentStatus = async (sessionId: string): Promise<PaymentStatus> => {
  const response = await fetch(`${API_BASE_URL}/check-payment-status/${sessionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to check payment status');
  }

  return response.json();
};

// PaymentButton.tsx
import { useState } from 'react';
import { createCheckoutSession } from './api';

interface PaymentButtonProps {
  priceId: string;
  planName: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  priceId,
  planName,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      const { url } = await createCheckoutSession(priceId);
      onSuccess?.();
      window.location.href = url;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handlePayment} 
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '处理中...' : `购买 ${planName}`}
      </button>
      {error && (
        <p className="mt-2 text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

// SuccessPage.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { checkPaymentStatus } from './api';
import type { PaymentStatusType } from './types';

export const SuccessPage: React.FC = () => {
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = router.query.session_id as string;
    if (sessionId) {
      const checkStatus = async () => {
        try {
          const result = await checkPaymentStatus(sessionId);
          setStatus(result.status);
          
          // 如果支付还在处理中，继续轮询
          if (result.status === 'processing') {
            setTimeout(checkStatus, 2000);
          }
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      };
      
      checkStatus();
    }
  }, [router.query.session_id]);

  if (loading) return <div>正在确认支付状态...</div>;
  if (error) return <div className="text-red-500">错误：{error}</div>;

  return (
    <div className="p-4">
      {status === 'paid' && (
        <div className="text-green-500">
          <h1 className="text-2xl font-bold">支付成功！</h1>
          <p>您的订单已确认，我们会立即开始处理。</p>
        </div>
      )}
      {status === 'processing' && (
        <div className="text-yellow-500">
          <h1 className="text-2xl font-bold">支付处理中</h1>
          <p>请稍候，我们正在确认您的支付...</p>
        </div>
      )}
      {status === 'unpaid' && (
        <div className="text-red-500">
          <h1 className="text-2xl font-bold">支付未完成</h1>
          <p>您的支付尚未完成，请重试。</p>
        </div>
      )}
      {(status === 'expired' || status === 'failed' || status === 'canceled') && (
        <div className="text-red-500">
          <h1 className="text-2xl font-bold">支付失败</h1>
          <p>很抱歉，您的支付未能完成。请重新尝试。</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            返回首页
          </button>
        </div>
      )}
    </div>
  );
};
```

## 完整支付流程

1. 用户选择商品，点击支付按钮
2. 前端调用 `createCheckoutSession` API，传入对应商品的 `priceId`
3. 获取到支付URL后，将用户重定向到Stripe支付页面
4. 用户在Stripe页面完成支付
5. Stripe将用户重定向回success_url（带有session_id参数）
6. 前端使用session_id调用 `checkPaymentStatus` API确认支付状态
7. 如果状态为processing，使用轮询方式继续查询
8. 后端通过webhook接收到支付成功通知，更新订单状态
9. 前端确认支付成功后，更新UI并开始提供服务

## 测试

### 测试卡号

1. 支付成功场景：
- 普通支付：4242 4242 4242 4242
- 3D Secure成功：4000 0000 0000 3220
- 需要认证：4000 0000 0000 3063

2. 支付失败场景：
- 一般失败：4000 0000 0000 0002
- 余额不足：4000 0000 0000 9995
- 卡片被拒：4000 0000 0000 0069
- 欺诈检测：4100 0000 0000 0019

3. 特殊场景：
- 3D Secure失败：4000 0000 0000 3063
- 处理中：4000 0000 0000 3089
- 货币不支持：4000 0000 0000 0010

所有测试卡的其他信息：
- 有效期：任何未来日期（MM/YY）
- CVC：任意三位数
- 姓名：任意
- 邮编：任意5位数字

### 测试环境说明

1. 测试模式
- 使用测试API密钥
- 所有支付都是模拟的，不会产生实际扣款
- Webhook事件会立即触发
- 支持所有测试卡号

2. 生产模式
- 使用生产API密钥
- 真实交易，会产生实际扣款
- Webhook事件根据实际支付处理时间触发
- 只支持真实信用卡

## 重要提示

### 1. 安全建议
- 永远不要在前端暴露API密钥
- 所有敏感数据都应该通过后端处理
- 实现请求频率限制
- 使用HTTPS进行所有API通信
- 验证所有用户输入

### 2. 错误处理
- 实现适当的错误处理和重试机制
- 记录所有API错误以便调试
- 向用户显示友好的错误消息
- 处理网络超时和断开连接的情况

### 3. 性能优化
- 实现请求缓存
- 避免不必要的API调用
- 使用防抖动处理用户操作
- 实现支付状态的智能轮询

### 4. 用户体验
- 显示清晰的加载状态
- 提供明确的错误反馈
- 实现平滑的页面转换
- 支持支付过程的断点续传

### 5. 数据处理
- 正确处理货币和金额
- 注意时区差异
- 保存必要的支付记录
- 实现对账和审计功能

### 6. 并发处理
- 防止重复支付
- 处理并发请求
- 实现幂等性
- 使用乐观锁防止竞态条件

### 7. 监控和日志
- 记录关键操作日志
- 监控支付成功率
- 跟踪API性能
- 设置适当的告警机制

## 常见问题

1. Q: 支付失败后如何处理？
   A: 检查错误信息，根据错误类型决定是否重试或提示用户更换支付方式。

2. Q: 如何处理网络超时？
   A: 实现请求重试机制，同时确保操作的幂等性。

3. Q: 支付成功但未收到通知怎么办？
   A: 实现webhook重试机制，同时提供手动查询接口。

4. Q: 如何处理重复支付？
   A: 在创建支付会话时检查是否存在未完成的支付，实现幂等性检查。

5. Q: 如何确保支付安全？
   A: 使用HTTPS，实现请求签名，验证webhook，限制API访问频率。

## 更新日志

### v1.1.0 (2024-02-20)
- 添加新的支付状态：processing, expired
- 完善错误处理机制
- 添加并发请求处理
- 补充webhook文档

### v1.0.0 (2024-02-01)
- 初始版本发布
- 基本支付功能
- 支付状态查询 