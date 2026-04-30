interface HeaderProps {
  roomStatus: {
    active: number;
    max: number;
    available: boolean;
    userActive?: number;
  };
  userName: string;
  onLogout: () => void;
}

export default function Header({ roomStatus, userName, onLogout }: HeaderProps) {
  return (
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
            ● 我的房间 {roomStatus.userActive}/{roomStatus.max}
          </span>
        </div>

        {/* User info and logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#a1a1aa' }}>
            {userName}
          </span>
          <button
            onClick={onLogout}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#71717a',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#71717a';
            }}
          >
            退出
          </button>
        </div>
      </div>
    </header>
  );
}
