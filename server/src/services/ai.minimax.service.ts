import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_API_URL = 'https://api.minimaxi.com/anthropic/v1/messages';

export interface AIResponse {
  content: string;
  error?: string;
}

export interface Agent {
  id?: number;
  name?: string;
  type?: 'candidate' | 'interviewer';
  education?: string;
  experience?: string;
  skills?: string;
  projects?: string;
  personality?: string;
  company?: string;
  style?: string;
  specialties?: string;
}

export interface Interview {
  position?: string;
  question?: string | null;
  candidate_agent_id?: number | null;
  interviewer_agent_id?: number | null;
}

/**
 * 获取 Agent 的描述信息
 */
function getAgentInfo(agent: Agent | null): string {
  if (!agent) return '';

  if (agent.type === 'candidate') {
    return `\n\n你是求职者 ${agent.name}，背景信息：学历-${agent.education || '未填写'}，经验-${agent.experience || '未填写'}，技能-${agent.skills || '未填写'}，性格-${agent.personality || '未填写'}。请以这个身份回答问题。`;
  } else {
    return `\n\n你是面试官 ${agent.name}，代表公司-${agent.company || '未填写'}，面试风格-${agent.style || '未填写'}，擅长领域-${agent.specialties || '未填写'}。请以这个身份进行面试。`;
  }
}

/**
 * 生成系统提示词
 */
function generateSystemPrompt(
  senderType: string,
  interview: Interview,
  agentInfo: string
): string {
  if (senderType === 'ai_interviewer') {
    return `你是一个专业的面试官，面试职位是${interview.position}。${agentInfo}请根据简历和对话历史，提出有针对性的问题。`;
  } else {
    return `你是一个求职者，面试职位是${interview.position}。${agentInfo}请根据面试官的问题，给出专业且得体的回答。`;
  }
}

/**
 * 调用 MiniMax API
 */
