import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Interview, Message } from '../types';
import MessageList from '../components/MessageListManga';
import MessageInput from '../components/MessageInput';

export default function Interview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [, setIsAgentTyping] = useState(false);
  const [typingAgent, setTypingAgent] = useState<'candidate' | 'interviewer' | null>(null);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef(0);
  const isAutoScrollRef = useRef(true);

  const isAgentChat = !!(interview?.candidate_agent_id && interview?.interviewer_agent_id);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    isAutoScrollRef.current = isAtBottom;
  };

  useEffect(() => {
    if (!id) return;
    loadInterview();
    setPageLoaded(true);
  }, [id]);

  useEffect(() => {
    if (!id || !interview) return;

    const token = localStorage.getItem('token');
    let retryCount = 0;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let typingTimeout: ReturnType<typeof setTimeout> | null = null;
    let eventSource: EventSource | null = null;
    let isConnected = true;

    const connect = () => {
      if (!isConnected) return;
      eventSource = new EventSource(`/api/interview/${id}/events?token=${encodeURIComponent(token || '')}`);

      eventSource.onmessage = (event) => {
        // Clear any pending typing timeout on new message
        if (typingTimeout) {
          clearTimeout(typingTimeout);
          typingTimeout = null;
        }

        const data = JSON.parse(event.data);

        if (data.type === 'message') {
          setIsAgentTyping(false);
          setTypingAgent(null);
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) {
              return prev;
            }
            return [...prev, data.message];
          });
        } else if (data.type === 'typing') {
          // Handle typing indicator from server
          setTypingAgent(data.agent);
          setIsAgentTyping(true);
          // Auto-clear after a timeout (server will send message to clear)
          typingTimeout = setTimeout(() => {
            setIsAgentTyping(false);
            setTypingAgent(null);
          }, 5000);
        } else if (data.type === 'done') {
          setIsAgentTyping(false);
          setTypingAgent(null);
          setInterview(prev => prev ? { ...prev, status: 'completed' } : null);
        } else if (data.type === 'paused') {
          setIsPaused(true);
        } else if (data.type === 'resumed') {
          setIsPaused(false);
        }
      };

      eventSource.onerror = () => {
        if (!isConnected) return;
        eventSource?.close();

        // Exponential backoff retry (max 30 seconds)
        if (retryCount < 5) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          retryCount++;
          retryTimeout = setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      isConnected = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (typingTimeout) clearTimeout(typingTimeout);
      eventSource?.close();
    };
  }, [id, interview?.status]);

  useEffect(() => {
    if (messages.length > prevMessagesCountRef.current && isAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages]);

  const loadInterview = async () => {
    try {
      const data = await api.getInterview(parseInt(id!)) as Interview;
      setInterview(data);
      await loadMessages();
    } catch (err) {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await api.getMessages(parseInt(id!)) as Message[];
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await api.sendMessage(parseInt(id!), content, 'user', '我');
      await loadMessages();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleStopChat = () => {
    if (!confirm('确定要结束对话吗？结束后将生成评估报告。')) return;
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await api.completeInterview(parseInt(id!));
      navigate('/');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartChat = async () => {
    try {
      await api.startInterview(parseInt(id!));
      setIsStarted(true);
      setIsPaused(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePauseChat = async () => {
    try {
      await api.pauseInterview(parseInt(id!));
      setIsPaused(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResumeChat = async () => {
    try {
      await api.resumeInterview(parseInt(id!));
      setIsPaused(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
      }}>
        <div style={{
          width: 32,
          height: 32,
          border: '3px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: '#fbbf24',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!interview) {
    return (
      <div style={{
        height: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
        color: '#71717a',
        fontFamily: 'Inter, sans-serif',
      }}>
        面试不存在
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        * {
          box-sizing: border-box;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 4px;
        }
      `}</style>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#fafafa',
        opacity: pageLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        {/* 顶部栏 - 精简版 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: '#1a1a2e',
          color: '#fff',
          flexShrink: 0,
        }}>
          {/* 左侧状态 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: interview.status === 'completed' ? '#52525b' : '#22c55e',
              boxShadow: interview.status === 'completed' ? 'none' : '0 0 12px #22c55e',
              animation: interview.status !== 'completed' ? 'pulse 2s ease-in-out infinite' : 'none',
            }} />
            <span style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}>
              {interview.position}
            </span>
          </div>

          {/* 右侧标签 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 500,
              background: interview.type === 'group'
                ? 'rgba(34, 197, 94, 0.15)'
                : 'rgba(251, 191, 36, 0.15)',
              color: interview.type === 'group' ? '#22c55e' : '#fbbf24',
            }}>
              {interview.type === 'group' ? '群面' : '单面'}
            </span>
            {/* 关闭按钮 */}
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              返回
            </button>
          </div>
        </div>

        {/* 消息区域 - 撑满全屏 */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflow: 'auto',
            background: '#fff',
          }}
        >
          <MessageList messages={messages} typingCharacter={typingAgent} />
          <div ref={messagesEndRef} />
        </div>

        {/* 底部控制栏 - 简洁 */}
        <div style={{
          padding: '16px 24px',
          background: '#fff',
          borderTop: '1px solid #eee',
          flexShrink: 0,
        }}>
          {/* Agent 状态 */}
          {isAgentChat && interview.status !== 'completed' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 12,
              padding: '8px 16px',
              background: isPaused ? 'rgba(251, 191, 36, 0.08)' : 'rgba(34, 197, 94, 0.08)',
              borderRadius: 8,
            }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isPaused ? '#fbbf24' : '#22c55e',
                animation: isPaused ? 'none' : 'pulse 1.5s ease-in-out infinite',
              }} />
              <span style={{
                fontSize: 12,
                color: isPaused ? '#f59e0b' : '#16a34a',
              }}>
                {isPaused ? '已暂停' : 'AI 对话中'}
              </span>
            </div>
          )}

          {/* 按钮区域 */}
          {interview.status !== 'completed' ? (
            isAgentChat ? (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                {!isStarted ? (
                  <button
                    onClick={handleStartChat}
                    style={{
                      padding: '12px 32px',
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
                    }}
                  >
                    ▶ 开始面试
                  </button>
                ) : (
                  <>
                    <button
                      onClick={isPaused ? handleResumeChat : handlePauseChat}
                      style={{
                        padding: '12px 24px',
                        background: isPaused
                          ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                          : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {isPaused ? '▶ 继续' : '⏸ 暂停'}
                    </button>
                    <button
                      onClick={handleStopChat}
                      style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      ■ 结束
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <MessageInput onSend={handleSend} disabled={sending || !!isAgentChat} />
              </div>
            )
          ) : (
            <div style={{
              padding: 16,
              textAlign: 'center',
              color: '#666',
              fontSize: 14,
            }}>
              面试已结束
            </div>
          )}
        </div>
      </div>
    </>
  );
}
