# 03_数据库Schema与API草案

## 1. 表设计原则
- 一张图必须属于一个生成任务
- 一次任务可以有多个 Prompt 变体
- 一张图可以有多个评审记录，但 MVP 只要求 1 条 auto + 多条 human
- Master 图不直接覆盖老记录，而是通过角色锚点表切换 active 状态

## 2. 核心表
### 2.1 universes
字段：
- id
- code
- name
- style_constitution_json
- global_prompt_template
- global_negative_template
- created_at
- updated_at

### 2.2 characters
字段：
- id
- universe_id
- code
- name
- status
- description
- fixed_traits_json
- semi_fixed_traits_json
- variable_defaults_json
- palette_json
- negative_rules_json
- created_at
- updated_at

### 2.3 character_anchor_images
字段：
- id
- character_id
- image_id
- role
- is_active
- prompt_version_id
- score_snapshot_json
- created_at

role 枚举：
- master
- style_anchor
- pose_anchor
- deprecated_master

### 2.4 generation_jobs
字段：
- id
- character_id
- mode
- status
- source_image_id
- input_config_json
- batch_size
- created_by
- created_at
- updated_at

mode 枚举：
- explore
- refine
- edit

status 枚举：
- queued
- running
- reviewing
- completed
- failed

### 2.5 prompt_versions
字段：
- id
- character_id
- job_id
- parent_prompt_version_id
- scope
- variant_key
- strategy
- compiled_prompt
- compiled_negative_prompt
- patch_json
- debug_payload_json
- created_at

### 2.6 generated_images
字段：
- id
- job_id
- prompt_version_id
- source_api
- model_name
- image_url
- thumb_url
- revised_prompt
- generation_meta_json
- status
- created_at

status 枚举：
- created
- reviewed
- selected
- rejected
- candidate_master
- master

### 2.7 review_results
字段：
- id
- image_id
- reviewer_type
- total_score
- style_score
- identity_score
- ratio_score
- pose_score
- palette_score
- sheet_score
- tags_json
- notes_json
- created_at

reviewer_type 枚举：
- auto
- human

### 2.8 human_decisions
字段：
- id
- job_id
- image_id
- action
- reasons_json
- created_by
- created_at

action 枚举：
- keep
- reject
- candidate_master
- set_master
- refine_from_this

## 3. 索引建议
- universes(code) unique
- characters(code) unique
- generation_jobs(character_id, created_at desc)
- prompt_versions(job_id, variant_key)
- generated_images(job_id)
- review_results(image_id, reviewer_type)
- character_anchor_images(character_id, is_active)

## 4. API 设计
### 4.1 Universe
#### GET /api/universes
获取世界观列表

#### POST /api/universes
创建世界观

#### GET /api/universes/:id
获取世界观详情

#### PATCH /api/universes/:id
更新世界观

### 4.2 Characters
#### GET /api/characters
支持按状态、关键词筛选

#### POST /api/characters
创建角色

请求体示例：
```json
{
  "universeId": "uuid",
  "code": "SZ-V1",
  "name": "深圳",
  "description": "sharp energetic young urban achiever",
  "fixedTraits": {},
  "semiFixedTraits": {},
  "variableDefaults": {},
  "palette": {},
  "negativeRules": {}
}
```

#### GET /api/characters/:id
返回：
- 基本信息
- 当前 master 图
- 最近任务摘要
- 最近失败标签统计

#### PATCH /api/characters/:id
更新角色设定

### 4.3 Jobs
#### POST /api/jobs
创建任务

请求体示例：
```json
{
  "characterId": "uuid",
  "mode": "explore",
  "sourceImageId": null,
  "inputConfig": {
    "taskPrompt": {
      "action": "holding a smartphone",
      "expression": "focused and slightly impatient",
      "pose": "slight forward leaning posture",
      "view": "front full body"
    },
    "variantStrategies": ["ratio_boost", "style_lock", "pose_clarity"],
    "imagesPerVariant": 4,
    "size": "1024x1536",
    "quality": "high"
  }
}
```

返回：
```json
{
  "jobId": "uuid",
  "status": "queued"
}
```

#### GET /api/jobs/:id
返回：
- 任务信息
- Prompt 变体
- 候选图
- 自动评审结果
- 人工决策结果
- Patch 建议

#### POST /api/jobs/:id/retry
重试失败任务

### 4.4 Images
#### GET /api/images/:id
返回图片详情、对应评分、对应 Prompt 版本

#### POST /api/images/:id/review
手动触发重评审

#### POST /api/images/:id/refine
以该图为源图创建 refine 任务

### 4.5 Decisions
#### POST /api/decisions
请求体：
```json
{
  "jobId": "uuid",
  "imageId": "uuid",
  "action": "set_master",
  "reasons": {
    "notes": "比例最准，动作最清晰"
  }
}
```

行为：
- 写入 human_decisions
- 若 action = set_master，则切换 anchor 状态
- 更新 generated_images.status

### 4.6 Prompt Versions
#### GET /api/prompt-versions/:id
返回：
- 完整 prompt
- negative prompt
- patch
- debug payload
- 关联图片
- 平均评分

## 5. 队列任务定义
### 5.1 generateExploreCandidates
输入：
- job_id

行为：
- 读取角色与世界观
- 编译 Prompt 变体
- 调用模型生成图
- 保存 generated_images
- 派发 review 任务

### 5.2 reviewGeneratedImage
输入：
- image_id

行为：
- 调用自动评审
- 写 review_results
- 更新 generated_images.status = reviewed

### 5.3 proposePromptPatch
输入：
- image_id
- review_id

行为：
- 生成 patch_json
- 创建新的 prompt_version 候选记录

## 6. 读取聚合接口建议
### 6.1 GET /api/dashboard/characters
用于角色库首页，一次返回所有角色摘要，避免前端 N+1 请求。

### 6.2 GET /api/characters/:id/workbench
返回角色工作台聚合数据：
- character
- active anchors
- last 10 jobs
- recent prompt versions
- failure tag stats

## 7. MVP 验收用例
### 用例 1
创建角色 -> 成功保存 -> 角色库页展示

### 用例 2
创建 explore 任务 -> 成功入队 -> 生成 12 张图 -> 自动评审落库

### 用例 3
在对比页选择 set_master -> 成功切换 Master 图 -> 旧 Master 变 deprecated

### 用例 4
从某候选图发起 refine -> 成功创建新任务 -> 新任务能继承上一轮设定

## 8. 技术注意事项
- API 返回统一 envelope：
```json
{
  "success": true,
  "data": {},
  "error": null
}
```
- 所有写接口要返回可追踪的对象 id
- 长任务一律异步化
- 图片上传与下载走签名 URL
