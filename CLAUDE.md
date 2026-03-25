# CLAUDE.md

## 项目概述
CrabPanel（蟹面板）是 OpenClaw AI Agent 框架的中文可视化管理面板。
用户通过浏览器打开 localhost:3000 即可管理 OpenClaw 的所有功能。
本项目面向中文用户，界面默认中文，支持切换英文。

## 技术栈
- 前端：React 18 + TypeScript + Vite + Tailwind CSS 4
- 后端：Express + TypeScript
- 状态管理：zustand
- 数据请求：@tanstack/react-query
- 国际化：react-i18next
- 编辑器：Monaco Editor（用于 JSON 和配置编辑）
- 图表：recharts
- 图标：lucide-react
- 构建工具：Vite 6
- 包管理：npm workspaces (monorepo)

## 项目结构
这是一个 monorepo 项目：
- client/ — 前端 React SPA 应用，端口 5173（开发）
- server/ — Express 后端 API 服务，端口 3000
- 根目录 package.json 使用 npm workspaces 管理

## UI 设计规范（Claude 风格）
本项目的 UI 风格参考 Claude.ai 的设计语言：
- 主色调：#C96442（温暖棕色，用于按钮、链接、强调元素）
- 主色浅色：#F5E6DC（用于浅色背景、hover 状态）
- 页面背景：#FAFAF8（暖白色）
- 卡片背景：#FFFFFF
- 边框色：#E8E5E0（暖灰色）
- 主文字：#2D2B28（近黑）
- 次要文字：#8C8985（暖灰）
- 成功色：#1D9E75
- 警告色：#BA7517
- 危险色：#E24B4A
- 信息色：#378ADD
- 圆角：8px（小组件）/ 12px（卡片）/ 16px（弹窗、大容器）
- 字体：系统字体栈，中文字体优先
- 间距基础单位：4px，常用 8/12/16/24/32
- 风格关键词：温暖、圆润、简洁、高信息密度、无噪音

## 关键约定
- 所有界面文案使用 i18n，不要硬编码中文字符串，翻译文件在 client/src/i18n/
- 组件文件名使用 PascalCase（如 DashboardCard.tsx）
- API 路由使用 kebab-case（如 /api/gateway-status）
- OpenClaw Gateway 的 WebSocket 地址是 ws://localhost:18789
- 配置编辑功能要同时支持「表单模式」和「JSON 原始模式」切换
- 所有 API 请求要有 loading 状态和错误处理
- 支持 light/dark 双主题（默认 light）
- **与 OpenClaw 的所有通信通过 CLI 子进程（child_process）完成，不使用 WebSocket 直连 Gateway**
- **聊天功能使用 HTTP SSE 流式推送，不使用 WebSocket**
- **配置文件通过 fs 模块直接读写 ~/.openclaw/**
- **前端所有数据请求使用 react-query + REST API，不使用 WebSocket**

## 开发命令
- `npm run dev` — 同时启动前后端开发服务器
- `npm run build` — 构建生产版本
- `npm run lint` — 代码检查
- `npm run dev:client` — 只启动前端
- `npm run dev:server` — 只启动后端

## OpenClaw 相关知识
- OpenClaw 是一个开源 AI Agent 框架，本地运行
- Gateway 是核心服务，监听 18789 端口
- Gateway 提供 WebSocket RPC 接口，用于管理 Agent、通道、配置等
- 配置文件在 ~/.openclaw/openclaw.json
- 工作目录在 ~/.openclaw/
- 常用 CLI 命令：openclaw gateway status, openclaw config get, openclaw skills list
