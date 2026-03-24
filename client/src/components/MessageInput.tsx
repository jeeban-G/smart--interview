import { useState } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(message);
    setMessage('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <div style={{
        flex: 1,
        position: 'relative',
        transition: 'all 0.2s ease',
      }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="输入你的回答..."
          disabled={disabled}
          style={{
            width: '100%',
            padding: '16px 20px',
            borderRadius: 16,
            border: isFocused
              ? '2px solid #fbbf24'
              : '2px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.4)',
            color: '#fafafa',
            fontSize: 14,
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: isFocused
              ? '0 0 0 4px rgba(251, 191, 36, 0.1)'
              : 'none',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={disabled || !message.trim()}
        style={{
          padding: '16px 28px',
          borderRadius: 16,
          border: 'none',
          background: message.trim() && !disabled
            ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
            : 'rgba(255, 255, 255, 0.1)',
          color: message.trim() && !disabled ? '#09090b' : '#71717a',
          cursor: message.trim() && !disabled ? 'pointer' : 'not-allowed',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'Space Grotesk, sans-serif',
          transition: 'all 0.2s ease',
          boxShadow: message.trim() && !disabled
            ? '0 6px 24px rgba(251, 191, 36, 0.3)'
            : 'none',
          transform: message.trim() && !disabled ? 'scale(1)' : 'scale(0.98)',
        }}
        onMouseEnter={(e) => {
          if (message.trim() && !disabled) {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(251, 191, 36, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = message.trim() && !disabled ? 'scale(1)' : 'scale(0.98)';
          e.currentTarget.style.boxShadow = message.trim() && !disabled
            ? '0 6px 24px rgba(251, 191, 36, 0.3)'
            : 'none';
        }}
      >
        {disabled ? '发送中...' : '发送'}
      </button>
    </form>
  );
}
