# Phase 4：销售流程与管道管理完成

## 📋 概述

Phase 4 成功实现了完整的销售流程和管道管理系统，包括销售机会跟踪、订单管理、销售管道分析和进度监控。

## ✅ 已完成功能

### 后端实现 (Flask API)

#### 1. 销售路由完全重构 (`routes/sales.py`)
- ✅ 使用 `AppResponse` 统一响应格式
- ✅ 使用 `@require_permission` 装饰器进行权限检查
- ✅ 使用 `@require_role` 装饰器进行角色检查
- ✅ 完整的流程控制和数据验证

#### 2. 销售机会 (Opportunities) API 端点

**GET /opportunities** - 获取销售机会列表
- 参数：`page`, `per_page`, `search`, `stage`, `customer_id`, `assigned_to`, `min_value`, `max_value`, `sort_by`, `sort_order`
- 权限：`sales:read`
- 功能：
  - 分页支持（每页10/25/50条）
  - 按阶段筛选（Lead, Qualification, Proposal, Negotiation, Won, Lost）
  - 按客户筛选
  - 按分配人员筛选
  - 按金额范围筛选（$min_value - $max_value）
  - 全文搜索（机会名称）
  - 灵活排序（按预期关闭日期、金额等）
  - 权限隔离（非管理员/经理只看自己的）

**GET /opportunities/<id>** - 获取单个机会详情
- 权限：`sales:read`
- 功能：权限检查和详情返回

**POST /opportunities** - 创建新机会
- 权限：`sales:create`
- 必需字段：`name`, `customer_id`, `value`
- 可选字段：`assigned_to`, `stage`, `probability`, `expected_close_date`, `description`
- 功能：
  - 客户存在性验证
  - 默认阶段：lead
  - 默认概率：0%
  - 自动分配给创建者（如未指定）

**PUT /opportunities/<id>** - 更新机会信息
- 权限：`sales:update`
- 可更新字段：`name`, `stage`, `value`, `probability`, `expected_close_date`, `description`, `assigned_to`
- 功能：状态转移、概率更新、分配转移

**DELETE /opportunities/<id>** - 删除机会
- 权限：`admin` 角色（仅限管理员）

#### 3. 订单 (Orders) API 端点

**GET /orders** - 获取订单列表
- 参数：`page`, `per_page`, `search`, `status`, `customer_id`, `min_amount`, `max_amount`, `sort_by`, `sort_order`
- 权限：`sales:read`
- 功能：
  - 分页支持（每页10/25/50条）
  - 按状态筛选（Pending, Confirmed, Shipped, Delivered, Cancelled）
  - 按客户筛选
  - 按金额范围筛选
  - 按订单号搜索
  - 灵活排序（按订单日期等）

**GET /orders/<id>** - 获取单个订单详情
- 权限：`sales:read`

**POST /orders** - 创建新订单
- 权限：`sales:create`
- 必需字段：`customer_id`, `total_amount`
- 可选字段：`opportunity_id`, `status`, `currency`, `order_date`, `notes`
- 功能：
  - 自动生成订单号（格式：ORD-YYYYMMDD-XXXXXXXX）
  - 客户存在性验证
  - 机会链接验证（如提供）
  - 默认状态：pending
  - 默认货币：USD

**PUT /orders/<id>** - 更新订单状态
- 权限：`sales:update`
- 可更新字段：`status`, `total_amount`, `shipped_date`, `delivered_date`, `notes`
- 功能：订单生命周期管理

**DELETE /orders/<id>** - 删除订单
- 权限：`admin` 角色（仅限管理员）

#### 4. 销售管道分析 API 端点

**GET /pipeline/summary** - 获取销售管道摘要
- 权限：`sales:read`
- 返回数据：
  ```json
  {
    "total_opportunities": 15,
    "total_value": 500000.00,
    "weighted_value": 125000.00,
    "stages": {
      "lead": {
        "count": 5,
        "total_value": 100000,
        "avg_probability": 20,
        "opportunities": [1, 2, 3, 4, 5]
      },
      "proposal": {
        "count": 3,
        "total_value": 150000,
        "avg_probability": 50,
        "opportunities": [6, 7, 8]
      }
    }
  }
  ```
- 功能：
  - 计算总机会数
  - 计算总管道价值
  - 计算加权价值（价值 × 概率）
  - 按阶段分组统计
  - 计算各阶段平均概率

### 前端实现 (React + TypeScript)

#### 5. 销售管理页面 (`pages/Sales.tsx`)

