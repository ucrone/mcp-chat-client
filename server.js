// 后端服务器 - 代理API请求
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 获取API密钥
const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY;
const SILICONFLOW_API_URL = "https://api.siliconflow.cn/v1/chat/completions";
const QWEN_MODEL = "Qwen/QwQ-32B";

// 高德地图MCP服务URL
const AMAP_MCP_URL = process.env.AMAP_MCP_URL;

// 创建全局MCP客户端
let mcpClient = null;
let isConnected = false;
let availableTools = [];

// 初始化MCP客户端
async function initMCPClient() {
  if (isConnected && mcpClient) {
    console.log("MCP客户端已经连接");
    return mcpClient;
  }
  
  try {
    console.log("正在初始化MCP客户端...");
    
    // 创建新的MCP客户端
    mcpClient = new Client({ 
      name: "mcp-chat-client", 
      version: "1.0.0" 
    });
    
    // 初始化SSE传输
    const transport = new SSEClientTransport(new URL(AMAP_MCP_URL));
    
    // 连接到服务器
    mcpClient.connect(transport);
    
    // 等待连接建立
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 获取可用工具列表
    const toolsResult = await mcpClient.listTools();
    
    if (!toolsResult || !toolsResult.tools || toolsResult.tools.length === 0) {
      throw new Error("未能获取到可用工具列表");
    }
    
    availableTools = toolsResult.tools;
    console.log(`已连接到高德地图MCP服务器，获取到 ${availableTools.length} 个可用工具`);
    isConnected = true;
    return mcpClient;
  } catch (error) {
    console.error("MCP客户端初始化失败:", error);
    isConnected = false;
    throw error;
  }
}

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'mcp-chat-simple')));

// 启动时初始化MCP客户端
initMCPClient().catch(error => {
  console.warn("初始启动时MCP客户端初始化失败，将在需要时重试:", error.message);
});

// API代理路由
app.post('/api/chat', async (req, res) => {
  try {
    console.log('收到请求:', {
      body: req.body,
      headers: req.headers
    });
    
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      console.error('无效的请求格式:', req.body);
      return res.status(400).json({ error: '无效的请求格式' });
    }
    
    // 检查API密钥
    if (!SILICONFLOW_API_KEY) {
      console.error('API密钥未配置');
      return res.status(500).json({ error: 'API密钥未配置' });
    }
    
    console.log('使用API密钥:', SILICONFLOW_API_KEY.substring(0, 5) + '...');
    console.log('消息历史:', messages);
    
    // 调用硅基流动API
    console.log('发送请求到硅基流动API...');
    
    let response;
    try {
      // 准备工具定义
      const toolDefinitions = availableTools.map(tool => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema
        }
      }));
      
      response = await axios.post(
        SILICONFLOW_API_URL,
        {
          model: QWEN_MODEL,
          messages: messages,
          tools: toolDefinitions,
          temperature: 0.7,
          max_tokens: 512,
          top_p: 0.7,
          top_k: 50,
          frequency_penalty: 0.5,
          n: 1,
          response_format: {"type": "text"},
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('硅基流动API响应状态:', response.status);
      console.log('响应数据结构:', JSON.stringify(response.data).substring(0, 200) + '...');
    } catch (error) {
      console.error('硅基流动API调用失败:', error.message);
      return res.status(500).json({ error: `调用硅基流动API失败: ${error.message}` });
    }
    
    const responseMessage = response.data.choices[0].message;
    
    // 如果模型直接回复了内容
    if (responseMessage.content) {
      return res.json({ content: responseMessage.content });
    }
    
    // 如果模型决定调用工具
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // 确保MCP客户端已连接
      try {
        await initMCPClient();
      } catch (error) {
        console.error("无法初始化MCP客户端，将使用模拟的工具响应:", error.message);
        return res.json({ 
          content: "抱歉，我目前无法连接到高德地图服务。请稍后再试，或者尝试其他问题。" 
        });
      }
      
      // 处理工具调用
      const toolResults = [];
      
      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function.name;
        let toolArgs;
        
        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch (error) {
          toolArgs = toolCall.function.arguments;
        }
        
        // 调用MCP工具
        try {
          console.log(`正在调用工具: ${toolName}，参数:`, toolArgs);
          
          if (!mcpClient || !isConnected) {
            throw new Error("MCP客户端未连接");
          }
          
          const toolResult = await mcpClient.callTool({
            name: toolName,
            arguments: toolArgs
          });
          
          console.log(`工具 ${toolName} 调用成功:`, toolResult);
          
          toolResults.push({
            tool_call_id: toolCall.id,
            result: toolResult
          });
        } catch (error) {
          console.error(`工具调用失败: ${toolName}`, error);
          
          // 使用模拟数据响应
          toolResults.push({
            tool_call_id: toolCall.id,
            error: `工具调用失败: ${error.message || '未知错误'}`
          });
        }
      }
      
      // 构建包含工具结果的消息
      const toolMessages = messages.concat([
        { role: 'assistant', content: null, tool_calls: responseMessage.tool_calls }
      ]);
      
      // 添加工具结果
      for (const result of toolResults) {
        toolMessages.push({
          role: 'tool',
          tool_call_id: result.tool_call_id,
          content: result.error ? JSON.stringify({ error: result.error }) : JSON.stringify(result.result)
        });
      }
      
      // 获取下一个响应
      const followUpResponse = await axios.post(
        SILICONFLOW_API_URL,
        {
          model: QWEN_MODEL,
          messages: toolMessages,
          temperature: 0.7,
          max_tokens: 512,
          top_p: 0.7,
          top_k: 50,
          frequency_penalty: 0.5,
          n: 1,
          response_format: {"type": "text"},
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const followUpContent = followUpResponse.data.choices[0].message.content;
      
      if (followUpContent) {
        return res.json({ content: followUpContent });
      }
    }
    
    return res.status(500).json({ error: '无法获取有效响应' });
  } catch (error) {
    console.error('处理请求时出错:', error);
    res.status(500).json({ error: `服务器错误: ${error.message || '未知错误'}` });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
