# Rewind：Agent 的时间回溯

> 太长不看:
>
> **Rewind 是 Agent 的"时间回溯"，关键是对话+文件原子性回退**——只恢复一边会让 Agent 记忆与磁盘状态不一致。
>
> 对话用 JSONL 追加存储，每行一条 JSON 记录按 uuid 标识——每步状态完整保留，回退只需从末尾截断。
>
> 文件修改前用 SHA256 哈希前 16 位 + 版本号命名快照存于 `file-history/{sessionId}/`，哈希确保唯一命名，回退时直接读快照还原。回退时消息历史和文件状态必须一起回退，原子性是根本约束。

## Agent 会犯错，所以需要时间回溯

在 Agent Loop 中，模型围绕目标持续思考、行动、观察。但这个循环并不总是走对的——模型可能误解了意图、选错了工具、改错了文件。如果一条路走不通，最直接的办法就是**退回去，重新来**。

## 消息是怎么存下来的

要能回退，首先得把每一步的状态完整记录下来。

以 Claude Code 为例，其用 JSONL 文件存储对话历史，每个会话（session）一个文件。JSONL 的特点是每行一条 JSON 记录，追加写入，不修改已有内容，示例如下：

```jsonl
{"uuid":"a1b2c3","role":"user","content":"帮我创建一个 config.json 文件","timestamp":"2026-05-25T10:00:00Z"}
{"uuid":"d4e5f6","role":"assistant","content":"好的，我来创建...","timestamp":"2026-05-25T10:00:02Z"}
{"uuid":"g7h8i9","role":"tool","content":"文件已创建：config.json","timestamp":"2026-05-25T10:00:03Z"}
```

`uuid` 是这条消息的唯一标识，`role` 标明谁说的（用户、助手、工具），`content` 是具体内容，`timestamp` 记录时间。这种追加写入的方式，为 rewind 提供了基础——因为每一步的状态都完整保留，回退只需要从末尾截断即可。

## 不只是对话，文件也要一起回去

Agent 在之前的循环中可能已经修改了磁盘上的文件。对话记录回到了过去，文件也需要回退到过去的版本。

所以 rewind 的关键是：**Agent 每次操作文件之前，先把原版本备份一份**。

具体来说，Claude Code 在每轮消息处理时，会为被修改的文件创建一个版本化快照。备份文件用 SHA256 哈希的前 16 位 + 版本号命名：

```text
a1b2c3d4e5f6g7h8@v1
a1b2c3d4e5f6g7h8@v2
```

这些备份存储在 `file-history/{sessionId}/` 目录下，最多保留 100 个快照。

每条消息对应的快照结构如下：

```typescript
type FileHistorySnapshot = {
  messageId: UUID                // 触发这次文件变更的消息 ID
  trackedFileBackups: {          // 被修改的文件 → 备份信息
    "src/main.ts": {
      backupFileName: "a1b2c3@v2",  // 备份文件名
      version: 2,                    // 版本号
      backupTime: Date               // 备份时间
    },
    "package.json": {
      backupFileName: "d4e5f6@v1",
      version: 1,
      backupTime: Date
    }
  }
  timestamp: Date
}
```
- **对话状态和文件状态必须原子性地一起回退**。如果只恢复了文件但没截断消息，Agent 的"记忆"和磁盘状态就对不上了；反过来也一样。所以整个回退必须作为一个整体完成。
