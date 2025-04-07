// 全局变量
let isProcessing = false;
let messages = [];
const BACKEND_API_URL = "/api/chat"; // 后端代理API地址

// DOM元素
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// 添加消息到聊天界面
function addMessage(role, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = content;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 添加加载中消息
function addLoadingMessage() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading';
  loadingDiv.id = 'loadingMessage';
  chatMessages.appendChild(loadingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 移除加载中消息
function removeLoadingMessage() {
  const loadingMessage = document.getElementById('loadingMessage');
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

// 处理用户输入
async function handleUserInput() {
  const query = userInput.value.trim();
  if (!query || isProcessing) return;
  
  // 清空输入框
  userInput.value = '';
  
  // 添加用户消息
  addMessage('user', query);
  
  // 添加用户消息到历史记录
  messages.push({
    role: 'user',
    content: query
  });
  
  // 显示加载中消息
  addLoadingMessage();
  isProcessing = true;
  
  try {
    // 调用后端API
    const response = await callBackendAPI(query);
    
    // 移除加载中消息
    removeLoadingMessage();
    
    // 添加助手回复
    addMessage('assistant', response);
  } catch (error) {
    // 移除加载中消息
    removeLoadingMessage();
    
    // 添加错误消息
    addMessage('error', `出错了: ${error.message || '未知错误'}`);
    console.error('处理查询时出错:', error);
  } finally {
    isProcessing = false;
  }
}

// 调用后端API
async function callBackendAPI(query) {
  try {
    console.log('发送请求到后端:', {
      url: BACKEND_API_URL,
      messages: messages
    });
    
    // 调用后端API
    const response = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages
      })
    });
    
    console.log('收到响应:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers])
    });
    
    if (!response.ok) {
      let errorMessage = `请求失败: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('错误数据:', errorData);
      } catch (e) {
        console.error('无法解析错误响应:', e);
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('响应数据:', data);
    
    // 如果有响应内容
    if (data.content) {
      // 添加助手消息到历史记录
      messages.push({
        role: 'assistant',
        content: data.content
      });
      
      return data.content;
    } else {
      console.error('响应中没有content字段:', data);
      return '服务器响应格式错误';
    }
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
}

// 事件监听
sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleUserInput();
  }
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 页面已经在HTML中包含了欢迎消息，不需要再添加
  console.log('聊天界面初始化完成');
});
