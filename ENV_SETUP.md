# Environment Configuration Guide | 环境配置说明文档

## Project Environment Configuration Introduction | 项目环境配置简介

This project uses a unified MongoDB Atlas database, developed locally on Windows and deployed on a Linux server on DigitalOcean.

本项目使用统一的MongoDB Atlas数据库，在Windows本地开发，部署在DigitalOcean的Linux服务器上。

## File Structure | 文件结构

```
Project Root/
├── .env.shared          # MongoDB Atlas connection configuration
├── .env.production      # Production environment template (without database configuration)
├── client/
│   └── .env.development # Frontend development environment configuration
└── server/
    └── .env.development # Backend development environment configuration
```

```
项目根目录/
├── .env.shared          # MongoDB Atlas连接配置
├── .env.production      # 生产环境配置模板（不含数据库配置）
├── client/
│   └── .env.development # 前端开发环境配置
└── server/
    └── .env.development # 后端开发环境配置
```

## Windows Local Development Setup | Windows本地开发设置

1. **Setting up the Frontend Environment | 设置前端环境**
   ```powershell
   # Enter the frontend directory
   cd client
   
   # Copy the development environment configuration
   copy .env.development .env
   
   # Install dependencies (if not already installed)
   npm install
   
   # Start the frontend development server
   npm start
   ```

   ```powershell
   # 进入前端目录
   cd client
   
   # 复制开发环境配置
   copy .env.development .env
   
   # 安装依赖（如果尚未安装）
   npm install
   
   # 启动前端开发服务器
   npm start
   ```

2. **Setting up the Backend Environment | 设置后端环境**
   ```powershell
   # Enter the backend directory
   cd server
   
   # Copy the development environment configuration
   copy .env.development .env
   
   # Install dependencies (if not already installed)
   npm install
   
   # Start the backend development server
   npm run dev
   ```

   ```powershell
   # 进入后端目录
   cd server
   
   # 复制开发环境配置
   copy .env.development .env
   
   # 安装依赖（如果尚未安装）
   npm install
   
   # 启动后端开发服务器
   npm run dev
   ```

## DigitalOcean Linux Server Deployment | DigitalOcean Linux服务器部署

1. **Connecting to the Server | 连接到服务器**
   ```bash
   # Use SSH to connect to your DigitalOcean server
   ssh root@your_server_ip
   ```

   ```bash
   # 使用SSH连接到您的DigitalOcean服务器
   ssh root@your_server_ip
   ```

2. **Preparing the Deployment Environment | 准备部署环境**
   ```bash
   # Create a deployment directory
   mkdir -p /var/www/taskmasters
   cd /var/www/taskmasters

   # Install Git (if not already installed)
   apt update
   apt install git

   # Clone the project code
   git clone your_repository_url .

   # Install Docker and Docker Compose (if not already installed)
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   apt install docker-compose
   ```

   ```bash
   # 创建部署目录
   mkdir -p /var/www/taskmasters
   cd /var/www/taskmasters

   # 安装Git（如果尚未安装）
   apt update
   apt install git

   # 克隆项目代码
   git clone your_repository_url .

   # 安装Docker和Docker Compose（如果尚未安装）
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   apt install docker-compose
   ```

3. **Setting up Environment Variables | 设置环境变量**
   ```bash
   # Create environment files on the server
   # First copy the MongoDB configuration
   cp .env.shared .env
   
   # Then append the production environment configuration
   cat .env.production >> .env
   
   # Edit the environment file to set actual production values
   nano .env
   ```

   ```bash
   # 在服务器上创建环境文件
   # 首先复制MongoDB配置
   cp .env.shared .env
   
   # 然后追加生产环境配置
   cat .env.production >> .env
   
   # 编辑环境文件设置实际的生产环境值
   nano .env
   ```
   
   Values that need to be modified in the .env file | 在.env文件中需要修改的值：
   ```bash
   # Generate a new JWT key
   JWT_SECRET=$(openssl rand -hex 64)
   
   # Set your domain or server IP
   API_URL=https://your-domain.com
   # If you don't have a domain yet, you can temporarily use the IP
   # API_URL=http://your_server_ip:5000
   ```

   ```bash
   # 生成新的JWT密钥
   JWT_SECRET=$(openssl rand -hex 64)
   
   # 设置您的域名或服务器IP
   API_URL=https://your-domain.com
   # 如果还没有域名，可以临时使用IP
   # API_URL=http://your_server_ip:5000
   ```

4. **Starting the Application | 启动应用**
   ```bash
   # Build and start Docker containers
   docker-compose up -d
   
   # Check container status
   docker-compose ps
   
   # View logs
   docker-compose logs -f
   ```

   ```bash
   # 构建并启动Docker容器
   docker-compose up -d
   
   # 查看容器状态
   docker-compose ps
   
   # 查看日志
   docker-compose logs -f
   ```

