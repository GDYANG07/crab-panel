# 多阶段构建
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache git python3 make g++

# 复制 package.json 文件
COPY package.json package-lock.json* ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# 安装所有依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建前端
RUN cd client && npm run build

# 构建后端
RUN cd server && npm run build

# 生产阶段
FROM node:20-alpine AS production

# 设置工作目录
WORKDIR /app

# 安装生产环境依赖
RUN apk add --no-cache tini

# 复制 package.json
COPY package.json package-lock.json* ./
COPY server/package.json ./server/

# 只安装生产依赖
RUN npm ci --production --workspace=server && \
    npm cache clean --force

# 从构建阶段复制构建产物
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 更改文件所有权
RUN chown -R nodejs:nodejs /app

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 使用 tini 作为 init 系统
ENTRYPOINT ["/sbin/tini", "--"]

# 启动命令
CMD ["node", "server/dist/index.js"]
