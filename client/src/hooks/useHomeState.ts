import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Interview, Position, Agent } from '../types';

export function useHomeState() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<Interview[]>([]);
  const [interviewType, setInterviewType] = useState<'group' | 'single' | 'multi'>('single');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('全部');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [roomStatus, setRoomStatus] = useState<{active: number, max: number, available: boolean, userActive?: number}>({active: 0, max: 10, available: true, userActive: 0});
  const [roomTab, setRoomTab] = useState<'active' | 'completed'>('active');
  const [multiRoomCount, setMultiRoomCount] = useState(3);
  const [multiRoomPositions, setMultiRoomPositions] = useState<Position[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>();
  const [agentTab, setAgentTab] = useState<'candidate' | 'interviewer'>('candidate');
  const [selectedCandidateAgentId, setSelectedCandidateAgentId] = useState<number | null>(null);
  const [selectedInterviewerAgentId, setSelectedInterviewerAgentId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // 预设的默认 Agent
  const defaultAgents = {
    candidate: [
      {
        name: '张同学',
        type: 'candidate' as const,
        education: '清华大学 计算机科学与技术 本科',
        experience: '字节跳动 前端实习 6个月；腾讯 后端实习 3个月',
        skills: 'React, Vue, TypeScript, Node.js, Python',
        projects: '开发了一个基于 React 的在线协作白板项目',
        personality: '逻辑清晰，善于表达，对新技术充满热情',
      },
      {
        name: '李同学',
        type: 'candidate' as const,
        education: '上海交通大学 软件工程 硕士',
        experience: '阿里巴巴 算法实习 8个月；微软 实习 4个月',
        skills: 'Python, TensorFlow, PyTorch, 算法设计, 系统设计',
        projects: '发表过顶会论文，研究方向为推荐系统',
        personality: '严谨务实，喜欢深入研究问题',
      },
      {
        name: '王同学',
        type: 'candidate' as const,
        education: '浙江大学 产品设计 本科',
        experience: '网易 产品经理实习 6个月；滴滴 用户研究实习 3个月',
        skills: 'Axure, Figma, 用户研究, 需求分析, 数据分析',
        projects: '主导过校园社交 APP 的从 0 到 1 开发',
        personality: '创意十足，擅长用户洞察和需求挖掘',
      },
    ],
    interviewer: [
      {
        name: '陈面试官',
        type: 'interviewer' as const,
        company: '字节跳动',
        specialties: '前端架构, 工程化, 性能优化',
        style: '考察深度，喜欢追问原理，要求代码质量',
      },
      {
        name: '刘面试官',
        type: 'interviewer' as const,
        company: '阿里巴巴',
        specialties: '算法, 系统设计, 大数据',
        style: '考察广度，题型多变，重视思维过程',
      },
      {
        name: '周面试官',
        type: 'interviewer' as const,
        company: '腾讯',
        specialties: '产品思维, 用户体验, 业务洞察',
        style: '考察实战经验，喜欢结合业务场景提问',
      },
    ],
  };

  const initDefaultAgents = async () => {
    const existingAgents = await api.getAgents();
    if (existingAgents.length > 0) return;

    for (const agent of [...defaultAgents.candidate, ...defaultAgents.interviewer]) {
      try {
        await api.createAgent(agent);
      } catch (err) {
        console.error('Failed to create default agent:', err);
      }
    }
  };

  const loadData = async () => {
    try {
      const [posData, histData, roomData, agentData] = await Promise.all([
        api.getPositions(),
        api.getHistory(),
        api.getRoomStatus(),
        api.getAgents(),
      ]);
      setPositions(posData as Position[]);
      setHistory(histData as Interview[]);
      setRoomStatus({
        ...(roomData as any),
        userActive: (histData as Interview[]).filter(i => i.status === 'in_progress').length
      });

      if ((agentData as Agent[]).length === 0) {
        await initDefaultAgents();
        const newAgentData = await api.getAgents();
        setAgents(newAgentData);
      } else {
        setAgents(agentData as Agent[]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleCreate = async () => {
    if (interviewType === 'multi') {
      if (multiRoomPositions.length === 0) return;
      setLoading(true);
      try {
        const createdRooms: Interview[] = [];
        for (const pos of multiRoomPositions) {
          const positionName = `${pos.name} - ${pos.position}`;
          const interview = await api.createInterview({
            type: 'single',
            position: positionName,
          }) as Interview;
          createdRooms.push(interview);
        }
        if (createdRooms.length > 0) {
          navigate(`/interview/${createdRooms[0].id}`);
        }
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (!selectedPosition) return;
      setLoading(true);
      try {
        const positionName = `${selectedPosition.name} - ${selectedPosition.position}`;
        const interview = await api.createInterview({
          type: interviewType,
          position: positionName,
          candidate_agent_id: selectedCandidateAgentId || undefined,
          interviewer_agent_id: selectedInterviewerAgentId || undefined,
        }) as Interview;
        navigate(`/interview/${interview.id}`);
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteAgent = async (agentId: number) => {
    await api.deleteAgent(agentId);
    setAgents(prev => prev.filter(a => a.id !== agentId));
  };

  const deleteInterview = async (interviewId: number) => {
    await api.deleteInterview(interviewId);
    setHistory(prev => prev.filter(i => i.id !== interviewId));
  };

  const filteredPositions = positions.filter(p => {
    const matchesSearch = searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.position.toLowerCase().includes(searchQuery.toLowerCase());

    const categoryMap: Record<string, string[]> = {
      '全部': [],
      '前端': ['前端'],
      '后端': ['后端'],
      '算法': ['算法'],
      '产品': ['产品'],
      '运营': ['运营'],
    };
    const categories = categoryMap[activeFilter] || [];
    const matchesFilter = categories.length === 0 ||
      categories.some(cat => p.position.includes(cat));

    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    loadData();
  }, []);

  return {
    // State
    positions,
    history,
    interviewType,
    selectedPosition,
    searchQuery,
    activeFilter,
    loading,
    pageLoading,
    roomStatus,
    roomTab,
    multiRoomCount,
    multiRoomPositions,
    agents,
    showAgentModal,
    editingAgent,
    agentTab,
    selectedCandidateAgentId,
    selectedInterviewerAgentId,
    filteredPositions,

    // Setters
    setInterviewType,
    setSelectedPosition,
    setSearchQuery,
    setActiveFilter,
    setRoomTab,
    setMultiRoomCount,
    setMultiRoomPositions,
    setAgents,
    setShowAgentModal,
    setEditingAgent,
    setAgentTab,
    setSelectedCandidateAgentId,
    setSelectedInterviewerAgentId,

    // Handlers
    handleCreate,
    deleteAgent,
    deleteInterview,

    // User
    user,
    logout,
  };
}
