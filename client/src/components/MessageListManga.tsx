import type { Message } from '../types';
import MangaCharacter, { inferEmotion, emotionEmojis } from './MangaCharacter';

interface MessageListMangaProps {
  messages: Message[];
  typingCharacter?: 'candidate' | 'interviewer' | null;
}

export default function MessageListManga({ messages, typingCharacter }: MessageListMangaProps) {
  const getCharacterType = (type: string): 'interviewer' | 'candidate' | 'user' => {
    if (type === 'ai_interviewer') return 'interviewer';
    if (type === 'ai_candidate') return 'candidate';
    return 'user';
  };

  const getName = (msg: Message) => {
    if (msg.sender_name) return msg.sender_name;
    if (msg.sender_type === 'ai_candidate') return '候选人';
    if (msg.sender_type === 'ai_interviewer') return '面试官';
    return '我';
  };

  const getCurrentEmotion = (msg: Message) => {
    if (typingCharacter) {
      const isThisCharacter = (typingCharacter === 'candidate' && msg.sender_type === 'ai_candidate') ||
        (typingCharacter === 'interviewer' && msg.sender_type === 'ai_interviewer');
      if (isThisCharacter) return 'thinking';
    }
    return inferEmotion(msg.content, msg.sender_type);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: '24px 32px',
      minHeight: '100%',
      background: '#fafafa',
    }}>
      {messages.map((msg) => {
        const isLeft = msg.sender_type === 'ai_candidate';
        const isUser = msg.sender_type === 'user';
        const charType = getCharacterType(msg.sender_type);
        const emotion = getCurrentEmotion(msg);
        const name = getName(msg);

        // 气泡颜色
        const bubbleColor = isUser ? '#6bcbff' : isLeft ? '#e8f5e9' : '#e3f2fd';
        const textColor = '#1a1a2e';

        return (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: isLeft ? 'row' : 'row-reverse',
              alignItems: 'flex-end',
              gap: 12,
              animation: 'fadeInUp 0.3s ease',
            }}
          >
            {/* 头像 + 名字 + 情绪 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
            }}>
              <div style={{ position: 'relative' }}>
                <MangaCharacter
                  type={charType}
                  emotion={emotion}
                  size={40}
                />
                {/* 情绪 emoji */}
                <span style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -6,
                  fontSize: 14,
                  lineHeight: 1,
                }}>
                  {emotionEmojis[emotion]}
                </span>
              </div>
              <span style={{
                fontSize: 11,
                color: '#666',
                fontWeight: 500,
              }}>
                {name}
              </span>
            </div>

            {/* 消息气泡 */}
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              background: bubbleColor,
              borderRadius: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              <p style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.5,
                color: textColor,
              }}>
                {msg.content}
              </p>
              <span style={{
                display: 'block',
                marginTop: 4,
                fontSize: 10,
                color: '#999',
                textAlign: isLeft ? 'left' : 'right',
              }}>
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
