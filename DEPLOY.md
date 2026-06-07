# PeakValley 部署与分享指南

## 方案对比

| 方案 | 难度 | 成本 | 适合场景 | 二维码 |
|------|------|------|----------|--------|
| **Vercel + ngrok** | 低 | 免费 | 临时演示、评委查看 | ✅ 可用 |
| **Vercel + Render** | 中 | 免费 | 长期展示、持续可用 | ✅ 可用 |
| **Netlify + Railway** | 中 | 免费 | 长期展示、持续可用 | ✅ 可用 |
| **国内服务器** | 高 | ¥50-200/月 | 正式运营、备案后上线 | ✅ 可用 |

---

## 推荐方案 A：Vercel + ngrok（最快，5 分钟搞定）

适合：马上要给评委演示，需要临时可访问链接

### 1. 前端部署到 Vercel（免费）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录（浏览器会弹出授权）
vercel login

# 进入前端目录并部署
cd frontend
vercel --prod
```

Vercel 会分配一个类似 `https://peakvalley-xxx.vercel.app` 的域名。

### 2. 后端临时暴露到公网（ngrok）

```bash
# 安装 ngrok（免费版即可）
# 下载: https://ngrok.com/download
# 注册后获取 authtoken

ngrok config add-authtoken YOUR_TOKEN

# 暴露本地后端（端口 3001）
ngrok http 3001
```

ngrok 会分配一个类似 `https://abc123.ngrok-free.app` 的公网地址。

### 3. 修改前端环境变量指向 ngrok 地址

在 Vercel Dashboard → Project Settings → Environment Variables 中设置：

```
NEXT_PUBLIC_API_URL=https://abc123.ngrok-free.app/api/v1
```

重新部署前端：`vercel --prod`

### 4. 生成二维码

访问任意在线二维码生成器，输入 `https://peakvalley-xxx.vercel.app` 即可生成二维码。

推荐工具：
- https://cli.im/ （草料二维码，免费）
- https://www.qr-code-generator.com/

---

## 推荐方案 B：Vercel + Render（长期可用）

适合：比赛期间持续可访问，不需要本地电脑一直开机

### 后端部署到 Render（免费）

1. 将代码推送到 GitHub
2. 登录 https://render.com → New Web Service
3. 选择 GitHub 仓库
4. 配置：
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: 添加 SUPABASE_URL、SUPABASE_SERVICE_KEY、REDIS_URL 等
5. Render 会分配 `https://peakvalley-api.onrender.com`

然后按方案 A 第 3 步修改前端 API 地址即可。

---

## 推荐方案 C：国内服务器（最稳定）

适合：比赛后正式运营

- 推荐阿里云/腾讯云轻量应用服务器（¥50-100/月）
- 域名备案后绑定
- Nginx 反向代理前后端
- PM2 守护进程

详细配置可参考 `ops/` 目录下的 nginx 配置文件（如需要可后续补充）。

---

## 注意事项

1. **ngrok 免费版**：域名每次重启会变，不适合长期分享
2. **Render 免费版**：15 分钟无访问会自动休眠，首次访问需等待 30 秒唤醒
3. **Vercel 免费版**：每月 100GB 流量，足够演示使用
4. **Supabase 免费版**：每月 500MB 数据库 + 2GB 带宽，足够 MVP 阶段
