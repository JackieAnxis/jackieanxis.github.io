# 记忆系统：Agent 的经验本

CLAUDE.md 是你主动写给 Agent 的指令。但指令是静态的：你只能预先写好，没人会把每件小事都写进 CLAUDE.md。你的偏好、临时的团队决策、某个需要特殊处理的遗留接口——不成文的规矩，做错了照样出问题。

记忆系统填补了这个空白。它让 Agent 在对话中**自动积累**经验，跨会话持续演进。

## 两套系统对比

[上一章](./09-claude-md.md)讲了 CLAUDE.md，这里先做一个对比，建立直觉：

| | CLAUDE.md | 自动记忆 |
|---|---|---|
| 谁编写 | 你 | Claude |
| 包含内容 | 指令和规则 | 学习和模式 |
| 范围 | 项目、用户或组织 | 每个工作树，跨 worktrees 共享 |
| 加载到 | 每个会话 | 每个会话（前 200 行或 25KB） |
| 用于 | 编码标准、工作流、项目架构 | 构建命令、调试见解、Claude 发现的偏好 |

简单说：CLAUDE.md 是你写给 Agent 的规矩，记忆是 Agent 自己做的笔记。

## 记忆的类型与组织方式

记忆以**文件**形式持久存储，每个记忆是独立的 Markdown 文件。所有记忆位于同一目录下：

```
~/.claude/projects/{项目标识}/memory/
├── MEMORY.md              ← 索引文件
├── user_role.md           ← 用户记忆
├── feedback_testing.md    ← 反馈记忆
├── project_freeze.md      ← 项目记忆
└── reference_linear.md    ← 参考记忆
```

项目标识来自 git 仓库路径，同一仓库的所有 worktrees 和子目录共享一个记忆目录。自动记忆是机器本地的，不在机器间共享。

> **注**：除了 MEMORY.md 以外，其他文件名称不定，并不一定按照示例的代码进行命名

### 四种记忆类型 & MEMORY.md 索引

**用户记忆（user）**——关于你的角色、技术背景、工作偏好。**始终私有**。

**反馈记忆（feedback）**——你给过的工作方式指导，纠正和确认都记录。核心理念：**记录失败和成功同样重要。** 只记纠正会避免错误，但会逐渐偏离已验证的正确做法。必须包含 **Why**（记录原因）和 **How to apply**（记录应用方式）。知道*为什么*才能判断边界情况。

**项目记忆（project）**：记录当前项目的工作、决策与约束。项目记忆常记录一些对时间敏感的信息（此类记忆随时会变），此类记忆存在**自然衰败**机制：系统会要求验证存续超 1 日的记忆，并在后台定期清理过时项。因此，记录时须标注具体日期以明晰时效。

**参考记忆（reference）**——外部系统的位置和用途。**通常团队级。**

**MEMORY.md**（索引文件，会话启动时加载到系统提示，限制：200 行、25KB），示例：

```markdown
- [用户背景](user_profile.md) — Tesla CEO，偏好英文和简洁风格
- [集成测试不用 mock](feedback_testing.md) — 集成测试必须用真实数据库
- [合并冻结到周四](project_freeze.md) — 2026-03-05 起非关键合并冻结
- [Grafana oncall 看板](reference_grafana.md) — grafana.internal/d/api-latency
```

### 记忆文件格式 & 示例

每个记忆文件有 frontmatter 标明类型：

| 字段 | 作用 |
|------|------|
| `name` | kebab-case 标识符，用于去重和内部引用 |
| `description` | 一行摘要，**检索时的主要匹配目标** |
| `type` | 记忆类型，决定可见性和默认作用域 |


user_profile.md（用户记忆）：

```markdown
---
name: user-profile
description: Tesla CEO，偏好英文和简洁风格
type: user
---
Elon Musk，Tesla CEO。偏好英文交流，喜欢直接简洁的回答风格，不想要冗长的解释。
```

feedback_testing.md（反馈记忆）：

```markdown
---
name: testing-preference
description: 集成测试必须用真实数据库
type: feedback
---
集成测试必须用真实数据库，不使用 mock。
**Why:** 上个季度 mock 和生产差异导致线上迁移失败
**How to apply:** 编写集成测试时不要使用数据库 mock
```

project_freeze.md（项目记忆）：

```markdown
---
name: merge-freeze
description: 2026-03-05 起非关键合并冻结
type: project
---
2026-03-05 起非关键合并冻结，移动端团队在 cut release 分支。
**Why:** 移动端团队正在发布版本，避免合入不稳定代码
**How to apply:** 安排合并时标记非关键 PR 为冻结状态
```

reference_grafana.md（参考记忆）：

```markdown
---
name: grafana-oncall
description: Grafana oncall 延迟监控看板
type: reference
---
Grafana 看板 grafana.internal/d/api-latency 是 oncall 监控面板。
**Why:** 修改请求路径代码时需要检查这个看板的延迟指标
**How to apply:** 编辑 request-path 相关代码前查看该看板
```

### 什么不该记

**判断标准**："这条信息是不是可以通过读取代码仓/本地文件来获取"，*人的偏好/决策背景/外部链接*等内容是 Agent 无法实时获取的，则需要被记录成记忆。

