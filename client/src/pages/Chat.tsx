import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  MessageSquare,
  Plus,
  Search,
  Send,
  Square,
  Paperclip,
  ChevronDown,
  Menu,
  X,
  Bot,
  User,
  MoreVertical,
  Trash2,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '../components/ui';
import { useChat } from '../hooks/useChat';

// 代码块渲染组件
function CodeBlock({ inline, className, children, ...props }: {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  if (inline) {
    return (
      <code
        className="px-1.5 py-0.5 rounded bg-[var(--color-primary-light)] text-[var(--color-primary)] text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <SyntaxHighlighter
      style={oneDark}
      language={language || 'text'}
      PreTag="div"
      className="rounded-lg my-2 !bg-[#1a1a2e]"
      {...props}
    >
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  );
}

// 消息气泡组件
function MessageBubble({
  role,
  content,
  timestamp,
  isStreaming,
}: {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}) {
  const isUser = role === 'user';
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fadeIn`}
      style={{
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      {/* 头像 */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-[var(--color-primary)] text-white'
            : 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* 消息内容 */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-[var(--color-primary)] text-white rounded-br-md'
              : 'bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-bl-md shadow-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  code: CodeBlock as React.ComponentType<unknown>,
                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 last:mb-0 list-disc pl-4">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 last:mb-0 list-decimal pl-4">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-[var(--color-text-primary)]">{children}</strong>,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}
        </div>
        <span className="text-xs text-[var(--color-text-secondary)] mt-1 px-1">
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
}

// 会话列表项组件
function ConversationItem({
  agentName,
  lastMessage,
  lastMessageAt,
  isActive,
  onClick,
  onDelete,
}: {
  id: string;
  agentName: string;
  lastMessage: string;
  lastMessageAt: Date;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <div
      onClick={onClick}
      className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
        isActive
          ? 'bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20'
          : 'hover:bg-[var(--color-background)] border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Agent 头像 */}
        <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-[var(--color-primary)]" />
        </div>

        {/* 会话信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium truncate ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}`}>
              {agentName}
            </h4>
            <span className="text-xs text-[var(--color-text-secondary)] flex-shrink-0">
              {formatRelativeTime(lastMessageAt)}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] truncate mt-0.5">
            {lastMessage || '新会话'}
          </p>
        </div>

        {/* 更多操作 */}
        <div
          ref={menuRef}
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`p-1.5 rounded-lg transition-colors ${
              isActive ? 'hover:bg-[var(--color-primary)]/10' : 'hover:bg-[var(--color-border)]'
            } ${showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <MoreVertical className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 py-1 bg-white rounded-lg shadow-lg border border-[var(--color-border)] z-20 min-w-[120px]">
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                删除会话
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Chat() {
  useTranslation();
  const {
    conversations,
    currentConversation,
    agents,
    isConnected,
    isConnecting,
    connectionError,
    isMockMode,
    sendMessage,
    stopGeneration,
    createConversation,
    switchConversation,
    deleteConversation,
    switchAgent,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const agentDropdownRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target as Node)) {
        setShowAgentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理发送消息
  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
    // 重置文本框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 自动调整文本框高度
  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  // 过滤会话列表
  const filteredConversations = searchQuery
    ? conversations.filter(
        conv =>
          conv.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : conversations;

  // 检查是否有正在流式输出的消息
  const isStreaming = currentConversation?.messages.some(msg => msg.isStreaming);

  return (
    <div className="h-[calc(100vh-64px)] flex -m-6">
      {/* 左侧边栏 */}
      <aside
        className={`w-[280px] bg-[var(--color-card)] border-r border-[var(--color-border)] flex flex-col transition-transform duration-300 fixed md:relative z-20 h-full ${
          showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* 顶部操作栏 */}
        <div className="p-4 border-b border-[var(--color-border)] space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              className="flex-1 justify-center"
              onClick={() => createConversation()}
            >
              <Plus className="w-4 h-4" />
              新对话
            </Button>
            <button
              onClick={() => setShowSidebar(false)}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--color-background)]"
            >
              <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="搜索会话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
            />
          </div>
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredConversations.map((conv) => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            return (
              <ConversationItem
                key={conv.id}
                id={conv.id}
                agentName={conv.agentName}
                lastMessage={lastMsg?.content || ''}
                lastMessageAt={conv.lastMessageAt}
                isActive={conv.id === currentConversation?.id}
                onClick={() => {
                  switchConversation(conv.id);
                  setShowSidebar(false);
                }}
                onDelete={() => deleteConversation(conv.id)}
              />
            );
          })}
          {filteredConversations.length === 0 && (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{searchQuery ? '未找到匹配的会话' : '暂无会话'}</p>
            </div>
          )}
        </div>

        {/* 连接状态 */}
        <div className="p-3 border-t border-[var(--color-border)]">
          <div
            className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
              isConnected
                ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                : isMockMode
                ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>已连接</span>
              </>
            ) : isMockMode ? (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>模拟模式</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>连接断开</span>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* 主对话区域 */}
      <main className="flex-1 flex flex-col bg-[var(--color-background)] min-w-0">
        {/* 顶部栏 */}
        <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setShowSidebar(true)}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--color-background)]"
            >
              <Menu className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </button>

            {/* Agent 选择器 */}
            <div className="relative" ref={agentDropdownRef}>
              <button
                onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--color-background)] transition-colors"
              >
                <Bot className="w-5 h-5 text-[var(--color-primary)]" />
                <span className="font-medium text-[var(--color-text-primary)]">
                  {currentConversation?.agentName || '选择 Agent'}
                </span>
                <ChevronDown className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform ${showAgentDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showAgentDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-[var(--color-border)] py-1 z-30">
                  <div className="px-3 py-2 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                    选择 Agent
                  </div>
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        switchAgent(agent.id);
                        setShowAgentDropdown(false);
                      }}
                      className={`w-full px-3 py-2.5 text-left hover:bg-[var(--color-background)] flex items-center gap-2 transition-colors ${
                        agent.id === currentConversation?.agentId ? 'bg-[var(--color-primary-light)]' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
                        <Bot className="w-4 h-4 text-[var(--color-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${agent.id === currentConversation?.agentId ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}`}>
                          {agent.name}
                        </div>
                        {agent.description && (
                          <div className="text-xs text-[var(--color-text-secondary)] truncate">
                            {agent.description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 连接状态指示器 */}
          <div className="flex items-center gap-2">
            {isConnecting && (
              <span className="text-xs text-[var(--color-text-secondary)]">连接中...</span>
            )}
            {connectionError && (
              <span className="text-xs text-[var(--color-warning)]">{connectionError}</span>
            )}
          </div>
        </header>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentConversation?.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                开始新对话
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
                向 {currentConversation?.agentName || 'Agent'} 发送消息，开始你的对话之旅
              </p>
            </div>
          ) : (
            currentConversation?.messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                isStreaming={message.isStreaming}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="p-4 bg-[var(--color-card)] border-t border-[var(--color-border)]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 focus-within:border-[var(--color-primary)] transition-all">
              {/* 附件按钮 */}
              <button
                className="p-2 rounded-xl hover:bg-[var(--color-border)]/50 text-[var(--color-text-secondary)] transition-colors"
                title="添加附件（开发中）"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* 文本输入框 */}
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder="输入消息... (Shift+Enter 换行)"
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none py-2.5 px-2 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] max-h-[200px] min-h-[40px]"
                disabled={isStreaming}
              />

              {/* 发送/停止按钮 */}
              {isStreaming ? (
                <button
                  onClick={stopGeneration}
                  className="p-2.5 rounded-xl bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90 transition-colors"
                  title="停止生成"
                >
                  <Square className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="p-2.5 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="发送消息"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* 提示文字 */}
            <p className="text-xs text-[var(--color-text-secondary)] text-center mt-2">
              {isMockMode ? '当前为模拟模式，AI 回复为预设内容' : 'AI 可能会生成不准确的内容，请核实重要信息'}
            </p>
          </div>
        </div>
      </main>

      {/* 移动端遮罩 */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/20 z-10 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* 全局样式 */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Chat;
