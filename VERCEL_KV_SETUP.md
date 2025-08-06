# Vercel KV 设置指南

## 概述
MatchWise AI 现在使用 Vercel KV (Redis) 来存储访问者计数，实现真正的全局计数功能。

## 设置步骤

### 1. 在 Vercel 仪表板中创建 KV 数据库
1. 登录 [Vercel 仪表板](https://vercel.com/dashboard)
2. 进入你的项目页面
3. 点击 "Storage" 标签页
4. 点击 "Create Database"
5. 选择 "KV" (Redis)
6. 为数据库命名（建议：`matchwise-visitor-counter`）
7. 选择区域（建议选择离用户最近的区域）
8. 点击 "Create"

### 2. 连接 KV 数据库到项目
1. 在创建的 KV 数据库页面
2. 点击 "Connect Project" 
3. 选择你的 MatchWise AI 项目
4. 点击 "Connect"

### 3. 环境变量自动配置
Vercel 会自动为你的项目添加以下环境变量：
- `KV_URL`
- `KV_REST_API_URL` 
- `KV_REST_API_TOKEN`
- `KV_REST_API_TOKEN_READ_ONLY`

这些变量会在下次部署时自动生效。

## 功能说明

### 数据存储
- **Key**: `matchwise_visitor_count`
- **数据结构**: 
  ```typescript
  {
    count: number,      // 访问者总数
    lastUpdated: string // 最后更新时间 (ISO string)
  }
  ```

### 初始值
- 首次访问时自动初始化为 116（保持当前计数基础）
- 后续所有访问都会在此基础上递增

### 全局性
- ✅ 所有用户共享同一个计数器
- ✅ 不同设备/浏览器看到相同的计数
- ✅ 计数在部署间保持持久化
- ✅ 实时同步更新

## 成本说明

### Vercel KV 免费额度
- **请求数**: 每月 30,000 次
- **存储空间**: 256 MB
- **带宽**: 每月 1 GB

### 访问者计数器使用量估算
- 每次页面访问: 2个请求（1个GET + 1个POST）
- 假设每月 10,000 页面访问 = 20,000 请求
- **完全在免费额度内**

## 监控和调试

### 查看 KV 数据
1. 在 Vercel 仪表板中打开 KV 数据库
2. 使用 "Data Browser" 查看存储的数据
3. 可以手动查看/编辑 `matchwise_visitor_count` key

### 调试日志
在 Vercel 函数日志中查看：
- `📡 Attempting to read visitor count from Vercel KV...`
- `✅ Successfully read visitor count from KV:`
- `🔄 Updating visitor count...`
- `📊 Current count: X -> New count: Y`

### 错误处理
如果 KV 服务不可用，系统会：
1. 记录错误日志
2. 返回默认计数值（116）
3. 前端仍然正常显示

## 迁移说明

### 从内存存储迁移
- 旧的内存存储方案已完全移除
- 首次部署后，计数器会从 116 开始
- 无需手动迁移数据

### 回滚计划
如果需要回滚到之前版本：
1. 删除 `@vercel/kv` 依赖
2. 恢复之前的 API 实现
3. KV 数据会保留，不会丢失

## 部署后验证

### 功能测试
1. 打开网站，查看访问者计数
2. 刷新页面，确认计数递增
3. 在不同浏览器/设备中打开，确认看到相同计数
4. 确认计数在不同用户间共享

### 预期行为
```
用户A第一次访问: 116 -> 117
用户B访问: 117 -> 118  
用户A再次访问: 118 -> 119
用户C访问: 119 -> 120
```

## 故障排除

### 常见问题
1. **KV_URL 未设置**: 检查环境变量是否正确配置
2. **权限错误**: 确认 KV 数据库已连接到项目
3. **网络错误**: 检查 Vercel KV 服务状态

### 联系信息
如有问题，请：
1. 检查 Vercel 部署日志
2. 查看 KV 数据库状态
3. 验证环境变量配置