- **代码模式、架构、文件路径、项目结构**——可从当前项目状态直接读取
- **git 历史、最近改动**——`git log` / `git blame` 是权威的
- **调试方案**——修复已在代码中，commit message 有上下文
- **CLAUDE.md 已覆盖的内容**——不重复
- **临时任务细节**——在途工作、临时状态会快速过时

### Subagent 记忆

Subagent 记忆专用于跨对话保留角色特定领域知识。与主 Agent 的两点关键不同：

1. **写入非自动触发**：须经 Agent 定义文件（`.claude/agents/*.md`）的 system prompt 来引导 Subagent 主动写入记忆。
2. **不共享主 Agent 的记忆目录**：Subagent 拥有独立的存储位置。

每个 Subagent 通过定义文件 frontmatter 的 `memory` 字段**三选一**指定存储位置——这不是层级叠加，而是互斥的后端选择：

- **user**：`~/.claude/agent-memory/{agentType}/`（跨项目通用）
- **project**：`{项目目录}/.claude/agent-memory/{agentType}/`（项目特定，受版本控制）
- **local**：`{项目目录}/.claude/agent-memory-local/{agentType}/`（项目本地，免版本控制）

记忆的格式定义与主 Agent 无区别。

## 记忆的生命周期

记忆贯穿 Agent Loop 的每个阶段：

![Agent 记忆生命周期](https://jackie-image.oss-cn-hangzhou.aliyuncs.com/2026-05-29/memory-system-agent-lifecycle.png)

### 启动时：加载 MEMORY.md

会话启动时，Claude Code 将 MEMORY.md 的内容（记忆类型定义、保存指南、MEMORY.md 全文内容，具体记忆文件是对话过程中按需加载）注入系统提示，作为 Agent 当次会话的背景知识。同时附带提醒：记忆中记录的文件名或函数名可能已过时，使用前应验证。

### 对话进行中：每轮按需检索

1. **扫描**：在记忆目录中递归扫描 `.md` 文件，解析前 30 行 frontmatter，按修改时间倒序，上限 200 个
2. **格式化**：`- [type] 文件名 (ISO 时间戳): description`
3. **选择**：Sonnet 模型选出最相关的 5 条
4. **读取**：有行数/字节数限制，超长截断
5. **注入**：使用 `<system-reminder>` 标签包裹后注入上下文

```
<system-reminder>
As you answer the user's questions, you can use the following context:
# claudeMd
{所有层 CLAUDE.md 拼接后的文本}
{根据上述方式提取到的记忆}

# currentDate
Today's date is 2026-05-29

IMPORTANT: this context may or may not be relevant to your tasks...
</system-reminder>
```

检索过程中有一个**异步预取**优化：系统会在回答用户问题的同时，加载相关的记忆，当下次用户提问的时候，就可以把这段记忆附上作为参考。此外，目录扫描结果也会被缓存，仅当记忆目录内容变化时才重新扫描。

检索结果的注入位置在近期发生了一次重要调整：自动记忆从 CLAUDE.md 前置管道（拼在消息列表最前面）移到了后置附件中（拼在消息列表末尾）。动机仍然是为了复用上下文缓存。详见[上下文：Agent 的记忆与视野](./12-context-overview.md)的 Delta 模式小节。

记忆附带新鲜度标签：

| 记忆年龄 | 显示 |
|---------|------|
| 当天 | 无警告 |
| 昨天 | `Memory (saved yesterday)` |
| 2 天前 | `Memory (saved 2 days ago)` |
| 超过 1 天 | 附加失活警告 |

> 这条记忆已保存 N 天。记忆是时间点的观察，不是实时状态——关于代码行为或文件位置的声明可能已过时。在断言为事实前请验证当前代码。

### 和 CLAUDE.md 加载方式的区别

**CLAUDE.md 是全量拼接**。系统按 Managed → User → Project（从根目录向 CWD 逐级）→ Local 的顺序收集所有文件，拼接成一个字符串注入系统提示。越靠近 CWD 的文件越晚出现，模型天然更关注最后出现的内容——这是一种隐式的优先级，而非正式的覆盖机制。

**记忆系统是平铺检索**，不存在层级。所有记忆文件平铺在同一目录下，每轮对话中 Sonnet 模型根据用户查询的语义，从候选记忆中选出最相关的 5 条注入上下文。这更像**搜索引擎**，而非配置文件合并。同一个 git 仓库的所有 worktree 共享此目录。


### 对话结束后：自动提取

对话结束时，Claude Code 在后台自动审查本轮对话，判断是否需要提取新记忆。这个过程是异步的——用户无需等待，下次对话即可使用新记忆。

为保证安全，后台提取由一个**权限受限的子 Agent** 执行：只能读取项目文件、只能写入记忆目录，不能执行命令或调用工具。

用户也可以主动触发记忆操作：

| 方式 | 行为 |
|------|------|
| 说"记住这个" | 立即保存为新记忆 |
| **/memory** 命令 | 直接编辑记忆文件、切换记忆开关、打开记忆文件夹 |

### 更新与删除

更新前先检查现有记忆，不创建重复条目。"忘记 X"时删除文件和索引条目。

本文介绍的即时提取是"随手记笔记"——每轮对话后即时提取。Agent 还有一套更深层的记忆整合机制——**AutoDream**，在积累足够素材后像人类睡眠一样批量整理记忆。详见 [AutoDream：Agent 的睡眠记忆整理](./11-auto-dream.md)。
