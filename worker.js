import { createClients } from './build/siliconflow-client.js';

// 环境变量获取
const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY;
const AMAP_MCP_URL = process.env.AMAP_MCP_URL;
const SILICONFLOW_API_URL = "https://api.siliconflow.cn/v1/chat/completions";
const QWEN_MODEL = "Qwen/QwQ-32B";

// 全局变量
let mcpClient = null;
let siliconFlowClient = null;
let isInitialized = false;
let availableTools = [];

// 初始化客户端
async function initClients() {
  if (isInitialized) return true;
  
  try {
    const clients = createClients(AMAP_MCP_URL, SILICONFLOW_API_KEY);
    mcpClient = clients.mcpClient;
    siliconFlowClient = clients.siliconFlowClient;
    
    // 初始化MCP客户端
    await mcpClient.initialize();
    availableTools = mcpClient.getAvailableTools();
    isInitialized = true;
    return true;
  } catch (error) {
    console.error("初始化客户端失败:", error);
    return false;
  }
}

// 处理API请求
async function handleAPIRequest(request) {
  try {
    const data = await request.json();
    const { messages } = data;
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: '无效的请求格式' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 确保已初始化
    const initialized = await initClients();
    if (!initialized) {
      return new Response(
        JSON.stringify({ error: '服务初始化失败' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 处理请求
    // 实际处理逻辑将基于server.js实现，但需要适配Cloudflare Workers环境
    // 这里提供一个简化的示例
    const response = await siliconFlowClient.callLLMAPI(messages, availableTools);
    
    // 处理响应
    return new Response(
      JSON.stringify({ content: response.content || "抱歉，目前无法处理您的请求" }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("处理请求失败:", error);
    return new Response(
      JSON.stringify({ error: `服务器错误: ${error.message || '未知错误'}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 处理静态资源请求
function handleStaticRequest(request, url) {
  // 简化的静态资源处理
  // 在实际环境中可能需要使用KV存储或Assets绑定
  return new Response("静态资源未实现", { status: 404 });
}

// Workers入口点
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 设置环境变量
    if (env.SILICONFLOW_API_KEY) process.env.SILICONFLOW_API_KEY = env.SILICONFLOW_API_KEY;
    if (env.AMAP_MCP_URL) process.env.AMAP_MCP_URL = env.AMAP_MCP_URL;
    
    // API请求
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleAPIRequest(request);
    }
    
    // 静态资源
    return handleStaticRequest(request, url);
  }
}; 