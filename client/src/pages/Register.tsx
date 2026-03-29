import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 如果已登录，跳转到首页
  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      setError('请填写所有必填项');
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要 6 位');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(email, password, nickname || undefined);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

        * {
          box-sizing: border-box;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        body {
          background: #09090b;
          color: #fafafa;
          font-family: 'Inter', sans-serif;
        }

        input:focus {
          outline: none;
          border-color: #fbbf24;
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
        padding: 20,
      }}>
        <div style={{
          width: '100%',
          maxWidth: 400,
          padding: 40,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 24,
          animation: 'fadeIn 0.5s ease',
        }}>
          {/* Logo */}
          <div style={{
            textAlign: 'center',
            marginBottom: 32,
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 8px 30px rgba(251, 191, 36, 0.3)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              fontFamily: 'Space Grotesk, sans-serif',
              letterSpacing: '-0.02em',
              color: '#fafafa',
            }}>
              A2A 面试
            </h1>
            <p style={{
              margin: '8px 0 0 0',
              fontSize: 13,
              color: '#71717a',
            }}>
              创建账户，开始你的面试之旅
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#a1a1aa',
                marginBottom: 8,
              }}>
                邮箱 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#fafafa',
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#a1a1aa',
                marginBottom: 8,
              }}>
                昵称（可选）
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="你的昵称"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#fafafa',
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#a1a1aa',
                marginBottom: 8,
              }}>
                密码 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位密码"
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#fafafa',
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#a1a1aa',
                marginBottom: 8,
              }}>
                确认密码 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#fafafa',
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 10,
                color: '#ef4444',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#09090b',
                border: 'none',
                borderRadius: 12,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'Space Grotesk, sans-serif',
                boxShadow: '0 8px 30px rgba(251, 191, 36, 0.25)',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          {/* Login Link */}
          <div style={{
            textAlign: 'center',
            marginTop: 24,
            paddingTop: 24,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <span style={{ fontSize: 13, color: '#71717a' }}>
              已有账户？
            </span>
            {' '}
            <Link
              to="/login"
              style={{
                fontSize: 13,
                color: '#fbbf24',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
