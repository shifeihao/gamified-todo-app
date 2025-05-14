# 构建阶段
FROM node:18-alpine as builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 文件
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# 安装依赖
WORKDIR /app/client
RUN npm install
WORKDIR /app/server
RUN npm install

# 复制源代码
WORKDIR /app
COPY client/ ./client/
COPY server/ ./server/

# 构建前端
WORKDIR /app/client
RUN npm run build

# 生产阶段
FROM node:18-alpine

WORKDIR /app

# 复制服务器文件和构建后的前端文件
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/build ./client/build

# 设置工作目录到服务器目录
WORKDIR /app/server

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["node", "server.js"] 