**核心功能：**

1. **两个标签页界面**
   - **Sales Pipeline** - 销售机会管理
   - **Orders** - 订单管理

2. **销售管道标签页**

   **管道摘要仪表板**
   - 总机会数统计
   - 管道总价值展示
   - 加权价值计算（考虑成单概率）
   - 按阶段分组显示
   - 各阶段进度条（显示平均概率）
   - 实时更新

   **机会列表**
   - 分页表格显示
   - 实时搜索
   - 按阶段筛选（LeadQualification、Proposal、Negotiation、Won、Lost）
   - 灵活分页（10/25/50 条/页）
   - 显示列：
     - 机会名称
     - 阶段（颜色编码）
     - 金额价值
     - 成单概率（进度条）
     - 预期关闭日期
   - 创建新机会按钮
   - 查看详情功能

   **机会详情模态框**
   - **查看模式**：显示所有信息
   - **编辑模式**：编辑表单
   - 可编辑字段：
     - 机会名称
     - 阶段（支持状态转移）
     - 金额价值
     - 成单概率
     - 预期关闭日期
     - 描述
   - 编辑/保存/删除操作

3. **订单标签页**

   **订单列表**
   - 分页表格显示
   - 实时搜索（订单号）
   - 按状态筛选（Pending、Confirmed、Shipped、Delivered、Cancelled）
   - 灵活分页（10/25/50 条/页）
   - 显示列：
     - 订单号
     - 状态（颜色编码）
     - 金额（带货币符号）
     - 订单日期
     - 最后交付状态（发货日期/交付日期）
   - 创建新订单按钮
   - 查看详情功能

   **订单详情模态框**
   - **查看模式**：显示所有信息
   - **编辑模式**：编辑表单
   - 可编辑字段：
     - 订单状态
     - 金额
     - 发货日期
     - 交付日期
     - 备注
   - 编辑/保存/删除操作

4. **UI/UX 特性**
   - Chakra UI 组件库
   - 响应式设计
   - Badge 样式标识（阶段和状态）
   - 颜色编码：
     - 阶段：Lead(蓝色), Qualification(青色), Proposal(紫色), Negotiation(橙色), Won(绿色), Lost(红色)
     - 订单状态：Pending(黄色), Confirmed(蓝色), Shipped(紫色), Delivered(绿色), Cancelled(红色)
   - 进度条显示（成单概率）
   - 加载状态 (Spinner)
   - Toast 通知（成功/错误）
   - 确认对话框（删除操作）

### 6. 权限控制

**实现的权限检查：**
- `sales:read` - 查看销售机会和订单列表
- `sales:create` - 创建新机会和订单
- `sales:update` - 修改机会和订单信息

**角色限制：**
- 仅 `admin` 角色可以删除机会和订单
- 非管理员/经理用户只能看到分配给自己的机会

## 📊 数据结构

```typescript
// 销售机会对象
interface Opportunity {
  id: number;
  name: string;
  customer_id: number;
  assigned_to: number;
  stage: 'lead' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';
  value: number;
  probability: number;  // 0-100
  expected_close_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// 订单对象
interface Order {
  id: number;
  order_number: string;  // ORD-YYYYMMDD-XXXXXXXX
  customer_id: number;
  opportunity_id?: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  currency: string;
  order_date: string;
  shipped_date?: string;
  delivered_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 管道摘要对象
interface PipelineSummary {
  total_opportunities: number;
  total_value: number;
  weighted_value: number;
  stages: Record<string, {
    count: number;
    total_value: number;
    avg_probability: number;
    opportunities: number[];
  }>;
}
```

## 🔌 API 端点汇总

| 方法 | 端点 | 权限 | 说明 |
|-----|------|------|------|
| GET | `/api/opportunities` | `sales:read` | 获取机会列表（支持分页、筛选、搜索） |
| GET | `/api/opportunities/<id>` | `sales:read` | 获取单个机会详情 |
| POST | `/api/opportunities` | `sales:create` | 创建新机会 |
| PUT | `/api/opportunities/<id>` | `sales:update` | 更新机会信息 |
| DELETE | `/api/opportunities/<id>` | `admin` | 删除机会 |
| GET | `/api/orders` | `sales:read` | 获取订单列表（支持分页、筛选） |
| GET | `/api/orders/<id>` | `sales:read` | 获取单个订单详情 |
| POST | `/api/orders` | `sales:create` | 创建新订单 |
| PUT | `/api/orders/<id>` | `sales:update` | 更新订单信息 |
| DELETE | `/api/orders/<id>` | `admin` | 删除订单 |
| GET | `/api/pipeline/summary` | `sales:read` | 获取销售管道摘要 |

