# 🦀 CrabPanel

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white" alt="Docker">
</p>

<p align="center">
  <strong>Chinese Visual Management Panel for OpenClaw AI Agent Framework</strong>
</p>

<p align="center">
  English | <a href="./README.md">简体中文</a>
</p>

---

CrabPanel is a Chinese visual management dashboard for the [OpenClaw](https://github.com/openclaw/openclaw) AI Agent framework. Through an intuitive web interface, you can easily manage all OpenClaw features: agent configuration, channel management, skill store, real-time conversations, system monitoring, and more.

> 📸 Screenshot placeholder: Add application interface screenshots

## ✨ Features

- 🤖 **Agent Management** - Create, edit, and delete AI agents with support for multiple model configurations
- 💬 **Real-time Chat** - WebSocket-powered streaming conversations with Markdown rendering
- 🔌 **Channel Management** - Configure and manage OpenClaw channels (HTTP, WebSocket, CLI, etc.)
- 🛠️ **Skill Store** - Browse, install, and configure OpenClaw skills
- ⚙️ **Configuration Management** - Visual editing of OpenClaw config with both form and JSON modes
- 📊 **System Monitoring** - Real-time view of Gateway status, resource usage, and log output
- 🌐 **Bilingual Support** - One-click switching between Chinese and English interfaces
- 🎨 **Claude-style UI** - Warm, clean, high information density design

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/openclaw/crab-panel.git
cd crab-panel

# Build and start
docker-compose up -d

# Visit http://localhost:3000
```

### Option 2: One-click Install Script

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/crab-panel/main/scripts/install.sh | bash

cd crab-panel
npm start
```

### Option 3: Source Installation

**Prerequisites:**
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

**Installation:**

```bash
# 1. Clone repository
git clone https://github.com/openclaw/crab-panel.git
cd crab-panel

# 2. Install dependencies
npm install

# 3. Build project
npm run build

# 4. Start service
npm start
```

Visit http://localhost:3000 to use the application.

## ⚙️ Configuration

Create a `.env` file to customize configuration:

```env
# Service port
PORT=3000

# OpenClaw Gateway URL
OPENCLAW_GATEWAY_URL=ws://localhost:18789

# Log level (debug, info, warn, error)
LOG_LEVEL=info

# Environment mode (development, production)
NODE_ENV=production
```

## 🐳 Docker Deployment

### Build Image

```bash
npm run docker:build
# or
docker build -t crab-panel .
```

### Run Container

```bash
# Using docker-compose (recommended)
npm run docker:compose

# Or run manually
docker run -d \
  --name crab-panel \
  --network host \
  -p 3000:3000 \
  -v ~/.openclaw:/root/.openclaw:ro \
  -e NODE_ENV=production \
  --restart unless-stopped \
  crab-panel
```

**Notes:**
- Use `host` network mode to connect to the host's OpenClaw Gateway
- Mount `~/.openclaw` directory to read OpenClaw configuration

## 🛠️ Development Guide

### Project Structure

```
crab-panel/
├── client/          # Frontend React app
│   ├── src/         # Source code
│   ├── public/      # Static assets
│   └── dist/        # Build output
├── server/          # Express backend API
│   ├── src/         # Source code
│   └── dist/        # Compiled output
├── scripts/         # Installation scripts
├── docker-compose.yml
├── Dockerfile
└── package.json
```

### Development Commands

```bash
# Start both frontend and backend dev servers
npm run dev

# Frontend only
npm run dev:client

# Backend only
npm run dev:server

# Build project
npm run build

# Production start
npm start

# Lint code
npm run lint
```

### Development Environment Architecture

- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:3000 (Express + WebSocket)
- **Gateway**: ws://localhost:18789 (OpenClaw)

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| State Management | Zustand |
| Data Fetching | TanStack Query |
| i18n | react-i18next |
| Backend Framework | Express + TypeScript |
| Real-time | WebSocket |
| Charts | Recharts |
| Editor | Monaco Editor |

## 🔗 Related Projects

- [OpenClaw](https://github.com/openclaw/openclaw) - AI Agent framework core
- [OpenClaw Gateway](https://github.com/openclaw/openclaw/tree/main/gateway) - Core gateway service
- [OpenClaw Skills](https://github.com/openclaw/skills) - Official skills repository

## 🤝 Contributing

We welcome all forms of contributions!

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

### Commit Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation update
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test related
- `chore:` Build/tooling changes

## 📜 License

[MIT](LICENSE) © OpenClaw Team

---

<p align="center">
  Made with 🦀 by OpenClaw Team
</p>
