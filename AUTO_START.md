# PeakValley 服务持久化方案

## 问题
开发模式下 `uvicorn` 和 `next dev` 都是前台进程，终端窗口关闭 = 服务停止。

## 解决方案（已配好，一键使用）

### 方案 A：手动启动（推荐日常使用）

双击 `start.bat` → 最小化窗口后台运行

```
E:\桌面\PeakValley\start.bat
```

- 前端: http://localhost:3000
- 后端: http://localhost:3001/docs

### 方案 B：开机自动启动（一劳永逸）

双击 `install-auto-start.bat` → 自动安装到 Windows 启动文件夹

```
E:\桌面\PeakValley\install-auto-start.bat
```

装完后：
- 每次开机 → 自动静默启动（**无窗口、无弹窗**）
- 打开浏览器访问 `localhost:3000` 即可

**取消自启**：Win+R 输入 `shell:startup` → 删除 `PeakValley-AutoStart.vbs`

### 方案 C：关闭服务

双击 `stop.bat` → 一键清理前后端进程

```
E:\桌面\PeakValley\stop.bat
```

### 方案 D：重启

双击 `restart.bat` → 先关后开

```
E:\桌面\PeakValley\restart.bat
```

---

## 文件清单

| 文件 | 作用 |
|------|------|
| `start.bat` | 可见窗口启动（端口检查、最小化） |
| `stop.bat` | 一键关闭 |
| `restart.bat` | 一键重启 |
| `hidden-start.vbs` | 无窗口启动（被 install-auto-start.bat 调用） |
| `install-auto-start.bat` | 安装到开机启动目录 |

---

## 如果端口被其他程序占用

```batch
# 查看占用 3000/3001 的进程
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3001"

# 强制结束（替换 <PID>）
taskkill /PID <PID> /F
```
