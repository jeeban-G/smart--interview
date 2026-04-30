import { useNavigate } from 'react-router-dom';
import type { Interview } from '../../types';

interface InterviewHistoryProps {
  history: Interview[];
  roomTab: 'active' | 'completed';
  onTabChange: (tab: 'active' | 'completed') => void;
  onDelete: (interviewId: number) => void;
}

export default function InterviewHistory({
  history,
  roomTab,
  onTabChange,
  onDelete,
}: InterviewHistoryProps) {
  const navigate = useNavigate();

  const filteredHistory = history.filter(interview =>
    roomTab === 'active' ? interview.status === 'in_progress' : interview.status === 'completed'
  );

  return (
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
              onClick={() => onTabChange(tab.key as any)}
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
        {filteredHistory.map((interview) => (
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
                onClick={() => {
                  if (confirm('确定删除这个面试记录吗？删除后无法恢复。')) {
                    onDelete(interview.id);
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

      {filteredHistory.length === 0 && (
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
  );
}
