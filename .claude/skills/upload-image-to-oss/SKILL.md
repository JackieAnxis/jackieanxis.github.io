---
name: upload-image-to-oss
description: Use when the user wants to upload local images from Markdown files to Aliyun OSS, or when you encounter local image paths (non-HTTP) in Markdown that need to be uploaded and replaced with OSS URLs.
---

# Upload Local Images to Aliyun OSS

## Overview

将 Markdown 中的本地图片上传至阿里云 OSS，并将引用替换为完整的 OSS URL。

## When to Use

- 用户在 Markdown 中插入了本地图片，需要上传到 OSS
- 用户要求「上传图片到 OSS」或类似指令
- Markdown 文件中存在非 HTTP/HTTPS 开头的的图片路径

## Core Pattern

### Step 1: 确认图片列表

扫描目标 Markdown 文件，提取所有本地图片路径（`![](path)` 中不以 `http://` 或 `https://` 开头的路径）。向用户确认需要上传的图片列表。

### Step 2: 上传图片

使用 `scripts/upload-images.js` 批量上传：

```bash
node scripts/upload-images.js "path/to/img1.png" "path/to/img2.jpg"
```

**前置条件**：
- 已安装依赖：`npm install`
- 已配置 `.env` 文件（基于 `.env.example` 创建，填入实际的 AccessKey 和 OSS 信息）

如果缺少 `.env`，提示用户先复制 `.env.example` 为 `.env` 并填写配置。

### Step 3: 解析上传结果

解析脚本输出，建立映射：

```
✓ img.png → https://jackie-image.oss-cn-hangzhou.aliyuncs.com/2026-05-24/img.png
```

格式：`✓ 本地文件名 → OSS 完整 URL`

### Step 4: 替换 Markdown 引用

将 Markdown 中的本地路径替换为 OSS URL：

```markdown
<!-- Before -->
![描述](./images/screenshot.png)

<!-- After -->
![描述](https://jackie-image.oss-cn-hangzhou.aliyuncs.com/2026-05-24/screenshot.png)
```

### Step 5: 确认替换结果

向用户展示替换前后的对比（diff），确认无误。

## 脚本详情

`scripts/upload-images.js` 的核心行为：

- **OSS key 格式**：`YYYY-MM-dd/原标题.ext`
- **标题提取**：文件名去掉扩展名，空格替换为 `-`
- **配置来源**：项目根目录的 `.env` 文件
- **退出码**：全部成功返回 0，部分失败返回 1

## Common Mistakes

- 不要尝试让脚本自动修改 Markdown 文件 — 上传和替换是两个独立的步骤，由 Claude 在 SKILL 指导下完成替换
- 图片路径需要是相对于项目根目录的绝对路径或正确的相对路径
- `.env` 文件不要提交到 Git，已在 `.gitignore` 中排除
