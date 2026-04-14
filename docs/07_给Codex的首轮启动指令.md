# 07_给Codex的首轮启动指令

把下面这段直接发给 Codex 作为第一轮任务：

---
请基于当前仓库中的以下文件开始开发 MVP：
- README.md
- AGENTS.md
- docs/01_MVP产品规格书_PRD.md
- docs/02_技术架构与模块设计.md
- docs/03_数据库Schema与API草案.md
- docs/04_Codex开发任务拆解_Sprints.md
- docs/05_Prompt系统与评审规范.md
- docs/06_review_schema.json
- db/schema.sql

本轮只做 Sprint 0 + Sprint 1，不要提前扩展 Sprint 2 之后的内容。

本轮目标：
1. 初始化 monorepo
2. 建立 web 应用骨架
3. 接入 PostgreSQL
4. 落地 `db/schema.sql` 对应的迁移或 ORM schema
5. 完成 universe / character 的最小 CRUD
6. 做出基础页面：
   - /universes
   - /characters
   - /characters/[id]

严格遵守 AGENTS.md。

开发要求：
- 先输出实施计划
- 再开始改代码
- 改完后给出：
  - 变更文件清单
  - 运行方式
  - 已完成项
  - 未完成项
  - 风险点

禁止：
- 不要提前做模型调用
- 不要提前做任务队列
- 不要提前做自动评审
- 不要擅自更换技术栈

验收标准：
- 项目可启动
- lint/typecheck 可运行
- 能创建 Universe
- 能创建 Character
- 角色详情页能显示结构化设定字段
---

建议等 Sprint 0 + 1 跑通后，再开启下一轮，让 Codex继续做 Sprint 2。
