#!/usr/bin/env node
/**
 * 上传本地图片到阿里云 OSS
 * 用法: node upload-images.js <path1> [path2 ...]
 *
 * OSS key 格式: YYYY-MM-dd/原标题.ext（空格替换为-）
 * 配置从 .env 文件读取
 */

const path = require('path');
const fs = require('fs');

// 加载 .env
require('dotenv').config();

const OSS = require('ali-oss');

function checkConfig() {
  const missing = [];
  if (!process.env.ALIYUN_ACCESS_KEY_ID) missing.push('ALIYUN_ACCESS_KEY_ID');
  if (!process.env.ALIYUN_ACCESS_KEY_SECRET) missing.push('ALIYUN_ACCESS_KEY_SECRET');
  if (!process.env.ALIYUN_OSS_REGION) missing.push('ALIYUN_OSS_REGION');
  if (!process.env.ALIYUN_OSS_BUCKET) missing.push('ALIYUN_OSS_BUCKET');
  if (missing.length > 0) {
    console.error(`缺少 OSS 配置，请在 .env 中设置: ${missing.join(', ')}`);
    process.exit(1);
  }
}

function createClient() {
  return new OSS({
    region: process.env.ALIYUN_OSS_REGION,
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
    bucket: process.env.ALIYUN_OSS_BUCKET,
    secure: true,
  });
}

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif']);

function generateKey(filePath) {
  const base = path.basename(filePath);
  const ext = path.extname(base).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`不支持的文件格式: ${ext}，仅支持 ${[...ALLOWED_EXTENSIONS].join(', ')}`);
  }
  const title = path.basename(base, ext).replace(/\s+/g, '-');
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-dd
  return `${today}/${title}${ext}`;
}

async function upload(client, filePath) {
  if (!fs.existsSync(filePath)) {
    return { success: false, message: '文件不存在' };
  }

  try {
    const key = generateKey(filePath);
    const result = await client.put(key, filePath);
    const url = result.url || `https://${process.env.ALIYUN_OSS_BUCKET}.${process.env.ALIYUN_OSS_REGION}.aliyuncs.com/${result.name}`;
    return { success: true, url, key };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('用法: node scripts/upload-images.js <path1> [path2 ...]');
    process.exit(1);
  }

  checkConfig();
  const client = createClient();

  let failCount = 0;

  for (const arg of args) {
    const result = await upload(client, arg);
    if (result.success) {
      console.log(`✓ ${path.basename(arg)} → ${result.url}`);
    } else {
      console.error(`✗ ${path.basename(arg)} → ${result.message}`);
      failCount++;
    }
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main();