export async function callMiniMaxAPI(systemPrompt: string, userPrompt: string, maxTokens: number = 512): Promise<AIResponse> {
  try {
    const response = await axios.post(
      MINIMAX_API_URL,
      {
        model: 'MiniMax-M2.7',
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      },
      {
        headers: {
          'x-api-key': MINIMAX_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    // MiniMax 返回格式: { content: [{ type: "text", text: "..." }] }
    const content = response.data.content;
    let text = '抱歉，我暂时无法回答这个问题。';
    if (Array.isArray(content)) {
      const textItem = content.find((c: any) => c.type === 'text');
      text = textItem?.text || text;
    }

    return { content: text };
  } catch (error: any) {
    console.error('[AI Service] API error:', error?.response?.data || error?.message || error);
    return {
      content: '抱歉，AI 服务暂时不可用。',
      error: error?.message,
    };
  }
}

export const aiService = {
  /**
   * 生成 AI 响应（用户单面场景）
   */
  async generateResponse(
    interview: Interview,
    senderType: string,
    agent: Agent | null,
    conversationHistory: string
  ): Promise<AIResponse> {
    const agentInfo = getAgentInfo(agent);
    const question = interview.question || '请回答以下问题';
    const systemPrompt = generateSystemPrompt(senderType, interview, agentInfo);
    const userPrompt = `面试问题: ${question}\n\n对话历史:\n${conversationHistory}`;

    return callMiniMaxAPI(systemPrompt, userPrompt);
  },

  /**
   * 生成候选人自我介绍
   */
  async generateCandidateIntro(interview: Interview, candidateAgent: Agent): Promise<AIResponse> {
    const { name, education, experience, skills, personality } = candidateAgent;
    const introPrompt = `你是${name}，来面试${interview.position}岗位。

背景：学历${education}，经验${experience}，技术栈${skills}，性格${personality}。

要求：做一个简洁的自我介绍，60字以内，突出自己的特点和优势，自然像和真人聊天。`;

    return callMiniMaxAPI(introPrompt, '请做自我介绍', 300);
  },

  /**
   * 生成面试官问题
   */
  async generateInterviewerQuestion(
    interview: Interview,
    interviewerAgent: Agent,
    candidateAgent: Agent,
    conversationHistory: string,
    hasAskedTopics: {
      projects: boolean;
      tech: boolean;
      problems: boolean;
      system: boolean;
      team: boolean;
    }
  ): Promise<AIResponse> {
    const company = interviewerAgent.company || '其他';

    // 公司风格配置
    const companyStyles: Record<string, { style: string; focus: string }> = {
      '字节跳动': {
        style: '高效直接，喜欢挖掘技术深度，追问底层原理',
        focus: '喜欢问：算法复杂度、系统设计、技术选型理由、性能优化',
      },
      '阿里巴巴': {
        style: '技术广度与深度并重，关注工程化和业务理解',
        focus: '喜欢问：项目规模、团队协作、技术债如何处理、如何验证方案有效性',
      },
      '腾讯': {
        style: '亲和力强，喜欢循序渐进，关注候选人成长潜力',
        focus: '喜欢问：学习能力、解决问题的方法论、沟通协作',
      },
      '美团': {
        style: '务实派，关注候选人能不能干活',
        focus: '喜欢问：实际项目经验、最复杂的问题如何解决、代码review经历',
      },
      '其他': {
        style: '严谨专业，关注技术能力和综合素质',
        focus: '喜欢问：项目经验、技术难点、团队合作',
      },
    };

    const companyInfo = companyStyles[company] || companyStyles['其他'];

    // 根据公司和已问话题选择下一个话题
    let focusTopic = '';
    if (company === '字节跳动') {
      if (!hasAskedTopics.system) {
        focusTopic = '请追问系统设计：让他描述一个项目的整体架构，为什么要这样设计？';
      } else if (!hasAskedTopics.tech) {
        focusTopic = '请追问技术选型：为什么用A技术而不用B技术？';
      } else if (!hasAskedTopics.problems) {
        focusTopic = '请追问性能优化：项目中最棘手的性能问题是什么？怎么排查的？';
      } else {
        focusTopic = '请追问一个技术细节，比如某个算法的复杂度或者底层原理。';
      }
    } else if (company === '阿里巴巴') {
      if (!hasAskedTopics.team) {
        focusTopic = '请追问团队协作：项目中如何与产品/测试沟通？有没有遇到过需求冲突？';
      } else if (!hasAskedTopics.problems) {
        focusTopic = '请追问技术挑战：遇到过最大的技术难题是什么？怎么解决的？';
      } else if (!hasAskedTopics.projects) {
        focusTopic = '请让他介绍一下项目的技术栈和团队规模。';
      } else {
        focusTopic = '请追问项目中的具体技术方案选择和效果评估。';
      }
    } else if (company === '腾讯') {
      if (!hasAskedTopics.problems) {
        focusTopic = '请追问成长经历：遇到新技术是怎么学习的？有没有失败的经历？';
      } else if (!hasAskedTopics.projects) {
        focusTopic = '请让他介绍一下最让他有成就感的项目，你在里面扮演什么角色？';
      } else if (!hasAskedTopics.team) {
        focusTopic = '请追问协作经验：和团队成员意见不一致怎么办？';
      } else {
        focusTopic = '请追问一个具体的解决问题的方法或思路。';
      }
    } else {
      if (!hasAskedTopics.projects) {
        focusTopic = '请让他介绍一下最让他有成就感的项目，包括项目背景、具体负责的模块、遇到的难点和解决方案。';
      } else if (!hasAskedTopics.problems) {
        focusTopic = '请追问一个具体的技术难题，他是如何解决的呢？';
      } else if (!hasAskedTopics.tech) {
        focusTopic = '请问一下在实际项目中，如何做技术选型？有没有遇到过技术方案争论的情况？';
      } else {
        focusTopic = '请追问一个具体的细节，比如在项目中如何保证代码质量、有没有代码review的经历等。';
      }
    }

    const candidateProfile = `【候选人背景】\n- 姓名：${candidateAgent.name}\n- 学历：${candidateAgent.education || '未填写'}\n- 经验：${candidateAgent.experience || '未填写'}\n- 技能：${candidateAgent.skills || '未填写'}\n- 性格：${candidateAgent.personality || '未填写'}`;

    const systemPrompt = `你是${interviewerAgent.name}，${company}的资深面试官。

【你的面试风格】
${companyInfo.style}

【你关注的重点】
${companyInfo.focus}

【重要原则】
1. 每次只问1个核心问题，深入追问，不要泛泛而问
2. 仔细阅读对话历史，如果候选人已经回答了某个方向，不要再问类似问题
3. 追问时要针对候选人回答中的具体细节，不要重复问同样的问题
4. 回答要简洁有力，控制在50字以内
5. 如果某个话题已经问得很清楚，就不要再问，转向新话题

【避免重复】
你已经问过的话题不要重复追问：
- ${hasAskedTopics.projects ? '✓ 项目经验' : '○ 项目经验'}
- ${hasAskedTopics.problems ? '✓ 技术挑战' : '○ 技术挑战'}
- ${hasAskedTopics.tech ? '✓ 技术细节' : '○ 技术细节'}
- ${hasAskedTopics.system ? '✓ 系统设计' : '○ 系统设计'}
- ${hasAskedTopics.team ? '✓ 团队协作' : '○ 团队协作'}

【当前任务】
${focusTopic}

【对话历史】
${conversationHistory}

请生成面试官的问题，要简短、具体、有针对性。符合${company}的面试风格。`;

    return callMiniMaxAPI(systemPrompt, '请生成面试官的问题', 512);
  },

  /**
   * 生成候选人回答
   */
  async generateCandidateAnswer(
    interview: Interview,
    candidateAgent: Agent,
    lastQuestion: string,
    conversationHistory: string,
    previousAnswers: string[]
  ): Promise<AIResponse> {
    const hasIntroducedSelf = previousAnswers.some(a => a.includes('我叫') || a.includes('自我介绍'));
    const hasTalkedAboutProjects = previousAnswers.some(a => a.includes('项目'));

    let answerFocus = '';
    if (lastQuestion.includes('项目') || lastQuestion.includes('经历')) {
      if (!hasTalkedAboutProjects) {
        answerFocus = '选择一个具体的项目案例，详细说明背景、职责、技术栈、难点和成果。用真实细节回答。';
      } else {
        answerFocus = '选择一个之前没提到的具体项目细节来回答，或者深入讲一个之前提到的项目中的具体问题。';
      }
    } else if (lastQuestion.includes('挑战') || lastQuestion.includes('难点') || lastQuestion.includes('问题')) {
      answerFocus = '讲一个具体的技术挑战，不要只说"遇到困难就查文档"这种套话，要说具体的、有细节的例子。';
    } else if (lastQuestion.includes('技术')) {
      answerFocus = '结合实际经验讲，不要只说技术名词，要说这个技术在实际项目中怎么用的、解决了什么问题。';
    } else {
      answerFocus = '回答要具体，有例子支撑，避免空泛的套话。';
    }

    const { name, education, experience, skills, personality } = candidateAgent;

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
${lastQuestion}

【回答要求】
${answerFocus}

【对话历史】
${conversationHistory}

请生成候选人的回答，要自然、具体、有个人特色。`;

    return callMiniMaxAPI(systemPrompt, '请生成候选人的回答', 512);
  },

  /**
   * 生成实时反馈
   */
  async generateRealtimeFeedback(
    interview: Interview,
    recentMessages: string
  ): Promise<AIResponse> {
    const feedbackPrompt = `作为一个专业的面试教练，请对求职者最近一轮的表现提供实时反馈。

【最近对话】
${recentMessages}

请给出简短的反馈（30字以内），指出：
1. 回答中做得好的地方
2. 需要改进的地方
3. 具体建议

只返回反馈内容，不要其他解释。`;

    return callMiniMaxAPI(
      '你是一个专业的面试教练，提供简洁有用的实时反馈。',
      feedbackPrompt,
      256
    );
  },
};
