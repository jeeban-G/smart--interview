import type { Position } from '../../types';

interface MultiRoomSelectorProps {
  positions: Position[];
  filteredPositions: Position[];
  multiRoomCount: number;
  multiRoomPositions: Position[];
  roomStatus: {
    userActive?: number;
  };
  loading: boolean;
  onRoomCountChange: (count: number) => void;
  onPositionChange: (index: number, position: Position) => void;
  onCreate: () => void;
}

export default function MultiRoomSelector({
  filteredPositions,
  multiRoomCount,
  multiRoomPositions,
  roomStatus,
  loading,
  onRoomCountChange,
  onPositionChange,
  onCreate,
}: MultiRoomSelectorProps) {
  return (
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
          max={Math.min(10 - (roomStatus.userActive || 0), 10)}
          value={multiRoomCount}
          onChange={(e) => onRoomCountChange(parseInt(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#fbbf24',
            height: 5,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#71717a', marginTop: 6 }}>
          <span>1</span>
          <span>可用: {10 - (roomStatus.userActive || 0)} 房间</span>
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
                  const pos = filteredPositions.find(p => p.id === e.target.value);
                  if (pos) {
                    onPositionChange(idx, pos);
                  }
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
        onClick={onCreate}
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
  );
}
