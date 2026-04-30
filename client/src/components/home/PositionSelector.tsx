import type { Position, Agent } from '../../types';

interface PositionSelectorProps {
  positions: Position[];
  filteredPositions: Position[];
  selectedPosition: Position | null;
  searchQuery: string;
  activeFilter: string;
  agents: Agent[];
  selectedCandidateAgentId: number | null;
  selectedInterviewerAgentId: number | null;
  loading: boolean;
  interviewType: 'group' | 'single' | 'multi';
  onSelectPosition: (position: Position) => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  onCandidateAgentChange: (id: number | null) => void;
  onInterviewerAgentChange: (id: number | null) => void;
  onCreate: () => void;
}

export default function PositionSelector({
  filteredPositions,
  selectedPosition,
  searchQuery,
  activeFilter,
  agents,
  selectedCandidateAgentId,
  selectedInterviewerAgentId,
  loading,
  interviewType,
  onSelectPosition,
  onSearchChange,
  onFilterChange,
  onCandidateAgentChange,
  onInterviewerAgentChange,
  onCreate,
}: PositionSelectorProps) {
  return (
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
          onChange={(e) => onSearchChange(e.target.value)}
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
            onClick={() => onFilterChange(filter)}
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
            onClick={() => onSelectPosition(p)}
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
                onChange={(e) => onCandidateAgentChange(e.target.value ? parseInt(e.target.value) : null)}
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
                onChange={(e) => onInterviewerAgentChange(e.target.value ? parseInt(e.target.value) : null)}
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
        onClick={onCreate}
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
  );
}
