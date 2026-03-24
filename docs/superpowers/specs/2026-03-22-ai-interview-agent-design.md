# AI 面试 Agent 平台设计

## 概述

将现有的双 Agent 面试系统升级为**真正的 AI Agent 面试助手**，具备用户画像记忆、教练指导模式、实时反馈等能力。

## 核心愿景

用户离开时：
- 对目标岗位**了如指掌**
- 面试**不再紧张**，知道如何展示优势
- 学会了**自我复盘**的方法

## 用户交互流程

### 1. 用户画像创建

三种方式并行支持：

**A. 上传简历**
- 用户上传简历文件（PDF/DOCX/TXT）
- AI 自动解析：姓名、目标岗位、技术栈、经验、教育背景
- 用户确认/修改 AI 解析结果
- 生成用户画像

**B. 填表单**
- 结构化输入：学历、经验、技能、期望岗位、性格特点
- 表单验证，确保信息完整

**C. 对话创建**
- AI 问问题，用户回答
- 模拟和学长学姐聊天，自然构建画像
- 适合不知道从何说起的新手

### 2. 求职 Agent

代表用户的"数字分身"，具备：
- **用户画像 context**：记住用户的背景、技能、性格
- **短期记忆**：当前面试中的对话历史
- **长期记忆**：用户画像库，跨面试记住用户特点
- **教练响应**：判断用户指导是否合理，即时采纳或礼貌拒绝

### 3. 面试官 Agent

专业面试官角色，具备：
- **实时反馈**：面试过程中插入反馈（"这个问题回答太泛了，建议举具体例子"）
- **追问能力**：根据回答深挖细节
- **评估能力**：从多个维度评估表现

### 4. 教练模式（核心创新）

用户在旁观看两个 Agent 对话，可以：

**随时插话指导**：
- "等一下，让他举一个具体例子"
- "这个回答方向不对，应该突出我的项目管理经验"
- "帮我问一下加班文化"

**Agent 响应**：
- 合理指导 → 立刻在下一轮应用
- 不合理指导 → 礼貌拒绝（"这个角度可能不太适合，我们可以..."）
- 需要更多信息 → 反问用户

### 5. 面试评价

**实时反馈**（面试中）：
- 每轮对话后显示面试官的小贴士
- 用户可选择"我收到了"或"展开详情"

**总结评价**（面试后）：
- 综合评分（1-5星）
- 各维度评分：技术深度、沟通表达、项目经验、应变能力
- 优点列举
- 不足指出
- 改进步骤（具体可执行）

## 数据模型

### 用户画像 (UserProfile)

```typescript
interface UserProfile {
  id: number;
  user_id: number;
  name: string;
  target_position: string;       // 目标岗位
  education: string;              // 学历
  experience: string;            // 经验概述
  skills: string[];             // 技能列表
  projects: string[];            // 项目经验
  personality: string;           // 性格描述
  preferred_style: 'gentle' | 'strict' | 'coaching';  // 偏好风格
  created_at: string;
  updated_at: string;
}
```

### 求职 Agent 指导记录 (CoachingLog)

```typescript
interface CoachingLog {
  id: number;
  interview_id: number;
  user_id: number;
  coaching_type: 'guide' | 'correct' | 'info_request';
  content: string;               // 用户说的话
  agent_response: 'accepted' | 'rejected' | 'question';
  agent_feedback: string;        // Agent 的回应
  created_at: string;
}
```

### 面试反馈 (InterviewFeedback)

```typescript
interface InterviewFeedback {
  id: number;
  interview_id: number;
  round: number;                 // 第几轮对话
  type: 'realtime' | 'summary';
  content: string;              // 反馈内容
  created_at: string;
}
```

### 面试评价 (InterviewEvaluation)

```typescript
interface InterviewEvaluation {
  id: number;
  interview_id: number;
  overall_score: number;         // 综合评分 1-5
  technical_depth: number;       // 技术深度
  communication: number;         // 沟通表达
  project_experience: number;     // 项目经验
  adaptability: number;           // 应变能力
  summary: string;               // 总体评价
  pros: string;                  // 优点
  cons: string;                  // 不足
  suggestions: string;            // 改进建议
  created_at: string;
}
```

