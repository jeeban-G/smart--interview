import { EventEmitter } from 'events';
import { getDb, saveDb } from '../db/index.js';
import { agentService } from './agent.service.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_API_URL = 'https://api.minimaxi.com/anthropic/v1/messages';
const MAX_ACTIVE_ROOMS = 10;

// Pause flags for each interview
const pauseFlags = new Map<number, boolean>();

// Resume signals for each interview (to wake up paused loops)
const resumeSignals = new Map<number, () => void>();

interface Message {
  id: number;
  interview_id: number;
  sender_type: string;
  sender_name: string | null;
  content: string;
  timestamp: string;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}


// Create EventEmitter instance and set prototype for event capabilities
const interviewServiceBase = {
  // ... all the methods will be added here
};

// Create a proper EventEmitter-backed service
class InterviewServiceClass extends EventEmitter {
  // Methods will be defined on the prototype
}

// Copy all methods to the class prototype
const serviceMethods = {
  create(userId: number, type: 'group' | 'single', position: string, candidateAgentId?: number, interviewerAgentId?: number) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    // 对于单面，检查活跃房间数
    if (type === 'single') {
      const activeRooms = db.exec(
        "SELECT COUNT(*) FROM interviews WHERE type = 'single' AND status = 'in_progress'"
      );
      const count = activeRooms[0]?.values[0]?.[0] as number || 0;
      if (count >= MAX_ACTIVE_ROOMS) {
        throw new Error(`当前活跃房间已达上限(${MAX_ACTIVE_ROOMS})，请稍后再试`);
      }
    }

    // 生成面试题目
    const question = this.generateQuestion(position);

    // 生成唯一房间码
    let roomCode: string;
    do {
      roomCode = generateRoomCode();
      const existing = db.exec('SELECT id FROM interviews WHERE room_code = ?', [roomCode]);
      if (existing.length === 0 || existing[0].values.length === 0) break;
    } while (true);

    const stmt = db.prepare(
      'INSERT INTO interviews (user_id, room_code, type, position, question, status, duration, candidate_agent_id, interviewer_agent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run([userId, roomCode, type, position, question, 'in_progress', 0, candidateAgentId || null, interviewerAgentId || null]);

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;
    saveDb();

    return {
      id,
      user_id: userId,
      room_code: roomCode,
      type,
      position,
      question,
      status: 'in_progress',
      duration: 0,
      candidate_agent_id: candidateAgentId || null,
      interviewer_agent_id: interviewerAgentId || null,
      created_at: new Date().toISOString()
    };
  },

  getActiveRoomCount(): number {
    const db = getDb();
    if (!db) return 0;

    const result = db.exec(
      "SELECT COUNT(*) FROM interviews WHERE type = 'single' AND status = 'in_progress'"
    );
    return result[0]?.values[0]?.[0] as number || 0;
  },

  getByRoomCode(roomCode: string) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const result = db.exec('SELECT * FROM interviews WHERE room_code = ?', [roomCode]);
    if (result.length === 0 || result[0].values.length === 0) return null;

    const row = result[0].values[0];
    return {
      id: row[0] as number,
      user_id: row[1] as number,
      room_code: row[2] as string,
      type: row[3] as 'group' | 'single',
      position: row[4] as string,
      question: row[5] as string | null,
      status: row[6] as 'pending' | 'in_progress' | 'completed',
      duration: row[7] as number,
      candidate_agent_id: row[10] as number | null,
      interviewer_agent_id: row[11] as number | null,
      created_at: row[8] as string
    };
  },

  generateQuestion(position: string): string {
    const questions: Record<string, string[]> = {
      'frontend': [
        '请谈谈你在前端项目中使用 TypeScript 的经验，以及如何避免类型问题？',
        '描述一下你如何优化 React 应用的性能？',
        '你如何看待前端架构中的模块化设计？'
      ],
      'backend': [
        '请描述一下你如何设计一个高并发的 RESTful API？',
        '你如何处理数据库事务和并发控制？',
        '谈谈你使用微服务架构的经验。'
      ],
      'default': [
        '请做一个简短的自我介绍，重点介绍与你申请职位相关的经验。',
        '描述你过去遇到的最大技术挑战以及如何解决的？',
        '你为什么想要加入我们公司？'
      ]
    };

    const positionQuestions = questions[position] || questions['default'];
    return positionQuestions[Math.floor(Math.random() * positionQuestions.length)];
  },

  getById(id: number) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const result = db.exec('SELECT * FROM interviews WHERE id = ?', [id]);
    if (result.length === 0 || result[0].values.length === 0) return null;

    const row = result[0].values[0];
    return {
      id: row[0] as number,
      user_id: row[1] as number,
      room_code: row[2] as string,
      type: row[3] as 'group' | 'single',
      position: row[4] as string,
      question: row[5] as string | null,
      status: row[6] as 'pending' | 'in_progress' | 'completed',
      duration: row[7] as number,
      candidate_agent_id: row[10] as number | null,
      interviewer_agent_id: row[11] as number | null,
      created_at: row[8] as string
    };
  },

  getHistory(userId: number) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const result = db.exec('SELECT * FROM interviews WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    if (result.length === 0) return [];

    return result[0].values.map(row => ({
      id: row[0] as number,
      user_id: row[1] as number,
      room_code: row[2] as string,
      type: row[3] as 'group' | 'single',
      position: row[4] as string,
      question: row[5] as string | null,
      status: row[6] as 'pending' | 'in_progress' | 'completed',
      duration: row[7] as number,
      candidate_agent_id: row[10] as number | null,
      interviewer_agent_id: row[11] as number | null,
      created_at: row[8] as string
    }));
  },

  addMessage(interviewId: number, senderType: string, senderName: string | null, content: string) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(
      'INSERT INTO messages (interview_id, sender_type, sender_name, content) VALUES (?, ?, ?, ?)'
    );
    stmt.run([interviewId, senderType, senderName, content]);
    saveDb();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;

    return {
      id,
      interview_id: interviewId,
      sender_type: senderType,
      sender_name: senderName,
      content,
      timestamp: new Date().toISOString()
    };
  },

  getMessages(interviewId: number) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const result = db.exec(
      'SELECT * FROM messages WHERE interview_id = ? ORDER BY timestamp ASC',
      [interviewId]
    );
    if (result.length === 0) return [];

    return result[0].values.map(row => ({
      id: row[0] as number,
      interview_id: row[1] as number,
      sender_type: row[2] as string,
      sender_name: row[3] as string | null,
      content: row[4] as string,
      timestamp: row[5] as string
    }));
  },

  async generateAIResponse(interviewId: number, senderType: string): Promise<string> {
    console.log(`[AIResponse] Generating response for interview ${interviewId}, senderType=${senderType}`);
    const interview = this.getById(interviewId);
    if (!interview) throw new Error('Interview not found');

    const messages = this.getMessages(interviewId);
    const question = interview.question || '请回答以下问题';

    // 获取 Agent 信息（如果设置了）
    let agentInfo = '';
    let agent = null;

    // 确定使用哪个 agent
    if (senderType === 'ai_interviewer' && interview.interviewer_agent_id) {
      agent = agentService.getById(interview.interviewer_agent_id);
    } else if (senderType === 'ai_candidate' && interview.candidate_agent_id) {
      agent = agentService.getById(interview.candidate_agent_id);
    } else if (interview.candidate_agent_id) {
      agent = agentService.getById(interview.candidate_agent_id);
    } else if (interview.interviewer_agent_id) {
      agent = agentService.getById(interview.interviewer_agent_id);
    }

    if (agent) {
      if (agent.type === 'candidate') {
        agentInfo = `\n\n你是求职者 ${agent.name}，背景信息：学历-${agent.education || '未填写'}，经验-${agent.experience || '未填写'}，技能-${agent.skills || '未填写'}，性格-${agent.personality || '未填写'}。请以这个身份回答问题。`;
      } else {
        agentInfo = `\n\n你是面试官 ${agent.name}，代表公司-${agent.company || '未填写'}，面试风格-${agent.style || '未填写'}，擅长领域-${agent.specialties || '未填写'}。请以这个身份进行面试。`;
      }
    }

    const systemPrompt = senderType === 'ai_interviewer'
      ? `你是一个专业的面试官，面试职位是${interview.position}。${agentInfo}请根据简历和对话历史，提出有针对性的问题。`
      : `你是一个求职者，面试职位是${interview.position}。${agentInfo}请根据面试官的问题，给出专业且得体的回答。`;

    const conversationHistory = messages.map(m =>
      `${m.sender_name || m.sender_type}: ${m.content}`
    ).join('\n');

    try {
      const response = await axios.post(
        MINIMAX_API_URL,
        {
          model: 'MiniMax-M2.7',
          max_tokens: 512,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `面试问题: ${question}\n\n对话历史:\n${conversationHistory}` }
          ]
        },
        {
          headers: {
            'x-api-key': MINIMAX_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      // MiniMax 返回格式: { content: [{ type: "text", text: "..." }] }
      const content = response.data.content;
      let text = '抱歉，我暂时无法回答这个问题。';
      if (Array.isArray(content)) {
        const textItem = content.find((c: any) => c.type === 'text');
        text = textItem?.text || text;
      }
      return text;
    } catch (error: any) {
      console.error('[AIResponse] API error:', error?.response?.data || error?.message || error);
      return '抱歉，AI 服务暂时不可用。';
    }
  },

  async startAgentChat(interviewId: number): Promise<Message[]> {
    console.log(`[StartAgentChat] Starting for interview ${interviewId}`);
    const interview = this.getById(interviewId);
    if (!interview) throw new Error('Interview not found');

    // 检查是否同时有候选人和面试官 Agent
    if (!interview.candidate_agent_id || !interview.interviewer_agent_id) {
      return [];
    }

    const candidateAgent = agentService.getById(interview.candidate_agent_id);
    const interviewerAgent = agentService.getById(interview.interviewer_agent_id);

    if (!candidateAgent || !interviewerAgent) return [];

    const name = candidateAgent.name || '张三';
    const education = candidateAgent.education || '本科';
    const experience = candidateAgent.experience || '2年开发经验';
    const skills = candidateAgent.skills || 'React, TypeScript';
    const personality = candidateAgent.personality || '认真踏实';

    // 自我介绍提示词
    const introPrompt = `你是${name}，来面试${interview.position}岗位。

背景：学历${education}，经验${experience}，技术栈${skills}，性格${personality}。

要求：做一个简洁的自我介绍，60字以内，突出自己的特点和优势，自然像和真人聊天。`;

    try {
      const response = await axios.post(
        MINIMAX_API_URL,
        {
          model: 'MiniMax-M2.7',
          max_tokens: 300,
          messages: [
            { role: 'system', content: introPrompt },
            { role: 'user', content: '请做自我介绍' }
          ]
        },
        {
          headers: {
            'x-api-key': MINIMAX_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.content;
      let introText = '你好，我是张三，来面试前端工程师。';
      if (Array.isArray(content)) {
        const textItem = content.find((c: any) => c.type === 'text');
        introText = textItem?.text || introText;
      }

      // 添加候选人自我介绍消息
      const introMessage = this.addMessage(interviewId, 'ai_candidate', candidateAgent.name, introText);
      // @ts-ignore - this will be an EventEmitter instance at runtime
      (this as any).emit('message', { interviewId, message: introMessage, agent: 'candidate' });

      // 同步生成面试官回应并添加到消息
      const replyMessage = await this.generateInterviewerResponseMessage(interviewId);

      return replyMessage ? [introMessage, replyMessage] : [introMessage];

    } catch (error: any) {
      console.error('Start agent chat error:', error?.response?.data || error?.message || error);
      return [];
    }
  },

  async generateInterviewerResponseMessage(interviewId: number): Promise<Message | null> {
    const interview = this.getById(interviewId);
    if (!interview || !interview.interviewer_agent_id || !interview.candidate_agent_id) return null;

    const messages = this.getMessages(interviewId);
    const interviewerAgent = agentService.getById(interview.interviewer_agent_id);
    const candidateAgent = agentService.getById(interview.candidate_agent_id);

    if (!interviewerAgent || !candidateAgent) return null;

    const conversationHistory = messages.map(m =>
      `${m.sender_name || m.sender_type}: ${m.content}`
    ).join('\n');

    // 根据公司特点调整面试风格
    const company = interviewerAgent.company || '知名公司';
    const companyStyles: Record<string, { style: string; focus: string; questionType: string }> = {
      '字节跳动': {
        style: '高效直接，喜欢挖掘技术深度，追问底层原理',
        focus: '喜欢问：算法复杂度、系统设计、技术选型理由、性能优化',
        questionType: '往往先让候选人描述方案，再追问：为什么不用另一种方案'
      },
      '阿里巴巴': {
        style: '技术广度与深度并重，关注工程化和业务理解',
        focus: '喜欢问：项目规模、团队协作、技术债如何处理、如何验证方案有效性',
        questionType: '会追问具体数字和结果'
      },
      '腾讯': {
        style: '亲和力强，喜欢循序渐进，关注候选人成长潜力',
        focus: '喜欢问：学习能力、解决问题的方法论、沟通协作',
        questionType: '问题层层递进，给你表现的机会'
      },
      '美团': {
        style: '务实派，关注候选人能不能干活',
        focus: '喜欢问：实际项目经验、最复杂的问题如何解决、代码review经历',
        questionType: '直接问具体场景和解决方案'
      },
      '其他': {
        style: '严谨专业，关注技术能力和综合素质',
        focus: '喜欢问：项目经验、技术难点、团队合作',
        questionType: '根据简历灵活提问'
      }
    };
    const companyInfo = companyStyles[company] || companyStyles['其他'];

    // 分析候选人之前的回答，避免重复提问
    const candidateResponses = messages.filter(m => m.sender_type === 'ai_candidate').map(m => m.content);
    const askedTopics = candidateResponses.join('');

    // 判断已问过的话题
    const hasAskedAboutProjects = askedTopics.includes('项目');
    const hasAskedAboutTech = askedTopics.includes('技术') || askedTopics.includes('React') || askedTopics.includes('TypeScript');
    const hasAskedAboutProblems = askedTopics.includes('问题') || askedTopics.includes('挑战') || askedTopics.includes('困难');
    const hasAskedAboutSystem = askedTopics.includes('系统') || askedTopics.includes('架构') || askedTopics.includes('设计');
    const hasAskedAboutTeam = askedTopics.includes('团队') || askedTopics.includes('协作') || askedTopics.includes('合作');

    // 根据公司风格选择下一个话题
    let focusTopic = '';
    if (company === '字节跳动') {
      if (!hasAskedAboutSystem) {
        focusTopic = '请追问系统设计：让他描述一个项目的整体架构，为什么要这样设计？';
      } else if (!hasAskedAboutTech) {
        focusTopic = '请追问技术选型：为什么用A技术而不用B技术？';
      } else if (!hasAskedAboutProblems) {
        focusTopic = '请追问性能优化：项目中最棘手的性能问题是什么？怎么排查的？';
      } else {
        focusTopic = '请追问一个技术细节，比如某个算法的复杂度或者底层原理。';
      }
    } else if (company === '阿里巴巴') {
      if (!hasAskedAboutTeam) {
        focusTopic = '请追问团队协作：项目中如何与产品/测试沟通？有没有遇到过需求冲突？';
      } else if (!hasAskedAboutProblems) {
        focusTopic = '请追问技术挑战：遇到过最大的技术难题是什么？怎么解决的？';
      } else if (!hasAskedAboutProjects) {
        focusTopic = '请让他介绍一下项目的技术栈和团队规模。';
      } else {
        focusTopic = '请追问项目中的具体技术方案选择和效果评估。';
      }
    } else if (company === '腾讯') {
      if (!hasAskedAboutProblems) {
        focusTopic = '请追问成长经历：遇到新技术是怎么学习的？有没有失败的经历？';
      } else if (!hasAskedAboutProjects) {
        focusTopic = '请让他介绍一下最让你有成就感的项目，你在里面扮演什么角色？';
      } else if (!hasAskedAboutTeam) {
        focusTopic = '请追问协作经验：和团队成员意见不一致怎么办？';
      } else {
        focusTopic = '请追问一个具体的解决问题的方法或思路。';
      }
    } else {
      // 美团和其他公司
      if (!hasAskedAboutProjects) {
        focusTopic = '请让他介绍一下最让他有成就感的项目，包括项目背景、具体负责的模块、遇到的难点和解决方案。';
      } else if (!hasAskedAboutProblems) {
        focusTopic = '请追问一个具体的技术难题，他是如何解决的呢？';
      } else if (!hasAskedAboutTech) {
        focusTopic = '请问一下在实际项目中，如何做技术选型？有没有遇到过技术方案争论的情况？';
      } else {
        focusTopic = '请追问一个具体的细节，比如在项目中如何保证代码质量、有没有代码review的经历等。';
      }
    }

    const systemPrompt = `你是${interviewerAgent.name}，${company}的资深面试官。

【你的面试风格】
${companyInfo.style}

【你关注的重点】
${companyInfo.focus}

【你的提问方式】
${companyInfo.questionType}

【重要原则】
1. 每次只问1个核心问题，深入追问，不要泛泛而问
2. 仔细阅读对话历史，如果候选人已经回答了某个方向，不要再问类似问题
3. 追问时要针对候选人回答中的具体细节，不要重复问同样的问题
4. 回答要简洁有力，控制在50字以内
5. 如果某个话题已经问得很清楚，就不要再问，转向新话题

【避免重复】
你已经问过的话题不要重复追问：
- ${hasAskedAboutProjects ? '✓ 项目经验' : '○ 项目经验'}
- ${hasAskedAboutProblems ? '✓ 技术挑战' : '○ 技术挑战'}
- ${hasAskedAboutTech ? '✓ 技术细节' : '○ 技术细节'}
- ${hasAskedAboutSystem ? '✓ 系统设计' : '○ 系统设计'}
- ${hasAskedAboutTeam ? '✓ 团队协作' : '○ 团队协作'}

【当前任务】
${focusTopic}

【对话历史】
${conversationHistory}

请生成面试官的问题，要简短、具体、有针对性。符合${company}的面试风格。`;

    try {
      const response = await axios.post(
        MINIMAX_API_URL,
        {
          model: 'MiniMax-M2.7',
          max_tokens: 512,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: '请生成面试官的问题' }
          ]
        },
        {
          headers: {
            'x-api-key': MINIMAX_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.content;
      let replyText = '你项目中遇到过最大的技术挑战是什么？';
      if (Array.isArray(content)) {
        const textItem = content.find((c: any) => c.type === 'text');
        replyText = textItem?.text || replyText;
      }

      // 添加面试官回复
      const message = this.addMessage(interviewId, 'ai_interviewer', interviewerAgent.name, replyText);
      // @ts-ignore - this will be an EventEmitter instance at runtime
      (this as any).emit('message', { interviewId, message, agent: 'interviewer' });
      return message;

    } catch (error: any) {
      console.error('Interviewer response error:', error?.response?.data || error?.message || error);
      return null;
    }
  },

  async generateCandidateResponseMessage(interviewId: number): Promise<Message | null> {
    const interview = this.getById(interviewId);
    if (!interview || !interview.interviewer_agent_id || !interview.candidate_agent_id) return null;

    const messages = this.getMessages(interviewId);
    const interviewerAgent = agentService.getById(interview.interviewer_agent_id);
    const candidateAgent = agentService.getById(interview.candidate_agent_id);

    // Get user profile context
    const { profileService } = await import('./profile.service.js');
    const userProfile = profileService.getByUserId(interview.user_id);
    let profileContext = '';
    if (userProfile) {
      profileContext = `
【用户画像】
- 目标岗位：${userProfile.target_position || '未设置'}
- 学历：${userProfile.education || '未设置'}
- 经验：${userProfile.experience || '未设置'}
- 技能：${userProfile.skills || '未设置'}
- 项目经验：${userProfile.projects || '未设置'}
- 性格：${userProfile.personality || '未设置'}
`;
    }

    if (!interviewerAgent || !candidateAgent) return null;

    // 获取面试官的最后一条问题
    const lastInterviewQuestion = [...messages].reverse().find(m => m.sender_type === 'ai_interviewer')?.content || '';

    const conversationHistory = messages.map(m =>
      `${m.sender_name || m.sender_type}: ${m.content}`
    ).join('\n');

    // 更人性化的求职者提示词
    const name = candidateAgent.name || '张三';
    const education = candidateAgent.education || '本科';
    const experience = candidateAgent.experience || '2年开发经验';
    const skills = candidateAgent.skills || 'React, TypeScript';
    const personality = candidateAgent.personality || '认真踏实';

    // 分析之前的回答，避免重复
    const previousAnswers = messages.filter(m => m.sender_type === 'ai_candidate').map(m => m.content);
    const hasIntroducedSelf = previousAnswers.some(a => a.includes('我叫') || a.includes('自我介绍'));
    const hasTalkedAboutProjects = previousAnswers.some(a => a.includes('项目'));

    let answerFocus = '';
    if (lastInterviewQuestion.includes('项目') || lastInterviewQuestion.includes('经历')) {
      if (!hasTalkedAboutProjects) {
        answerFocus = '选择一个具体的项目案例，详细说明背景、职责、技术栈、难点和成果。用真实细节回答。';
      } else {
        answerFocus = '选择一个之前没提到的具体项目细节来回答，或者深入讲一个之前提到的项目中的具体问题。';
      }
    } else if (lastInterviewQuestion.includes('挑战') || lastInterviewQuestion.includes('难点') || lastInterviewQuestion.includes('问题')) {
      answerFocus = '讲一个具体的技术挑战，不要只说"遇到困难就查文档"这种套话，要说具体的、有细节的例子。';
    } else if (lastInterviewQuestion.includes('技术')) {
      answerFocus = '结合实际经验讲，不要只说技术名词，要说这个技术在实际项目中怎么用的、解决了什么问题。';
    } else {
      answerFocus = '回答要具体，有例子支撑，避免空泛的套话。';
    }

    const systemPrompt = `你是${name}，面试前端工程师岗位。
${profileContext}
【个人背景】
- 学历：${education}
- 工作经验：${experience}
- 技术栈：${skills}
- 性格：${personality}

【回答原则】
1. 回答要具体、有细节，不要泛泛而谈
2. 不要重复之前说过的内容，除非面试官追问
3. 不要每次都从头介绍自己，面试已经开始了，直接回答问题
4. 遇到不会的问题可以说"这个我了解不多，但我的理解是..."，不要直接说不会
5. 控制在80字以内，简洁有力
6. 像和真人聊天一样自然，有停顿、有思考

【面试官的问题】
${lastInterviewQuestion}

【回答要求】
${answerFocus}

【对话历史】
${conversationHistory}

请生成候选人的回答，要自然、具体、有个人特色。`;

    try {
      const response = await axios.post(
        MINIMAX_API_URL,
        {
          model: 'MiniMax-M2.7',
          max_tokens: 512,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: '请生成候选人的回答' }
          ]
        },
        {
          headers: {
            'x-api-key': MINIMAX_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.content;
      let replyText = '好的，我来说说我的看法...';
      if (Array.isArray(content)) {
        const textItem = content.find((c: any) => c.type === 'text');
        replyText = textItem?.text || replyText;
      }

      // 添加候选人回复
      const message = this.addMessage(interviewId, 'ai_candidate', candidateAgent.name, replyText);
      // @ts-ignore - this will be an EventEmitter instance at runtime
      (this as any).emit('message', { interviewId, message, agent: 'candidate' });

      // After candidate response, generate feedback
      const currentMessages = this.getMessages(interviewId);
      const round = Math.floor(currentMessages.length / 2);
      const feedback = await this.generateRealtimeFeedback(interviewId, round);

      return message;

    } catch (error: any) {
      console.error('Candidate response error:', error?.response?.data || error?.message || error);
      return null;
    }
  },

  shouldContinueInterview(interviewId: number): { continue: boolean; reason: string } {
    const interview = this.getById(interviewId);
    if (!interview) return { continue: false, reason: '面试不存在' };

    const messages = this.getMessages(interviewId);
    const messageCount = messages.length;

    // 对话轮数（每轮2条消息：候选人说，面试官问）
    const roundCount = Math.floor(messageCount / 2);

    // 如果面试已经进行了太多轮（超过20条消息），强制结束
    if (messageCount >= 20) {
      return { continue: false, reason: '对话轮数已达上限' };
    }

    // 如果消息数少于4条，说明刚开始，继续
    if (roundCount < 2) {
      return { continue: true, reason: '刚开始面试' };
    }

    // 检查最后一条面试官的消息是否明确表示要结束
    const lastInterviewerMsg = [...messages].reverse().find(m => m.sender_type === 'ai_interviewer');
    if (lastInterviewerMsg) {
      // 只有明确表示结束的语气才终止对话
      const endPhrases = [
        '今天的面试就到这里',
        '面试就到这里',
        '就到这里吧',
        '感谢参加面试',
        '等后续通知',
        '后续会通知',
        '面试结束',
        '我们这边会尽快通知',
        '欢迎加入我们',
        '期待你的加入',
      ];
      const content = lastInterviewerMsg.content;
      for (const phrase of endPhrases) {
        if (content.includes(phrase)) {
          return { continue: false, reason: '面试官已明确结束' };
        }
      }
    }

    // 检查对话质量：如果最近3轮候选人的回答都很短，可能话题已经充分
    const recentCandidateMsgs = messages.slice(-6).filter(m => m.sender_type === 'ai_candidate');
    if (recentCandidateMsgs.length >= 3) {
      const avgLength = recentCandidateMsgs.reduce((sum, m) => sum + m.content.length, 0) / recentCandidateMsgs.length;
      if (avgLength < 30) {
        return { continue: false, reason: '候选人回答趋于简短，话题已充分讨论' };
      }
    }

    // 检查是否有重复问题（如果面试官连续问了2个相似的问题）
    const interviewerMsgs = messages.slice(-4).filter(m => m.sender_type === 'ai_interviewer');
    if (interviewerMsgs.length >= 2) {
      const lastTwo = interviewerMsgs.slice(-2);
      // 简单检查：如果两个问题的内容高度相似（超过50%的词相同），则结束
      const words1 = new Set(lastTwo[0].content.split(/\s+/));
      const words2 = new Set(lastTwo[1].content.split(/\s+/));
      const intersection = [...words1].filter(w => words2.has(w) && w.length > 2);
      if (intersection.length > words1.size * 0.5) {
        return { continue: false, reason: '面试官问题趋于重复' };
      }
    }

    // 如果已经问了至少6个问题，可以考虑结束（充分面试）
    if (roundCount >= 6) {
      // 检查最后几轮是否都在讨论同一个话题
      const recentTopics = messages.slice(-6).map(m => {
        // 简单提取话题关键词
        const keywords = ['项目', '技术', '团队', '架构', '性能', '优化', '难点', '挑战', '协作', '学习'];
        return keywords.find(k => m.content.includes(k)) || '其他';
      });
      const uniqueTopics = new Set(recentTopics);
      if (uniqueTopics.size <= 2 && roundCount >= 7) {
        return { continue: false, reason: '话题讨论已充分' };
      }
    }

    return { continue: true, reason: '对话尚未充分' };
  },

  async continueAgentChat(interviewId: number): Promise<{ messages: Message[]; shouldContinue: boolean }> {
    const interview = this.getById(interviewId);
    if (!interview || !interview.interviewer_agent_id || !interview.candidate_agent_id) {
      return { messages: [], shouldContinue: false };
    }

    const interviewerAgent = agentService.getById(interview.interviewer_agent_id);
    const candidateAgent = agentService.getById(interview.candidate_agent_id);
    if (!interviewerAgent || !candidateAgent) {
      return { messages: [], shouldContinue: false };
    }

    const newMessages: Message[] = [];

    // Check if paused and wait until resumed
    while (pauseFlags.get(interviewId) === true) {
      console.log(`[ContinueChat] Interview ${interviewId} is paused, waiting...`);
      await new Promise<void>(resolve => {
        resumeSignals.set(interviewId, resolve);
      });
      console.log(`[ContinueChat] Interview ${interviewId} resumed!`);
    }

    // 1. 发送候选人正在输入的提示
    (this as any).emit('typing', { interviewId, agent: 'candidate' });

    // 2. 先生成候选人的回复
    const candidateResponse = await this.generateCandidateResponseMessage(interviewId);
    if (candidateResponse) {
      newMessages.push(candidateResponse);
      // 通过 SSE 发送给客户端
      (this as any).emit('message', { interviewId, message: candidateResponse, agent: 'candidate' });
    } else {
      return { messages: [], shouldContinue: false };
    }

    // 3. 等待一下再生成面试官的回复（模拟思考时间）
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Check if paused again before interviewer response
    while (pauseFlags.get(interviewId) === true) {
      await new Promise<void>(resolve => {
        resumeSignals.set(interviewId, resolve);
      });
    }

    // 4. 发送面试官正在输入的提示
    (this as any).emit('typing', { interviewId, agent: 'interviewer' });

    // 5. 检查是否应该继续
    const { continue: shouldContinue } = this.shouldContinueInterview(interviewId);
    if (!shouldContinue) {
      // 如果不应该继续，返回候选人消息但不继续面试官回复
      return { messages: newMessages, shouldContinue: false };
    }

    // 6. 生成面试官的回复
    const interviewerResponse = await this.generateInterviewerResponseMessage(interviewId);
    if (interviewerResponse) {
      newMessages.push(interviewerResponse);
      // 通过 SSE 发送给客户端
      (this as any).emit('message', { interviewId, message: interviewerResponse, agent: 'interviewer' });
    }

    return { messages: newMessages, shouldContinue };
  },

  async startBackgroundChat(interviewId: number): Promise<void> {
    console.log(`[BackgroundChat] Starting background chat for interview ${interviewId}`);
    const interview = this.getById(interviewId);
    if (!interview) {
      console.log(`[BackgroundChat] Interview ${interviewId} not found`);
      return;
    }

    console.log(`[BackgroundChat] Interview ${interviewId}: candidate_agent_id=${interview.candidate_agent_id}, interviewer_agent_id=${interview.interviewer_agent_id}`);

    // Start with initial agent chat
    const initialMessages = await this.startAgentChat(interviewId);
    console.log(`[BackgroundChat] Initial messages count: ${initialMessages.length}`);
    if (initialMessages.length === 0) {
      console.log(`[BackgroundChat] No initial messages, returning`);
      return;
    }

    // Emit typing event to indicate conversation is starting
    // @ts-ignore - this will be an EventEmitter instance at runtime
    (this as any).emit('typing', { interviewId, agent: 'interviewer' });

    // Continue the conversation loop
    let shouldContinue = true;
    while (shouldContinue) {
      // Wait for the thinking time (same as client-side delay)
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Check if paused and wait until resumed
      while (pauseFlags.get(interviewId) === true) {
        console.log(`[BackgroundChat] Interview ${interviewId} is paused, waiting...`);
        // Create a promise that resolves when resumed
        await new Promise<void>(resolve => {
          resumeSignals.set(interviewId, resolve);
        });
        console.log(`[BackgroundChat] Interview ${interviewId} resumed!`);
      }

      // Check if interview still exists and should continue
      const currentInterview = this.getById(interviewId);
      if (!currentInterview || currentInterview.status === 'completed') {
        break;
      }

      const { shouldContinue: cont } = await this.continueAgentChat(interviewId);
      shouldContinue = cont;

      if (shouldContinue) {
        // Emit typing event for next round
        // @ts-ignore - this will be an EventEmitter instance at runtime
    (this as any).emit('typing', { interviewId, agent: 'interviewer' });
      }
    }

    // Interview is complete
    if (this.getById(interviewId)?.status !== 'completed') {
      this.complete(interviewId);
    }
  },

  // 继续已有对话（不重新开始自我介绍）
  continueBackgroundChat(interviewId: number): void {
    console.log(`[ContinueBackgroundChat] Continuing chat for interview ${interviewId}`);

    // 在后台异步执行对话循环
    this.continueChatLoop(interviewId);
  },

  async continueChatLoop(interviewId: number): Promise<void> {
    // Continue the conversation loop
    let shouldContinue = true;
    while (shouldContinue) {
      // Wait for the thinking time
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Check if paused and wait until resumed
      while (pauseFlags.get(interviewId) === true) {
        await new Promise<void>(resolve => {
          resumeSignals.set(interviewId, resolve);
        });
      }

      // Check if interview still exists and should continue
      const currentInterview = this.getById(interviewId);
      if (!currentInterview || currentInterview.status === 'completed') {
        break;
      }

      const { shouldContinue: cont } = await this.continueAgentChat(interviewId);
      shouldContinue = cont;

      if (shouldContinue) {
        // Emit typing event for next round
        // @ts-ignore - this will be an EventEmitter instance at runtime
        (this as any).emit('typing', { interviewId, agent: 'interviewer' });
      }
    }

    // Interview is complete
    if (this.getById(interviewId)?.status !== 'completed') {
      this.complete(interviewId);
    }
  },

  complete(interviewId: number) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare("UPDATE interviews SET status = 'completed' WHERE id = ?");
    stmt.run([interviewId]);
    saveDb();
    // @ts-ignore - this will be an EventEmitter instance at runtime
    (this as any).emit('done', { interviewId });
    // Clean up pause state
    pauseFlags.delete(interviewId);
    resumeSignals.delete(interviewId);
  },

  pauseChat(interviewId: number) {
    pauseFlags.set(interviewId, true);
    // @ts-ignore - this will be an EventEmitter instance at runtime
    (this as any).emit('paused', { interviewId });
  },

  resumeChat(interviewId: number) {
    pauseFlags.set(interviewId, false);
    // @ts-ignore - this will be an EventEmitter instance at runtime
    (this as any).emit('resumed', { interviewId });
    // If there's a resume signal, call it to wake up the loop
    const signal = resumeSignals.get(interviewId);
    if (signal) {
      signal();
    }
  },

  getEvaluation(interviewId: number) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const result = db.exec('SELECT * FROM evaluations WHERE interview_id = ?', [interviewId]);
    if (result.length === 0 || result[0].values.length === 0) return null;

    const row = result[0].values[0];
    return {
      id: row[0] as number,
      interview_id: row[1] as number,
      summary: row[2] as string,
      pros: row[3] as string,
      cons: row[4] as string,
      suggestions: row[5] as string,
      created_at: row[6] as string
    };
  },

  async generateEvaluation(interviewId: number): Promise<any> {
    const interview = this.getById(interviewId);
    if (!interview) throw new Error('Interview not found');

    const messages = this.getMessages(interviewId);
    const conversationHistory = messages.map(m =>
      `${m.sender_name || m.sender_type}: ${m.content}`
    ).join('\n');

    const evaluationPrompt = `作为一个专业的面试评估专家，请根据以下面试对话，对求职者的表现进行评估。

面试职位: ${interview.position}
面试类型: ${interview.type === 'group' ? '群面' : '单面'}

对话历史:
${conversationHistory}

请给出以下格式的评估:
1. 总体评价 (summary): 对候选人整体表现的评价
2. 亮点时刻 (highlights): 候选人回答得最好的2-3个时刻，描述问题和精彩回答
3. 优点 (pros): 面试中展现的优点
4. 不足之处 (cons): 面试中暴露的不足
5. 改进建议 (suggestions): 针对不足的具体改进建议

请用JSON格式返回:
{"summary": "...", "highlights": [{"question": "...", "answer": "..."}, ...], "pros": [...], "cons": [...], "suggestions": [...]}`

    try {
      const response = await axios.post(
        MINIMAX_API_URL,
        {
          model: 'MiniMax-M2.7',
          max_tokens: 2048,
          messages: [
            { role: 'system', content: '你是一个专业的面试评估专家。' },
            { role: 'user', content: evaluationPrompt }
          ]
        },
        {
          headers: {
            'x-api-key': MINIMAX_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      // MiniMax 返回格式: { content: [{ type: "text", text: "..." }] }
      const contentArr = response.data.content;
      let contentText = '{}';
      if (Array.isArray(contentArr)) {
        const textItem = contentArr.find((c: any) => c.type === 'text');
        contentText = textItem?.text || '{}';
      }
      let evaluation;
      try {
        // Remove markdown code fences if present
        const cleanText = contentText.replace(/^```json\s*/g, '').replace(/\s*```$/g, '').trim();
        evaluation = JSON.parse(cleanText);
      } catch {
        evaluation = { summary: contentText, highlights: [], pros: '', cons: '', suggestions: '' };
      }

      // 确保highlights是数组格式
      if (!Array.isArray(evaluation.highlights)) {
        evaluation.highlights = [];
      }

      // 保存评估
      const db = getDb();
      if (db) {
        const stmt = db.prepare(`
          INSERT INTO evaluations (interview_id, summary, pros, cons, suggestions)
          VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run([interviewId, evaluation.summary || '', evaluation.pros || '', evaluation.cons || '', evaluation.suggestions || '']);
        saveDb();
      }

      return evaluation;
    } catch (error) {
      console.error('Evaluation API error:', error);
      return { summary: '评估生成失败', highlights: [], pros: '', cons: '', suggestions: '' };
    }
  },

  async generateRealtimeFeedback(interviewId: number, round: number): Promise<string> {
    const interview = this.getById(interviewId);
    if (!interview) return '';

    const messages = this.getMessages(interviewId);
    const recentMessages = messages.slice(-4); // Last 2 exchanges
    const conversationHistory = recentMessages.map(m =>
      `${m.sender_name || m.sender_type}: ${m.content}`
    ).join('\n');

    const feedbackPrompt = `作为一个专业的面试教练，请对求职者最近一轮的表现提供实时反馈。

【最近对话】
${conversationHistory}

请给出简短的反馈（30字以内），指出：
1. 回答中做得好的地方
2. 需要改进的地方
3. 具体建议

只返回反馈内容，不要其他解释。`;

    try {
      const response = await axios.post(
        MINIMAX_API_URL,
        {
          model: 'MiniMax-M2.7',
          max_tokens: 256,
          messages: [
            { role: 'system', content: '你是一个专业的面试教练，提供简洁有用的实时反馈。' },
            { role: 'user', content: feedbackPrompt }
          ]
        },
        {
          headers: {
            'x-api-key': MINIMAX_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.content;
      let feedback = '';
      if (Array.isArray(content)) {
        const textItem = content.find((c: any) => c.type === 'text');
        feedback = textItem?.text || '';
      }

      // Save feedback to database
      if (feedback) {
        const { feedbackService } = await import('./feedback.service.js');
        feedbackService.create(interviewId, round, 'realtime', feedback);
        // Emit feedback event via SSE
        (this as any).emit('feedback', { interviewId, content: feedback, round });
      }

      return feedback;
    } catch (error) {
      console.error('Feedback generation error:', error);
      return '';
    }
  },

  delete(interviewId: number): boolean {
    const db = getDb();
    if (!db) return false;

    try {
      // 删除消息
      db.run('DELETE FROM messages WHERE interview_id = ?', [interviewId]);
      // 删除评估
      db.run('DELETE FROM evaluations WHERE interview_id = ?', [interviewId]);
      // 删除面试
      db.run('DELETE FROM interviews WHERE id = ?', [interviewId]);
      saveDb();
      return true;
    } catch (error) {
      console.error('Delete interview error:', error);
      return false;
    }
  },

  async evaluateCoachingGuidance(coachingContent: string, conversationHistory: string, candidateProfile: string): Promise<{ accepted: boolean; reason: string; appliedContent?: string }> {
    const prompt = `【场景】你是一个友好的求职教练，帮助用户（面试官）更好地指导候选人。

【用户指导】"${coachingContent}"

【候选人背景】${candidateProfile}

【最近对话历史】
${conversationHistory}

【判断标准】（重点看前两条）
1. 指导是否有助于候选人展示优势或弥补不足？
2. 指导是否不会让候选人尴尬或难堪？
3. 指导是否与面试内容相关？

【重要原则】
- 只要指导不是明显错误、恶意或完全无关，就应该采纳
- 即使指导有些模糊，也可以采纳并给出具体化建议
- 拒绝应该是因为明确的、严重的问题

返回JSON：{"decision": "采纳或拒绝", "reason": "原因", "appliedContent": "如果采纳，给出如何应用这个指导的候选人回复示例"}`;

    try {
      const response = await axios.post(
        MINIMAX_API_URL,
        {
          model: 'MiniMax-M2.7',
          max_tokens: 2000,
          messages: [
            { role: 'system', content: '你是一个友好的求职教练。严格只返回JSON，不要任何其他内容。格式：{"decision": "采纳"或"拒绝", "reason": "原因", "appliedContent": "如果采纳给出候选人回复示例"}' },
            { role: 'user', content: prompt }
          ]
        },
        {
          headers: {
            'x-api-key': MINIMAX_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.content;
      let text = '{"decision": "拒绝", "reason": "无法判断", "appliedContent": ""}';
      if (Array.isArray(content)) {
        // First try to find text type (preferred - no thinking)
        const textItem = content.find((c: any) => c.type === 'text');
        if (textItem?.text) {
          text = textItem.text;
        } else {
          // Fall back to thinking type and extract JSON from it
          const thinkingItem = content.find((c: any) => c.type === 'thinking');
          if (thinkingItem?.thinking) {
            // Try to find JSON object in the thinking text
            const jsonMatch = thinkingItem.thinking.match(/\{[\s\S]*?"decision"[\s\S]*?\}/);
            if (jsonMatch) {
              text = jsonMatch[0];
            }
          }
        }
      }
      // Remove markdown code fences if present
      text = text.replace(/^```json\s*/g, '').replace(/\s*```$/g, '').trim();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        // Try to extract JSON object from potentially malformed response
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch {
            return { accepted: false, reason: '响应格式解析失败' };
          }
        } else {
          return { accepted: false, reason: '响应格式解析失败' };
        }
      }
      return {
        accepted: result.decision === '采纳',
        reason: result.reason || '',
        appliedContent: result.appliedContent || '',
      };
    } catch (error) {
      console.error('Coaching evaluation error:', error);
      return { accepted: false, reason: '服务暂时不可用' };
    }
  },

  async processCoaching(interviewId: number, coachingContent: string): Promise<{ accepted: boolean; reason: string; appliedContent?: string }> {
    const interview = this.getById(interviewId);
    if (!interview) return { accepted: false, reason: '面试不存在' };

    const messages = this.getMessages(interviewId);
    const conversationHistory = messages.map(m =>
      `${m.sender_name || m.sender_type}: ${m.content}`
    ).join('\n');

    // Get candidate profile
    const { profileService } = await import('./profile.service.js');
    const userProfile = profileService.getByUserId(interview.user_id);
    const candidateProfile = userProfile ? `目标岗位：${userProfile.target_position || ''}，技能：${userProfile.skills || ''}，经验：${userProfile.experience || ''}` : '未设置';

    const result = await this.evaluateCoachingGuidance(coachingContent, conversationHistory, candidateProfile);

    // Emit coaching events
    if (result.accepted) {
      (this as any).emit('coaching_accepted', { interviewId, original: coachingContent, applied: result.appliedContent });
    } else {
      (this as any).emit('coaching_rejected', { interviewId, original: coachingContent, reason: result.reason });
    }

    return result;
  }
};

// Create class instance and copy methods
const interviewServiceInstance = new InterviewServiceClass();
Object.assign(interviewServiceInstance, serviceMethods);
export const interviewService = interviewServiceInstance as InterviewServiceClass & typeof serviceMethods;
