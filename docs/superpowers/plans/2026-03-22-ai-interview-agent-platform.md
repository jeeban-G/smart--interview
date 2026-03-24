# AI Interview Agent Platform Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the AI Interview Agent Platform with user profiles, coach mode, and real-time feedback.

**Architecture:** Phase 1 adds database tables and REST APIs for user profiles, coaching logs, and interview feedback. Phase 2 enhances the agent service with profile context and coaching logic. Phase 3 builds the React UI for profile creation and coach mode. Phase 4 optimizes loading and error states.

**Tech Stack:** Express + TypeScript (server), React + TypeScript + Vite (client), SQLite via sql.js, MiniMax API for AI generation, SSE for real-time events.

---

## File Structure

```
server/src/
├── db/index.ts                  # Database initialization + new tables
├── routes/
│   ├── profile.ts               # NEW: User profile CRUD routes
│   ├── coaching.ts              # NEW: Coaching log routes
│   └── interview.ts             # MODIFY: Add feedback routes
├── services/
│   ├── profile.service.ts       # NEW: Profile business logic
│   ├── coaching.service.ts       # NEW: Coaching log business logic
│   └── interview.service.ts     # MODIFY: Add real-time feedback + coaching

client/src/
├── pages/
│   ├── ProfileCreate.tsx        # NEW: Three-mode profile creation
│   ├── Interview.tsx            # MODIFY: Add coach mode UI
│   └── Home.tsx                 # MODIFY: Add profile entry point
├── components/
│   ├── FeedbackPanel.tsx        # NEW: Real-time feedback display
│   ├── CoachInput.tsx           # NEW: Coach mode input
│   └── EvaluationReport.tsx     # MODIFY: Add detailed scores
└── services/api.ts              # MODIFY: Add profile/coaching APIs
```

---

## Chunk 1: Phase 1 - Data Layer

### Task 1: Add database tables

**Files:**
- Modify: `server/src/db/index.ts:1-131`

- [ ] **Step 1: Add new table creation statements**

After line 93 (after `agents` table creation), add:

```typescript
  // user_profiles table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      target_position TEXT,
      education TEXT,
      experience TEXT,
      skills TEXT,
      projects TEXT,
      personality TEXT,
      preferred_style TEXT DEFAULT 'gentle',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // coaching_logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS coaching_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interview_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      coaching_type TEXT NOT NULL,
      content TEXT NOT NULL,
      agent_response TEXT DEFAULT 'pending',
      agent_feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (interview_id) REFERENCES interviews(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // interview_feedbacks table
  db.run(`
    CREATE TABLE IF NOT EXISTS interview_feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interview_id INTEGER NOT NULL,
      round INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (interview_id) REFERENCES interviews(id)
    )
  `);

  // Update evaluations table to include new fields (add columns if not exist)
  try {
    db.run('ALTER TABLE evaluations ADD COLUMN overall_score INTEGER');
  } catch (e) { /* ignore */ }
  try {
    db.run('ALTER TABLE evaluations ADD COLUMN technical_depth INTEGER');
  } catch (e) { /* ignore */ }
  try {
    db.run('ALTER TABLE evaluations ADD COLUMN communication INTEGER');
  } catch (e) { /* ignore */ }
  try {
    db.run('ALTER TABLE evaluations ADD COLUMN project_experience INTEGER');
  } catch (e) { /* ignore */ }
  try {
    db.run('ALTER TABLE evaluations ADD COLUMN adaptability INTEGER');
  } catch (e) { /* ignore */ }
```

- [ ] **Step 2: Verify database initializes without error**

Run: `cd /Users/jeeban/smart--interview/server && npx tsx src/index.ts`
Expected: Server starts without SQL errors

### Task 2: Create profile service

**Files:**
- Create: `server/src/services/profile.service.ts`

- [ ] **Step 1: Write profile service**

