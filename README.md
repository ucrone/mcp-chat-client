# MCP 聊天客户端

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

<p align="center">
  <img src="https://amap.com/favicon.ico" alt="高德地图" width="80" height="80">
</p>

## 项目简介

这是一个基于 Model Context Protocol (MCP) 的聊天客户端，实现了与高德地图服务的自然语言交互。通过结合大语言模型与 MCP 协议，用户可以使用自然语言查询地理信息、规划路线和获取天气数据等。

> **核心特点**: 本项目展示了如何将大语言模型与地图服务结合，通过 MCP 协议实现自然语言交互式地图功能查询。

## 功能特点

- **智能对话交互**：使用硅基流动 API 接入千问大模型，实现自然语言理解
- **地图服务集成**：支持高德地图多种 MCP 工具调用，包括：
  - 地点搜索与周边查询
  - 骑行、驾车、公交和步行路线规划
  - 天气信息查询
  - 地理编码和逆地理编码
- **实时通信**：通过 SSE (Server-Sent Events) 实现与高德地图 MCP 服务的实时连接
- **用户友好界面**：提供简洁直观的 Web 聊天界面，支持多轮对话

## 环境要求

- **Node.js**: >= 16.0.0
- **包管理器**: npm
- **API 密钥**: 需要硅基流动 API 密钥

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Ceeon/mcp-chat-client.git
cd mcp-chat-client
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env` 文件并添加以下配置：

```env
SILICONFLOW_API_KEY=你的硅基流动API密钥
AMAP_MCP_URL=高德地图MCP服务URL
PORT=3000  # 可选，默认为3000
```

### 4. 启动服务

选择以下任一方式启动服务：

```bash
# 方式一：使用 npm script
npm start

# 方式二：直接运行服务器文件
node server.js
```

### 5. 访问应用

服务启动后，打开浏览器访问：

```
http://localhost:3000
```

## 项目结构

### 目录结构

```
└── MCP客户端
    ├── server.js           # 主服务器文件
    ├── mcp-chat-simple/    # 前端文件目录
    │   ├── index.html     # 主页面
    │   ├── app.js         # 前端逻辑
    │   └── styles.css     # 样式表
    ├── package.json        # 项目配置
    ├── tsconfig.json       # TypeScript 配置
    ├── .env                # 环境变量（需自行创建）
    └── .env.example        # 环境变量示例
```

### 核心文件说明

#### 后端文件

- **server.js** ⭐⭐
  - 主服务器文件，基于 Express 构建
  - 提供 Web 服务和 API 端点
  - **连接高德地图 MCP 服务并管理工具调用** ⭐⭐⭐
  - **集成硅基流动 API 进行大模型交互** ⭐⭐⭐

- **siliconflow-client.ts** ⭐⭐
  - TypeScript 源文件，定义客户端核心逻辑
  - **实现了与硅基流动 API 和高德地图 MCP 服务的交互** ⭐⭐⭐
  - 包含工具调用和消息处理的类型定义

- **build/siliconflow-client.js**
  - 由 TypeScript 编译生成的 JavaScript 文件
  - 在运行时被服务器引用

#### 前端文件

- **index.html**
  - 聊天界面的 HTML 结构
  - 定义了消息容器和输入区域

- **styles.css**
  - 定义了聊天界面的样式
  - 实现了响应式设计

- **app.js** ⭐⭐
  - 前端 JavaScript 代码
  - 处理用户输入和消息展示
  - **与后端 API 交互，发送查询并处理响应** ⭐⭐

#### 配置文件

- **package.json** - 项目元数据、依赖包和脚本定义
- **tsconfig.json** - TypeScript 编译器配置
- **.env** - 环境变量配置（需自行创建）
- **.env.example** - 环境变量配置示例

## 核心技术亮点

<div align="center">
  <table>
    <tr>
      <th>技术亮点</th>
      <th>重要性</th>
      <th>说明</th>
    </tr>
    <tr>
      <td><b>MCP 协议集成</b></td>
      <td>⭐⭐⭐</td>
      <td>
        - 实现大模型与地图服务的无缝连接<br>
        - 支持高德地图提供的 12 种地理服务工具<br>
        - 通过 SSE 实现实时通信
      </td>
    </tr>
    <tr>
      <td><b>大语言模型应用</b></td>
      <td>⭐⭐⭐</td>
      <td>
        - 使用硅基流动 API 接入千问大模型<br>
        - 智能解析用户意图并选择合适的工具<br>
        - 处理工具调用结果并生成自然语言响应
      </td>
    </tr>
    <tr>
      <td><b>地图服务集成</b></td>
      <td>⭐⭐</td>
      <td>
        - 支持地点搜索、周边查询、路径规划等功能<br>
        - 集成骑行、驾车、公交和步行路线规划<br>
        - 天气查询、地理编码和逆地理编码功能
      </td>
    </tr>
    <tr>
      <td><b>前后端分离架构</b></td>
      <td>⭐</td>
      <td>
        - Express 后端提供 API 服务<br>
        - 简洁的前端界面实现用户交互<br>
        - RESTful API 设计促进前后端解耦
      </td>
    </tr>
  </table>
</div>

## 开发指南

### 快速上手

本节提供了项目开发的关键代码示例和指南，帮助您快速了解项目的核心功能实现。

### 后端开发

#### 1. MCP 客户端初始化

```javascript
// 创建 MCP 客户端
const mcpClient = new Client({ 
  name: "mcp-chat-client", 
  version: "1.0.0" 
});

