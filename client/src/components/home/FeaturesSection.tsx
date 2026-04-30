export default function FeaturesSection() {
  const features = [
    { icon: '👥', title: '多角色协同', desc: 'AI面试官、求职者、观察员实时互动', color: '#fbbf24' },
    { icon: '💬', title: '实时互动', desc: '模拟真实群面场景，支持多人讨论', color: '#22c55e' },
    { icon: '📊', title: '即时反馈', desc: '面试结束立即获得详细评估报告', color: '#3b82f6' },
    { icon: '⚡', title: '高效便捷', desc: '随时随地开启练习，无需预约', color: '#a855f7' },
  ];

  return (
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
        {features.map((feature) => (
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
  );
}
