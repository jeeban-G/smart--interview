import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Agent } from '../types';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (agent: Agent) => void;
  initialType?: 'candidate' | 'interviewer';
  editAgent?: Agent;
}

export default function AgentModal({ isOpen, onClose, onSuccess, initialType = 'candidate', editAgent }: AgentModalProps) {
  const [agentType, setAgentType] = useState<'candidate' | 'interviewer'>(editAgent?.type || initialType);
  const [createMode, setCreateMode] = useState<'form' | 'resume'>('form');
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState(editAgent?.name || '');
  const [education, setEducation] = useState(editAgent?.education || '');
  const [experience, setExperience] = useState(editAgent?.experience || '');
  const [skills, setSkills] = useState(editAgent?.skills || '');
  const [projects, setProjects] = useState(editAgent?.projects || '');
  const [personality, setPersonality] = useState(editAgent?.personality || '');
  const [style, setStyle] = useState(editAgent?.style || '');
  const [specialties, setSpecialties] = useState(editAgent?.specialties || '');
  const [company, setCompany] = useState(editAgent?.company || '');
  const [resumeText, setResumeText] = useState('');

  // Reset form when editAgent changes
  useEffect(() => {
    if (editAgent) {
      setAgentType(editAgent.type);
      setName(editAgent.name || '');
      setEducation(editAgent.education || '');
      setExperience(editAgent.experience || '');
      setSkills(editAgent.skills || '');
      setProjects(editAgent.projects || '');
      setPersonality(editAgent.personality || '');
      setStyle(editAgent.style || '');
      setSpecialties(editAgent.specialties || '');
      setCompany(editAgent.company || '');
    } else {
      setAgentType(initialType);
      setName('');
      setEducation('');
      setExperience('');
      setSkills('');
      setProjects('');
      setPersonality('');
      setStyle('');
      setSpecialties('');
      setCompany('');
    }
    setResumeText('');
  }, [editAgent, initialType]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('请输入名称');
      return;
    }

    setLoading(true);
    try {
      let agent: Agent;
      if (editAgent) {
        agent = await api.updateAgent(editAgent.id, {
          name,
          education,
          experience,
          skills,
          projects,
          personality,
          style,
          specialties,
          company,
        });
      } else {
        agent = await api.createAgent({
          name,
          type: agentType,
          education: agentType === 'candidate' ? education : undefined,
          experience: agentType === 'candidate' ? experience : undefined,
          skills: agentType === 'candidate' ? skills : undefined,
          projects: agentType === 'candidate' ? projects : undefined,
          personality: agentType === 'candidate' ? personality : undefined,
          resume_text: createMode === 'resume' ? resumeText : undefined,
          style: agentType === 'interviewer' ? style : undefined,
          specialties: agentType === 'interviewer' ? specialties : undefined,
          company: agentType === 'interviewer' ? company : undefined,
        });
      }
      onSuccess(agent);
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setResumeText(text);
    setCreateMode('form');

    // 简单解析 - 实际可以用 AI 解析
    const lines = text.split('\n');
    if (!name && lines.length > 0) {
      // 尝试从第一行获取名字
      setName(lines[0].trim());
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#1a1a2e',
        borderRadius: 16,
        padding: 24,
        width: 500,
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginBottom: 20, color: '#fff' }}>
          {editAgent ? '编辑 Agent' : '创建 Agent'}
        </h2>

        {/* Agent Type Selection */}
        {!editAgent && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#a0a0a0', fontSize: 14, display: 'block', marginBottom: 8 }}>Agent 类型</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setAgentType('candidate')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: agentType === 'candidate' ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.2)',
                  background: agentType === 'candidate' ? 'rgba(102,126,234,0.2)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                👤 求职者 Agent
              </button>
              <button
                onClick={() => setAgentType('interviewer')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: agentType === 'interviewer' ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.2)',
                  background: agentType === 'interviewer' ? 'rgba(102,126,234,0.2)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                🎯 面试官 Agent
              </button>
            </div>
          </div>
        )}

        {/* Create Mode Selection */}
        {!editAgent && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#a0a0a0', fontSize: 14, display: 'block', marginBottom: 8 }}>创建方式</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setCreateMode('form')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: createMode === 'form' ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.2)',
                  background: createMode === 'form' ? 'rgba(102,126,234,0.2)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                📝 表单填写
              </button>
              <button
                onClick={() => setCreateMode('resume')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: createMode === 'resume' ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.2)',
                  background: createMode === 'resume' ? 'rgba(102,126,234,0.2)' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                📄 简历上传
              </button>
            </div>
          </div>
        )}

        {/* Resume Upload */}
        {!editAgent && createMode === 'resume' && (
          <div style={{ marginBottom: 20 }}>
            <input type="file" accept=".txt,.md,.pdf" onChange={handleResumeUpload} />
            <p style={{ color: '#666', fontSize: 12, marginTop: 8 }}>支持 TXT、MD、PDF 格式</p>
          </div>
        )}

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ color: '#a0a0a0', fontSize: 12, display: 'block', marginBottom: 4 }}>名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="给 Agent 起个名字"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {agentType === 'candidate' && (
            <>
              <div>
                <label style={{ color: '#a0a0a0', fontSize: 12, display: 'block', marginBottom: 4 }}>学历背景</label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="如：清华大学 计算机科学 硕士"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#a0a0a0', fontSize: 12, display: 'block', marginBottom: 4 }}>工作经历</label>
                <textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="如：字节跳动 前端工程师 2年"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#a0a0a0', fontSize: 12, display: 'block', marginBottom: 4 }}>技术栈/技能</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="如：React, TypeScript, Node.js"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#a0a0a0', fontSize: 12, display: 'block', marginBottom: 4 }}>项目经验</label>
                <textarea
                  value={projects}
                  onChange={(e) => setProjects(e.target.value)}
                  placeholder="简述主要项目经验"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#a0a0a0', fontSize: 12, display: 'block', marginBottom: 4 }}>性格特点</label>
                <input
                  type="text"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="如：稳重、健谈、逻辑清晰"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </>
          )}

          {agentType === 'interviewer' && (
            <>
              <div>
                <label style={{ color: '#a0a0a0', fontSize: 12, display: 'block', marginBottom: 4 }}>代表公司</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="如：字节跳动、阿里巴巴"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#a0a0a0', fontSize: 12, display: 'block', marginBottom: 4 }}>面试风格</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">选择风格...</option>
                  <option value="严谨">严谨型</option>
                  <option value="轻松">轻松型</option>
                  <option value="压力">压力型</option>
                  <option value="友好">友好型</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#a0a0a0', fontSize: 12, display: 'block', marginBottom: 4 }}>擅长领域</label>
                <input
                  type="text"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  placeholder="如：前端架构、性能优化、系统设计"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 8,
              border: 'none',
              background: loading ? 'rgba(102,126,234,0.5)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}