```typescript
import { getDb, saveDb } from '../db/index.js';

interface UserProfile {
  id: number;
  user_id: number;
  name: string;
  target_position: string | null;
  education: string | null;
  experience: string | null;
  skills: string | null;
  projects: string | null;
  personality: string | null;
  preferred_style: 'gentle' | 'strict' | 'coaching';
  created_at: string;
  updated_at: string;
}

function rowToProfile(row: any[]): UserProfile {
  return {
    id: row[0] as number,
    user_id: row[1] as number,
    name: row[2] as string,
    target_position: row[3] as string | null,
    education: row[4] as string | null,
    experience: row[5] as string | null,
    skills: row[6] as string | null,
    projects: row[7] as string | null,
    personality: row[8] as string | null,
    preferred_style: (row[9] as string) as 'gentle' | 'strict' | 'coaching',
    created_at: row[10] as string,
    updated_at: row[11] as string,
  };
}

export const profileService = {
  create(userId: number, data: Partial<UserProfile>): UserProfile {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
      INSERT INTO user_profiles (user_id, name, target_position, education, experience, skills, projects, personality, preferred_style)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      userId,
      data.name || '',
      data.target_position || null,
      data.education || null,
      data.experience || null,
      data.skills || null,
      data.projects || null,
      data.personality || null,
      data.preferred_style || 'gentle',
    ]);
    saveDb();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;
    return this.getById(id)!;
  },

  getById(id: number): UserProfile | null {
    const db = getDb();
    if (!db) return null;
    const result = db.exec('SELECT * FROM user_profiles WHERE id = ?', [id]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    return rowToProfile(result[0].values[0]);
  },

  getByUserId(userId: number): UserProfile | null {
    const db = getDb();
    if (!db) return null;
    const result = db.exec('SELECT * FROM user_profiles WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1', [userId]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    return rowToProfile(result[0].values[0]);
  },

  update(id: number, data: Partial<UserProfile>): UserProfile | null {
    const db = getDb();
    if (!db) return null;
    const existing = this.getById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.target_position !== undefined) { fields.push('target_position = ?'); values.push(data.target_position); }
    if (data.education !== undefined) { fields.push('education = ?'); values.push(data.education); }
    if (data.experience !== undefined) { fields.push('experience = ?'); values.push(data.experience); }
    if (data.skills !== undefined) { fields.push('skills = ?'); values.push(data.skills); }
    if (data.projects !== undefined) { fields.push('projects = ?'); values.push(data.projects); }
    if (data.personality !== undefined) { fields.push('personality = ?'); values.push(data.personality); }
    if (data.preferred_style !== undefined) { fields.push('preferred_style = ?'); values.push(data.preferred_style); }
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.run(`UPDATE user_profiles SET ${fields.join(', ')} WHERE id = ?`, values);
    saveDb();
    return this.getById(id);
  },

  delete(id: number): boolean {
    const db = getDb();
    if (!db) return false;
    db.run('DELETE FROM user_profiles WHERE id = ?', [id]);
    saveDb();
    return true;
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add server/src/db/index.ts server/src/services/profile.service.ts
git commit -m "feat: add user_profiles, coaching_logs, interview_feedbacks tables and profile service"
```

### Task 3: Create coaching service

**Files:**
- Create: `server/src/services/coaching.service.ts`

- [ ] **Step 1: Write coaching service**

