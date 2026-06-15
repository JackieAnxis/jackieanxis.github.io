# Bash 工具权限检查详解

工具可以实现自己的 `checkPermissions(input, context)` 方法，这里讲解最复杂的工具 Bash。

为什么 Bash 这么特殊？因为一行 Bash 命令本质上就是一段程序——它可能包含管道、重定向、变量替换、条件执行、循环体等多种结构。如果只用简单的字符串匹配来判断权限，攻击者只需加一个 `| cat /etc/passwd` 就能绕过 `Bash(git *)` 的放行规则。

因此 Bash 工具的权限检查不走"正则匹配"这条路，而是走了完整的**语法分析 → 语义检查 → 规则匹配**流程。

但需要明确，没有任何权限系统能防止"所有"攻击手段。Claude Code 的 Bash 防护本质上是启发式模式匹配——针对已知的攻击模式设检查点，无法覆盖未知或变种的攻击。

## AST 语法树解析：从"字符串"到"结构"

Bash 工具的第一步是用 tree-sitter 将命令字符串解析为抽象语法树。这一步的意义是**把命令从文本变成结构化的数据**，后续所有检查都基于 AST 而不是正则。

举例来说，当 Agent 调用：

```
git status && npm test | grep PASS
```

经过 AST 解析后，系统看到的不是字符串，而是一棵树：

```
复合命令 (&&)
├── 左子树: git status
│   └── 子命令: git [status]
└── 右子树: npm test | grep PASS
    └── 管道 (|)
        ├── 左: npm [test]
        └── 右: grep [PASS]
```

有了这棵树，后续的每一步检查都可以精确地定位到每个操作符、每个子命令、每个路径。

## 沙箱自动放行：OS 级隔离替代权限提示

沙箱（sandbox）是操作系统级别的隔离机制，限制命令能访问的文件和网络。当沙箱启用且自动放行开关打开（默认开启）时，系统会**拆分子命令，逐个检查 deny 和 ask 规则** → 命中则拒绝或者弹窗。否则**直接放行**。

具体参考：[Claude Code Docs: 配置沙箱化 Bash 工具](https://code.claude.com/docs/zh-CN/sandboxing)

## 进程包装器剥离：让规则匹配实际命令

用户配置的规则通常针对的是实际命令，而不是被各种包装器包裹后的形式。系统在匹配规则前会剥离一组安全的进程包装器和安全环境变量：

**进程包装器（共 5 个，不可配置）：**

| 包装器 | 支持的变体 | 示例 |
|--------|-----------|------|
| `timeout` | GNU 长/短 flag（`--foreground`、`--kill-after`、`--signal`、`-v`、`-k`、`-s`） | `timeout 30 npm test` → `npm test` |
| `time` | 无前缀 | `time make build` → `make build` |
| `nice` | `nice -n N`、`nice -N`、无前缀 | `nice -n 5 git status` → `git status` |
| `stdbuf` | 短 flag 组合（`-o0`、`-iL`、`-eL`） | `stdbuf -o0 npm test` → `npm test` |
| `nohup` | 无前缀 | `nohup npm run build` → `npm run build` |

**安全环境变量（30+ 个，按类别分，只影响显示格式、日志级别等表层行为，不改变实际命令执行）：**

| 类别 | 变量 |
|------|------|
| Go 编译 | `GOOS`、`GOARCH`、`CGO_ENABLED`、`GO111MODULE`、`GOEXPERIMENT` |
| Rust 日志 | `RUST_BACKTRACE`、`RUST_LOG` |
| Node/Python | `NODE_ENV`、`PYTHONUNBUFFERED`、`PYTHONDONTWRITEBYTECODE`、`PYTEST_*` |
| 终端/显示 | `TERM`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`、`TZ`、`LANG`、`LC_*`、`CHARSET` |
| 颜色配置 | `LS_COLORS`、`LSCOLORS`、`GREP_COLOR`、`GREP_COLORS`、`GCC_COLORS` |
| 格式化 | `TIME_STYLE`、`BLOCK_SIZE`、`BLOCKSIZE` |
| 认证 | `ANTHROPIC_API_KEY` |

注意 `NODE_OPTIONS`、`PYTHONPATH` 等能改变程序行为的变量**不在**安全列表中，不会被剥离。

## 子命令拆分：复合命令不能"一揽子"通过

这是 Bash 权限检查的核心安全原则：**复合命令的每个子命令必须独立通过检查**。

举例来说，如果用户配置了 `Bash(git *)` 放行所有 git 命令：

| 命令 | 结果 | 原因 |
|------|------|------|
| `git status` | 通过 | 匹配 `Bash(git *)` |
| `git status && npm test` | **不通过** | `npm test` 没有匹配到任何放行规则 |
| `git status && ls` | **通过** | `git status` 匹配 `Bash(git *)`，`ls` 是只读命令 |

`Bash(safe-cmd *)` 不会给 Agent 权限运行 `safe-cmd && other-cmd`。这防止了通过附加操作符来"搭便车"绕过规则的攻击。

## 路径约束验证：命令操作的文件安全吗？

AST 解析后，系统提取命令中涉及的所有文件路径，检查它们是否在允许范围内：

| 命令 | 检查结果 | 原因 |
|------|----------|------|
| `rm -rf /tmp/test` | 需要确认 | 删除操作，目标路径需用户确认 |
| `rm -rf .git/hooks` | **必须人工确认** | 写入 `.git/` 目录，分类器免疫 |
| `cat src/index.ts` | 直接执行 | 只读操作，在工作目录内 |
| `sed -i 's/old/new/g' .bashrc` | **必须人工确认** | 修改 `.bashrc` 配置文件 |

## 语义安全检查：防止"看似安全"的命令做坏事

即使命令通过了规则匹配，Bash 工具还会进行语义层面的安全检查。核心原理是：**一个命令是否安全，不仅取决于命令名，还取决于命令的参数、上下文和 shell 语法特征**。

`bashSecurity.ts` 内置了 20+ 种检查模式，覆盖了命令注入、参数混淆、路径绕过等攻击向量。以下是几个代表性例子：

**`cd` + `git` 组合**：`cd /tmp/malicious && git status` 会被拦截。攻击者可以在恶意目录放置裸 git 仓库，通过 `core.fsmonitor` 配置让 git 执行任意命令。

**命令注入**：`git commit -m "$(cat /etc/passwd)"` 中的命令替换会被拦截。变量用于管道或重定向（`echo $HOME > /etc/passwd`）也会被拦截。

**混淆 Flag 绕过**：`rm -rf /`（Unicode 编码绕过）、`rm"" -rf /`（空引号混淆）、`git\ \ status`（反斜杠转义空格）等试图绕过规则匹配的混淆写法都会被识别。

如果 AST 解析失败或命令结构过于复杂（超过 50 个子命令），系统也会拒绝自动放行——无法证明安全性的命令，默认视为不安全。