## 🧪 使用场景

### 机会管理流程
```
1. 销售人员点击 "+ New Opportunity"
2. 填写机会信息（名称、客户、金额、预期日期等）
3. 系统计算加权价值显示在仪表板
4. 随着销售进展，更新机会阶段和概率
5. 达到 "Won" 阶段后，可创建相应订单
6. 系统自动更新管道摘要数据
```

### 订单跟踪流程
```
1. 创建订单时自动生成唯一订单号
2. 订单可选关联销售机会
3. 随着订单进度，更新状态（Pending → Confirmed → Shipped → Delivered）
4. 系统记录各阶段的时间戳
5. 管理人员可以实时监控订单状态
```

### 销售分析流程
```
1. 管理者查看 Pipeline Summary 仪表板
2. 了解各阶段的机会数量和价值
3. 识别风险（概率低但金额大的机会）
4. 识别机会（概率高的机会）
5. 做出数据驱动的销售决策
```

## 📁 文件清单

### 后端文件
- `backend/routes/sales.py` - 完全重构（400+ 行，使用 AppResponse 和 RBAC）

### 前端文件
- `frontend/src/pages/Sales.tsx` - 完整的销售管理页面（1200+ 行）

## 🔒 安全特性

1. **JWT 认证** - 所有端点都需要有效的 JWT 令牌
2. **权限隔离** - 非管理员用户只能看到分配给自己的机会
3. **数据验证** - 服务端验证所有输入
4. **客户验证** - 创建机会/订单时验证客户存在
5. **机会验证** - 创建订单时验证关联的机会存在
6. **删除保护** - 仅管理员可删除机会和订单

## 🎯 关键特性

✅ **销售管道可视化**
- 实时仪表板显示管道价值
- 按阶段分组统计
- 加权价值计算（概率权重）

✅ **机会管理**
- 完整的机会生命周期
- 状态转移（Lead → Won/Lost）
- 概率管理（0-100%）
- 日期跟踪

✅ **订单管理**
- 订单号自动生成
- 订单状态跟踪
- 发货和交付日期记录
- 订单与机会关联

✅ **数据分析**
- 总价值统计
- 加权价值计算
- 各阶段平均概率
- 按阶段分组

✅ **多维度筛选和搜索**
- 按金额范围
- 按阶段/状态
- 按分配人员
- 全文搜索

✅ **权限管理**
- 基于角色的访问控制
- 数据隔离政策
- 细粒度权限检查

## 🚀 与现有系统的集成

- ✅ 与 AuthProvider 集成（权限检查）
- ✅ 与 AppResponse 标准集成
- ✅ 与 RBAC 系统集成
- ✅ 与 API 拦截器集成（自动令牌刷新）
- ✅ 与 Chakra UI 主题集成
- ✅ 与客户管理系统集成（客户验证）

## 📈 指标和 KPI

系统支持以下业务指标：
- **管道价值** - 所有开放机会的总价值
- **加权管道价值** - 考虑成单概率的价值
- **阶段分布** - 各销售阶段的机会数
- **平均概率** - 各阶段的平均成单概率
- **订单统计** - 订单数、金额、状态分布

## 📝 后续改进建议

1. **销售预报** - 基于历史数据预测收入
2. **活动跟踪** - 记录每个机会的销售活动
3. **交易分析** - 赢单/失单原因分析
4. **竞争对手跟踪** - 记录竞争对手信息
5. **文件管理** - 上传和存储提案、合同等文件
6. **交易历史** - 完整的交易变更日志
7. **提醒功能** - 接近关闭日期的自动提醒
8. **批量操作** - 批量更新机会状态
9. **导出报表** - 导出销售管道为 PDF/Excel
10. **移动应用** - 移动端销售应用

## 🔗 相关文件

- [Phase 1 完成文档](./PHASE1_COMPLETE.md) - 核心基础设施
- [Phase 2 完成文档](./PHASE2_COMPLETE.md) - 用户认证和权限管理
- [Phase 3 完成文档](./PHASE3_COMPLETE.md) - 客户管理模块
- [项目规范](./PHASE1_SUMMARY.md) - 项目总体规范

---

**状态**: ✅ 完成  
**完成日期**: 2026年3月24日  
**下一步**: Phase 5 - 营销自动化与线索管理
