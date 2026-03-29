import { EventEmitter } from 'events';
import { getDb, saveDb } from '../db/index.js';
import { agentService, Agent } from './agent.service.js';
import { messageService, Message } from './message.service.js';
import { aiService, callMiniMaxAPI } from './ai.service.js';
import { evaluationService } from './evaluation.service.js';

const MAX_ACTIVE_ROOMS = 10;

// Pause flags for each interview
const pauseFlags = new Map<number, boolean>();

// Resume signals for each interview (to wake up paused loops)
const resumeSignals = new Map<number, () => void>();

export interface Interview {
  id: number;
  user_id: number;
  room_code: string;
  type: 'group' | 'single';
  position: string;
  question: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  duration: number;
  candidate_agent_id?: number | null;
  interviewer_agent_id?: number | null;
  created_at: string;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function rowToInterview(row: any[]): Interview {
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
    created_at: row[8] as string,
  };
}

// Create a proper EventEmitter-backed service
class InterviewServiceClass extends EventEmitter {
  /**
   * 创建面试
   */
  create(userId: number, type: 'group' | 'single', position: string, candidateAgentId?: number, interviewerAgentId?: number): Interview {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    // 检查该用户的活跃房间数（单面和群面都算）
    const activeRooms = db.exec(
      `SELECT COUNT(*) FROM interviews WHERE user_id = ${userId} AND status = 'in_progress'`
    );
    const count = activeRooms[0]?.values[0]?.[0] as number || 0;
    if (count >= MAX_ACTIVE_ROOMS) {
      throw new Error(`当前活跃房间已达上限(${MAX_ACTIVE_ROOMS})，请先结束已有面试`);
    }

    // 生成面试题目
    const question = this.generateQuestion(position);

    // 生成唯一房间码
    let roomCode: string;
    do {
      roomCode = generateRoomCode();
      const checkStmt = db.prepare('SELECT id FROM interviews WHERE room_code = ?');
      checkStmt.bind([roomCode]);
      const exists = checkStmt.step();
      checkStmt.free();
      if (!exists) break;
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
      created_at: new Date().toISOString(),
    };
  }

  /**
   * 获取活跃房间数
   */
  getActiveRoomCount(): number {
    const db = getDb();
    if (!db) return 0;

    const result = db.exec(
      "SELECT COUNT(*) FROM interviews WHERE type = 'single' AND status = 'in_progress'"
    );
    return result[0]?.values[0]?.[0] as number || 0;
  }

  /**
   * 根据房间码获取面试
   */
  getByRoomCode(roomCode: string): Interview | null {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('SELECT * FROM interviews WHERE room_code = ?');
    stmt.bind([roomCode]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();

    return {
      id: row.id as number,
      user_id: row.user_id as number,
      room_code: row.room_code as string,
      type: row.type as 'group' | 'single',
      position: row.position as string,
      question: row.question as string | null,
      status: row.status as 'pending' | 'in_progress' | 'completed',
      duration: row.duration as number,
      candidate_agent_id: row.candidate_agent_id as number | null,
      interviewer_agent_id: row.interviewer_agent_id as number | null,
      created_at: row.created_at as string,
    };
  }

  /**
   * 生成面试题目
   */
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
  }

  /**
   * 根据 ID 获取面试
   */
  getById(id: number): Interview | null {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('SELECT * FROM interviews WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();

    return {
      id: row.id as number,
      user_id: row.user_id as number,
      room_code: row.room_code as string,
      type: row.type as 'group' | 'single',
      position: row.position as string,
      question: row.question as string | null,
      status: row.status as 'pending' | 'in_progress' | 'completed',
      duration: row.duration as number,
      candidate_agent_id: row.candidate_agent_id as number | null,
      interviewer_agent_id: row.interviewer_agent_id as number | null,
      created_at: row.created_at as string,
    };
  }

  /**
   * 获取用户面试历史
   */
  getHistory(userId: number): Interview[] {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('SELECT * FROM interviews WHERE user_id = ? ORDER BY created_at DESC');
    stmt.bind([userId]);
    const interviews: Interview[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      interviews.push({
        id: row.id as number,
        user_id: row.user_id as number,
        room_code: row.room_code as string,
        type: row.type as 'group' | 'single',
        position: row.position as string,
        question: row.question as string | null,
        status: row.status as 'pending' | 'in_progress' | 'completed',
        duration: row.duration as number,
        candidate_agent_id: row.candidate_agent_id as number | null,
        interviewer_agent_id: row.interviewer_agent_id as number | null,
        created_at: row.created_at as string,
      });
    }
    stmt.free();
    return interviews;
  }

  /**
   * 添加消息
   */
  addMessage(interviewId: number, senderType: string, senderName: string | null, content: string): Message {
    return messageService.create(interviewId, senderType, senderName, content);
  }

  /**
   * 获取消息列表
   */
  getMessages(interviewId: number): Message[] {
    return messageService.getByInterviewId(interviewId);
  }

  /**
   * 判断是否应该继续面试
   */
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
  }

