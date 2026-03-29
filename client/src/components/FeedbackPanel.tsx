import { useState, useEffect } from 'react';
import type { InterviewFeedback } from '../types';

interface Props {
  feedbacks: InterviewFeedback[];
}

export default function FeedbackPanel({ feedbacks }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [newFeedbackId, setNewFeedbackId] = useState<number | null>(null);

  // Auto-expand and highlight the latest feedback
  useEffect(() => {
    if (feedbacks.length > 0) {
      const latestFeedback = feedbacks[feedbacks.length - 1];
      setNewFeedbackId(latestFeedback.id);
      setExpanded(feedbacks.length - 1);
      // Clear highlight after 3 seconds
      const timeoutId = setTimeout(() => setNewFeedbackId(null), 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [feedbacks.length]);

  if (feedbacks.length === 0) {
    return (
      <div style={{
        padding: 20,
        color: '#71717a',
        fontSize: 13,
        textAlign: 'center',
      }}>
        暂无实时反馈
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: 14,
        fontWeight: 600,
        color: '#a1a1aa',
        fontFamily: 'Inter, sans-serif',
      }}>
        实时反馈
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {feedbacks.map((feedback, index) => {
          const isLatest = feedback.id === newFeedbackId;
          return (
            <div
              key={feedback.id}
              style={{
                padding: 14,
                background: isLatest ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.08)',
                border: `1px solid ${isLatest ? 'rgba(251, 191, 36, 0.4)' : 'rgba(251, 191, 36, 0.2)'}`,
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                animation: isLatest ? 'highlight 0.5s ease' : 'none',
              }}
              onClick={() => setExpanded(expanded === index ? null : index)}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: expanded === index ? 8 : 0,
              }}>
                <span style={{
                  fontSize: 12,
                  color: '#fbbf24',
                  fontWeight: 500,
                }}>
                  第{feedback.round}轮反馈 {isLatest && '✨'}
                </span>
                <span style={{ color: '#71717a', fontSize: 12 }}>
                  {expanded === index ? '▲' : '▼'}
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: 13,
                color: '#fafafa',
                lineHeight: 1.5,
              }}>
                {feedback.content}
              </p>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes highlight {
          0% { transform: scale(1.02); box-shadow: 0 0 20px rgba(251, 191, 36, 0.3); }
          100% { transform: scale(1); box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
