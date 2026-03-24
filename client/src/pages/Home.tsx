import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Interview, Position, Agent } from '../types';
import AgentModal from '../components/AgentModal';

export default function Home() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<Interview[]>([]);
  const [interviewType, setInterviewType] = useState<'group' | 'single' | 'multi'>('single');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('全部');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [roomStatus, setRoomStatus] = useState<{active: number, max: number, available: boolean}>({active: 0, max: 10, available: true});
  const [roomTab, setRoomTab] = useState<'active' | 'completed'>('active');
  const [multiRoomCount, setMultiRoomCount] = useState(3);
  const [multiRoomPositions, setMultiRoomPositions] = useState<Position[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>();
  const [agentTab, setAgentTab] = useState<'candidate' | 'interviewer'>('candidate');
  const [selectedCandidateAgentId, setSelectedCandidateAgentId] = useState<number | null>(null);
  const [selectedInterviewerAgentId, setSelectedInterviewerAgentId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.login({ email: 'user@local', password: '' }).then((result: any) => {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      loadData();
    }).catch(() => {
      loadData();
    });
  }, []);

  // 预设的默认 Agent
  const defaultAgents = {
    candidate: [
      {
        name: '张同学',
        type: 'candidate' as const,
        education: '清华大学 计算机科学与技术 本科',
        experience: '字节跳动 前端实习 6个月；腾讯 后端实习 3个月',
        skills: 'React, Vue, TypeScript, Node.js, Python',
        projects: '开发了一个基于 React 的在线协作白板项目',
        personality: '逻辑清晰，善于表达，对新技术充满热情',
      },
      {
        name: '李同学',
        type: 'candidate' as const,
        education: '上海交通大学 软件工程 硕士',
        experience: '阿里巴巴 算法实习 8个月；微软 实习 4个月',
        skills: 'Python, TensorFlow, PyTorch, 算法设计, 系统设计',
        projects: '发表过顶会论文，研究方向为推荐系统',
        personality: '严谨务实，喜欢深入研究问题',
      },
      {
        name: '王同学',
        type: 'candidate' as const,
        education: '浙江大学 产品设计 本科',
        experience: '网易 产品经理实习 6个月；滴滴 用户研究实习 3个月',
        skills: 'Axure, Figma, 用户研究, 需求分析, 数据分析',
        projects: '主导过校园社交 APP 的从 0 到 1 开发',
        personality: '创意十足，擅长用户洞察和需求挖掘',
      },
    ],
    interviewer: [
      {
        name: '陈面试官',
        type: 'interviewer' as const,
        company: '字节跳动',
        specialties: '前端架构, 工程化, 性能优化',
        style: '考察深度，喜欢追问原理，要求代码质量',
      },
      {
        name: '刘面试官',
        type: 'interviewer' as const,
        company: '阿里巴巴',
        specialties: '算法, 系统设计, 大数据',
        style: '考察广度，题型多变，重视思维过程',
      },
      {
        name: '周面试官',
        type: 'interviewer' as const,
        company: '腾讯',
        specialties: '产品思维, 用户体验, 业务洞察',
        style: '考察实战经验，喜欢结合业务场景提问',
      },
    ],
  };

  const initDefaultAgents = async () => {
    const existingAgents = await api.getAgents();
    if (existingAgents.length > 0) return;

    for (const agent of [...defaultAgents.candidate, ...defaultAgents.interviewer]) {
      try {
        await api.createAgent(agent);
      } catch (err) {
        console.error('Failed to create default agent:', err);
      }
    }
  };

  const loadData = async () => {
    try {
      const [posData, histData, roomData, agentData] = await Promise.all([
        api.getPositions(),
        api.getHistory(),
        api.getRoomStatus(),
        api.getAgents(),
      ]);
      setPositions(posData as Position[]);
      setHistory(histData as Interview[]);
      setRoomStatus(roomData as any);

      if ((agentData as Agent[]).length === 0) {
        await initDefaultAgents();
        const newAgentData = await api.getAgents();
        setAgents(newAgentData);
      } else {
        setAgents(agentData as Agent[]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleCreate = async () => {
    if (interviewType === 'multi') {
      if (multiRoomPositions.length === 0) return;
      setLoading(true);
      try {
        const createdRooms: Interview[] = [];
        for (const pos of multiRoomPositions) {
          const positionName = `${pos.name} - ${pos.position}`;
          const interview = await api.createInterview({
            type: 'single',
            position: positionName,
          }) as Interview;
          createdRooms.push(interview);
        }
        if (createdRooms.length > 0) {
          navigate(`/interview/${createdRooms[0].id}`);
        }
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (!selectedPosition) return;
      setLoading(true);
      try {
        const positionName = `${selectedPosition.name} - ${selectedPosition.position}`;
        const interview = await api.createInterview({
          type: interviewType,
          position: positionName,
          candidate_agent_id: selectedCandidateAgentId || undefined,
          interviewer_agent_id: selectedInterviewerAgentId || undefined,
        }) as Interview;
        navigate(`/interview/${interview.id}`);
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredPositions = positions.filter(p => {
    const matchesSearch = searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.position.toLowerCase().includes(searchQuery.toLowerCase());

    const categoryMap: Record<string, string[]> = {
      '全部': [],
      '前端': ['前端'],
      '后端': ['后端'],
      '算法': ['算法'],
      '产品': ['产品'],
      '运营': ['运营'],
    };
    const categories = categoryMap[activeFilter] || [];
    const matchesFilter = categories.length === 0 ||
      categories.some(cat => p.position.includes(cat));

    return matchesSearch && matchesFilter;
  });

  if (pageLoading) {
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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

        * {
          box-sizing: border-box;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .gradient-text {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-gradient {
          background: radial-gradient(ellipse at 20% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 20%, rgba(251, 191, 36, 0.1) 0%, transparent 40%),
                      radial-gradient(ellipse at 50% 100%, rgba(34, 197, 94, 0.08) 0%, transparent 50%);
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

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{
          padding: '20px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          animation: 'fadeInUp 0.4s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(251, 191, 36, 0.3)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
                A2A 面试
              </span>
              <span style={{ fontSize: 11, color: '#71717a', marginLeft: 10 }}>智能模拟面试平台</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}>
            <div style={{
              padding: '8px 16px',
              borderRadius: 20,
              background: roomStatus.available ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${roomStatus.available ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}>
              <span style={{ fontSize: 12, color: roomStatus.available ? '#22c55e' : '#ef4444' }}>
                ● 房间 {roomStatus.active}/{roomStatus.max}
              </span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section style={{
          padding: '64px 40px 48px',
          textAlign: 'center',
          maxWidth: 900,
          margin: '0 auto',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 20px',
            borderRadius: 30,
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            marginBottom: 28,
            animation: 'fadeInUp 0.4s ease',
          }}>
            <span style={{ fontSize: 14 }}>✨</span>
            <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 500 }}>AI 驱动的沉浸式面试体验</span>
          </div>

          <h1 style={{
            fontSize: 52,
            fontWeight: 700,
            fontFamily: 'Space Grotesk, sans-serif',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 20,
            animation: 'fadeInUp 0.4s ease 0.1s both',
          }}>
            <span className="gradient-text">智能模拟面试</span>
            <br />
            <span style={{ color: '#a1a1aa' }}>让你脱颖而出</span>
          </h1>

          <p style={{
            fontSize: 17,
            color: '#71717a',
            maxWidth: 580,
            margin: '0 auto 40px',
            lineHeight: 1.7,
            animation: 'fadeInUp 0.4s ease 0.2s both',
          }}>
            选择心仪岗位，与 AI 面试官进行真实场景模拟。
            获得专业即时反馈，全面提升面试技巧。
          </p>

          <Link to="/profile/create">
            <button style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 32,
            }}>
              创建求职画像
            </button>
          </Link>

          {/* Interview Type Selector */}
          <div style={{
            display: 'inline-flex',
            gap: 6,
            padding: 5,
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            animation: 'fadeInUp 0.4s ease 0.3s both',
          }}>
            {[
              { key: 'single', label: '单面', icon: '👤' },
              { key: 'group', label: '群面', icon: '👥' },
              { key: 'multi', label: '多房间', icon: '🏠' },
            ].map((type) => (
              <button
                key={type.key}
                onClick={() => setInterviewType(type.key as any)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: interviewType === type.key
                    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                    : 'transparent',
                  color: interviewType === type.key ? '#09090b' : '#a1a1aa',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ marginRight: 6 }}>{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </section>

        {/* Main Content */}
        <section style={{
          padding: '0 40px 64px',
          maxWidth: 1100,
          margin: '0 auto',
        }}>
          {interviewType !== 'multi' && (
            <div className="glass-card" style={{
              borderRadius: 20,
              padding: 28,
              animation: 'fadeInUp 0.4s ease 0.4s both',
            }}>
              {/* Search */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: '12px 18px',
                marginBottom: 18,
                gap: 10,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="搜索公司或岗位..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fafafa',
                    fontSize: 14,
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
                {['全部', '前端', '后端', '算法', '产品', '运营'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 18,
                      border: 'none',
                      background: activeFilter === filter
                        ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      color: activeFilter === filter ? '#09090b' : '#a1a1aa',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Position Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: 14,
                maxHeight: 300,
                overflowY: 'auto',
                marginBottom: 20,
                paddingRight: 6,
              }}>
                {filteredPositions.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPosition(p)}
                    style={{
                      background: selectedPosition?.id === p.id
                        ? 'rgba(251, 191, 36, 0.1)'
                        : 'rgba(0, 0, 0, 0.2)',
                      border: selectedPosition?.id === p.id
                        ? '2px solid rgba(251, 191, 36, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 14,
                      padding: 18,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedPosition?.id !== p.id) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedPosition?.id !== p.id) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#fafafa' }}>{p.name}</span>
                      {p.tag && (
                        <span style={{
                          fontSize: 9,
                          padding: '2px 7px',
                          borderRadius: 5,
                          background: p.tag === '急招' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                          color: p.tag === '急招' ? '#ef4444' : '#22c55e',
                          fontWeight: 500,
                        }}>
                          {p.tag}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 6 }}>{p.position}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: p.salary ? '#fbbf24' : '#71717a' }}>{p.salary || '薪资面议'}</span>
                      {p.location && <span style={{ fontSize: 10, color: '#71717a' }}>{p.location}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Agent Selection */}
              {selectedPosition && agents.length > 0 && (
                <div style={{ marginBottom: 18, padding: 18, background: 'rgba(0, 0, 0, 0.2)', borderRadius: 12 }}>
                  <label style={{ fontSize: 12, color: '#a1a1aa', display: 'block', marginBottom: 10, fontWeight: 500 }}>
                    选择参与方（可选）
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#71717a', marginBottom: 4 }}>👤 求职者 Agent</div>
                      <select
                        value={selectedCandidateAgentId || ''}
                        onChange={(e) => setSelectedCandidateAgentId(e.target.value ? parseInt(e.target.value) : null)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: '#fafafa',
                          fontSize: 12,
                          fontFamily: 'Inter, sans-serif',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="">不使用</option>
                        {agents.filter(a => a.type === 'candidate').map(a => (
                          <option key={a.id} value={a.id}>👤 {a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#71717a', marginBottom: 4 }}>🎯 面试官 Agent</div>
                      <select
                        value={selectedInterviewerAgentId || ''}
                        onChange={(e) => setSelectedInterviewerAgentId(e.target.value ? parseInt(e.target.value) : null)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: '#fafafa',
                          fontSize: 12,
                          fontFamily: 'Inter, sans-serif',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="">不使用</option>
                        {agents.filter(a => a.type === 'interviewer').map(a => (
                          <option key={a.id} value={a.id}>🎯 {a.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {selectedCandidateAgentId && selectedInterviewerAgentId && (
                    <div style={{ marginTop: 10, textAlign: 'center', color: '#22c55e', fontSize: 11 }}>
                      🤖 开启双 Agent 自动对话模式
                    </div>
                  )}
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={handleCreate}
                disabled={!selectedPosition || loading}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: selectedPosition && !loading
                    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: selectedPosition ? '#09090b' : '#71717a',
                  cursor: selectedPosition && !loading ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'Space Grotesk, sans-serif',
                  boxShadow: selectedPosition && !loading ? '0 6px 24px rgba(251, 191, 36, 0.2)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {loading ? '创建中...' : selectedPosition ? `开始 ${interviewType === 'group' ? '群面' : '单面'}` : '请选择一个岗位'}
              </button>
            </div>
          )}

          {/* Multi-Room Mode */}
          {interviewType === 'multi' && (
            <div className="glass-card" style={{
              borderRadius: 20,
              padding: 28,
              animation: 'fadeInUp 0.4s ease 0.4s both',
            }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontSize: 13, color: '#a1a1aa', fontWeight: 500 }}>选择房间数量</label>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24', fontFamily: 'Space Grotesk, sans-serif' }}>{multiRoomCount}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.min(10 - roomStatus.active, 10)}
                  value={multiRoomCount}
                  onChange={(e) => setMultiRoomCount(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#fbbf24',
                    height: 5,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#71717a', marginTop: 6 }}>
                  <span>1</span>
                  <span>可用: {10 - roomStatus.active} 房间</span>
                  <span>10</span>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 10, display: 'block', fontWeight: 500 }}>
                  为每个房间选择岗位
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(multiRoomCount, 3)}, 1fr)`,
                  gap: 10,
                  maxHeight: 260,
                  overflowY: 'auto',
                }}>
                  {Array.from({ length: multiRoomCount }).map((_, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 10,
                      padding: 14,
                    }}>
                      <div style={{ fontSize: 10, color: '#fbbf24', marginBottom: 6, fontWeight: 500 }}>房间 {idx + 1}</div>
                      <select
                        value={multiRoomPositions[idx]?.id || ''}
                        onChange={(e) => {
                          const pos = positions.find(p => p.id === e.target.value);
                          const newPositions = [...multiRoomPositions];
                          newPositions[idx] = pos || { id: '', name: '', position: '', tag: '', salary: '', location: '' };
                          setMultiRoomPositions(newPositions.filter(p => p.id));
                        }}
                        style={{
                          width: '100%',
                          padding: '9px',
                          borderRadius: 7,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: '#fafafa',
                          fontSize: 11,
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="">选择岗位...</option>
                        {filteredPositions.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} - {p.position}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: 'rgba(251, 191, 36, 0.08)',
                borderRadius: 10,
                padding: 14,
                marginBottom: 18,
                border: '1px solid rgba(251, 191, 36, 0.15)',
              }}>
                <div style={{ fontSize: 13, color: '#fafafa', marginBottom: 3 }}>即将创建 {multiRoomCount} 个面试房间</div>
                <div style={{ fontSize: 11, color: '#71717a' }}>
                  {multiRoomPositions.length} 个房间已选择岗位
                  {multiRoomPositions.length > 0 && ` (${multiRoomPositions.map(p => p.name).join(', ')})`}
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={multiRoomPositions.length !== multiRoomCount || loading}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: multiRoomPositions.length === multiRoomCount && !loading
                    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: multiRoomPositions.length === multiRoomCount ? '#09090b' : '#71717a',
                  cursor: multiRoomPositions.length === multiRoomCount && !loading ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'Space Grotesk, sans-serif',
                }}
              >
                {loading ? '创建中...' : multiRoomPositions.length === multiRoomCount ? `开始 ${multiRoomCount} 个面试` : `请为所有房间选择岗位 (${multiRoomPositions.length}/${multiRoomCount})`}
              </button>
            </div>
          )}
        </section>

        {/* Features Section */}
        <section style={{
          padding: '48px 40px 64px',
          maxWidth: 1100,
          margin: '0 auto',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{
              fontSize: 32,
              fontWeight: 700,
              fontFamily: 'Space Grotesk, sans-serif',
              letterSpacing: '-0.02em',
              marginBottom: 8,
            }}>
              核心功能
            </h2>
            <p style={{ color: '#71717a', fontSize: 15 }}>专为面试训练设计，全面提升你的表现</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 16,
          }}>
            {[
              { icon: '👥', title: '多角色协同', desc: 'AI面试官、求职者、观察员实时互动', color: '#fbbf24' },
              { icon: '💬', title: '实时互动', desc: '模拟真实群面场景，支持多人讨论', color: '#22c55e' },
              { icon: '📊', title: '即时反馈', desc: '面试结束立即获得详细评估报告', color: '#3b82f6' },
              { icon: '⚡', title: '高效便捷', desc: '随时随地开启练习，无需预约', color: '#a855f7' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-card"
                style={{
                  borderRadius: 16,
                  padding: 24,
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = `${feature.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: `${feature.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  fontSize: 24,
                  border: `1px solid ${feature.color}30`,
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: 15,
                  fontWeight: 600,
                  marginBottom: 6,
                  fontFamily: 'Space Grotesk, sans-serif',
                  color: '#fafafa',
                }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Agent Module */}
        <section style={{
          padding: '32px 40px 64px',
          maxWidth: 1100,
          margin: '0 auto',
        }}>
          <h2 style={{
            fontSize: 22,
            fontWeight: 700,
            fontFamily: 'Space Grotesk, sans-serif',
            letterSpacing: '-0.02em',
            marginBottom: 20,
          }}>
            我的 Agent
          </h2>

          {/* Agent Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {[
              { key: 'candidate', label: '求职者', icon: '👤', count: agents.filter(a => a.type === 'candidate').length },
              { key: 'interviewer', label: '面试官', icon: '🎯', count: agents.filter(a => a.type === 'interviewer').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setAgentTab(tab.key as any)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 9,
                  border: 'none',
                  background: agentTab === tab.key
                    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: agentTab === tab.key ? '#09090b' : '#a1a1aa',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {tab.icon} {tab.label} ({tab.count})
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button
              onClick={() => { setEditingAgent(undefined); setShowAgentModal(true); }}
              style={{
                padding: '9px 18px',
                borderRadius: 9,
                border: 'none',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#09090b',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              + 创建 Agent
            </button>
          </div>

          {/* Agent List */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: 14,
          }}>
            {agents
              .filter(a => a.type === agentTab)
              .map(agent => (
                <div key={agent.id} className="glass-card" style={{
                  borderRadius: 14,
                  padding: 18,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: agent.type === 'candidate'
                        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}>
                      {agent.type === 'candidate' ? '👤' : '🎯'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fafafa' }}>{agent.name}</div>
                      <div style={{ fontSize: 10, color: '#71717a' }}>
                        {agent.type === 'candidate' ? '求职者' : '面试官'}
                      </div>
                    </div>
                  </div>

                  {agent.type === 'candidate' ? (
                    <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 10, lineHeight: 1.6 }}>
                      {agent.skills && <div style={{ marginBottom: 3 }}>技能: {agent.skills}</div>}
                      {agent.experience && <div>经历: {agent.experience}</div>}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 10, lineHeight: 1.6 }}>
                      {agent.company && <div style={{ marginBottom: 3 }}>公司: {agent.company}</div>}
                      {agent.style && <div>风格: {agent.style}</div>}
                    </div>
                  )}

                  <div style={{ fontSize: 10, color: '#71717a', marginBottom: 14 }}>
                    创建于 {new Date(agent.created_at).toLocaleDateString('zh-CN')}
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => { setEditingAgent(agent); setShowAgentModal(true); }}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: 7,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'transparent',
                        color: '#a1a1aa',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('确定删除这个 Agent 吗？')) {
                          try {
                            await api.deleteAgent(agent.id);
                            setAgents(agents.filter(a => a.id !== agent.id));
                          } catch (err) {
                            alert('删除失败');
                          }
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: 7,
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}

            {agents.filter(a => a.type === agentTab).length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: 50,
                color: '#71717a',
                gridColumn: '1 / -1',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 14,
                border: '1px dashed rgba(255, 255, 255, 0.1)',
              }}>
                暂无 {agentTab === 'candidate' ? '求职者' : '面试官'} Agent
              </div>
            )}
          </div>
        </section>

        {/* History Section */}
        {history.length > 0 && (
          <section style={{
            padding: '32px 40px 64px',
            maxWidth: 1100,
            margin: '0 auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'Space Grotesk, sans-serif',
                letterSpacing: '-0.02em',
              }}>
                我的面试
              </h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { key: 'active', label: '进行中', count: history.filter(i => i.status === 'in_progress').length },
                  { key: 'completed', label: '已完成', count: history.filter(i => i.status === 'completed').length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setRoomTab(tab.key as any)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 7,
                      border: 'none',
                      background: roomTab === tab.key
                        ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      color: roomTab === tab.key ? '#09090b' : '#a1a1aa',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: 14,
            }}>
              {history
                .filter(interview => roomTab === 'active' ? interview.status === 'in_progress' : interview.status === 'completed')
                .map((interview) => (
                  <div
                    key={interview.id}
                    className="glass-card"
                    style={{
                      borderRadius: 14,
                      padding: 18,
                      border: interview.status === 'in_progress'
                        ? '1px solid rgba(251, 191, 36, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 3 }}>{interview.position}</div>
                        <div style={{ fontSize: 11, color: '#71717a' }}>
                          {interview.type === 'group' ? '👥 群面' : '👤 单面'}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 9,
                        padding: '3px 9px',
                        borderRadius: 10,
                        background: interview.status === 'completed'
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'rgba(251, 191, 36, 0.15)',
                        color: interview.status === 'completed' ? '#22c55e' : '#fbbf24',
                        fontWeight: 500,
                      }}>
                        {interview.status === 'completed' ? '已完成' : '进行中'}
                      </span>
                    </div>

                    {interview.room_code && (
                      <div style={{
                        fontSize: 10,
                        color: '#fbbf24',
                        background: 'rgba(251, 191, 36, 0.1)',
                        padding: '5px 9px',
                        borderRadius: 5,
                        marginBottom: 10,
                        fontFamily: 'monospace',
                      }}>
                        房间码: {interview.room_code}
                      </div>
                    )}

                    <div style={{ fontSize: 10, color: '#71717a', marginBottom: 14 }}>
                      {new Date(interview.created_at).toLocaleString('zh-CN')}
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => navigate(`/interview/${interview.id}`)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: 8,
                          border: 'none',
                          background: interview.status === 'completed'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          color: '#fafafa',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {interview.status === 'completed' ? '查看报告' : '继续面试'}
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('确定删除这个面试记录吗？删除后无法恢复。')) {
                            try {
                              await api.deleteInterview(interview.id);
                              setHistory(history.filter(i => i.id !== interview.id));
                            } catch (err: any) {
                              alert(err.message || '删除失败');
                            }
                          }
                        }}
                        style={{
                          padding: '10px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: 8,
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {history.filter(interview => roomTab === 'active' ? interview.status === 'in_progress' : interview.status === 'completed').length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: 50,
                color: '#71717a',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 14,
                border: '1px dashed rgba(255, 255, 255, 0.1)',
              }}>
                {roomTab === 'active' ? '暂无进行中的面试' : '暂无已完成的面试'}
              </div>
            )}
          </section>
        )}

        {/* Agent Modal */}
        {showAgentModal && (
          <AgentModal
            isOpen={showAgentModal}
            onClose={() => setShowAgentModal(false)}
            initialType={agentTab === 'candidate' ? 'candidate' : 'interviewer'}
            editAgent={editingAgent}
            onSuccess={(agent) => {
              if (editingAgent) {
                setAgents(agents.map(a => a.id === agent.id ? agent : a));
              } else {
                setAgents([agent, ...agents]);
              }
            }}
          />
        )}

        {/* Footer */}
        <footer style={{
          padding: '32px 40px',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          textAlign: 'center',
          color: '#52525b',
          fontSize: 11,
        }}>
          © 2026 A2A 面试 · 智能模拟面试平台
        </footer>
      </div>
    </div>
  );
}
