#!/usr/bin/env node

// 构建脚本 - 使用ES模块语法
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建构建目录
if (!fs.existsSync('./build')) {
  fs.mkdirSync('./build');
}

// 创建src目录（如果不存在）
if (!fs.existsSync('./src')) {
  fs.mkdirSync('./src');
}

// 检查是否存在TypeScript文件
const srcFiles = fs.readdirSync('./src');
const tsFiles = srcFiles.filter(file => file.endsWith('.ts'));

if (tsFiles.length === 0) {
  console.warn('警告: 没有发现TypeScript文件，跳过编译步骤');
  process.exit(0);
}

// 编译TypeScript
console.log('编译TypeScript文件...');
exec('npx tsc', (error, stdout, stderr) => {
  if (error) {
    console.error(`编译错误: ${error.message}`);
    console.error(stderr);
    return;
  }
  
  if (stdout) {
    console.log(stdout);
  }
  
  console.log('TypeScript编译完成');
  
  // 检查编译是否生成了文件
  if (fs.existsSync('./build/siliconflow-client.js')) {
    console.log('siliconflow-client.js 生成成功');
  } else {
    console.warn('警告: siliconflow-client.js 未生成');
  }
}); 