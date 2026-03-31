# CRM 系统 - Phase 1 完成文档

## 📋 概述

**Phase 1：核心基础设施完善** 已成功完成！

本阶段实现了CRM系统的核心技术基础，包括：
- ✅ 统一的API响应格式和标准化错误处理
- ✅ 完整的RBAC（基于角色的访问控制）系统
- ✅ 数据库查询、分页和排序工具
- ✅ 现代化的后端和前端API服务层
- ✅ 完善的认证上下文管理

---

## 🎯 本阶段实现的主要功能

### 1. 统一API响应格式 (`utils/response.py`)

```python
# 成功响应
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}

# 错误响应
{
  "success": false,
  "error": "Error message",
  "error_code": "ERROR_CODE",
  "details": { ... }
}

# 分页响应
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### 2. RBAC权限系统 (`utils/rbac.py`)

#### 支持的角色和权限

```
admin:              所有权限
manager:            用户管理、客户、销售、营销、报表
sales:              客户、销售、报表
marketing:          客户、营销、报表
customer_service:   客户
```

#### 权限装饰器使用

```python
from utils.rbac import require_login, require_permission, require_role, require_admin

# 需要登录
@require_login
def my_route():
    user = request.current_user
    return AppResponse.success(data={'user': user.to_dict()})

# 需要特定权限
@require_permission('customers:create')
def create_customer():
    ...

# 需要特定角色
@require_role('admin', 'manager')
def admin_only():
    ...

# 只允许管理员
@require_admin
def admin_route():
    ...
```

### 3. 数据库工具库 (`utils/db.py`)

#### 分页工具
```python
from utils.db import PaginationHelper

page, per_page = PaginationHelper.get_pagination_params()
items, total = PaginationHelper.paginate_query(query, page, per_page)
```

#### 排序工具
```python
from utils.db import SortHelper

sort_by, sort_order = SortHelper.get_sort_params()
query = SortHelper.apply_sort(query, Model, sort_by, sort_order)
```

#### 过滤工具
```python
from utils.db import FilterHelper

filters = FilterHelper.build_filter_from_request(User, ['role', 'is_active'])
query = FilterHelper.apply_filters(query, filters)
```

#### 查询构建器
```python
from utils.db import QueryBuilder

builder = QueryBuilder(User.query, User)
items, total = builder.filter(filters).sort('created_at', 'desc').paginate()
```

### 4. 后端API路由 (`routes/`)

#### 认证路由 (`routes/auth.py`)
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `POST /api/refresh` - 刷新令牌
- `GET /api/me` - 获取当前用户信息
- `POST /api/logout` - 用户登出

#### 用户管理路由 (`routes/users.py`)
- `GET /api/users` - 获取用户列表（支持分页、排序、过滤）
- `GET /api/users/<id>` - 获取用户详情
- `POST /api/users` - 创建新用户
- `PUT /api/users/<id>` - 更新用户信息
- `DELETE /api/users/<id>` - 删除用户
- `PUT /api/users/<id>/password` - 修改用户密码

### 5. 前端API服务 (`frontend/src/services/api.ts`)

```typescript
// 认证 API
authApi.login({ username, password })
authApi.register({ username, email, password, ... })
authApi.getCurrentUser()
authApi.logout()

// 用户管理 API
usersApi.list({ page: 1, per_page: 20 })
usersApi.get(userId)
usersApi.create(userData)
usersApi.update(userId, userData)
usersApi.delete(userId)
usersApi.changePassword(userId, { old_password, new_password })

// 客户管理 API
customersApi.list(params)
customersApi.get(customerId)
customersApi.create(data)
// ... 其他方法

// 销售、营销、报表 API 也已安装就绪
```

### 6. 前端认证上下文 (`frontend/src/contexts/AuthContext.ts`)

```typescript
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username, password) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission) => boolean;
  hasRole: (role) => boolean;
}

// 使用权限检查
const { hasPermission, hasRole } = usePermissions(user);
if (hasPermission('customers:create')) {
  // 显示创建客户按钮
}
```

---

## 🚀 快速开始

### 后端启动

```bash
cd crm_system/backend

# 安装依赖
pip install -r requirements.txt

# 创建 .env 文件（参考 ../../.env.example）
cp .env.example .env

# 初始化数据库
python init_db.py

# 启动服务
python app.py
```

### 前端启动

```bash
cd crm_system/frontend

# 安装依赖
npm install

# 创建 .env 文件
cp .env.example .env

# 启动开发服务器
npm run dev
```

---

## 📚 API 使用示例

### 1. 注册新用户

```bash
curl -X POST http://localhost:5006/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secure_password",
    "first_name": "John",
    "last_name": "Doe",
    "role": "sales"
  }'
```

响应：
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "sales",
    "created_at": "2024-03-24T10:00:00"
  }
}
```

### 2. 用户登录

```bash
curl -X POST http://localhost:5006/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "secure_password"
  }'
```