5. **Setting up a Firewall (Recommended) | 设置防火墙（推荐）**
   ```bash
   # Install firewall
   apt install ufw
   
   # Allow SSH connections
   ufw allow ssh
   
   # Allow HTTP and HTTPS
   ufw allow 80
   ufw allow 443
   
   # Allow application ports (if not using a reverse proxy)
   ufw allow 5000
   
   # Enable the firewall
   ufw enable
   ```

   ```bash
   # 安装防火墙
   apt install ufw
   
   # 允许SSH连接
   ufw allow ssh
   
   # 允许HTTP和HTTPS
   ufw allow 80
   ufw allow 443
   
   # 允许应用端口（如果不使用反向代理）
   ufw allow 5000
   
   # 启用防火墙
   ufw enable
   ```

## Environment Variables Explanation | 环境变量说明

### Shared Configuration (.env.shared) | 共享配置 (.env.shared)
- `MONGODB_URI`: MongoDB Atlas connection string (used for all environments)

- `MONGODB_URI`: MongoDB Atlas连接字符串（用于所有环境）

### Development Environment Configuration (Windows) | 开发环境配置（Windows）
- `NODE_ENV`: development
- `PORT`: 5000
- `JWT_SECRET`: development_jwt_secret_key
- `API_URL`: http://localhost:5000
- `MONGOOSE_DEBUG`: true

- `NODE_ENV`: development
- `PORT`: 5000
- `JWT_SECRET`: development_jwt_secret_key
- `API_URL`: http://localhost:5000
- `MONGOOSE_DEBUG`: true

### Production Environment Configuration (Linux) | 生产环境配置（Linux）
- `NODE_ENV`: production
- `PORT`: 5000
- `JWT_SECRET`: [automatically generated 64-bit key]
- `API_URL`: [your domain or server IP]
- `REACT_APP_API_BASE_URL`: /api
- `MONGOOSE_DEBUG`: false

- `NODE_ENV`: production
- `PORT`: 5000
- `JWT_SECRET`: [自动生成的64位密钥]
- `API_URL`: [您的域名或服务器IP]
- `REACT_APP_API_BASE_URL`: /api
- `MONGOOSE_DEBUG`: false

## Notes | 注意事项

1. **Environment Variable File Priority | 环境变量文件优先级**
   - In the production environment, the configuration in `.env.shared` will be loaded first
   - The configuration in `.env.production` will be appended afterward, but will not override the database configuration
   - Make sure not to redefine `MONGODB_URI` in `.env.production`

   - 生产环境中，`.env.shared` 的配置会被优先加载
   - `.env.production` 的配置会在后面追加，但不会覆盖数据库配置
   - 确保不要在 `.env.production` 中重复定义 `MONGODB_URI`

2. **Database Usage | 数据库使用**
   - Development and production environments share the same MongoDB Atlas database
   - Please handle data with care to avoid affecting production data during development
   - Ensure MongoDB Atlas allows access from your server IP

   - 开发和生产环境共享同一个MongoDB Atlas数据库
   - 请谨慎操作数据，避免在开发时影响生产数据
   - 确保MongoDB Atlas允许从您的服务器IP访问

3. **Security Recommendations | 安全建议**
   - Do not commit `.env` files containing sensitive information to the code repository
   - Regularly update the server system and Docker
   - Use strong passwords and SSH keys for server access
   - Consider setting up an SSL certificate (can use Let's Encrypt)

   - 不要将包含敏感信息的 `.env` 文件提交到代码仓库
   - 定期更新服务器系统和Docker
   - 使用强密码和SSH密钥进行服务器访问
   - 考虑设置SSL证书（可以使用Let's Encrypt）

4. **Troubleshooting | 故障排除**
   - If you encounter database connection issues:
     * Check MongoDB Atlas network access settings
     * Ensure your server IP has been added to the MongoDB Atlas whitelist
   - If containers fail to start:
     * Check `docker-compose logs -f` for detailed error messages
     * Ensure all necessary ports are not occupied
   - If the frontend cannot connect to the backend:
     * Check firewall settings
     * Verify that the API_URL configuration is correct

   - 如果遇到数据库连接问题：
     * 检查MongoDB Atlas网络访问设置
     * 确保已将服务器IP添加到MongoDB Atlas白名单
   - 如果容器无法启动：
     * 检查 `docker-compose logs -f` 查看详细错误信息
     * 确保所有必要的端口未被占用
   - 如果前端无法连接后端：
     * 检查防火墙设置
     * 验证API_URL配置是否正确

## Quick Reference | 快速参考

### Windows Development Environment Startup | Windows开发环境启动
```powershell
cd client && copy .env.development .env && npm start
cd server && copy .env.development .env && npm run dev
```

### Linux Production Environment Deployment | Linux生产环境部署
```bash
# Deployment
cp .env.shared .env
cat .env.production >> .env
nano .env  # Set JWT_SECRET and API_URL
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

```bash
# 部署
cp .env.shared .env
cat .env.production >> .env
nano .env  # 设置JWT_SECRET和API_URL
docker-compose up -d

# 查看状态
docker-compose ps
docker-compose logs -f
```

### Common Docker Commands | 常用Docker命令
```bash
# Restart services
docker-compose restart

# Stop services
docker-compose down

# View container status
docker ps

# Clean up unused resources
docker system prune -a
```

```bash
# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 查看容器状态
docker ps

# 清理未使用的资源
docker system prune -a
``` 