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
      // 记录更详细的错误信息
      if (error.response) {
        // 服务器响应了错误状态码
        console.error('错误响应状态:', error.response.status);
        console.error('错误响应头:', error.response.headers);
        console.error('错误响应数据:', error.response.data);
      } else if (error.request) {
        // 请求已发送但没有收到响应
        console.error('未收到响应的请求:', error.request);
      } else {
        // 设置请求时发生错误
        console.error('请求设置错误:', error.message);
      }
      return res.status(500).json({ error: `调用硅基流动API失败: ${error.message}`, details: error.response ? error.response.data : null });
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
      
      // 预处理用户查询，提取地名
      const userQuery = messages.find(msg => msg.role === 'user')?.content || '';
      console.log('处理用户查询:', userQuery);
      
      // 如果查询包含地名和距离关键词，尝试预处理
      const distancePattern = /([\u4e00-\u9fa5]+)\s*(?:到|\-|\s+)\s*([\u4e00-\u9fa5]+)\s*(?:的)?(?:距离|路程|路线|多远|多近)/;
      const distanceMatch = userQuery.match(distancePattern);
      
      // 如果是距离查询，预先准备地理编码转换
      if (distanceMatch && distanceMatch.length >= 3) {
        const originCity = distanceMatch[1];
        const destCity = distanceMatch[2];
        console.log('检测到距离查询模式:', originCity, '到', destCity);
        
        // 尝试先进行地理编码转换
        try {
          console.log(`尝试将城市名称转换为坐标...`);
          
          // 先获取起点城市的坐标
          const originGeoResult = await mcpClient.callTool({
            name: 'maps_geo',
            arguments: {
              address: originCity,
              city: originCity
            }
          });
          
          console.log(`起点城市地理编码结果:`, originGeoResult);
          
          // 获取目的地城市的坐标
          const destGeoResult = await mcpClient.callTool({
            name: 'maps_geo',
            arguments: {
              address: destCity,
              city: destCity
            }
          });
          
          console.log(`目的地城市地理编码结果:`, destGeoResult);
          
          // 检查地理编码结果
          if (originGeoResult && originGeoResult.geocodes && originGeoResult.geocodes.length > 0 &&
              destGeoResult && destGeoResult.geocodes && destGeoResult.geocodes.length > 0) {
            
            // 提取坐标
            const originLocation = originGeoResult.geocodes[0].location;
            const destLocation = destGeoResult.geocodes[0].location;
            
            console.log(`已获取坐标 - 起点: ${originLocation}, 目的地: ${destLocation}`);
            
            // 存储坐标信息供后续工具调用使用
            global.locationCache = {
              origin: originLocation,
              destination: destLocation,
              originCity: originCity,
              destCity: destCity
            };
          }
        } catch (error) {
          console.error('地理编码转换失败:', error.message);
        }
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
          
          // 检查参数格式，确保没有未解析的模板变量
          let sanitizedArgs = toolArgs;
          if (typeof toolArgs === 'object') {
            sanitizedArgs = {};
            for (const [key, value] of Object.entries(toolArgs)) {
              if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
                console.warn(`警告: 参数 ${key} 包含未解析的模板变量: ${value}`);
                
                // 如果是地理工具且我们有缓存的坐标信息，尝试使用缓存
                if (global.locationCache && toolName.startsWith('maps_')) {
                  if (key === 'origins' || key === 'origin') {
                    console.log(`使用缓存的起点坐标替换模板变量:`, global.locationCache.origin);
                    sanitizedArgs[key] = global.locationCache.origin;
                  } else if (key === 'destination') {
                    console.log(`使用缓存的目的地坐标替换模板变量:`, global.locationCache.destination);
                    sanitizedArgs[key] = global.locationCache.destination;
                  } else {
                    // 其他模板变量使用空字符串
                    sanitizedArgs[key] = "";
                  }
                } else {
                  // 没有缓存或不是地图工具，使用空字符串
                  sanitizedArgs[key] = "";
                }
              } else {
                sanitizedArgs[key] = value;
              }
            }
            
            // 如果是距离查询工具，确保添加类型参数
            if (toolName === 'maps_distance' && global.locationCache) {
              if (!sanitizedArgs.type) {
                sanitizedArgs.type = "1"; // 1代表驾车距离
              }
            }
          }
          
          console.log(`使用净化后的参数调用工具:`, sanitizedArgs);
          
          const toolResult = await mcpClient.callTool({
            name: toolName,
            arguments: sanitizedArgs
          });
          
          console.log(`工具 ${toolName} 调用成功:`, toolResult);
          
          toolResults.push({
            tool_call_id: toolCall.id,
            result: toolResult
          });
        } catch (error) {
          console.error(`工具调用失败: ${toolName}`, error);
          
          // 记录更详细的错误信息
          let errorDetails = error.message || '未知错误';
          
          // 尝试提取更多错误信息
          if (error.stack) {
            console.error(`错误堆栈: ${error.stack}`);
          }
          
          // 如果是高德地图MCP服务器错误，尝试解析错误详情
          if (errorDetails.includes('HTTP 500') && errorDetails.includes('Internal Server Error')) {
            console.error('高德地图MCP服务器内部错误，可能是参数格式不正确或服务暂时不可用');
            
            // 检查是否是特定的地图工具
            if (toolName.startsWith('maps_')) {
              console.log('尝试提供地图工具的参数格式建议...');
              
              // 根据工具类型提供建议
              if (toolName === 'maps_distance') {
                errorDetails += '\n建议的参数格式: {"origins": "116.481028,39.989643", "destination": "116.434446,39.90816", "type": "1"}';
              } else if (toolName === 'maps_direction_driving') {
                errorDetails += '\n建议的参数格式: {"origin": "116.481028,39.989643", "destination": "116.434446,39.90816"}';
              }
            }
          }
          
          // 使用错误信息响应
          toolResults.push({
            tool_call_id: toolCall.id,
            error: `工具调用失败: ${errorDetails}`
          });
        }
      }
      
      // 构建包含工具结果的消息
      const toolMessages = messages.concat([
        { role: 'assistant', content: null, tool_calls: responseMessage.tool_calls }
      ]);
      
      // 添加工具结果
      let hasErrors = false;
      let distanceResult = null;
      
      for (const result of toolResults) {
        // 检查是否有错误
        if (result.error) {
          hasErrors = true;
        }
        
        // 检查是否是距离查询结果
        if (!result.error && result.result && 
            responseMessage.tool_calls.find(call => call.id === result.tool_call_id)?.function?.name === 'maps_distance') {
          distanceResult = result.result;
        }
        
        toolMessages.push({
          role: 'tool',
          tool_call_id: result.tool_call_id,
          content: result.error ? JSON.stringify({ error: result.error }) : JSON.stringify(result.result)
        });
      }
      
      // 如果有距离查询结果且有缓存的坐标信息，直接生成友好的响应
      if (distanceResult && global.locationCache && !hasErrors) {
        try {
          console.log('处理距离查询结果:', distanceResult);
          
          // 提取距离信息
          if (distanceResult.results && distanceResult.results.length > 0) {
            const distance = distanceResult.results[0].distance;
            const formattedDistance = distance > 1000 ? `${(distance/1000).toFixed(1)}公里` : `${distance}米`;
            const duration = distanceResult.results[0].duration;
            const formattedDuration = Math.floor(duration / 60);
            
            // 构建友好的响应
            const friendlyResponse = `从${global.locationCache.originCity}到${global.locationCache.destCity}的驾车距离是${formattedDistance}，预计需要${formattedDuration}分钟的驾车时间。`;
            
            console.log('生成的友好响应:', friendlyResponse);
            return res.json({ content: friendlyResponse });
          }
        } catch (error) {
          console.error('处理距离结果时出错:', error);
          // 如果处理出错，继续使用模型生成响应
        }
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
