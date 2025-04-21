#!/bin/bash

# 确保使用正确的node版本
echo "Node.js 版本:"
node -v

# 安装依赖
echo "安装依赖..."
npm install

# 构建项目
echo "构建项目..."
npm run build

# 部署到Cloudflare Workers
echo "部署到Cloudflare Workers..."
npm run deploy 