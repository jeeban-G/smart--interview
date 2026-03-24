import { useState } from 'react';

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
}

const QUICK_TAGS = [
  { label: '补充例子', value: '请补充一个具体例子' },
  { label: '追问细节', value: '追问一下技术细节' },
  { label: '换个方向', value: '换个方向问吧' },
];

export default function CoachInput({ onSend, disabled }: Props) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !disabled) {
      onSend(content.trim());
      setContent('');
    }
  };

  const handleQuickTag = (value: string) => {
    if (!disabled) {
      onSend(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 10,
        flexWrap: 'wrap',
      }}>
        {QUICK_TAGS.map(tag => (
          <button
            key={tag.label}
            type="button"
            onClick={() => handleQuickTag(tag.value)}
            disabled={disabled}
            style={{
              padding: '6px 12px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: 16,
              color: '#22c55e',
              fontSize: 12,
              fontWeight: 500,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {tag.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="输入指导建议..."
          disabled={disabled}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            color: '#fafafa',
            fontSize: 14,
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
          }}
        />
        <button
          type="submit"
          disabled={!content.trim() || disabled}
          style={{
            padding: '12px 20px',
            background: content.trim() && !disabled
              ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: 12,
            color: content.trim() && !disabled ? 'white' : '#71717a',
            fontSize: 14,
            fontWeight: 600,
            cursor: content.trim() && !disabled ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            fontFamily: 'Space Grotesk, sans-serif',
          }}
        >
          发送
        </button>
      </div>
    </form>
  );
}
