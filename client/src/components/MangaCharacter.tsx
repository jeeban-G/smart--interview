import { useEffect, useRef, useState } from 'react';

interface MangaCharacterProps {
  type: 'interviewer' | 'candidate' | 'user';
  isTyping?: boolean;
}

// 漫画风格人物组件
function MangaAvatar({ type, isTyping }: { type: 'interviewer' | 'candidate' | 'user'; isTyping?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expression, setExpression] = useState<'neutral' | 'happy' | 'thinking' | 'surprised'>('neutral');

  // 更新表情
  useEffect(() => {
    if (isTyping) {
      setExpression('thinking');
    } else {
      setExpression('neutral');
    }
  }, [isTyping]);

  // 绘制漫画人物
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 120;
    const height = 160;
    canvas.width = width;
    canvas.height = height;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 颜色配置
    const colors = {
      interviewer: { hair: '#2c2c2c', skin: '#ffe4c4', outfit: '#1a1a2e', accent: '#ffd700' },
      candidate: { hair: '#4a3728', skin: '#ffe4c4', outfit: '#3d5a80', accent: '#6bcbff' },
      user: { hair: '#8b5cf6', skin: '#ffe4c4', outfit: '#5c6bc0', accent: '#a855f7' },
    };
    const c = colors[type];

    // 头发形状 - 动漫风格大头发
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    // 后脑勺
    ctx.ellipse(60, 50, 38, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    // 刘海
    ctx.beginPath();
    ctx.moveTo(25, 35);
    ctx.quadraticCurveTo(60, 15, 95, 35);
    ctx.quadraticCurveTo(85, 45, 80, 55);
    ctx.lineTo(40, 55);
    ctx.quadraticCurveTo(35, 45, 25, 35);
    ctx.fill();
    // 侧边头发
    ctx.beginPath();
    ctx.moveTo(25, 45);
    ctx.quadraticCurveTo(20, 70, 25, 90);
    ctx.lineTo(30, 90);
    ctx.quadraticCurveTo(28, 70, 30, 50);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(95, 45);
    ctx.quadraticCurveTo(100, 70, 95, 90);
    ctx.lineTo(90, 90);
    ctx.quadraticCurveTo(92, 70, 90, 50);
    ctx.fill();

    // 脸部
    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.ellipse(60, 65, 28, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // 脖子
    ctx.fillStyle = c.skin;
    ctx.fillRect(50, 92, 20, 15);

    // 衣服/身体
    ctx.fillStyle = c.outfit;
    ctx.beginPath();
    ctx.moveTo(30, 105);
    ctx.lineTo(25, 160);
    ctx.lineTo(95, 160);
    ctx.lineTo(90, 105);
    ctx.closePath();
    ctx.fill();

    // 领口
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(45, 105);
    ctx.lineTo(60, 120);
    ctx.lineTo(75, 105);
    ctx.closePath();
    ctx.fill();

    // 表情
    const eyeY = 60;

    // 左眼
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(48, eyeY, 5, expression === 'surprised' ? 7 : 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // 左眼高光
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(50, eyeY - 2, 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 右眼
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(72, eyeY, 5, expression === 'surprised' ? 7 : 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // 右眼高光
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(74, eyeY - 2, 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 嘴巴
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (expression === 'happy') {
      // 笑脸
      ctx.arc(60, 72, 8, 0.1 * Math.PI, 0.9 * Math.PI);
    } else if (expression === 'surprised') {
      // 惊讶 O形嘴
      ctx.arc(60, 75, 5, 0, Math.PI * 2);
    } else if (expression === 'thinking') {
      // 思考 ...
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.ellipse(60, 76, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 普通微笑
      ctx.arc(60, 70, 6, 0.2 * Math.PI, 0.8 * Math.PI);
    }
    ctx.stroke();

    // 腮红（可爱元素）
    ctx.fillStyle = 'rgba(255, 150, 150, 0.3)';
    ctx.beginPath();
    ctx.ellipse(38, 70, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(82, 70, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 角色类型装饰
    if (type === 'interviewer') {
      // 眼镜
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(40, 54, 16, 12, 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(64, 54, 16, 12, 2);
      ctx.stroke();
      // 眼镜桥
      ctx.beginPath();
      ctx.moveTo(56, 60);
      ctx.lineTo(64, 60);
      ctx.stroke();
    } else if (type === 'candidate') {
      // 耳机
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(30, 55, 10, 0.3 * Math.PI, 0.7 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(90, 55, 10, 0.3 * Math.PI, 0.7 * Math.PI);
      ctx.stroke();
    }

  }, [type, expression]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: 120,
        height: 160,
        animation: isTyping ? 'float 0.5s ease-in-out infinite' : 'none',
      }}
    />
  );
}

export default function MangaCharacter({ type, isTyping = false }: MangaCharacterProps) {
  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <MangaAvatar type={type} isTyping={isTyping} />
    </div>
  );
}
