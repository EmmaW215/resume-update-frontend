# 访客计数器功能说明

## 功能概述

MatchWise AI 现在集成了访客计数器功能，可以实时统计和显示网站访问量。

## 功能特性

### 1. 实时访客计数
- 每次页面访问自动增加计数
- 实时显示当前访客总数
- 支持大数字格式化（K, M）

### 2. 可视化显示
- 右上角显示访客计数器
- 绿色脉冲动画指示器
- 响应式设计，适配移动端

### 3. 管理后台
- 访问 `/admin/visitor-stats` 查看详细统计
- 管理员密码：`matchwise2024`
- 显示总访客数和最后更新时间

## 技术实现

### API 路由
- `GET /api/visitor-count` - 获取访客统计
- `POST /api/visitor-count` - 更新访客计数

### 数据存储
- 使用本地 JSON 文件存储
- 文件位置：`visitor-count.json`
- 包含访客数量和最后更新时间

### 组件结构
```
src/app/
├── api/visitor-count/
│   └── route.ts              # API 路由
├── components/
│   └── VisitorCounter.tsx    # 访客计数器组件
├── admin/visitor-stats/
│   └── page.tsx              # 管理页面
└── page.tsx                  # 主页面（已集成）
```

## 使用方法

### 用户端
1. 访问主页，右上角会显示访客计数器
2. 每次页面刷新都会增加计数
3. 计数器会自动格式化大数字显示

### 管理员
1. 点击左上角的 "Admin" 链接
2. 输入密码：`matchwise2024`
3. 查看详细的访客统计信息
4. 可以刷新统计数据

## 部署说明

### Vercel 部署
- 访客数据存储在 Vercel 的文件系统中
- 每次部署会重置计数器（Vercel 限制）
- 建议后续升级到数据库存储

### 生产环境建议
1. 使用数据库存储访客数据（如 MongoDB、PostgreSQL）
2. 添加更安全的身份验证
3. 实现访客去重逻辑
4. 添加更详细的统计信息（如时间分布、地理位置等）

## 自定义配置

### 修改管理员密码
在 `src/app/admin/visitor-stats/page.tsx` 中修改：
```typescript
const ADMIN_PASSWORD = 'your-new-password';
```

### 修改计数器位置
在 `src/app/page.tsx` 中调整 CSS 类：
```typescript
<div className="absolute top-4 right-4 z-20">
  <VisitorCounter />
</div>
```

### 修改数字格式化
在 `src/app/components/VisitorCounter.tsx` 中调整 `formatNumber` 函数。

## 故障排除

### 计数器不显示
1. 检查浏览器控制台是否有错误
2. 确认 API 路由正常工作
3. 检查文件权限问题

### 管理页面无法访问
1. 确认密码正确
2. 检查 localStorage 是否被禁用
3. 清除浏览器缓存

### 数据丢失
- Vercel 部署会重置文件数据
- 建议升级到数据库存储
- 定期备份访客数据

## 后续优化建议

1. **数据库集成**：使用 MongoDB 或 PostgreSQL 存储数据
2. **访客去重**：基于 IP 或会话 ID 去重
3. **详细统计**：添加时间分布、地理位置等
4. **实时更新**：使用 WebSocket 实现实时更新
5. **数据导出**：支持 CSV/Excel 导出功能
6. **图表展示**：添加访客趋势图表 