```typescript
import { getDb, saveDb } from '../db/index.js';

interface CoachingLog {
  id: number;
  interview_id: number;
  user_id: number;
  coaching_type: 'guide' | 'correct' | 'info_request';
  content: string;
  agent_response: 'pending' | 'accepted' | 'rejected' | 'question';
  agent_feedback: string | null;
  created_at: string;
}

function rowToLog(row: any[]): CoachingLog {
  return {
    id: row[0] as number,
    interview_id: row[1] as number,
    user_id: row[2] as number,
    coaching_type: row[3] as 'guide' | 'correct' | 'info_request',
    content: row[4] as string,
    agent_response: row[5] as 'pending' | 'accepted' | 'rejected' | 'question',
    agent_feedback: row[6] as string | null,
    created_at: row[7] as string,
  };
}

export const coachingService = {
  create(interviewId: number, userId: number, coachingType: string, content: string): CoachingLog {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
      INSERT INTO coaching_logs (interview_id, user_id, coaching_type, content, agent_response)
      VALUES (?, ?, ?, ?, 'pending')
    `);
    stmt.run([interviewId, userId, coachingType, content]);
    saveDb();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;
    return this.getById(id)!;
  },

  getById(id: number): CoachingLog | null {
    const db = getDb();
    if (!db) return null;
    const result = db.exec('SELECT * FROM coaching_logs WHERE id = ?', [id]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    return rowToLog(result[0].values[0]);
  },

  getByInterviewId(interviewId: number): CoachingLog[] {
    const db = getDb();
    if (!db) return [];
    const result = db.exec('SELECT * FROM coaching_logs WHERE interview_id = ? ORDER BY created_at ASC', [interviewId]);
    if (result.length === 0) return [];
    return result[0].values.map(rowToLog);
  },

  updateResponse(id: number, agentResponse: string, agentFeedback: string): CoachingLog | null {
    const db = getDb();
    if (!db) return null;
    db.run('UPDATE coaching_logs SET agent_response = ?, agent_feedback = ? WHERE id = ?', [agentResponse, agentFeedback, id]);
    saveDb();
    return this.getById(id);
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add server/src/services/coaching.service.ts
git commit -m "feat: add coaching service for managing coach guidance logs"
```

### Task 4: Create profile routes

**Files:**
- Create: `server/src/routes/profile.ts`
- Modify: `server/src/index.ts` (register profile router)

- [ ] **Step 1: Write profile routes**

```typescript
import { Router } from 'express';
import { profileService } from '../services/profile.service.js';

const router = Router();
const DEFAULT_USER_ID = 1;

// GET /profiles - Get current user's profile
router.get('/', (req, res) => {
  try {
    const profile = profileService.getByUserId(DEFAULT_USER_ID);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: '获取画像失败' });
  }
});

// GET /profiles/:id - Get profile by ID
router.get('/:id', (req, res) => {
  try {
    const profile = profileService.getById(parseInt(req.params.id));
    if (!profile) {
      return res.status(404).json({ error: '画像不存在' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: '获取画像失败' });
  }
});

// POST /profiles - Create new profile
router.post('/', (req, res) => {
  try {
    const { name, target_position, education, experience, skills, projects, personality, preferred_style } = req.body;
    const profile = profileService.create(DEFAULT_USER_ID, {
      name,
      target_position,
      education,
      experience,
      skills,
      projects,
      personality,
      preferred_style,
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: '创建画像失败' });
  }
});

// PUT /profiles/:id - Update profile
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, target_position, education, experience, skills, projects, personality, preferred_style } = req.body;
    const profile = profileService.update(id, {
      name,
      target_position,
      education,
      experience,
      skills,
      projects,
      personality,
      preferred_style,
    });
    if (!profile) {
      return res.status(404).json({ error: '画像不存在' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: '更新画像失败' });
  }
});

// DELETE /profiles/:id - Delete profile
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = profileService.delete(id);
    if (!success) {
      return res.status(404).json({ error: '画像不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除画像失败' });
  }
});

export default router;
```

- [ ] **Step 2: Register profile router in index.ts**

Find where other routers are registered in `server/src/index.ts` and add:

```typescript
import profileRouter from './routes/profile.js';
// ...
app.use('/api/profiles', profileRouter);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/profile.ts server/src/index.ts
git commit -m "feat: add profile REST API routes"
```

### Task 5: Create feedback routes

**Files:**
- Create: `server/src/services/feedback.service.ts`
- Modify: `server/src/routes/interview.ts` (add feedback endpoints)

- [ ] **Step 1: Write feedback service**

```typescript
import { getDb, saveDb } from '../db/index.js';

interface InterviewFeedback {
  id: number;
  interview_id: number;
  round: number;
  type: 'realtime' | 'summary';
  content: string;
  created_at: string;
}

function rowToFeedback(row: any[]): InterviewFeedback {
  return {
    id: row[0] as number,
    interview_id: row[1] as number,
    round: row[2] as number,
    type: row[3] as 'realtime' | 'summary',
    content: row[4] as string,
    created_at: row[5] as string,
  };
}

