import type { Evaluation } from '../types';

interface EvaluationReportProps {
  evaluation: Evaluation | null;
}

export default function EvaluationReport({ evaluation }: EvaluationReportProps) {
  if (!evaluation) {
    return (
      <div style={{
        padding: 40,
        textAlign: 'center',
      }}>
        <div style={{
          width: 48,
          height: 48,
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
        </div>
        <p style={{
          color: '#64748b',
          fontSize: 14,
          margin: 0,
          fontFamily: 'DM Sans, sans-serif',
        }}>
          面试结束后将显示评估报告
        </p>
      </div>
    );
  }

  const sections = [
    {
      title: '总体评价',
      content: evaluation.summary,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.08)',
      borderColor: 'rgba(59, 130, 246, 0.2)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      ),
    },
    {
      title: '优点',
      content: evaluation.pros,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.08)',
      borderColor: 'rgba(16, 185, 129, 0.2)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
      ),
    },
    {
      title: '不足之处',
      content: evaluation.cons,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.08)',
      borderColor: 'rgba(239, 68, 68, 0.2)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      title: '改进建议',
      content: evaluation.suggestions,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.2)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 28,
        paddingBottom: 20,
        borderBottom: '1px solid #1e293b',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </svg>
        </div>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            fontFamily: 'Outfit, sans-serif',
            color: '#f1f5f9',
            letterSpacing: '-0.02em',
          }}>
            面试评估报告
          </h2>
          <p style={{
            margin: 0,
            fontSize: 12,
            color: '#64748b',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            AI 智能分析
          </p>
        </div>
      </div>

      {/* 内容区块 */}
      {sections.map((section, index) => (
        <div
          key={section.title}
          style={{
            marginBottom: 24,
            padding: 20,
            background: section.bgColor,
            borderRadius: 12,
            border: `1px solid ${section.borderColor}`,
            animation: 'fadeInUp 0.4s ease',
            animationDelay: `${index * 0.1}s`,
            animationFillMode: 'both',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: section.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}>
              {section.icon}
            </div>
            <h3 style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              color: section.color,
            }}>
              {section.title}
            </h3>
          </div>
          <p style={{
            margin: 0,
            padding: 0,
            fontSize: 13,
            lineHeight: 1.7,
            color: '#94a3b8',
            fontFamily: 'DM Sans, sans-serif',
            whiteSpace: 'pre-wrap',
          }}>
            {section.content}
          </p>
        </div>
      ))}

      {/* 底部装饰 */}
      <div style={{
        marginTop: 32,
        paddingTop: 20,
        borderTop: '1px solid #1e293b',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          background: 'rgba(16, 185, 129, 0.08)',
          borderRadius: 20,
          border: '1px solid rgba(16, 185, 129, 0.2)',
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#10b981',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{
            fontSize: 12,
            color: '#10b981',
            fontWeight: 500,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            分析完成
          </span>
        </div>
      </div>
    </div>
  );
}
