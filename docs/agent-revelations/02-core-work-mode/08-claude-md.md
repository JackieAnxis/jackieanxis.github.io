# CLAUDE.md：Agent 的指令本

每个 Claude Code 项目根目录都有一个 `CLAUDE.md` 文件——它是你写给 Agent 的**指令本**：编码标准、项目架构、工作流约定。启动时加载到上下文，Agent 尽力遵循。

CLAUDE.md 是上下文而非强制配置——Claude 尽量遵循但不保证严格遵守。硬阻止某个操作请用 PreToolUse hook。

## CLAUDE.md 的四层范围

| 范围 | 位置 | 共享对象 |
|------|------|----------|
| 托管策略 | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`；Linux/WSL: `/etc/claude-code/CLAUDE.md`；Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | 组织中所有用户 |
| 用户指令 | `~/.claude/CLAUDE.md` | 仅你 |
| 项目指令 | `./CLAUDE.md` 或 `./.claude/CLAUDE.md` | 通过源码控制的团队成员 |
| 本地指令 | `./CLAUDE.local.md`（加入 `.gitignore`） | 仅你 |

### 加载顺序

Claude Code 从工作目录向上遍历目录树加载所有文件。文件被**连接**而非覆盖——从根向下排序，更接近启动位置的指令最后读取。每个目录中 `CLAUDE.local.md` 在 `CLAUDE.md` 之后。

### 子目录的按需加载

工作目录及上层的 CLAUDE.md 启动时**完整加载**。子目录中的在 Claude 读取该子目录文件时**按需加载**。

### 何时添加

CLAUDE.md 适合归档反复需要解释的内容：Claude 重复犯的错误、代码审查中的关键上下文、新队友需要的背景知识。保持在"每个会话都应知道"的事实层面。多步骤过程或仅对部分代码重要的内容，应移到 skill 或路径范围规则中。

## 编写有效的指令

CLAUDE.md 在会话开始时加载到上下文窗口，与对话一起消耗 token，编写方式直接影响遵循可靠性。

**大小**：目标 200 行以下，超长消耗上下文且降低遵守度，用路径范围规则分流。

**结构**：用 Markdown 标题和项目符号分组，有组织的段落比密集文字更易遵循。

**具体性**：写可验证的指令。

| 好的指令 | 模糊的指令 |
|----------|-----------|
| "使用 2 空格缩进" | "正确格式化代码" |
| "提交前运行 `npm test`" | "测试你的更改" |

**一致性**：矛盾规则导致 Claude 任意选择，定期审查删除过时或冲突的指令。

## 规则系统：`.claude/rules/`

较大项目中，将指令拆分到 `.claude/rules/` 下的多个文件，模块化且易维护。

```
your-project/
├── .claude/
│   ├── CLAUDE.md           # 主项目指令
│   └── rules/
│       ├── code-style.md   # 代码样式
│       ├── testing.md      # 测试约定
│       └── security.md     # 安全要求
```

所有 `.md` 文件被递归发现。无 `paths` frontmatter 的规则在启动时加载，优先级与 `.claude/CLAUDE.md` 相同。

### 路径范围规则

用 `paths` frontmatter 限定到特定文件，只在 Claude 处理匹配文件时加载，减少噪音：

```yaml
---
paths:
  - "src/api/**/*.ts"
---

# API 开发规则

- 所有端点必须包含输入验证
- 使用标准错误响应格式
```

| 模式 | 匹配 |
|------|------|
| `**/*.ts` | 任何目录中的 TypeScript 文件 |
| `src/**/*` | `src/` 目录下的所有文件 |
| `src/**/*.{ts,tsx}` | 多扩展名组合匹配 |

### 用户级规则

`~/.claude/rules/` 中的规则跨项目生效，在项目规则之前加载。

### 符号链接共享

`.claude/rules/` 支持符号链接，可维护一组共享规则并链接到多个项目：

```bash
ln -s ~/shared-claude-rules .claude/rules/shared
ln -s ~/company-standards/security.md .claude/rules/security.md
```

## 导入其他文件

`@path/to/import` 语法，相对路径基于包含文件的位置（非工作目录）。递归导入最大 4 跳。

```markdown
参考 @README 了解项目概述，@package.json 了解可用命令。

# 其他指令
- git 工作流 @docs/git-instructions.md
```

跨 worktree 共享个人指令时，`CLAUDE.local.md` 仅存在于当前 worktree，可从主目录导入：`@~/.claude/my-project-instructions.md`。

## AGENTS.md 兼容

Claude Code 读取 `CLAUDE.md`，不读取 `AGENTS.md`。三种兼容方式：

**导入**——共享指令并追加 Claude 特定内容：

```markdown
@AGENTS.md

## Claude Code

对 `src/billing/` 下的更改使用 Plan Mode。
```

**符号链接**——不需要 Claude 特定内容时：`ln -s AGENTS.md CLAUDE.md`

**`/init` 自动合并**——读取 `AGENTS.md`、`.cursorrules`、`.windsurfrules` 并合并到生成的 `CLAUDE.md`。

## 组织级管理

### 托管 CLAUDE.md

组织可部署集中管理的 CLAUDE.md，也可在 `managed-settings.json` 中用 `claudeMd` 字段直接写入：

```json
{
  "claudeMd": "Always run `make lint` before committing.\nNever push directly to main."
}
```

托管 CLAUDE.md 与托管设置的分工：

| 关注点 | 配置在 |
|--------|--------|
| 阻止特定工具/命令/路径 | 托管设置：`permissions.deny` |
| 强制沙箱隔离 | 托管设置：`sandbox.enabled` |
| 代码样式、质量指南、行为指令 | 托管 CLAUDE.md |

设置由客户端强制执行。CLAUDE.md 塑造行为，但不是硬强制层。

### 排除文件

`claudeMdExcludes` 设置跳过无关的 CLAUDE.md（如大型 monorepo 中其他团队的文件）：

```json
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/home/user/monorepo/other-team/.claude/rules/**"
  ]
}
```

glob 模式匹配绝对路径，可在任何设置层配置，数组跨层合并。**托管策略 CLAUDE.md 不可排除。**

## HTML 注释

块级 HTML 注释（`<!-- 维护者笔记 -->`）在注入上下文前被剥离，不消耗 token。代码块内的注释保留。

## `/compact` 后的行为

项目根 CLAUDE.md 存活（从磁盘重新读取并注入），子目录的嵌套 CLAUDE.md 不会自动重新注入。对话中的口头指令不存活——写入 CLAUDE.md 才能持久化。

## `--add-dir` 与额外目录

`--add-dir` 默认不加载额外目录的 CLAUDE.md，启用需设置环境变量：

```bash
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --add-dir ../shared-config
```

