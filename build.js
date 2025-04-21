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
    
    // 确保生成的文件使用ESM语法
    console.log('确保输出文件使用ESM语法...');
    makeESMCompatible();
  } else {
    console.warn('警告: siliconflow-client.js 未生成');
  }
});

// 确保生成的文件与Cloudflare Workers兼容
function makeESMCompatible() {
  try {
    // 检查build目录下的所有JS文件
    const buildFiles = fs.readdirSync('./build');
    const jsFiles = buildFiles.filter(file => file.endsWith('.js'));
    
    for (const file of jsFiles) {
      const filePath = path.join('./build', file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // 确保文件使用ESM语法
      if (!content.includes('export ')) {
        console.log(`向 ${file} 添加ESM导出...`);
        content += '\nexport { MCPClient, SiliconFlowClient, createClients };\n';
        fs.writeFileSync(filePath, content);
      }
    }
    
    console.log('所有文件已更新为ESM兼容');
  } catch (error) {
    console.error('更新ESM兼容性时出错:', error);
  }
} 