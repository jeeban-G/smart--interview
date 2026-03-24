import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

type CreateMode = 'form' | 'resume' | 'chat';

export default function ProfileCreate() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CreateMode>('form');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target_position: '',
    education: '',
    experience: '',
    skills: '',
    projects: '',
    personality: '',
    preferred_style: 'gentle' as 'gentle' | 'strict' | 'coaching',
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.createProfile(formData);
      navigate('/');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #09090b 0%, #0c0c0f 100%)',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#fafafa',
          fontFamily: 'Space Grotesk, sans-serif',
          marginBottom: 8,
          textAlign: 'center',
        }}>
          创建求职画像
        </h1>
        <p style={{
          fontSize: 14,
          color: '#71717a',
          textAlign: 'center',
          marginBottom: 32,
        }}>
          让我更好地了解你，提供更精准的面试指导
        </p>

        {/* Mode tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          background: 'rgba(255, 255, 255, 0.05)',
          padding: 6,
          borderRadius: 12,
        }}>
          {(['form', 'resume', 'chat'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: mode === m ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                border: mode === m ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid transparent',
                borderRadius: 8,
                color: mode === m ? '#fbbf24' : '#71717a',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {m === 'form' ? '填表单' : m === 'resume' ? '上传简历' : '对话创建'}
            </button>
          ))}
        </div>

        {/* Form mode */}
        {mode === 'form' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 16,
            padding: 24,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormField label="姓名" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} placeholder="你的姓名" />
              <FormField label="目标岗位" value={formData.target_position} onChange={(v) => setFormData({ ...formData, target_position: v })} placeholder="如：前端工程师" />
              <FormField label="学历" value={formData.education} onChange={(v) => setFormData({ ...formData, education: v })} placeholder="如：本科" />
              <FormField label="经验" value={formData.experience} onChange={(v) => setFormData({ ...formData, experience: v })} placeholder="如：3年React开发经验" />
              <FormField label="技能" value={formData.skills} onChange={(v) => setFormData({ ...formData, skills: v })} placeholder="如：React, TypeScript, Node.js" large />
              <FormField label="项目经验" value={formData.projects} onChange={(v) => setFormData({ ...formData, projects: v })} placeholder="简述你的项目经历" large />
              <FormField label="性格特点" value={formData.personality} onChange={(v) => setFormData({ ...formData, personality: v })} placeholder="如：认真踏实，喜欢思考" />

              <div>
                <label style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 8, display: 'block' }}>
                  偏好风格
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['gentle', 'strict', 'coaching'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setFormData({ ...formData, preferred_style: style })}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: formData.preferred_style === style ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: formData.preferred_style === style ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 8,
                        color: formData.preferred_style === style ? '#fbbf24' : '#71717a',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {style === 'gentle' ? '温和' : style === 'strict' ? '严格' : '教练'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !formData.name}
              style={{
                width: '100%',
                marginTop: 24,
                padding: '14px 24px',
                background: loading || !formData.name ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                border: 'none',
                borderRadius: 12,
                color: loading || !formData.name ? '#71717a' : '#09090b',
                fontSize: 15,
                fontWeight: 600,
                cursor: loading || !formData.name ? 'not-allowed' : 'pointer',
                fontFamily: 'Space Grotesk, sans-serif',
              }}
            >
              {loading ? '创建中...' : '创建画像'}
            </button>
          </div>
        )}

        {/* Resume upload mode */}
        {mode === 'resume' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 16,
            padding: 40,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <p style={{ color: '#71717a', fontSize: 14, marginBottom: 20 }}>
              支持 PDF、DOCX、TXT 格式
            </p>
            <label style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              borderRadius: 10,
              color: '#fbbf24',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              选择文件
              <input type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {/* Chat mode */}
        {mode === 'chat' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <p style={{ color: '#fafafa', fontSize: 15, marginBottom: 8 }}>
              像和学长学姐聊天一样
            </p>
            <p style={{ color: '#71717a', fontSize: 13 }}>
              我来问你几个问题，更好地了解你
            </p>
            <button style={{
              marginTop: 20,
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              开始对话
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, large }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  large?: boolean;
}) {
  return (
    <div>
      <label style={{
        fontSize: 13,
        color: '#a1a1aa',
        marginBottom: 8,
        display: 'block',
      }}>
        {label}
      </label>
      {large ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 10,
            color: '#fafafa',
            fontSize: 14,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 10,
            color: '#fafafa',
            fontSize: 14,
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  );
}