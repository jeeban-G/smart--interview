import { Link } from 'react-router-dom';

interface HeroSectionProps {
  interviewType: 'group' | 'single' | 'multi';
  onTypeChange: (type: 'group' | 'single' | 'multi') => void;
}

export default function HeroSection({ interviewType, onTypeChange }: HeroSectionProps) {
  return (
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
            onClick={() => onTypeChange(type.key as any)}
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
  );
}