响应：
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": { ... }
  }
}
```

### 3. 获取用户列表（需要认证）

```bash
curl -X GET "http://localhost:5006/api/users?page=1&per_page=20&role=sales&sort_by=created_at&sort_order=desc" \
  -H "Authorization: Bearer {access_token}"
```

### 4. 创建新用户（需要 admin 权限）

```bash
curl -X POST http://localhost:5006/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "username": "jane_smith",
    "email": "jane@example.com",
    "password": "secure_password",
    "role": "marketing"
  }'
```

---

## 🔧 配置说明

### 环境变量

在根目录创建 `.env` 文件：

```env
# 后端配置
FLASK_ENV=development
DATABASE_URL=sqlite:///crm.db
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key

# 邮件配置
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-password

# 前端配置
VITE_API_BASE_URL=http://localhost:5006/api
```

---

## 📊 数据模型关系

```
User (用户)
├── roles: admin, manager, sales, marketing, customer_service
└── relationships:
    ├── customer_interactions (一对多)
    ├── leads (一对多)
    └── managed_customers (一对多)

Customer (客户)
├── status: lead, prospect, customer, inactive
├── customer_level: VIP, Premium, Standard
└── relationships:
    ├── interactions (一对多)
    ├── orders (一对多)
    ├── leads (一对多)
    └── assigned_to (多对一 User)

Lead (线索)
├── status: new, contacted, qualified, unqualified
└── relationships:
    ├── customer (多对一)
    ├── assigned_to_user (多对一)
    └── campaign_leads (一对多)

Opportunity (销售机会)
├── stage: lead, negotiation, proposal, won, lost
└── relationships:
    ├── customer (多对一)
    └── assigned_to_user (多对一)

Order (订单)
├── status: pending, processing, shipped, delivered, cancelled
└── relationships:
    ├── customer (多对一)
    └── opportunity (多对一)

MarketingCampaign (营销活动)
├── status: draft, active, paused, completed
└── relationships:
    ├── manager (多对一 User)
    └── campaign_leads (一对多)
```

---

## ✨ Phase 1 完成情况总结

| 任务 | 状态 | 说明 |
|------|------|------|
| 统一API响应格式 | ✅ 完成 | 实现了 AppResponse 类，统一所有响应格式 |
| RBAC权限系统 | ✅ 完成 | 实现了完整的角色和权限管理系统 |
| 权限装饰器 | ✅ 完成 | 提供了多种权限检查装饰器 |
| 数据库工具 | ✅ 完成 | 实现了分页、排序、过滤等通用工具 |
| 错误处理 | ✅ 完成 | 统一处理各种HTTP错误响应 |
| 认证路由 | ✅ 完成 | 实现了注册、登录、令牌刷新等功能 |
| 用户管理路由 | ✅ 完成 | 完整的CRUD操作和权限检查 |
| 前端API服务 | ✅ 完成 | 封装了所有API调用，支持自动令牌管理 |
| 前端认证上下文 | ✅ 完成 | 提供了权限检查勾子函数 |
| 环境配置 | ✅ 完成 | 提供了.env配置文件模板 |

---

## 🔜 下一步：Phase 2 准备

Phase 2 将专注于：
- 完善用户权限验证流程
- 实现用户登录状态持久化
- 创建前端权限守卫和路由保护
- 完善前端认证UI（登录页、注册页）
- 整合前端和后端认证系统

---

## 📝 文件列表

### 新建文件
- `crm_system/backend/utils/response.py` - API响应处理
- `crm_system/backend/utils/rbac.py` - RBAC权限系统
- `crm_system/backend/utils/db.py` - 数据库工具
- `.env.example` - 环境变量示例

### 修改文件
- `crm_system/backend/routes/auth.py` - 升级到新的API格式
- `crm_system/backend/routes/users.py` - 完整重写，添加权限检查
- `crm_system/frontend/src/services/api.ts` - 添加完整的API服务
- `crm_system/frontend/src/contexts/AuthContext.ts` - 完善认证上下文

---

## 🤝 贡献指南

在实现其他路由时，请遵循以下约定：

### 路由模板

```python
from flask import Blueprint, request
from utils.response import AppResponse, not_found, bad_request
from utils.rbac import require_permission, get_current_user
from utils.db import PaginationHelper, safe_commit

bp = Blueprint('module', __name__)

@bp.route('/', methods=['GET'])
@require_permission('module:read')
def list_items():
    page, per_page = PaginationHelper.get_pagination_params()
    items, total = PaginationHelper.paginate_query(query, page, per_page)
    
    return AppResponse.paginated(
        items=[item.to_dict() for item in items],
        total=total,
        page=page,
        per_page=per_page
    )
```

### 前端API服务模板

```typescript
export const moduleApi = {
  list: (params?: PaginationParams) =>
    apiRequest<any[]>({
      method: 'GET',
      url: '/modules',
      params,
    }),
    
  get: (id: number) =>
    apiRequest<any>({
      method: 'GET',
      url: `/modules/${id}`,
    }),
};
```

---

**Phase 1 完成日期**: 2024年3月24日
**预估 Phase 2 时长**: 3-4天

祝开发顺利！🎉
