# 构建阶段
FROM node:18-alpine as builder

# 设置工作目录
WORKDIR /app

# 增加Node.js内存限制
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 首先只复制 package.json 文件以利用缓存层
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# 安装依赖
WORKDIR /app/client
RUN npm install --production=false

WORKDIR /app/server
RUN npm install --production=false

# 复制源代码
WORKDIR /app
COPY client/ ./client/
COPY server/ ./server/

# 构建前端
WORKDIR /app/client
RUN npm run build

# 生产阶段
FROM node:18-alpine

# 添加非root用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# 只安装生产环境依赖
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --production

# 复制服务器源代码
COPY --from=builder /app/server ./server
# 复制前端构建文件到正确的路径
COPY --from=builder /app/client/build ./client/build

# 设置环境变量
ENV NODE_ENV=production

# 设置文件所有权
RUN chown -R appuser:appgroup /app

# 显示文件结构(调试用)
RUN ls -la
RUN ls -la ./client || echo "client dir not found"
RUN ls -la ./client/build || echo "build dir not found"

# 切换到非root用户
USER appuser

# 暴露端口
EXPOSE 5000

# 健康检查 - 使用ES模块格式
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node --experimental-vm-modules server/server.js --healthcheck || exit 1

# 启动命令 - 使用ES模块格式
CMD ["node", "--experimental-vm-modules", "server/server.js"] 