export const feedbackService = {
  create(interviewId: number, round: number, type: string, content: string): InterviewFeedback {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
      INSERT INTO interview_feedbacks (interview_id, round, type, content)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run([interviewId, round, type, content]);
    saveDb();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;
    return this.getById(id)!;
  },

  getById(id: number): InterviewFeedback | null {
    const db = getDb();
    if (!db) return null;
    const result = db.exec('SELECT * FROM interview_feedbacks WHERE id = ?', [id]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    return rowToFeedback(result[0].values[0]);
  },

  getByInterviewId(interviewId: number): InterviewFeedback[] {
    const db = getDb();
    if (!db) return [];
    const result = db.exec('SELECT * FROM interview_feedbacks WHERE interview_id = ? ORDER BY round ASC, created_at ASC', [interviewId]);
    if (result.length === 0) return [];
    return result[0].values.map(rowToFeedback);
  },
};
```

- [ ] **Step 2: Add feedback endpoints to interview routes**

In `server/src/routes/interview.ts`, after the existing routes, add:

```typescript
// Get feedback for an interview
router.get('/:id/feedback', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { feedbackService } = await import('../services/feedback.service.js');
    const feedbacks = feedbackService.getByInterviewId(id);
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: '获取反馈失败' });
  }
});

// Add coaching log
router.post('/:id/coaching', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { coaching_type, content } = req.body;
    const { coachingService } = await import('../services/coaching.service.js');
    const log = coachingService.create(id, DEFAULT_USER_ID, coaching_type, content);
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: '记录指导失败' });
  }
});

// Get coaching logs for an interview
router.get('/:id/coaching', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { coachingService } = await import('../services/coaching.service.js');
    const logs = coachingService.getByInterviewId(id);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: '获取指导记录失败' });
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add server/src/services/feedback.service.ts server/src/routes/interview.ts
git commit -m "feat: add feedback and coaching log endpoints"
```

---

## Chunk 2: Phase 2 - Agent Enhancement

### Task 6: Add profile context to agent prompts

**Files:**
- Modify: `server/src/services/interview.service.ts`

- [ ] **Step 1: Modify generateCandidateResponseMessage to include profile context**

In the `generateCandidateResponseMessage` method, after getting `candidateAgent`, add:

```typescript
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
```

Then in the system prompt, add `profileContext` after the personal background section:

```typescript
    const systemPrompt = `你是${name}，面试${interview.position}岗位。
${profileContext}
【个人背景】
- 学历：${education}
...
```

- [ ] **Step 2: Commit**

```bash
git add server/src/services/interview.service.ts
git commit -m "feat: inject user profile context into candidate agent prompts"
```

### Task 7: Implement coaching judgment logic

**Files:**
- Modify: `server/src/services/interview.service.ts`

- [ ] **Step 1: Add coaching judgment method**

After the existing methods in `interview.service.ts`, add:

```typescript
  async evaluateCoachingGuidance(coachingContent: string, conversationHistory: string, candidateProfile: string): Promise<{ accepted: boolean; reason: string; appliedContent?: string }> {
    const prompt = `你是一个求职者的教练，需要判断用户的指导是否合理。

【用户指导】
"${coachingContent}"

【求职者背景】
${candidateProfile}

【对话历史】
${conversationHistory}

判断标准：
1. 指导是否针对求职者的实际情况？
2. 指导是否有利于求职者展示优势？
3. 指导是否过于负面或不切实际？

请判断是否采纳这个指导：
- 如果采纳：说明如何应用，并给出"采纳"
- 如果拒绝：说明原因，并给出"拒绝"

请用JSON格式返回：{"decision": "采纳"或"拒绝", "reason": "原因", "appliedContent": "如果采纳，具体如何应用（候选人的回复内容）"}`;

    try {
      const response = await axios.post(
        MINIMAX_API_URL,
        {
          model: 'MiniMax-M2.2',
          max_tokens: 512,
          messages: [
            { role: 'system', content: '你是一个求职者的教练，评估用户的指导是否合理。' },
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
        const textItem = content.find((c: any) => c.type === 'text');
        text = textItem?.text || text;
      }
      const result = JSON.parse(text);
      return {
        accepted: result.decision === '采纳',
        reason: result.reason,
        appliedContent: result.appliedContent,
      };
    } catch (error) {
      console.error('Coaching evaluation error:', error);
      return { accepted: false, reason: '服务暂时不可用' };
    }
  },
```

- [ ] **Step 2: Add method to process coach input during interview**

