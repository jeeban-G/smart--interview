import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
}

function CandidateAvatar() {
  return (
    <div style={{
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: 13,
      fontWeight: 600,
      flexShrink: 0,
      boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)',
    }}>
      求
    </div>
  );
}

function InterviewerAvatar() {
  return (
    <div style={{
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: 13,
      fontWeight: 600,
      flexShrink: 0,
      boxShadow: '0 0 20px rgba(245, 158, 11, 0.35)',
    }}>
      官
    </div>
  );
}

function UserAvatar() {
  return (
    <div style={{
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: 13,
      fontWeight: 600,
      flexShrink: 0,
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.35)',
    }}>
      我
    </div>
  );
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: '20px 0',
      minHeight: '100%',
    }}>
      {messages.map((msg, index) => {
        const isCandidate = msg.sender_type === 'ai_candidate';
        const isInterviewer = msg.sender_type === 'ai_interviewer';

        const getMessageStyle = () => {
          if (isCandidate) {
            return {
              background: '#1e293b',
              color: '#f1f5f9',
              alignSelf: 'flex-start' as const,
              borderRadius: '16px 16px 16px 4px',
              border: '1px solid #334155',
            };
          }
          if (isInterviewer) {
            return {
              background: '#1e293b',
              color: '#f1f5f9',
              alignSelf: 'flex-end' as const,
              borderRadius: '16px 16px 4px 16px',
              border: '1px solid #334155',
            };
          }
          return {
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            alignSelf: 'flex-end' as const,
            borderRadius: '16px 16px 4px 16px',
            border: 'none',
          };
        };

        const messageStyle = getMessageStyle();
        const isLeft = messageStyle.alignSelf === 'flex-start';

        const AvatarComponent = isCandidate ? CandidateAvatar : isInterviewer ? InterviewerAvatar : UserAvatar;

        return (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: isLeft ? 'row' : 'row-reverse',
              alignItems: 'flex-end',
              gap: 10,
              padding: '0 16px',
              animation: 'fadeInUp 0.4s ease',
              animationDelay: `${index * 0.05}s`,
              animationFillMode: 'both',
            }}
          >
            <AvatarComponent />

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isLeft ? 'flex-start' : 'flex-end',
              maxWidth: '70%',
            }}>
              {msg.sender_name && (
                <div style={{
                  fontSize: 11,
                  color: '#64748b',
                  marginBottom: 4,
                  fontWeight: 500,
                }}>
                  {msg.sender_name}
                </div>
              )}

              <div style={{
                padding: '12px 16px',
                background: messageStyle.background,
                color: messageStyle.color,
                borderRadius: messageStyle.borderRadius,
                border: messageStyle.border,
                boxShadow: isLeft
                  ? '-4px 4px 20px rgba(0, 0, 0, 0.2)'
                  : '4px 4px 20px rgba(0, 0, 0, 0.2)',
                position: 'relative',
              }}>
                <div style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  fontSize: 14,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {msg.content}
                </div>

                {/* 时间戳 */}
                <div style={{
                  position: 'absolute',
                  bottom: -18,
                  [isLeft ? 'left' : 'right']: 8,
                  fontSize: 10,
                  color: '#475569',
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
