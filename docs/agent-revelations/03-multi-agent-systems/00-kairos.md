# KAIROS：企业级 Agent 协作平台

> **TODO**：本章待撰写。KAIROS 是 Claude Code 的企业级版本代号，当前版本尚未正式发布，相关功能均通过 feature flag 门控。以下列出待展开的主题。

## TODO：待撰写内容

### 每日日志与 `/dream` 技能

KAIROS 模式下，Agent 会将每次会话中有价值的内容追加到每日日志 `logs/YYYY/MM/YYYY-MM-DD.md`。`/dream` 技能定期读取这些日志，提炼合并为主题记忆文件，类比人类睡眠时整理记忆。

- 触发条件：距上次整合 ≥ 24 小时 + 积累 ≥ 5 个新会话
- 四阶段：Orient（了解现状）→ Gather（扫描新会话）→ Consolidate（合并重组）→ Prune（删除过时）
- 可通过 `/dream` 手动触发
- 与普通模式的 `extractMemories`（每轮对话后即时提取）互斥

### Assistant 模式

KAIROS 的核心运行模式。Agent 持续运行、主动汇报，而非被动等待指令。通过 `--assistant` 标志或 `assistant: true` 设置启用。

### 团队协作

多 Agent 组成团队，通过邮箱系统异步通信，支持 tmux/iTerm2/进程内等多种执行后端。

### IM 集成

通过 Telegram、飞书、Discord 等即时通讯工具远程控制 Agent，支持双向通信和权限审批中继。

### 定时任务

`/schedule` 和 `/loop` 技能实现 cron 定时任务和循环任务，后台异步执行。