Add a method to process coaching during the interview:

```typescript
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

    return this.evaluateCoachingGuidance(coachingContent, conversationHistory, candidateProfile);
  },
```

- [ ] **Step 3: Add coaching endpoint to interview routes**

In `server/src/routes/interview.ts`:

```typescript
// Process coaching guidance
router.post('/:id/coach', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content } = req.body;
    const result = await interviewService.processCoaching(id, content);

    // Record the coaching log
    const coachingType = content.includes('补充') || content.includes('例子') ? 'guide' :
                         content.includes('纠正') || content.includes('不对') ? 'correct' : 'info_request';
    const { coachingService } = await import('../services/coaching.service.js');
    const log = coachingService.create(id, DEFAULT_USER_ID, coachingType, content);
    coachingService.updateResponse(log.id, result.accepted ? 'accepted' : 'rejected', result.reason);

    res.json(result);
  } catch (error) {
    console.error('Coach error:', error);
    res.status(500).json({ error: '处理指导失败' });
  }
});
```

- [ ] **Step 4: Commit**

```bash
git add server/src/services/interview.service.ts server/src/routes/interview.ts
git commit -m "feat: add coaching judgment logic for coach mode"
```

### Task 8: Implement real-time feedback generation

**Files:**
- Modify: `server/src/services/interview.service.ts`

- [ ] **Step 1: Add real-time feedback generation**

Add a method after `generateEvaluation`:

```typescript
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
          model: 'MiniMax-M2.2',
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
      const { feedbackService } = await import('./feedback.service.js');
      feedbackService.create(interviewId, round, 'realtime', feedback);

      return feedback;
    } catch (error) {
      console.error('Feedback generation error:', error);
      return '';
    }
  },
```

- [ ] **Step 2: Call feedback generation after candidate response**

In `generateCandidateResponseMessage`, after the message is saved and emitted, add:

```typescript
      // After candidate response, generate feedback
      const round = Math.floor(messages.length / 2) + 1;
      const feedback = await this.generateRealtimeFeedback(interviewId, round);
      if (feedback) {
        this.emit('feedback', { interviewId, content: feedback, round });
      }
```

- [ ] **Step 3: Emit coaching events**

After processing coaching in `processCoaching`:

```typescript
    if (result.accepted) {
      this.emit('coaching_accepted', { interviewId, original: coachingContent, applied: result.appliedContent });
    } else {
      this.emit('coaching_rejected', { interviewId, original: coachingContent, reason: result.reason });
    }
```

- [ ] **Step 4: Commit**

```bash
git add server/src/services/interview.service.ts
git commit -m "feat: add real-time feedback generation during interview"
```

---

## Chunk 3: Phase 3 - Frontend Interaction

### Task 9: Add profile types and API methods

**Files:**
- Modify: `client/src/types/index.ts`
- Modify: `client/src/services/api.ts`

- [ ] **Step 1: Add new types**

In `client/src/types/index.ts`, add:

```typescript
export interface UserProfile {
  id: number;
  user_id: number;
  name: string;
  target_position: string | null;
  education: string | null;
  experience: string | null;
  skills: string | null;
  projects: string | null;
  personality: string | null;
  preferred_style: 'gentle' | 'strict' | 'coaching';
  created_at: string;
  updated_at: string;
}

export interface CoachingLog {
  id: number;
  interview_id: number;
  user_id: number;
  coaching_type: 'guide' | 'correct' | 'info_request';
  content: string;
  agent_response: 'pending' | 'accepted' | 'rejected' | 'question';
  agent_feedback: string | null;
  created_at: string;
}

export interface InterviewFeedback {
  id: number;
  interview_id: number;
  round: number;
  type: 'realtime' | 'summary';
  content: string;
  created_at: string;
}

export interface EnhancedEvaluation extends Evaluation {
  overall_score?: number;
  technical_depth?: number;
  communication?: number;
  project_experience?: number;
  adaptability?: number;
}
```

- [ ] **Step 2: Add API methods**

In `client/src/services/api.ts`, add:

