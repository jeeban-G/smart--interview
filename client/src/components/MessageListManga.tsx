import type { Message } from '../types';
import MangaCharacter from './MangaCharacter';

interface MessageListMangaProps {
  messages: Message[];
  typingCharacter?: 'candidate' | 'interviewer' | null;
}

function MangaAvatar({ type, name, isTyping }: { type: string; name: string; isTyping?: boolean }) {
  const getCharacterType = (): 'interviewer' | 'candidate' | 'user' => {
    if (type === 'ai_interviewer') return 'interviewer';
    if (type === 'ai_candidate') return 'candidate';
    return 'user';
  };

  return (
    <div style={{
      position: 'relative',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* 3D 角色 */}
      <MangaCharacter
        type={getCharacterType()}
        isTyping={isTyping}
      />
      {/* 角色名字标签 */}
      <div style={{
        marginTop: 4,
        background: '#1a1a2e',
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        padding: '3px 8px',
        borderRadius: 6,
        whiteSpace: 'nowrap',
        fontFamily: '"M PLUS Rounded 1c", sans-serif',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        {name}
      </div>
    </div>
  );
}

function SpeechBubble({ content, type, timestamp }: { content: string; type: string; timestamp: string }) {
  const isLeft = type === 'ai_candidate';
  const isUser = type === 'user';

  // 气泡颜色
  const bubbleColor = isUser ? '#6bcbff' : '#fff';
  const textColor = isUser ? '#000' : '#1a1a2e';
  const borderColor = isUser ? '#4fa8e0' : '#e0e0e0';

  // 漫画效果文字（感叹号、问号等）
  const hasExclamation = content.includes('!') || content.includes('！');
  const hasQuestion = content.includes('?') || content.includes('？');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isLeft ? 'flex-start' : 'flex-end',
      maxWidth: '75%',
    }}>
      {/* 气泡主体 */}
      <div style={{
        position: 'relative',
        padding: '16px 20px',
        background: bubbleColor,
        border: `2px solid ${borderColor}`,
        borderRadius: isLeft ? '24px 24px 24px 4px' : '24px 24px 4px 24px',
        boxShadow: '4px 4px 0 rgba(0,0,0,0.15)',
        transform: isLeft ? 'translateX(-4px)' : 'translateX(4px)',
      }}>
        {/* 漫画效果线 */}
        {(hasExclamation || hasQuestion) && (
          <div style={{
            position: 'absolute',
            top: -12,
            [isLeft ? 'right' : 'left']: -8,
            fontSize: 20,
            fontWeight: 'bold',
            color: hasExclamation ? '#ff4757' : '#3742fa',
            textShadow: '1px 1px 0 #000',
            transform: isLeft ? 'rotate(-15deg)' : 'rotate(15deg)',
          }}>
            {hasExclamation ? '!' : '?'}
          </div>
        )}

        {/* 内容 */}
        <p style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.6,
          color: textColor,
          fontFamily: '"M PLUS Rounded 1c", "Noto Sans SC", sans-serif',
          fontWeight: 500,
        }}>
          {content}
        </p>

        {/* 气泡尾巴 */}
        <div style={{
          position: 'absolute',
          bottom: 8,
          [isLeft ? 'left' : 'right']: -12,
          width: 0,
          height: 0,
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          [isLeft ? 'borderRight' : 'borderLeft']: `12px solid ${borderColor}`,
        }} />
        <div style={{
          position: 'absolute',
          bottom: 10,
          [isLeft ? 'left' : 'right']: -8,
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          [isLeft ? 'borderRight' : 'borderLeft']: `10px solid ${bubbleColor}`,
        }} />
      </div>

      {/* 时间戳 */}
      <span style={{
        marginTop: 8,
        marginLeft: isLeft ? 4 : 0,
        marginRight: isLeft ? 0 : 4,
        fontSize: 10,
        color: '#666',
        fontFamily: 'sans-serif',
      }}>
        {new Date(timestamp).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </span>
    </div>
  );
}

// 装饰元素：漫画速度线
function SpeedLines({ side }: { side: 'left' | 'right' }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      [side]: 0,
      bottom: 0,
      width: 40,
      overflow: 'hidden',
      opacity: 0.3,
      pointerEvents: 'none',
    }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          [side]: 0,
          top: `${20 + i * 18}%`,
          height: 2,
          width: `${25 - i * 4}px`,
          background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, transparent, #333)`,
        }} />
      ))}
    </div>
  );
}

export default function MessageListManga({ messages, typingCharacter }: MessageListMangaProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      padding: '32px 20px',
      minHeight: '100%',
      position: 'relative',
      background: 'linear-gradient(180deg, #fefefe 0%, #f5f5f5 100%)',
    }}>
      {/* 装饰边框 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: 'linear-gradient(to right, #ff6b6b, #ffd93d, #6bcbff, #b8f5a2)',
      }} />

      {messages.map((msg, index) => {
        const isCandidate = msg.sender_type === 'ai_candidate';
        const isInterviewer = msg.sender_type === 'ai_interviewer';
        const isLeft = isCandidate;

        return (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: isLeft ? 'row' : 'row-reverse',
              alignItems: 'flex-end',
              gap: 12,
              position: 'relative',
              animation: 'fadeInUp 0.4s ease',
              animationDelay: `${Math.min(index * 0.05, 0.3)}s`,
              animationFillMode: 'both',
            }}
          >
            {/* 速度线装饰 */}
            <SpeedLines side={isLeft ? 'left' : 'right'} />

            {/* 头像 */}
            <MangaAvatar
              type={msg.sender_type}
              name={msg.sender_name || (isCandidate ? '求职者' : isInterviewer ? '面试官' : '我')}
              isTyping={typingCharacter !== null && (
                (typingCharacter === 'candidate' && isCandidate) ||
                (typingCharacter === 'interviewer' && isInterviewer)
              )}
            />

            {/* 对话气泡 */}
            <SpeechBubble
              content={msg.content}
              type={msg.sender_type}
              timestamp={msg.timestamp}
            />
          </div>
        );
      })}

      {/* 底部装饰 */}
      <div style={{
        marginTop: 'auto',
        paddingTop: 20,
        borderTop: '2px dashed #ddd',
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        fontFamily: 'sans-serif',
      }}>
        ▼ 待续...
      </div>
    </div>
  );
}