  /**
   * 开始 Agent 对话
   */
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

    const result = await aiService.generateCandidateIntro(interview, candidateAgent);

    // 添加候选人自我介绍消息
    const introMessage = this.addMessage(interviewId, 'ai_candidate', candidateAgent.name, result.content);
    // @ts-ignore - this will be an EventEmitter instance at runtime
    (this as any).emit('message', { interviewId, message: introMessage, agent: 'candidate' });

    // 同步生成面试官回应并添加到消息
    const replyMessage = await this.generateInterviewerResponseMessage(interviewId);

    return replyMessage ? [introMessage, replyMessage] : [introMessage];
  }

  /**
   * 生成面试官回复消息
   */
  async generateInterviewerResponseMessage(interviewId: number): Promise<Message | null> {
    const interview = this.getById(interviewId);
    if (!interview || !interview.interviewer_agent_id || !interview.candidate_agent_id) return null;

    const messages = this.getMessages(interviewId);
    const interviewerAgent = agentService.getById(interview.interviewer_agent_id);
    const candidateAgent = agentService.getById(interview.candidate_agent_id);

    if (!interviewerAgent || !candidateAgent) return null;

    const conversationHistory = messageService.getConversationHistory(interviewId);

    // 分析候选人之前的回答，避免重复提问
    const candidateResponses = messages.filter(m => m.sender_type === 'ai_candidate').map(m => m.content);
    const askedTopics = candidateResponses.join('');

    // 判断已问过的话题
    const hasAskedAboutProjects = askedTopics.includes('项目');
    const hasAskedAboutTech = askedTopics.includes('技术') || askedTopics.includes('React') || askedTopics.includes('TypeScript');
    const hasAskedAboutProblems = askedTopics.includes('问题') || askedTopics.includes('挑战') || askedTopics.includes('困难');
    const hasAskedAboutSystem = askedTopics.includes('系统') || askedTopics.includes('架构') || askedTopics.includes('设计');
    const hasAskedAboutTeam = askedTopics.includes('团队') || askedTopics.includes('协作') || askedTopics.includes('合作');

    const result = await aiService.generateInterviewerQuestion(
      interview,
      interviewerAgent,
      candidateAgent,
      conversationHistory,
      {
        projects: hasAskedAboutProjects,
        tech: hasAskedAboutTech,
        problems: hasAskedAboutProblems,
        system: hasAskedAboutSystem,
        team: hasAskedAboutTeam,
      }
    );

    // 添加面试官回复
    const message = this.addMessage(interviewId, 'ai_interviewer', interviewerAgent.name, result.content);
    // @ts-ignore - this will be an EventEmitter instance at runtime
    (this as any).emit('message', { interviewId, message, agent: 'interviewer' });

    return message;
  }

  /**
   * 生成候选人回复消息
   */
  async generateCandidateResponseMessage(interviewId: number): Promise<Message | null> {
    const interview = this.getById(interviewId);
    if (!interview || !interview.interviewer_agent_id || !interview.candidate_agent_id) return null;

    const messages = this.getMessages(interviewId);
    const interviewerAgent = agentService.getById(interview.interviewer_agent_id);
    const candidateAgent = agentService.getById(interview.candidate_agent_id);

    if (!interviewerAgent || !candidateAgent) return null;

    const conversationHistory = messageService.getConversationHistory(interviewId);

    // 获取面试官的最后一条问题
    const lastInterviewQuestion = [...messages].reverse().find(m => m.sender_type === 'ai_interviewer')?.content || '';

    const previousAnswers = messages.filter(m => m.sender_type === 'ai_candidate').map(m => m.content);

    const result = await aiService.generateCandidateAnswer(
      interview,
      candidateAgent,
      lastInterviewQuestion,
      conversationHistory,
      previousAnswers
    );

    // 添加候选人回复
    const message = this.addMessage(interviewId, 'ai_candidate', candidateAgent.name, result.content);
    // @ts-ignore - this will be an EventEmitter instance at runtime
    (this as any).emit('message', { interviewId, message, agent: 'candidate' });

    // After candidate response, generate feedback
    const currentMessages = this.getMessages(interviewId);
    const round = Math.floor(currentMessages.length / 2);
    const recentMessages = messages.slice(-4);
    const recentMessagesStr = recentMessages.map(m =>
      `${m.sender_name || m.sender_type}: ${m.content}`
    ).join('\n');
    const feedback = await aiService.generateRealtimeFeedback(interview, recentMessagesStr);

    // Emit feedback event via SSE
    if (feedback.content) {
      const { feedbackService } = await import('./feedback.service.js');
      feedbackService.create(interviewId, round, 'realtime', feedback.content);
      // @ts-ignore - this will be an EventEmitter instance at runtime
      (this as any).emit('feedback', { interviewId, content: feedback.content, round });
    }

    return message;
  }

  /**
   * 继续 Agent 多轮对话
   */
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
  }

  /**
   * 开始后台对话
   */
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

    // Continue conversation loop
    let shouldContinue = true;
    while (shouldContinue) {
      // Wait for thinking time (same as client-side delay)
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
  }

  /**
   * 继续已有对话（不重新开始自我介绍）
   */
  continueBackgroundChat(interviewId: number): void {
    console.log(`[ContinueBackgroundChat] Continuing chat for interview ${interviewId}`);

    // 在后台异步执行对话循环
    this.continueChatLoop(interviewId);
  }

  /**
   * 继续对话循环
   */
  async continueChatLoop(interviewId: number): Promise<void> {
    // Continue the conversation loop
    let shouldContinue = true;
    while (shouldContinue) {
      // Wait for thinking time
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
  }

  /**
   * 完成面试
   */
  complete(interviewId: number): void {
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
  }

  /**
   * 暂停对话
   */
  pauseChat(interviewId: number): void {
    pauseFlags.set(interviewId, true);
    // @ts-ignore - this will be an EventEmitter instance at runtime
    (this as any).emit('paused', { interviewId });
  }

  /**
   * 恢复对话
   */
  resumeChat(interviewId: number): void {
    pauseFlags.set(interviewId, false);
    // @ts-ignore - this will be an EventEmitter instance at runtime
    (this as any).emit('resumed', { interviewId });

    // If there's a resume signal, call it to wake up the loop
    const signal = resumeSignals.get(interviewId);
    if (signal) {
      signal();
    }
  }

  /**
   * 获取评估
   */
  getEvaluation(interviewId: number) {
    return evaluationService.getByInterviewId(interviewId);
  }

  /**
   * 生成评估
   */
  async generateEvaluation(interviewId: number) {
    const interview = this.getById(interviewId);
    if (!interview) throw new Error('Interview not found');

    const conversationHistory = messageService.getConversationHistory(interviewId);

    return evaluationService.generateEvaluation(
      interviewId,
      interview.position,
      interview.type,
      conversationHistory
    );
  }

  /**
   * 生成实时反馈
   */
  async generateRealtimeFeedback(interviewId: number, round: number): Promise<string> {
    const interview = this.getById(interviewId);
    if (!interview) return '';

    const messages = this.getMessages(interviewId);
    const recentMessages = messages.slice(-4);
    const recentMessagesStr = recentMessages.map(m =>
      `${m.sender_name || m.sender_type}: ${m.content}`
    ).join('\n');

    const result = await aiService.generateRealtimeFeedback(interview, recentMessagesStr);

    return result.content;
  }

  /**
   * 处理指导评估
   */
  async evaluateCoachingGuidance(coachingContent: string, conversationHistory: string, candidateProfile: string) {
    return callMiniMaxAPI(
      `【场景】你是一个友好的求职教练，帮助用户（面试官）更好地指导候选人。

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

返回JSON：{"decision": "采纳或拒绝", "reason": "原因", "appliedContent": "如果采纳，给出如何应用这个指导的候选人回复示例"}`,
      '你是一个友好的求职教练。严格只返回JSON，不要任何其他内容。格式：{"decision": "采纳"或"拒绝", "reason": "原因", "appliedContent": "如果采纳给出候选人回复示例"}'
    );
  }

  /**
   * 处理指导
   */
  async processCoaching(interviewId: number, coachingContent: string) {
    const interview = this.getById(interviewId);
    if (!interview) return { accepted: false, reason: '面试不存在' };

    const messages = this.getMessages(interviewId);
    const conversationHistory = messageService.getConversationHistory(interviewId);

    // Get candidate profile
    const { profileService } = await import('./profile.service.js');
    const userProfile = profileService.getByUserId(interview.user_id);
    const candidateProfile = userProfile ? `目标岗位：${userProfile.target_position || ''}，技能：${userProfile.skills || ''}，经验：${userProfile.experience || ''}` : '未设置';

    const result = await this.evaluateCoachingGuidance(coachingContent, conversationHistory, candidateProfile);

    // Parse the JSON response
    let parsed: { decision: string; reason: string; appliedContent: string } | null = null;
    try {
      const cleanText = result.content.replace(/^```json\s*/g, '').replace(/\s*```$/g, '').trim();
      parsed = JSON.parse(cleanText);
    } catch {
      // JSON parse failed
    }

    // Emit coaching events
    if (parsed?.decision === '采纳') {
      (this as any).emit('coaching_accepted', { interviewId, original: coachingContent, applied: parsed.appliedContent });
      return { accepted: true, reason: '', appliedContent: parsed.appliedContent };
    } else {
      (this as any).emit('coaching_rejected', { interviewId, original: coachingContent, reason: parsed?.reason || '解析失败' });
      return { accepted: false, reason: parsed?.reason || '解析失败' };
    }
  }

  /**
   * 删除面试
   */
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
}

// Create class instance and copy methods
const interviewServiceInstance = new InterviewServiceClass();
Object.assign(interviewServiceInstance, new InterviewServiceClass() as any);
export const interviewService = interviewServiceInstance as InterviewServiceClass;