// 初始化 SSE 传输并连接到高德地图 MCP 服务
const transport = new SSEClientTransport(new URL(AMAP_MCP_URL));
mcpClient.connect(transport);

// 获取可用工具列表
const toolsResult = await mcpClient.listTools();
const availableTools = toolsResult.tools;
console.log(`获取到 ${availableTools.length} 个可用工具`);
```

#### 2. 大模型与工具调用集成

```javascript
// 准备工具定义供大模型使用
const toolDefinitions = availableTools.map(tool => ({
  type: "function",
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema
  }
}));

// 调用硅基流动 API
const response = await axios.post(
  SILICONFLOW_API_URL,
  {
    model: QWEN_MODEL,
    messages: messages,
    tools: toolDefinitions,
    temperature: 0.7,
    // 其他参数...
  },
  {
    headers: {
      'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
      'Content-Type': 'application/json',
    },
  }
);

// 如果模型决定调用工具
if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
  // 处理工具调用
  for (const toolCall of responseMessage.tool_calls) {
    const toolName = toolCall.function.name;
    const toolArgs = JSON.parse(toolCall.function.arguments);
    
    // 调用 MCP 工具
    const toolResult = await mcpClient.callTool({
      name: toolName,
      arguments: toolArgs
    });
    
    console.log(`工具 ${toolName} 调用结果:`, toolResult);
  }
}
```

#### 3. 消息处理流程

```javascript
// 完整的消息处理流程
async function processQuery(message) {
  // 1. 添加用户消息到历史
  const messages = [...messageHistory, { role: 'user', content: message }];
  
  // 2. 调用大模型 API
  const initialResponse = await callLLMAPI(messages, availableTools);
  
  // 3. 如果有工具调用
  if (initialResponse.tool_calls) {
    // 3.1 执行工具调用
    const toolResults = await executeToolCalls(initialResponse.tool_calls);
    
    // 3.2 将工具结果添加到消息历史
    const messagesWithTools = addToolResultsToMessages(messages, 
                                                     initialResponse.tool_calls, 
                                                     toolResults);
    
    // 3.3 再次调用大模型获取最终响应
    const finalResponse = await callLLMAPI(messagesWithTools);
    return finalResponse.content;
  }
  
  // 4. 如果没有工具调用，直接返回内容
  return initialResponse.content;
}
```

### 前端开发

#### 1. 聊天界面初始化

```javascript
// DOM 元素初始化
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 添加欢迎消息
  addMessage('system', '欢迎使用高德地图 MCP 聊天助手！您可以询问天气、路线规划、地点查询等问题。');
});
```

#### 2. 用户交互处理

```javascript
// 处理用户输入
async function handleUserInput() {
  const query = userInput.value.trim();
  if (!query || isProcessing) return;
  
  // 清空输入框并添加用户消息
  userInput.value = '';
  addMessage('user', query);
  messages.push({ role: 'user', content: query });
  
  // 显示加载指示器
  addLoadingMessage();
  isProcessing = true;
  
  try {
    // 调用后端 API
    const response = await callBackendAPI(query);
    removeLoadingMessage();
    addMessage('assistant', response);
  } catch (error) {
    removeLoadingMessage();
    addMessage('error', `出错了: ${error.message || '未知错误'}`);
    console.error('处理查询时出错:', error);
  } finally {
    isProcessing = false;
  }
}
```

#### 3. API 调用

```javascript
// 调用后端 API
async function callBackendAPI(query) {
  try {
    // 发送请求
    const response = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages })
    });
    
    // 错误处理
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `请求失败: ${response.status}`);
    }
    
    // 处理响应
    const data = await response.json();
    if (data.content) {
      messages.push({ role: 'assistant', content: data.content });
      return data.content;
    } else {
      throw new Error('服务器响应格式错误');
    }
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
}
```

## 开源协议

本项目采用 [MIT 许可证](https://opensource.org/licenses/MIT) 进行开源。

## 贡献指南

我们非常欢迎并感谢所有形式的贡献！

### 如何贡献

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add some amazing feature'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 创建 Pull Request

### 贡献类型

* 功能增强和新功能
* 错误修复和性能优化
* 文档改进
* 测试用例
* 代码质量改进

## 注意事项与最佳实践

### 关键配置

1. **API 密钥管理**
   - 确保在 `.env` 文件中正确配置 `SILICONFLOW_API_KEY`
   - 切勿在代码中硬编码 API 密钥
   - 在生产环境中考虑使用环境变量或安全的密钥管理服务

2. **MCP 连接管理**
   - 实现连接重试机制，处理网络波动
   - 添加连接状态监控和健康检查
   - 在连接失败时提供优雅的降级处理

### MCP 工具调用注意事项

1. **工具名称格式**
   ```javascript
   // 高德地图 MCP 工具名称格式示例
   const toolName = "mcp0_maps_text_search";  // 地点搜索
   const toolName = "mcp0_maps_direction_driving";  // 驾车路线规划
   ```

2. **正确的工具调用格式**
   ```javascript
   // ✅ 正确的调用方式
   const toolResult = await mcpClient.callTool({
     name: toolName,
     arguments: toolArgs
   });
   
   // ❌ 错误的调用方式
   // const toolResult = await mcpClient.callTool(toolName, toolArgs);
   ```

3. **参数格式验证**
   - 确保参数符合工具的 `inputSchema` 要求
   - 在发送给大模型前验证工具定义的完整性

### 错误处理

```javascript
// 工具调用错误处理示例
try {
  const toolResult = await mcpClient.callTool({
    name: toolName,
    arguments: toolArgs
  });
  return toolResult;
} catch (error) {
  console.error(`工具 ${toolName} 调用失败:`, error);
  // 返回友好的错误消息给用户
  return { error: `无法完成操作: ${error.message || '未知错误'}` };
}
```

## 常见问题解答

<details>
<summary><b>连接高德地图 MCP 服务失败</b></summary>

### 问题
在启动服务器时无法连接到高德地图 MCP 服务。

### 解决方案
1. 检查网络连接是否正常
2. 确认 AMAP_MCP_URL 中的 API Key 是否有效
3. 查看服务器日志中的详细错误信息
4. 尝试增加连接超时时间或重试机制
</details>

<details>
<summary><b>大模型 API 调用失败</b></summary>

### 问题
调用硅基流动 API 时出现错误。

### 解决方案
1. 验证 SILICONFLOW_API_KEY 是否正确配置并有效
2. 检查请求格式是否符合 API 要求
3. 查看响应状态码和错误消息
4. 确认是否超过了 API 调用限制
</details>

<details>
<summary><b>工具调用返回错误</b></summary>

### 问题
调用高德地图 MCP 工具时返回错误。

### 解决方案
1. 检查工具名称是否正确（包括前缀 `mcp0_`）
2. 验证参数格式是否符合工具的 `inputSchema` 要求
3. 对于地理坐标参数，确保格式为“经度,纬度”
4. 查看服务器日志中的详细错误信息
</details>

<details>
<summary><b>前端界面无法加载</b></summary>

### 问题
访问 http://localhost:3000 时无法加载前端界面。

### 解决方案
1. 确认服务器是否成功启动，检查端口是否被占用
2. 验证 Express 是否正确配置了静态文件服务
3. 检查浏览器控制台是否有错误信息
4. 尝试清除浏览器缓存或使用无痕模式
</details>
