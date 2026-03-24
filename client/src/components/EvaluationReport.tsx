import type { Evaluation, EnhancedEvaluation } from '../types';
import RadarChart from './RadarChart';
import ScoreBar from './ScoreBar';

interface EvaluationReportProps {
  evaluation: Evaluation | null;
}

const isEnhanced = (e: Evaluation | null): e is EnhancedEvaluation => {
  return e !== null && 'overall_score' in e;
};

export default function EvaluationReport({ evaluation }: EvaluationReportProps) {
  if (!evaluation) {
    return (
      <div style={{
        padding: 60,
        textAlign: 'center',
      }}>
        <div style={{
          width: 64,
          height: 64,
          margin: '0 auto 20px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
        </div>
        <p style={{
          color: '#71717a',
          fontSize: 14,
          margin: 0,
          fontFamily: 'Inter, sans-serif',
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
      title: '亮点时刻',
      content: evaluation.highlights?.map((h, i) =>
        `Q${i + 1}: ${h.question}\n   ${h.answer}`
      ).join('\n\n') || '暂无亮点记录',
      color: '#fbbf24',
      bgColor: 'rgba(251, 191, 36, 0.08)',
      borderColor: 'rgba(251, 191, 36, 0.2)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      title: '优点',
      content: evaluation.pros,
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.08)',
      borderColor: 'rgba(34, 197, 94, 0.2)',
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
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ padding: 28 }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 28,
        paddingBottom: 20,
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(251, 191, 36, 0.3)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </svg>
        </div>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'Space Grotesk, sans-serif',
            color: '#fafafa',
            letterSpacing: '-0.02em',
          }}>
            面试评估报告
          </h2>
          <p style={{
            margin: 0,
            fontSize: 12,
            color: '#71717a',
            fontFamily: 'Inter, sans-serif',
          }}>
            AI 智能分析
          </p>
        </div>
      </div>

      {/* 图表区域 - 仅 EnhancedEvaluation 有 */}
      {isEnhanced(evaluation) && (
        <div style={{
          marginBottom: 24,
          padding: 24,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 20,
          }}>
            {/* Overall score */}
            <div style={{
              textAlign: 'center',
              minWidth: 90,
            }}>
              <div style={{
                fontSize: 40,
                fontWeight: 700,
                fontFamily: 'Space Grotesk, sans-serif',
                color: '#fbbf24',
                lineHeight: 1,
              }}>
                {evaluation.overall_score ?? 0}
              </div>
              <div style={{
                fontSize: 11,
                color: '#71717a',
                fontFamily: 'Inter, sans-serif',
                marginTop: 4,
              }}>
                综合评分
              </div>
            </div>

            {/* Radar chart */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              flex: 1,
            }}>
              <RadarChart scores={evaluation} />
            </div>
          </div>

          {/* Score bars */}
          <div style={{ marginTop: 8 }}>
            <ScoreBar label="技术深度" score={evaluation.technical_depth ?? 0} color="#3b82f6" />
            <ScoreBar label="沟通表达" score={evaluation.communication ?? 0} color="#22c55e" />
            <ScoreBar label="项目经验" score={evaluation.project_experience ?? 0} color="#f59e0b" />
            <ScoreBar label="适应能力" score={evaluation.adaptability ?? 0} color="#a855f7" />
          </div>
        </div>
      )}

      {/* 内容区块 */}
      {sections.map((section, index) => (
        <div
          key={section.title}
          style={{
            marginBottom: 20,
            padding: 20,
            background: section.bgColor,
            borderRadius: 16,
            border: `1px solid ${section.borderColor}`,
            animation: 'fadeInUp 0.4s ease',
            animationDelay: `${index * 0.1}s`,
            animationFillMode: 'both',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
          }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
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
              fontFamily: 'Space Grotesk, sans-serif',
              color: section.color,
            }}>
              {section.title}
            </h3>
          </div>
          <p style={{
            margin: 0,
            padding: 0,
            fontSize: 13,
            lineHeight: 1.8,
            color: '#a1a1aa',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'pre-wrap',
          }}>
            {section.content}
          </p>
        </div>
      ))}

      {/* 底部装饰 */}
      <div style={{
        marginTop: 32,
        paddingTop: 24,
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          background: 'rgba(34, 197, 94, 0.08)',
          borderRadius: 24,
          border: '1px solid rgba(34, 197, 94, 0.2)',
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#22c55e',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{
            fontSize: 13,
            color: '#22c55e',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
          }}>
            分析完成
          </span>
        </div>
      </div>
    </div>
  );
}
