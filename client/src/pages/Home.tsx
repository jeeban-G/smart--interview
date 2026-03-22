import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
      setAgents(agentData as Agent[]);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleCreate = async () => {
    if (interviewType === 'multi') {
      // 多房间模式
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
        // 跳转到第一个房间，之后可以用房间码进入其他房间
        if (createdRooms.length > 0) {
          navigate(`/interview/${createdRooms[0].id}`);
        }
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // 单面或群面
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

  // Filter positions based on search and category
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

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '16px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 600 }}>A2A 群面</span>
          <span style={{ fontSize: 12, color: '#a0a0a0', marginLeft: 8 }}>AI 模拟面试平台</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            padding: '6px 12px',
            borderRadius: 8,
            background: roomStatus.available ? 'rgba(39,202,64,0.15)' : 'rgba(255,100,100,0.15)',
            border: `1px solid ${roomStatus.available ? '#27ca40' : '#ff6464'}`
          }}>
            <span style={{ fontSize: 12, color: roomStatus.available ? '#27ca40' : '#ff6464' }}>
              {roomStatus.available ? '🟢' : '🔴'} 房间 {roomStatus.active}/{roomStatus.max}
            </span>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 32 }}>
          <span style={{ color: '#fff', cursor: 'pointer' }}>首页</span>
          <span style={{ color: '#a0a0a0', cursor: 'pointer' }}>关于</span>
        </nav>
      </header>

      {/* Hero + Position Selection */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '60px 40px 40px'
      }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
          A2A 群面 | AI 模拟面试平台
        </h1>
        <p style={{ fontSize: 16, color: '#a0a0a0', textAlign: 'center', marginBottom: 32 }}>
          精选大厂岗位，一键开启AI群面，体验真实面试场景
        </p>

        {/* Quick Selection Bar */}
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 16,
          padding: 24
        }}>
          {/* Interview Type */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <button
              onClick={() => setInterviewType('single')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: interviewType === 'single' ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.2)',
                background: interviewType === 'single' ? 'rgba(102,126,234,0.2)' : 'transparent',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              👤 单面
            </button>
            <button
              onClick={() => setInterviewType('group')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: interviewType === 'group' ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.2)',
                background: interviewType === 'group' ? 'rgba(102,126,234,0.2)' : 'transparent',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              👥 群面
            </button>
            <button
              onClick={() => setInterviewType('multi')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: interviewType === 'multi' ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.2)',
                background: interviewType === 'multi' ? 'rgba(102,126,234,0.2)' : 'transparent',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              🏠 多房间
            </button>
          </div>

          {/* Single/Group Mode */}
          {interviewType !== 'multi' && (
            <>
              {/* Search */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '10px 16px',
                marginBottom: 16,
                gap: 10
              }}>
                <span style={{ fontSize: 16, color: '#666' }}>🔍</span>
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
                    color: '#fff',
                    fontSize: 14
                  }}
                />
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {['全部', '前端', '后端', '算法', '产品', '运营'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 16,
                      border: 'none',
                      background: activeFilter === filter
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Position Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
                maxHeight: 280,
                overflowY: 'auto',
                marginBottom: 20
              }}>
                {filteredPositions.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPosition(p)}
                    style={{
                      background: selectedPosition?.id === p.id
                        ? 'rgba(102,126,234,0.2)'
                        : 'rgba(255,255,255,0.03)',
                      border: selectedPosition?.id === p.id
                        ? '2px solid #667eea'
                        : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                      {p.tag && (
                        <span style={{
                          fontSize: 9,
                          padding: '2px 5px',
                          borderRadius: 3,
                          background: p.tag === '急招' ? 'rgba(255,80,80,0.2)' : 'rgba(39,202,64,0.2)',
                          color: p.tag === '急招' ? '#ff5050' : '#27ca40'
                        }}>
                          {p.tag}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>{p.position}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: p.salary ? '#667eea' : '#888' }}>{p.salary || ''}</span>
                      {p.location && <span style={{ color: '#666' }}>{p.location}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Agent Selection */}
              {selectedPosition && agents.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 14, color: '#a0a0a0', display: 'block', marginBottom: 8 }}>选择参与方</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* 候选人 Agent */}
                    <div>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>👤 求职者 Agent</div>
                      <select
                        value={selectedCandidateAgentId || ''}
                        onChange={(e) => setSelectedCandidateAgentId(e.target.value ? parseInt(e.target.value) : null)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: 8,
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="">不使用</option>
                        {agents.filter(a => a.type === 'candidate').map(a => (
                          <option key={a.id} value={a.id}>👤 {a.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* 面试官 Agent */}
                    <div>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>🎯 面试官 Agent</div>
                      <select
                        value={selectedInterviewerAgentId || ''}
                        onChange={(e) => setSelectedInterviewerAgentId(e.target.value ? parseInt(e.target.value) : null)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: 8,
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          boxSizing: 'border-box'
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
                    <div style={{ fontSize: 12, color: '#27ca40', marginTop: 8, textAlign: 'center' }}>
                      🤖 两个 Agent 将自动对话
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
                  padding: '14px',
                  borderRadius: 10,
                  border: 'none',
                  background: selectedPosition && !loading
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255,255,255,0.1)',
                  color: selectedPosition ? '#fff' : '#666',
                  cursor: selectedPosition && !loading ? 'pointer' : 'not-allowed',
                  fontSize: 15,
                  fontWeight: 500
                }}
              >
                {loading ? '创建中...' : selectedPosition ? `开始 ${interviewType === 'group' ? '群面' : '单面'}` : '请选择岗位'}
              </button>
            </>
          )}

          {/* Multi-Room Mode */}
          {interviewType === 'multi' && (
            <>
              {/* Room Count Selector */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ fontSize: 14, color: '#a0a0a0' }}>选择房间数量</label>
                  <span style={{ fontSize: 24, fontWeight: 600, color: '#667eea' }}>{multiRoomCount}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.min(10 - roomStatus.active, 10)}
                  value={multiRoomCount}
                  onChange={(e) => setMultiRoomCount(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#667eea'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginTop: 4 }}>
                  <span>1</span>
                  <span>可用: {10 - roomStatus.active} 房间</span>
                  <span>10</span>
                </div>
              </div>

              {/* Position Selectors for Each Room */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, color: '#a0a0a0', marginBottom: 12, display: 'block' }}>
                  为每个房间选择岗位
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(multiRoomCount, 3)}, 1fr)`,
                  gap: 12,
                  maxHeight: 250,
                  overflowY: 'auto'
                }}>
                  {Array.from({ length: multiRoomCount }).map((_, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      padding: 12
                    }}>
                      <div style={{ fontSize: 12, color: '#667eea', marginBottom: 8 }}>房间 {idx + 1}</div>
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
                          padding: '8px',
                          borderRadius: 6,
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: '#0a0a0f',
                          color: '#fff',
                          fontSize: 12
                        }}
                      >
                        <option value="">选择岗位...</option>
                        {filteredPositions.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} - {p.position}</option>
                        ))}
                      </select>
                      {multiRoomPositions[idx]?.salary && (
                        <div style={{ fontSize: 10, color: '#667eea', marginTop: 4 }}>
                          {multiRoomPositions[idx].salary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div style={{
                background: 'rgba(102,126,234,0.1)',
                borderRadius: 8,
                padding: 12,
                marginBottom: 20
              }}>
                <div style={{ fontSize: 13, color: '#fff', marginBottom: 8 }}>
                  即将创建 {multiRoomCount} 个面试房间
                </div>
                <div style={{ fontSize: 12, color: '#a0a0a0' }}>
                  {multiRoomPositions.length} 个房间已选择岗位
                  {multiRoomPositions.length > 0 && ` (${multiRoomPositions.map(p => p.name).join(', ')})`}
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleCreate}
                disabled={multiRoomPositions.length !== multiRoomCount || loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 10,
                  border: 'none',
                  background: multiRoomPositions.length === multiRoomCount && !loading
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255,255,255,0.1)',
                  color: multiRoomPositions.length === multiRoomCount ? '#fff' : '#666',
                  cursor: multiRoomPositions.length === multiRoomCount && !loading ? 'pointer' : 'not-allowed',
                  fontSize: 15,
                  fontWeight: 500
                }}
              >
                {loading ? '创建中...' : multiRoomPositions.length === multiRoomCount ? `开始 ${multiRoomCount} 个面试` : `请为所有房间选择岗位 (${multiRoomPositions.length}/${multiRoomCount})`}
              </button>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section style={{ background: '#0a0a0f', padding: '60px 40px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 600, textAlign: 'center', marginBottom: 32 }}>核心功能</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
          {[
            { icon: '👥', title: '多角色协同', desc: 'AI面试官、求职者、观察员实时互动' },
            { icon: '💬', title: '实时互动', desc: '模拟真实群面场景，支持多人讨论' },
            { icon: '📊', title: '即时反馈', desc: '面试结束立即获得详细评估报告' },
            { icon: '⚡', title: '高效便捷', desc: '随时随地开启练习，无需预约' }
          ].map((feature) => (
            <div key={feature.title} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 20,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{feature.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{feature.title}</h3>
              <p style={{ fontSize: 12, color: '#888' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agent Module */}
      <section style={{ background: '#0a0a0f', padding: '40px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>我的 Agent</h2>

        {/* Agent Type Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setAgentTab('candidate')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: agentTab === 'candidate'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(255,255,255,0.05)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            👤 求职者 Agent ({agents.filter(a => a.type === 'candidate').length})
          </button>
          <button
            onClick={() => setAgentTab('interviewer')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: agentTab === 'interviewer'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(255,255,255,0.05)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            🎯 面试官 Agent ({agents.filter(a => a.type === 'interviewer').length})
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => { setEditingAgent(undefined); setShowAgentModal(true); }}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            + 创建 Agent
          </button>
        </div>

        {/* Agent List */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16
        }}>
          {agents
            .filter(a => a.type === agentTab)
            .map(agent => (
              <div key={agent.id} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>{agent.type === 'candidate' ? '👤' : '🎯'}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{agent.name}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>
                      {agent.type === 'candidate' ? '求职者' : '面试官'}
                    </div>
                  </div>
                </div>

                {agent.type === 'candidate' ? (
                  <div style={{ fontSize: 12, color: '#a0a0a0', marginBottom: 8 }}>
                    {agent.skills && <div>技能: {agent.skills}</div>}
                    {agent.experience && <div>经历: {agent.experience}</div>}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#a0a0a0', marginBottom: 8 }}>
                    {agent.company && <div>公司: {agent.company}</div>}
                    {agent.style && <div>风格: {agent.style}</div>}
                  </div>
                )}

                <div style={{ fontSize: 11, color: '#666', marginBottom: 12 }}>
                  创建于 {new Date(agent.created_at).toLocaleDateString('zh-CN')}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setEditingAgent(agent); setShowAgentModal(true); }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 12
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
                      padding: '8px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,100,100,0.3)',
                      background: 'transparent',
                      color: '#ff6464',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}

          {agents.filter(a => a.type === agentTab).length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#666', gridColumn: '1/-1' }}>
              暂无 {agentTab === 'candidate' ? '求职者' : '面试官'} Agent
            </div>
          )}
        </div>
      </section>

      {/* History with Tabs */}
      {history.length > 0 && (
        <section style={{ background: '#0a0a0f', padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>我的面试</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setRoomTab('active')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: roomTab === 'active'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                进行中 ({history.filter(i => i.status === 'in_progress').length})
              </button>
              <button
                onClick={() => setRoomTab('completed')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: roomTab === 'completed'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                已完成 ({history.filter(i => i.status === 'completed').length})
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16
          }}>
            {history
              .filter(interview => roomTab === 'active' ? interview.status === 'in_progress' : interview.status === 'completed')
              .map((interview) => (
                <div key={interview.id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: interview.status === 'in_progress'
                    ? '1px solid rgba(102,126,234,0.3)'
                    : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{interview.position}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        {interview.type === 'group' ? '👥 群面' : '👤 单面'}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10,
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: interview.status === 'completed'
                        ? 'rgba(39,202,64,0.15)'
                        : 'rgba(255,189,46,0.15)',
                      color: interview.status === 'completed' ? '#27ca40' : '#ffbd2e'
                    }}>
                      {interview.status === 'completed' ? '已完成' : '进行中'}
                    </span>
                  </div>
                  {interview.room_code && (
                    <div style={{
                      fontSize: 11,
                      color: '#667eea',
                      background: 'rgba(102,126,234,0.1)',
                      padding: '4px 8px',
                      borderRadius: 4,
                      marginBottom: 12,
                      fontFamily: 'monospace'
                    }}>
                      房间码: {interview.room_code}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 12 }}>
                    {new Date(interview.created_at).toLocaleString('zh-CN')}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => navigate(`/interview/${interview.id}`)}
                      style={{
                        flex: 1,
                        background: interview.status === 'completed'
                          ? 'rgba(255,255,255,0.08)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        padding: '10px',
                        borderRadius: 6,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 13
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
                        padding: '10px 12px',
                        background: 'rgba(255,100,100,0.15)',
                        border: '1px solid rgba(255,100,100,0.3)',
                        borderRadius: 6,
                        color: '#ff6464',
                        cursor: 'pointer',
                        fontSize: 13
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {history.filter(interview => roomTab === 'active' ? interview.status === 'in_progress' : interview.status === 'completed').length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
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
        background: '#0a0a0f',
        padding: '30px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        textAlign: 'center',
        color: '#555',
        fontSize: 12
      }}>
        © 2026 A2A 群面
      </footer>
    </div>
  );
}
