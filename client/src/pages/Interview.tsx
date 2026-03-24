import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Interview, Message, Evaluation, InterviewFeedback, CoachingLog } from '../types';
import MessageList from '../components/MessageListManga';
import MessageInput from '../components/MessageInput';
import EvaluationReport from '../components/EvaluationReport';
import CoachInput from '../components/CoachInput';
import FeedbackPanel from '../components/FeedbackPanel';

export default function Interview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEval, setShowEval] = useState(false);
  const [, setIsAgentTyping] = useState(false);
  const [typingAgent, setTypingAgent] = useState<'candidate' | 'interviewer' | null>(null);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [feedbacks, setFeedbacks] = useState<InterviewFeedback[]>([]);
  const [coachingLogs, setCoachingLogs] = useState<CoachingLog[]>([]);
  const [isCoachMode, setIsCoachMode] = useState(false);
  const [coachPanelOpen, setCoachPanelOpen] = useState(true);
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

    const eventSource = new EventSource(`/api/interview/${id}/events`);

    eventSource.onmessage = (event) => {
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
        setTimeout(() => {
          setIsAgentTyping(false);
          setTypingAgent(null);
        }, 5000);
      } else if (data.type === 'done') {
        setIsAgentTyping(false);
        setTypingAgent(null);
        setInterview(prev => prev ? { ...prev, status: 'completed' } : null);
        setShowEval(true);
        // 如果 SSE 中有评估数据，直接使用
        if (data.evaluation) {
          setEvaluation(data.evaluation);
        } else {
          loadEvaluation();
        }
      } else if (data.type === 'paused') {
        setIsPaused(true);
      } else if (data.type === 'resumed') {
        setIsPaused(false);
      } else if (data.type === 'feedback') {
        setFeedbacks(prev => [...prev, { id: Date.now(), interview_id: parseInt(id!), round: data.round, type: 'realtime', content: data.content, created_at: new Date().toISOString() }]);
      } else if (data.type === 'coaching_accepted') {
        setCoachingLogs(prev => [...prev, { id: Date.now(), interview_id: parseInt(id!), user_id: 1, coaching_type: 'guide', content: data.original, agent_response: 'accepted', agent_feedback: data.applied, created_at: new Date().toISOString() }]);
      } else if (data.type === 'coaching_rejected') {
        setCoachingLogs(prev => [...prev, { id: Date.now(), interview_id: parseInt(id!), user_id: 1, coaching_type: 'correct', content: data.original, agent_response: 'rejected', agent_feedback: data.reason, created_at: new Date().toISOString() }]);
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

  const handleCoachSend = async (content: string) => {
    try {
      const result = await api.processCoaching(parseInt(id!), content);
      if (result.accepted) {
        setCoachingLogs(prev => [...prev, {
          id: Date.now(),
          interview_id: parseInt(id!),
          user_id: 1,
          coaching_type: 'guide',
          content,
          agent_response: 'accepted',
          agent_feedback: result.appliedContent || '',
          created_at: new Date().toISOString(),
        }]);
      } else {
        setCoachingLogs(prev => [...prev, {
          id: Date.now(),
          interview_id: parseInt(id!),
          user_id: 1,
          coaching_type: 'correct',
          content,
          agent_response: 'rejected',
          agent_feedback: result.reason,
          created_at: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      console.error('Coach send error:', err);
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
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=M+PLUS+Rounded+1c:wght@400;500;700&display=swap');

        * {
          box-sizing: border-box;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
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
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
      `}</style>

      <div style={{
        display: 'flex',
        height: 'calc(100vh - 60px)',
        background: '#09090b',
        fontFamily: 'Inter, sans-serif',
        opacity: pageLoaded ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}>
        {/* 左侧主聊天区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          borderRight: showEval ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
        }}>
          {/* 顶部头部 */}
          <div style={{
            padding: '24px 28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.3)',
            animation: 'fadeInUp 0.5s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: interview.status === 'completed' ? '#52525b' : '#22c55e',
                boxShadow: interview.status === 'completed' ? 'none' : '0 0 16px #22c55e',
                animation: interview.status !== 'completed' ? 'pulse 2s ease-in-out infinite' : 'none',
              }} />
              <h1 style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                fontFamily: 'Space Grotesk, sans-serif',
                color: '#fafafa',
                letterSpacing: '-0.02em',
              }}>
                {interview.position}
              </h1>
              <span style={{
                padding: '5px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background: interview.type === 'group'
                  ? 'rgba(34, 197, 94, 0.12)'
                  : 'rgba(251, 191, 36, 0.12)',
                color: interview.type === 'group' ? '#22c55e' : '#fbbf24',
                border: `1px solid ${interview.type === 'group' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(251, 191, 36, 0.25)'}`,
              }}>
                {interview.type === 'group' ? '👥 群面' : '👤 单面'}
              </span>
            </div>
            {interview.question && (
              <p style={{
                margin: 0,
                fontSize: 13,
                color: '#71717a',
                lineHeight: 1.6,
              }}>
                <span style={{ color: '#52525b' }}>本次议题：</span>
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
              background: '#f8f8f8',
              borderRadius: 16,
              margin: '0 12px',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <MessageList messages={messages} typingCharacter={typingAgent} />

            <div ref={messagesEndRef} />
          </div>

          {/* 底部输入区 */}
          <div style={{
            padding: 24,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.4)',
          }}>
            {/* Coach mode controls */}
            {isAgentChat && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
              }}>
                <button
                  onClick={() => setIsCoachMode(!isCoachMode)}
                  style={{
                    padding: '8px 16px',
                    background: isCoachMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: isCoachMode ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    color: isCoachMode ? '#22c55e' : '#71717a',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {isCoachMode ? '✓ 教练模式' : '开启教练模式'}
                </button>
                {isCoachMode && (
                  <button
                    onClick={() => setCoachPanelOpen(!coachPanelOpen)}
                    style={{
                      padding: '8px 16px',
                      background: coachPanelOpen ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: coachPanelOpen ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                      color: coachPanelOpen ? '#fbbf24' : '#71717a',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {coachPanelOpen ? '隐藏反馈' : '显示反馈'}
                  </button>
                )}
              </div>
            )}

            {/* Coach input */}
            {isCoachMode && (
              <CoachInput onSend={handleCoachSend} disabled={!!isAgentChat} />
            )}

            {/* Agent 状态指示 */}
            {isAgentChat && interview.status !== 'completed' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 16,
                padding: '10px 20px',
                background: isPaused ? 'rgba(251, 191, 36, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                borderRadius: 12,
                border: isPaused ? '1px solid rgba(251, 191, 36, 0.2)' : '1px solid rgba(34, 197, 94, 0.2)',
                animation: 'fadeInUp 0.4s ease',
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isPaused ? '#fbbf24' : '#22c55e',
                  animation: isPaused ? 'none' : 'pulse 1.5s ease-in-out infinite',
                }} />
                <span style={{
                  fontSize: 13,
                  color: isPaused ? '#fbbf24' : '#22c55e',
                  fontWeight: 500,
                }}>
                  {isPaused ? '⏸ 已暂停' : 'AI Agent 对话中'}
                </span>
              </div>
            )}

            {/* 按钮区域 */}
            {interview.status !== 'completed' ? (
              isAgentChat ? (
                <div style={{ display: 'flex', gap: 12 }}>
                  {!isStarted ? (
                    <button
                      onClick={handleStartChat}
                      style={{
                        flex: 1,
                        padding: '16px 24px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 14,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                        fontFamily: 'Space Grotesk, sans-serif',
                        boxShadow: '0 8px 30px rgba(34, 197, 94, 0.25)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(34, 197, 94, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(34, 197, 94, 0.25)';
                      }}
                    >
                      ▶ 开始面试
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={isPaused ? handleResumeChat : handlePauseChat}
                        style={{
                          flex: 1,
                          padding: '16px 24px',
                          background: isPaused
                            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                            : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 14,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                          fontFamily: 'Space Grotesk, sans-serif',
                          boxShadow: isPaused
                            ? '0 8px 30px rgba(34, 197, 94, 0.25)'
                            : '0 8px 30px rgba(251, 191, 36, 0.25)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {isPaused ? '▶ 继续面试' : '⏸ 暂停面试'}
                      </button>
                      <button
                        onClick={handleStopChat}
                        style={{
                          flex: 1,
                          padding: '16px 24px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 14,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                          fontFamily: 'Space Grotesk, sans-serif',
                          boxShadow: '0 8px 30px rgba(239, 68, 68, 0.25)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 12px 40px rgba(239, 68, 68, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 8px 30px rgba(239, 68, 68, 0.25)';
                        }}
                      >
                        ■ 结束面试
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <MessageInput onSend={handleSend} disabled={sending || !!isAgentChat} />
                  <button
                    onClick={handleComplete}
                    style={{
                      width: '100%',
                      marginTop: 12,
                      padding: '12px 20px',
                      background: 'transparent',
                      color: '#71717a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = '#71717a';
                    }}
                  >
                    结束面试
                  </button>
                </>
              )
            ) : (
              <div style={{
                padding: 24,
                textAlign: 'center',
                color: '#52525b',
                fontSize: 14,
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 14,
              }}>
                面试已结束
              </div>
            )}
          </div>
        </div>

        {/* Right feedback panel */}
        {coachPanelOpen && isCoachMode && feedbacks.length > 0 && (
          <div style={{
            width: 320,
            background: 'linear-gradient(180deg, #0c0c0f 0%, #09090b 100%)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
            overflow: 'auto',
          }}>
            <FeedbackPanel feedbacks={feedbacks} />

            {/* Coaching logs */}
            {coachingLogs.length > 0 && (
              <div style={{ padding: 16, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#a1a1aa',
                }}>
                  指导记录
                </h3>
                {coachingLogs.map((log) => (
                  <div key={log.id} style={{
                    padding: 12,
                    background: log.agent_response === 'accepted' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${log.agent_response === 'accepted' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    borderRadius: 10,
                    marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>
                      你：{log.content}
                    </div>
                    <div style={{ fontSize: 12, color: log.agent_response === 'accepted' ? '#22c55e' : '#ef4444' }}>
                      {log.agent_response === 'accepted' ? '✓ 采纳' : '✗ 拒绝'}：{log.agent_feedback}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 右侧评估报告 */}
        {showEval && (
          <div style={{
            width: 420,
            overflow: 'auto',
            background: 'linear-gradient(180deg, #0c0c0f 0%, #09090b 100%)',
            animation: 'fadeInUp 0.6s ease',
          }}>
            <EvaluationReport evaluation={evaluation} />
          </div>
        )}
      </div>
    </>
  );
}
