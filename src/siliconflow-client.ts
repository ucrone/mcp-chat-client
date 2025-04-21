/**
 * siliconflow-client.ts
 * 实现与硅基流动API和高德地图MCP服务的交互
 */

import axios from 'axios';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// 消息接口定义
export interface Message {
  role: string;
  content: string | null;
  tool_calls?: ToolCall[];
}

// 工具调用接口
export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

// 工具结果接口
export interface ToolResult {
  tool_call_id: string;
  result?: any;
  error?: string;
}

// 工具定义接口
export interface Tool {
  name: string;
  description: string;
  inputSchema: any;
}

// MCP客户端类
export class MCPClient {
  private client: any;
  private isConnected: boolean = false;
  private availableTools: Tool[] = [];

  constructor(private mcpUrl: string) {}

  // 初始化MCP客户端
  async initialize(): Promise<boolean> {
    if (this.isConnected && this.client) {
      console.log("MCP客户端已经连接");
      return true;
    }
    
    try {
      console.log("正在初始化MCP客户端...");
      
      // 创建新的MCP客户端
      this.client = new Client({ 
        name: "mcp-chat-client", 
        version: "1.0.0" 
      });
      
      // 初始化SSE传输
      const transport = new SSEClientTransport(new URL(this.mcpUrl));
      
      // 连接到服务器
      this.client.connect(transport);
      
      // 等待连接建立
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 获取可用工具列表
      const toolsResult = await this.client.listTools();
      
      if (!toolsResult || !toolsResult.tools || toolsResult.tools.length === 0) {
        throw new Error("未能获取到可用工具列表");
      }
      
      this.availableTools = toolsResult.tools;
      console.log(`已连接到高德地图MCP服务器，获取到 ${this.availableTools.length} 个可用工具`);
      this.isConnected = true;
      return true;
    } catch (error: any) {
      console.error("MCP客户端初始化失败:", error);
      this.isConnected = false;
      throw error;
    }
  }

  // 获取可用工具列表
  getAvailableTools(): Tool[] {
    return this.availableTools;
  }

  // 调用工具
  async callTool(toolName: string, args: any): Promise<any> {
    if (!this.isConnected || !this.client) {
      throw new Error("MCP客户端未连接");
    }

    try {
      console.log(`正在调用工具: ${toolName}，参数:`, args);
      
      const toolResult = await this.client.callTool({
        name: toolName,
        arguments: args
      });
      
      console.log(`工具 ${toolName} 调用成功:`, toolResult);
      return toolResult;
    } catch (error: any) {
      console.error(`工具调用失败: ${toolName}`, error);
      throw error;
    }
  }
}

// 硅基流动API客户端类
export class SiliconFlowClient {
  constructor(
    private apiKey: string,
    private apiUrl: string = "https://api.siliconflow.cn/v1/chat/completions",
    private model: string = "Qwen/QwQ-32B"
  ) {}

  // 调用大模型API
  async callLLMAPI(messages: Message[], tools?: Tool[]): Promise<any> {
    try {
      // 准备工具定义
      const toolDefinitions = tools?.map(tool => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema
        }
      }));
      
      // 调用API
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
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
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data.choices[0].message;
    } catch (error: any) {
      console.error('硅基流动API调用失败:', error.message);
      throw error;
    }
  }
}

// 导出一个函数用于创建客户端实例
export function createClients(mcpUrl: string, apiKey: string): { 
  mcpClient: MCPClient, 
  siliconFlowClient: SiliconFlowClient 
} {
  return {
    mcpClient: new MCPClient(mcpUrl),
    siliconFlowClient: new SiliconFlowClient(apiKey)
  };
} 