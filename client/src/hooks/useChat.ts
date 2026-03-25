import { useState, useRef, useCallback, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  messages: Message[];
  lastMessageAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
}

interface UseChatOptions {
  onError?: (error: string) => void;
}

// 模拟回复内容
const MOCK_RESPONSES = [
  '你好！很高兴为你服务。我可以帮助你完成各种任务，包括回答问题、分析数据、编写代码等等。有什么我可以帮你的吗？',
  '这是一个很好的问题。让我为你详细分析一下...\n\n首先，我们需要理解核心概念。在实际应用中，这种方案有很多优势：\n\n1. **高效性** - 处理速度快\n2. **可扩展性** - 易于扩展\n3. **可靠性** - 稳定可靠\n\n你觉得这个方案如何？',
  '我来为你写一段示例代码：\n\n```typescript\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\n// 使用示例\nconsole.log(greet("World"));\n```\n\n这段代码展示了基本的函数定义和模板字符串用法。',
  '明白了，我来帮你处理这个任务。请稍等片刻...\n\n✅ 任务已完成！我已经按照你的要求处理了相关数据，结果如下：\n\n- 处理项目：12 个\n- 成功：12 个\n- 失败：0 个\n- 耗时：1.3 秒\n\n如有其他需要，请随时告诉我。',
  '根据你的描述，我建议你可以考虑以下几种方案：\n\n**方案 A**：快速实现，适合短期需求\n**方案 B**：长期维护，架构更清晰\n**方案 C**：折中方案，平衡开发效率和维护成本\n\n你倾向于哪种方案？我可以为你提供更详细的实施计划。',
];

// 生成唯一 ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// 格式化时间
const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// 格式化相对时间
const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(date);
};

