# CLAUDE.md：Agent 的指令本

每个 Claude Code 项目根目录都有一个 `CLAUDE.md` 文件——它是用户写给 Agent 的**指令本**：编码标准、项目架构、工作流约定。启动时加载到上下文，Agent 尽力遵循。

CLAUDE.md 是上下文而非强制配置——Claude 尽量遵循但不保证严格遵守。硬阻止某个操作需要用 PreToolUse hook（钩子系统，后面章节会讲）。

## 编写有效的CLAUDE.md

**大小**：目标 200 行以下，过长会消耗过多上下文且降低遵守度，用路径范围规则分流。

**结构**：用 Markdown 标题和项目符号分组，有组织的段落比密集文字更易遵循。

**具体性**：写可验证的指令。

| 好的指令 | 模糊的指令 |
|----------|-----------|
| "使用 2 空格缩进" | "正确格式化代码" |
| "提交前运行 `npm test`" | "测试你的更改" |

**一致性**：矛盾规则导致 Claude 任意选择，定期审查删除过时或冲突的指令。

### 推荐写什么内容？

CLAUDE.md 适合归档反复需要解释的内容：Claude 重复犯的错误、代码审查中的关键上下文、新队友需要的背景知识。保持在"每个会话都应知道"的事实层面。多步骤过程或仅对部分代码重要的内容，应移到 skill 或路径范围规则中。

### 注释

可以通过块级 HTML 注释（`<!-- 维护者笔记 -->`）来写 CLAUDE.md 的注释，在注入上下文前被剥离，不消耗 token。代码块内的注释保留。

### 导入其他文件

用法：
```markdown
参考 @README 了解项目概述，@package.json 了解可用命令。

# 其他指令
- git 工作流 @docs/git-instructions.md
```

`@path/to/import` 语法，相对路径基于包含文件的位置（非工作目录）。**不是文本内联**——`@` 引用不会替换为文件内容。实际机制是解析器提取 `@` 路径，递归地被引用文件与主文件拼接在一起，每个文件带各自的 `Contents of {path}:` 标头。原文中的 `@xxx` 文本保留不变。

代码限制 `MAX_INCLUDE_DEPTH = 5`，depth 从 0 开始，每次递归 +1，depth >= 5 时停止——即最多 5 层嵌套。

## CLAUDE.md 如何进入 Agent Loop

| 范围 | 位置 | 共享对象 |
|------|------|----------|
| 本地指令 | `./CLAUDE.local.md`（加入 `.gitignore`） | 仅用户本人 |
| 项目指令 | `./CLAUDE.md` 或 `./.claude/CLAUDE.md` | 通过源码控制的团队成员 |
| 用户指令 | `~/.claude/CLAUDE.md` | 仅用户本人 |
| 托管策略 | claude code 安装目录 | 组织中所有用户 |

所有层的 CLAUDE.md 文本被**连接**（拼在一起同时生效），而非后者覆盖前者。这与 settings 的合并机制不同——settings 是 key-by-key 覆盖，`settings.local.json` 中同一条设置会直接覆盖 `settings.json`。

出现矛盾指令怎么办？没有硬性覆盖规则——Claude 自行判断，越具体、越靠近工作目录的指令通常越优先，但不保证。官方建议是避免矛盾，定期审查删除冲突的指令。

### 注入方式

Claude Code 启动时收集所有层的 CLAUDE.md 文本，拼接后包装成一条独立的**用户消息**（role=user），插入对话开头（仅一次，不会每轮都重新插入）：

```
<system-reminder>
As you answer the user's questions, you can use the following context:
# claudeMd
{所有层 CLAUDE.md 拼接后的文本}

# currentDate
Today's date is 2026-05-29

IMPORTANT: this context may or may not be relevant to your tasks...
</system-reminder>
```

注意：这是一条 role=user 的消息，**不是系统提示词**。`<system-reminder>` 标签的作用是告诉 Agent "这是元信息，不是用户的真实话语"，但它不改变消息的角色。Agent 像读用户消息一样读取 CLAUDE.md，尽力遵循，但没有系统层面的强制力。

**为什么 CLAUDE.md 不放在系统提示词中？** 我认为最主要的原因：**权限隔离**——System Prompt 定义不可逾越的安全红线，CLAUDE.md 是用户编写的项目规范；混在一起若遇恶意 CLAUDE.md 可能劫持安全指令，放在 User Message 中则语义明确：System 优先级始终最高。

需要注意：除了这些文件外，子目录中的 `CLAUDE.md` 会在 Claude 读取该子目录文件时**自动加载**，但并不会被拼接到对话开头的用户消息中，而是会出现在读取文件的工具附近，也使用`<system-reminder>` 标签。


**如何排除不必要的** `CLAUDE.md`？可以在配置项中的 `claudeMdExcludes` 字段设置跳过无关的 CLAUDE.md（如大型 monorepo 中其他团队的文件）：

```json
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/home/user/monorepo/other-team/.claude/rules/**"
  ]
}
```

## 规则系统：`.claude/rules/`

较大项目中，将指令拆分到 `.claude/rules/` 下的多个文件，模块化且易维护（无论内容写在 CLAUDE.md 还是 `.claude/rules/` 中，技术上完全等价——拆分文件纯粹是为了模块化维护）。

```
your-project/
├── .claude/
│   ├── CLAUDE.md           # 主项目指令
│   └── rules/
│       ├── code-style.md   # 代码样式
│       ├── testing.md      # 测试约定
│       └── security.md     # 安全要求
```

所有 `.md` 文件在启动时被递归发现并加载，所有文件的内容**拼接在一起**，作为同一条 `<system-reminder>` 用户消息发送。

对于 CLAUDE.md 和 rules，其实也具有 frontmatter，但有且仅有 `paths` 一个有效字段，**有 `paths` frontmatter**（路径范围规则）：这才是条件加载的核心机制。这类文件**不在启动时加载**，而是在 Agent 读取匹配路径的文件时才按需注入，避免不相关规则的噪音。

加了 `paths` 的 CLAUDE.md 同样变成条件加载。但实际使用中，主 CLAUDE.md 加 `paths` 等于把自己变成了条件规则，很少有意义。


