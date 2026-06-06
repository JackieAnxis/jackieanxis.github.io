const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const configPath = path.join(
    __dirname,
    "..",
    "docs",
    ".vitepress",
    "config.mts",
);

const config = fs.readFileSync(configPath, "utf8");

assert.ok(config.includes("'/llm-for-everyone/': ["), "应为 llm-for-everyone 配置侧边栏");
assert.ok(config.includes("text: '神经网络基础'"), "侧边栏应包含神经网络基础章节");
assert.ok(config.includes("text: '大模型基础'"), "侧边栏应包含大模型基础章节");
assert.ok(config.includes("text: '推理过程'"), "侧边栏应包含推理过程章节");
assert.ok(config.includes("text: '预训练'"), "侧边栏应包含预训练章节");
assert.ok(config.includes("text: '参考概念'"), "侧边栏应包含参考概念章节");
assert.ok(
    config.includes("link: '/llm-for-everyone/00-neural_network/00-overview'"),
    "侧边栏应链接到 llm-for-everyone 起始页",
);
assert.ok(
    config.includes("link: '/llm-for-everyone/02-inference/03-tokenize'"),
    "侧边栏应包含 tokenize 页面",
);

console.log("sidebar config includes llm-for-everyone");