```typescript
  // Profile APIs
  getProfile: () => request<UserProfile>('/profiles'),
  getProfileById: (id: number) => request<UserProfile>(`/profiles/${id}`),
  createProfile: (data: Partial<UserProfile>) =>
    request<UserProfile>('/profiles', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (id: number, data: Partial<UserProfile>) =>
    request<UserProfile>(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Coaching APIs
  getCoachingLogs: (interviewId: number) =>
    request<CoachingLog[]>(`/interview/${interviewId}/coaching`),
  processCoaching: (interviewId: number, content: string) =>
    request<{ accepted: boolean; reason: string; appliedContent?: string }>(
      `/interview/${interviewId}/coach`,
      { method: 'POST', body: JSON.stringify({ content }) }
    ),

  // Feedback APIs
  getFeedbacks: (interviewId: number) =>
    request<InterviewFeedback[]>(`/interview/${interviewId}/feedback`),
```

- [ ] **Step 3: Commit**

```bash
git add client/src/types/index.ts client/src/services/api.ts
git commit -m "feat: add profile, coaching, and feedback types and API methods"
```

### Task 10: Create FeedbackPanel component

**Files:**
- Create: `client/src/components/FeedbackPanel.tsx`

- [ ] **Step 1: Write FeedbackPanel component**

```typescript
import { useState, useEffect } from 'react';
import type { InterviewFeedback } from '../types';

interface Props {
  interviewId: number;
  feedbacks: InterviewFeedback[];
}

export default function FeedbackPanel({ interviewId, feedbacks }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (feedbacks.length === 0) {
    return (
      <div style={{
        padding: 20,
        color: '#71717a',
        fontSize: 13,
        textAlign: 'center',
      }}>
        暂无实时反馈
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: 14,
        fontWeight: 600,
        color: '#a1a1aa',
        fontFamily: 'Inter, sans-serif',
      }}>
        实时反馈
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {feedbacks.map((feedback, index) => (
          <div
            key={feedback.id}
            style={{
              padding: 14,
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() => setExpanded(expanded === index ? null : index)}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: expanded === index ? 8 : 0,
            }}>
              <span style={{
                fontSize: 12,
                color: '#fbbf24',
                fontWeight: 500,
              }}>
                第{feedback.round}轮反馈
              </span>
              <span style={{ color: '#71717a', fontSize: 12 }}>
                {expanded === index ? '▲' : '▼'}
              </span>
            </div>
            <p style={{
              margin: 0,
              fontSize: 13,
              color: '#fafafa',
              lineHeight: 1.5,
            }}>
              {feedback.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/FeedbackPanel.tsx
git commit -m "feat: add FeedbackPanel component for real-time feedback display"
```

### Task 11: Create CoachInput component

**Files:**
- Create: `client/src/components/CoachInput.tsx`

- [ ] **Step 1: Write CoachInput component**

```typescript
import { useState } from 'react';

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
}

const QUICK_TAGS = [
  { label: '补充例子', value: '请补充一个具体例子' },
  { label: '追问细节', value: '追问一下技术细节' },
  { label: '换个方向', value: '换个方向问吧' },
];

export default function CoachInput({ onSend, disabled }: Props) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !disabled) {
      onSend(content.trim());
      setContent('');
    }
  };

  const handleQuickTag = (value: string) => {
    if (!disabled) {
      onSend(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 10,
        flexWrap: 'wrap',
      }}>
        {QUICK_TAGS.map(tag => (
          <button
            key={tag.label}
            type="button"
            onClick={() => handleQuickTag(tag.value)}
            disabled={disabled}
            style={{
              padding: '6px 12px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: 16,
              color: '#22c55e',
              fontSize: 12,
              fontWeight: 500,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {tag.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="输入指导建议..."
          disabled={disabled}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            color: '#fafafa',
            fontSize: 14,
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
          }}
        />
        <button
          type="submit"
          disabled={!content.trim() || disabled}
          style={{
            padding: '12px 20px',
            background: content.trim() && !disabled
              ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: 12,
            color: content.trim() && !disabled ? 'white' : '#71717a',
            fontSize: 14,
            fontWeight: 600,
            cursor: content.trim() && !disabled ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            fontFamily: 'Space Grotesk, sans-serif',
          }}
        >
          发送
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/CoachInput.tsx
git commit -m "feat: add CoachInput component with quick tags"
```

