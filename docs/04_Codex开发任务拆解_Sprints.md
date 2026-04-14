# 04_Codex开发任务拆解 Sprints

## 总原则
- 先通闭环，再做优化
- 每个 Sprint 必须有可运行成果
- 每个 Sprint 结束后都要通过人工 smoke test

---

## Sprint 0：仓库初始化
### 目标
建立基础工程骨架，让后续功能能持续叠加。

### 必做
- 初始化 monorepo
- 配置 TypeScript / ESLint / Prettier
- 初始化 Next.js web
- 配置环境变量管理
- 创建 docs / db / packages 目录
- 接入 PostgreSQL
- 接入 Redis
- 接入对象存储抽象层

### 交付物
- 可运行的 web 首页
- 可连接数据库
- 可连接 Redis
- 可读取 env

### 验收
- `pnpm dev` 可跑
- `pnpm lint` 通过
- `pnpm typecheck` 通过

---

## Sprint 1：角色与世界观管理
### 目标
能先把角色数据与世界观数据维护起来。

### 必做
- universes CRUD
- characters CRUD
- 角色列表页
- 角色详情页
- 基础表单组件

### 交付物
- `/characters`
- `/characters/[id]`
- `/universes`

### 验收
- 可新增 1 个世界观
- 可新增 1 个角色
- 角色详情页能展示 JSON 设定

---

## Sprint 2：Prompt 编译器
### 目标
把 Prompt 从自由文本改成结构化编译。

### 必做
- 建立 Prompt 模板配置
- 实现 compilePrompt()
- 实现 buildVariantPrompts()
- 实现 patch 合成器基础版
- 保存 prompt_versions

### 交付物
- `packages/prompt-compiler`
- prompt 调试页

### 验收
- 输入一个角色与任务参数，能生成 3 个 prompt 变体
- 变体差异清晰可见
- Prompt 可持久化

---

## Sprint 3：Explore 批量出图
### 目标
打通第一次真正的“任务 -> 多图”链路。

### 必做
- 创建 generation_jobs
- BullMQ 任务队列
- generateExploreCandidates processor
- 调用 OpenAI 图像生成
- 保存 generated_images
- 任务状态更新

### 交付物
- 创建任务页
- 任务详情页基础版
- 候选图网格

### 验收
- 1 个任务可生成 12 张图
- 图片元数据完整落库
- 失败时可见错误信息

---

## Sprint 4：自动视觉评审
### 目标
建立结构化评审能力。

### 必做
- 接入 review schema
- reviewGeneratedImage processor
- 将各维度分数与失败标签落库
- 候选图自动排序
- 任务详情页展示评分

### 交付物
- 自动评审服务
- 评分组件
- 失败标签组件

### 验收
- 每张图片至少有 1 条 auto review
- 前端能按总分排序
- 失败标签可见

---

## Sprint 5：多图对比与人工决策
### 目标
让人工筛图真正高效。

### 必做
- 2 图对比模式
- 4 图宫格模式
- 提交 keep / reject / candidate_master / set_master / refine_from_this
- 切换 Master 图
- 历史 Master 回退能力

### 交付物
- Compare 页面
- 决策工具条
- Anchor 状态切换逻辑

### 验收
- 可将某图设为 Master
- 旧 Master 自动标记 deprecated
- 角色页正确展示最新 Master

---

## Sprint 6：Refine 与 Patch 闭环
### 目标
让系统支持“看到问题 -> 自动生成下一轮修复建议 -> 再跑”。

### 必做
- proposePromptPatch processor
- patch 可视化
- refine 任务创建
- 支持 source_image_id
- Prompt 版本关系图

### 交付物
- Patch 面板
- Refine 创建入口
- Prompt 版本页

### 验收
- 某张图被评为 refine 后，可一键新建 refine 任务
- refine 任务能继承上一轮设定
- patch 原文可见

---

## Sprint 7：工作台聚合与统计
### 目标
让日常使用更顺手。

### 必做
- 角色工作台聚合接口
- 失败标签 Top N
- 最近任务摘要
- 最近评分趋势
- prompt 版本平均分

### 交付物
- `/characters/[id]/workbench`

### 验收
- 一个页面能看懂该角色最近发生了什么

---

## Sprint 8：回归测试与工程加固
### 目标
进入稳定可持续开发状态。

### 必做
- 单元测试
- 集成测试
- API 错误规范
- 幂等与重试
- 基础 observability
- 审计日志

### 交付物
- 测试脚本
- 日志中间件
- Error boundary

### 验收
- 核心服务覆盖基础测试
- 关键页面不再依赖手工调试

---

## 每个 Sprint 的 Codex 指令模板
建议每个 Sprint 单独开一个任务线程，发给 Codex 的提示词保持固定格式：

### 模板
1. 本轮目标
2. 必做范围
3. 禁止扩展范围
4. 交付物清单
5. 本轮验收标准
6. 先给实施计划，再开始改代码
7. 每完成一个模块，输出变更摘要

---

## 第一轮最建议直接给 Codex 的任务
### Task A
按本包初始化 monorepo 与基础工程

### Task B
根据 `db/schema.sql` 建立数据库模型与迁移

### Task C
实现 universe / character CRUD

### Task D
实现 prompt-compiler 的 compilePrompt 与 buildVariantPrompts

### Task E
实现 explore 任务入队与图片生成基础链路