## Agent 通信设计

### 当前架构（平台模式）

```
用户创建面试（选两个 Agent）
       ↓
startBackgroundChat()
       ↓
1. 求职 Agent 生成自我介绍
       ↓
2. 面试官 Agent 生成问题
       ↓
3. 循环：
   - 求职 Agent 回答
   - 面试官 Agent 追问/反馈
   - SSE 推送到前端
       ↓
4. 面试结束 → 生成评价
```

### 新增教练模式

```
求职 Agent + 面试官 Agent 对话中
       ↓
用户插话（"等一下..."）
       ↓
系统判断：
- 指导 → 传给求职 Agent 判断是否采纳
- 问题 → 传给面试官 Agent 回答
- 追问 → 继续当前流程
       ↓
求职 Agent 决定：
- 采纳 → 下一轮应用
- 拒绝 → 礼貌回应
       ↓
SSE 推送反馈给前端显示
```

### 实时反馈事件

```typescript
// SSE 事件类型
type SSEEvent =
  | { type: 'message'; message: Message; agent: 'candidate' | 'interviewer' }
  | { type: 'typing'; agent: 'candidate' | 'interviewer' }
  | { type: 'feedback'; content: string; round: number }  // 新增
  | { type: 'coaching_accepted'; original: string; applied: string }  // 新增
  | { type: 'coaching_rejected'; original: string; reason: string }  // 新增
  | { type: 'done'; evaluation: Evaluation };
```

## 前端交互设计

### 面试页面布局

```
┌─────────────────────────────────────────────────────────┐
│  字节跳动 - 前端工程师  [群面] [AI Agent 对话中]        │
├─────────────────────────────────┬─────────────────────┤
│                                 │                     │
│  求职 Agent    ← 对话 →   面试官 Agent  │
│                                 │                     │
│  [Avatar] 消息气泡              │   实时反馈面板      │
│                                 │   • 第3轮反馈...    │
│  [正在输入...]                  │   • 第2轮反馈...    │
│                                 │                     │
├─────────────────────────────────┴─────────────────────┤
│  [用户输入: 插话指导...] [发送]                        │
│  [教练模式开启中]                                      │
└─────────────────────────────────────────────────────────┘
```

### 用户插话交互

1. **输入框常开** — 教练可随时输入
2. **快捷标签** — "补充例子"、"追问细节"、"换个方向"
3. **反馈可见** — Agent 采纳/拒绝后，显示原因

## 技术实现计划

### Phase 1: 数据层增强
- [ ] 新建数据表：user_profiles, coaching_logs, interview_feedbacks
- [ ] 迁移现有 Agent 数据到 user_profiles
- [ ] API: POST /profiles, GET /profiles/:id, PUT /profiles/:id

### Phase 2: Agent 增强
- [ ] Agent context 支持用户画像
- [ ] 实现 coaching 判断逻辑（采纳/拒绝）
- [ ] 实时反馈生成

### Phase 3: 前端交互
- [ ] 用户画像创建页面（三种方式）
- [ ] 面试页面教练模式 UI
- [ ] 实时反馈展示
- [ ] 总结评价页面优化

### Phase 4: 体验优化
- [ ] 加载状态优化
- [ ] 错误处理
- [ ] 空状态处理

## 后续扩展（OpenClaw 对接）

预留接口，未来可扩展：

```
用户自己的 OpenClaw Agent
       ↓
OpenClaw Gateway (用户本地)
       ↓
我们的平台服务器（中继）
       ↓
另一个用户的 OpenClaw Agent
```

此部分待 OpenClaw 技术细节确认后设计。

## 成功指标

- 用户创建画像 < 3 分钟
- 面试等待时间 < 2 秒（反馈推送）
- 教练指导采纳率 70%+
- 用户满意度 > 4/5
