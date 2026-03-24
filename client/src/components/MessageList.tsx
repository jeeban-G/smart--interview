import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
}

function CandidateAvatar() {
  return (
    <div style={{
      width: 38,
      height: 38,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: 13,
      fontWeight: 600,
      flexShrink: 0,
      boxShadow: '0 0 24px rgba(34, 197, 94, 0.4)',
    }}>
      求
    </div>
  );
}

function InterviewerAvatar() {
  return (
    <div style={{
      width: 38,
      height: 38,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: 13,
      fontWeight: 600,
      flexShrink: 0,
      boxShadow: '0 0 24px rgba(251, 191, 36, 0.4)',
    }}>
      官
    </div>
  );
}

function UserAvatar() {
  return (
    <div style={{
      width: 38,
      height: 38,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: 13,
      fontWeight: 600,
      flexShrink: 0,
      boxShadow: '0 0 24px rgba(59, 130, 246, 0.4)',
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
      gap: 20,
      padding: '28px 0',
      minHeight: '100%',
    }}>
      {messages.map((msg, index) => {
        const isCandidate = msg.sender_type === 'ai_candidate';
        const isInterviewer = msg.sender_type === 'ai_interviewer';

        const getMessageStyle = () => {
          if (isCandidate) {
            return {
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fafafa',
              alignSelf: 'flex-start' as const,
              borderRadius: '20px 20px 20px 6px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            };
          }
          if (isInterviewer) {
            return {
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fafafa',
              alignSelf: 'flex-end' as const,
              borderRadius: '20px 20px 6px 20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            };
          }
          return {
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            alignSelf: 'flex-end' as const,
            borderRadius: '20px 20px 6px 20px',
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
              gap: 12,
              padding: '0 20px',
              animation: 'fadeInUp 0.4s ease',
              animationDelay: `${index * 0.03}s`,
              animationFillMode: 'both',
            }}
          >
            <AvatarComponent />

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isLeft ? 'flex-start' : 'flex-end',
              maxWidth: '68%',
            }}>
              {msg.sender_name && (
                <div style={{
                  fontSize: 11,
                  color: '#71717a',
                  marginBottom: 6,
                  fontWeight: 500,
                  paddingLeft: isLeft ? 4 : 0,
                  paddingRight: isLeft ? 0 : 4,
                }}>
                  {msg.sender_name}
                </div>
              )}

              <div style={{
                padding: '14px 18px',
                background: messageStyle.background,
                color: messageStyle.color,
                borderRadius: messageStyle.borderRadius,
                border: messageStyle.border,
                boxShadow: isLeft
                  ? '-6px 6px 24px rgba(0, 0, 0, 0.25)'
                  : '6px 6px 24px rgba(0, 0, 0, 0.25)',
                position: 'relative',
              }}>
                <div style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.7,
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {msg.content}
                </div>

                {/* 时间戳 */}
                <div style={{
                  position: 'absolute',
                  bottom: -20,
                  [isLeft ? 'left' : 'right']: 8,
                  fontSize: 10,
                  color: '#52525b',
                  fontFamily: 'Inter, sans-serif',
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
