#!/bin/bash

# =============================================================================
# CrabPanel 一键安装脚本
# OpenClaw AI Agent 框架的中文可视化管理面板
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目配置
REPO_URL="https://github.com/openclaw/crab-panel.git"
INSTALL_DIR="crab-panel"
NODE_VERSION_REQUIRED="18.0.0"

# 打印带颜色的信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "\n${CYAN}==>${NC} $1"
}

# 显示 banner
show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
    🦀 CrabPanel 🦀
    OpenClaw AI Agent 可视化管理面板
EOF
    echo -e "${NC}"
    echo "    中文文档: https://github.com/openclaw/crab-panel"
    echo ""
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 比较版本号
version_compare() {
    printf '%s\n%s\n' "$1" "$2" | sort -V -C
}

# 获取 Node.js 版本
get_node_version() {
    node -v | sed 's/v//'
}

# 检查 Node.js
check_nodejs() {
    print_step "检查 Node.js 环境"

    if ! command_exists node; then
        print_error "未检测到 Node.js"
        echo ""
        echo "请安装 Node.js ${NODE_VERSION_REQUIRED} 或更高版本:"
        echo "  • macOS:   brew install node"
        echo "  • Ubuntu:  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
        echo "  • 其他:    https://nodejs.org/"
        echo ""
        exit 1
    fi

    local node_version=$(get_node_version)
    print_info "检测到 Node.js v${node_version}"

    if ! version_compare "$NODE_VERSION_REQUIRED" "$node_version"; then
        print_error "Node.js 版本过低 (需要 >= ${NODE_VERSION_REQUIRED})"
        exit 1
    fi

    print_success "Node.js 版本检查通过"
}

# 检查 npm
check_npm() {
    print_step "检查 npm"

    if ! command_exists npm; then
        print_error "未检测到 npm"
        echo "请确保 npm 随 Node.js 一起安装"
        exit 1
    fi

    local npm_version=$(npm -v)
    print_info "检测到 npm v${npm_version}"
    print_success "npm 检查通过"
}

# 检查 git
check_git() {
    print_step "检查 Git"

    if ! command_exists git; then
        print_error "未检测到 Git"
        echo "请安装 Git:"
        echo "  • macOS:   brew install git 或安装 Xcode Command Line Tools"
        echo "  • Ubuntu:  sudo apt-get install git"
        echo "  • 其他:    https://git-scm.com/downloads"
        echo ""
        exit 1
    fi

    local git_version=$(git --version | awk '{print $3}')
    print_info "检测到 Git v${git_version}"
    print_success "Git 检查通过"
}

# 克隆仓库
clone_repo() {
    print_step "克隆 CrabPanel 仓库"

    if [ -d "$INSTALL_DIR" ]; then
        print_warning "目录 ${INSTALL_DIR} 已存在"
        read -p "是否删除并重新克隆? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$INSTALL_DIR"
        else
            print_info "使用现有目录"
            cd "$INSTALL_DIR"
            print_info "更新代码..."
            git pull
            return
        fi
    fi

    print_info "正在从 ${REPO_URL} 克隆..."
    if ! git clone "$REPO_URL" "$INSTALL_DIR"; then
        print_error "克隆失败，请检查网络连接"
        exit 1
    fi

    cd "$INSTALL_DIR"
    print_success "仓库克隆完成"
}

# 安装依赖
install_dependencies() {
    print_step "安装项目依赖"

    print_info "这可能需要几分钟时间..."

    if ! npm install; then
        print_error "依赖安装失败"
        exit 1
    fi

    print_success "依赖安装完成"
}

# 构建项目
build_project() {
    print_step "构建项目"

    print_info "构建前端和后端..."

    if ! npm run build; then
        print_error "构建失败"
        exit 1
    fi

    print_success "项目构建完成"
}

# 创建环境文件
setup_env() {
    print_step "配置环境"

    if [ ! -f ".env" ]; then
        cat > .env << 'EOF'
# CrabPanel 环境配置
NODE_ENV=production
PORT=3000

# OpenClaw Gateway 配置
OPENCLAW_GATEWAY_URL=ws://localhost:18789

# 可选: 日志级别 (debug, info, warn, error)
LOG_LEVEL=info
EOF
        print_success "已创建 .env 配置文件"
    else
        print_info ".env 文件已存在，跳过创建"
    fi
}

# 显示完成信息
show_completion() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  🦀 CrabPanel 安装成功!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "启动命令:"
    echo "  cd $(pwd)"
    echo "  npm start"
    echo ""
    echo "或者使用开发模式启动:"
    echo "  npm run dev"
    echo ""
    echo "访问地址:"
    echo "  • 面板:    http://localhost:3000"
    echo "  • 健康检查: http://localhost:3000/api/health"
    echo ""
    echo "Docker 部署:"
    echo "  docker-compose up -d"
    echo ""
    echo "文档: https://github.com/openclaw/crab-panel"
    echo ""
}

# 主函数
main() {
    show_banner

    # 检查环境
    check_nodejs
    check_npm
    check_git

    # 克隆和安装
    clone_repo
    install_dependencies
    build_project
    setup_env

    # 完成
    show_completion
}

# 错误处理
trap 'print_error "安装过程中发生错误"; exit 1' ERR

# 运行主函数
main
