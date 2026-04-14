# 角色库工作台 - Codex 启动包

本包用于启动「广东城市拟人角色库工作台」MVP 开发。目标是将当前手工进行的“多轮生图 -> 自动评审 -> Prompt 修复 -> 人工锁稿”流程工程化，交由 Codex 逐步实现。

## 项目目标
构建一个 Web 工具，服务于 7 个角色的角色库搭建与持续迭代，支持：
- 角色设定管理
- Prompt 模板管理
- 批量候选图生成
- 自动视觉评审
- 多图对比与人工筛选
- Prompt Patch 精修
- 标准稿锁定与版本沉淀

## 推荐技术栈
- 前端：Next.js + TypeScript + Tailwind + shadcn/ui
- 后端：Next.js Route Handlers / Node.js
- 数据库：PostgreSQL
- 缓存与队列：Redis + BullMQ
- 存储：S3 / R2 / Supabase Storage
- 模型调用：OpenAI Responses API + Image API

## 建议仓库结构
```txt
character-factory/
  AGENTS.md
  README.md
  package.json
  apps/
    web/
  packages/
    core/
    db/
    openai-client/
    prompt-compiler/
    review-engine/
    job-runner/
    types/
  docs/
    01_MVP产品规格书_PRD.md
    02_技术架构与模块设计.md
    03_数据库Schema与API草案.md
    04_Codex开发任务拆解_Sprints.md
    05_Prompt系统与评审规范.md
    06_review_schema.json
  db/
    schema.sql
```

## 文件说明
- `docs/01_MVP产品规格书_PRD.md`：产品目标、用户流程、页面、验收标准
- `docs/02_技术架构与模块设计.md`：系统架构、模块边界、服务职责
- `docs/03_数据库Schema与API草案.md`：表设计、API、状态流转
- `docs/04_Codex开发任务拆解_Sprints.md`：开发顺序、每个 Sprint 交付物
- `docs/05_Prompt系统与评审规范.md`：Prompt 编译、Patch、自动评审规范
- `docs/06_review_schema.json`：自动评审 Structured Output JSON Schema
- `db/schema.sql`：首版 PostgreSQL 建表草案
- `AGENTS.md`：仓库级 Codex 指令文件

## 交付原则
1. 先把“批量出图 + 自动评审 + 人工筛选”闭环做通，再做高级自动化。
2. 所有模型调用必须走统一 service 层。
3. 所有生成结果必须可追溯到 prompt 版本、任务、图片、评审记录。
4. 最终锁稿必须由人确认，不做全自动定稿。
5. 每次修改都必须可回滚。

## 启动建议
先按 `docs/04_Codex开发任务拆解_Sprints.md` 的 Sprint 1 -> Sprint 3 顺序执行。只要 Sprint 3 完成，MVP 的基础闭环就成立了。
