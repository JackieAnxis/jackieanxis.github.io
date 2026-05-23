# GitHub Pages 部署设计

**日期**: 2026-05-09
**状态**: 待实施

## 目标

将本仓库（llm-for-everyone）的 Markdown 文档构建为 VitePress 静态文档站，通过 GitHub Actions 自动部署到 `jackieanxis.github.io/llm-for-everyone/` 子路径。

## 背景

- 本仓库是 LLM 教学文档项目，用中文写作
- 文档以 Markdown 编写，有配图（`assets/` 目录）
- 已有 `jackieanxis.github.io` 作为 GitHub Pages 主站
- 当前仓库无 remote

## 方案

### 项目结构

在现有仓库中添加 VitePress 配置，不改变现有文档目录结构：

```
llm-for-everyone/
├── docs/                    # 现有文档（不变）
├── assets/                  # 现有配图（不变）
├── external/                # 现有子模块（不变）
├── .vitepress/              # 新增：VitePress 配置
│   └── config.mts
├── package.json             # 新增
├── .github/
│   └── workflows/
│       └── deploy.yml       # 新增
├── .gitignore               # 新增/更新
└── index.md                 # 新增：首页
```

### VitePress 配置

- `srcDir` 指向 `docs`，现有 Markdown 不需要移动
- `base` 设为 `'/llm-for-everyone/'`
- 使用默认主题，中文化
- 导航栏：顶部放章节导航
- 侧边栏：按章节自动生成
- 搜索：使用 VitePress 内置搜索
- 配色：蓝绿主色调，与文档风格一致

### 图片路径处理

现有文档中图片引用格式为 `../../assets/xxx.png`。VitePress 以 `docs` 为 srcDir 时，需要确认路径是否仍然有效，可能需要调整。

### GitHub Actions 部署流程

1. 触发条件：push to main
2. 步骤：
   - checkout 本仓库
   - 安装 Node.js + npm 依赖
   - 运行 `vitepress build`
   - checkout `jackieanxis.github.io` 仓库
   - 将构建产物复制到其 `llm-for-everyone/` 子目录
   - commit 并 push

### 前置准备

1. 在 GitHub 创建 `llm-for-everyone` 仓库并推送代码
2. 创建 Personal Access Token (PAT)，需要 `repo` 权限
3. 在本仓库的 GitHub Settings → Secrets 中添加 token（如 `DEPLOY_TOKEN`）
4. 确认 `jackieanxis.github.io` 仓库中 `llm-for-everyone/` 子目录不冲突

### 本地开发命令

```bash
npm install
npm run docs:dev    # 本地预览（localhost:5173）
npm run docs:build  # 构建到 .vitepress/dist
```

## 实施范围

1. 初始化 VitePress（package.json、config.mts、index.md）
2. 调整文档中的图片路径（如需要）
3. 创建 GitHub Actions workflow
4. 本地验证构建成功
5. （手动步骤）创建 GitHub 仓库、配置 secrets、首次部署

## 不在范围内

- Algolia 搜索集成（后续可选）
- 自定义域名
- 主站导航链接（主站侧的修改）
