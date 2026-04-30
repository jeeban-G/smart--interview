import type { Agent } from '../../types';

interface AgentListProps {
  agents: Agent[];
  agentTab: 'candidate' | 'interviewer';
  onTabChange: (tab: 'candidate' | 'interviewer') => void;
  onCreateAgent: () => void;
  onEditAgent: (agent: Agent) => void;
  onDeleteAgent: (agentId: number) => void;
}

export default function AgentList({
  agents,
  agentTab,
  onTabChange,
  onCreateAgent,
  onEditAgent,
  onDeleteAgent,
}: AgentListProps) {
  return (
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
            onClick={() => onTabChange(tab.key as any)}
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
          onClick={onCreateAgent}
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
                  onClick={() => onEditAgent(agent)}
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
                  onClick={() => {
                    if (confirm('确定删除这个 Agent 吗？')) {
                      onDeleteAgent(agent.id);
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
  );
}
