import { useEffect, useRef } from 'react';

type Emotion = 'neutral' | 'happy' | 'thinking' | 'surprised' | 'sad' | 'confused';

interface MangaCharacterProps {
  type: 'interviewer' | 'candidate' | 'user';
  emotion?: Emotion;
  size?: number;
}

// 漫画风格小头像组件
function MangaAvatar({ type, emotion = 'neutral', size = 40 }: { type: 'interviewer' | 'candidate' | 'user'; emotion?: Emotion; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 绘制漫画人物
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    // 清空画布
    ctx.clearRect(0, 0, size, size);

    // 颜色配置
    const colors = {
      interviewer: { bg: '#667eea', skin: '#ffe4c4', hair: '#2c2c2c' },
      candidate: { bg: '#22c55e', skin: '#ffe4c4', hair: '#4a3728' },
      user: { bg: '#6bcbff', skin: '#ffe4c4', hair: '#8b5cf6' },
    };
    const c = colors[type];

    // 背景圆
    ctx.fillStyle = c.bg;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // 头部比例
    const headSize = size * 0.5;
    const headX = size / 2;
    const headY = size / 2 - 2;

    // 头发
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    ctx.arc(headX, headY - headSize * 0.1, headSize * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // 脸部
    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.arc(headX, headY + headSize * 0.1, headSize * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    const eyeY = headY + headSize * 0.05;
    const eyeSpacing = headSize * 0.2;
    ctx.fillStyle = '#1a1a2e';

    if (emotion === 'surprised') {
      // 惊讶 - 大眼睛
      ctx.beginPath();
      ctx.arc(headX - eyeSpacing, eyeY, headSize * 0.1, 0, Math.PI * 2);
      ctx.arc(headX + eyeSpacing, eyeY, headSize * 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (emotion === 'sad') {
      // 难过 - 下垂眼睛
      ctx.beginPath();
      ctx.ellipse(headX - eyeSpacing, eyeY, headSize * 0.06, headSize * 0.08, 0, 0, Math.PI * 2);
      ctx.ellipse(headX + eyeSpacing, eyeY, headSize * 0.06, headSize * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (emotion === 'confused') {
      // 困惑 - 一只大一只小
      ctx.beginPath();
      ctx.arc(headX - eyeSpacing, eyeY, headSize * 0.08, 0, Math.PI * 2);
      ctx.arc(headX + eyeSpacing, eyeY, headSize * 0.05, 0, Math.PI * 2);
      ctx.fill();
    } else if (emotion === 'thinking') {
      // 思考 - 半闭眼
      ctx.beginPath();
      ctx.ellipse(headX - eyeSpacing, eyeY, headSize * 0.06, headSize * 0.04, 0, 0, Math.PI * 2);
      ctx.ellipse(headX + eyeSpacing, eyeY, headSize * 0.06, headSize * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 普通/开心 - 正常眼睛
      ctx.beginPath();
      ctx.arc(headX - eyeSpacing, eyeY, headSize * 0.06, 0, Math.PI * 2);
      ctx.arc(headX + eyeSpacing, eyeY, headSize * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }

    // 嘴巴
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();

    if (emotion === 'happy') {
      ctx.arc(headX, headY + headSize * 0.15, headSize * 0.12, 0.1 * Math.PI, 0.9 * Math.PI);
    } else if (emotion === 'surprised') {
      ctx.arc(headX, headY + headSize * 0.2, headSize * 0.08, 0, Math.PI * 2);
    } else if (emotion === 'sad') {
      ctx.arc(headX, headY + headSize * 0.28, headSize * 0.1, 1.1 * Math.PI, 1.9 * Math.PI);
    } else if (emotion === 'confused') {
      ctx.moveTo(headX - headSize * 0.08, headY + headSize * 0.2);
      ctx.lineTo(headX + headSize * 0.08, headY + headSize * 0.18);
    } else {
      ctx.arc(headX, headY + headSize * 0.15, headSize * 0.08, 0.2 * Math.PI, 0.8 * Math.PI);
    }
    ctx.stroke();

  }, [type, emotion, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
      }}
    />
  );
}

export default function MangaCharacter({ type, emotion = 'neutral', size = 40 }: MangaCharacterProps) {
  return (
    <MangaAvatar type={type} emotion={emotion} size={size} />
  );
}

// 情绪 Emoji 映射
export const emotionEmojis: Record<Emotion, string> = {
  neutral: '😐',
  happy: '😊',
  thinking: '🤔',
  surprised: '😮',
  sad: '😟',
  confused: '🤨',
};

// 根据消息内容推断情绪
export function inferEmotion(content: string, senderType: string): Emotion {
  const lowerContent = content.toLowerCase();

  if (senderType === 'ai_interviewer') {
    if (lowerContent.includes('不错') || lowerContent.includes('很好') || lowerContent.includes('满意')) {
      return 'happy';
    }
    if (lowerContent.includes('?') || lowerContent.includes('？') || lowerContent.includes('怎么')) {
      return 'thinking';
    }
    if (lowerContent.includes('不对') || lowerContent.includes('不是')) {
      return 'confused';
    }
  }

  if (senderType === 'ai_candidate') {
    if (lowerContent.includes('谢谢') || lowerContent.includes('好的') || lowerContent.includes('明白')) {
      return 'happy';
    }
    if (lowerContent.includes('不太') || lowerContent.includes('可能')) {
      return 'thinking';
    }
    if (lowerContent.includes('困难') || lowerContent.includes('挑战')) {
      return 'sad';
    }
  }

  return 'neutral';
}
