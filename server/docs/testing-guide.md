# TaskMaster项目测试指南

## 测试框架概述

TaskMaster项目使用以下测试框架和工具:

- **Jest**: 主要测试框架
- **SuperTest**: 用于API集成测试
- **MongoDB Memory Server**: 内存数据库，用于测试环境

## 测试类型

项目包含两种主要的测试类型:

1. **单元测试**: 测试单个控制器方法的功能
2. **集成测试**: 测试完整的API端点，包括请求处理和数据库交互

## 测试目录结构

```
server/__tests__/
├── setup.js                    # 测试环境设置
├── integration/                # 集成测试
│   ├── user.test.js            # 用户API测试
│   └── dungeon.test.js         # 地下城API测试
└── unit/                       # 单元测试
    └── controllers/            # 控制器测试
        ├── taskController.test.js      # 任务控制器测试
        ├── cardController.test.js      # 卡片控制器测试
        └── dungeonController.test.js   # 地下城控制器测试
```

## 运行测试

可以使用以下命令运行测试:

```bash
# 运行所有测试
npm test

# 监视模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

## 测试覆盖的核心功能

### 1. 用户系统
- 用户注册
- 用户登录
- 获取用户信息
- 更新用户信息

### 2. 任务系统
- 创建任务
- 获取任务列表
- 更新任务状态
- 删除任务

### 3. 卡片系统
- 获取卡片库存
- 发放每日/每周卡片
- 使用卡片

### 4. 地下城探索系统
- 进入地下城
- 探索当前楼层
- 战斗系统
- 总结探索结果

## 编写新测试

### 单元测试示例

```javascript
// 导入需要测试的控制器函数
import { getTaskById } from '../../../controllers/taskController.js';

// 模拟请求和响应
const req = {
  user: { _id: 'user-id' },
  params: { id: 'task-id' }
};
const res = mockResponse();

// 测试函数
it('应该获取指定任务', async () => {
  await getTaskById(req, res);
  expect(res.json).toHaveBeenCalled();
});
```

### 集成测试示例

```javascript
it('应该获取用户任务列表', async () => {
  const res = await request(app)
    .get('/api/tasks')
    .set('Authorization', `Bearer ${authToken}`);
    
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});
```

## 持续集成

项目配置了GitHub Actions进行持续集成测试。每次推送到主分支或创建Pull Request时，都会自动运行测试。

配置文件位于 `.github/workflows/test.yml`

## 最佳实践

1. **独立测试**: 每个测试应该独立运行，不依赖其他测试的状态
2. **模拟外部依赖**: 使用Jest的mock功能模拟外部服务
3. **清理测试数据**: 每次测试后清理测试数据
4. **合理命名**: 测试名称应清晰描述测试内容

## 常见问题排查

### 测试超时
默认的测试超时时间可能不足以完成某些操作。可以在测试中增加超时设置:

```javascript
it('长时间操作测试', async () => {
  // 将超时设置为10秒
}, 10000);
```

### 数据库连接问题
确保测试环境正确设置。检查`setup.js`中的数据库连接配置。

### 异步问题
确保正确处理异步测试，使用`async/await`或`done`回调。 