### Task 12: Create ProfileCreate page

**Files:**
- Create: `client/src/pages/ProfileCreate.tsx`

- [ ] **Step 1: Write ProfileCreate page with three modes**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { UserProfile } from '../types';

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
    preferred_style: 'gentle' as const,
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
```

- [ ] **Step 2: Add route to App.tsx**

In `client/src/App.tsx`, add:

```typescript
import ProfileCreate from './pages/ProfileCreate';
// ...
<Route path="/profile/create" element={<ProfileCreate />} />
```

- [ ] **Step 3: Add link from Home page**

In `client/src/pages/Home.tsx`, add a button linking to profile creation:

```typescript
// In the hero section or navigation, add:
<Link to="/profile/create">
  <button style={{
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    border: 'none',
    borderRadius: 10,
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  }}>
    创建求职画像
  </button>
</Link>
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/ProfileCreate.tsx client/src/App.tsx client/src/pages/Home.tsx
git commit -m "feat: add ProfileCreate page with three creation modes"
```

### Task 13: Update Interview page with coach mode

**Files:**
- Modify: `client/src/pages/Interview.tsx`

- [ ] **Step 1: Add state for coach mode and feedbacks**

Add to the state declarations:
```typescript
  const [feedbacks, setFeedbacks] = useState<InterviewFeedback[]>([]);
  const [coachingLogs, setCoachingLogs] = useState<CoachingLog[]>([]);
  const [isCoachMode, setIsCoachMode] = useState(false);
  const [coachPanelOpen, setCoachPanelOpen] = useState(true);
```

- [ ] **Step 2: Add SSE handlers for new event types**

In the `eventSource.onmessage` handler, add:

```typescript
      } else if (data.type === 'feedback') {
        setFeedbacks(prev => [...prev, { id: Date.now(), interview_id: parseInt(id!), round: data.round, type: 'realtime', content: data.content, created_at: new Date().toISOString() }]);
      } else if (data.type === 'coaching_accepted') {
        setCoachingLogs(prev => [...prev, { id: Date.now(), interview_id: parseInt(id!), user_id: 1, coaching_type: 'guide', content: data.original, agent_response: 'accepted', agent_feedback: data.applied, created_at: new Date().toISOString() }]);
      } else if (data.type === 'coaching_rejected') {
        setCoachingLogs(prev => [...prev, { id: Date.now(), interview_id: parseInt(id!), user_id: 1, coaching_type: 'correct', content: data.original, agent_response: 'rejected', agent_feedback: data.reason, created_at: new Date().toISOString() }]);
      }
