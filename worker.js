// 简化的Worker版本 - 适用于Cloudflare环境
// 注意：这个版本移除了对Node.js特有API的依赖

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 处理API请求
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return new Response(
        JSON.stringify({ 
          content: "这是一个Cloudflare Worker示例响应。真实功能需要在控制台配置环境变量并完善代码。" 
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // 处理根路径请求
    if (url.pathname === '/' || url.pathname === '') {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>MCP聊天客户端</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>MCP聊天客户端 - Cloudflare Worker版</h1>
          <p>服务已成功部署！</p>
          <p>这是一个简化版的响应页面，表明Worker已正常运行。</p>
        </body>
        </html>`,
        { 
          status: 200,
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        }
      );
    }
    
    // 处理其他请求
    return new Response('未找到资源', { status: 404 });
  }
}; 