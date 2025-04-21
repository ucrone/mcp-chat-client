/**
 * 类型声明文件
 * 为使用的库提供类型定义
 */

// 为MCP SDK提供类型声明
declare module '@modelcontextprotocol/sdk/client/index.js' {
  export class Client {
    constructor(options: { name: string; version: string });
    connect(transport: any): void;
    listTools(): Promise<{ tools: any[] }>;
    callTool(params: { name: string; arguments: any }): Promise<any>;
  }
}

declare module '@modelcontextprotocol/sdk/client/sse.js' {
  export class SSEClientTransport {
    constructor(url: URL);
  }
}

// 为axios声明模块类型（如果需要）
declare module 'axios' {
  export default axios;
  // 重用axios的类型，这里不需要完整定义
} 