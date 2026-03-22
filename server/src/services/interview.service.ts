import { EventEmitter } from 'events';
import { getDb, saveDb } from '../db/index.js';
import { agentService } from './agent.service.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_API_URL = 'https://api.minimaxi.com/anthropic/v1/messages';
const MAX_ACTIVE_ROOMS = 10;

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
    } catch (error) {
      console.error('AI API error:', error);
      return '抱歉，AI 服务暂时不可用。';
    }
  },

  async startAgentChat(interviewId: number): Promise<Message[]> {
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
      this.emit('message', { interviewId, message: introMessage, agent: 'candidate' });

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

    // 更人性化的面试官提示词
    const personality = interviewerAgent.personality || interviewerAgent.style || '严谨专业';
    const company = interviewerAgent.company || '知名公司';
    const specialties = interviewerAgent.specialties || '技术面试';

    // 分析候选人之前的回答，避免重复提问
    const candidateResponses = messages.filter(m => m.sender_type === 'ai_candidate').map(m => m.content);
    const askedTopics = candidateResponses.join('');

    // 判断已问过的话题
    const hasAskedAboutProjects = askedTopics.includes('项目');
    const hasAskedAboutTech = askedTopics.includes('技术') || askedTopics.includes('React') || askedTopics.includes('TypeScript');
    const hasAskedAboutProblems = askedTopics.includes('问题') || askedTopics.includes('挑战') || askedTopics.includes('困难');

    let focusTopic = '';
    if (!hasAskedAboutProjects) {
      focusTopic = '请让他介绍一下最让他有成就感的项目，包括项目背景、具体负责的模块、遇到的难点和解决方案。';
    } else if (!hasAskedAboutProblems) {
      focusTopic = '请追问一个具体的技术难题，他是如何解决的呢？';
    } else if (!hasAskedAboutTech) {
      focusTopic = '请问一下在实际项目中，如何做技术选型？有没有遇到过技术方案争论的情况？';
    } else {
      focusTopic = '请追问一个具体的细节，比如在项目中如何保证代码质量、有没有代码review的经历等。';
    }

    const systemPrompt = `你是${interviewerAgent.name}，一名${company}的资深面试官，面试风格${personality}，擅长${specialties}。

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

【当前任务】
${focusTopic}

【对话历史】
${conversationHistory}

请生成面试官的问题，要简短、具体、有针对性。`;

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
      this.emit('message', { interviewId, message, agent: 'interviewer' });
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
      this.emit('message', { interviewId, message, agent: 'candidate' });
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
      return { continue: false, reason: '对话已足够深入' };
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

    // 1. 先生成候选人的回复
    const candidateResponse = await this.generateCandidateResponseMessage(interviewId);
    if (candidateResponse) {
      newMessages.push(candidateResponse);
    } else {
      return { messages: [], shouldContinue: false };
    }

    // 2. 等待一下再生成面试官的回复（模拟思考时间）
    await new Promise(resolve => setTimeout(resolve, 6000));

    // 3. 检查是否应该继续
    const { continue: shouldContinue } = this.shouldContinueInterview(interviewId);
    if (!shouldContinue) {
      // 如果不应该继续，返回候选人消息但不继续面试官回复
      return { messages: newMessages, shouldContinue: false };
    }

    // 4. 生成面试官的回复
    const interviewerResponse = await this.generateInterviewerResponseMessage(interviewId);
    if (interviewerResponse) {
      newMessages.push(interviewerResponse);
    }

    return { messages: newMessages, shouldContinue };
  },

  async startBackgroundChat(interviewId: number): Promise<void> {
    const interview = this.getById(interviewId);
    if (!interview) return;

    // Start with initial agent chat
    const initialMessages = await this.startAgentChat(interviewId);
    if (initialMessages.length === 0) return;

    // Emit typing event to indicate conversation is starting
    // @ts-ignore - this will be an EventEmitter instance at runtime
    this.emit('typing', { interviewId, agent: 'interviewer' });

    // Continue the conversation loop
    let shouldContinue = true;
    while (shouldContinue) {
      // Wait for the thinking time (same as client-side delay)
      await new Promise(resolve => setTimeout(resolve, 6000));

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
    this.emit('typing', { interviewId, agent: 'interviewer' });
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
    this.emit('done', { interviewId });
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
1. 总体评价 (summary)
2. 优点 (pros)
3. 不足之处 (cons)
4. 改进建议 (suggestions)

请用JSON格式返回。`;

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
        evaluation = JSON.parse(contentText);
      } catch {
        evaluation = { summary: contentText, pros: '', cons: '', suggestions: '' };
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
      return { summary: '评估生成失败', pros: '', cons: '', suggestions: '' };
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
  }
};

// Create class instance and copy methods
const interviewServiceInstance = new InterviewServiceClass();
Object.assign(interviewServiceInstance, serviceMethods);
export const interviewService = interviewServiceInstance as InterviewServiceClass & typeof serviceMethods;