```

- [ ] **Step 3: Add coach mode input area**

In the bottom input area (before the buttons), add:

```typescript
            {/* Coach mode indicator */}
            {isAgentChat && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
              }}>
                <button
                  onClick={() => setIsCoachMode(!isCoachMode)}
                  style={{
                    padding: '8px 16px',
                    background: isCoachMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: isCoachMode ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    color: isCoachMode ? '#22c55e' : '#71717a',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {isCoachMode ? '✓ 教练模式' : '开启教练模式'}
                </button>
                {isCoachMode && (
                  <button
                    onClick={() => setCoachPanelOpen(!coachPanelOpen)}
                    style={{
                      padding: '8px 16px',
                      background: coachPanelOpen ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: coachPanelOpen ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                      color: coachPanelOpen ? '#fbbf24' : '#71717a',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {coachPanelOpen ? '隐藏反馈' : '显示反馈'}
                  </button>
                )}
              </div>
            )}

            {/* Coach input */}
            {isCoachMode && (
              <CoachInput onSend={handleCoachSend} disabled={!!isAgentChat} />
            )}
```

- [ ] **Step 4: Add right panel for feedbacks**

After the left chat area div (before the evaluation panel), add:

```typescript
        {/* Right feedback panel */}
        {coachPanelOpen && isCoachMode && feedbacks.length > 0 && (
          <div style={{
            width: 320,
            background: 'linear-gradient(180deg, #0c0c0f 0%, #09090b 100%)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
            overflow: 'auto',
          }}>
            <FeedbackPanel interviewId={parseInt(id!)} feedbacks={feedbacks} />

            {/* Coaching logs */}
            {coachingLogs.length > 0 && (
              <div style={{ padding: 16, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#a1a1aa',
                }}>
                  指导记录
                </h3>
                {coachingLogs.map((log) => (
                  <div key={log.id} style={{
                    padding: 12,
                    background: log.agent_response === 'accepted' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${log.agent_response === 'accepted' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    borderRadius: 10,
                    marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>
                      你：{log.content}
                    </div>
                    <div style={{ fontSize: 12, color: log.agent_response === 'accepted' ? '#22c55e' : '#ef4444' }}>
                      {log.agent_response === 'accepted' ? '✓ 采纳' : '✗ 拒绝'}：{log.agent_feedback}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
```

- [ ] **Step 5: Add handleCoachSend function**

Add the handler:

```typescript
  const handleCoachSend = async (content: string) => {
    try {
      const result = await api.processCoaching(parseInt(id!), content);
      if (result.accepted) {
        setCoachingLogs(prev => [...prev, {
          id: Date.now(),
          interview_id: parseInt(id!),
          user_id: 1,
          coaching_type: 'guide',
          content,
          agent_response: 'accepted',
          agent_feedback: result.appliedContent || '',
          created_at: new Date().toISOString(),
        }]);
      } else {
        setCoachingLogs(prev => [...prev, {
          id: Date.now(),
          interview_id: parseInt(id!),
          user_id: 1,
          coaching_type: 'correct',
          content,
          agent_response: 'rejected',
          agent_feedback: result.reason,
          created_at: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      console.error('Coach send error:', err);
    }
  };
```

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Interview.tsx
git commit -m "feat: integrate coach mode UI into Interview page"
```

---

## Chunk 4: Phase 4 - Experience Optimization

### Task 14: Add loading and error states

**Files:**
- Modify: `client/src/pages/ProfileCreate.tsx`

- [ ] **Step 1: Add loading skeleton to ProfileCreate**

Add a loading state component:

```typescript
function LoadingSkeleton() {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: 16,
      padding: 24,
    }}>
      <div style={{
        height: 20,
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 4,
        marginBottom: 16,
        width: '60%',
      }} />
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          height: 44,
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 8,
          marginBottom: 12,
        }} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Use skeleton while loading**

```typescript
const [pageLoading, setPageLoading] = useState(true);
useEffect(() => {
  setTimeout(() => setPageLoading(false), 500);
}, []);
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/ProfileCreate.tsx
git commit -m "feat: add loading skeleton to ProfileCreate page"
```

### Task 15: Add error boundary and retry logic

**Files:**
- Create: `client/src/components/ErrorBoundary.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Write ErrorBoundary component**

```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: 40,
          textAlign: 'center',
          color: '#71717a',
        }}>
          <p style={{ marginBottom: 16 }}>页面出现了一些问题</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 8,
              color: '#fafafa',
              cursor: 'pointer',
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Wrap App with ErrorBoundary**

In `client/src/App.tsx`:

```typescript
import ErrorBoundary from './components/ErrorBoundary';
// Wrap Router:
<ErrorBoundary>
  <Router>...</Router>
</ErrorBoundary>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ErrorBoundary.tsx client/src/App.tsx
git commit -m "feat: add error boundary component for graceful error handling"
```

---

## Verification

1. **Start server**: `cd server && npx tsx src/index.ts`
2. **Start client**: `cd client && npm run dev`
3. **Test profile creation**: Navigate to `/profile/create`, fill form, submit
4. **Test coach mode**: Create interview with agents, enable coach mode, send guidance
5. **Verify SSE events**: Open browser DevTools, check network for `/api/interview/:id/events`
6. **Test feedback display**: After candidate responds, verify feedback appears in right panel

---

## Key Design Decisions

- **SQLite via sql.js**: File-based SQLite for simplicity. Could migrate to PostgreSQL later.
- **Profile context injection**: Profile data is injected into candidate agent prompts, not stored in agent table.
- **Coaching judgment**: AI evaluates whether guidance makes sense given the conversation context.
- **SSE event types**: Extended existing SSE events to include `feedback`, `coaching_accepted`, `coaching_rejected`.
- **Coach input always visible**: Input box stays open during agent chat for immediate guidance.