export function useChat(options: UseChatOptions = {}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId) || null;

  // 初始化模拟数据
  useEffect(() => {
    // 模拟 Agent 列表
    setAgents([
      { id: 'assistant', name: '智能助手', description: '通用的 AI 助手' },
      { id: 'coder', name: '代码专家', description: '擅长编程和技术问题' },
      { id: 'writer', name: '写作助手', description: '帮助写作和润色' },
      { id: 'analyst', name: '数据分析师', description: '数据分析和可视化' },
    ]);

    // 创建默认会话
    const defaultConversation: Conversation = {
      id: generateId(),
      agentId: 'assistant',
      agentName: '智能助手',
      messages: [],
      lastMessageAt: new Date(),
    };
    setConversations([defaultConversation]);
    setCurrentConversationId(defaultConversation.id);
  }, []);

  // 检查连接状态
  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/status`);
      if (response.ok) {
        const data = await response.json();
        setIsMockMode(data.mockMode);
        setIsConnected(data.installed);
        return data;
      }
    } catch {
      setIsConnected(false);
    }
    return null;
  }, []);

  // 连接 SSE
  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      // 创建 SSE 连接
      const es = new EventSource(`${API_BASE}/api/chat/stream`);

      es.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleSSEMessage(data);
        } catch {
          // 忽略解析错误
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        setIsConnecting(false);
        // SSE 连接失败不影响功能，仍然可以使用 POST 发送消息
        es.close();
      };

      eventSourceRef.current = es;
    } catch {
      setIsConnecting(false);
      setConnectionError('SSE 连接失败');
    }
  }, []);

  // 断开连接
  const disconnect = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setIsConnected(false);
  }, []);

  // 处理 SSE 消息
  const handleSSEMessage = useCallback((data: { type?: string; mockMode?: boolean; [key: string]: unknown }) => {
    if (typeof data !== 'object' || data === null) return;

    switch (data.type) {
      case 'connected':
        if (data.mockMode !== undefined) {
          setIsMockMode(data.mockMode);
        }
        break;
      case 'heartbeat':
        // 心跳消息，无需处理
        break;
    }
  }, []);

  // 添加消息
  const addMessage = useCallback((role: 'user' | 'assistant', content: string, isStreaming = false) => {
    const newMessage: Message = {
      id: generateId(),
      role,
      content,
      timestamp: new Date(),
      isStreaming,
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessageAt: new Date(),
        };
      }
      return conv;
    }));

    return newMessage.id;
  }, [currentConversationId]);

  // 更新流式消息
  const updateStreamingMessage = useCallback((messageId: string, content: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: conv.messages.map(msg =>
            msg.id === messageId
              ? { ...msg, content: msg.content + content }
              : msg
          ),
        };
      }
      return conv;
    }));
  }, [currentConversationId]);

  // 结束流式消息
  const finalizeStreamingMessage = useCallback(() => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: conv.messages.map(msg =>
            msg.isStreaming ? { ...msg, isStreaming: false } : msg
          ),
        };
      }
      return conv;
    }));
    streamingMessageIdRef.current = null;
  }, [currentConversationId]);

  // 发送消息（使用 SSE 流式响应）
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !currentConversationId) return;

    // 添加用户消息
    addMessage('user', content);

    // 创建 AbortController 用于取消请求
    abortControllerRef.current = new AbortController();

    // 添加空的 AI 消息用于流式显示
    const messageId = generateId();
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, {
            id: messageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
          }],
          lastMessageAt: new Date(),
        };
      }
      return conv;
    }));
    streamingMessageIdRef.current = messageId;

    try {
      const response = await fetch(`${API_BASE}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          agent: currentConversation?.agentId || 'main',
          sessionId: currentConversationId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 处理 SSE 流
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));

              switch (data.type) {
                case 'start':
                  if (data.mockMode !== undefined) {
                    setIsMockMode(data.mockMode);
                  }
                  break;
                case 'chunk':
                  if (data.content) {
                    updateStreamingMessage(messageId, data.content);
                  }
                  break;
                case 'end':
                  finalizeStreamingMessage();
                  reader.cancel();
                  return;
                case 'error':
                  options.onError?.(data.error || '未知错误');
                  finalizeStreamingMessage();
                  break;
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      finalizeStreamingMessage();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 用户取消，正常结束
        finalizeStreamingMessage();
      } else {
        // 其他错误，使用 Mock 模式
        console.error('Chat error:', error);
        setIsMockMode(true);

        // 使用 Mock 响应
        const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];

        // 逐字输出 Mock 响应
        const chars = response.split('');
        let index = 0;

        const interval = setInterval(() => {
          if (index < chars.length) {
            updateStreamingMessage(messageId, chars[index]);
            index++;
          } else {
            clearInterval(interval);
            finalizeStreamingMessage();
          }
        }, 30);
      }
    }
  }, [currentConversationId, currentConversation?.agentId, addMessage, updateStreamingMessage, finalizeStreamingMessage, options]);

  // 停止生成
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    finalizeStreamingMessage();
  }, [finalizeStreamingMessage]);

  // 创建新会话
  const createConversation = useCallback((agentId?: string) => {
    const agent = agents.find(a => a.id === agentId) || agents[0];
    const newConversation: Conversation = {
      id: generateId(),
      agentId: agent?.id || 'assistant',
      agentName: agent?.name || '智能助手',
      agentAvatar: agent?.avatar,
      messages: [],
      lastMessageAt: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    return newConversation.id;
  }, [agents]);

  // 切换会话
  const switchConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
  }, []);

  // 删除会话
  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== conversationId);
      if (currentConversationId === conversationId && filtered.length > 0) {
        setCurrentConversationId(filtered[0].id);
      } else if (filtered.length === 0) {
        createConversation();
      }
      return filtered;
    });
  }, [currentConversationId, createConversation]);

  // 切换 Agent
  const switchAgent = useCallback((agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent || !currentConversationId) return;

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          agentId: agent.id,
          agentName: agent.name,
          agentAvatar: agent.avatar,
        };
      }
      return conv;
    }));
  }, [agents, currentConversationId]);

  // 搜索会话
  const searchConversations = useCallback((query: string) => {
    if (!query.trim()) return conversations;
    return conversations.filter(conv =>
      conv.agentName.toLowerCase().includes(query.toLowerCase()) ||
      conv.messages.some(msg => msg.content.toLowerCase().includes(query.toLowerCase()))
    );
  }, [conversations]);

  // 初始连接和状态检查
  useEffect(() => {
    checkStatus();
    connect();

    return () => {
      disconnect();
    };
  }, [checkStatus, connect, disconnect]);

  // 定期轮询状态
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus();
    }, 30000); // 每 30 秒检查一次

    return () => clearInterval(interval);
  }, [checkStatus]);

  return {
    // 状态
    conversations,
    currentConversation,
    currentConversationId,
    agents,
    isConnected,
    isConnecting,
    connectionError,
    isMockMode,

    // 方法
    sendMessage,
    stopGeneration,
    createConversation,
    switchConversation,
    deleteConversation,
    switchAgent,
    searchConversations,
    connect,
    disconnect,

    // 工具函数
    formatTime,
    formatRelativeTime,
  };
}
