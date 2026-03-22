import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Interview, Message, Evaluation } from '../types';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import EvaluationReport from '../components/EvaluationReport';

export default function Interview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEval, setShowEval] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [typingAgent, setTypingAgent] = useState<'candidate' | 'interviewer' | null>(null);
  const [pageLoaded, setPageLoaded] = useState(false);
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

  // SSE for real-time message updates
  useEffect(() => {
    if (!id || !interview) return;

    const eventSource = new EventSource(`/api/interview/${id}/events`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'message') {
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) {
            return prev;
          }
          return [...prev, data.message];
        });

        if (data.agent === 'interviewer') {
          setTypingAgent('candidate');
          setIsAgentTyping(true);
          setTimeout(() => {
            setIsAgentTyping(false);
            setTypingAgent(null);
          }, 3000);
        } else if (data.agent === 'candidate') {
          setTypingAgent('interviewer');
          setIsAgentTyping(true);
          setTimeout(() => {
            setIsAgentTyping(false);
            setTypingAgent(null);
          }, 3000);
        }
      } else if (data.type === 'done') {
        setInterview(prev => prev ? { ...prev, status: 'completed' } : null);
        setShowEval(true);
        loadEvaluation();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
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
      if (data.status === 'completed') {
        setShowEval(true);
        loadEvaluation();
      }
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

  const loadEvaluation = async () => {
    try {
      const data = await api.getEvaluation(parseInt(id!)) as Evaluation;
      setEvaluation(data);
    } catch (err) {
      console.error('Failed to load evaluation:', err);
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

  if (loading) {
    return (
      <div style={{
        height: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid #1e293b',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <span style={{ color: '#94a3b8', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
            加载面试中...
          </span>
        </div>
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
        background: '#0f172a',
        color: '#94a3b8',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        面试不存在
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap');

        * {
          box-sizing: border-box;
        }

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

        @keyframes typingDot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div style={{
        display: 'flex',
        height: 'calc(100vh - 60px)',
        background: '#0f172a',
        fontFamily: 'DM Sans, sans-serif',
        opacity: pageLoaded ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        {/* 左侧主聊天区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          borderRight: showEval ? '1px solid #1e293b' : 'none',
        }}>
          {/* 顶部头部 */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #1e293b',
            background: 'linear-gradient(180deg, #0f172a 0%, #0f172a 100%)',
            animation: 'fadeInUp 0.5s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: interview.status === 'completed' ? '#64748b' : '#10b981',
                boxShadow: interview.status === 'completed' ? 'none' : '0 0 12px #10b981',
                animation: interview.status !== 'completed' ? 'pulse 2s ease-in-out infinite' : 'none',
              }} />
              <h1 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                fontFamily: 'Outfit, sans-serif',
                color: '#f1f5f9',
                letterSpacing: '-0.02em',
              }}>
                {interview.position}
              </h1>
              <span style={{
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                background: interview.type === 'group' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: interview.type === 'group' ? '#10b981' : '#f59e0b',
                border: `1px solid ${interview.type === 'group' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              }}>
                {interview.type === 'group' ? '群面' : '单面'}
              </span>
            </div>
            {interview.question && (
              <p style={{
                margin: 0,
                fontSize: 13,
                color: '#94a3b8',
                lineHeight: 1.5,
              }}>
                <span style={{ color: '#64748b' }}>本次议题：</span>
                {interview.question}
              </p>
            )}
          </div>

          {/* 消息区域 */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            style={{
              flex: 1,
              overflow: 'auto',
              background: 'linear-gradient(180deg, #0f172a 0%, #0c1322 100%)',
            }}
          >
            <MessageList messages={messages} />

            {/* 正在输入指示器 */}
            {isAgentTyping && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 12,
                padding: '0 16px',
                animation: 'fadeInUp 0.3s ease',
              }}>
                {typingAgent === 'candidate' && (
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                  }}>
                    求
                  </div>
                )}
                <div style={{
                  padding: '12px 18px',
                  background: '#1e293b',
                  borderRadius: 16,
                  borderTopLeftRadius: 4,
                  display: 'flex',
                  gap: 5,
                  alignItems: 'center',
                }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#64748b',
                      animation: `typingDot 1.4s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
                {typingAgent === 'interviewer' && (
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
                  }}>
                    官
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 底部输入区 */}
          <div style={{
            padding: 20,
            borderTop: '1px solid #1e293b',
            background: '#0f172a',
          }}>
            {/* Agent 状态指示 */}
            {isAgentChat && interview.status !== 'completed' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 12,
                padding: '8px 16px',
                background: 'rgba(16, 185, 129, 0.08)',
                borderRadius: 8,
                border: '1px solid rgba(16, 185, 129, 0.2)',
                animation: 'fadeInUp 0.4s ease',
              }}>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#10b981',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                <span style={{
                  fontSize: 12,
                  color: '#10b981',
                  fontWeight: 500,
                }}>
                  AI Agent 对话中
                </span>
              </div>
            )}

            {/* 按钮区域 */}
            {interview.status !== 'completed' ? (
              isAgentChat ? (
                <button
                  onClick={handleStopChat}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(220, 38, 38, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(220, 38, 38, 0.3)';
                  }}
                >
                  结束面试
                </button>
              ) : (
                <>
                  <MessageInput onSend={handleSend} disabled={sending || !!isAgentChat} />
                  <button
                    onClick={handleComplete}
                    style={{
                      width: '100%',
                      marginTop: 12,
                      padding: '10px 16px',
                      background: 'transparent',
                      color: '#64748b',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#dc2626';
                      e.currentTarget.style.color = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#334155';
                      e.currentTarget.style.color = '#64748b';
                    }}
                  >
                    结束面试
                  </button>
                </>
              )
            ) : (
              <div style={{
                padding: 20,
                textAlign: 'center',
                color: '#64748b',
                fontSize: 14,
              }}>
                面试已结束
              </div>
            )}
          </div>
        </div>

        {/* 右侧评估报告 */}
        {showEval && (
          <div style={{
            width: 400,
            overflow: 'auto',
            background: '#0c1322',
            animation: 'fadeInUp 0.6s ease',
          }}>
            <EvaluationReport evaluation={evaluation} />
          </div>
        )}
      </div>
    </>
  );
}
