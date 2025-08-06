# ⚠️ 重要：部署前需要设置 Vercel KV

## 🚨 部署前必须完成的步骤

在部署之前，您需要在 Vercel 仪表板中设置 KV 数据库，否则访问者计数器无法工作。

## 📋 快速设置步骤

### 1. 打开 Vercel 仪表板
- 访问：https://vercel.com/dashboard
- 登录您的账户

### 2. 进入项目设置
- 找到您的 MatchWise AI 项目
- 点击项目名称进入项目页面

### 3. 创建 KV 数据库
- 点击 "Storage" 标签页
- 点击 "Create Database" 按钮
- 选择 "KV" (Redis)
- 数据库名称：`matchwise-visitor-counter`
- 选择区域（建议：离您用户最近的区域）
- 点击 "Create"

### 4. 连接数据库到项目
- 在新创建的 KV 数据库页面
- 点击 "Connect Project" 按钮
- 选择您的 MatchWise AI 项目
- 点击 "Connect"

### 5. 验证环境变量
确认以下环境变量已自动添加到您的项目：
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

## ✅ 设置完成后

完成上述步骤后，您可以正常部署项目：

```bash
vercel --prod --force
```

## 🎯 预期效果

设置完成并部署后：
- ✅ 访问者计数器将从 116 开始
- ✅ 所有用户看到相同的全局计数
- ✅ 计数在不同设备间同步
- ✅ 数据在部署间保持持久化

## 💰 成本说明

Vercel KV 免费额度：
- 每月 30,000 请求
- 256 MB 存储
- 完全满足访问者计数器需求

## 🔧 如果遇到问题

如果设置过程中遇到问题：
1. 确认您有 Vercel 项目的管理权限
2. 检查项目是否在正确的团队下
3. 联系 Vercel 支持或查看文档

## 📁 相关文件

详细设置说明请查看：`VERCEL_KV_SETUP.md`