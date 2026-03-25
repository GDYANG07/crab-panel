# 🦀 CrabPanel

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white" alt="Docker">
</p>

<p align="center">
  <strong>OpenClaw AI Agent 框架的中文可视化管理面板</strong>
</p>

<p align="center">
  <a href="./README_EN.md">English</a> | 简体中文
</p>

---

CrabPanel（蟹面板）是 [OpenClaw](https://github.com/openclaw/openclaw) AI Agent 框架的中文可视化管理面板。通过直观的 Web 界面，你可以轻松管理 OpenClaw 的所有功能：智能体配置、通道管理、技能商店、实时对话、系统监控等。

> 📸 截图占位符：添加应用界面截图

## ✨ 功能特性

- 🤖 **智能体管理** - 创建、编辑、删除 AI 智能体，支持多种模型配置
- 💬 **实时对话** - WebSocket 驱动的流式对话，支持 Markdown 渲染
- 🔌 **通道管理** - 配置和管理 OpenClaw 的各种通道（HTTP、WebSocket、CLI 等）
- 🛠️ **技能商店** - 浏览、安装、配置 OpenClaw 技能
- ⚙️ **配置管理** - 可视化编辑 OpenClaw 配置，支持表单和 JSON 双模式
- 📊 **系统监控** - 实时查看 Gateway 状态、资源使用、日志输出
- 🌐 **双语支持** - 中文/英文界面一键切换
- 🎨 **Claude 风格 UI** - 温暖、简洁、高信息密度的设计

## 🚀 快速开始

### 方式一：Docker（推荐）

```bash
# 克隆仓库
git clone https://github.com/openclaw/crab-panel.git
cd crab-panel

# 构建并启动
docker-compose up -d

# 访问 http://localhost:3000
```

### 方式二：一键安装脚本

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/crab-panel/main/scripts/install.sh | bash

cd crab-panel
npm start
```

### 方式三：源码安装

**前置要求：**
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

**安装步骤：**

```bash
# 1. 克隆仓库
git clone https://github.com/openclaw/crab-panel.git
cd crab-panel

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 启动服务
npm start
```

访问 http://localhost:3000 即可使用。

## ⚙️ 配置说明

创建 `.env` 文件来自定义配置：

```env
# 服务端口
PORT=3000

# OpenClaw Gateway 地址
OPENCLAW_GATEWAY_URL=ws://localhost:18789

# 日志级别 (debug, info, warn, error)
LOG_LEVEL=info

# 环境模式 (development, production)
NODE_ENV=production
```

## 🐳 Docker 部署

### 构建镜像

```bash
npm run docker:build
# 或
docker build -t crab-panel .
```

### 运行容器

```bash
# 使用 docker-compose（推荐）
npm run docker:compose

# 或手动运行
docker run -d \
  --name crab-panel \
  --network host \
  -p 3000:3000 \
  -v ~/.openclaw:/root/.openclaw:ro \
  -e NODE_ENV=production \
  --restart unless-stopped \
  crab-panel
```

**注意事项：**
- 使用 `host` 网络模式以便连接到宿主机的 OpenClaw Gateway
- 挂载 `~/.openclaw` 目录以读取 OpenClaw 配置

## 🛠️ 开发指南

### 项目结构

```
crab-panel/
├── client/          # 前端 React 应用
│   ├── src/         # 源代码
│   ├── public/      # 静态资源
│   └── dist/        # 构建产物
├── server/          # Express 后端 API
│   ├── src/         # 源代码
│   └── dist/        # 编译产物
├── scripts/         # 安装脚本
├── docker-compose.yml
├── Dockerfile
└── package.json
```

### 开发命令

```bash
# 同时启动前后端开发服务器
npm run dev

# 只启动前端
npm run dev:client

# 只启动后端
npm run dev:server

# 构建项目
npm run build

# 生产环境启动
npm start

# 代码检查
npm run lint
```

### 开发环境架构

- **前端**：http://localhost:5173 (Vite dev server)
- **后端**：http://localhost:3000 (Express + WebSocket)
- **Gateway**：ws://localhost:18789 (OpenClaw)

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 6 |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand |
| 数据请求 | TanStack Query |
| 国际化 | react-i18next |
| 后端框架 | Express + TypeScript |
| 实时通信 | WebSocket |
| 图表 | Recharts |
| 编辑器 | Monaco Editor |

## 🔗 相关项目

- [OpenClaw](https://github.com/openclaw/openclaw) - AI Agent 框架本体
- [OpenClaw Gateway](https://github.com/openclaw/openclaw/tree/main/gateway) - 核心网关服务
- [OpenClaw Skills](https://github.com/openclaw/skills) - 官方技能仓库

## 🤝 贡献指南

我们欢迎所有形式的贡献！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 提交规范

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关

## 📜 许可证

[MIT](LICENSE) © OpenClaw Team

---

<p align="center">
  Made with 🦀 by OpenClaw Team
</p>
