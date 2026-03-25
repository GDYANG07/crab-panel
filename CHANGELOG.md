# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-03-25

### 🎉 Initial Release

CrabPanel v0.1.0 is the first public release of the visual management dashboard for the [OpenClaw](https://github.com/openclaw) AI Agent framework.

---

### Added

#### Core Dashboard
- **System overview** with real-time stats: Gateway status, today's message count, active agents, and connected channels
- **System resource monitoring**: CPU, memory, and disk usage with ring charts
- **Message trend chart**: 7-day historical message volume visualization (Recharts)
- **Recent sessions list**: Latest 5 conversation sessions with channel icons and timestamps
- **Quick action buttons**: Restart Gateway, Open Chat, View Logs, Check Update

#### Agent Management (`/agents`)
- Full **CRUD** for AI Agents (Create, Read, Update, Delete)
- **3-step creation wizard**: Basic Info → Personality & Identity → Tools & Permissions
- **5-tab detail editor**: Overview / SOUL / Tools / Core Files / Advanced JSON
- **SOUL editor** for defining agent personality and behavior instructions
- **Pre-built personality templates**: Assistant, Programmer, Analyst, Creative, Support
- **Tool permission management**: Per-tool enable/disable with category grouping (System, Browser, Filesystem, Custom)
- **Sandbox mode** and **Require Approval** toggles
- **Monaco Editor** for JSON and file editing
- Agent search and filtering

#### Channel Management (`/channels`)
- Support for **10+ communication channels**: Telegram, Discord, Slack, WhatsApp, DingTalk, Feishu, WeChat Work, Line, Email, SMS
- Grouped display: Domestic / International / Other
- Per-channel **connection status** badges and message count
- Channel-specific **configuration forms** (Bot Token, Webhook, API Key, etc.)
- **Test connection** button
- Message format options: Plain Text / Markdown / HTML

#### Skill Store (`/skills`)
- Browse and install **skill plugins** to extend Agent capabilities
- Category filtering: All / Installed / Productivity / Development / Communication / Data
- Full-text search across skill name, description, and author
- **Install / Uninstall** with loading states
- Skills requiring configuration show a **config dialog** before install
- Skill detail modal with full description, stats, and category info

#### Memory Management (`/memory`)
- Visual **file tree** for Agent memory files
- **4 memory categories**: Global Memory, Working Memory, Archived Memory, Agent Identity Files
- In-browser **text editor** for memory files
- File operations: Create, Rename, Delete, Save (with unsaved change indicator)
- Monaco Editor integration for rich editing experience

#### System Configuration (`/config`)
- **Form mode**: Structured configuration for Model, Gateway, Agent Defaults, Security
- **JSON mode**: Direct editing of `openclaw.json`
- Model configuration: Provider (Anthropic/OpenAI/Deepseek/Custom), API Key, Base URL, Default Model, Fallback Model
- Gateway configuration: Port, Auth Mode, Token, Bind Address
- Agent defaults: Tools Profile, Require Approval, Browser Control, Sandbox Mode
- Security settings: Device Auth, Tailscale access
- One-click **Restart Gateway** with confirmation dialog

#### System Monitor (`/monitor`)
- **Resources tab**: Real-time CPU, Memory, Disk, Network charts with trend lines
- **Logs tab**: Live Gateway log stream via WebSocket with level filtering (All/Info/Warn/Error/Debug), search, pause/resume, clear, and export
- **Versions tab**: CrabPanel and OpenClaw version display, update checker

#### Real-time Chat (`/chat`)
- Conversational interface with OpenClaw Agents
- Sidebar with conversation list and search
- Agent selector dropdown
- Markdown rendering with syntax-highlighted code blocks
- WebSocket-based real-time messaging
- Connection status indicator
- Mobile-responsive layout

---

### UI & UX

#### Design System
- Custom **CSS variable-based** design tokens (colors, spacing, typography)
- Full **dark/light theme** support with toggle in header
- Component library: Button, Card, Input, Select, Toggle, Badge, Modal, Toast, Spinner, Skeleton
- **Skeleton loading** screens for async data
- Toast notification system (success/error/warning/info)
- Consistent page headers with icon, title, and description

#### Internationalization (i18n)
- Full **Simplified Chinese (zh-CN)** and **English (en-US)** translations
- Language auto-detection from browser with localStorage persistence
- Language toggle button in header (中 / EN)
- All UI strings externalized to translation files

#### Responsive Layout
- **Desktop sidebar** (collapsible) with navigation labels and descriptions
- **Mobile bottom navigation** with overflow menu for extra items
- Adaptive content layout for tablet and mobile screens

#### Navigation & Routing
- React Router v6 with `AppLayout` as shared wrapper
- Persistent **Gateway status indicator** in bottom status bar
- Version number display

---

### Technical Stack

#### Frontend
- **React 18** + **TypeScript**
- **Vite 5** build tool
- **Tailwind CSS 4** for styling
- **React Router v6** for navigation
- **TanStack React Query v5** for server state and caching
- **Zustand** for theme state management
- **i18next** + react-i18next for internationalization
- **Recharts** for data visualization
- **Monaco Editor** for code/text editing
- **Lucide React** icon library
- **CVA** (class-variance-authority) for component variants

#### Backend
- **Express.js** + TypeScript
- **WebSocket** (ws) for real-time log streaming and chat
- **Gateway client** with automatic reconnection and mock mode fallback
- REST API routes: gateway, system, channels, skills, files, CLI

#### DevOps
- **Docker** multi-stage build (Node 20 Alpine)
- **Docker Compose** for production deployment
- **GitHub Actions** CI pipeline: lint → type check → build
- ESLint + Prettier code quality

---

### Configuration

- Copy `.env.example` to `.env` and configure `OPENCLAW_HOST` and `OPENCLAW_PORT`
- Gateway auto-connects on startup; falls back to **mock mode** after 5s timeout
- Mock mode provides realistic demo data for all pages

---

[0.1.0]: https://github.com/yourusername/crab-panel/releases/tag/v0.1.0
