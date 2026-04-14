# 05_Prompt系统与评审规范

## 1. Prompt 系统目标
避免把角色信息和任务信息混成一段长文本，改为结构化拼装。

## 2. Prompt 分层
### 2.1 Universe Prompt
所有角色共享的世界观锚点。

示例职责：
- 4 头身
- 新国潮都市拟人
- 轻热血喜剧
- sheet 风格
- 干净线稿
- cel shading
- 浅灰背景

### 2.2 Character Prompt
单角色固定身份。

示例字段：
- code
- role persona
- palette
- iconic props
- visual silhouette
- hairstyle
- outfit rules

### 2.3 Task Prompt
本轮任务可变要素。

示例字段：
- action
- expression
- prop
- view
- pose
- composition

### 2.4 Negative Prompt
统一禁止项与角色禁止项叠加。

## 3. Prompt 编译规则
最终 Prompt = Universe + Character + Task + VariantStrategy + OutputFormat

### 3.1 编译原则
- Universe 放前面，先锁风格大框架
- Character 放中间，锁身份与视觉辨识
- Task 放后面，锁本次变化
- VariantStrategy 只做局部强化，不重写世界观
- Negative 独立保存，不嵌入正文

### 3.2 示例
```txt
[UNIVERSE]
EXACT 4-head proportion...
modern urban new guochao style...

[CHARACTER]
SZ-V1, sharp energetic young urban achiever...

[TASK]
holding a smartphone...
slight forward leaning posture...

[VARIANT]
strengthen short structured legs and compact torso

[OUTPUT]
2D anime character sheet style...
```

## 4. 变体策略
### 4.1 ratio_boost
强化：
- exact 4-head proportion
- short structured legs
- compact torso
- enlarged head

### 4.2 style_lock
强化：
- same visual language as master anchor
- clean lineart
- clean cel shading
- controlled highlight
- light gray plain background

### 4.3 pose_clarity
强化：
- 手持物
- 动作时刻
- 视线方向
- 身体重心

## 5. Patch 生成规则
Patch 必须是结构化变更，而不是重写全文。

### 5.1 Patch 数据结构
- preserve
- strengthen
- suppress
- append
- remove

### 5.2 示例
```json
{
  "preserve": [
    "urban_achiever_identity",
    "palette",
    "smartphone_action"
  ],
  "strengthen": [
    "exact_4_head_ratio",
    "short_structured_legs",
    "slightly_impatient_expression"
  ],
  "suppress": [
    "fashion_model_feel",
    "long_limb_tendency"
  ]
}
```

## 6. 自动评审规范
### 6.1 评审输入
- 当前图片
- universe 摘要
- character 摘要
- task 摘要
- 评审 rubric
- JSON schema

### 6.2 评审标准
#### 风格统一度
该图是否仍明显属于当前世界观

#### 角色辨识度
是否一眼能认出该角色，而不是 generic 角色

#### 比例准确度
是否符合 4 头身、短腿、紧凑躯干要求

#### 动作道具符合度
动作与手持物是否准确

#### 配色命中度
是否偏离角色核心色板

#### Sheet 完整性
是否仍是清晰、干净的角色 sheet，而不是场景插画

### 6.3 失败标签使用规范
- 每张图 1~5 个失败标签
- 失败标签必须具体
- 不允许输出模糊标签如 `bad_style`

## 7. 人工决策优先级
自动评分只是建议，不是最终判断。
以下情况人工可 override：
- 虽然分数略低，但角色气质最准
- 某图更适合作为 Master 锚点
- 某图虽然不适合定稿，但适合做 pose anchor

## 8. 禁止事项
- 不允许 patch 直接覆盖角色身份
- 不允许 refine 任务擅自改变色板与核心气质
- 不允许自动替换当前 Master 图
